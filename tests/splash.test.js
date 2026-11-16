// Écran de démarrage : animé ~2,5 s, version fixe (~0,9 s) si moins d'animations ou si réglé dans l'application.
const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function open(opts, init) {
    const ctx = await b.newContext({ ...devices['Pixel 7'], ...(opts || {}) });
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const t0 = Date.now();
    await p.goto('http://localhost:8123/');
    return { p, t0 };
  }
  const gone = async (p, t0) => { await p.waitForSelector('#splash', { state: 'detached', timeout: 6000 }); return Date.now() - t0; };

  // Animé
  const a = await open();
  console.log('animated visible', await a.p.isVisible('#splash'), 'static?', await a.p.evaluate(() => document.getElementById('splash').classList.contains('static')));
  await a.p.waitForTimeout(500); await a.p.screenshot({ path: `${out}/splash-anim-0.5s.png` });
  await a.p.waitForTimeout(700); await a.p.screenshot({ path: `${out}/splash-anim-1.2s.png` });
  const ta = await gone(a.p, a.t0);
  console.log('animated removed after ~', Math.round(ta / 100) / 10, 's');
  if (ta < 2300 || ta > 4500) errs.push('animated duration ' + ta);
  console.log('app usable after splash', await a.p.isVisible('[data-act="onb-go"][data-v="business"]'));

  // Système : moins d'animations
  const r = await open({ reducedMotion: 'reduce' });
  console.log('reduced static?', await r.p.evaluate(() => document.getElementById('splash').classList.contains('static')));
  await r.p.screenshot({ path: `${out}/splash-static.png` });
  const tr = await gone(r.p, r.t0);
  console.log('static removed after ~', Math.round(tr / 100) / 10, 's');
  if (tr > 2000) errs.push('static too long ' + tr);

  // Réglage de l'application
  const s = await open({}, () => {
    localStorage.setItem('kobo.v1', JSON.stringify({ settings: { name: 'Test', type: 'shop', currency: 'FCFA', reduceMotion: true }, sales: [], purchases: [], orders: [], products: [], contacts: {}, seq: { sale: 0, purchase: 0, order: 0 }, cloudOff: true }));
  });
  console.log('setting static?', await s.p.evaluate(() => document.getElementById('splash').classList.contains('static')), 'html class', await s.p.evaluate(() => document.documentElement.className));
  await gone(s.p, s.t0);
  // L'interrupteur des paramètres enregistre le choix
  await s.p.click('#btn-settings'); console.log('switch checked', await s.p.isChecked('#s-motion'));
  await s.p.click('label.switch-row'); await s.p.click('[data-act="settings-save"]');
  console.log('saved reduceMotion', await s.p.evaluate(() => JSON.parse(localStorage['kobo.v1']).settings.reduceMotion), 'html class', await s.p.evaluate(() => document.documentElement.className || '(aucune)'));

  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
