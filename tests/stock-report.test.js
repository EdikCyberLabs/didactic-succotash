const { chromium, devices } = require('playwright');
const out = process.argv[2], root = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const shot = (n) => p.screenshot({ path: `${out}/${n}.png` });
  const act = (a, extra = '') => p.click(`[data-act="${a}"]${extra}`);
  const qty = (name) => p.evaluate((n) => JSON.parse(localStorage['kobo.v1']).products.find((x) => x.name === n).qty, name);
  const save = () => p.click('#entry-form button.btn:not(.ghost)');
  await p.goto('http://localhost:8123/?nosplash');
  await act('onb-go', '[data-v="business"]'); await p.fill('#s-name', 'Chez Awa'); await p.waitForTimeout(600); await shot('19-onb2'); await act('onb-next'); await act('onb-next'); await act('onb-finish');
  // articles
  await p.click('#tabbar [data-tab="more"]'); await shot('20-more');
  await act('go', '[data-v="stock"]'); await shot('21-stock-empty');
  for (const [n, pr, q, m] of [['Jus de bissap', '600', '10', '8'], ['Thiéboudienne', '2500', '', ''], ['Riz 25kg', '16000', '3', '1']]) {
    await p.click('#fab'); await p.fill('#p-name', n); await p.fill('#p-price', pr); await p.fill('#p-qty', q); await p.fill('#p-min', m);
    await p.click('#product-form button.btn'); await p.waitForTimeout(50);
  }
  // doublon refusé
  await p.click('#fab'); await p.fill('#p-name', 'jus de bissap'); await p.click('#product-form button.btn');
  console.log('dup sheet still open', await p.isVisible('#product-form')); await act('close');
  // vente par raccourcis
  await p.click('#tabbar [data-tab="sales"]'); await p.click('#fab');
  await act('quick-item', ':has-text("Jus de bissap")'); await act('quick-item', ':has-text("Jus de bissap")'); await act('quick-item', ':has-text("Thiéboudienne")');
  await shot('22-quick'); console.log('total', await p.textContent('#f-total'));
  await save(); await act('close');
  console.log('after sale (8)', await qty('Jus de bissap'));
  // modification de la vente : 2 -> 5
  await act('detail'); await act('edit'); await p.fill('.line .l-qty', '5'); await save();
  console.log('after edit (5)', await qty('Jus de bissap'));
  // achat
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="purchases"]'); await p.click('#fab');
  await p.fill('.l-name', 'Jus de bissap'); await p.fill('.l-qty', '20'); await p.fill('.l-price', '300'); await save();
  console.log('after purchase (25)', await qty('Jus de bissap'));
  // commande -> vente
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="orders"]'); await p.click('#fab');
  await act('quick-item', ':has-text("Riz 25kg")'); await p.fill('.line .l-qty', '3'); await save();
  console.log('after order (3)', await qty('Riz 25kg'));
  await act('detail'); await act('to-sale'); await act('deliver'); await act('close');
  console.log('after convert (0)', await qty('Riz 25kg'));
  await p.click('#tabbar [data-tab="home"]'); await p.waitForTimeout(1600); await shot('23-home-low');
  await act('low-stock'); await shot('24-stock-low');
  // suppression d'une vente -> stock rendu
  await p.click('#tabbar [data-tab="sales"]'); await act('detail', ':has-text("Riz")'); await act('delete'); await act('confirm-yes');
  console.log('after delete (3)', await qty('Riz 25kg'));
  // logo
  await p.click('#btn-settings'); await p.setInputFiles('#logo-file', root + '/icons/icon-512.png'); await p.waitForTimeout(300);
  await shot('25-settings-logo'); await act('settings-save'); await p.waitForTimeout(300);
  console.log('logo bytes', await p.evaluate(() => JSON.parse(localStorage['kobo.v1']).settings.logo.length));
  await act('detail'); await act('receipt'); await shot('26-receipt-logo'); await act('close');
  await p.click('#tabbar [data-tab="more"]'); await act('go', '[data-v="card"]'); await p.waitForTimeout(200);
  const fs = require('fs');
  for (const t of ['modern', 'gradient', 'minimal']) {
    await act('card-tpl', `[data-v="${t}"]`); await p.waitForTimeout(100);
    fs.writeFileSync(`${out}/logo-card-${t}.png`, Buffer.from((await p.evaluate(() => document.querySelector('#card-canvas').toDataURL())).split(',')[1], 'base64'));
  }
  // rapport
  await act('go'); await act('open-bilan'); await act('period-type', '[data-v="month"]'); await p.screenshot({ path: `${out}/27-report.png`, fullPage: true });
  const dl = p.waitForEvent('download'); await act('csv'); const d = await dl; await d.saveAs(`${out}/mois.csv`);
  console.log(d.suggestedFilename()); console.log(fs.readFileSync(`${out}/mois.csv`, 'utf8'));
  await act('period', '[data-v="-1"]'); await shot('28-report-empty');
  console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
