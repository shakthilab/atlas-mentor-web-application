# Refactoring Changes

This document summarizes the refactoring pass done on `refactor/full-cleanup`
(branched from `main`). It focuses on high-confidence, verifiable fixes rather
than a full rewrite - see "Remaining Technical Debt" for what was intentionally
left alone and why.

## Summary

The codebase originated from the "Modernize Angular" CLI template and had
accumulated: leftover unused template demo pages, one-off root-level debug/
migration scripts, duplicated API-response normalization logic, direct
`HttpClient` usage inside components that bypassed the service layer, a couple
of manual-DOM-manipulation patterns, an unbounded RxJS subscription leak, and
several icon-name typos that were silently failing at runtime. Each of these
was investigated, verified against actual behavior (not just static reading),
and fixed individually with its own commit. Real, authenticated browser
verification (via Playwright, driven directly rather than through a review
tool) surfaced two additional genuine runtime bugs that were fixed along the
way.

## Architecture

**Before**: feature-based top level, but most `features/*` modules were thin
routed shells pulling actual UI from a flat `shared/components/*` bag; three
orphaned modules (`features/extra`, `features/ui-components`,
`features/pages.module.ts`) were never registered in any route and existed only
as unused template leftovers.

**Changes**:
- Deleted the three orphaned modules entirely (30 files, ~1,700 lines) after
  confirming via repo-wide grep that nothing imported them.
- Deleted 8 one-off root-level debug/migration scripts (`fix_html.py`,
  `update_drawer.py`, `check4.js`, etc.) that referenced an unrelated local
  filesystem path and were not part of the build.
- Left the `task-accountability` feature's self-contained structure
  (components/services/models/interfaces of its own) as the reference pattern
  for future large features - it's already the most mature part of the codebase.

## Dependencies

