const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DEVICE_VIEWPORTS = [
  // Mobile devices
  { device: 'iPhone SE / Small Phone', name: 'mobile-375x667', width: 375, height: 667, category: 'Mobile' },
  { device: 'iPhone 12/13/14/15 Pro', name: 'mobile-390x844', width: 390, height: 844, category: 'Mobile' },
  { device: 'iPhone 14/15 Pro Max / Plus', name: 'mobile-430x932', width: 430, height: 932, category: 'Mobile' },
  { device: 'Samsung Galaxy S20 / Android', name: 'mobile-360x800', width: 360, height: 800, category: 'Mobile' },
  { device: 'Ultra-Compact Mobile', name: 'mobile-320x568', width: 320, height: 568, category: 'Mobile' },

  // Tablet devices (Portrait & Landscape)
  { device: 'iPad Mini / Tablet Portrait', name: 'tablet-768x1024', width: 768, height: 1024, category: 'Tablet' },
  { device: 'iPad Air (Portrait)', name: 'tablet-820x1180', width: 820, height: 1180, category: 'Tablet' },
  { device: 'Surface Pro (Portrait)', name: 'tablet-912x1368', width: 912, height: 1368, category: 'Tablet' },
  { device: 'iPad Landscape / Small Laptop', name: 'tablet-1024x768', width: 1024, height: 768, category: 'Tablet / Laptop' },
  { device: 'iPad Air Landscape', name: 'tablet-1180x820', width: 1180, height: 820, category: 'Tablet / Laptop' },

  // Laptops & Desktops
  { device: 'Standard Laptop (1280x800)', name: 'laptop-1280x800', width: 1280, height: 800, category: 'Laptop' },
  { device: 'HD Laptop (1366x768)', name: 'laptop-1366x768', width: 1366, height: 768, category: 'Laptop' },
  { device: 'MacBook Pro / Desktop (1440x900)', name: 'desktop-1440x900', width: 1440, height: 900, category: 'Desktop' },
  { device: 'FHD Desktop (1920x1080)', name: 'desktop-1920x1080', width: 1920, height: 1080, category: 'Desktop' },
  { device: '2K QHD Display (2560x1440)', name: 'desktop-2560x1440', width: 2560, height: 1440, category: 'Ultra-wide / 2K' }
];

const REPORT_DIR = path.resolve(__dirname, '..', 'reports', 'all-resolutions');
const ARTIFACT_DIR = path.resolve('C:/Users/Hp/.gemini/antigravity-ide/brain/32eccdde-b55a-4911-9b80-ad05fce2638e');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function testAll() {
  console.log('=== Starting Admin Dashboard Multi-Resolution Test Suite ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('[1/3] Logging in as Jitesh.gupta@atlasmentor.com...');
  await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  if (!page.url().includes('/admin')) {
    await page.goto('http://localhost:4200/admin', { waitUntil: 'networkidle' });
  }

  // Allow charts and data calls to complete
  await page.waitForTimeout(3000);
  console.log('[2/3] Post-login landing verified on ' + page.url());

  console.log('[3/3] Testing across 15 device resolutions...');
  const testResults = [];

  for (const vp of DEVICE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);

    const metrics = await page.evaluate((width) => {
      const doc = document.documentElement;
      const body = document.body;
      const docWidth = doc.offsetWidth;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const hasHorizontalScroll = scrollWidth > width + 1;

      // Check card count
      const cards = document.querySelectorAll('.op-card');
      
      // Check tables
      const tables = document.querySelectorAll('.app-data-table__scroll, table');

      // Check heatmap
      const heatmap = document.querySelector('.heatmap-grid');
      let heatmapWidth = 0;
      if (heatmap) {
        heatmapWidth = Math.round(heatmap.getBoundingClientRect().width);
      }

      // Check floating button
      const timeFilter = document.querySelector('.dashboard-time-filter');
      let timeFilterPos = null;
      if (timeFilter) {
        const r = timeFilter.getBoundingClientRect();
        timeFilterPos = {
          bottom: Math.round(window.innerHeight - r.bottom),
          right: Math.round(window.innerWidth - r.right),
          width: Math.round(r.width),
          height: Math.round(r.height)
        };
      }

      // Check bottom nav bar if visible
      const mobileNav = document.querySelector('.mobile-footer-nav');
      let mobileNavHeight = 0;
      if (mobileNav && window.getComputedStyle(mobileNav).display !== 'none') {
        mobileNavHeight = Math.round(mobileNav.getBoundingClientRect().height);
      }

      return {
        viewportWidth: width,
        docWidth,
        scrollWidth,
        hasHorizontalScroll,
        cardCount: cards.length,
        tableCount: tables.length,
        heatmapWidth,
        timeFilterPos,
        mobileNavHeight,
        filterAboveNav: mobileNavHeight > 0 && timeFilterPos ? timeFilterPos.bottom >= mobileNavHeight : true
      };
    }, vp.width);

    const screenshotFilename = `${vp.name}.png`;
    const screenshotPath = path.join(REPORT_DIR, screenshotFilename);
    await page.screenshot({ path: screenshotPath });

    // Copy directly to artifact dir if exists
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(screenshotPath, path.join(ARTIFACT_DIR, screenshotFilename));
    }

    const passed = !metrics.hasHorizontalScroll && metrics.filterAboveNav;

    testResults.push({
      device: vp.device,
      resolution: `${vp.width}x${vp.height}`,
      category: vp.category,
      scrollWidth: metrics.scrollWidth,
      hasHorizontalScroll: metrics.hasHorizontalScroll,
      cardCount: metrics.cardCount,
      filterAboveNav: metrics.filterAboveNav,
      timeFilterPos: metrics.timeFilterPos,
      mobileNavHeight: metrics.mobileNavHeight,
      status: passed ? 'PASS' : 'FAIL',
      screenshot: screenshotFilename
    });

    console.log(`  ✓ [${vp.category}] ${vp.device} (${vp.width}x${vp.height}) -> Status: ${passed ? 'PASS' : 'FAIL'} | H-Scroll: ${metrics.hasHorizontalScroll} | Filter OK: ${metrics.filterAboveNav}`);
  }

  const report = {
    testedAt: new Date().toISOString(),
    account: 'Jitesh.gupta@atlasmentor.com',
    url: page.url(),
    totalDevices: DEVICE_VIEWPORTS.length,
    passedCount: testResults.filter(r => r.status === 'PASS').length,
    failedCount: testResults.filter(r => r.status === 'FAIL').length,
    results: testResults,
    consoleErrors
  };

  fs.writeFileSync(path.join(REPORT_DIR, 'resolution-report.json'), JSON.stringify(report, null, 2));
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'resolution-report.json'), JSON.stringify(report, null, 2));
  }

  console.log(`\n=== Testing Complete: ${report.passedCount}/${report.totalDevices} PASSED ===`);
  await browser.close();
}

testAll().catch(console.error);
