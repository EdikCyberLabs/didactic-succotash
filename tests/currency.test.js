// Devises : rouble russe, liste avec mini icônes, recherche, clavier, commerces existants.
// node tests/currency.test.js tests/output
const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function open(opts, init) {
    const ctx = await b.newContext(opts);
    // Jamais le vrai projet Supabase
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    await p.goto('http://localhost:8123/?nosplash'); await p.waitForTimeout(500);
    return p;
  }
  const data = (p) => p.evaluate(() => JSON.parse(localStorage['kobo.v1'] || 'null'));
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  // 1. Téléphone : choisir le rouble pendant l'accueil
  const p = await open({ ...devices['Pixel 7'] });
  await p.click('#sheet [data-act="onb-go"][data-v="business"]'); await p.fill('#s-name', 'Magasin Ivan'); await p.click('#sheet [data-act="onb-next"]');
  console.log('default currency:', await p.getAttribute('#s-currency', 'value'));
  await p.click('#s-currency'); await p.waitForTimeout(300);
  const count = await p.locator('.cur-opt').count();
  const first = (await p.textContent('.cur-opt .cur-name')).trim();
  const icons = await p.$$eval('.cur-opt .cur-ico', (x) => x.every((e) => e.textContent.trim() && e.getBoundingClientRect().width === 28));
  console.log('options', count, '| first', first, '| all have a 28px icon', icons, '| overflow', await overflow(p));
  if (count !== 16 || first !== 'Franc CFA' || !icons) errs.push('currency list');
  await p.screenshot({ path: `${out}/currency-phone-list.png` });
  await p.fill('.cur-q', 'rou'); await p.waitForTimeout(100);
  const found = await p.$$eval('.cur-opt:not([hidden]) .cur-name', (x) => x.map((e) => e.textContent));
  console.log('search "rou":', found.join(', '));
  if (found.join() !== 'Rouble russe') errs.push('search rou: ' + found);
  await p.fill('.cur-q', 'rub'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  console.log('picked:', await p.getAttribute('#s-currency', 'value'), '| list closed', !(await p.isVisible('.cur-modal')), '| onboarding still open', await p.isVisible('#sheet [data-act="onb-next"]'));
  if ((await p.getAttribute('#s-currency', 'value')) !== '₽') errs.push('rouble not picked');
  await p.screenshot({ path: `${out}/currency-phone-picked.png` });
  await p.click('#sheet [data-act="onb-next"]'); await p.waitForTimeout(200);
  if (await p.isVisible('#sheet [data-act="consent"][data-v="no"]')) { await p.click('#sheet [data-act="consent"][data-v="no"]'); await p.waitForTimeout(400); }
  await p.click('#sheet [data-act="onb-finish"]'); await p.waitForTimeout(500);
  console.log('saved currency:', (await data(p)).settings.currency, '| home pill', (await p.textContent('.cur-pill')).trim());
  // Une vente de 1 500 ₽
  await p.click('#tabbar [data-tab="pos"]');
  await p.click('[data-act="pos-mode"][data-v="keypad"]');
  for (const k of ['1', '5', '0', '0']) await p.click(`[data-act="key"][data-v="${k}"]`);
  await p.click('[data-act="kp-add"]'); await p.click('[data-act="pos-pay"]'); await p.waitForTimeout(250);
  await p.click('#sheet [data-act="pos-confirm"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/currency-phone-receipt.png` });
  const receipt = await p.evaluate(() => document.querySelector('#sheet').innerText.replace(/\s+/g, ' '));
  const want = '1 500,00 ₽';
  console.log('receipt shows', want, receipt.replace(/\u202f|\u00a0/g, ' ').includes(want));
  if (!receipt.replace(/\u202f|\u00a0/g, ' ').includes(want)) errs.push('amount format: ' + receipt.slice(0, 200));
  await p.click('#sheet [data-act="close"]').catch(() => {}); await p.waitForTimeout(200);
  await p.click('#tabbar [data-tab="home"]');
  // Paramètres : passer à l'euro avec la souris, Échap ne ferme que la liste
  await p.click('#btn-settings'); await p.waitForTimeout(300);
  await p.click('#s-currency'); await p.waitForTimeout(200);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  console.log('Escape closes list only:', !(await p.isVisible('.cur-modal')), '| settings still open', await p.isVisible('#sheet [data-act="settings-save"]'));
  if (await p.isVisible('.cur-modal') || !(await p.isVisible('#sheet [data-act="settings-save"]'))) errs.push('escape');
  await p.click('#s-currency'); await p.click('.cur-opt[data-v="€"]'); await p.click('#sheet [data-act="settings-save"]'); await p.waitForTimeout(300);
  console.log('after settings:', (await data(p)).settings.currency);
  if ((await data(p)).settings.currency !== '€') errs.push('settings currency');
  await p.context().close();

  // 2. Commerce existant en euro, ordinateur : la bonne devise est cochée, clavier, pas de débordement
  const seed = () => {
    if (localStorage['kobo.v1']) return;
    const t = new Date(); const T = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    localStorage['kobo.v1'] = JSON.stringify({ settings: { name: 'Café Paris', type: 'food', currency: '€', taxRate: 0, terms: 7 }, sales: [{ id: 's1', n: 1, at: 1, date: T, who: '', pay: 'cash', items: [{ name: 'Café', qty: 1, price: 1500 }] }], purchases: [], orders: [], products: [], contacts: {}, seq: { sale: 1, purchase: 0, order: 0 }, cloudConsent: false });
  };
  const d = await open({ viewport: { width: 1440, height: 900 } }, seed);
  console.log('home pill (euro):', (await d.textContent('.cur-pill')).trim(), '| money', (await d.textContent('.big-amount')).trim());
  await d.click('#btn-settings'); await d.waitForTimeout(300);
  console.log('settings button:', (await d.textContent('#s-currency .cur-name')).trim());
  await d.click('#s-currency'); await d.waitForTimeout(200);
  const sel = await d.$$eval('.cur-opt[aria-selected="true"]', (x) => x.map((e) => e.dataset.v));
  const panel = await d.locator('.cur-panel').boundingBox();
  console.log('selected', sel.join(), '| search focused', await d.evaluate(() => document.activeElement.className), '| centered', Math.abs(panel.x + panel.width / 2 - 720) < 4, '| overflow', await overflow(d));
  if (sel.join() !== '€') errs.push('existing euro not selected');
  await d.screenshot({ path: `${out}/currency-desk-list.png` });
  await d.keyboard.press('ArrowDown'); await d.keyboard.press('ArrowDown'); await d.keyboard.press('Enter'); await d.waitForTimeout(150);
  console.log('keyboard picked:', await d.getAttribute('#s-currency', 'value'));
  if ((await d.getAttribute('#s-currency', 'value')) !== 'GNF') errs.push('keyboard pick');
  await d.context().close();

  // 3. Thème sombre à 360 px
  const m = await open({ viewport: { width: 360, height: 760 }, colorScheme: 'dark' }, seed);
  await m.click('#btn-settings'); await m.waitForTimeout(300); await m.click('#s-currency'); await m.waitForTimeout(200);
  console.log('360px dark overflow:', await overflow(m));
  if (await overflow(m)) errs.push('overflow 360');
  await m.screenshot({ path: `${out}/currency-360-dark.png` });
  await m.context().close();
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
