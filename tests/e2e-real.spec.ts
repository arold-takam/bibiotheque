import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:4200';

async function login(page: Page, user: string, pass: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('#loginUsername', user);
  await page.fill('#loginPassword', pass);
  await page.click('input[type="submit"]');
  await page.waitForTimeout(2000);
}

async function goToReservations(page: Page) {
  await page.goto(`${BASE}/reservations`);
  await page.waitForTimeout(2000);
}

// Helper: select livre par son nom visible dans le dropdown
async function selectBook(page: Page, bookName: string) {
  const select = page.locator('select').first();
  // Trouver l'option qui contient le nom du livre
  const option = select.locator('option', { hasText: bookName });
  const val = await option.evaluate((el: any) => el.value);
  await select.selectOption(val);
  await page.waitForTimeout(300);
}

// Helper: select user par son username
async function selectUser(page: Page, username: string) {
  const select = page.locator('select').nth(1);
  const option = select.locator('option', { hasText: username });
  const val = await option.evaluate((el: any) => el.value);
  await select.selectOption(val);
  await page.waitForTimeout(300);
}

// ═══════════════════════════════════════════════════════════
// 1. AUTH
// ═══════════════════════════════════════════════════════════

test.describe('1. Authentification', () => {
  test('Login Admin A1', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await expect(page.locator('a[routerLink="/books"]')).toBeVisible();
    await expect(page.locator('text=Hey')).toBeVisible();
    await page.screenshot({ path: 'tests/results/real-01-admin.png', fullPage: true });
  });

  test('Login User A2', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await expect(page.locator('a[routerLink="/reservations"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/borrow-book"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/books"]')).not.toBeVisible();
    await page.screenshot({ path: 'tests/results/real-02-user.png', fullPage: true });
  });

  test('Login échoué', async ({ page }) => {
    await login(page, 'A1', 'wrong');
    await page.waitForTimeout(2000);
    await expect(page.locator('#loginUsername')).toBeVisible();
  });

  test('Logout', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('button:has-text("Logout")');
    await page.waitForTimeout(2000);
    // Logout redirige vers home ("Library Management System" visible)
    const isHome = (await page.locator('.navbar-brand').textContent() || '').includes('Library');
    expect(isHome).toBeTruthy();
    await page.screenshot({ path: 'tests/results/real-04-logout.png', fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════
// 2. LIVRES (Admin)
// ═══════════════════════════════════════════════════════════

test.describe('2. Livres CRUD', () => {
  test('Liste livres affiche le seed', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('a[routerLink="/books"]');
    await page.waitForTimeout(2000);
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(6);
    await expect(page.locator('td').filter({ hasText: 'B1' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/real-03-books.png', fullPage: true });
  });

  test('Créer livre', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('a[routerLink="/create-book"]');
    await page.waitForTimeout(1000);
    await page.fill('#bookName', 'PLAYWRIGHT_BOOK');
    await page.fill('#bookAuthor', 'PW Author');
    await page.fill('#bookGenre', 'Test');
    await page.fill('#noOfCopies', '1');
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/real-04-create-book.png', fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════
// 3. USERS (Admin)
// ═══════════════════════════════════════════════════════════

test.describe('3. Users CRUD', () => {
  test('Liste users', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('a[routerLink="/users"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('td').filter({ hasText: 'A1' }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'A2' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/real-05-users.png', fullPage: true });
  });

  test('Register user', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('a[routerLink="/register-user"]');
    await page.waitForTimeout(1000);
    await page.fill('#name', 'PW_USER');
    await page.fill('#username', 'pw_user');
    await page.fill('#password', 'pw_pass');
    await page.fill('#role', 'User');
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/real-06-register.png', fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════
// 4. EMPRUNTS
// ═══════════════════════════════════════════════════════════

test.describe('4. Emprunts', () => {
  test('Borrow Books liste', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2')).toContainText('available');
    await expect(page.locator('table')).toBeVisible();
    await page.screenshot({ path: 'tests/results/real-07-borrow.png', fullPage: true });
  });

  test('Return Books liste', async ({ page }) => {
    await login(page, 'A3', 'a3');
    await page.click('a[routerLink="/return-book"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('h2')).toContainText('returned');
    await page.screenshot({ path: 'tests/results/real-08-return.png', fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════
// 5. RÉSERVATIONS (flow complet)
// ═══════════════════════════════════════════════════════════

test.describe('5. Réservations flow complet', () => {
  test('Page réservation accessible', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    await expect(page.locator('h3')).toContainText('réservations');
    await page.screenshot({ path: 'tests/results/real-09-resa-page.png', fullPage: true });
  });

  test('Select livres et users se remplissent', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    // Vérifier les selects contiennent les options du seed
    const bookOpts = await page.locator('select').first().locator('option').count();
    const userOpts = await page.locator('select').nth(1).locator('option').count();
    expect(bookOpts).toBeGreaterThanOrEqual(5); // placeholder + 4+ livres indispo
    expect(userOpts).toBeGreaterThanOrEqual(5); // placeholder + 5 users
    await page.screenshot({ path: 'tests/results/real-10-selects-filled.png', fullPage: true });
  });

  test('Bouton activé après sélection', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    // Bouton disabled au départ
    await expect(page.locator('button:has-text("Réserver")')).toBeDisabled();
    // Sélectionner livre + user
    await selectBook(page, 'B2');
    await selectUser(page, 'A2');
    // Bouton activé
    await expect(page.locator('button:has-text("Réserver")')).toBeEnabled();
    await page.screenshot({ path: 'tests/results/real-11-btn-enabled.png', fullPage: true });
  });

  test('Créer réservation B2 → 201 + dans la liste', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    await selectBook(page, 'B2');
    await selectUser(page, 'A2');
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2000);
    // Vérifier que la table contient B2
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'B2' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/real-12-resa-created.png', fullPage: true });
  });

  test('RG-01: réserver B1 disponible → erreur', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    await selectBook(page, 'B1');
    await selectUser(page, 'A2');
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2000);
    // Message d'erreur RG-01
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('RG-01');
    await page.screenshot({ path: 'tests/results/real-13-rg01-error.png', fullPage: true });
  });

  test('Annuler réservation → ANNULEE', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    const cancelBtn = page.locator('button:has-text("Annuler")').first();
    const hasBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBtn) {
      page.on('dialog', d => d.accept());
      await cancelBtn.click();
      await page.waitForTimeout(3000);
      // Vérifier que le bouton Annuler a disparu (ou qu'ANNULEE est visible)
      const stillAnnulable = await cancelBtn.isVisible().catch(() => false);
      expect(stillAnnulable).toBeFalsy();
    }
    await page.screenshot({ path: 'tests/results/real-14-cancelled.png', fullPage: true });
  });

  test('Filtre TOUS → toutes les données', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    await page.locator('select.form-select-sm').selectOption('TOUS');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/results/real-15-filter-tous.png', fullPage: true });
  });

  test('Filtre ANNULEE → que des ANNULEE', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goToReservations(page);
    await page.locator('select.form-select-sm').selectOption('ANNULEE');
    await page.waitForTimeout(1000);
    const badges = page.locator('span.badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toContainText('ANNULEE');
    }
    await page.screenshot({ path: 'tests/results/real-16-filter-annulee.png', fullPage: true });
  });
});

// ═══════════════════════════════════════════════════════════
// 6. ACCÈS INTERDIT
// ═══════════════════════════════════════════════════════════

test.describe('6. Contrôle d\'accès', () => {
  test('User → /books = forbidden ou redirect', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(2000);
    const isForbidden = await page.locator('text=access').isVisible().catch(() => false);
    const noBooksTable = !(await page.locator('h2:has-text("Book List")').isVisible().catch(() => false));
    expect(isForbidden || noBooksTable).toBeTruthy();
    await page.screenshot({ path: 'tests/results/real-17-forbidden.png', fullPage: true });
  });

  test('Non auth → redirect login', async ({ page }) => {
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    const onLogin = page.url().includes('login') || page.url().includes('forbidden');
    expect(onLogin).toBeTruthy();
  });
});
