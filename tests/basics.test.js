const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], acceptDownloads: true });
  // Jamais le vrai serveur Supabase pendant les tests.
  await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('dialog', (d) => d.accept());
  const shot = (n) => p.screenshot({ path: `${out}/${n}.png` });
  const act = (a, extra = '') => p.click(`[data-act="${a}"]${extra}`);
  await p.goto('http://localhost:8123/?nosplash');
  await p.waitForTimeout(700); await shot('01-onb');
  await act('onb-go', '[data-v="business"]');
  await p.fill('#s-name', 'Chez Awa');
  await p.click('[data-group="type"] [data-v="food"]');
  await act('onb-next');
  await p.fill('#s-goal', '50000');
  await act('onb-next'); await act('onb-finish');
  await p.waitForTimeout(300);
  // vente 1
  await act('fab-menu'); await act('new', '[data-kind="sales"]');
  await p.fill('#f-who', 'Moussa');
  await p.fill('.l-name', 'Thiéboudienne'); await p.fill('.l-qty', '3'); await p.fill('.l-price', '2500');
  await act('line-add');
  await p.fill('.line:last-child .l-name', 'Jus de bissap'); await p.fill('.line:last-child .l-price', '500');
  await p.click('[data-group="pay"] [data-v="mobile"]');
  await shot('02-form');
  await p.click('#entry-form button.btn:not(.ghost)');
  await p.waitForTimeout(200);
  await shot('03-detail');
  await act('receipt');
  await p.waitForTimeout(200);
  await shot('04-receipt');
  const dl = p.waitForEvent('download'); await act('receipt-dl'); const d = await dl; await d.saveAs(`${out}/recu.png`);
  console.log('download', d.suggestedFilename());
  await act('close');
  // vente à crédit, autocomplétion du prix
  await p.click('#tabbar [data-tab="sales"]'); await p.click('#fab');
  await p.fill('.l-name', 'Jus de bissap');
  console.log('autoprice', await p.inputValue('.l-price'));
  await p.fill('.l-qty', '4'); await p.click('[data-group="pay"] [data-v="credit"]');
  await p.click('#entry-form button.btn:not(.ghost)'); await act('close');
  // achat
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="purchases"]'); await p.click('#fab');
  await p.fill('#f-who', 'Marché central'); await p.fill('.l-name', 'Riz 25kg'); await p.fill('.l-price', '14000');
  await p.click('#entry-form button.btn:not(.ghost)');
  await shot('05-purchases');
  // commande
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="orders"]'); await p.click('#fab');
  await p.fill('#f-who', 'Fatou'); await p.fill('.l-name', 'Plateau traiteur'); await p.fill('.l-price', '45000'); await p.fill('#f-deposit', '20000');
  await p.click('#entry-form button.btn:not(.ghost)');
  await shot('06-orders');
  await act('detail', '[data-kind="orders"]'); await shot('07-order-detail');
  await act('status', '[data-v="ready"]');
  await act('to-sale'); await act('deliver'); await p.waitForTimeout(200); await shot('08-converted');
  await act('close');
  await p.click('#tabbar [data-tab="home"]'); await p.waitForTimeout(1800); await shot('09-home');
  await p.screenshot({ path: `${out}/09b-home-full.png`, fullPage: true });
  // carte
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="card"]');
  await p.fill('[data-card="name"]', 'Awa Diallo'); await p.fill('[data-card="role"]', 'Gérante');
  await p.fill('[data-card="phone"]', '+221 77 123 45 67'); await p.fill('[data-card="email"]', 'awa@chezawa.sn'); await p.fill('[data-card="address"]', 'Médina, Dakar');
  await shot('10-card');
  for (const t of ['modern', 'gradient', 'minimal']) {
    await act('card-tpl', `[data-v="${t}"]`);
    const url = await p.evaluate(() => document.querySelector('#card-canvas').toDataURL());
    require('fs').writeFileSync(`${out}/card-${t}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  // paramètres
  await p.click('#btn-settings'); await p.fill('#s-phone', '+221 77 123 45 67'); await p.fill('#s-address', 'Médina, Dakar');
  await shot('11-settings'); await act('settings-save');
  await p.click('#tabbar [data-tab="sales"]'); await act('filter', '[data-v="credit"]'); await shot('12-sales-credit');
  await act('detail'); await act('cash-in'); await act('cash-in-save'); await act('delete'); await act('confirm-no'); await act('delete'); await act('confirm-yes');
  // persistance + dark
  await p.reload(); 
  console.log('state', await p.evaluate(() => { const d = JSON.parse(localStorage['kobo.v1']); return [d.sales.length, d.purchases.length, d.orders.length, d.settings.phone, d.orders[0].status, !!d.orders[0].saleId].join(' '); }));
  await p.emulateMedia({ colorScheme: 'dark' }); await shot('13-dark');
  console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await p.waitForTimeout(500);
  console.log('sw', await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r)));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
