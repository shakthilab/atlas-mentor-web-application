const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'desktop-ultrawide-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-landscape-992', width: 992, height: 768 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'mobile-large-576', width: 576, height: 900 },
  { name: 'mobile-medium-414', width: 414, height: 896 },
  { name: 'mobile-small-375', width: 375, height: 667 },
  { name: 'mobile-xs-320', width: 320, height: 568 }
];

const OUT_DIR = path.resolve(__dirname, '..', 'reports', 'resolutions');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle' });

  console.log('Logging in with user credentials...');
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  console.log('Current URL after login:', page.url());

  // Navigate explicitly to /admin if redirected elsewhere
  if (!page.url().includes('/admin')) {
    await page.goto('http://localhost:4200/admin', { waitUntil: 'networkidle' });
  }

  // Wait for data & charts to settle
  await page.waitForTimeout(3000);

  const results = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(800);

    // Evaluate layout issues, horizontal overflow, overlapping elements, card widths
    const metrics = await page.evaluate((width) => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
      const hasHorizontalScroll = maxScroll > width + 2;

      // Find overflowing elements
      const overflowingElements = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        // Skip svg paths or inline children
        if (el instanceof SVGElement && el.tagName !== 'svg') continue;
        const rect = el.getBoundingClientRect();
        if (rect.right > width + 2) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className.trim() : '',
            id: el.id || undefined,
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            overflowBy: Math.round(rect.right - width)
          });
        }
      }

      // Check card padding / layout
      const opCards = Array.from(document.querySelectorAll('.op-card')).map(c => {
        const r = c.getBoundingClientRect();
        return {
          width: Math.round(r.width),
          height: Math.round(r.height),
          className: c.className
        };
      });

      // Check floating button position
      const timeFilter = document.querySelector('.dashboard-time-filter');
      let timeFilterRect = null;
      if (timeFilter) {
        const r = timeFilter.getBoundingClientRect();
        timeFilterRect = {
          left: Math.round(r.left),
          right: Math.round(r.right),
          bottom: Math.round(r.bottom),
          top: Math.round(r.top),
          width: Math.round(r.width),
          position: window.getComputedStyle(timeFilter).position
        };
      }

      return {
        viewportWidth: width,
        docWidth,
        maxScroll,
        hasHorizontalScroll,
        overflowCount: overflowingElements.length,
        overflowingElements: overflowingElements.slice(0, 10),
        cardCount: opCards.length,
        timeFilter: timeFilterRect
      };
    }, vp.width);

    const screenshotPath = path.join(OUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    results.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      ...metrics,
      screenshot: screenshotPath
    });

    console.log(`[${vp.name}] Scroll: ${metrics.maxScroll}/${vp.width} (H-Scroll: ${metrics.hasHorizontalScroll}) | Overflow items: ${metrics.overflowCount}`);
    if (metrics.overflowingElements.length > 0) {
      console.log('  Top overflow:', metrics.overflowingElements.slice(0, 3));
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));
  console.log('Finished testing all viewports! Results written to reports/resolutions/results.json');
  await browser.close();
}

run().catch(console.error);
