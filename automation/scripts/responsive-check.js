/**
 * Responsive verification helper - READ-ONLY beyond the login action itself.
 * Logs in with a real account (env-var credentials only), navigates to one or
 * more app routes, resizes the viewport across a fixed set of desktop/tablet/
 * mobile breakpoints, screenshots each, and flags horizontal page overflow +
 * console errors. Never fills or submits any form beyond the login form,
 * never clicks a create/edit/delete/save control. See automation/README.md
 * for why (dev environment points at the live production backend).
 *
 * Usage:
 *   E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/responsive-check.js \
 *     --module <module-name> --pages "Label1=/route1,Label2=/route2"
 *
 * --pages entries are "Label=/route" pairs (comma separated). Label is used
 * only for filenames; route is navigated to directly via page.goto so this
 * works regardless of sidebar wording.
 *
 * Screenshots land in Downloads/responsive-implementation/<module>/screenshots/
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BASE_URL = 'http://localhost:4200';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}
const MODULE = getArg('module');
const PAGES_ARG = getArg('pages', 'Home=/');
const SKIP_LOGIN = args.includes('--skip-login');
const FULL_PAGE = args.includes('--fullpage');

if (!MODULE) {
  console.error('[responsive-check] --module <name> is required.');
  process.exit(1);
}
if (!SKIP_LOGIN && (!EMAIL || !PASSWORD)) {
  console.error('[responsive-check] Set E2E_EMAIL and E2E_PASSWORD env vars (or pass --skip-login for public pages).');
  process.exit(1);
}

const OUT_DIR = path.join(os.homedir(), 'Downloads', 'responsive-implementation', MODULE, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BREAKPOINTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-320', width: 320, height: 568 },
];

function checkServerUp() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => { res.resume(); resolve(true); });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function waitForServer(timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (await checkServerUp()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error(`ng serve did not become ready within ${timeoutMs}ms`));
      setTimeout(poll, 2000);
    };
    poll();
  });
}

async function main() {
  const pageSpecs = PAGES_ARG.split(',').map((entry) => {
    const [label, route] = entry.split('=');
    return { label: label.trim(), route: (route || '/').trim() };
  });

  const failures = [];
  const overflowIssues = [];
  const consoleErrors = [];
  const alreadyRunning = await checkServerUp();
  let devServer = null;

  if (!alreadyRunning) {
    console.log('[responsive-check] Starting `npm start` (ng serve)...');
    devServer = spawn('npm', ['start'], { cwd: REPO_ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    await waitForServer(120_000);
    console.log('[responsive-check] Dev server is up.');
  } else {
    console.log('[responsive-check] Reusing already-running dev server at ' + BASE_URL);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    if (!SKIP_LOGIN) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
      await page.locator('input[formcontrolname="email"]').fill(EMAIL);
      await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15_000 }).catch(() => {});
      if (page.url().includes('/auth/login')) {
        failures.push(`Login failed - still on /auth/login. URL: ${page.url()}`);
      } else {
        console.log(`[responsive-check] Logged in, at ${page.url()}`);
      }
      await page.waitForTimeout(1500);
    }

    for (const { label, route } of pageSpecs) {
      const target = route.startsWith('http') ? route : BASE_URL + route;
      try {
        await page.goto(target, { waitUntil: 'networkidle', timeout: 20_000 });
      } catch (err) {
        failures.push(`Navigation to ${label} (${route}) failed: ${err.message}`);
        continue;
      }
      await page.waitForTimeout(800);

      for (const bp of BREAKPOINTS) {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.waitForTimeout(400);

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
          };
        }).catch(() => null);

        if (overflow && overflow.scrollWidth > overflow.clientWidth + 1) {
          overflowIssues.push(
            `${label} @ ${bp.name} (${bp.width}x${bp.height}): horizontal overflow ` +
            `(scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth})`
          );
        }

        // Viewport-only (not fullPage): fullPage captures render `position: fixed`
        // elements (mobile bottom nav, FABs) relative to the full document height
        // rather than the real viewport, which misrepresents them as overlapping
        // content that a real user scrolling that viewport would never see.
        const fileName = `${label.toLowerCase().replace(/\s+/g, '-')}--${bp.name}.png`;
        await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: FULL_PAGE }).catch((err) => {
          failures.push(`Screenshot failed for ${label} @ ${bp.name}: ${err.message}`);
        });
      }
      console.log(`[responsive-check] Captured ${label} across ${BREAKPOINTS.length} breakpoints.`);
    }
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }

  console.log('\n[responsive-check] Screenshot dir: ' + OUT_DIR);

  if (overflowIssues.length) {
    console.log('\n[responsive-check] Horizontal overflow issues:');
    overflowIssues.forEach((i) => console.log('  - ' + i));
  } else {
    console.log('\n[responsive-check] No horizontal overflow detected.');
  }

  if (consoleErrors.length) {
    console.log('\n[responsive-check] Console errors observed:');
    [...new Set(consoleErrors)].forEach((e) => console.log('  - ' + e));
  } else {
    console.log('\n[responsive-check] No console errors observed.');
  }

  if (failures.length) {
    console.error('\n[responsive-check] FAILURES:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n[responsive-check] Done.');
}

main().catch((err) => {
  console.error('[responsive-check] Fatal error:', err);
  process.exit(1);
});
