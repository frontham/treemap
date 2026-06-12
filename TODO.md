# TODO / Backlog

## Loading & feedback polish
App-wide feedback is in place: top **activity bar** ([GlobalActivityBar](src/components/providers/GlobalActivityBar.tsx),
driven by React Query in-flight counts), a map **"Loading trees…" chip** ([TreesLoader](src/components/map/TreesLoader.tsx)),
and route **`loading.tsx`** for the map + org segments. Still missing per-control states:

- [ ] **Tree create/edit/delete** — explicit "Saving…/Deleting…" button states in
      [TreeComposerDrawer](src/components/trees/TreeComposerDrawer.tsx) /
      [TreeDetailDrawer](src/components/trees/TreeDetailDrawer.tsx) / [TreeForm](src/components/forms/TreeForm.tsx).
      Today only the global bar reflects these mutations.
- [ ] **Data import** ([DataMenu](src/components/layout/DataMenu.tsx)) — show a real progress count for large
      files instead of just the top bar + a final `alert()`.

## Other deferred (org / projects / auth)
- [ ] **Project-level members UI** — backend ready (`members.listProject` / `setProjectRole` / `removeProject`);
      only the org-level members page exists.
- [ ] **Self-serve auth** — public signup, email invitation accept-flow, email verification, password reset
      (needs an email-sending service). Current auth is admin-provisioned only.
- [ ] **Org rename** — replace the hardcoded `demo` org slug with the real org name + slug (+ redirect).
- [ ] **Tree photos → object storage** — photos currently store downscaled JPEG **data URLs** in
      `tree_photos.storage_key`/`thumbnail_key` ([processImage](src/lib/image/processImage.ts) +
      [trees.addPhoto](src/server/trpc/routers/trees.ts)), matching the overlays pattern. The `.env` already
      has Cloudflare **R2** slots (empty); migrating is a non-breaking backfill — decode each row's base64,
      upload to R2/Vercel Blob, rewrite those two columns. API/UI unchanged.
- [ ] Run `npm run build` before deploying (dev-verified only so far).
