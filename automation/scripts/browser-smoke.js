/**
 * Real-browser smoke check for the Atlas Mentor frontend, using the `playwright`
 * package directly (no @playwright/test runner, to avoid adding a new dependency -
 * `playwright` is already installed).
 *
 * SAFETY: this app's dev environment (src/environments/environment.ts) points
 * apiUrl at the LIVE PRODUCTION backend, not a local one. This script therefore
 * only visits public/unauthenticated routes and never fills in or submits any
 * form, so it cannot create, modify, or delete real data. Do not extend it to
 * log in or perform mutations without first pointing environment.ts at a local/
 * staging backend - see automation/README.md.
 *
 * Usage: node automation/scripts/browser-smoke.js
 * Starts `ng serve` itself if nothing is already listening on :4200.
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function checkServerUp() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      res.resume();
      resolve(true);
    });
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
    console.log('[smoke] Starting `npm start` (ng serve)...');
    devServer = spawn('npm', ['start'], {
      cwd: REPO_ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    devServer.stdout.on('data', () => {});
    devServer.stderr.on('data', () => {});
    await waitForServer(120_000);
    console.log('[smoke] Dev server is up.');
  } else {
    console.log('[smoke] Reusing already-running dev server at ' + BASE_URL);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    // ── Check 1: root route redirects unauthenticated users to /auth/login ──
    // 'load' rather than 'networkidle': this dev server's Vite/esbuild HMR
    // client keeps a persistent WebSocket open, so 'networkidle' never fires.
    await page.goto(BASE_URL + '/', { waitUntil: 'load' });
    await page.waitForURL('**/auth/login**', { timeout: 10_000 }).catch(() => {});
    const urlAfterRoot = page.url();
    if (!urlAfterRoot.includes('/auth/login')) {
      failures.push(`Expected redirect to /auth/login from '/', got: ${urlAfterRoot}`);
    } else {
      console.log('[smoke] PASS: unauthenticated "/" redirects to /auth/login');
    }

    // ── Check 2: login form renders with expected fields ──
    const emailInput = page.locator('input[formcontrolname="email"]');
    const passwordInput = page.locator('input[formcontrolname="password"]');
    const submitButton = page.locator('button[type="submit"]');
    if (!(await emailInput.count())) failures.push('Login email input not found');
    if (!(await passwordInput.count())) failures.push('Login password input not found');
    if (!(await submitButton.count())) failures.push('Login submit button not found');
    if (await emailInput.count() && await passwordInput.count() && await submitButton.count()) {
      console.log('[smoke] PASS: login form fields (email, password, submit) render');
    }

    // ── Check 3: brand header renders (text-based "Atlas Mentor" wordmark, not an <img>) ──
    const brandAtlas = page.locator('.brand-atlas');
    const brandMentor = page.locator('.brand-mentor');
    if (await brandAtlas.count() && await brandMentor.count()) {
      const atlasText = (await brandAtlas.innerText()).trim();
      const mentorText = (await brandMentor.innerText()).trim();
      if (atlasText !== 'Atlas' || mentorText !== 'Mentor') {
        failures.push(`Brand header text mismatch: got "${atlasText} ${mentorText}"`);
      } else {
        console.log('[smoke] PASS: brand header renders');
      }
    } else {
      failures.push('Atlas Mentor brand header (.brand-atlas/.brand-mentor) not found on login page');
    }

    // ── Check 4: other role routes also redirect to login when unauthenticated ──
    for (const route of ['/admin', '/manager', '/employee', '/student']) {
      await page.goto(BASE_URL + route, { waitUntil: 'load' });
      await page.waitForURL('**/auth/login**', { timeout: 10_000 }).catch(() => {});
      const url = page.url();
      if (!url.includes('/auth/login')) {
        failures.push(`Expected ${route} to redirect to /auth/login when unauthenticated, got: ${url}`);
      } else {
        console.log(`[smoke] PASS: unauthenticated ${route} redirects to /auth/login`);
      }
    }

    await page.screenshot({ path: path.join(__dirname, '..', 'tests', 'last-run-login.png') });

    if (consoleErrors.length) {
      console.log('[smoke] Console errors observed during navigation:');
      consoleErrors.forEach((e) => console.log('  - ' + e));
      // Not auto-failed: navigating unauthenticated legitimately triggers a 401
      // from background calls in some layouts. Reported for manual review instead.
    }
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }

  if (failures.length) {
    console.error('\n[smoke] FAILED:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n[smoke] All checks passed.');
}

main().catch((err) => {
  console.error('[smoke] Fatal error:', err);
  process.exit(1);
});
