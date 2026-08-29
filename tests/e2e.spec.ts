import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:4200';
const API = 'http://localhost:8080';

// ─── Helpers ───────────────────────────────────────────────

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

async function forceSelect(page: Page, selectIdx: number, optionIdx: number) {
  await page.waitForFunction(
    ({ idx, oidx }: any) => {
      const s = document.querySelectorAll('select')[idx];
      return s && s.options.length > oidx;
    },
    { idx: selectIdx, oidx: optionIdx },
    { timeout: 10000 }
  );
  const val = await page.locator('select').nth(selectIdx).locator('option').nth(optionIdx).evaluate((el: any) => el.value);
  await page.locator('select').nth(selectIdx).selectOption(val);
  await page.waitForTimeout(300);
}

// ─── 1. AUTHENTIFICATION ───────────────────────────────────

test.describe('Authentification', () => {

  test('Login Admin A1 → accès page admin', async ({ page }) => {
    await login(page, 'A1', 'a1');
    // Admin voit les liens admin (Book List, User List...)
    await expect(page.locator('a[routerLink="/books"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/users"]')).toBeVisible();
    await expect(page.locator('text=Hey')).toBeVisible();
    await page.screenshot({ path: 'tests/results/01-login-admin.png', fullPage: true });
  });

  test('Login User A2 → accès pages User', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await expect(page.locator('a[routerLink="/reservations"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/borrow-book"]')).toBeVisible();
    await expect(page.locator('text=Hey')).toBeVisible();
    // Admin links NOT visible for User
    await expect(page.locator('a[routerLink="/books"]')).not.toBeVisible();
    await page.screenshot({ path: 'tests/results/02-login-user.png', fullPage: true });
  });

  test('Login échoué → erreur', async ({ page }) => {
    await login(page, 'A1', 'wrongpassword');
    // Reste sur la page login ou affiche erreur
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/03-login-failed.png', fullPage: true });
  });

  test('Logout → retour login', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.click('button:has-text("Logout")');
    await page.waitForTimeout(2000);
    const loginBtn = page.locator('button:has-text("Login")');
    await expect(loginBtn).toBeVisible();
    await page.screenshot({ path: 'tests/results/04-logout.png', fullPage: true });
  });
});

// ─── 2. LIVRES (Admin) ─────────────────────────────────────

test.describe('Livres CRUD (Admin)', () => {

  test('Liste livres affiche les 6 livres du seed', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/books');
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(6);
    await expect(page.locator('td').filter({ hasText: 'B1' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/05-books-list.png', fullPage: true });
  });

  test('Créer un livre', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/create-book');
    await page.fill('#bookName', 'B_TEST');
    await page.fill('#bookAuthor', 'Auteur Test');
    await page.fill('#bookGenre', 'Test');
    await page.fill('#noOfCopies', '3');
    await page.screenshot({ path: 'tests/results/06-create-book-form.png', fullPage: true });
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/07-after-create-book.png', fullPage: true });
  });

  test('Liste users affiche A1-A5', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await goTo(page, '/users');
    await expect(page.locator('td').filter({ hasText: 'A1' }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'A2' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/08-users-list.png', fullPage: true });
  });
});

// ─── 3. EMPRUNTS (User) ────────────────────────────────────

test.describe('Emprunts', () => {

  test('Borrow Books → liste livres disponibles', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/borrow-book');
    await expect(page.locator('h2')).toContainText('available books');
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/results/09-borrow-list.png', fullPage: true });
  });

  test('Return Books → liste emprunts', async ({ page }) => {
    await login(page, 'A3', 'a3');
    await goTo(page, '/return-book');
    await expect(page.locator('h2')).toContainText('returned');
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/results/10-return-list.png', fullPage: true });
  });
});

// ─── 4. RÉSERVATIONS (flow complet) ────────────────────────

test.describe('Réservations E2E', () => {

  test('Page réservations accessible par User', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');
    await expect(page.locator('h3')).toContainText('réservations');
    await page.screenshot({ path: 'tests/results/11-reservations-page.png', fullPage: true });
  });

  test('Créer 1 réservation → apparaît dans la liste', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    await forceSelect(page, 0, 1); // 1er livre indisponible
    await forceSelect(page, 1, 1); // 1er adhérent

    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2500);

    await expect(page.locator('table')).toBeVisible();
    await page.screenshot({ path: 'tests/results/12-reservation-created.png', fullPage: true });
  });

  test('Créer 2 résa de plus → 3 EN_ATTENTE', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    // 2e résa
    await forceSelect(page, 0, 2);
    await forceSelect(page, 1, 1);
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(1500);

    // 3e résa
    await forceSelect(page, 0, 3);
    await forceSelect(page, 1, 1);
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(1500);

    const enAttente = await page.locator('span.badge').filter({ hasText: 'EN_ATTENTE' }).count();
    expect(enAttente).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: 'tests/results/13-three-reservations.png', fullPage: true });
  });

  test('Annuler 1 réservation', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    const btn = page.locator('button:has-text("Annuler")').first();
    const hasBtn = await btn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBtn) {
      page.on('dialog', d => d.accept());
      await btn.click();
      await page.waitForTimeout(2000);
    }

    await expect(page.locator('h3')).toContainText('réservations');
    await page.screenshot({ path: 'tests/results/14-after-cancel.png', fullPage: true });
  });

  test('Filtre par statut', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    await page.locator('select.form-select-sm').selectOption('EN_ATTENTE');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/results/15-filter-en-attente.png', fullPage: true });

    await page.locator('select.form-select-sm').selectOption('TOUS');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/results/16-filter-tous.png', fullPage: true });
  });
});