- **Removed**: `primeng`, `primeicons` (unused - verified via a full `src/`
  grep before removing; Angular Material is the app's only active UI kit).
- **Kept, but changed how it's imported**: `angular-tabler-icons` - was
  wildcard-importing its entire ~9.7MB icon barrel and passing it to
  `TablerIconsModule.pick(...)`. Replaced with an explicit, validated list of
  the 126 icon names actually referenced anywhere in the app (see
  `automation/scripts/extract-tabler-icons.js`). **Measured impact: negligible**
  - the production `main.js` bundle was essentially the same size before and
    after (3.31MB raw / ~473KB gzip either way). This was done anyway because
    it's more explicit and because validating it surfaced 3 real bugs (below),
    but it did not solve the build-speed/bundle-size question it was attempted
    for. See "Remaining Technical Debt" for what would actually move that
    number.
- **Kept, newly wired in**: `playwright` was already a devDependency but
  completely unused (only referenced by throwaway root scripts, not part of
  `src/` or any test config). Used it for real browser verification instead of
  adding a new testing dependency.
- No other duplicate/unused dependencies were found - `package.json` was
  already fairly minimal (no duplicate date/HTTP/state libraries, no
  competing CSS framework).

## Angular Improvements

**Services / API layer**:
- Extracted `core/utils/api-response.util.ts` (`extractListData`,
  `normalizeListEnvelope`) to deduplicate identical defensive-unwrapping logic
  that had been copy-pasted across `hierarchy.service.ts`,
  `master-data.service.ts`, and `referral.service.ts` (the backend returns list
  data as either a flat array or a paginated `{content:[...]}` wrapper
  depending on endpoint - confirmed against the actual Spring Boot controllers).
  Behavior-preserving; verified via type-check and rebuild.
- `branches.component.ts` and `add-branch-dialog.component.ts` injected
  `HttpClient` directly and manually built `Authorization` headers, bypassing
  the service layer - redundant besides, since `AuthInterceptor` already
  attaches the bearer token to every outgoing request. Added
  `getBranchesPaginated` / `getBranchManagers` / `createBranch` /
  `updateBranch` / `updateBranchStatus` / `deleteBranch` to `HierarchyService`
  and migrated both components to it. Same endpoints, same payloads.

**RxJS**:
- `AppNavItemComponent` (instantiated once per sidebar nav item) re-subscribed
  to the long-lived `NavService.currentUrl` `BehaviorSubject` on every
  `ngOnChanges` firing and never unsubscribed - an unbounded subscription
  pile-up. The subscription's callback body was empty dead code, so it was
  removed outright (zero behavior change, confirmed by reading the callback).
- Added `takeUntilDestroyed()` to `HeaderComponent`'s `currentUser$`
  subscription as a defensive teardown.
- One nested-subscribe pattern (`tasks.component.ts`'s delete-confirmation
  flow) was investigated and left as-is: both the confirmation dialog
  observable and the delete HTTP call complete on their own, so it isn't
  actually a leak, just a common (if slightly awkward) confirm-then-act idiom
  also used elsewhere in the app.

**DOM manipulation**:
- `AnimatedNumberDirective` (admin dashboard's animated counters) wrote
  computed numeric text via `nativeElement.innerHTML` - not an active XSS risk
  (only ever set from internally-computed numbers), but bypassed Angular's DOM
  abstraction. Switched to `Renderer2.setProperty(..., 'textContent', ...)`.
- `TaskDetailsDrawerComponent`'s resize-handle logic wrote
  `document.body.style.cursor`/`userSelect` directly while also holding an
  entirely unused `ElementRef` injection. Switched to `Renderer2.setStyle(...)`
  and removed the dead injection.

**Runtime bugs found via authenticated browser verification** (not from static
reading - these were caught by actually logging in and watching the console):
- `admin-dashboard.component.ts`: `c.trendColor ?? c.color ?? '#198754'` used
  nullish coalescing, which does not fall through on an empty string (only
  `null`/`undefined`). A backend-supplied `trendColor: ""` therefore produced
  `color + '55'` evaluating to the literal string `'55'`, which is not a valid
  CanvasGradient color stop - `chart.setOption` was throwing
  `Failed to execute 'addColorStop' ...` repeatedly on every dashboard load.
  Changed `??` to `||`. Confirmed fixed: re-ran the authenticated smoke check
  before/after, console errors went from ~38 to 0.
- Also removed a leftover `console.log('[Dashboard] KPI card[0] keys:', ...)`
  debug statement in the same method.

**Icon-name bugs** (found while validating the curated icon list against the
actual installed package - each was silently rendering blank in production,
logging a `console.warn` from `TablerIconComponent`, not crashing):
- `task-table.component.ts`: `getTaskTypeIcon('APPROVAL')` returned
  `'discount-check'`, which isn't a real tabler icon. Changed to
  `'rosette-discount-check'` (an actual icon, semantically a good match for
  "approval").
- `companies.component.ts`: both empty-state icons used `'building-off'`,
  which doesn't exist (no "off" variant of the building icon in this version).
  Changed to `'building'`.
- `resources.component.ts` and `resource-details-dialog.component.ts`:
  `getFileIcon()`'s archive/zip case returned `'folder-zip'`, which doesn't
  exist. Changed to `'file-zip'` (a real icon).

## State Management / Redux Decision

Not adopted. See the README's "State management" section - no NgRx currently
in the app, and introducing it would mean rewriting most of the existing
service-based data-fetching layer to fit the pattern, which is disproportionate
to the benefit for this codebase's size and isn't a genuine architectural
requirement here. The existing singleton-service-with-`BehaviorSubject` pattern
is a reasonable fit for this app's actual state needs.

## Automation

Added `automation/` (README, `scripts/`, `tests/`):
- `browser-smoke.js` - unauthenticated-only Playwright checks (login page
  renders, redirect-to-login guard behavior across all role routes, logo asset
  loads). Safe to run against the current dev config, which points at the live
  production backend, because it never submits a form.
- `auth-smoke.js` - logs in with real credentials (read from `E2E_EMAIL` /
  `E2E_PASSWORD` env vars only, never hardcoded or committed) and verifies the
  post-login dashboard renders, icons render, and there are no console errors.
  Read-only beyond the login action itself - never clicks create/edit/delete.
- `extract-tabler-icons.js` - a diagnostic/maintenance script, not a test. Scans
  `src/app` for every icon name referenced (static, ternary, and lookup-object
  values), validates each against the installed `angular-tabler-icons` package,
  and prints ready-to-paste `import`/`.pick()` code. Re-run it after adding a
  new icon anywhere in the app.
- `.gitignore` now excludes `automation/tests/*.png` - screenshots from
  `auth-smoke.js` runs can contain real account/session data and must not be
  committed.

## Backend Reference

The sibling backend repository (`atlas_mentor_backend`, Spring Boot) was read
for contract verification only - no backend file was modified. Confirmed
findings used in this refactor:
- The backend genuinely serves list data in two different shapes (flat array
  vs paginated `{content:[...]}`) depending on endpoint, which is what the
  extracted `api-response.util.ts` normalizes - this wasn't defensive code
  guarding against something that can't happen.
- `TaskController` has no bulk-update, comment-edit/delete, or attachment
  endpoints, which is why `TaskService`'s corresponding methods only touch
  `localStorage` - documented as a known limitation, not fixed (per explicit
  product decision: keep current behavior, just document it).
- No mismatches were found that required changing frontend request/response
  models beyond what's described above.

## Browser Verification

No dedicated browser-automation tool was available in this environment, so
real Chromium automation was driven directly via the `playwright` package
(already a devDependency) rather than skipped.

| Flow | Result |
|---|---|
| Unauthenticated `/` redirects to `/auth/login` | PASS |
| Login form renders (email, password, submit) | PASS |
| Logo asset loads | PASS |
| Unauthenticated `/admin`, `/manager`, `/employee`, `/student` all redirect to login | PASS |
| Authenticated login (real account, credentials via env var) | PASS |
| Post-login dashboard renders | PASS |
| Icons render post-login | PASS (33/33, 0 blank) |
| Console errors post-login | PASS (0, after the gradient-color fix; was ~38 before) |

Not verified in-browser: create/edit/delete flows for any entity (leads,
branches, tasks, payments, etc.). The dev environment's `apiUrl` points at the
live production backend with no local/staging alternative configured, so
running mutating flows would risk writing real data. This is a deliberate
scope limit, not an oversight - see the README and `automation/README.md` for
what would need to exist (a local backend + seeded DB, or a staging
environment) before that kind of testing is safe to automate.

## Validation

| Check | Result |
|---|---|
| `tsc -p tsconfig.app.json --noEmit` | PASS (clean, no errors) |
| `npm run build:prod` | PASS (exit 0; only pre-existing warnings - a handful of `NG8107` redundant-optional-chaining lints and `tasks.component.scss` exceeding its budget by 15KB, both unrelated to this refactor) |
| Lint | Not applicable - no ESLint config or `lint` script exists in this repo (no `.eslintrc`/`eslint.config.*`). Noted as a gap, not silently skipped. |
| Unit tests (`ng test`) | Not run as part of this pass - only 2 pre-existing spec files exist in the whole repo (`app.component.spec.ts`, still asserting boilerplate CLI-default content, and `tasks-v2.component.spec.ts`, a bare "should create"), neither touched by this refactor. Per explicit instruction this session, no new Jasmine/Karma spec files were added - browser-driven Playwright checks were used instead (see Automation/Browser Verification above). |
| Browser verification | PASS - see table above |

## Remaining Technical Debt

Left intentionally unchanged, in rough priority order:

- **`tasks.component.ts` (2,829 lines) and `task.service.ts` (861 lines,
  mixed real-API/localStorage-only methods)**: the highest-value refactor
  target in the codebase (largest component, most `: any` usage, most
  subscribe sites), but breaking it up safely needs real test coverage first -
  this repo has essentially none, and a change of this size without it carries
  real regression risk for a live app used by real staff. Recommend adding
  characterization tests (or at least a thorough authenticated Playwright pass
  over every task-board interaction) before attempting this.
- **`admin-dashboard.component.ts` (1,222 lines, 44 `: any` occurrences)**:
  second-largest component; only the two concrete bugs found during this pass
  (gradient color, debug log) were fixed. The broader typing/decomposition
  work was not attempted.
- **Duplicated domain shapes** (`Task` vs `TaskV2` vs `TaskItem`,
  `EmployeeNode` defined twice with genuinely different meanings in different
  modules, `Lead` vs `LeadApi`): investigated in detail. Most of these turned
  out to be legitimate API-DTO-vs-view-model splits rather than accidental
  duplication (e.g. `Lead`/`LeadApi` intentionally differ - one is the raw
  backend shape, the other a flattened UI model), so consolidating them would
  have been either wrong or a large, disproportionate rewrite for a naming
  collision with no actual runtime conflict. Not changed.
- **Real bundle-size reduction**: the icon-import curation (see Dependencies)
  didn't move `main.js`'s size. The more likely actual contributor is
  `shared/material.module.ts`, a "kitchen-sink" module that eagerly imports
  and exports ~35 Angular Material modules into the root bundle via
  `AppModule`. Splitting this per-feature (so routes only pull in the Material
  modules they actually use) is a plausible real fix, but it's a broad,
  higher-risk change touching how nearly every component in the app resolves
  its Material imports - out of scope for this pass without dedicated time to
  verify each feature module still compiles and renders correctly afterward.
- **176 total `: any` occurrences / 15 `as any`** across the codebase (audited,
  not fixed) - concentrated in `admin-dashboard.component.ts` (44),
  `tasks.component.ts` (17), and a handful of dialog components. Fixing these
  properly means writing real request/response interfaces per endpoint, which
  is valuable but sizable work better done alongside the `task.service.ts`
  breakup above.
- **No lint tooling configured** - flagged, not added. Adding ESLint with
  Angular's recommended ruleset would be a reasonable follow-up but wasn't
  requested and represents new tooling/config surface rather than a fix to
  existing code.
- **Two boilerplate spec files** (`app.component.spec.ts` still asserts the
  Angular CLI default title/content, `tasks-v2.component.spec.ts` is a bare
  "should create") exist but weren't touched - fixing them wasn't requested,
  and given the explicit guidance this session to prefer browser-driven
  verification over unit specs, expanding unit test coverage wasn't pursued
  either.
