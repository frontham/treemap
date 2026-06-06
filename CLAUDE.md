# TreeMap — notes for Claude

Tree-inventory mapping app. **Next.js (App Router) + tRPC v11 + Drizzle + Postgres (Neon, PostGIS).**
Multi-tenant hierarchy: **organization → projects → trees** (also overlays, custom fields, imports).

## Tenancy & auth
- The active **org + project** are pinned to cookies by `src/middleware.ts` (from the `/orgs/[slug]/projects/[projectSlug]/…` URL) and resolved in `src/server/auth/resolveContext.ts`.
- Enforced by Postgres **RLS** (org = hard fence in `USING`; project pinned in `WITH CHECK`). Tenant context is set per-transaction via `withOrgContext`/`withProjectContext` (`src/server/db/tenantContext.ts`).
- Auth = email+password (scrypt) + httpOnly session cookie. Roles `owner/admin/editor/viewer` as an **org role with per-project overrides**. tRPC layers: `publicProcedure → authedProcedure → orgProcedure → projectProcedure`, gated by `requireRole`/`requireOrgRole`.

## Migrations & data
- Migrations are **hand-written numbered SQL** in `migrations/`, applied by `npm run db:migrate` (custom runner with a `_migrations` ledger — NOT drizzle-kit). The Drizzle schema in `src/server/db/schema/` is kept in sync **by hand**.
- `npm run db:seed` seeds the demo org/users (`src/server/auth/demo.ts`): `demo@example.com` / `demo1234` (owner), `viewer@example.com` / `viewer1234` (org viewer; editor on Oegstgeest, viewer on Demo Trees).
- `npm run typecheck` before finishing changes.

## Backlog
Open follow-ups (loading/feedback polish, project-member UI, self-serve auth, offline-queue project scoping, org rename) live in **[TODO.md](TODO.md)** — check it before declaring related work done.
