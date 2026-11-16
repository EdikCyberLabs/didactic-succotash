const { chromium, devices } = require('playwright'); const fs = require('fs');
const S = process.argv[2], out = process.argv[3];
const store = { biz: [], members: [], records: new Map(), t: 0, users: {}, anon: 0 };
const isMember = (uid, bid) => store.members.some((m) => m.user_id === uid && m.business_id === bid);
function handle(op, a) {
  if (op === 'anon') return { user: { id: 'anon' + (++store.anon), is_anonymous: true } };
  if (op === 'signup') { if (store.users[a.email]) return { data: { user: { identities: [] }, session: null }, error: null, id: 'x' }; store.users[a.email] = { id: 'u_' + a.email, password: a.password }; return { id: store.users[a.email].id }; }
  if (op === 'login') { const u = store.users[a.email]; if (!u || u.password !== a.password) return { error: { message: 'Invalid login credentials' } }; return { user: { id: u.id, email: a.email, is_anonymous: false } }; }
  if (!a.uid) return { error: { message: 'Connexion requise' } };
  if (op === 'rpc') {
    const pub = (b) => ({ id: b.id, name: b.name, invite_code: b.invite_code });
    if (a.name === 'create_business') { const b = { id: 'b' + (store.biz.length + 1), name: a.args.p_name, invite_code: 'K' + (7000000 + store.biz.length) }; store.biz.push(b); store.members.push({ business_id: b.id, user_id: a.uid }); return { data: [pub(b)], error: null }; }
    if (a.name === 'join_business') { const b = store.biz.find((x) => x.invite_code === a.args.p_code.trim().toUpperCase()); if (!b) return { data: null, error: { message: 'Code d’invitation inconnu' } }; if (!isMember(a.uid, b.id)) store.members.push({ business_id: b.id, user_id: a.uid }); return { data: [pub(b)], error: null }; }
    if (a.name === 'my_business') { const m = store.members.find((x) => x.user_id === a.uid); const b = m && store.biz.find((x) => x.id === m.business_id); return { data: b ? [pub(b)] : [], error: null }; }
  }
  if (op === 'table') {
    if (a.op === 'select') {
      const bid = a.filters.find((f) => f[1] === 'business_id')[2]; const since = (a.filters.find((f) => f[1] === 'updated_at') || [])[2] || '';
      if (!isMember(a.uid, bid)) return { data: [], error: null };
      const rows = [...store.records.values()].filter((r) => r.business_id === bid && r.updated_at > since).sort((x, y) => x.updated_at.localeCompare(y.updated_at)).slice(0, a.limit || 1000);
      return { data: rows.map((r) => ({ kind: r.kind, id: r.id, data: r.data, deleted: r.deleted, updated_at: r.updated_at })), error: null };
    }
    if (a.op === 'upsert') {
      for (const r of a.rows) if (!isMember(a.uid, r.business_id)) return { error: { message: 'new row violates row-level security policy' } };
      a.rows.forEach((r) => store.records.set(`${r.business_id}|${r.kind}|${r.id}`, Object.assign({}, r, { updated_at: new Date(1.7e12 + (++store.t) * 1000).toISOString() })));
      return { data: null, error: null };
    }
  }
  return { error: { message: 'op inconnue ' + op } };
}
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function device(name, dark) {
    const ctx = await b.newContext({ ...devices['Pixel 7'], colorScheme: dark ? 'dark' : 'light' });
    await ctx.exposeFunction('__sb', (op, args) => JSON.stringify(handle(op, JSON.parse(args))));
    await ctx.route('**/vendor/supabase.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(S + '/mock-supabase.js', 'utf8') }));
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: 'https://test.supabase.co', key: 'sb_publishable_test' };" }));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(500);
    return p;
  }
  const act = (p, a, e = '') => p.click(`#sheet [data-act="${a}"]${e}`);
  const data = (p) => p.evaluate(() => JSON.parse(localStorage['kobo.v1'] || 'null'));
  const shot = (p, n) => p.screenshot({ path: `${out}/${n}.png` });
  const errText = (p) => p.textContent('#au-err');

  // A : création sans compte
  const A = await device('A');
  await shot(A, 'a1-welcome');
  await act(A, 'onb-go', '[data-v="business"]'); await A.waitForTimeout(350); await shot(A, 'a2-business');
  await act(A, 'onb-next'); console.log('empty name toast:', await A.textContent('#toast'));
  await A.fill('#s-name', 'Studio Nova'); await A.fill('#s-owner', 'Awa'); await A.click('[data-group="type"] [data-v="beauty"]');
  await act(A, 'onb-next'); await A.waitForTimeout(350); await shot(A, 'a3-prefs');
  await A.fill('#s-tax', '18'); await A.fill('#s-phone', '+221 77 000 00 00'); await act(A, 'onb-next'); await A.waitForTimeout(1200); await shot(A, 'a4-done');
  console.log('A cloud label:', await A.textContent('#onb-cloud'), '| server records', store.records.size, '| biz', store.biz.map((x) => x.name).join());
  await act(A, 'onb-finish'); await A.waitForTimeout(1500);
  await A.click('#tabbar [data-tab="pos"]'); await A.click('.pos-grid [data-act="product"]'); await A.fill('#p-name', 'Coupe'); await A.fill('#p-price', '5000'); await A.click('#product-form .btn');
  await A.click('.pos-grid [data-act="pos-add"]'); await A.click('[data-act="pos-pay"]'); await act(A, 'pos-confirm'); await act(A, 'close'); await A.waitForTimeout(2200);
  console.log('A sale on server:', [...store.records.values()].filter((r) => r.kind === 'sales').length);
  await A.click('#tabbar [data-tab="more"]'); await A.click('[data-act="sync"]'); await A.waitForTimeout(200); await shot(A, 'a5-account-anon');
  const code = (await data(A)).sync.business.invite_code;
  // A crée un compte
  await act(A, 'auth', '[data-v="signup"]'); await A.waitForTimeout(350);
  await A.fill('#au-email', 'awa@nova.test'); await A.fill('#au-pass', 'abc'); await A.fill('#au-pass2', 'abc'); await act(A, 'auth-submit'); console.log('weak:', await errText(A));
  await A.fill('#au-pass', 'Nova2026!'); await A.fill('#au-pass2', 'Nova2026?'); await act(A, 'auth-submit'); console.log('mismatch:', await errText(A));
  await A.fill('#au-pass2', 'Nova2026!'); await shot(A, 'a6-signup'); await act(A, 'auth-submit'); await A.waitForTimeout(400); await shot(A, 'a7-sent');
  await act(A, 'auth', '[data-v="signin"]'); await A.waitForTimeout(300);
  await A.fill('#au-pass', 'wrong'); await act(A, 'auth-submit'); await A.waitForTimeout(200); console.log('wrong pw:', await errText(A)); await shot(A, 'a8-signin-error');
  await A.click('[data-act="pw-toggle"]'); console.log('pw visible type:', await A.getAttribute('#au-pass', 'type'));
  await A.fill('#au-pass', 'Nova2026!'); await act(A, 'auth-submit'); await A.waitForTimeout(1500);
  let dA = await data(A);
  console.log('A after login: user', dA.sync && dA.sync.user, 'business', dA.sync && dA.sync.business.name, 'sales', dA.sales.length, 'member?', isMember('u_awa@nova.test', 'b1'));
  await shot(A, 'a9-account-email');
  await A.click('#sheet [data-act="close"]').catch(() => {});

  // B : rejoint avec le code
  const B = await device('B', true);
  await act(B, 'onb-go', '[data-v="join"]'); await B.waitForTimeout(350);
  await B.fill('#onb-code', 'nope'); await act(B, 'onb-join'); await B.waitForTimeout(400); console.log('B bad code:', await B.textContent('#onb-err')); await shot(B, 'b1-join-error');
  await B.fill('#onb-code', code.toLowerCase()); await act(B, 'onb-join'); await B.waitForTimeout(1800);
  const dB = await data(B); console.log('B joined:', dB.settings && dB.settings.name, 'sales', dB.sales.length, 'onb open?', await B.isVisible('.onb')); await shot(B, 'b2-home-dark');

  // C : se connecte au compte de A depuis l'accueil
  const C = await device('C');
  await act(C, 'auth', '[data-v="signin"]'); await C.waitForTimeout(350); await shot(C, 'c1-signin');
  await C.fill('#au-email', 'awa@nova.test'); await C.fill('#au-pass', 'Nova2026!'); await act(C, 'auth-submit'); await C.waitForTimeout(2200);
  const dC = await data(C); console.log('C signed in:', dC.settings && dC.settings.name, 'sales', dC.sales.length, 'onb open?', await C.isVisible('.onb'));
  console.log('businesses on server:', store.biz.length, '(un seul attendu)');
  // C : mot de passe oublié puis déconnexion
  await C.click('#tabbar [data-tab="more"]'); await C.click('[data-act="sync"]'); await act(C, 'sync-logout'); await act(C, 'confirm-yes'); await C.waitForTimeout(300);
  const dC2 = await data(C); console.log('C after logout: cloudOff', dC2.cloudOff, 'sync', dC2.sync, 'sales kept', dC2.sales.length); await shot(C, 'c2-logged-out');
  await act(C, 'auth', '[data-v="signin"]'); await act(C, 'auth', '[data-v="reset"]'); await C.fill('#au-email', 'awa@nova.test'); await act(C, 'auth-submit'); await C.waitForTimeout(300); console.log('reset ->', await C.textContent('.auth h2'));
  // Effacer tout sur B : nouvel accueil, pas de retour des anciennes données
  await B.click('#btn-settings'); await B.click('#sheet [data-act="reset"]'); await B.click('#sheet [data-act="confirm-yes"]'); await B.waitForTimeout(800);
  console.log('B after reset: welcome?', await B.isVisible('[data-act="onb-go"][data-v="business"]'), 'settings', (await data(B) || {}).settings || null);
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
