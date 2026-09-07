const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DEVICE_VIEWPORTS = [
  // Mobile devices
  { device: 'Ultra-Compact Mobile (320x568)', name: 'mobile-320x568', width: 320, height: 568, category: 'Mobile' },
  { device: 'Samsung Galaxy S20 (360x800)', name: 'mobile-360x800', width: 360, height: 800, category: 'Mobile' },
  { device: 'iPhone SE / Small Phone (375x667)', name: 'mobile-375x667', width: 375, height: 667, category: 'Mobile' },
  { device: 'iPhone 12/13/14/15 Pro (390x844)', name: 'mobile-390x844', width: 390, height: 844, category: 'Mobile' },
  { device: 'iPhone 14/15 Pro Max (430x932)', name: 'mobile-430x932', width: 430, height: 932, category: 'Mobile' },
  { device: 'Mobile Large / Phablet (576x900)', name: 'mobile-576x900', width: 576, height: 900, category: 'Mobile' },

  // Tablet devices (Portrait & Landscape)
  { device: 'iPad Mini / Tablet Portrait (768x1024)', name: 'tablet-768x1024', width: 768, height: 1024, category: 'Tablet' },
  { device: 'iPad Air Portrait (820x1180)', name: 'tablet-820x1180', width: 820, height: 1180, category: 'Tablet' },
  { device: 'Surface Pro Portrait (912x1368)', name: 'tablet-912x1368', width: 912, height: 1368, category: 'Tablet' },
  { device: 'Tablet Landscape (992x768)', name: 'tablet-992x768', width: 992, height: 768, category: 'Tablet / Laptop' },
  { device: 'iPad Landscape / Small Laptop (1024x768)', name: 'tablet-1024x768', width: 1024, height: 768, category: 'Tablet / Laptop' },
  { device: 'iPad Air Landscape (1180x820)', name: 'tablet-1180x820', width: 1180, height: 820, category: 'Tablet / Laptop' },

  // Laptops & Desktops
  { device: 'Standard Laptop (1280x800)', name: 'laptop-1280x800', width: 1280, height: 800, category: 'Laptop' },
  { device: 'HD Laptop (1366x768)', name: 'laptop-1366x768', width: 1366, height: 768, category: 'Laptop' },
  { device: 'MacBook Pro / Desktop (1440x900)', name: 'desktop-1440x900', width: 1440, height: 900, category: 'Desktop' },
  { device: 'FHD Desktop (1920x1080)', name: 'desktop-1920x1080', width: 1920, height: 1080, category: 'Desktop' },
  { device: '2K QHD Display (2560x1440)', name: 'desktop-2560x1440', width: 2560, height: 1440, category: 'Ultra-wide / 2K' }
];

const ARTIFACT_DIR = path.resolve('C:/Users/Hp/.gemini/antigravity-ide/brain/32eccdde-b55a-4911-9b80-ad05fce2638e');
const SUITE_CAPTURE_DIR = path.join(ARTIFACT_DIR, 'organization-captures');
const WORKSPACE_SCREENSHOTS_DIR = path.resolve('automation/screenshots/organization');

if (!fs.existsSync(SUITE_CAPTURE_DIR)) fs.mkdirSync(SUITE_CAPTURE_DIR, { recursive: true });
if (!fs.existsSync(WORKSPACE_SCREENSHOTS_DIR)) fs.mkdirSync(WORKSPACE_SCREENSHOTS_DIR, { recursive: true });

