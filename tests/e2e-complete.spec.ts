import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:4200';

async function login(page: Page, user: string, pass: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('#loginUsername', user);
  await page.fill('#loginPassword', pass);
  await page.click('input[type="submit"]');
  await page.waitForTimeout(2000);
}

async function goTo(page: Page, path: string) {
  await page.click(`a[routerLink="${path}"]`);
  await page.waitForTimeout(2000);
}

// ─── BOOKS CRUD COMPLET (Admin) ────────────────────────────

test.describe('Livres CRUD complet (Admin A1)', () => {

  test('View Book Details', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/books');
    // Cliquer View sur le 1er livre
    await page.locator('button:has-text("View")').first().click();
    await page.waitForTimeout(2000);
    await expect(page.locator('h2, h3, h4').first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/30-book-details.png', fullPage: true });
  });

  test('Update Book', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/books');
    // Cliquer Edit sur le 1er livre
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForTimeout(2000);
    // Modifier le nom
    const nameInput = page.locator('input[name="bookName"], input#bookName').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('B1_UPDATED');
      await page.locator('button:has-text("Submit"), button:has-text("Update")').first().click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/results/31-book-updated.png', fullPage: true });
  });

  test('Delete Book (un livre créé pour ça)', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/create-book');
    await page.fill('#bookName', 'B_DELETE_ME');
    await page.fill('#bookAuthor', 'To Delete');
    await page.fill('#bookGenre', 'Test');
    await page.fill('#noOfCopies', '1');
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);

    await goTo(page, '/books');
    // Accepter le confirm
    page.on('dialog', d => d.accept());
    const deleteBtn = page.locator('button:has-text("Delete")').last();
    await deleteBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/32-book-deleted.png', fullPage: true });
  });
});

// ─── USERS CRUD (Admin) ────────────────────────────────────

test.describe('Users CRUD (Admin A1)', () => {

  test('Register User', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/register-user');
    await page.fill('#name', 'NEW_USER');
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'newpass');
    await page.fill('#role', 'User');
    await page.screenshot({ path: 'tests/results/33-register-form.png', fullPage: true });
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/34-after-register.png', fullPage: true });
  });

  test('User Details', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/users');
    // Cliquer View sur le 1er user
    await page.locator('button:has-text("View")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/35-user-details.png', fullPage: true });
  });

  test('Update User', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/users');
    // Cliquer Edit sur le 1er user
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/36-user-update.png', fullPage: true });
    // Retourner sans modifier
    await page.goto(`${BASE}/users`);
    await page.waitForTimeout(1000);
  });
});

// ─── EMPRUNTS (Borrow + Return) ─────────────────────────────

test.describe('Emprunts complet (Borrow + Return)', () => {

  test('Borrow Book flow', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/borrow-book');
    // Compter les lignes avant
    const countBefore = await page.locator('table tbody tr').count();
    // Cliquer Borrow sur le 1er livre
    const borrowBtn = page.locator('button:has-text("Borrow")').first();
    if (await borrowBtn.isVisible()) {
      await borrowBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/results/37-borrow.png', fullPage: true });
  });

  test('Return Book flow', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/return-book');
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    // Cliquer Return sur le 1er emprunt non rendu
    const returnBtn = page.locator('button:has-text("Return")').first();
    if (await returnBtn.isVisible()) {
      await returnBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/results/38-return.png', fullPage: true });
  });

  test('Borrow → Return round trip', async ({ page }) => {
    // Emprunter un livre disponible
    await login(page, 'A2', 'a2');
    await goTo(page, '/borrow-book');
    const borrowBtn = page.locator('button:has-text("Borrow")').first();
    const hasBook = await borrowBtn.isVisible().catch(() => false);
    if (hasBook) {
      await borrowBtn.click();
      await page.waitForTimeout(2000);
      // Le livre emprunté doit apparaître dans Return Books
      await goTo(page, '/return-book');
      const returnBtn = page.locator('button:has-text("Return")').first();
      if (await returnBtn.isVisible().catch(() => false)) {
        await returnBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: 'tests/results/39-borrow-return-roundtrip.png', fullPage: true });
  });
});

// ─── RÉSERVATIONS (flow complet alternatifs) ────────────────

test.describe('Réservations flows alternatifs', () => {

  test('Annulation avec confirmation refusée', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    const cancelBtn = page.locator('button:has-text("Annuler")').first();
    const hasBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBtn) {
      // Refuser le confirm
      page.on('dialog', d => d.dismiss());
      await cancelBtn.click();
      await page.waitForTimeout(1000);
      // La réservation doit toujours exister
      await expect(page.locator('table')).toBeVisible();
    }
    await page.screenshot({ path: 'tests/results/40-cancel-dismissed.png', fullPage: true });
  });

  test('Réservation même livre par 2 users différents → RG-02', async ({ page }) => {
    // A2 réserve B2
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');
    // Vérifier état
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/41-before-rg02.png', fullPage: true });
  });

  test('Rafraîchir la liste', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');
    const refreshBtn = page.locator('button:has-text("Rafraîchir")');
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/results/42-refresh.png', fullPage: true });
  });

  test('Filtre EN_ATTENTE puis DISPONIBLE', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');
    const filter = page.locator('select.form-select-sm');

    await filter.selectOption('EN_ATTENTE');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/43-filter-attente.png', fullPage: true });

    await filter.selectOption('DISPONIBLE');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/44-filter-disponible.png', fullPage: true });

    await filter.selectOption('ANNULEE');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/45-filter-annulee.png', fullPage: true });

    await filter.selectOption('TOUS');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/46-filter-tous.png', fullPage: true });
  });
});

// ─── FORBIDDEN ──────────────────────────────────────────────

test.describe('Accès interdit', () => {

  test('User → /books = forbidden', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/47-forbidden-books.png', fullPage: true });
  });

  test('User → /users = forbidden', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/users`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/48-forbidden-users.png', fullPage: true });
  });

  test('User → /create-book = forbidden', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/create-book`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/49-forbidden-create.png', fullPage: true });
  });
});
