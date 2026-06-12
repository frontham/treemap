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

## Code style & component architecture
Established in the component-decomposition refactor (PR #14–#16) — keep new code in this shape:
- **Small, single-responsibility components, one per file.** Containers fetch/own state; presentational pieces stay stateless. If a component grows past ~150–200 lines or gains a second job, split it (see `components/report/`, `components/map/referenceImage/` for the pattern).
- **Extract complexity into hooks.** Shared ones live in `src/lib/` (`useClickOutside`, `useSelectionSet`, `useDateFormatter`); feature hooks sit next to their components (`useFitByPoints`, `usePhotoUpload`, `useBasemapSelection`). Pure math goes in `src/lib/geo/` / `src/lib/image/` where it's unit-testable.
- **Reuse before writing.** Check `components/ui/` (incl. `ui/menu/`, `ui/toast/`, `ui/dialog/`) and `src/lib/` for an existing hook/component before adding a near-duplicate.
- **No browser dialogs.** Use `useToast()` (notices) and `useDialog()` (`confirm`/`prompt`) — never `window.alert/confirm/prompt`.
- **Every UI string through i18n** (`useT`, en + nl in `src/lib/i18n/messages.ts`); use `renderTokens` for sentences with styled words inside them.

## Performance
The DB is remote (Neon eu-central-1; prod on Vercel, same region) — **every statement is a network round-trip**, and that round-trip count dominates API latency. Always weigh changes against this; when touching code, look for and flag perf regressions (extra round-trips, extra re-renders, growing payloads).
- Keep all tenant-scoped work inside the single `withOrgContext` transaction; its GUCs are set in **one** statement — don't add per-query `set_config` calls. Membership resolution is cached 60s per instance in `resolveContext.ts` (session check stays live).
- React Query defaults to `staleTime: 30s`, no refetch-on-focus — mutations **must** invalidate exactly what they change.
- **Never put high-frequency values (cursor, camera) in React context** — a per-mousemove context value re-renders the whole map page. Subscribe to map events in the leaf component instead (see `CursorCoordReadout`).
- The trees GeoJSON source is **owned by `TreesLoader`**; preview tools may write it only while actively previewing and must restore exactly once after.
- Watch payload sizes: overlays + photos are base64 data URLs in Postgres; `overlays.list` ships full image bytes to every consumer. Fine at current scale, fixed properly by the R2 migration in TODO.md.

## Backlog
Open follow-ups (loading/feedback polish, project-member UI, self-serve auth, offline-queue project scoping, org rename) live in **[TODO.md](TODO.md)** — check it before declaring related work done.
