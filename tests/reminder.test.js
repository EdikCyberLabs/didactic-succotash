// Rappel du soir : notification locale quotidienne (simulation du module Android), ouverture de « Ma journée ».
const { chromium, devices } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const seed = () => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('kobo.v1', JSON.stringify({ settings: { name: 'Boutique Fatou', type: 'shop', currency: 'FCFA' }, sales: [], purchases: [], orders: [], products: [], contacts: {}, seq: { sale: 0, purchase: 0, order: 0 }, cloudConsent: false }));
  };
  // Faux module Android : enregistre les appels ; la permission est réglée par localStorage['perm'].
  const nativeMock = () => {
    const calls = (window.__calls = []);
    window.__listeners = {};
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        LocalNotifications: {
          requestPermissions: async () => { calls.push('request'); return { display: localStorage.getItem('perm') || 'granted' }; },
          checkPermissions: async () => { calls.push('check'); return { display: localStorage.getItem('perm') || 'granted' }; },
          schedule: async (o) => { calls.push(['schedule', o.notifications[0]]); return { notifications: [{ id: o.notifications[0].id }] }; },
          cancel: async (o) => { calls.push(['cancel', o.notifications[0].id]); },
          addListener: async (name, fn) => { window.__listeners[name] = fn; },
        },
        Share: { share: async () => {} },
        Filesystem: { writeFile: async () => ({ uri: 'file:///cache/x' }) },
      },
    };
  };
  async function open(native) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] });
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: '', key: '' };" }));
    await ctx.addInitScript(seed);
    if (native) await ctx.addInitScript(nativeMock);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    await p.goto('http://localhost:8123/?nosplash'); await p.waitForTimeout(500);
    return p;
  }
  const calls = (p) => p.evaluate(() => JSON.stringify(window.__calls));

  // Version navigateur : réglage grisé
  const w = await open(false);
  await w.click('#btn-settings');
  console.log('web: disabled', await w.isDisabled('#s-reminder'), '|', (await w.textContent('label.switch-row small')).trim());

  // Application Android
  const p = await open(true);
  await p.click('#btn-settings');
  await p.click('label.switch-row:has(#s-reminder)'); await p.fill('#s-reminder-at', '21:15');
  await p.screenshot({ path: `${out}/reminder-settings.png` });
  await p.click('[data-act="settings-save"]'); await p.waitForTimeout(300);
  const c1 = JSON.parse(await calls(p));
  const sch = c1.find((x) => x[0] === 'schedule');
  console.log('scheduled:', JSON.stringify(sch && { id: sch[1].id, title: sch[1].title, on: sch[1].schedule.on }), '| asked permission', c1.includes('request'));
  console.log('toast:', await p.textContent('#toast'));
  if (!sch || sch[1].schedule.on.hour !== 21 || sch[1].schedule.on.minute !== 15) errs.push('schedule');
  // Toucher la notification
  await p.evaluate(() => window.__listeners.localNotificationActionPerformed({ actionId: 'tap', notification: { id: 7001, extra: { open: 'today' } } }));
  await p.waitForTimeout(200);
  console.log('tap opens:', (await p.textContent('#brand')).trim());
  // Au redémarrage : reprogrammé sans redemander la permission
  await p.reload(); await p.waitForTimeout(500);
  const c2 = JSON.parse(await calls(p));
  console.log('restart:', c2.map((x) => (Array.isArray(x) ? x[0] : x)).join(','));
  // Désactivation
  await p.click('#btn-settings'); await p.click('label.switch-row:has(#s-reminder)'); await p.click('[data-act="settings-save"]'); await p.waitForTimeout(300);
  console.log('off:', (await calls(p)).includes('"cancel",7001'), '| toast', await p.textContent('#toast'));
  // Proposition depuis « Ma journée »
  await p.click('button.big-amount'); console.log('day nudge:', await p.isVisible('[data-act="reminder-on"]'), '|', (await p.textContent('[data-act="reminder-on"]')).trim());
  if (!(await p.textContent('[data-act="reminder-on"]')).includes('21 h 15')) errs.push('nudge time label');
  await p.screenshot({ path: `${out}/reminder-day.png`, fullPage: true });
  await p.evaluate(() => { window.__calls.length = 0; });
  await p.click('[data-act="reminder-on"]'); await p.waitForTimeout(300);
  const c3 = JSON.parse(await calls(p)); const s3 = c3.find((x) => x[0] === 'schedule');
  console.log('nudge scheduled at', s3 && JSON.stringify(s3[1].schedule.on), '| nudge hidden after', !(await p.isVisible('[data-act="reminder-on"]')));
  // Permission refusée
  const q = await open(true);
  await q.evaluate(() => localStorage.setItem('perm', 'denied'));
  await q.click('#btn-settings'); await q.click('label.switch-row:has(#s-reminder)'); await q.click('[data-act="settings-save"]'); await q.waitForTimeout(300);
  console.log('denied: saved', await q.evaluate(() => JSON.parse(localStorage['kobo.v1']).settings.reminder), '| scheduled?', (await calls(q)).includes('schedule'), '|', await q.textContent('#toast'));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
