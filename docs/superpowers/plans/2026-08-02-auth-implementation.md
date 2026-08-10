# Authentication Server and Client Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted OIDC Authorization Server to authenticate ChatGPT before connecting to a Kubernetes MCP server, using JWTs with RS256 signing and RBAC for tool authorization.

**Architecture:**
- `oauth-server`: Express + `oidc-provider` using `config/users.json` for identity, `jose` for key management, and custom interactions for login.
- `kubernates-mcp`: Express middleware using `jose` to validate JWTs (signature, exp, aud, iss), extract `role` claims, and perform RBAC checks on tool calls.

**Tech Stack:**
- Node.js 22+, TypeScript, Express, `oidc-provider`, `jose`, `bcrypt`, `helmet`, `dotenv`.

## Global Constraints

- OIDC Authorization Code Flow with PKCE required.
- JWTs signed with RS256.
- RBAC roles: `admin`, `developer`, `readonly`.
- `kubernates-mcp` auth must be modular (middleware-based).
- No database; use `oauth-server/src/config/users.json`.

---

## Task 1: OIDC Server - Configuration and JWT Custom Claims

**Files:**
- Modify: `oauth-server/src/provider.ts`

**Interfaces:**
- Produces: OIDC provider configured to include `role` and `email` claims in JWTs.

- [ ] **Step 1: Update `provider.ts` configuration to support claims**
Ensure the `oidc-provider` configuration maps user information to custom claims in the ID Token and Access Token.

```typescript
// Add to provider configuration
claims: {
  openid: ['sub', 'email', 'name', 'role'],
},
// Add adapter or hook to inject claims
async function getAccount(ctx, sub, token) {
  const user = findUserByEmail(sub);
  return {
    accountId: sub,
    claims: () => ({ sub, email: user.email, name: user.name, role: user.role }),
  };
}
```

- [ ] **Step 2: Commit**
```bash
git add oauth-server/src/provider.ts
git commit -m "feat(oauth-server): add role and email claims to JWT"
```

## Task 2: Kubernates-MCP - Replace `node:crypto` with `jose`

**Files:**
- Modify: `kubernates-mcp/src/auth.ts`

**Interfaces:**
- Consumes: JWT from Authorization header.
- Produces: JWT validation function using `jose` instead of manual `node:crypto`.

- [ ] **Step 1: Install `jose`**
```bash
npm install jose
```

- [ ] **Step 2: Rewrite `verifyOidcToken` in `kubernates-mcp/src/auth.ts`**
```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Replace manual verification with:
const JWKS = createRemoteJWKSet(new URL(`${config.issuer}/jwks.json`));
const { payload } = await jwtVerify(token, JWKS, {
  issuer: config.issuer,
  audience: config.audience,
});
// Validate roles here if needed
```

- [ ] **Step 3: Commit**
```bash
git add kubernates-mcp/src/auth.ts kubernates-mcp/package.json
git commit -m "feat(mcp): migrate JWT validation to jose"
```

## Task 3: Kubernates-MCP - Implement RBAC Middleware

**Files:**
- Create: `kubernates-mcp/src/middleware/rbac.ts`
- Modify: `kubernates-mcp/src/index.ts`

**Interfaces:**
- Consumes: User roles from validated JWT payload.
- Produces: `requireRole` middleware.

- [ ] **Step 1: Create `requireRole` middleware**

```typescript
import type { Request, Response, NextFunction } from "express";

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (userRole && allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
  };
};
```

- [ ] **Step 2: Apply middleware to tools in `index.ts`**

- [ ] **Step 3: Commit**
```bash
git add kubernates-mcp/src/middleware/rbac.ts kubernates-mcp/src/index.ts
git commit -m "feat(mcp): implement RBAC middleware"
```

## Task 4: Unit Testing Authentication and Authorization

**Files:**
- Create: `oauth-server/tests/auth.test.ts`
- Create: `kubernates-mcp/tests/rbac.test.ts`

- [ ] **Step 1: Write test for OIDC token issuance**
- [ ] **Step 2: Write test for MCP token validation and RBAC rejection/acceptance**
- [ ] **Step 3: Commit**
```bash
git add oauth-server/tests/auth.test.ts kubernates-mcp/tests/rbac.test.ts
git commit -m "test: add auth and RBAC unit tests"
```