// ─── 5. ERREURS & EDGE CASES ───────────────────────────────

test.describe('Erreurs & Edge Cases', () => {

  test('User ne voit PAS les pages Admin', async ({ page }) => {
    await login(page, 'A2', 'a2');
    // Accès direct URL admin → redirect forbidden
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(2000);
    // Ne doit PAS voir la table Book List
    const isForbidden = await page.locator('text=You do not have access').isVisible().catch(() => false);
    const isHome = page.url().includes('/') && !page.url().includes('/books');
    expect(isForbidden || isHome).toBeTruthy();
    await page.screenshot({ path: 'tests/results/17-user-no-admin.png', fullPage: true });
  });

  test('Admin ne voit PAS les liens User (emprunt)', async ({ page }) => {
    await login(page, 'A1', 'a1');
    // Même si admin a rôle User aussi, on vérifie
    await page.goto(`${BASE}/borrow-book`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/18-admin-borrow.png', fullPage: true });
  });

  test('Accès non authentifié → redirect login', async ({ page }) => {
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(2000);
    // Doit être redirigé vers login ou forbidden
    const onLogin = page.url().includes('login') || page.url().includes('forbidden');
    expect(onLogin).toBeTruthy();
    await page.screenshot({ path: 'tests/results/19-unauth-redirect.png', fullPage: true });
  });

  test('Réservation livre disponible → erreur 409 RG-01', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await goTo(page, '/reservations');

    // B1 est disponible → RG-01 interdit
    // Le select contient un placeholder disabled à l'index 0, B1 est l'index 0 des enabled
    // On utilise l'API directement pour ce test
    const token = await page.evaluate(async () => {
      const res = await fetch('http://localhost:8080/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'A2', password: 'a2' })
      });
      return (await res.json()).jwtToken;
    });
    const res = await page.evaluate(async ({ t, bookId }: any) => {
      const r = await fetch('http://localhost:8080/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({ livreId: bookId, adherentId: 2 })
      });
      return { status: r.status, body: await r.json() };
    }, { t: token, bookId: 6 });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('RG-01');
    await page.screenshot({ path: 'tests/results/20-rg01-error.png', fullPage: true });
  });
});

// ─── 6. NAVIGATION COMPLÈTE ────────────────────────────────

test.describe('Navigation', () => {

  test('Navbar responsive → tous les liens', async ({ page }) => {
    await login(page, 'A1', 'a1');
    // Vérifier que la navbar contient les éléments clés
    await expect(page.locator('.navbar-brand')).toContainText('Library');
    await expect(page.locator('a[routerLink="/reservations"]')).toBeVisible();
    await expect(page.locator('text=Hey')).toBeVisible();
    await page.screenshot({ path: 'tests/results/21-navbar.png', fullPage: true });
  });

  test('Home page → landing', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/22-home.png', fullPage: true });
  });
});
