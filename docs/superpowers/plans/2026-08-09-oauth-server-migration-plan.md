# OAuth Server Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `oauth-server` from a local SQLite-backed setup to a serverless architecture deployed on Vercel, utilizing an external managed PostgreSQL database.

**Architecture:** Node.js Express server running as a Vercel Serverless Function, with persistent data stored in a managed PostgreSQL service (e.g., Supabase or Neon).

**Tech Stack:** Node.js, Express, `oidc-provider`, `pg` (PostgreSQL client).

## Global Constraints

- Use Node.js/Express with Vercel serverless functions.
- PostgreSQL as the persistent database (managed service).
- `oidc-provider` configuration to be stateless.
- Connection strings and secrets managed via Vercel Environment Variables.

---

### Task 1: Setup PostgreSQL Dependencies and Connection

**Files:**
- Modify: `oauth-server/package.json`
- Create: `oauth-server/src/db.ts`

**Interfaces:**
- Produces: `src/db.ts` exports a `pool` object using `pg` for connection management.

- [ ] **Step 1: Add `pg` dependency**

Run: `npm install pg`
Run: `npm install --save-dev @types/pg`

- [ ] **Step 2: Create database connection pool (`src/db.ts`)**

```typescript
import pkg from 'pg';
const { Pool } = pkg;

// Use DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL for managed databases
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
```

- [ ] **Step 3: Commit**

```bash
git add package.json src/db.ts
git commit -m "feat: setup postgres db connection"
```

### Task 2: Create PostgreSQL Adapter

**Files:**
- Create: `oauth-server/src/postgresAdapter.ts`
- Test: `oauth-server/src/postgresAdapter.test.ts` (if needed to verify SQL syntax)

**Interfaces:**
- Consumes: `src/db.ts` (pool)
- Produces: `PostgresAdapter` class conforming to `oidc-provider` adapter interface.

- [ ] **Step 1: Implement `PostgresAdapter` in `src/postgresAdapter.ts`**

(Adapted from the existing SQLite logic, but using `pool.query` for Postgres).

- [ ] **Step 2: Commit**

```bash
git add src/postgresAdapter.ts
git commit -m "feat: implement postgres adapter"
```

### Task 3: Configure Provider to use PostgresAdapter

**Files:**
- Modify: `oauth-server/src/provider.ts`

**Interfaces:**
- Consumes: `PostgresAdapter` from `src/postgresAdapter.ts`

- [ ] **Step 1: Replace `SqliteAdapter` with `PostgresAdapter`**

Update `src/provider.ts` to import `PostgresAdapter` and use it in `initProvider`.

- [ ] **Step 2: Commit**

```bash
git add src/provider.ts
git commit -m "refactor: use postgres adapter in provider"
```

### Task 4: Make Server Stateless and Configurable

**Files:**
- Modify: `oauth-server/src/server.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` env variable

- [ ] **Step 1: Ensure `server.ts` is stateless**

Verify no file-system dependencies (like `oidc-data.db`).

- [ ] **Step 2: Commit**

```bash
git add src/server.ts
git commit -m "refactor: make server stateless"
```

### Task 5: Final Verification and Documentation

**Files:**
- Modify: `oauth-server/README.md`
- Create: `oauth-server/.env.example`

- [ ] **Step 1: Update documentation and example config**

Document required `DATABASE_URL` environment variable.

- [ ] **Step 2: Final Run (Local)**

Run local Postgres (e.g., via Docker) and test the migration.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: update hosting instructions"
```
