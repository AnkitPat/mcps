import * as jose from 'jose';
import type { NextFunction, Request, Response } from "express";

interface AuthConfig {
  mode: "oidc" | "token";
  issuer?: string;
  audience?: string;
  requiredScope: string;
  staticToken?: string;
  publicUrl?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when AUTH_MODE=oidc.`);
  return value;
}

export function getAuthConfig(): AuthConfig {
  const mode = process.env.AUTH_MODE ?? "oidc";
  const requiredScope = process.env.OIDC_REQUIRED_SCOPE ?? "kubernetes.read";
  const publicUrl = process.env.MCP_PUBLIC_URL?.replace(/\/$/, "");

  if (mode === "token") {
    return {
      mode,
      requiredScope,
      staticToken: requiredEnv("MCP_AUTH_TOKEN"),
      publicUrl,
    };
  }

  if (mode !== "oidc") {
    throw new Error("AUTH_MODE must be either 'oidc' or 'token'.");
  }

  return {
    mode,
    issuer: requiredEnv("OIDC_ISSUER").replace(/\/$/, ""),
    audience: requiredEnv("OIDC_AUDIENCE"),
    requiredScope,
    publicUrl: requiredEnv("MCP_PUBLIC_URL").replace(/\/$/, ""),
  };
}

// Global JWKS cache
let jwksSet: ReturnType<typeof jose.createRemoteJWKSet> | undefined;

async function getJwksSet(issuer: string): Promise<ReturnType<typeof jose.createRemoteJWKSet>> {
  if (jwksSet) return jwksSet;

  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!response.ok) throw new Error("Unable to load the OIDC discovery document.");
  const metadata = await response.json() as { jwks_uri: string };
  
  jwksSet = jose.createRemoteJWKSet(new URL(metadata.jwks_uri));
  return jwksSet;
}

async function verifyOidcToken(token: string, config: AuthConfig): Promise<any> {
  const jwksSet = await getJwksSet(config.issuer!);
  
  const { payload } = await jose.jwtVerify(token, jwksSet, {
    issuer: config.issuer,
    audience: config.audience,
  });

  // Verify scope or other claims
  const scope = payload.scope as string;
  const scopes = scope ? scope.split(' ') : [];
  if (!scopes.includes(config.requiredScope)) {
    throw new Error("Bearer token claims are not authorized for this MCP server.");
  }

  return payload;
}

function challenge(response: Response, config: AuthConfig): void {
  const resourceMetadata = config.publicUrl
    ? ` resource_metadata="${config.publicUrl}/.well-known/oauth-protected-resource",`
    : "";
  response
    .set("WWW-Authenticate", `Bearer${resourceMetadata} scope="${config.requiredScope}"`)
    .status(401)
    .json({ error: "Unauthorized" });
}

export function createAuthenticationMiddleware(config: AuthConfig) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      challenge(response, config);
      return;
    }

    try {
      const token = authorization.slice("Bearer ".length);
      if (config.mode === "token") {
        // Simple token check
        if (token !== config.staticToken) {
          throw new Error("Invalid bearer token.");
        }
      } else {
        const payload = await verifyOidcToken(token, config);
        // Attach user info to request
        (request as any).user = payload;
      }
      next();
    } catch (e) {
      console.error(e);
      challenge(response, config);
    }
  };
}

export function protectedResourceMetadata(config: AuthConfig) {
  if (!config.publicUrl) return undefined;
  return {
    resource: `${config.publicUrl}/mcp`,
    authorization_servers: config.issuer ? [config.issuer] : undefined,
    scopes_supported: [config.requiredScope],
  };
}
