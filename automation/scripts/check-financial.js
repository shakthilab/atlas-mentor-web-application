const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:4200/authentication/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"], input[formcontrolname="email"], input[name="email"]').first().fill('Jitesh.gupta@atlasmentor.com');
  await page.locator('input[type="password"], input[formcontrolname="password"], input[name="password"]').first().fill('admin123');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/admin**', { timeout: 15000 });
  await page.waitForTimeout(2500);

  const secFinancial = page.locator('.section-financial');
  if (await secFinancial.count() > 0) {
    await secFinancial.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const destDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\32eccdde-b55a-4911-9b80-ad05fce2638e';
    await secFinancial.first().screenshot({ path: path.join(destDir, 'financial-desktop-detail.png') });
    console.log('Desktop financial screenshot taken');

    const cards = await secFinancial.locator('.op-card').all();
    console.log('Total op-cards in financial section:', cards.length);
    for (let i = 0; i < cards.length; i++) {
      const box = await cards[i].boundingBox();
      console.log(`Desktop Card ${i}: x=${box?.x.toFixed(1)}, y=${box?.y.toFixed(1)}, w=${box?.width.toFixed(1)}, h=${box?.height.toFixed(1)}`);
    }

    // Inspect distances between rows and elements in financial section
    const rows = await secFinancial.locator('.row').all();
    console.log('Total rows in financial section:', rows.length);
    for (let i = 0; i < rows.length; i++) {
      const box = await rows[i].boundingBox();
      const style = await rows[i].evaluate(el => ({
        marginBottom: window.getComputedStyle(el).marginBottom,
        rowGap: window.getComputedStyle(el).rowGap,
        marginTop: window.getComputedStyle(el).marginTop
      }));
      console.log(`Row ${i}: y=${box?.y.toFixed(1)}, h=${box?.height.toFixed(1)}, mb=${style.marginBottom}, mt=${style.marginTop}, rowGap=${style.rowGap}`);
    }
  }

  // Check mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  if (await secFinancial.count() > 0) {
    await secFinancial.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const destDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\32eccdde-b55a-4911-9b80-ad05fce2638e';
    await secFinancial.first().screenshot({ path: path.join(destDir, 'financial-mobile-detail.png') });
    console.log('Mobile financial screenshot taken');

    const cards = await secFinancial.locator('.op-card').all();
    for (let i = 0; i < cards.length; i++) {
      const box = await cards[i].boundingBox();
      console.log(`Mobile Card ${i}: x=${box?.x.toFixed(1)}, y=${box?.y.toFixed(1)}, w=${box?.width.toFixed(1)}, h=${box?.height.toFixed(1)}`);
    }

    const rows = await secFinancial.locator('.row').all();
    for (let i = 0; i < rows.length; i++) {
      const box = await rows[i].boundingBox();
      const style = await rows[i].evaluate(el => ({
        marginBottom: window.getComputedStyle(el).marginBottom,
        rowGap: window.getComputedStyle(el).rowGap,
        marginTop: window.getComputedStyle(el).marginTop
      }));
      console.log(`Mobile Row ${i}: y=${box?.y.toFixed(1)}, h=${box?.height.toFixed(1)}, mb=${style.marginBottom}, mt=${style.marginTop}`);
    }
  }

  await browser.close();
})();
