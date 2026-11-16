const { chromium, devices } = require('playwright'); const fs = require('fs');
const S = process.argv[2], out = process.argv[3];
// ---- serveur Supabase simulé (tables + règle « membre de l'entreprise »)
const store = { biz: [], members: [], records: new Map(), t: 0, calls: 0, anon: 0 };
const isMember = (uid, bid) => store.members.some((m) => m.user_id === uid && m.business_id === bid);
function handle(op, a) {
  store.calls++;
  if (op === 'otp') return { error: null };
  if (op === 'anon') return { user: { id: 'anon' + (++store.anon), is_anonymous: true } };
  if (!a.uid) return { error: { message: 'Connexion requise' } };
  if (op === 'rpc') {
    const pub = (b) => ({ id: b.id, name: b.name, invite_code: b.invite_code });
    if (a.name === 'create_business') { const b = { id: 'b' + (store.biz.length + 1), name: a.args.p_name, invite_code: 'K' + (7000000 + store.biz.length) }; store.biz.push(b); store.members.push({ business_id: b.id, user_id: a.uid, role: 'owner' }); return { data: [pub(b)], error: null }; }
    if (a.name === 'join_business') { const b = store.biz.find((x) => x.invite_code === a.args.p_code.trim().toUpperCase()); if (!b) return { data: null, error: { message: 'Code d’invitation inconnu' } }; if (!isMember(a.uid, b.id)) store.members.push({ business_id: b.id, user_id: a.uid, role: 'member' }); return { data: [pub(b)], error: null }; }
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
  async function device(name) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] });
    await ctx.exposeFunction('__sb', (op, args) => JSON.stringify(handle(op, JSON.parse(args))));
    await ctx.route('**/vendor/supabase.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(S + '/mock-supabase.js', 'utf8') }));
    await ctx.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.KOBO_SUPABASE = { url: 'https://test.supabase.co', key: 'sb_publishable_test' };" }));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ' PAGEERR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(400);
    return p;
  }
  const act = (p, a, e = '') => p.click(`[data-act="${a}"]${e}`);
  const data = (p) => p.evaluate(() => JSON.parse(localStorage['kobo.v1']));
  const login = async (p, email) => { await p.fill('#sy-email', email); await act(p, 'sync-send'); await p.fill('#sy-code', '123456'); await act(p, 'sync-verify'); await p.waitForTimeout(400); };

  // Téléphone A : crée l'entreprise
  const A = await device('A');
  await act(A, 'onb-go', '[data-v="business"]'); await A.fill('#s-name', 'Studio Nova'); await A.fill('#s-owner', 'Awa'); await act(A, 'onb-next'); await act(A, 'onb-next'); await A.waitForTimeout(800); await act(A, 'onb-finish'); await A.waitForTimeout(300);
  await act(A, 'fab-menu'); await A.click('#sheet [data-act="product"]'); await A.fill('#p-name', 'Coupe'); await A.fill('#p-price', '5000'); await A.click('#product-form .btn');
  await A.click('#tabbar [data-tab="pos"]'); await A.click('.pos-grid [data-act="pos-add"]'); await act(A, 'pos-pay'); await act(A, 'pos-confirm'); await act(A, 'close');
  await A.click('#tabbar [data-tab="more"]'); await A.screenshot({ path: `${out}/s1-more.png` });
  await act(A, 'sync'); await A.waitForTimeout(600); await A.screenshot({ path: `${out}/s5-linked.png` });
  await act(A, 'close'); const code = (await data(A)).sync.business.invite_code;
  console.log('A linked, code', code, 'records on server', store.records.size);

  // Téléphone B : rejoint depuis l'écran de bienvenue
  const B = await device('B');
  await act(B, 'onb-go', '[data-v="join"]');
  await B.fill('#onb-code', 'ZZZ'); await act(B, 'onb-join'); await B.waitForTimeout(300); console.log('bad invite:', await B.textContent('#onb-err'));
  await B.fill('#onb-code', code.toLowerCase()); await act(B, 'onb-join'); await B.waitForTimeout(1500);
  let dB = await data(B);
  console.log('B after join:', dB.settings && dB.settings.name, 'sales', dB.sales.length, 'products', dB.products.length);
  await B.waitForTimeout(300); await B.screenshot({ path: `${out}/s7-b-home.png` });
  console.log('B onboarding visible?', await B.isVisible('.onb'));

  // B vend, A reçoit ; numérotation continue
  await B.click('#tabbar [data-tab="pos"]'); await B.click('.pos-grid [data-act="pos-add"]'); await B.click('.pos-grid [data-act="pos-add"]'); await act(B, 'pos-pay'); await act(B, 'pos-confirm'); await act(B, 'close');
  await B.waitForTimeout(2200);
  await A.click('#tabbar [data-tab="more"]'); await act(A, 'sync'); await act(A, 'sync-now'); await A.waitForTimeout(600); await act(A, 'close');
  let dA = await data(A);
  console.log('A sales', dA.sales.length, 'numbers', dA.sales.map((s) => s.n).sort().join(','), 'who made', store.records.size);
  // A modifie le prix, B supprime la première vente
  await A.click('#tabbar [data-tab="more"]'); await act(A, 'go', '[data-v="stock"]'); await A.click('#list-body [data-act="product"]'); await A.fill('#p-price', '6000'); await A.click('#product-form .btn'); await A.waitForTimeout(2200);
  dB = await data(B); const first = dB.sales.find((s) => s.n === 1);
  await B.click('#tabbar [data-tab="sales"]'); await act(B, 'filter', '[data-v="all"]'); await act(B, 'detail', `[data-id="${first.id}"]`); await act(B, 'delete'); await act(B, 'confirm-yes'); await B.waitForTimeout(2200);
  await B.click('#tabbar [data-tab="more"]'); await act(B, 'sync'); await act(B, 'sync-now'); await B.waitForTimeout(600); await act(B, 'close');
  await A.click('#tabbar [data-tab="more"]'); await act(A, 'sync'); await act(A, 'sync-now'); await A.waitForTimeout(600); await act(A, 'close');
  dA = await data(A); dB = await data(B);
  console.log('after edits A:', dA.sales.length, 'sales, price', dA.products[0].price, '| B:', dB.sales.length, 'sales, price', dB.products[0].price);
  // Hors ligne puis reprise
  await B.context().setOffline(true); await B.click('#tabbar [data-tab="pos"]'); await B.click('.pos-grid [data-act="pos-add"]'); await act(B, 'pos-pay'); await act(B, 'pos-confirm'); await act(B, 'close'); await B.waitForTimeout(2000);
  const before = store.records.size; await B.context().setOffline(false); await B.evaluate(() => window.dispatchEvent(new Event('online'))); await B.waitForTimeout(1200);
  console.log('offline sale pushed after reconnect:', store.records.size > before);
  // Déconnexion
  await B.click('#tabbar [data-tab="more"]'); await act(B, 'sync'); await B.waitForTimeout(200);
  console.log('B anonymous account sheet: logout hidden', !(await B.isVisible('[data-act="sync-logout"]')), '| create account offered', await B.isVisible('#sheet [data-act="auth"][data-v="signup"]'));
  // Accès refusé hors entreprise
  console.log('outsider read:', JSON.stringify(handle('table', { uid: 'u_x', op: 'select', filters: [['eq', 'business_id', 'b1']], limit: 10 }).data.length));
  await A.screenshot({ path: `${out}/s8-a-home.png` });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
