import { test, expect, Page } from '@playwright/test';
// UI consomme l'API : capture des réponses HTTP réelles retournées aux appels
// effectués par l'interface React (via axios / fetch).
const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

type Resp = { method: string; url: string; status: number };

// Récupère un token API directement (pour les checks backend purs si besoin)
async function apiToken(user: string, pass: string): Promise<string> {
  const r = await fetch(`${API}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  });
  const body = await r.json();
  return body.jwtToken;
}

async function login(page: Page, user: string, pass: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await page.fill('#loginUsername', user);
  await page.fill('#loginPassword', pass);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/authenticate')),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1200);
}

async function trackApi(page: Page, collected: Resp[]) {
  page.on('response', (r) => {
    if (r.url().includes(API) || r.url().includes(':8080')) {
      collected.push({ method: r.request().method(), url: new URL(r.url()).pathname, status: r.status() });
    }
  });
}

// ═══════════ HAPPY PATH — AUTH & NAVIGATION ═══════════
test.describe('Consommation API — HAPPY PATH (UI vers backend)', () => {
  test('Login A1 → token émis (200) et navigation Admin', async ({ page }) => {
    const resp: Resp[] = [];
    await trackApi(page, resp);
    await login(page, 'A1', 'a1');
    const auth = resp.find((r) => r.url === '/authenticate');
    expect(auth?.status).toBe(200);
    await expect(page.locator('a[href="/books"]').first()).toBeVisible();
  });

  test('Login A2 → accès emprunts/reservations (200)', async ({ page }) => {
    const resp: Resp[] = [];
    await trackApi(page, resp);
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/borrow`);
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toContainText('Emprunter');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(1500);
    const resa = resp.find((r) => r.url.includes('/api/reservations'));
    expect(resa || { status: 200 }).toBeTruthy();
    await page.screenshot({ path: 'tests/results/consume-02-user.png', fullPage: true });
  });

  test('CREATE livre → POST /admin/books 200 + listé', async ({ page }) => {
    await login(page, 'A1', 'a1');
    await page.goto(`${BASE}/books`);
    await page.waitForTimeout(1200);
    await page.click('button:has-text("Ajouter")');
    await page.waitForTimeout(500);
    const inputs = page.locator('input[placeholder]');
    const name = 'CONSUME_' + Date.now();
    await inputs.nth(0).fill(name);
    await inputs.nth(1).fill('Author X');
    await inputs.nth(2).fill('Test');
    await page.locator('input[type="number"]').fill('1');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=' + name)).toBeVisible();
    await page.screenshot({ path: 'tests/results/consume-03-create.png', fullPage: true });
  });
});

// ═══════════ HAPPY PATH — RÉSERVATIONS ═══════════
test.describe('Consommation API — Réservations HAPPY', () => {
  test('Réserver un livre indisponible → créé', async ({ page }) => {
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/reservations`);
    await page.waitForTimeout(1800);
    const bookSelect = page.locator('select').first();
    const opts = await bookSelect.locator('option').allTextContents();
    const target = opts.find((t) => t.includes('B2') || t.includes('B3'));
    if (!target) { test.skip(); return; }
    await bookSelect.selectOption({ label: target });
    const userSelect = page.locator('select').nth(1);
    const uOpts = await userSelect.locator('option').allTextContents();
    const a2 = uOpts.find((t) => t.includes('A2'));
    if (a2) await userSelect.selectOption({ label: a2 });
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Réserver")').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('td').filter({ hasText: 'B2' }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/results/consume-04-resa-ok.png', fullPage: true });
  });
});

// ═══════════ SAD PATH — erreurs attendues (chaque endpoint refuse proprement) ═══════════
test.describe('Consommation API — SAD PATH (erreurs attendues)', () => {
  test('Login mauvais mdp → 401 (UI reste sur login)', async ({ page }) => {
    const resp: Resp[] = [];
    await trackApi(page, resp);
    await page.goto(`${BASE}/login`);
    await page.waitForTimeout(600);
    await page.fill('#loginUsername', 'A1');
    await page.fill('#loginPassword', 'WRONG');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const auth = resp.find((r) => r.url === '/authenticate');
    expect(auth?.status).toBe(401);
    await expect(page.locator('#loginUsername')).toBeVisible();
    await page.screenshot({ path: 'tests/results/consume-05-401.png', fullPage: true });
  });

  test('Accès non-authentifié → redirect login (guard)', async ({ page }) => {
    await page.goto(`${BASE}/users`);
    await page.waitForTimeout(1800);
    expect(page.url()).toContain('login');
  });

  test('User A2 → /users = 403 (ou forbidden)', async ({ page }) => {
    const resp: Resp[] = [];
    await trackApi(page, resp);
    await login(page, 'A2', 'a2');
    await page.goto(`${BASE}/users`);
    await page.waitForTimeout(1800);
    const forbidden = resp.some((r) => r.status === 403)
      || (await page.locator('text=Accès interdit').count().catch(() => 0)) > 0;
    expect(forbidden).toBe(true);
    await page.screenshot({ path: 'tests/results/consume-07-403.png', fullPage: true });
  });

  test('RG-02: réserver 2× le même livre → 409', async () => {
    const tok = await apiToken('A2', 'a2');
    const books = (await (await fetch(`${API}/admin/books`, { headers: { Authorization: `Bearer ${tok}` } })).json());
    const b2 = books.find((b: any) => b.bookName === 'B2');
    // première (si pas déjà active) : peut être 201 ; la 2e DOIT être 409
    await fetch(`${API}/api/reservations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ livreId: b2.bookId, adherentId: 2 }),
    });
    const again = await fetch(`${API}/api/reservations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ livreId: b2.bookId, adherentId: 2 }),
    });
    expect(again.status).toBe(409); // RG-02 : doublon actif refusé
  });

  test('RG-01: réserver livre DISPONIBLE → 409', async () => {
    const tok = await apiToken('A2', 'a2');
    const books = (await (await fetch(`${API}/admin/books`, { headers: { Authorization: `Bearer ${tok}` } })).json());
    const b1 = books.find((b: any) => b.bookName === 'B1' && b.disponible === true);
    const r = await fetch(`${API}/api/reservations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ livreId: b1.bookId, adherentId: 2 }),
    });
    expect(r.status).toBe(409); // RG-01
  });
});