# AI Agent Rules — Atlas Mentor Web App

This file is loaded automatically at the start of every Claude Code session in
this repo. Read it before starting any task, and re-check it before finishing
any task that touches `package.json`, `angular.json`, global styles, or
dependencies. It exists because of a recurring incident: a hard-won build-time
win got silently undone by a routine merge.

## Incident history (why this file exists)

- `refactor/full-cleanup` removed `primeng`/`primeicons` as verified-unused
  (see `REFACTORING_CHANGES.md`), and migrated the build to esbuild, landing a
  cold-build time of **73.5s** (see `BUILD_PERFORMANCE.md`).
- A later `Merge branch 'main' into refactor/full-cleanup` brought in a
  `task-accountability` feature (built on `main` independently) that imports
  PrimeNG's `DropdownModule` for a single dropdown, and `styles.scss` now
  globally imports the entire PrimeNG theme (`lara-light-blue/theme.css` +
  `primeng.min.css`) plus `primeicons.css`. Nobody caught it because a merge
  doesn't get the same scrutiny as a hand-written dependency add.
- Net effect: a dependency that was deliberately removed came back through the
  side door, for one component's worth of value, at full cost.

## Rule 1 — Dependency changes are a gate, not a formality

Before adding **any** new package to `dependencies` or `devDependencies`:
1. Search `package.json` and this file's ledger below for an existing
   equivalent first. **Angular Material (`@angular/cdk` + `@angular/material`)
   is this app's only UI kit.** Do not add a second component library
   (PrimeNG, NG-Zorro, Bootstrap, react-*, etc.) for something Material
   already covers (dropdowns → `mat-select`, dialogs → `MatDialog`, tables →
   `mat-table`, etc.).
2. If it's genuinely new capability, state in the PR/commit description what
   it costs: bundle size delta and cold build time delta (see Rule 2).
3. Never add a dependency "just in case" or to match a pattern from a
   different codebase/template.

## Rule 2 — Any dependency or build-config change must be measured

Run a cold build before and after the change and record both numbers:
```bash
rm -rf .angular/cache dist && npm run build:prod
```
- **Baseline: ~73.5s** (esbuild `application` builder, see
  `BUILD_PERFORMANCE.md`). Treat anything **> 90s (≈+20%)** as a regression
  that must be justified in the commit message or reverted, not silently
  accepted.
- Also sanity-check `dist/atlas-mentor-web-app/browser*/main*.js` size isn't
  jumping (baseline ~3.3MB raw / ~473KB gzip per `REFACTORING_CHANGES.md`).

## Rule 3 — Merges/rebases are not exempt

`git merge`/`git pull` can reintroduce a dependency exactly as easily as a
hand-edit — it did, once, already. Whenever a merge touches `package.json`:
1. Diff it explicitly: `git diff <merge-base> HEAD -- package.json`.
2. Cross-check anything newly added or reintroduced against the "Removed /
   rejected dependencies" ledger below.
3. If a removed dependency comes back, don't just accept it — find out *why*
   (usually: new feature code on the other branch depends on it) and either
   port that usage to the existing UI kit or explicitly re-approve the
   dependency with updated cost numbers per Rule 2.

## Removed / rejected dependencies ledger

| Package | Status | Why | Notes |
|---|---|---|---|
| `primeng`, `primeicons` | **Removed (2nd time) — 2026-08-16** | Removed as unused in `refactor/full-cleanup`; came back via merge because `task-accountability`'s dropdown (one usage) and a global theme import in `src/styles.scss` depended on it | `role-templates.component.html`'s two `p-dropdown`s replaced with `mat-select` (no new module wiring needed — `MatSelectModule`/`FormsModule` were already available via `SharedModule`), PrimeNG theme imports deleted from `styles.scss`, packages removed via `npm uninstall primeng primeicons`. Verified: `tsc --noEmit` clean, no new build warnings, cold build ~82s (steady-state; a same-session first-run right after `npm uninstall` read 119s but that was cache-warming noise, not a real regression — re-run to confirm before trusting a single post-uninstall measurement). If this reappears a third time, treat it as a process failure, not a one-off. |

Keep this table current: when a dependency is deliberately removed, add a row
here in the same commit, so the next merge doesn't quietly undo it again.

## Rule 4 — Security / production-safety baseline

- Never hardcode credentials, tokens, or API keys. Follow the existing
  pattern (`E2E_EMAIL`/`E2E_PASSWORD` env vars for `automation/`) for anything
  credential-shaped.
- All outgoing HTTP calls go through the service layer (`*.service.ts`) so
  `AuthInterceptor` attaches auth headers consistently — don't inject
  `HttpClient` directly into components.
- Never write dynamic/user-influenced content via `innerHTML`; use
  `Renderer2` (`setProperty`/`setStyle`) or Angular bindings instead.
- The dev `apiUrl` points at the **live production backend** with no
  local/staging alternative. Never run or add automated flows that create,
  edit, or delete real data (leads, branches, tasks, payments) against it —
  read-only verification only, exactly as `automation/browser-smoke.js` and
  `automation/auth-smoke.js` currently do.
- Don't commit `automation/tests/*.png` or any other screenshot/log that
  could contain real session/account data (already gitignored — keep it that
  way for any new automation output).

## Rule 5 — Definition of done for any change here

- `npx tsc -p tsconfig.app.json --noEmit` is clean.
- `npm run build:prod` succeeds (cold, per Rule 2 if deps/build config
  changed) with no new warnings beyond the pre-existing ones (`NG8107`
  optional-chaining lints, `tasks.component.scss` budget overage).
- If the change touches UI, prefer real verification (Playwright via
  `automation/`) over claiming it works from reading code.
