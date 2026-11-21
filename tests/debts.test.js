// Impayés : liste par client avec montant dû et ancienneté, relance WhatsApp préremplie (jamais envoyée automatiquement).
const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    const pad = (n) => String(n).padStart(2, '0');
    const day = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    const it = (name, qty, price) => ({ name, qty, price });
    localStorage.setItem('kobo.v1', JSON.stringify({
      settings: { name: 'Boutique Fatou', type: 'shop', currency: 'FCFA', taxRate: 0, terms: 7, dial: '' },
      sales: [
        { id: 's1', n: 1, at: 1, date: day(-45), who: 'Awa', pay: 'credit', paid: 0, due: day(-38), items: [it('Pagne', 1, 5000)] },
        { id: 's2', n: 2, at: 2, date: day(-10), who: 'Awa', pay: 'credit', paid: 2000, payments: [{ date: day(-5), amount: 2000, method: 'cash' }], items: [it('Wax', 1, 12000)] },
        { id: 's3', n: 3, at: 3, date: day(-2), who: 'Ibrahima', pay: 'credit', paid: 0, items: [it('Sac', 1, 40000)] },
        { id: 's4', n: 4, at: 4, date: day(0), who: 'Koffi', pay: 'credit', paid: 0, items: [it('Robe', 1, 8000)] },
        { id: 's5', n: 5, at: 5, date: day(-1), who: '', pay: 'credit', paid: 0, items: [it('Tissu', 1, 3000)] },
        { id: 's6', n: 6, at: 6, date: day(-1), who: 'Moussa', pay: 'cash', items: [it('Pagne', 1, 5000)] },
      ],
      purchases: [], orders: [], products: [],
      contacts: { awa: { name: 'Awa', phone: '77 123 45 67' }, ibrahima: { name: 'Ibrahima', phone: '+221 76 000 00 01' }, koffi: { name: 'Koffi', phone: '07 08 09 10 11' } },
      seq: { sale: 6, purchase: 0, order: 0 }, cloudConsent: false,
    }));
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8123/?nosplash'); await p.waitForTimeout(600);
  await p.click('.row[data-v="debts"]'); await p.waitForTimeout(300);
  console.log('summary:', (await p.textContent('.summary')).replace(/\s+/g, ' ').trim());
  const rows = await p.$$eval('.debt-main', (x) => x.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  console.log('by age:', rows.join(' || '));
  if (!/^AW? ?Awa/.test(rows[0].replace(/^A /, 'A')) && !rows[0].includes('Awa')) errs.push('oldest first');
  if (!rows[0].includes('45 jours') || !rows[0].includes('15 000') || !rows[0].includes('en retard')) errs.push('Awa row');
  console.log('unnamed shown:', await p.isVisible('.day-head'));
  await p.screenshot({ path: `${out}/debts.png`, fullPage: true });
  await p.click('[data-act="debt-sort"][data-v="amount"]');
  console.log('by amount first:', (await p.$$eval('.debt-main .title', (x) => x.map((e) => e.textContent))).join(', '));
  // Relance d'Awa : numéro local sans indicatif → choix du pays
  await p.click('.debt-remind[data-key="awa"]'); await p.waitForTimeout(200);
  const msg = await p.inputValue('#share-text');
  console.log('message refs:', /F-0001/.test(msg) && /F-0002/.test(msg), '| amount', /15 000 FCFA/.test(msg));
  console.log('no WhatsApp before country:', !(await p.isVisible('#wa-link')), '| country select', await p.isVisible('#rm-dial'));
  await p.screenshot({ path: `${out}/debts-remind-nodial.png` });
  await p.fill('#share-text', msg + '\nÀ bientôt !');
  await p.selectOption('#rm-dial', '221'); await p.waitForTimeout(200);
  const href = await p.getAttribute('#wa-link', 'href');
  console.log('wa Sénégal:', href.slice(0, 32), '| edited text kept', decodeURIComponent(href).includes('À bientôt !'));
  if (!href.startsWith('https://wa.me/221771234567?text=')) errs.push('bad wa link ' + href);
  await p.screenshot({ path: `${out}/debts-remind.png` });
  await p.click('#sheet [data-act="close"]');
  // Numéro déjà international
  await p.click('.debt-remind[data-key="ibrahima"]'); console.log('wa intl:', (await p.getAttribute('#wa-link', 'href')).slice(0, 30)); await p.click('#sheet [data-act="close"]');
  // Côte d'Ivoire : le 0 de tête est gardé
  await p.evaluate(() => { const d = JSON.parse(localStorage['kobo.v1']); d.settings.dial = '225'; localStorage['kobo.v1'] = JSON.stringify(d); });
  await p.reload(); await p.waitForTimeout(500); await p.click('#tabbar [data-tab="more"]'); await p.click('[data-act="go"][data-v="debts"]');
  await p.click('.debt-remind[data-key="koffi"]'); const ci = await p.getAttribute('#wa-link', 'href'); console.log('wa Côte d’Ivoire:', ci.slice(0, 32));
  if (!ci.startsWith('https://wa.me/2250708091011?')) errs.push('CI link ' + ci);
  await p.click('#sheet [data-act="close"]');
  // Paramètres : le pays est enregistré
  await p.click('#btn-settings'); console.log('settings dial:', await p.inputValue('#s-dial')); await p.click('#sheet [data-act="close"]');
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
