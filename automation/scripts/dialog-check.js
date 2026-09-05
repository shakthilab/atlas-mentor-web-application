/**
 * Dialog responsive check - READ-ONLY. Opens a dialog via its trigger button,
 * screenshots it across breakpoints, checks for overflow inside the dialog,
 * then closes it WITHOUT submitting (Escape key / close icon only).
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... node automation/scripts/dialog-check.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EMAIL = process.env.E2E_EMAIL, PASSWORD = process.env.E2E_PASSWORD;
const OUT_DIR = path.join(os.homedir(), 'Downloads', 'responsive-implementation', process.env.DIALOG_CHECK_DIR || '03-dialogs-BEFORE', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BREAKPOINTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 },
];

async function checkDialog(page, { label, url, triggerSelector, dialogSelector }) {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('http://localhost:4200' + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    try {
      // Pick whichever of the comma-separated selectors is actually visible at
      // this breakpoint (desktop button vs mobile FAB toggle via CSS display).
      const candidates = triggerSelector.split(',').map((s) => s.trim());
      let trigger = null;
      for (const sel of candidates) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible().catch(() => false)) { trigger = loc; break; }
      }
      if (!trigger) throw new Error(`No visible trigger among: ${triggerSelector}`);
      await trigger.click();
      const dialog = page.locator(dialogSelector).first();
      await dialog.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(500);

      const overflow = await dialog.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        rect: el.getBoundingClientRect(),
      }));
      console.log(`[dialog-check] ${label} @ ${bp.name}: dialog rect=${JSON.stringify(overflow.rect)} scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`);
      if (overflow.scrollWidth > overflow.clientWidth + 1) {
        console.log(`  ⚠ HORIZONTAL OVERFLOW inside dialog content`);
      }
      if (overflow.rect.x < 0 || overflow.rect.right > bp.width) {
        console.log(`  ⚠ Dialog extends outside viewport bounds (x=${overflow.rect.x}, right=${overflow.rect.right}, viewport=${bp.width})`);
      }

      await page.screenshot({ path: path.join(OUT_DIR, `${label}--${bp.name}.png`) });

      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch (err) {
      console.log(`[dialog-check] ${label} @ ${bp.name}: FAILED - ${err.message}`);
    }
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill(EMAIL);
  await page.locator('input[formcontrolname="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  if (!process.env.DIALOG_CHECK_EMPLOYEE_ONLY) {
    await checkDialog(page, {
      label: 'add-lead',
      url: '/admin/leads',
      triggerSelector: 'button.add-btn, button.mobile-fab',
      dialogSelector: 'mat-dialog-container',
    });
  }

  await checkDialog(page, {
    label: 'add-employee',
    url: '/admin/employees',
    triggerSelector: 'button.add-btn, button.employee-mobile-fab',
    dialogSelector: 'mat-dialog-container',
  });

  await browser.close();
  console.log('\n[dialog-check] Done. Screenshots: ' + OUT_DIR);
}
main().catch((e) => { console.error(e); process.exit(1); });
