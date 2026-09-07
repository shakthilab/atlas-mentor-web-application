const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Browser Error]', msg.text());
  });

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:4201/auth/login', { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  
  console.log('2. Submitting form...');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('3. URL after login:', page.url());

  console.log('4. Navigating to /admin/leads...');
  await page.goto('http://localhost:4201/admin/leads', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('5. Current URL:', page.url());

  const outDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\32eccdde-b55a-4911-9b80-ad05fce2638e\\leads-captures';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Desktop capture
  await page.screenshot({ path: path.join(outDir, 'leads-desktop-1440.png'), fullPage: false });
  console.log('Desktop 1440 screenshot saved.');

  // Tablet capture (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'leads-tablet-768.png'), fullPage: false });
  console.log('Tablet 768 screenshot saved.');

  // Mobile Table View capture (390x844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'leads-mobile-390-table.png'), fullPage: false });
  console.log('Mobile 390 table screenshot saved.');

  // Switch to Card View
  const toggleCardBtn = page.locator('.view-mode-toggle button:last-child');
  if (await toggleCardBtn.count() > 0) {
    await toggleCardBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'leads-mobile-390-cards.png'), fullPage: false });
    console.log('Mobile 390 cards screenshot saved.');
  }

  // Mobile XS (320x568)
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'leads-mobile-320.png'), fullPage: false });
  console.log('Mobile 320 screenshot saved.');

  await browser.close();
  console.log('Finished capturing!');
})();
