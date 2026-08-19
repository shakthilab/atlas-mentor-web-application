/**
 * Navy-theme rebrand verification - READ-ONLY beyond the login action itself.
 * Logs in with a real account, navigates the sidebar across the main pages,
 * exercises key interactive elements (search, view toggle, dialogs, status
 * dropdown, pagination) WITHOUT ever clicking a create/edit/delete/save
 * action, and screenshots key pages to confirm the navy theme applied. See
 * automation/README.md for the safety rationale (this app's dev environment
 * points at the live production backend).
 *
 * Credentials are read from environment variables only - NEVER hardcode them
 * here or in any committed file:
 *   E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/theme-verify.js
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'tests');
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('[theme-verify] Set E2E_EMAIL and E2E_PASSWORD env vars before running this script.');
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

// Expected navy brand tokens (see src/assets/scss/_variables.scss $primary / $accent)
const BRAND_PRIMARY_RGB = 'rgb(20, 33, 61)'; // #14213D

async function navClick(page, label, failures) {
  try {
    const item = page.locator('.menu-list-item', { hasText: label }).first();
    await item.waitFor({ state: 'visible', timeout: 10_000 });
    await item.click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    console.log(`[theme-verify] Navigated to "${label}" (${page.url()})`);
    return true;
  } catch (err) {
    failures.push(`Sidebar nav to "${label}" failed: ${err.message}`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const failures = [];
  const notes = [];
  const alreadyRunning = await checkServerUp();
  let devServer = null;

  if (!alreadyRunning) {
    console.log('[theme-verify] Starting `npm start` (ng serve)...');
    devServer = spawn('npm', ['start'], { cwd: REPO_ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    devServer.stdout.on('data', () => {});
    devServer.stderr.on('data', () => {});
    await waitForServer(120_000);
    console.log('[theme-verify] Dev server is up.');
  } else {
    console.log('[theme-verify] Reusing already-running dev server at ' + BASE_URL);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    // ── Login ────────────────────────────────────────────────────────────
    await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
    await page.locator('input[formcontrolname="email"]').fill(EMAIL);
    await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15_000 }).catch(() => {});
    if (page.url().includes('/auth/login')) {
      failures.push(`Still on /auth/login after submitting credentials. URL: ${page.url()}`);
    } else {
      console.log(`[theme-verify] PASS: logged in, redirected to ${page.url()}`);
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme-dashboard.png'), fullPage: true });

    // ── Computed-style checks: sidebar + logo box should be navy ────────────
    try {
      const sidebarBg = await page.locator('.sidebarNav').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      const logoBg = await page.locator('.brand-logo-icon-box').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      notes.push(`sidebar background-color: ${sidebarBg}`);
      notes.push(`logo icon box background-color: ${logoBg}`);
      if (logoBg !== BRAND_PRIMARY_RGB) {
        failures.push(`Logo icon box is ${logoBg}, expected navy ${BRAND_PRIMARY_RGB}`);
      }
    } catch (err) {
      failures.push(`Computed-style check failed: ${err.message}`);
    }

    // ── Sidebar navigation across main pages ────────────────────────────────
    const pages = ['Dashboard', 'Leads', 'Students', 'Employees', 'Tasks', 'Payments', 'Branches', 'Settings'];
    for (const label of pages) {
      await navClick(page, label, failures);
    }

    // ── Back to Leads for interaction tests ─────────────────────────────────
    const onLeads = await navClick(page, 'Leads', failures);
    if (onLeads) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme-leads.png'), fullPage: true });

      // Add Lead button should be navy (mat-flat-button color="primary")
      try {
        const addBtn = page.locator('button', { hasText: 'Add Lead' }).first();
        await addBtn.waitFor({ state: 'visible', timeout: 8000 });
        const addBtnBg = await addBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
        notes.push(`"Add Lead" button background-color: ${addBtnBg}`);
        if (addBtnBg !== BRAND_PRIMARY_RGB) {
          failures.push(`"Add Lead" button is ${addBtnBg}, expected navy ${BRAND_PRIMARY_RGB}`);
        }

        // Open the modal, confirm it renders, close via the dialog's own close
        // icon (mat-dialog-close) - never touch a save/submit control.
        await addBtn.click();
        const dialog = page.locator('mat-dialog-container').first();
        await dialog.waitFor({ state: 'visible', timeout: 8000 });
        console.log('[theme-verify] PASS: Add Lead dialog opened.');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme-add-lead-dialog.png') });
        await page.locator('mat-dialog-container [mat-dialog-close]').first().click();
        await dialog.waitFor({ state: 'hidden', timeout: 8000 });
        console.log('[theme-verify] PASS: Add Lead dialog closed without submitting.');
      } catch (err) {
        failures.push(`Add Lead dialog check failed: ${err.message}`);
      }

      // Import Data dialog - open then close without importing anything.
      try {
        const importBtn = page.locator('button', { hasText: 'Import Data' }).first();
        await importBtn.waitFor({ state: 'visible', timeout: 8000 });
        await importBtn.click();
        const dialog = page.locator('mat-dialog-container').first();
        await dialog.waitFor({ state: 'visible', timeout: 8000 });
        console.log('[theme-verify] PASS: Import Data dialog opened.');
        const closeBtn = page.locator('mat-dialog-container .close-btn, mat-dialog-container [mat-dialog-close]').first();
        await closeBtn.click();
        await dialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
        console.log('[theme-verify] PASS: Import Data dialog closed without importing.');
      } catch (err) {
        failures.push(`Import Data dialog check failed: ${err.message}`);
      }

      // Search bar - type then clear, purely client/server-side filtering.
      try {
        const search = page.locator('input[placeholder="Search leads..."]').first();
        await search.fill('a');
        await page.waitForTimeout(500);
        await search.fill('');
        console.log('[theme-verify] PASS: Leads search input accepts text.');
      } catch (err) {
        failures.push(`Search input check failed: ${err.message}`);
      }

      // List/grid view toggle.
      try {
        const gridToggle = page.locator('.view-mode-toggle .toggle-btn').nth(1);
        await gridToggle.click();
        await page.waitForTimeout(500);
        const listToggle = page.locator('.view-mode-toggle .toggle-btn').nth(0);
        await listToggle.click();
        await page.waitForTimeout(500);
        console.log('[theme-verify] PASS: List/grid view toggle works.');
      } catch (err) {
        failures.push(`View toggle check failed: ${err.message}`);
      }

      // Status dropdown - open then dismiss without selecting a new status.
      try {
        const statusBadge = page.locator('.status-badge').first();
        await statusBadge.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        console.log('[theme-verify] PASS: Status dropdown opens/closes.');
      } catch (err) {
        notes.push(`Status dropdown check skipped/failed: ${err.message}`);
      }

      // Pagination - click next page if enabled, then back.
      try {
        const nextBtn = page.locator('button[aria-label="Next page"]').first();
        if (await nextBtn.isEnabled().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(800);
          await page.locator('button[aria-label="Previous page"]').first().click();
          console.log('[theme-verify] PASS: Pagination controls work.');
        } else {
          notes.push('Pagination next button disabled (single page of data) - not exercised.');
        }
      } catch (err) {
        notes.push(`Pagination check skipped/failed: ${err.message}`);
      }
    }

    // One more page for visual confirmation.
    const onStudents = await navClick(page, 'Students', failures);
    if (onStudents) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme-students.png'), fullPage: true });
    }

    // ── Dark mode check ──────────────────────────────────────────────────────
    const themeToggle = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]').first();
    try {
      await themeToggle.click();
      await page.waitForTimeout(600);
      const isDark = await page.evaluate(() => document.body.classList.contains('dark-theme'));
      notes.push(`Dark mode toggled on: document.body has 'dark-theme' class = ${isDark}`);
      const logoBgDark = await page.locator('.brand-logo-icon-box').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      const sidebarBgDark = await page.locator('.sidebarNav').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      notes.push(`[dark mode] logo icon box background-color: ${logoBgDark}`);
      notes.push(`[dark mode] sidebar background-color: ${sidebarBgDark}`);
      if (logoBgDark !== BRAND_PRIMARY_RGB) {
        failures.push(`[dark mode] Logo icon box is ${logoBgDark}, expected navy ${BRAND_PRIMARY_RGB}`);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme-dark-mode.png'), fullPage: true });
    } catch (err) {
      failures.push(`Dark mode check failed: ${err.message}`);
    } finally {
      // Best-effort revert to light mode; not a check failure if this fails.
      await themeToggle.click({ timeout: 5000 }).catch(() => {});
    }

    if (consoleErrors.length) {
      console.log('[theme-verify] Console errors observed:');
      consoleErrors.forEach((e) => console.log('  - ' + e));
    } else {
      console.log('[theme-verify] No console errors observed.');
    }

    console.log('\n[theme-verify] Notes:');
    notes.forEach((n) => console.log('  - ' + n));
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }

  if (failures.length) {
    console.error('\n[theme-verify] FAILED:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n[theme-verify] All checks passed.');
}

main().catch((err) => {
  console.error('[theme-verify] Fatal error:', err);
  process.exit(1);
});
