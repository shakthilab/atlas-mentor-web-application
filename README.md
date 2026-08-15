# Atlas Mentor - Web Application

Angular frontend for Atlas Mentor, a multi-role education/counselling CRM (admin,
manager, branch partner, employee/counsellor, company, referral, and student
portals) backed by a separate Spring Boot API.

## Stack

- **Angular 17** (NgModule-based, not standalone components), Angular Material +
  Angular CDK for UI, `angular-tabler-icons` for icons, `echarts`/`ngx-echarts`
  for charts, `@ngx-translate` for i18n, `@capacitor/*` for the Android/iOS
  wrapper builds.
- No NgRx/redux - app state is handled via a small number of `BehaviorSubject`
  singleton services (`AuthService.currentUser$`, `ThemeService`, `NavService`)
  plus per-component state. See "State management" below for why this wasn't
  changed to a redux-per-API pattern.
- No dedicated backend for local development by default - see "Backend" below,
  this matters before you run anything that logs in or mutates data.

## Getting started

```bash
npm ci
npm start          # ng serve, http://localhost:4200
```

```bash
npm run build:prod # production build -> dist/
npm test           # Karma/Jasmine unit tests
```

### ⚠️ Backend configuration

`src/environments/environment.ts` (used by `ng serve` / `npm start`) points
`apiUrl` at the **live production backend** by default:

```ts
apiUrl: 'https://app.atlasmentor.com/BE/api'
// apiUrl: 'http://localhost:8080/api'
```

If you're doing local development that creates/edits/deletes real records
(leads, branches, tasks, payouts, ...), point this at a local backend instance
first (the commented-out line). Treat the default config as read/verify-only.

## Architecture

```
src/app/
  core/            singleton services, guards, interceptors, shared utils
    services/      HTTP + domain services (auth, hierarchy, tasks, students, ...)
    guards/        AuthGuard (role + active-status route protection)
    interceptors/  AuthInterceptor (bearer token, 401 refresh, 403 toast)
    utils/         api-response.util.ts - normalizes the backend's two list
                   response shapes (flat array vs paginated {content:[...]})
  shared/          reusable UI: dialogs, tables, Material module, models
  features/        per-role route modules (admin, manager, branch-partner,
                   employee, company, referral, student, authentication,
                   task-accountability, dashboard, home)
  layouts/         full (authenticated shell: sidebar/header) and blank layouts
```

Most `features/*` modules are thin routed shells; the actual list/detail UI for
shared entities (leads, students, companies, branches, employees, referrals,
resources, tasks) lives in `shared/components/*` and is reused across roles.
`task-accountability` is the one feature with a fully self-contained internal
structure (components/services/models/interfaces of its own) - if you're adding
a large new feature, that's the structure to follow rather than dropping
components into the shared bag.

### Dependency policy

Kept intentionally small. Notable decisions from the last cleanup pass:
- Removed `primeng`/`primeicons` - unused (Angular Material is the only UI kit
  in active use; grepped the whole `src/` tree to confirm before removing).
- `angular-tabler-icons`: import only the icon names actually used
  (`app.module.ts`), not the full ~9.7MB icon barrel. Regenerate this list with
  `automation/scripts/extract-tabler-icons.js` after adding a new icon anywhere
  in the app - it scans, validates against the installed package, and prints
  ready-to-paste code.
- `playwright` was already a devDependency (unused, only referenced by
  throwaway root-level scripts) - wired it into `automation/` for real browser
  verification instead of adding a new testing dependency.

### State management

No NgRx, and the redux-per-API-call structure described in the original
refactor brief was evaluated and **not** adopted: the app has no NgRx already in
place, and introducing it would mean rewriting most of the existing
service-based data-fetching layer to fit the pattern for a codebase this size -
disproportionate to the benefit. The existing `BehaviorSubject`-backed singleton
services are a reasonable fit for this app's actual state needs (auth session,
theme, current-route tracking); local/list state stays in components.

## Automation

See [`automation/README.md`](automation/README.md). Real Playwright-driven
browser checks (`automation/scripts/browser-smoke.js`,
`automation/scripts/auth-smoke.js`), plus `extract-tabler-icons.js`, a
diagnostic script for keeping the curated icon import list complete. Run with:

```bash
npm run e2e:browser:smoke   # unauthenticated routes only, safe against prod
npm run e2e:auth:smoke      # logs in - read this script's safety notes first
```

## Known limitations (intentional, not bugs to "fix" reflexively)

- `TaskService`'s bulk-update, comment-edit/delete, and attachment
  add/delete methods persist only to `localStorage`, not the backend - the
  backend has no supporting endpoints for these yet. See the comment on
  `TaskService` in `core/services/task.service.ts`.
- No ESLint/lint tooling is configured in this repo (no `.eslintrc`/`eslint.config.*`,
  no `lint` script). Type-checking (`tsc --noEmit`) and the production build are
  the current safety net.

See `REFACTORING_CHANGES.md` for the full history of what was changed in the
most recent refactor pass and why.
