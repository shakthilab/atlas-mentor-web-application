const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

const OUT_DIR = path.resolve(__dirname, '..', 'reports', 'sections');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle' });
  await page.locator('input[formcontrolname="email"]').fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[formcontrolname="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});

  if (!page.url().includes('/admin')) {
    await page.goto('http://localhost:4200/admin', { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(2500);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);

    // Scroll through different sections and capture screenshots
    const sections = ['top', 'students', 'financial', 'tasks', 'team', 'referrals', 'audit'];
    
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      await page.evaluate((index) => {
        const scrollContainer = document.querySelector('mat-sidenav-content') || document.querySelector('.contentWrapper') || window;
        const scrollAmount = index * 750;
        if (scrollContainer.scrollTo) {
          scrollContainer.scrollTo({ top: scrollAmount, behavior: 'instant' });
        } else {
          window.scrollTo(0, scrollAmount);
        }
      }, i);
      
      await page.waitForTimeout(400);
      const filename = `${vp.name}-sec${i + 1}-${sec}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, filename) });
    }
  }

  await browser.close();
  console.log('Section screenshots captured.');
}

run().catch(console.error);
