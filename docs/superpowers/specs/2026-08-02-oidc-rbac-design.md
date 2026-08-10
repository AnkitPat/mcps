# OIDC Server and RBAC Integration Design

## 1. Goal
Implement a minimal self-hosted OIDC Authorization Server to authenticate ChatGPT before connecting to the Kubernetes MCP server, and implement RBAC for MCP tools.

## 2. Architecture
- **OAuth Server:** Express + `oidc-provider`. Reads users from `config/users.json`.
- **Kubernetes MCP:** Express/MCP Framework + `jose` for JWT validation. Implements RBAC via middleware.

## 3. OAuth Server Design
- **Configuration:** Loads `users.json` at startup.
- **Tokens:** Include `role` claim in access tokens.
- **Endpoints:**
    - `/.well-known/openid-configuration`
    - `/authorize`
    - `/token`
    - `/jwks.json`
    - `/login` (UI)

## 4. Kubernetes MCP Server Design
- **JWT Validation:** Use `jose.jwtVerify` with `jose.createRemoteJWKSet(new URL(JWKS_URI))` for secure, rotating key support.
- **RBAC Middleware:**
    - `requireRole(allowedRoles: string[])`: Middleware checks `token.payload.role`. Returns 403 if unauthorized.
    - Application: Wrap MCP tool handlers in `requireRole`.

## 5. Security
- Use `helmet`.
- `oidc-provider` handles PKCE, OIDC flows, and security best practices.
- `jose` handles secure JWT parsing and signature verification.

## 6. Testing
- Unit tests for token issuance (OAuth Server).
- Unit tests for JWT validation and RBAC enforcement (MCP Server).
