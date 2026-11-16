// Un téléphone qui utilisait Gestio retrouve ses données et sa session après le passage à Kobo.
const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const errs = [];
  const old = {
    settings: { name: 'Boutique Fatou', type: 'shop', currency: 'FCFA', goal: 0, taxRate: 0, terms: 7, phone: '', email: '', address: '', taxId: '', footer: '' },
    sales: [{ id: 's1', n: 1, at: 1, who: 'Moussa', date: '2026-11-10', note: '', pay: 'cash', items: [{ name: 'Pagne', qty: 2, price: 7500 }] }],
    purchases: [], orders: [], products: [], contacts: {}, seq: { sale: 1, purchase: 0, order: 0 }, cloudOff: true,
  };
  await ctx.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('gestio.v1', JSON.stringify(data));
    localStorage.setItem('gestio.auth', '{"token":"ancienne-session"}');
  }, old);
  // Sans adresse Supabase : on vérifie seulement la reprise, sans que la bibliothèque ne valide la session factice.
  await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({
    kobo: !!localStorage.getItem('kobo.v1'), gestio: !!localStorage.getItem('gestio.v1'),
    auth: localStorage.getItem('kobo.auth'), oldAuth: localStorage.getItem('gestio.auth'),
    name: JSON.parse(localStorage.getItem('kobo.v1')).settings.name,
  }));
  console.log('migrated', JSON.stringify(st));
  console.log('home shows', (await p.textContent('#brand')).replace(/\s+/g, ' ').trim(), '| welcome?', await p.isVisible('.onb'));
  await p.click('#tabbar [data-tab="sales"]'); await p.click('[data-act="filter"][data-v="all"]');
  console.log('sale kept', await p.locator('#list-body .row').count());
  await p.screenshot({ path: `${out}/migration.png` });
  if (!st.kobo || st.gestio || st.name !== 'Boutique Fatou' || !st.auth || st.oldAuth) errs.push('migration incomplete');
  // Second chargement : rien n'est écrasé
  await p.reload(); await p.waitForTimeout(500);
  console.log('after reload', await p.evaluate(() => JSON.parse(localStorage.getItem('kobo.v1')).sales.length));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
