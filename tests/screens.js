// Captures des écrans principaux (pas un test) : node tests/screens.js tests/output/preview.html tests/output
const { chromium, devices } = require('playwright'); const fs = require('fs');
const [, , html, out] = process.argv;
(async () => {
  const b = await chromium.launch();
  const wrapped = html + '.screens.html';
  fs.writeFileSync(wrapped, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(html, 'utf8'));
  for (const scheme of ['light', 'dark']) {
    const p = await (await b.newContext({ ...devices['Pixel 7'], colorScheme: scheme })).newPage();
    await p.goto('file://' + wrapped); await p.waitForTimeout(1600);
    const act = (a, e = '') => p.click(`[data-act="${a}"]${e}`);
    const shot = (n) => p.screenshot({ path: `${out}/screen-${scheme}-${n}.png` });
    await shot('1-home');
    await p.click('#tabbar [data-tab="pos"]'); await p.click('.pos-grid [data-act="pos-add"]'); await shot('2-pos');
    await act('pos-mode', '[data-v="keypad"]'); await shot('3-keypad');
    await p.click('#tabbar [data-tab="more"]'); await act('open-bilan'); await shot('4-finances');
    await p.click('#tabbar [data-tab="sales"]'); await act('detail'); await act('invoice'); await p.waitForTimeout(300); await shot('5-invoice');
    await p.click('#sheet [data-act="close"]');
    await p.click('#tabbar [data-tab="clients"]'); await shot('6-clients');
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
