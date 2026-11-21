// Version web sur grand écran : menu latéral, tableau de bord, fenêtres, caisse au clavier, impression.
// node tests/desktop.test.js tests/output/preview.html tests/output
const { chromium } = require('playwright'); const fs = require('fs');
const [, , html, out] = process.argv;
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const wrapped = html + '.desktop.html';
  fs.writeFileSync(wrapped, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(html, 'utf8'));
  async function open(w, h, scheme) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme || 'light' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(`${w}px PAGEERR ${e.message}`));
    await p.goto('file://' + wrapped + '?nosplash'); await p.waitForTimeout(700);
    return p;
  }
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  // 1. Aucune barre de défilement horizontale, du téléphone au grand écran
  for (const w of [360, 768, 1024, 1280, 1440, 1920]) {
    const p = await open(w, 900);
    const o = [await overflow(p)];
    for (const tab of ['sales', 'clients', 'pos']) { await p.click(`#tabbar [data-tab="${tab}"]`); o.push(await overflow(p)); }
    console.log(`${w}px overflow:`, o.some(Boolean), '| sidebar', await p.isVisible('.nav-brand'));
    if (o.some(Boolean)) errs.push(`overflow at ${w}px`);
    if ((w >= 1024) !== (await p.isVisible('.nav-brand'))) errs.push(`sidebar visibility at ${w}px`);
    await p.context().close();
  }

  // 2. Grand écran 1440 × 900 : menu latéral et toutes les rubriques
  const p = await open(1440, 900);
  const nav = await p.locator('#tabbar').boundingBox();
  console.log('sidebar box:', JSON.stringify({ x: nav.x, w: Math.round(nav.width), h: nav.height }));
  await p.screenshot({ path: `${out}/desk-1440-home.png` });
  for (const tab of ['today', 'debts', 'bilan', 'invoices', 'purchases', 'orders', 'stock', 'card', 'pos', 'sales', 'clients', 'more', 'home']) {
    await p.click(`#tabbar [data-tab="${tab}"]`); await p.waitForTimeout(120);
    const active = await p.$$eval('#tabbar button.active', (x) => x.map((e) => e.dataset.tab));
    if (active.length !== 1 || active[0] !== tab) errs.push(`active ${tab}: ${active}`);
    if (['today', 'debts', 'bilan', 'pos', 'sales'].includes(tab)) await p.screenshot({ path: `${out}/desk-1440-${tab}.png` });
  }
  console.log('navigation: all entries ok');
  // Fenêtre centrée (paramètres) et panneau latéral (fiche de vente)
  await p.click('#btn-settings'); await p.waitForTimeout(300);
  const sb = await p.locator('#sheet').boundingBox();
  console.log('settings sheet:', Math.round(sb.x), Math.round(sb.width), '| centered', Math.abs(sb.x + sb.width / 2 - 720) < 4);
  await p.click('#sheet [data-act="close"]');
  await p.click('#tabbar [data-tab="sales"]'); await p.click('#list-body .row[data-act="detail"]'); await p.waitForTimeout(350);
  const side = await p.locator('#sheet').boundingBox();
  console.log('detail panel: right edge', Math.round(side.x + side.width), '| height', side.height, '| class', await p.getAttribute('#sheet', 'class'));
  await p.screenshot({ path: `${out}/desk-1440-detail.png` });
  // Impression d'une facture
  await p.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await p.click('#sheet [data-act="invoice"]'); await p.waitForTimeout(300);
  await p.click('#sheet [data-act="receipt-print"]'); await p.waitForTimeout(300);
  console.log('print called', await p.evaluate(() => window.__printed), '| print area', await p.evaluate(() => document.querySelector('#print-area').className + ' ' + !!document.querySelector('#print-area img')));
  await p.emulateMedia({ media: 'print' }); await p.screenshot({ path: `${out}/desk-print.png` }); await p.emulateMedia({ media: 'screen' });
  await p.click('#sheet [data-act="close"]');

  // 3. Caisse au clavier
  await p.click('#tabbar [data-tab="pos"]'); await p.waitForTimeout(200);
  await p.locator('body').click({ position: { x: 1400, y: 880 } }).catch(() => {});
  await p.keyboard.type('maf'); await p.waitForTimeout(100);
  console.log('search:', await p.inputValue('#pos-q'), '| visible tiles', await p.locator('.pos-grid .ptile[data-name]:not([hidden])').count());
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await p.keyboard.press('+'); await p.waitForTimeout(150);
  let lines = await p.$$eval('.cart-line .nm', (x) => x.map((e) => e.firstChild.textContent.trim() + ' x' + e.parentNode.querySelector('.qty b').textContent));
  console.log('cart after Enter and +:', lines.join(', '));
  if (lines.join() !== 'Mafé x2') errs.push('Enter then + : ' + lines.join());
  await p.locator('.pos-cart').click({ position: { x: 10, y: 10 } }).catch(() => {});
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  for (const k of ['1', '5', '0', '0']) await p.keyboard.press(k);
  console.log('keypad shows', (await p.textContent('.keypad-display b')).trim());
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  lines = await p.$$eval('.cart-line .nm', (x) => x.map((e) => e.firstChild.textContent.trim()));
  console.log('cart:', lines.join(', '), '| total', (await p.textContent('.pos-amount .val')).trim());
  if (lines.length !== 2 || !lines.includes('Montant libre') || !lines.includes('Mafé')) errs.push('pos keyboard');
  await p.screenshot({ path: `${out}/desk-1440-pos-cart.png` });
  await p.keyboard.press('Control+Enter'); await p.waitForTimeout(300);
  console.log('Ctrl+Enter opens checkout:', await p.isVisible('#sheet [data-act="pos-confirm"]'));
  await p.keyboard.press('Escape');
  await p.context().close();

  // 4. 1024 × 768 et thème sombre
  const t = await open(1024, 768, 'dark');
  await t.screenshot({ path: `${out}/desk-1024-dark-home.png` });
  await t.click('#tabbar [data-tab="debts"]'); await t.screenshot({ path: `${out}/desk-1024-dark-debts.png` });
  await t.context().close();
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
