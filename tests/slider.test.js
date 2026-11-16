const { chromium, devices } = require('playwright'); const fs = require('fs');
const S = process.argv[2], out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function page(opts) {
    const ctx = await b.newContext({ ...devices['Pixel 7'], ...(opts || {}) });
    await ctx.exposeFunction('__sb', () => JSON.stringify({ error: null }));
    await ctx.route('**/vendor/supabase.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(S + '/mock-supabase.js', 'utf8') }));
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.GESTIO_SUPABASE = { url: 'https://test.supabase.co', key: 'sb_publishable_test' };" }));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(400);
    return p;
  }
  const idx = (p) => p.evaluate(() => [...document.querySelectorAll('.slider-dots button')].findIndex((x) => x.classList.contains('on')));
  const p = await page();
  console.log('slides:', await p.locator('.slide').count());
  await p.waitForTimeout(900); await p.screenshot({ path: `${out}/w0.png` });
  for (let i = 1; i <= 4; i++) { await p.waitForTimeout(4300); await p.screenshot({ path: `${out}/w${i}.png` }); console.log('auto ->', await idx(p)); }
  await p.waitForTimeout(4300); console.log('wraps to', await idx(p));
  await p.click('[data-act="slide"][data-v="2"]'); await p.waitForTimeout(700); console.log('dot click ->', await idx(p));
  const box = await p.locator('#slider').boundingBox();
  const y = box.y + 120;
  await p.mouse.move(box.x + box.width * 0.8, y); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.2, y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(700);
  console.log('swipe left ->', await idx(p));
  await p.mouse.move(box.x + box.width * 0.2, y); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.85, y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(700);
  console.log('swipe right ->', await idx(p));
  await p.mouse.move(box.x + box.width * 0.5, y); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.45, y, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(700);
  console.log('tiny drag stays ->', await idx(p));
  await p.focus('#slider'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600); console.log('arrow key ->', await idx(p));
  console.log('aria-hidden ok:', await p.evaluate(() => [...document.querySelectorAll('.slide')].filter((x) => x.getAttribute('aria-hidden') === 'false').length === 1));
  // Le parcours continue normalement et le minuteur s'arrête
  await p.click('[data-act="onb-go"][data-v="business"]'); await p.waitForTimeout(5000);
  console.log('after leaving: business screen', await p.isVisible('#s-name'), 'slider gone', !(await p.isVisible('#slider')));
  await p.click('[data-act="onb-go"][data-v="welcome"]'); await p.waitForTimeout(500); console.log('back to welcome restarts at', await idx(p));
  // Mouvements réduits : pas de défilement automatique
  const r = await page({ reducedMotion: 'reduce' });
  await r.waitForTimeout(5000); console.log('reduced motion stays on', await idx(r));
  // Thème sombre
  const d = await page({ colorScheme: 'dark' });
  await d.waitForTimeout(4900); await d.screenshot({ path: `${out}/w-dark.png` });
  console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
