# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: react-e2e.spec.ts >> Emprunts React >> Borrow page
- Location: tests/react-e2e.spec.ts:155:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/borrow
Call log:
  - navigating to "http://localhost:3000/borrow", waiting until "load"

```

# Test source

```ts
  57  |   test('Créer réservation B2', async ({ page }) => {
  58  |     await login(page, 'A2', 'a2');
  59  |     await page.goto(`${BASE}/reservations`);
  60  |     await page.waitForTimeout(2000);
  61  |     // Get actual option text for B2
  62  |     const bookSelect = page.locator('select').first();
  63  |     const b2Text = await bookSelect.locator('option').allTextContents();
  64  |     const b2Option = b2Text.find(t => t.includes('B2'));
  65  |     expect(b2Option).toBeTruthy();
  66  |     await bookSelect.selectOption({ label: b2Option! });
  67  | 
  68  |     const userSelect = page.locator('select').nth(1);
  69  |     const userText = await userSelect.locator('option').allTextContents();
  70  |     const a2Option = userText.find(t => t.includes('A2'));
  71  |     if (a2Option) await userSelect.selectOption({ label: a2Option });
  72  |     await page.waitForTimeout(500);
  73  | 
  74  |     await page.locator('button:has-text("Réserver")').click();
  75  |     await page.waitForTimeout(2000);
  76  |     await expect(page.locator('td').filter({ hasText: 'B2' }).first()).toBeVisible();
  77  |     await page.screenshot({ path: 'tests/results/react-06-created.png', fullPage: true });
  78  |   });
  79  | 
  80  |   test('RG-01: B1 disponible → erreur', async ({ page }) => {
  81  |     await login(page, 'A2', 'a2');
  82  |     await page.goto(`${BASE}/reservations`);
  83  |     await page.waitForTimeout(2000);
  84  |     const bookSelect = page.locator('select').first();
  85  |     const opts = await bookSelect.locator('option').allTextContents();
  86  |     const b1Opt = opts.find(t => t.includes('B1'));
  87  |     if (b1Opt) await bookSelect.selectOption({ label: b1Opt });
  88  |     const userSelect = page.locator('select').nth(1);
  89  |     const uOpts = await userSelect.locator('option').allTextContents();
  90  |     const a2Opt = uOpts.find(t => t.includes('A2'));
  91  |     if (a2Opt) await userSelect.selectOption({ label: a2Opt });
  92  |     await page.waitForTimeout(500);
  93  |     await page.locator('button:has-text("Réserver")').click();
  94  |     await page.waitForTimeout(2000);
  95  |     await page.screenshot({ path: 'tests/results/react-07-rg01.png', fullPage: true });
  96  |   });
  97  | 
  98  |   test('Annuler réservation', async ({ page }) => {
  99  |     await login(page, 'A2', 'a2');
  100 |     await page.goto(`${BASE}/reservations`);
  101 |     await page.waitForTimeout(2000);
  102 |     const cancelBtn = page.locator('button:has-text("Annuler")').first();
  103 |     const hasBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
  104 |     if (hasBtn) {
  105 |       page.on('dialog', d => d.accept());
  106 |       await cancelBtn.click();
  107 |       await page.waitForTimeout(2000);
  108 |     }
  109 |     await page.screenshot({ path: 'tests/results/react-08-cancel.png', fullPage: true });
  110 |   });
  111 | 
  112 |   test('Filtres', async ({ page }) => {
  113 |     await login(page, 'A2', 'a2');
  114 |     await page.goto(`${BASE}/reservations`);
  115 |     await page.waitForTimeout(2000);
  116 |     await page.locator('button:has-text("ANNULEE")').click();
  117 |     await page.waitForTimeout(1000);
  118 |     await page.locator('button:has-text("TOUS")').click();
  119 |     await page.waitForTimeout(1000);
  120 |     await page.screenshot({ path: 'tests/results/react-09-filters.png', fullPage: true });
  121 |   });
  122 | });
  123 | 
  124 | // ═══ 3. LIVRES ═════════════════════════════════════════════
  125 | 
  126 | test.describe('Livres React', () => {
  127 |   test('Liste livres', async ({ page }) => {
  128 |     await login(page, 'A1', 'a1');
  129 |     await page.goto(`${BASE}/books`);
  130 |     await page.waitForTimeout(2000);
  131 |     await expect(page.locator('td').filter({ hasText: 'B1' }).first()).toBeVisible();
  132 |     await page.screenshot({ path: 'tests/results/react-10-books.png', fullPage: true });
  133 |   });
  134 | 
  135 |   test('Créer livre', async ({ page }) => {
  136 |     await login(page, 'A1', 'a1');
  137 |     await page.goto(`${BASE}/books`);
  138 |     await page.waitForTimeout(1000);
  139 |     await page.click('button:has-text("Ajouter")');
  140 |     await page.waitForTimeout(500);
  141 |     const inputs = page.locator('input[placeholder]');
  142 |     await inputs.nth(0).fill('REACT_BOOK');
  143 |     await inputs.nth(1).fill('Test Author');
  144 |     await inputs.nth(2).fill('Test');
  145 |     await page.locator('input[type="number"]').fill('1');
  146 |     await page.click('button:has-text("Créer")');
  147 |     await page.waitForTimeout(2000);
  148 |     await page.screenshot({ path: 'tests/results/react-11-create.png', fullPage: true });
  149 |   });
  150 | });
  151 | 
  152 | // ═══ 4. EMPRUNTS ═══════════════════════════════════════════
  153 | 
  154 | test.describe('Emprunts React', () => {
  155 |   test('Borrow page', async ({ page }) => {
  156 |     await login(page, 'A2', 'a2');
> 157 |     await page.goto(`${BASE}/borrow`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/borrow
  158 |     await page.waitForTimeout(2000);
  159 |     await expect(page.locator('h1')).toContainText('Emprunter');
  160 |     await page.screenshot({ path: 'tests/results/react-12-borrow.png', fullPage: true });
  161 |   });
  162 | 
  163 |   test('Return page', async ({ page }) => {
  164 |     await login(page, 'A3', 'a3');
  165 |     await page.goto(`${BASE}/return`);
  166 |     await page.waitForTimeout(2000);
  167 |     await expect(page.locator('h1')).toContainText('Retourner');
  168 |     await page.screenshot({ path: 'tests/results/react-13-return.png', fullPage: true });
  169 |   });
  170 | });
  171 | 
  172 | // ═══ 5. ACCESS CONTROL ═════════════════════════════════════
  173 | 
  174 | test.describe('Contrôle accès', () => {
  175 |   test('Non auth → redirect login', async ({ page }) => {
  176 |     await page.goto(`${BASE}/reservations`);
  177 |     await page.waitForTimeout(2000);
  178 |     expect(page.url()).toContain('login');
  179 |   });
  180 | 
  181 |   test('User → /books = redirect', async ({ page }) => {
  182 |     await login(page, 'A2', 'a2');
  183 |     await page.goto(`${BASE}/books`);
  184 |     await page.waitForTimeout(2000);
  185 |     await page.screenshot({ path: 'tests/results/react-14-forbidden.png', fullPage: true });
  186 |   });
  187 | });
  188 | 
```