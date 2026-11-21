// « Ma journée » : entrées, sorties, solde, bénéfice estimé, factures impayées, au franc près.
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
    const T = day(0), Y = day(-3);
    const it = (name, qty, price) => ({ name, qty, price });
    localStorage.setItem('kobo.v1', JSON.stringify({
      settings: { name: 'Boutique Fatou', type: 'shop', currency: 'FCFA', taxRate: 0, terms: 7 },
      sales: [
        { id: 's1', n: 1, at: 1, date: T, who: 'Moussa', pay: 'mobile', items: [it('Pagne', 2, 5000)] },                       // payé : 10 000
        { id: 's2', n: 2, at: 2, date: T, who: 'Awa', pay: 'credit', paid: 5000, payments: [{ date: T, amount: 5000, method: 'cash' }], items: [it('Wax', 1, 20000)] }, // 5 000 reçus, reste 15 000
        { id: 's3', n: 3, at: 3, date: Y, who: 'Ibrahima', pay: 'credit', paid: 3000, payments: [{ date: T, amount: 3000, method: 'mobile' }], items: [it('Sac', 1, 8000)] }, // ancien : 3 000 reçus aujourd'hui, reste 5 000
        { id: 's4', n: 4, at: 4, date: Y, who: 'Moussa', pay: 'cash', items: [it('Pagne', 1, 5000)] },                       // autre jour
      ],
      purchases: [{ id: 'a1', n: 1, at: 5, date: T, who: 'Grossiste', cat: 'Marchandises', items: [it('Tissu', 1, 4000)] }],
      orders: [{ id: 'c1', n: 1, at: 6, date: T, who: 'Fatou', items: [it('Robe', 1, 15000)], deposit: 2000, due: T, status: 'new' }],
      products: [], contacts: {}, seq: { sale: 4, purchase: 1, order: 1 }, cloudConsent: false,
    }));
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8123/?nosplash'); await p.waitForTimeout(600);
  console.log('home row:', (await p.textContent('.day-row .sub')).trim(), '|', (await p.textContent('.day-row .amt')).trim());
  await p.click('button.big-amount'); await p.waitForTimeout(300);
  const vals = await p.$$eval('.stats .val', (x) => x.map((e) => e.textContent.trim()));
  console.log('entré / sorti / solde:', vals.join(' | '));
  const kv = await p.$$eval('.card .kv', (x) => x.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  console.log(kv.join(' || '));
  const expect = ['20 000', '4 000', '+16 000'];
  if (vals.join() !== expect.join()) errs.push('stats ' + vals.join() + ' != ' + expect.join());
  if (!kv.some((k) => /Bénéfice estimé \+26 000/.test(k))) errs.push('profit');
  if (!kv.some((k) => /Dont impayées 1 · reste 15 000/.test(k))) errs.push('unpaid');
  if (!kv.some((k) => /Total dû par vos clients 20 000/.test(k))) errs.push('owed all');
  console.log('methods:', (await p.$$eval('.bars .bar-row .top', (x) => x.map((e) => e.innerText.replace(/\s+/g, ' ')))).join(' | '));
  console.log('operations:', await p.locator('.list .row').count());
  await p.screenshot({ path: `${out}/day-today.png`, fullPage: true });
  await p.click('[data-act="day-step"][data-v="-1"]'); console.log('yesterday title:', await p.textContent('.month-nav b'));
  await p.click('[data-act="day-step"][data-v="-1"]'); await p.click('[data-act="day-step"][data-v="-1"]');
  console.log('3 days ago in:', await p.$$eval('.stats .val', (x) => x.map((e) => e.textContent.trim()).join(' | ')));
  await p.click('[data-act="day-step"][data-v="1"]'); await p.click('[data-act="day-step"][data-v="1"]'); await p.click('[data-act="day-step"][data-v="1"]');
  console.log('next disabled on today:', await p.isDisabled('[data-act="day-step"][data-v="1"]'));
  await p.click('[data-act="share-day"]'); await p.waitForTimeout(400);
  const txt = await p.evaluate(() => (document.getElementById('share-text') || {}).value || '');
  console.log('share text starts:', txt.split('\n').slice(0, 5).join(' / '));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
