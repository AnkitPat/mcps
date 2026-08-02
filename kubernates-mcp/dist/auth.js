import { createPublicKey, createVerify, timingSafeEqual } from "node:crypto";
let oidcMetadata;
let jwks;
function requiredEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`${name} is required when AUTH_MODE=oidc.`);
    return value;
}
export function getAuthConfig() {
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
function base64UrlJson(value) {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}
function audienceMatches(audience, expected) {
    return Array.isArray(audience) ? audience.includes(expected) : audience === expected;
}
function hasScope(claims, requiredScope) {
    const scope = claims.scope;
    const scopes = typeof scope === "string"
        ? scope.split(" ")
        : Array.isArray(claims.scp)
            ? claims.scp
            : [];
    return scopes.includes(requiredScope);
}
async function getOidcMetadata(issuer) {
    if (oidcMetadata?.issuer === issuer)
        return oidcMetadata;
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    if (!response.ok)
        throw new Error("Unable to load the OIDC discovery document.");
    const metadata = await response.json();
    if (metadata.issuer !== issuer || !metadata.jwks_uri) {
        throw new Error("OIDC discovery document is invalid.");
    }
    oidcMetadata = metadata;
    return metadata;
}
async function getJwks(jwksUri, refresh = false) {
    if (jwks && !refresh)
        return jwks;
    const response = await fetch(jwksUri);
    if (!response.ok)
        throw new Error("Unable to load the OIDC signing keys.");
    const keys = await response.json();
    if (!Array.isArray(keys.keys))
        throw new Error("OIDC signing keys are invalid.");
    jwks = keys;
    return keys;
}
async function verifyOidcToken(token, config) {
    const [encodedHeader, encodedPayload, encodedSignature, ...extra] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature || extra.length > 0) {
        throw new Error("Bearer token is not a JWT.");
    }
    const header = base64UrlJson(encodedHeader);
    const claims = base64UrlJson(encodedPayload);
    if (header.alg !== "RS256" || typeof header.kid !== "string") {
        throw new Error("Only RS256 OIDC access tokens with a key ID are supported.");
    }
    const metadata = await getOidcMetadata(config.issuer);
    let keys = await getJwks(metadata.jwks_uri);
    let key = keys.keys.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA");
    if (!key) {
        keys = await getJwks(metadata.jwks_uri, true);
        key = keys.keys.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA");
    }
    if (!key)
        throw new Error("No OIDC signing key matches the access token.");
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    if (!verifier.verify(createPublicKey({ key, format: "jwk" }), Buffer.from(encodedSignature, "base64url"))) {
        throw new Error("Bearer token signature is invalid.");
    }
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== config.issuer || !audienceMatches(claims.aud, config.audience) ||
        typeof claims.exp !== "number" || claims.exp <= now ||
        (typeof claims.nbf === "number" && claims.nbf > now) ||
        !hasScope(claims, config.requiredScope)) {
        throw new Error("Bearer token claims are not authorized for this MCP server.");
    }
}
function challenge(response, config) {
    const resourceMetadata = config.publicUrl
        ? ` resource_metadata="${config.publicUrl}/.well-known/oauth-protected-resource",`
        : "";
    response
        .set("WWW-Authenticate", `Bearer${resourceMetadata} scope="${config.requiredScope}"`)
        .status(401)
        .json({ error: "Unauthorized" });
}
export function createAuthenticationMiddleware(config) {
    return async (request, response, next) => {
        const authorization = request.header("authorization");
        if (!authorization?.startsWith("Bearer ")) {
            challenge(response, config);
            return;
        }
        try {
            const token = authorization.slice("Bearer ".length);
            if (config.mode === "token") {
                const expected = Buffer.from(config.staticToken);
                const received = Buffer.from(token);
                if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
                    throw new Error("Invalid bearer token.");
                }
            }
            else {
                await verifyOidcToken(token, config);
            }
            next();
        }
        catch {
            challenge(response, config);
        }
    };
}
export function protectedResourceMetadata(config) {
    if (!config.publicUrl)
        return undefined;
    return {
        resource: `${config.publicUrl}/mcp`,
        authorization_servers: config.issuer ? [config.issuer] : undefined,
        scopes_supported: [config.requiredScope],
    };
}
