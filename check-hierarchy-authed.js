const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    if (!msg.text().includes('webpack-dev-server') && !msg.text().includes('NG8107') && !msg.text().includes('tailwindcss')) {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}\n${err.stack}`);
  });

  // First load the app to get the domain context
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Inject a fake authenticated user into localStorage to bypass auth guard
  await page.evaluate(() => {
    const fakeUser = {
      id: '1',
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmployee: false,
      token: 'fake-test-token'
    };
    localStorage.setItem('educrm-token', 'fake-test-token');
    localStorage.setItem('educrm-user', JSON.stringify(fakeUser));
  });

  // Now navigate to the hierarchy page
  console.log('Navigating to /admin/hierarchy with fake auth...');
  await page.goto('http://localhost:4200/admin/hierarchy', { 
    waitUntil: 'networkidle', 
    timeout: 15000 
  }).catch(e => console.log('Nav error:', e.message));

  console.log('Current URL:', page.url());
  
  // Wait for any deferred errors
  await page.waitForTimeout(3000);

  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(m => console.log(m));

  console.log('\n=== PAGE ERRORS ===');
  if (errors.length === 0) {
    console.log('No page errors');
  } else {
    errors.forEach(e => console.log(e));
  }

  // Check page body for Angular error text
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
  if (bodyText.includes('Error') || bodyText.includes('error')) {
    console.log('\n=== BODY ERROR CONTENT ===');
    console.log(bodyText.substring(0, 500));
  }

  // Take a screenshot
  await page.screenshot({ path: '/tmp/hierarchy-screenshot.png', fullPage: false });
  console.log('\nScreenshot saved to /tmp/hierarchy-screenshot.png');

  await browser.close();
})();
