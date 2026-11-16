const { chromium, devices } = require('playwright'); const fs = require('fs');
const out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(process.argv[2], 'utf8');
  fs.writeFileSync(process.argv[2] + '.wrapped.html', html);
  await p.goto('file://' + process.argv[2] + '.wrapped.html'); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/50-intro-mid.png` });
  await p.waitForTimeout(1500);
  const shot = (n, full) => p.screenshot({ path: `${out}/${n}.png`, fullPage: !!full });
  const act = (a, extra = '') => p.click(`[data-act="${a}"]${extra}`);
  const db = () => p.evaluate(() => JSON.parse(localStorage['kobo.v1'] || 'null'));
  await shot('51-home'); await shot('51b-home-full', true);
  // Caisse
  await p.click('#tabbar [data-tab="pos"]'); await shot('52-pos-empty');
  await act('pos-add', '[data-id="p1"]'); await act('pos-add', '[data-id="p1"]'); await act('pos-add', '[data-id="p4"]');
  await act('pos-mode', '[data-v="keypad"]');
  await p.fill('#kp-label', 'Livraison');
  for (const k of ['1', '0', '00']) await act('key', `[data-v="${k}"]`);
  console.log('keypad display', await p.textContent('.keypad-display b'));
  await shot('53-keypad'); await act('kp-add');
  await act('pos-mode', '[data-v="grid"]');
  await act('cart-inc', '[data-i="1"]'); await act('cart-inc', '[data-i="1"]'); await act('cart-dec', '[data-i="1"]');
  console.log('cart total', await p.textContent('.pos-amount .val'));
  await act('pos-client'); await p.fill('#pc-who', 'Moussa'); await act('pos-client-ok');
  await shot('54-pos-cart', true);
  await act('pos-pay'); await p.fill('#co-given', '10000'); console.log('change', await p.textContent('#co-change')); await shot('55-checkout');
  await act('pos-confirm');
  let s = await db(); const last = s.sales[s.sales.length - 1];
  console.log('pos sale', last.who, JSON.stringify(last.items.map((i) => [i.name, i.qty, i.price])), last.pay, 'bissap stock', s.products.find((x) => x.id === 'p4').qty);
  await act('invoice'); await p.waitForTimeout(200); await shot('56-invoice-sheet');
  const url = await p.getAttribute('.preview', 'src'); fs.writeFileSync(`${out}/invoice-paid.png`, Buffer.from(url.split(',')[1], 'base64'));
  await act('close');
  // Facture à crédit avec remise et taxe
  await p.click('#tabbar [data-tab="home"]'); await p.waitForTimeout(1200); await act('fab-menu'); await shot('57-fab');
  await act('new', '[data-kind="sales"]');
  await p.fill('#f-who', 'Mme Ndiaye');
  await p.fill('.l-name', 'Plateau traiteur'); await p.fill('.l-qty', '2'); await p.fill('.l-price', '20000');
  await p.click('details.more summary'); await p.fill('#f-disc', '4000'); await p.fill('#f-tax', '18');
  await p.click('[data-group="pay"] [data-v="credit"]');
  console.log('due visible', await p.isVisible('#due-wrap'), 'total', await p.textContent('#f-total'), '|', await p.textContent('#f-break'));
  await shot('58-form-tax');
  await p.click('#entry-form button.btn:not(.ghost):not(.sm)');
  await act('invoice'); await p.waitForTimeout(200);
  fs.writeFileSync(`${out}/invoice-credit.png`, Buffer.from((await p.getAttribute('.preview', 'src')).split(',')[1], 'base64'));
  await act('close');
  // Factures
  await p.click('#tabbar [data-tab="more"]'); await shot('59-more');
  await act('go', '[data-v="invoices"]'); await shot('60-invoices');
  console.log('open invoices', await p.locator('#list-body .row').count());
  await act('filter', '[data-v="late"]'); console.log('late', await p.locator('#list-body .row').count());
  // Clients
  await p.click('#tabbar [data-tab="clients"]'); await shot('61-clients');
  await p.click('#fab'); await p.fill('#ct-name', 'Société Kora'); await p.fill('#ct-email', 'compta@kora.example'); await p.click('#client-form .btn');
  await shot('62-client-new');
  await act('close'); await act('filter', '[data-v="loyal"]'); console.log('loyal', await p.locator('#list-body .row').count());
  await act('filter', '[data-v="all"]'); console.log('all clients', await p.locator('#list-body .row').count());
  // Finances
  await p.click('#tabbar [data-tab="more"]'); await act('open-bilan'); await shot('63-finances', true);
  await act('period-type', '[data-v="year"]'); await shot('64-year');
  console.log('year label', await p.textContent('.month-nav b'), 'bars', await p.locator('.week .col').count());
  // Paramètres
  await p.click('#btn-settings'); await shot('65-settings', true);
  await act('close');
  // sombre
  await p.emulateMedia({ colorScheme: 'dark' }); await p.click('#tabbar [data-tab="home"]'); await p.waitForTimeout(1500); await shot('66-home-dark');
  await p.click('#tabbar [data-tab="pos"]'); await act('pos-add', '[data-id="p2"]'); await shot('67-pos-dark');
  console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
