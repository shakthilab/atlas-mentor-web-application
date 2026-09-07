const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const devices = [
  { name: 'Mobile XS 320x568', width: 320, height: 568, category: 'Mobile' },
  { name: 'Samsung Galaxy 360x800', width: 360, height: 800, category: 'Mobile' },
  { name: 'iPhone SE 375x667', width: 375, height: 667, category: 'Mobile' },
  { name: 'iPhone 12/13/14 Pro 390x844', width: 390, height: 844, category: 'Mobile' },
  { name: 'iPhone 14/15 Pro Max 430x932', width: 430, height: 932, category: 'Mobile' },
  { name: 'iPad Mini Portrait 768x1024', width: 768, height: 1024, category: 'Tablet' },
  { name: 'iPad Air Portrait 820x1180', width: 820, height: 1180, category: 'Tablet' },
  { name: 'iPad Landscape 1024x768', width: 1024, height: 768, category: 'Tablet/Laptop' },
  { name: 'Standard Laptop 1280x800', width: 1280, height: 800, category: 'Laptop' },
  { name: 'HD Laptop 1366x768', width: 1366, height: 768, category: 'Laptop' },
  { name: 'MacBook Pro Desktop 1440x900', width: 1440, height: 900, category: 'Desktop' },
  { name: 'FHD Desktop 1920x1080', width: 1920, height: 1080, category: 'Desktop' }
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:4201/auth/login', { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  console.log('Navigating to /admin/students...');
  await page.goto('http://localhost:4201/admin/students', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const outDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\32eccdde-b55a-4911-9b80-ad05fce2638e\\students-captures';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = [];

  for (const dev of devices) {
    await page.setViewportSize({ width: dev.width, height: dev.height });
    await page.waitForTimeout(600);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalScroll = scrollWidth > clientWidth + 1;

    const mobileFab = page.locator('.mobile-fab');
    const fabVisible = await mobileFab.isVisible().catch(() => false);

    const safeName = dev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const screenshotPath = path.join(outDir, `students-${safeName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`[${dev.category}] ${dev.name} (${dev.width}x${dev.height}) -> H-Scroll: ${hasHorizontalScroll} (sw=${scrollWidth}, cw=${clientWidth}) | FAB: ${fabVisible}`);

    results.push({
      device: dev.name,
      width: dev.width,
      height: dev.height,
      category: dev.category,
      scrollWidth,
      clientWidth,
      hasHorizontalScroll,
      fabVisible,
      screenshot: screenshotPath
    });
  }

  // Also test card view on 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  const cardViewBtn = page.locator('.view-mode-toggle button:last-child');
  if (await cardViewBtn.count() > 0) {
    await cardViewBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'students-mobile-card-view.png') });
    console.log('Captured mobile card view screenshot');
  }

  fs.writeFileSync(path.join(outDir, 'students-results.json'), JSON.stringify(results, null, 2));
  console.log('Done testing students responsive baseline!');
  await browser.close();
})();
