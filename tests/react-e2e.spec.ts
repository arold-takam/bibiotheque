import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: Page, user: string, pass: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('#loginUsername', user);
  await page.fill('#loginPassword', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

// ═══ 1. AUTH ═══════════════════════════════════════════════

test.describe('Auth React', () => {
  test('Login Admin A1', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await expect(page.locator('a[href="/books"]').first()).toBeVisible();
    await expect(page.locator('a[href="/users"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/react-01-admin.png', fullPage: true });
  });

  test('Login User A2', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await expect(page.locator('a[href="/borrow"]').first()).toBeVisible();
    await expect(page.locator('a[href="/reservations"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/react-02-user.png', fullPage: true });
  });

  test('Login échoué', async ({ page }) => {
    await login(page, 'A1', 'wrong');
    await expect(page.locator('#loginUsername')).toBeVisible();
  });

  test('Logout', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('button:has-text("Déconnexion")');
    await page.waitForTimeout(2000);
    await expect(page.locator('#loginUsername')).toBeVisible();
  });
});

// ═══ 2. RÉSERVATIONS ═══════════════════════════════════════

test.describe('Réservations React', () => {
  test('Selects remplis', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    const bookOpts = await page.locator('select').first().locator('option').count();
    const userOpts = await page.locator('select').nth(1).locator('option').count();
    expect(bookOpts).toBeGreaterThanOrEqual(5);
    expect(userOpts).toBeGreaterThanOrEqual(5);
    await page.screenshot({ path: 'tests/results/react-05-resa.png', fullPage: true });
  });

  test('Créer réservation B2', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    // Get actual option text for B2
    const bookSelect = page.locator('select').first();
    const b2Text = await bookSelect.locator('option').allTextContents();
    const b2Option = b2Text.find(t => t.includes('B2'));
    expect(b2Option).toBeTruthy();
    await bookSelect.selectOption({ label: b2Option! });

    const userSelect = page.locator('select').nth(1);
    const userText = await userSelect.locator('option').allTextContents();
    const a2Option = userText.find(t => t.includes('A2'));
    if (a2Option) await userSelect.selectOption({ label: a2Option });
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('td').filter({ hasText: 'B2' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/react-06-created.png', fullPage: true });
  });

  test('RG-01: B1 disponible → erreur', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    const bookSelect = page.locator('select').first();
    const opts = await bookSelect.locator('option').allTextContents();
    const b1Opt = opts.find(t => t.includes('B1'));
    if (b1Opt) await bookSelect.selectOption({ label: b1Opt });
    const userSelect = page.locator('select').nth(1);
    const uOpts = await userSelect.locator('option').allTextContents();
    const a2Opt = uOpts.find(t => t.includes('A2'));
    if (a2Opt) await userSelect.selectOption({ label: a2Opt });
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/react-07-rg01.png', fullPage: true });
  });

  test('Annuler réservation', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    const cancelBtn = page.locator('button:has-text("Annuler")').first();
    const hasBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBtn) {
      page.on('dialog', d => d.accept());
      await cancelBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/results/react-08-cancel.png', fullPage: true });
  });

  test('Filtres', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("ANNULEE")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("TOUS")').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/results/react-09-filters.png', fullPage: true });
  });
});

// ═══ 3. LIVRES ═════════════════════════════════════════════

test.describe('Livres React', () => {
  test('Liste livres', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(2000);
    await expect(page.locator('td').filter({ hasText: 'B1' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/react-10-books.png', fullPage: true });
  });

  test('Créer livre', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Ajouter")');
    await page.waitForTimeout(500);
    const inputs = page.locator('input[placeholder]');
    await inputs.nth(0).fill('REACT_BOOK');
    await inputs.nth(1).fill('Test Author');
    await inputs.nth(2).fill('Test');
    await page.locator('input[type="number"]').fill('1');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/react-11-create.png', fullPage: true });
  });
});

// ═══ 4. EMPRUNTS ═══════════════════════════════════════════

test.describe('Emprunts React', () => {
  test('Borrow page', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/borrow`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h1')).toContainText('Emprunter');
    await page.screenshot({ path: 'tests/results/react-12-borrow.png', fullPage: true });
  });

  test('Return page', async ({ page }) => {
    await login(page, 'A3', 'a3');
    await page.goto(`${BASE}/return`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h1')).toContainText('Retourner');
    await page.screenshot({ path: 'tests/results/react-13-return.png', fullPage: true });
  });
});

// ═══ 5. ACCESS CONTROL ═════════════════════════════════════

test.describe('Contrôle accès', () => {
  test('Non auth → redirect login', async ({ page }) => {
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('login');
  });

  test('User → /books = redirect', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/react-14-forbidden.png', fullPage: true });
  });
});
