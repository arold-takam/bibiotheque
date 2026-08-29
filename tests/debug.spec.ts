import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:4200';

test('DEBUG: login A2 → reservations → capture console + network', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];

  page.on('response', res => {
    if (res.status() >= 400) {
      errors.push(`HTTP ${res.status()}: ${res.request().method()} ${res.url()}`);
    }
  });
  page.on('requestfailed', req => errors.push(`FAIL: ${req.url()} - ${req.failure()?.errorText}`));

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('#loginUsername', 'A2');
  await page.fill('#loginPassword', 'a2');
  await page.click('input[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('After login URL:', page.url());
  await page.screenshot({ path: 'tests/results/DEBUG-01-after-login.png', fullPage: true });

  // Navigate to reservations via URL directly
  await page.goto(`${BASE}/reservations`);
  await page.waitForTimeout(3000);
  console.log('Reservations URL:', page.url());
  await page.screenshot({ path: 'tests/results/DEBUG-02-reservations.png', fullPage: true });

  // Inspect the page
  const selects = await page.locator('select').all();
  console.log('Total selects:', selects.length);

  for (let i = 0; i < selects.length; i++) {
    const opts = await selects[i].locator('option').allTextContents();
    console.log(`Select #${i}:`, opts.join(' | '));
  }

  const h3 = await page.locator('h3').textContent().catch(() => 'N/A');
  const tableVisible = await page.locator('table').isVisible().catch(() => false);
  const btnVisible = await page.locator('button:has-text("Réserver")').isVisible().catch(() => false);
  const btnEnabled = await page.locator('button:has-text("Réserver")').isEnabled().catch(() => false);

  console.log('\n=== STATE ===');
  console.log('h3:', h3);
  console.log('table visible:', tableVisible);
  console.log('btn visible:', btnVisible);
  console.log('btn enabled:', btnEnabled);

  // Try selecting book and user
  if (selects.length >= 2) {
    const bookOpts = await selects[0].locator('option').all();
    const userOpts = await selects[1].locator('option').all();
    console.log('Book options count:', bookOpts.length);
    console.log('User options count:', userOpts.length);

    if (bookOpts.length > 1 && userOpts.length > 1) {
      // Select first available book
      const bookVal = await bookOpts[1].evaluate((el: any) => el.value);
      const userVal = await userOpts[1].evaluate((el: any) => el.value);
      console.log('Selecting book value:', bookVal, 'user value:', userVal);

      await selects[0].selectOption(bookVal);
      await selects[1].selectOption(userVal);
      await page.waitForTimeout(500);

      const btnEnabledAfter = await page.locator('button:has-text("Réserver")').isEnabled().catch(() => false);
      console.log('btn enabled AFTER select:', btnEnabledAfter);
      await page.screenshot({ path: 'tests/results/DEBUG-03-after-select.png', fullPage: true });

      if (btnEnabledAfter) {
        await page.locator('button:has-text("Réserver")').click();
        await page.waitForTimeout(3000);
        console.log('After click URL:', page.url());
        await page.screenshot({ path: 'tests/results/DEBUG-04-after-reserve.png', fullPage: true });
      }
    }
  }

  console.log('\n=== HTTP ERRORS ===');
  errors.forEach(e => console.log(e));
});
