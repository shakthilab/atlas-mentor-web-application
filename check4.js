const { chromium } = require('playwright');

(async () => {
  const SCRATCHPAD = process.env.SCRATCHPAD;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  const allConsole = [];

  page.on('console', msg => { allConsole.push(`[${msg.type()}] ${msg.text()}`); });
  page.on('pageerror', err => { errors.push(`PAGE ERROR: ${err.message}`); });

  // Navigate to root
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
  
  // Inject auth
  await page.evaluate(() => {
    localStorage.setItem('educrm-token', 'fake-test-token');
    localStorage.setItem('educrm-user', JSON.stringify({ id: '1', name: 'Test Admin', email: 'admin@test.com', role: 'ADMIN', status: 'ACTIVE', isEmployee: false, token: 'fake-test-token' }));
  });

  // Navigate without waiting for network idle
  await page.goto('http://localhost:4200/admin/hierarchy', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => console.log('Nav error:', e.message));
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());

  // Get any visible errors from the DOM
  const angularError = await page.evaluate(() => {
    const errorEl = document.querySelector('[_nghost] [ng-reflect-message]');
    return errorEl?.textContent || null;
  }).catch(() => null);
  
  // Get title
  const title = await page.title().catch(() => 'unknown');
  console.log('Title:', title);
  
  if (angularError) console.log('Angular error:', angularError);

  // Relevant console
  const relevant = allConsole.filter(m => 
    !m.includes('webpack-dev-server') && !m.includes('NG8107') && !m.includes('tailwindcss') && 
    !m.includes('deprecated') && !m.includes('Warnings while') && !m.includes('compiling')
  );
  if (relevant.length) console.log('\nConsole:\n' + relevant.join('\n'));
  console.log('\nErrors:', errors.length ? errors.join('\n') : 'None');

  // Check if page rendered the hierarchy component
  const hierarchyEl = await page.evaluate(() => {
    return !!document.querySelector('app-hierarchy') || !!document.querySelector('.hierarchy-container');
  }).catch(() => false);
  console.log('Hierarchy component rendered:', hierarchyEl);

  // Get body content snippet
  const bodySnippet = await page.evaluate(() => document.body.innerText?.substring(0, 200)).catch(() => '');
  console.log('Body snippet:', bodySnippet);

  await browser.close();
})();
