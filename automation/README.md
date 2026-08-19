# Automation

Real-browser automation for the Atlas Mentor frontend, kept separate from `src/app`
so app code and automation code never mix.

```
automation/
  README.md        this file
  config/           (reserved for future automation config, currently empty)
  scripts/          runnable automation scripts
  tests/            output artifacts (screenshots) from test runs
```

## Browser smoke check (`scripts/browser-smoke.js`)

Uses the `playwright` package (already an npm devDependency - no `@playwright/test`
runner was added, to avoid introducing a new dependency for this) to drive real
Chromium and verify the app boots correctly in an actual browser.

### ⚠️ Safety constraint - read this before extending these tests

`src/environments/environment.ts` (the config used by `ng serve` / `npm start`)
points `apiUrl` at the **live production backend**
(`https://app.atlasmentor.com/BE/api`), not a local or staging instance.

Because of this, `browser-smoke.js` deliberately:
- Only visits public, unauthenticated routes.
- Never fills in or submits any form (no login attempts, no guessed credentials).
- Never performs any create/update/delete action.

**Do not add login, form-submission, or CRUD-flow automation to this script** until
`environment.ts` is pointed at a local backend (`http://localhost:8080/api` - see
the commented-out line already in that file) with its own seeded test database, or
a dedicated staging environment with a disposable test account exists. Running
authenticated/mutating browser automation against the current dev config would
write real data to production.

### What it checks

1. Unauthenticated `/` redirects to `/auth/login` (confirms `AuthGuard` wiring).
2. The login form renders its expected fields (email, password, submit button).
3. The Atlas Mentor text-based brand header ("Atlas" / "Mentor" wordmark) renders on the login page.
4. Unauthenticated role routes (`/admin`, `/manager`, `/employee`, `/student`) all
   redirect to `/auth/login` too.
5. Captures a screenshot to `automation/tests/last-run-login.png` and reports any
   browser console errors seen along the way (informational, not a hard failure,
   since an unauthenticated background API call legitimately returning 401 can log
   a console error that isn't a real bug).

### Running it

```bash
node automation/scripts/browser-smoke.js
```

If nothing is already listening on `http://localhost:4200`, the script starts
`npm start` itself and waits for it to be ready; if a dev server is already
running, it reuses it. Exits with a non-zero code if any check fails.

Requires the Chromium browser binary for Playwright, installed once via:

```bash
npx playwright install chromium
```

## Theme verification (`scripts/theme-verify.js`)

Logs in the same way as `auth-smoke.js`, then clicks through the sidebar
(Dashboard, Leads, Students, Employees, Tasks, Payments, Branches, Settings)
and exercises key interactive elements - search input, list/grid toggle,
Add Lead dialog, Import Data dialog, status dropdown, pagination - **without
ever clicking a create/edit/delete/save control** (dialogs are opened then
closed via their own close icon, never submitted). Confirms the navy brand
color (`--brand-primary` / `#1B2A4A`) is actually applied via computed-style
checks on the sidebar logo box and the primary "Add Lead" button, and saves
screenshots of a few key pages to `automation/tests/` for visual review.

```bash
E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/theme-verify.js
```

## Extending this later

Once a safe backend target exists, the natural next steps are:
- Add an authenticated smoke pass (login with a disposable test account, verify
  the role-appropriate dashboard renders, log out).
- Add read-only checks per major feature area (leads list loads, branches list
  loads, tasks board loads) using that same test account.
- Only after those are stable, consider adding narrowly-scoped create/update/delete
  flow tests, each cleaning up the data it creates.