async function detectRunningPort() {
  const ports = [4200, 4201, 4202];
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/auth/login`);
      if (response.ok || response.status < 500) {
        return port;
      }
    } catch (e) {}
  }
  return 4200;
}

async function runOrganizationTestSuite() {
  console.log('========================================================================');
  console.log('  ORGANIZATION TABS (5) - 17-DEVICE RESPONSIVE TEST SUITE               ');
  console.log('========================================================================\n');

  const port = await detectRunningPort();
  console.log(`Detected active dev server port: ${port}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  // Step 1: Login
  console.log('[1/6] Authenticating with Jitesh.gupta@atlasmentor.com...');
  await page.goto(`http://localhost:${port}/auth/login`, { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const testReport = {
    timestamp: new Date().toISOString(),
    totalDevicesTested: DEVICE_VIEWPORTS.length,
    tabs: {}
  };

  const tabsConfig = [
    {
      name: 'branches',
      url: `http://localhost:${port}/admin/branches`,
      fabSelector: '.branch-mobile-fab',
      label: 'BRANCHES',
      cardSelector: '.branch-card',
      addBtnSelector: '.desktop-add-btn',
      dialogTest: async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(400);
        const fab = page.locator('.branch-mobile-fab');
        if (await fab.isVisible()) {
          await fab.click();
          await page.waitForTimeout(600);
          const modalFile = path.join(SUITE_CAPTURE_DIR, 'branches-mobile-add-dialog.png');
          await page.screenshot({ path: modalFile, fullPage: false });
          fs.copyFileSync(modalFile, path.join(WORKSPACE_SCREENSHOTS_DIR, 'branches-mobile-add-dialog.png'));
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }
    },
    {
      name: 'companies',
      url: `http://localhost:${port}/admin/companies`,
      fabSelector: '.company-mobile-fab',
      label: 'COMPANIES',
      cardSelector: '.company-card',
      addBtnSelector: '.desktop-add-btn',
      dialogTest: async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(400);
        const fab = page.locator('.company-mobile-fab');
        if (await fab.isVisible()) {
          await fab.click();
          await page.waitForTimeout(600);
          const modalFile = path.join(SUITE_CAPTURE_DIR, 'companies-mobile-add-dialog.png');
          await page.screenshot({ path: modalFile, fullPage: false });
          fs.copyFileSync(modalFile, path.join(WORKSPACE_SCREENSHOTS_DIR, 'companies-mobile-add-dialog.png'));
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }
    },
    {
      name: 'hierarchy',
      url: `http://localhost:${port}/admin/hierarchy`,
      fabSelector: null,
      label: 'HIERARCHY',
      cardSelector: '.h-node-card',
      addBtnSelector: null,
      dialogTest: null
    },
    {
      name: 'office-cameras',
      url: `http://localhost:${port}/admin/office-cameras`,
      fabSelector: null,
      label: 'OFFICE CAMERAS',
      cardSelector: '.camera-item-card',
      addBtnSelector: null,
      dialogTest: null
    },
    {
      name: 'referrals',
      url: `http://localhost:${port}/admin/referrals`,
      fabSelector: '.referral-mobile-fab',
      label: 'REFERRALS',
      cardSelector: '.referral-card',
      addBtnSelector: '.desktop-add-btn',
      dialogTest: async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(400);
        const fab = page.locator('.referral-mobile-fab');
        if (await fab.isVisible()) {
          await fab.click();
          await page.waitForTimeout(600);
          const modalFile = path.join(SUITE_CAPTURE_DIR, 'referrals-mobile-add-dialog.png');
          await page.screenshot({ path: modalFile, fullPage: false });
          fs.copyFileSync(modalFile, path.join(WORKSPACE_SCREENSHOTS_DIR, 'referrals-mobile-add-dialog.png'));
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }
      }
    }
  ];

  let step = 2;
  for (const tab of tabsConfig) {
    console.log(`\n[${step}/6] Testing ${tab.label} Tab (${tab.url})...`);
    await page.goto(tab.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const tabResults = [];
    for (const vp of DEVICE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);

      const metrics = await page.evaluate(({ width, fabSel, cardSel }) => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const hasHorizontalScroll = scrollWidth > width + 1;

        const mobileCards = document.querySelectorAll('.mobile-card');
        const tableRows = document.querySelectorAll('.app-data-table__table tbody tr');
        const customCards = cardSel ? document.querySelectorAll(cardSel) : [];

        let mobileFabPos = null;
        if (fabSel) {
          const mobileFab = document.querySelector(fabSel);
          if (mobileFab) {
            const r = mobileFab.getBoundingClientRect();
            mobileFabPos = {
              visible: r.width > 0 && r.height > 0 && window.getComputedStyle(mobileFab).display !== 'none',
              bottom: window.innerHeight - r.bottom,
              right: window.innerWidth - r.right
            };
          }
        }

        return {
          scrollWidth,
          viewportWidth: width,
          hasHorizontalScroll,
          mobileCardsCount: mobileCards.length,
          tableRowsCount: tableRows.length,
          customCardsCount: customCards.length,
          mobileFab: mobileFabPos
        };
      }, { width: vp.width, fabSel: tab.fabSelector, cardSel: tab.cardSelector });

      const shotName = `${tab.name}-${vp.name}.png`;
      const artifactPath = path.join(SUITE_CAPTURE_DIR, shotName);
      const wsPath = path.join(WORKSPACE_SCREENSHOTS_DIR, shotName);

      await page.screenshot({ path: artifactPath, fullPage: true });
      fs.copyFileSync(artifactPath, wsPath);

      const statusIcon = !metrics.hasHorizontalScroll ? '✅' : '❌';
      console.log(`  ${statusIcon} ${vp.device.padEnd(42)} | scrollWidth: ${metrics.scrollWidth}px (max: ${vp.width}px) | H-Scroll: ${metrics.hasHorizontalScroll}`);

      tabResults.push({
        device: vp.device,
        name: vp.name,
        category: vp.category,
        resolution: `${vp.width}x${vp.height}`,
        hasHorizontalScroll: metrics.hasHorizontalScroll,
        scrollWidth: metrics.scrollWidth,
        mobileFab: metrics.mobileFab,
        screenshot: shotName
      });
    }

    // Modal dialog capture if supported
    if (tab.dialogTest) {
      console.log(`  📸 Capturing modal dialog for ${tab.label}...`);
      await tab.dialogTest();
    }

    testReport.tabs[tab.name] = tabResults;
    step++;
  }

  await browser.close();

  // Save report
  const reportPath = path.join(SUITE_CAPTURE_DIR, 'organization-15-resolutions-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  fs.copyFileSync(reportPath, path.join(WORKSPACE_SCREENSHOTS_DIR, 'organization-15-resolutions-report.json'));

  console.log('\n========================================================================');
  console.log(`  TEST RUN COMPLETE - Report saved to: ${reportPath}`);
  console.log('========================================================================');
}

runOrganizationTestSuite().catch(err => {
  console.error('Fatal error in Organization test suite:', err);
  process.exit(1);
});
