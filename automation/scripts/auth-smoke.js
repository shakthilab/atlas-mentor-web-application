/**
 * Authenticated real-browser smoke check. Logs in with a real account and
 * verifies the post-login dashboard renders - READ-ONLY beyond the login
 * action itself: it never clicks create/edit/delete/save on any entity, so it
 * cannot mutate data. See automation/README.md for the safety rationale
 * (this app's dev environment points at the live production backend).
 *
 * Credentials are read from environment variables only - NEVER hardcode them
 * here or in any committed file:
 *   E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/auth-smoke.js
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('[auth-smoke] Set E2E_EMAIL and E2E_PASSWORD env vars before running this script.');
  process.exit(1);
}

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
  const failures = [];
  const alreadyRunning = await checkServerUp();
  let devServer = null;

  if (!alreadyRunning) {
    console.log('[auth-smoke] Starting `npm start` (ng serve)...');
    devServer = spawn('npm', ['start'], { cwd: REPO_ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    devServer.stdout.on('data', () => {});
    devServer.stderr.on('data', () => {});
    await waitForServer(120_000);
    console.log('[auth-smoke] Dev server is up.');
  } else {
    console.log('[auth-smoke] Reusing already-running dev server at ' + BASE_URL);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
    await page.locator('input[formcontrolname="email"]').fill(EMAIL);
    await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15_000 }).catch(() => {});
    const postLoginUrl = page.url();
    if (postLoginUrl.includes('/auth/login')) {
      failures.push(`Still on /auth/login after submitting credentials (login failed or rejected). URL: ${postLoginUrl}`);
    } else {
      console.log(`[auth-smoke] PASS: logged in, redirected to ${postLoginUrl}`);
    }

    await page.waitForTimeout(2000); // let the dashboard's own data calls settle

    // Verify at least some <i-tabler> icons actually rendered an SVG (not blank)
    // - directly validates the curated icon-set change didn't break anything.
    const iconHandles = await page.locator('i-tabler, tabler-icon').all();
    let rendered = 0, blank = 0;
    for (const handle of iconHandles) {
      const html = await handle.innerHTML().catch(() => '');
      if (html && html.trim().length > 0) rendered++; else blank++;
    }
    console.log(`[auth-smoke] Icons on dashboard: ${rendered} rendered, ${blank} blank (of ${iconHandles.length} total)`);
    if (iconHandles.length > 0 && rendered === 0) {
      failures.push('No <i-tabler> icons rendered any SVG content on the post-login dashboard');
    }

    await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'last-run-dashboard.png'), fullPage: true });

    if (consoleErrors.length) {
      console.log('[auth-smoke] Console errors observed:');
      consoleErrors.forEach((e) => console.log('  - ' + e));
    } else {
      console.log('[auth-smoke] No console errors observed.');
    }
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }

  if (failures.length) {
    console.error('\n[auth-smoke] FAILED:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n[auth-smoke] All checks passed.');
}

main().catch((err) => {
  console.error('[auth-smoke] Fatal error:', err);
  process.exit(1);
});
