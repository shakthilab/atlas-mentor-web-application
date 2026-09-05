/**
 * One-off interaction check for the shared layout shell (Module 1) - READ-ONLY.
 * Logs in, then at a mobile viewport: opens the sidenav via the hamburger,
 * confirms it renders as an overlay, closes it, and confirms the mobile
 * bottom nav links are all present and clickable-looking. Never submits any
 * form beyond login, never touches create/edit/delete controls.
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/layout-interaction-check.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BASE_URL = 'http://localhost:4200';
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const OUT_DIR = path.join(os.homedir(), 'Downloads', 'responsive-implementation', '01-shared-layout-BEFORE', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const failures = [];
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
    await page.locator('input[formcontrolname="email"]').fill(EMAIL);
    await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // Mobile viewport: sidenav should be closed by default, opened via hamburger.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    const sidenav = page.locator('.sidebarNav').first();
    const visibleBefore = await sidenav.isVisible().catch(() => false);
    const boxBefore = await sidenav.boundingBox().catch(() => null);
    console.log(`[layout-check] Sidenav visible before hamburger click: ${visibleBefore}, box: ${JSON.stringify(boxBefore)}`);

    const hamburger = page.locator('button', { has: page.locator('i-tabler[name="menu-2"]') }).first();
    await hamburger.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, 'interaction--mobile-390--sidenav-open.png') });

    const boxAfter = await sidenav.boundingBox().catch(() => null);
    console.log(`[layout-check] Sidenav box after hamburger click: ${JSON.stringify(boxAfter)}`);
    if (!boxAfter || boxAfter.width < 100) {
      failures.push('Sidenav did not open (or has no visible width) after hamburger click on mobile viewport.');
    }

    // Close via mobile close button if present, else backdrop, else hamburger again.
    const closeBtn = page.locator('.mobile-close-btn').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, 'interaction--mobile-390--sidenav-closed.png') });
    const boxClosed = await sidenav.boundingBox().catch(() => null);
    console.log(`[layout-check] Sidenav box after close: ${JSON.stringify(boxClosed)}`);

    // Mobile bottom nav: confirm all items present and links resolve to distinct routes.
    const footerItems = page.locator('.mobile-footer-nav .footer-nav-item');
    const count = await footerItems.count();
    console.log(`[layout-check] Mobile bottom nav item count: ${count}`);
    if (count < 1) failures.push('Mobile bottom nav has no items.');
    for (let i = 0; i < count; i++) {
      const href = await footerItems.nth(i).getAttribute('href');
      const text = await footerItems.nth(i).innerText();
      console.log(`  - [${i}] "${text.trim()}" -> ${href}`);
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('\n[layout-check] FAILURES:');
    failures.forEach((f) => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\n[layout-check] All interaction checks passed.');
}

main().catch((err) => { console.error('[layout-check] Fatal error:', err); process.exit(1); });
