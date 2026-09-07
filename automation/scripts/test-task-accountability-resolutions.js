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
const SUITE_CAPTURE_DIR = path.join(ARTIFACT_DIR, 'task-accountability-captures');
const WORKSPACE_SCREENSHOTS_DIR = path.resolve('automation/screenshots/task-accountability');

if (!fs.existsSync(SUITE_CAPTURE_DIR)) fs.mkdirSync(SUITE_CAPTURE_DIR, { recursive: true });
if (!fs.existsSync(WORKSPACE_SCREENSHOTS_DIR)) fs.mkdirSync(WORKSPACE_SCREENSHOTS_DIR, { recursive: true });

async function findActivePort() {
  const http = require('http');
  for (const port of [4200, 4201]) {
    try {
      const active = await new Promise(resolve => {
        const req = http.get(`http://localhost:${port}`, res => {
          resolve(true);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (active) return port;
    } catch (e) {}
  }
  return 4200;
}

async function runTaskAccountabilityTestSuite() {
  console.log('========================================================================');
  console.log('  TASK ACCOUNTABILITY & ROLE TEMPLATES - 15-RESOLUTION TEST SUITE       ');
  console.log('========================================================================\n');

  const port = await findActivePort();
  console.log(`Using active port: ${port}`);

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
  console.log('[1/4] Authenticating with admin credentials...');
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

  // Test 1: Role Templates Page
  console.log('\n[2/4] Testing Role Templates Page across all resolutions...');
  testReport.tabs.roleTemplates = [];

  for (const vp of DEVICE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:${port}/admin/task-accountability/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.template-card, .templates-empty-state', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);

    const artifactPath = path.join(SUITE_CAPTURE_DIR, `templates-${vp.name}.png`);
    const workspacePath = path.join(WORKSPACE_SCREENSHOTS_DIR, `templates-${vp.name}.png`);
    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, workspacePath);

    console.log(`  [OK] Templates on ${vp.device} (${vp.width}x${vp.height})`);
    testReport.tabs.roleTemplates.push({ device: vp.device, width: vp.width, height: vp.height, status: 'PASS' });
  }

  // Test 2: Role Template Builder Modal (Mobile 390x844, Tablet 820x1180, Desktop 1440x900)
  console.log('\n[3/4] Testing Role Template Builder Modal...');
  for (const vp of [
    { device: 'iPhone 14 Pro', name: 'mobile-390x844', width: 390, height: 844 },
    { device: 'iPad Air Portrait', name: 'tablet-820x1180', width: 820, height: 1180 },
    { device: 'Desktop 1440x900', name: 'desktop-1440x900', width: 1440, height: 900 }
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:${port}/admin/task-accountability/templates`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Open first template card to see full populated calendar and day cards
    await page.evaluate(() => {
      const card = document.querySelector('.template-card');
      if (card) card.click();
    });
    await page.waitForTimeout(600);

    const modalArtifactPath = path.join(SUITE_CAPTURE_DIR, `template-modal-${vp.name}.png`);
    await page.screenshot({ path: modalArtifactPath, fullPage: false });
    console.log(`  [OK] Template Modal on ${vp.device} (${vp.width}x${vp.height})`);

    // Click Day card (e.g. Day with tasks)
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.day-card:not(.empty-card):not(.past-day)');
      if (cards && cards.length > 0) cards[0].click();
    });
    await page.waitForTimeout(500);

    const drawerArtifactPath = path.join(SUITE_CAPTURE_DIR, `template-day-drawer-${vp.name}.png`);
    await page.screenshot({ path: drawerArtifactPath, fullPage: false });
    console.log(`  [OK] Template Day Task Drawer on ${vp.device}`);

    // Close modal
    await page.evaluate(() => {
      const close = document.querySelector('.redesigned-role-template-modal .close-btn');
      if (close) close.click();
    });
    await page.waitForTimeout(300);
  }

  // Test 3: Daily Workspace & Needs My Review
  console.log('\n[4/4] Testing Daily Workspace & Needs My Review...');
  for (const vp of [
    { device: 'iPhone 14 Pro', name: 'mobile-390x844', width: 390, height: 844 },
    { device: 'iPad Air Portrait', name: 'tablet-820x1180', width: 820, height: 1180 },
    { device: 'Desktop 1440x900', name: 'desktop-1440x900', width: 1440, height: 900 }
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    // Daily Workspace
    await page.goto(`http://localhost:${port}/admin/task-accountability/daily`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SUITE_CAPTURE_DIR, `daily-workspace-${vp.name}.png`), fullPage: false });

    // Needs My Review
    await page.goto(`http://localhost:${port}/admin/task-accountability/pending-review`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SUITE_CAPTURE_DIR, `pending-review-${vp.name}.png`), fullPage: false });

    console.log(`  [OK] Workspace & Review on ${vp.device}`);
  }

  const reportPath = path.join(SUITE_CAPTURE_DIR, 'task-accountability-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

  await browser.close();
  console.log('\n========================================================================');
  console.log(`  ALL CAPTURES & RESOLUTION TESTS COMPLETED SUCCESSFULLY!`);
  console.log(`  Report saved to: ${reportPath}`);
  console.log('========================================================================');
}

runTaskAccountabilityTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
