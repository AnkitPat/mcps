# OAuth Server Hosting Design

## Overview
This design outlines the migration of the `oauth-server` from a local SQLite-backed setup to a serverless architecture deployed on Vercel, utilizing an external managed database (PostgreSQL) for persistence.

## Architecture
- **Application:** Node.js Express server running as a Vercel Serverless Function.
- **Database:** Managed PostgreSQL service (e.g., Supabase or Neon) providing a persistent data layer.
- **Storage Driver:** Transition from `better-sqlite3` to a PostgreSQL-compatible driver (`pg` or ORM like Prisma/Kysely).
- **Configuration:** Managed via Vercel Environment Variables.

## Components
1. **`oauth-server` (Vercel):** The core OIDC provider logic adapted to be stateless.
2. **PostgreSQL (External):** Persistent store for OIDC clients, users, and tokens.

## Data Flow
1. User/Client requests an OAuth flow from the Vercel-hosted server.
2. Server queries/updates data in the external PostgreSQL database using connection pooling.
3. Server returns OIDC responses to the user/client.

## Error Handling
- **Database Connection:** Use robust connection pooling to handle serverless function lifecycle.
- **Persistence:** Ensure all OIDC `oidc-provider` adapters for Grant, Session, etc., are configured to use the PostgreSQL database.

## Testing Strategy
- **Unit Tests:** Mock the database adapter to test core OIDC logic.
- **Integration Tests:** Use a staging database (on the chosen provider) to verify end-to-end OAuth flows.

## Refactoring Plan
- Replace `better-sqlite3` usage in `oauth-server/src/adapter.ts`.
- Update `oauth-server` configuration to use connection strings from environment variables.
- Adapt `Dockerfile` (if needed for local dev) to run against the remote DB or a local Dockerized Postgres.
