# Build Performance: esbuild Migration

Separate from `REFACTORING_CHANGES.md` (that document covers the broader code
cleanup pass; this one is specifically about the follow-up build-speed work,
per request).

## What changed

`angular.json`'s `build`, `serve`, and `extract-i18n` targets were migrated
from Angular's legacy webpack-based builder to the esbuild-based one:

| Target | Before | After |
|---|---|---|
| `build` | `@angular-devkit/build-angular:browser` | `@angular-devkit/build-angular:application` |
| `serve` | `browserTarget` option | `buildTarget` option (the non-deprecated name) |
| `extract-i18n` | `browserTarget` option | `buildTarget` option |

This builder has been available and stable since Angular 17 (this app is on
17.3.7) - no Angular version upgrade was needed, just a config change.

### Option renames/removals required by the new builder's schema

- `main` -> `browser` (same value, `src/main.ts`)
- `serviceWorker: true` + `ngswConfigPath: "ngsw-config.json"` -> a single
  `serviceWorker: "ngsw-config.json"` (path is now the value directly)
- `outputPath` changed from a bare string to an object so the previous flat
  output structure could be preserved exactly (see below)
- Removed `buildOptimizer` and `vendorChunk` from the `development`
  configuration override - both are webpack-specific concepts with no
  equivalent in the new builder's schema (which is `additionalProperties:
  false`, so leaving them in would hard-fail the build, not just warn)

### Preserving the existing output path (`outputPath.browser: ""`)

The new builder defaults to nesting output under a `browser/` subfolder
(`dist/atlas-mentor-web-app/browser/index.html`), because it also supports
emitting a separate `server/` build for SSR. This app doesn't use SSR, and
`capacitor.config.ts`'s `webDir: 'dist/atlas-mentor-web-app'` (used by the
`android`/`ios`/`sync` npm scripts) expects `index.html` directly at that path.

Rather than update `capacitor.config.ts` and audit every other place that
might assume the old path, `outputPath` was set to:

```json
"outputPath": { "base": "dist/atlas-mentor-web-app", "browser": "" }
```

which keeps the output landing exactly where it did before. Verified: `ls
dist/atlas-mentor-web-app/index.html` exists directly (no `browser/`
subfolder) after a clean build. **`capacitor.config.ts` needed zero changes.**

## Measured impact

The very first numbers quoted in conversation (187s, 146s, 114s across three
successive builds) turned out to be confounded by Angular's build cache
warming up between runs, not a real trend - each of those builds reused
`.angular/cache/` from the previous one. This measurement instead clears the
cache first, for a genuine cold-build comparison:

```bash
rm -rf .angular/cache dist
npm run build:prod
```

| | Time |
|---|---|
| Old webpack `:browser` builder (cache-cold) | ~114-187s (varied run to run, cache-warmth confounded) |
| New esbuild `:application` builder (cache-cold, clean measurement) | **73.5s** |

This is a real reduction - somewhere in the 35-60% range depending on which old
number you compare against - and, unlike the icon-import change in
`REFACTORING_CHANGES.md`, this one is a genuine mechanism (esbuild is a
fundamentally faster bundler/minifier than webpack+Terser), not a cache
artifact. It does **not** hit the requested sub-60s target, but it's close and
it's a real, verified number, not an optimistic one.

### If you want to push further below 60s

Not attempted in this pass - listed in priority order of expected payoff:

1. **Split `shared/material.module.ts`** (flagged in `REFACTORING_CHANGES.md`'s
   Remaining Technical Debt) - it eagerly imports ~35 Angular Material modules
   into the root bundle via `AppModule`. Per-feature Material imports would
   reduce how much Angular's compiler and esbuild both have to process on the
   eager path, likely helping both bundle size and build time. This is the
   most promising lever, but touches how nearly every component resolves its
   Material imports - real regression risk without careful, incremental
   verification per feature.
2. **Confirm CI/build-machine specs** - if this same build is timed slower in
   CI than locally, that's a hardware/parallelism ceiling (esbuild scales with
   CPU cores), not something further config changes can fix.
3. **`tasks.component.scss`'s budget overage** (45KB vs a 30KB budget) is a
   warning, not a build-time cost - not relevant here, mentioned only so it
   isn't confused with a performance issue.

## Validation

| Check | Result |
|---|---|
| Clean build (`rm -rf .angular/cache dist && npm run build:prod`) | PASS, 73.5s, exit 0 - only pre-existing warnings (NG8107 optional-chaining lints, tasks.component.scss budget) |
| Output structure (`dist/atlas-mentor-web-app/index.html` exists directly) | PASS - `capacitor.config.ts` untouched |
| `tsc -p tsconfig.app.json --noEmit` | PASS, clean |
| Unauthenticated browser check (`automation/scripts/browser-smoke.js`) | PASS - login page renders, all role routes redirect correctly when unauthenticated |
| Authenticated browser check (`automation/scripts/auth-smoke.js`) | PASS - login succeeds, 33/33 icons render, 0 console errors |
