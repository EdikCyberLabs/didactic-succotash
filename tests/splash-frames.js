// Captures de l'écran de démarrage à plusieurs instants (pas un test) : node tests/splash-frames.js tests/output
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const reduced of [false, true]) {
    const ctx = await b.newContext({ ...devices['Pixel 7'], reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
    const p = await ctx.newPage();
    const t0 = Date.now();
    await p.goto('http://localhost:8123/');
    for (const t of reduced ? [300] : [250, 650, 1000, 1500, 1900, 2300]) {
      await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
      await p.screenshot({ path: `${process.argv[2]}/frame-${reduced ? 'static' : t}.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
