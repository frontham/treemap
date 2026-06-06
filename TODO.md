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
- [ ] **Offline queue project scoping** — stamp the active `projectId` into queued `trees.create` payloads so a
      tree queued under project A can't drain into project B after switching ([src/lib/offline/*](src/lib/offline/)).
- [ ] **Org rename** — replace the hardcoded `demo` org slug with the real org name + slug (+ redirect).
- [ ] Run `npm run build` before deploying (dev-verified only so far).
