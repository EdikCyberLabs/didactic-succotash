// Serveur Supabase simulé pour les tests (tables, membres, règle « membre de l'entreprise »).
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
module.exports = { store, handle, isMember };
