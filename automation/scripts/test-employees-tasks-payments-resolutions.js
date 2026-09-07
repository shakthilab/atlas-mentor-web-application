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
const SUITE_CAPTURE_DIR = path.join(ARTIFACT_DIR, 'employees-tasks-payments-captures');
const WORKSPACE_SCREENSHOTS_DIR = path.resolve('automation/screenshots/all-tabs');

if (!fs.existsSync(SUITE_CAPTURE_DIR)) fs.mkdirSync(SUITE_CAPTURE_DIR, { recursive: true });
if (!fs.existsSync(WORKSPACE_SCREENSHOTS_DIR)) fs.mkdirSync(WORKSPACE_SCREENSHOTS_DIR, { recursive: true });

async function runFullTestSuite() {
  console.log('========================================================================');
  console.log('  EMPLOYEES, TASKS & PAYMENTS - 15-DEVICE RESPONSIVE TEST SUITE         ');
  console.log('========================================================================\n');

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
  console.log('[1/4] Authenticating with Jitesh.gupta@atlasmentor.com on port 4201...');
  await page.goto('http://localhost:4201/auth/login', { waitUntil: 'networkidle' });
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

  // ==========================================
  // SECTION A: EMPLOYEES TAB
  // ==========================================
  console.log('\n[2/4] Testing EMPLOYEES Tab (/admin/employees)...');
  await page.goto('http://localhost:4201/admin/employees', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const employeesResults = [];
  for (const vp of DEVICE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate((width) => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const hasHorizontalScroll = scrollWidth > width + 1;

      const mobileCards = document.querySelectorAll('.mobile-card');
      const tableRows = document.querySelectorAll('.app-data-table__table tbody tr');
      const cardViewItems = document.querySelectorAll('.employee-card');

      const mobileFab = document.querySelector('.employee-mobile-fab');
      let mobileFabPos = null;
      if (mobileFab) {
        const r = mobileFab.getBoundingClientRect();
        mobileFabPos = {
          visible: r.width > 0 && r.height > 0 && window.getComputedStyle(mobileFab).display !== 'none',
          bottom: window.innerHeight - r.bottom,
          right: window.innerWidth - r.right
        };
      }

      return {
        viewportWidth: width,
        scrollWidth,
        hasHorizontalScroll,
        mobileCardsCount: mobileCards.length,
        tableRowsCount: tableRows.length,
        cardViewItemsCount: cardViewItems.length,
        mobileFabPos
      };
    }, vp.width);

    const screenshotName = `employees-${vp.name}.png`;
    const artifactPath = path.join(SUITE_CAPTURE_DIR, screenshotName);
    const workspacePath = path.join(WORKSPACE_SCREENSHOTS_DIR, screenshotName);
    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, workspacePath);

    employeesResults.push({
      device: vp.device,
      resolution: `${vp.width}x${vp.height}`,
      category: vp.category,
      hasHorizontalScroll: metrics.hasHorizontalScroll,
      scrollWidth: metrics.scrollWidth,
      mobileCardsCount: metrics.mobileCardsCount,
      mobileFabVisible: metrics.mobileFabPos ? metrics.mobileFabPos.visible : false,
      mobileFabBottom: metrics.mobileFabPos ? `${Math.round(metrics.mobileFabPos.bottom)}px` : 'N/A',
      screenshot: screenshotName,
      status: !metrics.hasHorizontalScroll ? 'PASSED' : 'FAILED'
    });

    const statusBadge = !metrics.hasHorizontalScroll ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${statusBadge} [Employees] ${vp.device.padEnd(45)} | Width: ${vp.width}px -> ScrollWidth: ${metrics.scrollWidth}px | FAB: ${metrics.mobileFabPos?.visible ? 'Visible' : 'Hidden'}`);
  }

  // Test Employees Card View & Add Dialog on Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  // Switch to Card View
  const empCardToggle = page.locator('.view-mode-toggle button').nth(1);
  if (await empCardToggle.count() > 0) {
    await empCardToggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SUITE_CAPTURE_DIR, 'employees-mobile-card-view.png') });
    // Switch back to table
    await page.locator('.view-mode-toggle button').nth(0).click();
    await page.waitForTimeout(300);
  }

  // Click Mobile FAB to open Add Employee Dialog
  const empFab = page.locator('.employee-mobile-fab');
  if (await empFab.count() > 0 && await empFab.isVisible()) {
    await empFab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SUITE_CAPTURE_DIR, 'employees-mobile-add-dialog.png') });
    // Close dialog
    const closeBtn = page.locator('app-add-employee-dialog button.text-muted, app-add-employee-dialog mat-dialog-actions button').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  testReport.tabs.employees = employeesResults;

  // ==========================================
  // SECTION B: TASKS TAB
  // ==========================================
  console.log('\n[3/4] Testing TASKS Tab (/admin/tasks)...');
  await page.goto('http://localhost:4201/admin/tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const tasksResults = [];
  for (const vp of DEVICE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate((width) => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const hasHorizontalScroll = scrollWidth > width + 1;

      const statCards = document.querySelectorAll('.stat-card');
      const taskRows = document.querySelectorAll('.task-row, .mat-mdc-table tbody tr');

      const mobileFab = document.querySelector('.mobile-fab-create');
      let mobileFabPos = null;
      if (mobileFab) {
        const r = mobileFab.getBoundingClientRect();
        mobileFabPos = {
          visible: r.width > 0 && r.height > 0 && window.getComputedStyle(mobileFab).display !== 'none',
          bottom: window.innerHeight - r.bottom,
          right: window.innerWidth - r.right
        };
      }

      return {
        viewportWidth: width,
        scrollWidth,
        hasHorizontalScroll,
        statCardsCount: statCards.length,
        taskRowsCount: taskRows.length,
        mobileFabPos
      };
    }, vp.width);

    const screenshotName = `tasks-${vp.name}.png`;
    const artifactPath = path.join(SUITE_CAPTURE_DIR, screenshotName);
    const workspacePath = path.join(WORKSPACE_SCREENSHOTS_DIR, screenshotName);
    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, workspacePath);

    tasksResults.push({
      device: vp.device,
      resolution: `${vp.width}x${vp.height}`,
      category: vp.category,
      hasHorizontalScroll: metrics.hasHorizontalScroll,
      scrollWidth: metrics.scrollWidth,
      statCardsCount: metrics.statCardsCount,
      mobileFabVisible: metrics.mobileFabPos ? metrics.mobileFabPos.visible : false,
      mobileFabBottom: metrics.mobileFabPos ? `${Math.round(metrics.mobileFabPos.bottom)}px` : 'N/A',
      screenshot: screenshotName,
      status: !metrics.hasHorizontalScroll ? 'PASSED' : 'FAILED'
    });

    const statusBadge = !metrics.hasHorizontalScroll ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${statusBadge} [Tasks]     ${vp.device.padEnd(45)} | Width: ${vp.width}px -> ScrollWidth: ${metrics.scrollWidth}px | FAB: ${metrics.mobileFabPos?.visible ? 'Visible' : 'Hidden'}`);
  }

  testReport.tabs.tasks = tasksResults;

  // ==========================================
  // SECTION C: PAYMENTS TAB
  // ==========================================
  console.log('\n[4/4] Testing PAYMENTS Tab (/admin/payments)...');
  await page.goto('http://localhost:4201/admin/payments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const paymentsResults = [];
  for (const vp of DEVICE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate((width) => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const hasHorizontalScroll = scrollWidth > width + 1;

      const mobileCards = document.querySelectorAll('.mobile-card');
      const tableRows = document.querySelectorAll('.app-data-table__table tbody tr');
      const cardViewItems = document.querySelectorAll('.payment-card');

      const mobileFab = document.querySelector('.payment-mobile-fab');
      let mobileFabPos = null;
      if (mobileFab) {
        const r = mobileFab.getBoundingClientRect();
        mobileFabPos = {
          visible: r.width > 0 && r.height > 0 && window.getComputedStyle(mobileFab).display !== 'none',
          bottom: window.innerHeight - r.bottom,
          right: window.innerWidth - r.right
        };
      }

      return {
        viewportWidth: width,
        scrollWidth,
        hasHorizontalScroll,
        mobileCardsCount: mobileCards.length,
        tableRowsCount: tableRows.length,
        cardViewItemsCount: cardViewItems.length,
        mobileFabPos
      };
    }, vp.width);

    const screenshotName = `payments-${vp.name}.png`;
    const artifactPath = path.join(SUITE_CAPTURE_DIR, screenshotName);
    const workspacePath = path.join(WORKSPACE_SCREENSHOTS_DIR, screenshotName);
    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, workspacePath);

    paymentsResults.push({
      device: vp.device,
      resolution: `${vp.width}x${vp.height}`,
      category: vp.category,
      hasHorizontalScroll: metrics.hasHorizontalScroll,
      scrollWidth: metrics.scrollWidth,
      mobileCardsCount: metrics.mobileCardsCount,
      mobileFabVisible: metrics.mobileFabPos ? metrics.mobileFabPos.visible : false,
      mobileFabBottom: metrics.mobileFabPos ? `${Math.round(metrics.mobileFabPos.bottom)}px` : 'N/A',
      screenshot: screenshotName,
      status: !metrics.hasHorizontalScroll ? 'PASSED' : 'FAILED'
    });

    const statusBadge = !metrics.hasHorizontalScroll ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${statusBadge} [Payments]  ${vp.device.padEnd(45)} | Width: ${vp.width}px -> ScrollWidth: ${metrics.scrollWidth}px | FAB: ${metrics.mobileFabPos?.visible ? 'Visible' : 'Hidden'}`);
  }

  // Test Payments Card View on Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  const payCardToggle = page.locator('.view-mode-toggle button').nth(1);
  if (await payCardToggle.count() > 0) {
    await payCardToggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SUITE_CAPTURE_DIR, 'payments-mobile-card-view.png') });
  }

  testReport.tabs.payments = paymentsResults;

  // Write JSON report
  const reportJsonPath = path.join(SUITE_CAPTURE_DIR, 'all-tabs-15-resolutions-report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(testReport, null, 2));

  await browser.close();

  console.log('\n========================================================================');
  console.log('  TEST SUITE COMPLETED SUCCESSFULLY ACROSS ALL TABS & RESOLUTIONS!       ');
  console.log(`  Report: ${reportJsonPath}`);
  console.log('========================================================================\n');
}

runFullTestSuite().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
