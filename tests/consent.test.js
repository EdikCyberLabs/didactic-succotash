// Consentement : rien ne part en ligne sans « oui » ; refus, activation plus tard, téléphone déjà en service, arrêt.
const { chromium, devices } = require('playwright'); const fs = require('fs');
const { store, handle } = require('./mock-server.js');
const S = process.argv[2], out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  let calls = 0;
  async function device(name, init) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] });
    await ctx.exposeFunction('__sb', (op, args) => { calls++; return JSON.stringify(handle(op, JSON.parse(args))); });
    await ctx.route('**/vendor/supabase.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(S + '/mock-supabase.js', 'utf8') }));
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: 'https://test.supabase.co', key: 'sb_publishable_test' };" }));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
    await p.goto('http://localhost:8123/?nosplash'); await p.waitForTimeout(500);
    return p;
  }
  const act = (p, a, e = '') => p.click(`#sheet [data-act="${a}"]${e}`);
  const data = (p) => p.evaluate(() => JSON.parse(localStorage['kobo.v1'] || 'null'));

  // 1. Refus pendant l'accueil
  const A = await device('A');
  await act(A, 'onb-go', '[data-v="business"]'); await A.fill('#s-name', 'Boutique Fatou'); await act(A, 'onb-next'); await act(A, 'onb-next');
  await A.waitForTimeout(300); await A.screenshot({ path: `${out}/consent-onboarding.png`, fullPage: true });
  console.log('step label:', await A.textContent('.onb-top .small'));
  await act(A, 'consent', '[data-v="no"]'); await A.waitForTimeout(800);
  console.log('A refused: consent', (await data(A)).cloudConsent, '| calls to server', calls, '| done text', (await A.textContent('.onb-form p.small')).slice(0, 40));
  if (calls) errs.push('server contacted after refusal');
  await act(A, 'onb-finish'); await A.waitForTimeout(600);
  await A.click('#tabbar [data-tab="pos"]'); await A.click('.pos-grid [data-act="product"]'); await A.fill('#p-name', 'Pagne'); await A.fill('#p-price', '7500'); await A.click('#product-form .btn');
  await A.waitForTimeout(2000);
  console.log('still nothing sent after edits:', calls === 0);
  // Activation plus tard depuis Plus › Compte
  await A.click('#tabbar [data-tab="more"]'); console.log('more row:', await A.textContent('[data-act="sync"] .sub'));
  await A.click('[data-act="sync"]'); await A.screenshot({ path: `${out}/consent-account-off.png` });
  await act(A, 'cloud-on'); await A.waitForTimeout(300); await A.screenshot({ path: `${out}/consent-settings.png` });
  await act(A, 'consent', '[data-v="yes"]'); await A.waitForTimeout(1500);
  const dA = await data(A);
  console.log('A activated: consent', dA.cloudConsent, '| business', dA.sync && dA.sync.business.name, '| records on server', store.records.size);
  // Arrêt
  await act(A, 'cloud-stop'); await act(A, 'confirm-yes'); await A.waitForTimeout(300); await A.screenshot({ path: `${out}/consent-stopped.png` }); await act(A, 'close');
  const before = store.records.size;
  await A.click('#tabbar [data-tab="pos"]'); await A.click('.pos-grid [data-act="pos-add"]'); await A.click('[data-act="pos-pay"]'); await act(A, 'pos-confirm'); await act(A, 'close'); await A.waitForTimeout(2200);
  console.log('after stop: consent', (await data(A)).cloudConsent, '| new sale sent?', store.records.size !== before);
  if (store.records.size !== before) errs.push('sent after stop');

  // 2. Téléphone déjà en service avant la mise à jour : question au lancement, rien d'envoyé avant la réponse
  const callsBefore = calls;
  const B = await device('B', () => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('kobo.v1', JSON.stringify({ settings: { name: 'Ancien commerce', type: 'shop', currency: 'FCFA' }, sales: [], purchases: [], orders: [], products: [], contacts: {}, seq: { sale: 0, purchase: 0, order: 0 } }));
  });
  await B.waitForTimeout(800);
  console.log('B asked at start:', await B.isVisible('#sheet [data-act="consent"][data-v="yes"]'), '| calls before answer', calls - callsBefore);
  await B.screenshot({ path: `${out}/consent-existing.png` });
  await act(B, 'consent', '[data-v="yes"]'); await B.waitForTimeout(1500);
  console.log('B after yes: business', (await data(B)).sync && (await data(B)).sync.business.name, '| sheet closed', await B.isHidden('#sheet-backdrop'));
  await B.reload(); await B.waitForTimeout(600);
  console.log('B not asked again:', !(await B.isVisible('#sheet [data-act="consent"]')));

  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
