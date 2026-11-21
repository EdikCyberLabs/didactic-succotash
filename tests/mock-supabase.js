/* Faux client Supabase pour les tests : relaie chaque appel au serveur simulé du test. */
window.supabase = { createClient: () => {
  let session = JSON.parse(localStorage.getItem('mock.session') || 'null');
  const cbs = [];
  const setS = (s, evt) => { session = s; if (s) localStorage.setItem('mock.session', JSON.stringify(s)); else localStorage.removeItem('mock.session'); cbs.forEach((cb) => cb(evt, session)); };
  const call = (op, args) => window.__sb(op, JSON.stringify(Object.assign({ uid: session && session.user.id }, args))).then(JSON.parse);
  return {
    auth: {
      onAuthStateChange(cb) { cbs.push(cb); setTimeout(() => cb('INITIAL_SESSION', session)); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInAnonymously() { const r = await call('anon', {}); if (r.error) return r; setS({ user: r.user }, 'SIGNED_IN'); return { data: { session }, error: null }; },
      async signUp({ email, password }) { const r = await call('signup', { email, password }); return r.error ? r : { data: { user: { id: r.id, identities: [{}] }, session: null }, error: null }; },
      async signInWithPassword({ email, password }) { const r = await call('login', { email, password }); if (r.error) return r; setS({ user: r.user }, 'SIGNED_IN'); return { data: { session }, error: null }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
      async signInWithOtp() { return { data: {}, error: null }; },
      async updateUser() { return { data: {}, error: null }; },
      async signOut() { setS(null, 'SIGNED_OUT'); return { error: null }; },
    },
    rpc: (name, args) => call('rpc', { name, args }),
    from: (table) => {
      const q = { table, filters: [] };
      const b = {
        select() { q.op = 'select'; return b; }, eq(c, v) { q.filters.push(['eq', c, v]); return b; }, gt(c, v) { q.filters.push(['gt', c, v]); return b; },
        order() { return b; }, limit(n) { q.limit = n; return b; },
        upsert(rows) { q.op = 'upsert'; q.rows = rows; return b; },
        then(res, rej) { return call('table', q).then(res, rej); },
      };
      return b;
    },
  };
} };
