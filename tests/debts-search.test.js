const { chromium, devices } = require('playwright'); const fs = require('fs');
const out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(process.argv[2], 'utf8');
  fs.writeFileSync(process.argv[2] + '.wrapped.html', html);
  await p.goto('file://' + process.argv[2] + '.wrapped.html'); await p.waitForTimeout(600);
  const shot = (n, full) => p.screenshot({ path: `${out}/${n}.png`, fullPage: !!full });
  const act = (a, extra = '') => p.click(`[data-act="${a}"]${extra}`);
  const db = () => p.evaluate(() => JSON.parse(localStorage['kobo.v1'] || 'null'));
  await shot('30-home', true);
  // "On vous doit" -> clients
  await p.click('#tabbar [data-tab="clients"]'); await act('filter', '[data-v="owed"]'); await shot('31-clients-owed');
  console.log('owed rows', await p.locator('#list-body .row').count(), await p.textContent('#list-body .summary b'));
  await act('client', '[data-key="mme ndiaye"]'); await shot('32-client');
  await act('remind'); await shot('33-remind');
  console.log('wa', (await p.getAttribute('#wa-link', 'href')).slice(0, 60));
  await p.click('#sheet .btn.plain[data-act="client"]');
  // ouvrir la vente à crédit depuis l'historique, versement partiel puis solde
  await p.click('#sheet .row[data-kind="sales"]'); await shot('34-credit-detail');
  await act('cash-in'); await p.fill('#c-amount', '3000'); await p.click('[data-group="pay"] [data-v="mobile"]'); await act('cash-in-save');
  let s = (await db());
  const nd = s ? s.sales.find((x) => x.who === 'Mme Ndiaye') : null;
  console.log('after partial', nd && nd.paid, nd && nd.pay);
  await act('cash-in'); await act('cash-in-save');
  s = await db(); const nd2 = s.sales.find((x) => x.who === 'Mme Ndiaye');
  console.log('after full', nd2.paid, nd2.pay, nd2.payments.length); await shot('35-paid');
  // refaire la vente
  await act('repeat'); console.log('repeat lines', await p.locator('#lines .line').count(), await p.inputValue('#f-who'), await p.textContent('#f-total'));
  await act('close');
  // livrer la commande de Fatou à crédit (acompte 20000)
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="orders"]'); await act('detail', '[data-id="c1"]'); await act('status', '[data-v="done"]'); await shot('36-deliver');
  await p.click('[data-group="pay"] [data-v="credit"]'); await act('deliver');
  s = await db(); const fs2 = s.sales.find((x) => x.note === 'Commande C-0001');
  console.log('delivered', fs2.pay, fs2.paid, fs2.payments.length, s.orders.find((o) => o.id === 'c1').status);
  await act('close');
  // recherche
  await p.click('#btn-search'); await p.fill('#gq', 'fatou'); await p.waitForTimeout(100); await shot('37-search');
  console.log('search fatou', await p.locator('#gres .row').count());
  await p.fill('#gq', 'V-0003'); console.log('search ref', await p.locator('#gres .row').count());
  await p.fill('#gq', '45000'); console.log('search amount', await p.locator('#gres .row').count());
  await act('close');
  // ventes groupées par jour
  await p.click('#tabbar [data-tab="sales"]'); await act('filter', '[data-v="week"]'); await shot('38-sales-days');
  console.log('day heads', await p.locator('.day-head').count());
  // bilan
  await p.click('#tabbar [data-tab="home"]'); await p.waitForTimeout(1200); await act('open-bilan'); await p.waitForTimeout(200); await shot('39-bilan-week', true);
  console.log('tips', await p.locator('.tips p').count());
  console.log((await p.locator('.tips').innerText()).split('\n').join(' | '));
  await act('period', '[data-v="-1"]'); await shot('40-bilan-prevweek');
  await act('period-type', '[data-v="month"]'); await shot('41-bilan-month', true);
  console.log('next disabled', await p.isDisabled('[data-act="period"][data-v="1"]'));
  await act('share-bilan'); await p.waitForTimeout(400); await shot('42-share');
  console.log('share fallback visible', await p.isVisible('#share-text'), await p.isVisible('.toast')); await act('close');
  // articles : coût
  await p.click('#tabbar [data-tab="more"]'); await shot('43-more');
  await act('go', '[data-v="stock"]'); await shot('44-stock');
  await p.emulateMedia({ colorScheme: 'dark' }); await act('go'); await act('open-bilan'); await shot('45-bilan-dark');
  console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
