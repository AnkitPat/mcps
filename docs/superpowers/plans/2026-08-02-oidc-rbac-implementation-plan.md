# OIDC Server and RBAC Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal OIDC Authorization Server to protect a Kubernetes MCP server using JWTs and role-based access control.

**Architecture:** A separate Express+`oidc-provider` service handles authentication, issuing JWTs with custom role claims. The Kubernetes MCP service is updated to validate these JWTs using `jose` and enforce RBAC via middleware.

**Tech Stack:** Node.js, TypeScript, Express, oidc-provider, jose, bcrypt, helmet, express-session.

## Global Constraints

- No database (use `config/users.json`).
- No external identity providers (Auth0/Keycloak/etc).
- RS256 for JWT signing.
- PKCE is mandatory.
- Strict TypeScript.

---

### Task 1: Setup OAuth Server & User Management

**Files:**
- Create: `oauth-server/config/users.json`
- Modify: `oauth-server/src/users.ts`

**Interfaces:**
- Produces: `findUserByEmail(email: string)`, `verifyPassword(user: User, password: string)`

- [ ] **Step 1: Create `users.json`**
```json
[
  {
    "email": "ankit@company.com",
    "password": "Password123!",
    "role": "admin"
  },
  {
    "email": "john@company.com",
    "password": "Password123!",
    "role": "developer"
  }
]
```
- [ ] **Step 2: Update `users.ts` to load from JSON file**

- [ ] **Step 3: Commit**

### Task 2: Implement OIDC Provider

**Files:**
- Modify: `oauth-server/src/provider.ts`
- Modify: `oauth-server/src/server.ts`

**Interfaces:**
- Produces: OIDC provider instance initialized with custom claims for `role`.

- [ ] **Step 1: Configure `oidc-provider` in `provider.ts`**
  - Implement discovery, jwks, authorize, token endpoints.
  - Add `role` claim to ID token and Access token.
  - Setup RSA key generation (or loading from `keys/`).

- [ ] **Step 2: Wire into `server.ts`**

- [ ] **Step 3: Commit**

### Task 3: Implement Login UI

**Files:**
- Create: `oauth-server/src/views/login.html`
- Modify: `oauth-server/src/server.ts`

- [ ] **Step 1: Create `login.html`**

- [ ] **Step 2: Implement `/interaction` routes in `server.ts`**
  - Handle GET /interaction/:uid
  - Handle POST /interaction/:uid (login form submit)

- [ ] **Step 3: Commit**

### Task 4: Kubernetes MCP Refactor (JWT + RBAC)

**Files:**
- Modify: `kubernates-mcp/src/auth.ts`
- Create: `kubernates-mcp/src/middleware/rbac.ts`

**Interfaces:**
- Consumes: OIDC Issuer/JWKS from environment.
- Produces: `requireRole(roles: string[])` middleware.

- [ ] **Step 1: Replace `node:crypto` with `jose` in `auth.ts`**
  - Use `createRemoteJWKSet` to fetch keys from `OIDC_ISSUER/.well-known/jwks.json`.
  - Use `jwtVerify` to validate token.

- [ ] **Step 2: Implement `rbac.ts` middleware**
  - Extracts `role` from JWT payload.
  - Compares with `allowedRoles`.

- [ ] **Step 3: Commit**

### Task 5: Deployment & Verification

**Files:**
- Create: `oauth-server/Dockerfile`
- Create: `oauth-server/docker-compose.yml`
- Create: `oauth-server/README.md`
- Test: `oauth-server/test/auth.test.ts`
- Test: `kubernates-mcp/test/rbac.test.ts`

- [ ] **Step 1: Create Docker configs**

- [ ] **Step 2: Write tests**
  - Test JWT token issuance with `role` claim.
  - Test JWT validation + RBAC denial/allow.

- [ ] **Step 3: Final Commit**
