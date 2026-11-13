/* Gestio — caisse, factures, clients et finances pour toutes les entreprises.
   Tout est stocké localement sur l'appareil (localStorage). */
(function () {
  'use strict';

  // ---------------------------------------------------------------- Constantes
  const KEY = 'gestio.v1';

  const TYPES = [
    { id: 'shop', emoji: '🏪', label: 'Commerce', cats: ['Marchandises'] },
    { id: 'food', emoji: '🍽️', label: 'Restauration', cats: ['Ingrédients', 'Boissons', 'Énergie'] },
    { id: 'service', emoji: '💼', label: 'Services', cats: ['Matériel', 'Logiciels', 'Sous-traitance'] },
    { id: 'beauty', emoji: '💇', label: 'Beauté', cats: ['Produits', 'Matériel'] },
    { id: 'fashion', emoji: '👗', label: 'Mode', cats: ['Tissus', 'Fournitures', 'Main-d’œuvre'] },
    { id: 'tech', emoji: '📱', label: 'Tech', cats: ['Appareils', 'Accessoires', 'Pièces'] },
    { id: 'build', emoji: '🔨', label: 'Artisans & BTP', cats: ['Matériaux', 'Outillage', 'Sous-traitance'] },
    { id: 'health', emoji: '🩺', label: 'Santé', cats: ['Consommables', 'Matériel médical'] },
    { id: 'edu', emoji: '🎓', label: 'Formation', cats: ['Supports', 'Location de salle'] },
    { id: 'transport', emoji: '🚚', label: 'Transport', cats: ['Carburant', 'Entretien', 'Péages'] },
    { id: 'farm', emoji: '🌾', label: 'Agriculture', cats: ['Semences', 'Intrants', 'Main-d’œuvre'] },
    { id: 'other', emoji: '✨', label: 'Autre', cats: ['Stock'] },
  ];
  const COMMON_CATS = ['Loyer', 'Salaires', 'Transport', 'Marketing', 'Impôts & taxes', 'Autre'];

  const CURRENCIES = [
    ['FCFA', 0], ['€', 2], ['$', 2], ['£', 2], ['CHF', 2], ['MAD', 2], ['DZD', 2], ['TND', 2],
    ['GNF', 0], ['CDF', 0], ['MGA', 0], ['NGN', 0], ['GHS', 2], ['HTG', 2], ['CAD', 2],
  ];

  const PAY = {
    cash: ['💵', 'Espèces'],
    mobile: ['📲', 'Mobile Money'],
    card: ['💳', 'Carte'],
    bank: ['🏦', 'Virement'],
    credit: ['⏳', 'À crédit'],
  };

  const STATUS = {
    new: ['🆕', 'Nouvelle'],
    prep: ['🔧', 'En cours'],
    ready: ['✅', 'Prête'],
    done: ['📦', 'Livrée'],
  };

  // Teintes douces pour le panneau du haut (le texte reste noir dessus).
  const COLORS = ['#d6d5ea', '#cfe3d6', '#ecdfc8', '#cfe0ef', '#efd2d6', '#dddcd3'];
  // Couleurs franches pour les cartes de visite.
  const CARD_COLORS = ['#25233a', '#6c72c4', '#dd5f4a', '#5d8736', '#3f86c9', '#cf5a97', '#2f8f86'];

  // Icônes au trait (24 × 24), dessinées pour l'application.
  const I = (function (paths) {
    Object.keys(paths).forEach((k) => { paths[k] = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${paths[k]}</svg>`; });
    return paths;
  })({
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.6C14.1 8.6 13.2 8 12 8c-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.2 0-2.1-.6-2.6-1.6M12 6.3V8m0 8v1.7"/>',
    cart: '<path d="M3 4h2.5l2.2 10.5h9.6L19.5 7H6.3"/><circle cx="9" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>',
    clip: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5v-1h6v1M9 10h6M9 14h4"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    gear: '<path d="M4 8h8M18 8h2M4 16h2M12 16h8"/><circle cx="15" cy="8" r="2.5"/><circle cx="9" cy="16" r="2.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    tag: '<path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
    chart: '<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="6" width="3" height="11" rx="1"/><rect x="15.5" y="9" width="3" height="8" rx="1"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.5 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M14.5 10h4M14.5 14h3"/>',
    hourglass: '<path d="M7 3h10M7 21h10M8 3v3.5c0 2 4 3.5 4 5.5s-4 3.5-4 5.5V21M16 3v3.5c0 2-4 3.5-4 5.5s4 3.5 4 5.5V21"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    flame: '<path d="M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.3 1.8 2.5-.3-3 .2-5.5 1.2-8z"/>',
    up: '<path d="M4 16l5-5 4 3 7-8"/><path d="M15 6h5v5"/>',
    down: '<path d="M4 8l5 5 4-3 7 8"/><path d="M15 18h5v-5"/>',
    share: '<path d="M12 15V4M8 7.5l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    download: '<path d="M12 4v11M8 11.5l4 4 4-4M5 20h14"/>',
    edit: '<path d="M4 20l1-4.5L16.5 4 20 7.5 8.5 19z"/><path d="M14 6.5l3.5 3.5"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5.5M13.5 11v5.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>',
    repeat: '<path d="M4 12a7 7 0 0 1 12-5l2 2M20 12a7 7 0 0 1-12 5l-2-2"/><path d="M18 4v5h-5M6 20v-5h5"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    pos: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 8h8M8 12h1.5M11.25 12h1.5M14.5 12H16M8 15.5h1.5M11.25 15.5h1.5M14.5 15.5H16"/>',
    scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M12 8.5v7M8.5 12h7"/>',
    arrowUp: '<path d="M12 17V7M7.5 11.5L12 7l4.5 4.5"/>',
    arrowDown: '<path d="M12 7v10M7.5 12.5L12 17l4.5-4.5"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    invoice: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>',
    minus: '<path d="M6 12h12"/>',
    dots: '<circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/><circle cx="15" cy="15" r="1.2"/>'
  });

  // Illustration d'accueil : un reçu, des pièces et quelques étincelles.
  const ART = `<svg viewBox="0 0 260 220" fill="none" stroke="#111114" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M36 36v20M26 46h20M222 26v14M215 33h14M232 96v16M224 104h16M22 118v12M16 124h12"/>
    <circle cx="212" cy="62" r="7" fill="#ffffff"/><circle cx="56" cy="84" r="5" fill="#ffffff"/>
    <g transform="rotate(-8 130 110)">
      <path d="M88 40h96v150l-12-9-12 9-12-9-12 9-12-9-12 9-12-9-12 9z" fill="#111114"/>
      <path d="M82 34h96v150l-12-9-12 9-12-9-12 9-12-9-12 9-12-9-12 9z" fill="#ffffff"/>
      <path d="M97 56h46" stroke="#5c9a36" stroke-width="7"/><path d="M97 74h66M97 90h38"/>
      <rect x="97" y="108" width="46" height="46" rx="5" fill="#fff"/>
      <path d="M105 116h9v9h-9zM126 116h9v9h-9zM105 137h9v9h-9z" fill="#111114"/><path d="M124 136h5M133 141v6M124 146h4"/>
      <path d="M153 150h10"/>
    </g>
    <circle cx="211" cy="161" r="25" fill="#111114"/><circle cx="206" cy="156" r="25" fill="#5c9a36"/><path d="M196 156l7 7 13-14"/>
    <circle cx="51" cy="171" r="19" fill="#111114"/><circle cx="47" cy="167" r="19" fill="#ffffff"/><circle cx="47" cy="167" r="10"/>
  </svg>`;

  const KIND = {
    sales: { one: 'vente', title: 'Ventes', ico: I.coin, prefix: 'V', who: 'Client', seq: 'sale' },
    purchases: { one: 'dépense', title: 'Dépenses', ico: I.arrowDown, prefix: 'D', who: 'Fournisseur', seq: 'purchase' },
    orders: { one: 'commande', title: 'Commandes', ico: I.clip, prefix: 'C', who: 'Client', seq: 'order' },
  };

  // ---------------------------------------------------------------- Utilitaires
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 864e5;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const toDate = (s) => new Date(s + 'T12:00:00');
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };

  function niceDate(s) {
    const t = today();
    if (s === t) return 'Aujourd’hui';
    if (s === addDays(t, -1)) return 'Hier';
    if (s === addDays(t, 1)) return 'Demain';
    const opts = { day: 'numeric', month: 'short' };
    if (s.slice(0, 4) !== t.slice(0, 4)) opts.year = 'numeric';
    return toDate(s).toLocaleDateString('fr-FR', opts);
  }
  const fullDate = (s) => toDate(s).toLocaleDateString('fr-FR');

  function inPeriod(date, p) {
    const t = today();
    if (p === 'today') return date === t;
    if (p === 'week') return date > addDays(t, -7) && date <= t;
    if (p === 'month') return date.slice(0, 7) === t.slice(0, 7);
    return true;
  }

  // ---------------------------------------------------------------- Données
  const blank = () => ({ settings: null, sales: [], purchases: [], orders: [], products: [], contacts: {}, lastBackup: 0, card: {}, seq: { sale: 0, purchase: 0, order: 0 } });

  function load() {
    try {
      if (window.GESTIO_DEMO && !localStorage.getItem(KEY)) return window.GESTIO_DEMO();
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object') return Object.assign(blank(), d);
    } catch (e) { /* données illisibles : on repart de zéro */ }
    return blank();
  }
  let db = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('⚠️ Sauvegarde impossible sur cet appareil'); }
  }

  const S = () => db.settings || {};
  const bizType = () => TYPES.find((t) => t.id === S().type) || TYPES[TYPES.length - 1];
  const decimals = () => { const c = CURRENCIES.find((x) => x[0] === S().currency); return c ? c[1] : 0; };
  const round = (n) => { const f = Math.pow(10, decimals()); return Math.round(n * f) / f; };
  const fmtN = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals(), maximumFractionDigits: decimals() }).format(n || 0).replace(/\s/g, ' ');
  const fmt = (n) => `${fmtN(n)} ${S().currency || ''}`.trim();
  // Montants : sous-total des lignes, remise (montant), taxe (% appliqué après remise).
  const subtotal = (rec) => round((rec.items || []).reduce((s, it) => s + it.qty * it.price, 0));
  const netOf = (rec) => Math.max(0, round(subtotal(rec) - (rec.disc || 0)));
  const taxOf = (rec) => round((netOf(rec) * (rec.tax || 0)) / 100);
  const total = (rec) => round(netOf(rec) + taxOf(rec));
  const expenseCats = () => Array.from(new Set(bizType().cats.concat(COMMON_CATS)));
  const initials = (name) => String(name || '').split(/\s+/).map((w) => (w.match(/[\p{L}\d]/u) || [''])[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const curSym = () => { const c = S().currency || ''; return c.length <= 2 ? c : c.charAt(0); };
  function bigNum(n) {
    const d = decimals();
    const str = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0).replace(/\s/g, ' ');
    const [a, b] = str.split(',');
    return `${esc(a)}${b ? `<small>,${b}</small>` : ''}`;
  }
  // Courbe de revenus (aire verte), comme la carte « Your Income » du modèle.
  function spark(values) {
    const W = 160, H = 64, n = values.length, max = Math.max(1, ...values);
    const pts = values.map((v, i) => [n === 1 ? W / 2 : (i * W) / (n - 1), H - 6 - (v / max) * (H - 14)]);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < n; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = ((x0 + x1) / 2).toFixed(1);
      d += ` C${cx},${y0.toFixed(1)} ${cx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    const g = 'g' + Math.random().toString(36).slice(2, 8);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c9a36" stop-opacity=".32"/><stop offset="1" stop-color="#5c9a36" stop-opacity="0"/></linearGradient></defs><path d="${d} L${W},${H} L0,${H} Z" fill="url(#${g})"/><path class="ln" d="${d}" fill="none" stroke="#5c9a36" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const sum = (list) => round(list.reduce((s, r) => s + total(r), 0));
  const ref = (kind, rec) => `${KIND[kind].prefix}-${String(rec.n).padStart(4, '0')}`;
  const itemsLabel = (rec) => rec.items.map((it) => (it.qty !== 1 ? `${it.qty}× ` : '') + it.name).join(', ');

  // Articles & stock : un article sans quantité (qty null) n'est pas suivi en stock.
  const norm = (s) => String(s || '').trim().toLowerCase();
  const findProduct = (name) => db.products.find((p) => norm(p.name) === norm(name));
  const tracked = (p) => p.qty != null;
  const isLow = (p) => tracked(p) && p.qty <= (p.min || 0);
  const fmtQ = (q) => String(Math.round(q * 1000) / 1000).replace('.', ',');
  function moveStock(kind, items, dir) {
    if (kind === 'orders') return;
    const sign = kind === 'sales' ? -dir : dir;
    items.forEach((it) => {
      const p = findProduct(it.name);
      if (p && tracked(p)) p.qty = Math.round((p.qty + sign * it.qty) * 1000) / 1000;
    });
  }

  // Argent à encaisser. Une vente « à crédit » garde la trace des versements reçus (paid, payments).
  const owedSale = (r) => (r.pay === 'credit' ? Math.max(0, round(total(r) - (r.paid || 0))) : 0);
  const paidOf = (r) => round(total(r) - owedSale(r));
  const owedOrder = (o) => (o.saleId ? 0 : Math.max(0, round(total(o) - (o.deposit || 0))));

  // Clients : regroupés par nom, à partir des ventes et des commandes.
  function clientList() {
    const map = new Map();
    const get = (name) => {
      const key = norm(name);
      if (!map.has(key)) map.set(key, { key, name: name.trim(), sales: [], orders: [], phone: '', spent: 0, credit: 0, pending: 0, last: '' });
      return map.get(key);
    };
    db.sales.forEach((r) => {
      if (!norm(r.who)) return;
      const c = get(r.who);
      c.sales.push(r); c.spent += total(r); c.credit += owedSale(r);
      if (r.date > c.last) c.last = r.date;
    });
    db.orders.slice().sort((a, b) => a.at - b.at).forEach((o) => {
      if (!norm(o.who)) return;
      const c = get(o.who);
      c.orders.push(o); c.pending += owedOrder(o);
      if (o.phone) c.phone = o.phone;
      if (o.date > c.last) c.last = o.date;
    });
    Object.keys(db.contacts || {}).forEach((key) => { const ct = db.contacts[key]; if (ct && ct.name && !map.has(key)) get(ct.name); });
    return Array.from(map.values()).map((c) => {
      const saved = (db.contacts || {})[c.key];
      if (saved) { if (saved.phone) c.phone = saved.phone; c.email = saved.email || ''; c.address = saved.address || ''; c.note = saved.note || ''; }
      c.spent = round(c.spent); c.credit = round(c.credit); c.pending = round(c.pending);
      return c;
    });
  }

  // Périodes du bilan : semaine (lundi → dimanche) ou mois.
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
  const weekStart = (d) => addDays(d, -((toDate(d).getDay() + 6) % 7));
  function periodOf(type, anchor) {
    if (type === 'week') { const start = weekStart(anchor); return { type, start, end: addDays(start, 6) }; }
    if (type === 'year') { const y = anchor.slice(0, 4); return { type, start: `${y}-01-01`, end: `${y}-12-31` }; }
    const m = anchor.slice(0, 7);
    const [y, mo] = m.split('-').map(Number);
    return { type, start: `${m}-01`, end: `${m}-${pad(new Date(y, mo, 0).getDate())}` };
  }
  const stepPeriod = (p, dir) => periodOf(p.type, dir < 0 ? addDays(p.start, -1) : addDays(p.end, 1));
  const inRange = (list, a, b) => list.filter((r) => r.date >= a && r.date <= b);
  function periodLabel(p) {
    if (p.type === 'year') return `Année ${p.start.slice(0, 4)}`;
    if (p.type === 'month') { const t = toDate(p.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); }
    const a = toDate(p.start), b = toDate(p.end);
    const from = a.getMonth() === b.getMonth() ? a.getDate() : a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `Semaine du ${from} au ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  }

  function controlCode(rec) {
    const s = `${rec.id}|${total(rec)}|${rec.date}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
  }

  function streak() {
    const days = new Set(db.sales.map((s) => s.date));
    let d = today();
    if (!days.has(d)) d = addDays(d, -1);
    let n = 0;
    while (days.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }

  // ---------------------------------------------------------------- État UI
  const ui = {
    tab: 'home',
    filter: { sales: 'month', purchases: 'month', orders: 'open', stock: 'all', clients: 'all', invoices: 'open' },
    query: { sales: '', purchases: '', orders: '', stock: '', clients: '', invoices: '' },
    introDone: false,
    period: periodOf('week', today()),
  };
  const SUB = ['stock', 'bilan', 'card', 'invoices', 'purchases', 'orders'];
  const TITLES = { pos: 'Caisse', sales: 'Ventes', purchases: 'Dépenses', orders: 'Commandes', clients: 'Clients', more: 'Plus', stock: 'Articles & stock', bilan: 'Finances', card: 'Carte de visite', invoices: 'Factures' };

  let logoImg = null;
  function loadLogo() {
    logoImg = null;
    if (!S().logo) return;
    const im = new Image();
    im.onload = () => { logoImg = im; if (ui.tab === 'card') render(); };
    im.src = S().logo;
  }
  const logoHtml = (src) => (src ? `<img src="${esc(src)}" alt="">` : bizType().emoji);

  function applyTheme() {
    const c = COLORS.includes(S().color) ? S().color : COLORS[0];
    document.documentElement.style.setProperty('--tint', c);
  }

  function renderBrand() {
    if (ui.tab === 'home') {
      const h = new Date().getHours();
      const hello = h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour';
      const who = (S().owner || '').trim();
      $('#brand').innerHTML = `<div class="greet">${hello}${who ? ` ${esc(who)}` : ''} !<br><span>${esc(S().name || 'Votre activité')}</span></div>`;
    } else {
      $('#brand').innerHTML = `<div class="title">${esc(TITLES[ui.tab] || '')}</div>`;
    }
  }

  function render() {
    applyTheme();
    const home = ui.tab === 'home';
    document.body.classList.toggle('is-home', home);
    renderBrand();
    const top = SUB.includes(ui.tab) ? 'more' : ui.tab;
    $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === top));
    $('#fab').hidden = ['home', 'pos', 'more', 'bilan', 'card'].includes(ui.tab);
    const v = $('#view');
    v.className = 'view' + (home ? ' home' : '') + (home && !ui.introDone ? ' intro' : '');
    if (home) ui.introDone = true;
    if (home) v.innerHTML = viewHome();
    else if (ui.tab === 'pos') { v.innerHTML = viewPos(); mountPos(); }
    else if (ui.tab === 'more') v.innerHTML = viewMore();
    else if (ui.tab === 'stock') { v.innerHTML = viewStock(); mountSearch('stock', stockBody); }
    else if (ui.tab === 'bilan') v.innerHTML = viewBilan();
    else if (ui.tab === 'invoices') { v.innerHTML = viewInvoices(); mountSearch('invoices', invoicesBody); }
    else if (ui.tab === 'clients') { v.innerHTML = viewClients(); mountSearch('clients', clientsBody); }
    else if (ui.tab === 'card') { v.innerHTML = viewCard(); mountCard(); }
    else { const kind = ui.tab; v.innerHTML = viewList(kind); mountSearch(kind, () => listBody(kind)); }
  }

  // ---------------------------------------------------------------- Accueil
  function viewHome() {
    const t = today();
    const todayS = db.sales.filter((s) => s.date === t);
    const sToday = sum(todayS);
    const yS = sum(db.sales.filter((s) => s.date === addDays(t, -1)));
    const tr = pctChange(sToday, yS);
    const trend = tr === null
      ? ['flat', I.up, todayS.length ? `${todayS.length} vente${todayS.length > 1 ? 's' : ''} aujourd’hui` : 'Aucune vente aujourd’hui']
      : [tr >= 0 ? '' : 'down', tr >= 0 ? I.up : I.down, `${tr >= 0 ? '+' : '−'}${Math.abs(tr)} % vs hier`];
    const goal = S().goal || 0;
    const pct = goal ? Math.round((sToday / goal) * 100) : 0;
    const sub = goal ? `Ventes du jour · ${pct} % de l’objectif` : 'Ventes du jour';

    const wk = periodOf('week', t);
    const wkSales = inRange(db.sales, wk.start, wk.end);
    const wkVals = Array.from({ length: 7 }, (_, i) => sum(wkSales.filter((x) => x.date === addDays(wk.start, i))));
    const shown = wkVals.slice(0, daysBetween(wk.start, t) + 1);
    const wkS = sum(wkSales);
    const wkTr = pctChange(wkS, comparable(wk).tS);

    const freq = new Map();
    db.sales.filter((r) => r.date >= addDays(t, -30)).forEach((r) => r.items.forEach((it) => freq.set(norm(it.name), (freq.get(norm(it.name)) || 0) + it.qty)));
    const picks = db.products.slice().sort((a, b) => (freq.get(norm(b.name)) || 0) - (freq.get(norm(a.name)) || 0)).slice(0, 3);
    const tiles = picks.map((p) => `<button class="tile" data-act="pos-add" data-id="${p.id}"><span class="av">${esc(initials(p.name))}</span><span class="nm">${esc(p.name)}</span></button>`)
      .concat(picks.length < 3 ? [`<button class="tile" data-act="product"><span class="av">${I.tag}</span><span class="nm">Nouvel article</span></button>`] : [])
      .concat([`<button class="tile add" data-act="go" data-v="pos"><span class="av">${I.plus}</span><span class="nm">Caisse</span></button>`]).join('');

    const credits = db.sales.filter((s) => owedSale(s) > 0);
    const owedTot = round(credits.reduce((a, r) => a + owedSale(r), 0));
    const late = credits.filter((r) => r.due && r.due < t).length;
    const nRec = db.sales.length + db.purchases.length + db.orders.length;
    const lastB = db.lastBackup ? Math.floor((Date.now() - db.lastBackup) / DAY) : null;
    const nudge = nRec >= 10 && (lastB === null || lastB >= 7);
    const lowStock = db.products.filter(isLow);
    const open = db.orders.filter((o) => o.status !== 'done').sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).slice(0, 2);
    const recent = [
      ...db.sales.map((r) => ['sales', r]), ...db.purchases.map((r) => ['purchases', r]), ...db.orders.map((r) => ['orders', r]),
    ].sort((a, b) => b[1].at - a[1].at).slice(0, 5);

    return `
      <section class="h-top">
        <span class="cur-pill"><i>${esc(curSym())}</i>${esc(S().currency || '')}</span>
        <div class="big-amount num">${bigNum(sToday)}</div>
        <div class="h-sub">${esc(sub)}</div>
      </section>
      <section class="h-band">
        <span class="trend ${trend[0]}">${trend[1]} ${esc(trend[2])}</span>
        <div class="h-actions">
          <button class="pill-btn" data-act="go" data-v="pos">Vendre ${I.arrowUp}</button>
          <button class="sq-btn" data-act="fab-menu" aria-label="Ajouter">${I.scan}</button>
          <button class="pill-btn" data-act="new" data-kind="purchases">${I.arrowDown} Dépense</button>
        </div>
      </section>
      <section class="h-sheet">
        <div class="h-grid">
          <div><h3>Vendre à nouveau</h3><div class="tiles">${tiles}</div></div>
          <div><h3>Vos revenus</h3>
            <button class="income" data-act="open-bilan">
              <span class="lbl">Cette semaine ${I.arrowR}</span>
              ${spark(shown.length > 1 ? shown : [0].concat(shown))}
              <span class="foot"><b class="num">${esc(fmtN(wkS))}</b>${wkTr === null ? '' : `<span class="mini-pill ${wkTr >= 0 ? '' : 'down'}">${wkTr >= 0 ? I.up : I.down} ${wkTr >= 0 ? '+' : '−'}${Math.abs(wkTr)} %</span>`}</span>
            </button>
          </div>
        </div>

        ${credits.length ? `<button class="row" data-act="go" data-v="invoices">
            <div class="ico">${I.invoice}</div><div class="mid"><div class="title">À encaisser${late ? ` <span class="badge red">${late} en retard</span>` : ''}</div><div class="sub">${credits.length} facture${credits.length > 1 ? 's' : ''} pas encore payée${credits.length > 1 ? 's' : ''}</div></div>
            <div class="amt num">${esc(fmtN(owedTot))}</div></button>` : ''}
        ${lowStock.length ? `<button class="row" data-act="low-stock">
            <div class="ico">${I.alert}</div><div class="mid"><div class="title">Stock à réapprovisionner</div><div class="sub">${esc(lowStock.map((p) => p.name).join(', '))}</div></div>
            <div class="amt">${lowStock.length}<small>article${lowStock.length > 1 ? 's' : ''}</small></div></button>` : ''}
        ${nudge ? `<button class="row backup-nudge" data-act="export">
            <div class="ico">${I.save}</div><div class="mid"><div class="title">Sauvegardez vos données</div><div class="sub">${lastB === null ? 'Aucune sauvegarde pour l’instant' : `Dernière sauvegarde il y a ${lastB} jours`}</div></div>
            <div class="chev">›</div></button>` : ''}
        ${open.length ? `<div class="section-title">Commandes à livrer <button class="link" data-act="go" data-v="orders">${I.arrowR}</button></div>
          <div class="list">${open.map((o) => rowHtml('orders', o)).join('')}</div>` : ''}

        <div class="section-title">Activité récente <button class="link" data-act="go" data-v="sales" aria-label="Toutes les ventes">${I.arrowR}</button></div>
        ${recent.length ? `<div class="list">${recent.map(([k, r]) => rowHtml(k, r, true)).join('')}</div>`
          : `<div class="card empty"><div class="big">🌱</div><b>Tout commence ici</b>Touchez « Vendre » pour enregistrer votre première vente.</div>`}
      </section>
    `;
  }

  // ---------------------------------------------------------------- Caisse
  const cart = { items: [], who: '', keypad: false, entry: '', label: '' };
  const cartTotal = () => total({ items: cart.items });
  function cartAdd(name, price, qty) {
    const line = cart.items.find((it) => norm(it.name) === norm(name) && it.price === price);
    if (line) line.qty = Math.round((line.qty + (qty || 1)) * 1000) / 1000;
    else cart.items.push({ name, price, qty: qty || 1 });
  }
  function keypadHtml() {
    const v = cart.entry ? num(cart.entry) : 0;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimals() ? ',' : '00', '0', '⌫'];
    return `<div class="keypad-wrap">
      <div class="keypad-display"><input id="kp-label" placeholder="Libellé (facultatif)" value="${esc(cart.label)}" autocomplete="off"><b class="num">${esc(cart.entry ? cart.entry.replace('.', ',') : '0')}</b></div>
      <div class="keypad">${keys.map((k) => `<button class="key ${/\d/.test(k) && k !== '00' ? '' : 'op'}" data-act="key" data-v="${k}" aria-label="${k === '⌫' ? 'Effacer' : k}">${k}</button>`).join('')}</div>
      <button class="btn" data-act="kp-add" ${v > 0 ? '' : 'disabled'}>${I.plus} Ajouter${v ? ` ${esc(fmt(round(v)))}` : ''}</button>
    </div>`;
  }
  function viewPos() {
    const t = cartTotal();
    const counts = new Map(cart.items.map((it) => [norm(it.name), it.qty]));
    const prods = db.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const nItems = cart.items.reduce((a, it) => a + it.qty, 0);
    return `
      <div class="pos-top">
        <div class="who">
          <button data-act="pos-client"><span class="av">${cart.who ? esc(initials(cart.who)) : I.user}</span><span>${esc(cart.who || 'Client de passage')}</span></button>
          ${cart.items.length ? '<button class="clear" data-act="pos-clear">Vider</button>' : ''}
        </div>
        <div class="pos-amount"><span class="cur">${esc(S().currency || '')}</span><span class="val num">${bigNum(t)}</span></div>
        ${cart.items.length ? `<div class="pos-lines">${cart.items.map((it, i) => `<div class="cart-line"><div class="nm">${esc(it.name)}<small>${esc(fmtN(it.price))} × ${fmtQ(it.qty)} = ${esc(fmtN(round(it.qty * it.price)))}</small></div>
          <div class="qty"><button data-act="cart-dec" data-i="${i}" aria-label="Retirer un">${I.minus}</button><b>${fmtQ(it.qty)}</b><button data-act="cart-inc" data-i="${i}" aria-label="Ajouter un">${I.plus}</button></div></div>`).join('')}</div>`
          : '<p class="small" style="color:#9a9aa3;margin-top:12px">Touchez un article ou saisissez un montant libre.</p>'}
      </div>
      ${cart.items.length ? `<div class="pos-total-pill"><span>${fmtQ(nItems)} article${nItems > 1 ? 's' : ''} · Total : ${esc(fmt(t))}</span></div>` : ''}
      <div class="chips"><button class="chip ${cart.keypad ? '' : 'on'}" data-act="pos-mode" data-v="grid">${I.grid} Articles</button><button class="chip ${cart.keypad ? 'on' : ''}" data-act="pos-mode" data-v="keypad">${I.pos} Montant libre</button></div>
      ${cart.keypad ? keypadHtml() : `<div class="pos-grid">${prods.map((p) => `<button class="ptile ${tracked(p) && p.qty <= 0 ? 'out' : ''}" data-act="pos-add" data-id="${p.id}">
          ${counts.get(norm(p.name)) ? `<span class="count">${fmtQ(counts.get(norm(p.name)))}</span>` : ''}
          <span class="av">${esc(initials(p.name))}</span><span class="nm">${esc(p.name)}</span><span class="pr">${esc(fmt(p.price))}${tracked(p) ? ` · ${fmtQ(p.qty)} en stock` : ''}</span></button>`).join('')}
          <button class="ptile add" data-act="product"><span class="av">${I.plus}</span><span class="nm">Nouvel article</span></button></div>`}
      ${cart.items.length ? `<button class="btn" data-act="pos-pay">${I.check} Encaisser ${esc(fmt(t))}</button>` : ''}`;
  }
  function mountPos() {
    const el = $('#kp-label');
    if (el) el.addEventListener('input', (e) => { cart.label = e.target.value; });
  }
  function openCheckout() {
    const t = cartTotal();
    openSheet(`${head('Encaisser')}
      <div class="total-box"><span>À payer</span><b class="num">${esc(fmt(t))}</b></div>
      <label class="field"><span>Client</span><input id="co-who" list="dl-people" value="${esc(cart.who)}" placeholder="Client de passage" autocomplete="off"></label>
      <div class="field"><span>Paiement</span>${chipGroup('pay', Object.entries(PAY).map(([v, x]) => [v, v === 'credit' ? '⏳ Plus tard (facture)' : `${x[0]} ${x[1]}`]), 'cash')}</div>
      <label class="field" id="due-wrap" hidden><span>Échéance de paiement</span><input id="f-due" type="date" value="${addDays(today(), S().terms || 7)}"></label>
      <label class="field"><span>Montant reçu (pour rendre la monnaie)</span><input id="co-given" type="number" inputmode="decimal" min="0" step="any" placeholder="${t}"></label>
      <p class="muted small" id="co-change"></p>
      <button class="btn" data-act="pos-confirm">${I.check} Valider la vente</button>
      <datalist id="dl-people">${knownPeople('sales').map((n) => `<option value="${esc(n)}">`).join('')}</datalist>`);
    $('#co-given').addEventListener('input', (e) => {
      const g = num(e.target.value);
      $('#co-change').textContent = g > t ? `Monnaie à rendre : ${fmt(round(g - t))}` : '';
    });
  }
  function openPosClient() {
    const recentC = clientList().sort((a, b) => b.last.localeCompare(a.last)).slice(0, 6);
    openSheet(`${head('Client')}
      <input class="search" id="pc-who" list="dl-people" placeholder="Nom du client" value="${esc(cart.who)}" autocomplete="off">
      <button class="btn" data-act="pos-client-ok">${I.check} Valider</button>
      ${recentC.length ? `<div class="section-title">Clients récents</div><div class="list">${recentC.map((c) => `<button class="row" data-act="pos-client-pick" data-key="${esc(c.key)}"><div class="ico initial">${esc(initials(c.name))}</div><div class="mid"><div class="title">${esc(c.name)}</div><div class="sub">${esc(niceDate(c.last))}</div></div></button>`).join('')}</div>` : ''}
      <button class="btn plain" data-act="pos-client-none">Client de passage</button>
      <datalist id="dl-people">${knownPeople('sales').map((n) => `<option value="${esc(n)}">`).join('')}</datalist>`);
    setTimeout(() => { const el = $('#pc-who'); if (el) el.focus(); }, 250);
  }

  // ---------------------------------------------------------------- Listes
  function dueBadge(o) {
    if (o.status === 'done') return '<span class="badge green">Livrée</span>';
    if (!o.due) return `<span class="badge">${STATUS[o.status][1]}</span>`;
    const t = today();
    if (o.due < t) return '<span class="badge red">En retard</span>';
    if (o.due === t) return '<span class="badge orange">Pour aujourd’hui</span>';
    return `<span class="badge">${esc(niceDate(o.due))}</span>`;
  }

  function rowHtml(kind, r, showKind) {
    const k = KIND[kind];
    const who = r.who || (kind === 'purchases' ? (r.cat || 'Dépense') : 'Client de passage');
    let extra = '';
    if (kind === 'sales' && owedSale(r) > 0) extra = ` <span class="badge orange">Doit ${esc(fmtN(owedSale(r)))}</span>`;
    if (kind === 'orders') extra = ' ' + dueBadge(r);
    const sign = kind === 'purchases' ? '−' : '';
    return `<button class="row" data-act="detail" data-kind="${kind}" data-id="${r.id}">
      <div class="ico">${k.ico}</div>
      <div class="mid"><div class="title">${esc(who)}${extra}</div><div class="sub">${kind === 'orders' && r.status !== 'done' ? STATUS[r.status][1] + ' · ' : ''}${esc(itemsLabel(r))}</div></div>
      <div class="amt">${kind === 'sales' && showKind ? '+' : sign}${esc(fmtN(total(r)))}<small>${esc(niceDate(r.date))}</small></div>
    </button>`;
  }

  function filtered(kind) {
    const f = ui.filter[kind];
    const q = ui.query[kind].trim().toLowerCase();
    let list = db[kind].slice();
    if (kind === 'orders') {
      if (f === 'open') list = list.filter((o) => o.status !== 'done');
      if (f === 'done') list = list.filter((o) => o.status === 'done');
      list.sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.due || '9').localeCompare(b.due || '9') || b.at - a.at);
    } else {
      list = f === 'credit' ? list.filter((s) => owedSale(s) > 0) : list.filter((r) => inPeriod(r.date, f));
      list.sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);
    }
    if (q) list = list.filter((r) => `${r.who || ''} ${itemsLabel(r)} ${r.cat || ''} ${ref(kind, r)}`.toLowerCase().includes(q));
    return list;
  }

  function listBody(kind) {
    const k = KIND[kind];
    const list = filtered(kind);
    const head = `<div class="card summary"><div><div class="muted small">${list.length} ${k.one}${list.length > 1 ? 's' : ''}</div><b>${esc(fmt(sum(list)))}</b></div>${k.ico}</div>`;
    if (!list.length) {
      const any = db[kind].length > 0;
      return head + `<div class="empty"><div class="big">${any ? '🔍' : k.ico}</div><b>${any ? 'Rien à afficher ici' : `Aucune ${k.one} pour l’instant`}</b>${any ? 'Essayez un autre filtre.' : `Appuyez sur + pour ajouter votre première ${k.one}.`}</div>`;
    }
    if (kind === 'orders') return head + `<div class="list">${list.map((r) => rowHtml(kind, r)).join('')}</div>`;
    const perDay = {};
    list.forEach((r) => { perDay[r.date] = (perDay[r.date] || 0) + total(r); });
    let html = '', cur = null;
    list.forEach((r) => {
      if (r.date !== cur) { cur = r.date; html += `<div class="day-head"><span>${esc(niceDate(r.date))}</span><span>${esc(fmtN(round(perDay[r.date])))}</span></div>`; }
      html += rowHtml(kind, r);
    });
    return head + `<div class="list">${html}</div>`;
  }

  function viewList(kind) {
    const chips = kind === 'orders'
      ? [['open', 'En cours'], ['done', 'Livrées'], ['all', 'Toutes']]
      : [['today', 'Aujourd’hui'], ['week', '7 jours'], ['month', 'Ce mois'], ['all', 'Tout']].concat(kind === 'sales' ? [['credit', 'Crédits']] : []);
    return `${kind === 'sales' ? '' : back}
      <div class="chips">${chips.map(([v, l]) => `<button class="chip ${ui.filter[kind] === v ? 'on' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('')}</div>
      <input class="search" id="q" type="search" placeholder="Rechercher…" value="${esc(ui.query[kind])}">
      <div id="list-body" class="view" style="padding:0">${listBody(kind)}</div>`;
  }

  function mountSearch(key, body) {
    $('#q').addEventListener('input', (e) => { ui.query[key] = e.target.value; $('#list-body').innerHTML = body(); });
  }

  // ---------------------------------------------------------------- Plus
  const back = `<button class="back" data-act="go" data-v="more">${I.back} Plus</button>`;
  function viewMore() {
    const low = db.products.filter(isLow).length;
    const m = periodOf('month', today());
    const owed = db.sales.filter((r) => owedSale(r) > 0);
    const late = owed.filter((r) => r.due && r.due < today()).length;
    const row = (act, v, ico, title, sub) => `<button class="row" data-act="${act}" data-v="${v}">
      <div class="ico">${ico}</div><div class="mid"><div class="title">${title}</div><div class="sub">${esc(sub)}</div></div><div class="chev">›</div></button>`;
    const mS = statsFor(m.start, m.end);
    return `<div class="list">
      ${row('open-bilan', '', I.chart, 'Finances', `Ce mois : résultat ${fmt(mS.profit)}`)}
      ${row('go', 'invoices', I.invoice, 'Factures', owed.length ? `${fmt(round(owed.reduce((a, r) => a + owedSale(r), 0)))} à encaisser${late ? ` · ${late} en retard` : ''}` : 'Toutes payées')}
      ${row('go', 'purchases', I.arrowDown, 'Dépenses', `Ce mois : ${fmt(mS.tP)}`)}
      ${row('go', 'orders', I.clip, 'Commandes & devis', `${db.orders.filter((o) => o.status !== 'done').length} en cours`)}
      ${row('go', 'stock', I.box, 'Articles & stock', db.products.length ? `${db.products.length} article${db.products.length > 1 ? 's' : ''}${low ? ` · ${low} à réapprovisionner` : ''}` : 'Produits, services, prix et stock')}
      ${row('go', 'card', I.idcard, 'Carte de visite', 'Avec code QR de contact')}
      ${row('settings', '', I.gear, 'Paramètres', 'Entreprise, taxes, devise, sauvegarde')}
    </div>`;
  }

  // ---------------------------------------------------------------- Factures
  const invNo = (r) => `F-${String(r.n).padStart(4, '0')}`;
  function invStatus(r) {
    if (owedSale(r) <= 0) return ['paid', 'Payée', 'green'];
    if (r.due && r.due < today()) return ['late', 'En retard', 'red'];
    if ((r.paid || 0) > 0) return ['part', 'Partielle', 'orange'];
    return ['open', 'À payer', 'orange'];
  }
  const invRow = (r) => {
    const st = invStatus(r);
    return `<button class="row" data-act="detail" data-kind="sales" data-id="${r.id}">
      <div class="ico">${I.invoice}</div>
      <div class="mid"><div class="title">${esc(r.who || 'Client de passage')} <span class="badge ${st[2]}">${st[1]}</span></div>
        <div class="sub">${invNo(r)} · ${r.due && st[0] !== 'paid' ? `échéance ${esc(niceDate(r.due))}` : esc(niceDate(r.date))}</div></div>
      <div class="amt">${esc(fmtN(st[0] === 'paid' ? total(r) : owedSale(r)))}<small>${st[0] === 'paid' ? 'payé' : 'reste'}</small></div>
    </button>`;
  };
  function invoicesBody() {
    const f = ui.filter.invoices;
    const q = norm(ui.query.invoices);
    let list = db.sales.slice();
    if (f === 'open') list = list.filter((r) => owedSale(r) > 0);
    if (f === 'late') list = list.filter((r) => invStatus(r)[0] === 'late');
    if (f === 'paid') list = list.filter((r) => owedSale(r) <= 0);
    if (q) list = list.filter((r) => norm(`${r.who} ${invNo(r)} ${itemsLabel(r)}`).includes(q));
    list.sort((a, b) => (f === 'paid' || f === 'all' ? b.date.localeCompare(a.date) : (a.due || a.date).localeCompare(b.due || b.date)) || b.at - a.at);
    const owed = round(db.sales.reduce((a, r) => a + owedSale(r), 0));
    const lateSum = round(db.sales.filter((r) => invStatus(r)[0] === 'late').reduce((a, r) => a + owedSale(r), 0));
    const headH = `<div class="card summary"><div><div class="muted small">Reste à encaisser${lateSum ? ` · dont ${esc(fmt(lateSum))} en retard` : ''}</div><b class="num">${esc(fmt(owed))}</b></div>${I.invoice}</div>`;
    if (!list.length) return headH + `<div class="empty"><div class="big">👍</div><b>${f === 'open' || f === 'late' ? 'Rien à encaisser ici' : 'Aucune facture'}</b>Chaque vente peut être envoyée en facture. Choisissez « Plus tard » comme paiement pour suivre ce qu’on vous doit.</div>`;
    return headH + `<div class="list">${list.slice(0, 200).map(invRow).join('')}</div>`;
  }
  function viewInvoices() {
    return `${back}
      <div class="chips">${[['open', 'À encaisser'], ['late', 'En retard'], ['paid', 'Payées'], ['all', 'Toutes']].map(([v, l]) => `<button class="chip ${ui.filter.invoices === v ? 'on' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('')}</div>
      <input class="search" id="q" type="search" placeholder="Client, n° de facture, article…" value="${esc(ui.query.invoices)}">
      <div id="list-body" class="view" style="padding:0">${invoicesBody()}</div>`;
  }

  // ---------------------------------------------------------------- Articles & stock
  function stockBadge(p) {
    if (!tracked(p)) return '';
    if (p.qty <= 0) return ' <span class="badge red">Rupture</span>';
    if (isLow(p)) return ' <span class="badge orange">Stock bas</span>';
    return '';
  }
  function stockBody() {
    const q = norm(ui.query.stock);
    let list = db.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (ui.filter.stock === 'low') list = list.filter(isLow);
    if (q) list = list.filter((p) => norm(p.name).includes(q));
    const value = round(db.products.filter(tracked).reduce((t, p) => t + Math.max(0, p.qty) * p.price, 0));
    const head = `<div class="card summary"><div><div class="muted small">${db.products.length} article${db.products.length > 1 ? 's' : ''} · valeur du stock</div><b>${esc(fmt(value))}</b></div>${I.box}</div>`;
    if (!list.length) {
      const any = db.products.length > 0;
      return head + `<div class="empty"><div class="big">${any ? '👍' : I.box}</div><b>${any ? 'Rien à signaler' : 'Aucun article pour l’instant'}</b>${any ? 'Aucun article ne correspond.' : 'Ajoutez vos produits ou services avec + : ils apparaîtront en raccourci dans vos ventes, et le stock se mettra à jour tout seul.'}</div>`;
    }
    return head + `<div class="list">${list.map((p) => `<button class="row" data-act="product" data-id="${p.id}">
      <div class="ico">${tracked(p) ? I.box : I.tag}</div>
      <div class="mid"><div class="title">${esc(p.name)}${stockBadge(p)}</div><div class="sub">${esc(fmt(p.price))}${p.cost ? ` · rapporte ${esc(fmtN(round(p.price - p.cost)))}` : ''}</div></div>
      <div class="amt ${tracked(p) && p.qty <= 0 ? 'neg' : ''}">${tracked(p) ? `${fmtQ(p.qty)}<small>en stock</small>` : '<small>stock non suivi</small>'}</div>
    </button>`).join('')}</div>`;
  }
  function viewStock() {
    return `${back}
      <div class="chips">${[['all', 'Tous'], ['low', 'À réapprovisionner']].map(([v, l]) => `<button class="chip ${ui.filter.stock === v ? 'on' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('')}</div>
      <input class="search" id="q" type="search" placeholder="Rechercher un article…" value="${esc(ui.query.stock)}">
      <div id="list-body" class="view" style="padding:0">${stockBody()}</div>`;
  }
  function openProduct(id) {
    const p = id ? db.products.find((x) => x.id === id) : null;
    openSheet(`
      ${head(p ? 'Modifier l’article' : 'Nouvel article')}
      <form id="product-form" novalidate data-id="${id || ''}">
        <label class="field"><span>Nom de l’article ou du service</span><input id="p-name" value="${esc(p ? p.name : '')}" autocomplete="off"></label>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Prix de vente</span><input id="p-price" type="number" inputmode="decimal" min="0" step="any" value="${p ? p.price : ''}"></label>
          <label class="field"><span>Coût de revient</span><input id="p-cost" type="number" inputmode="decimal" min="0" step="any" placeholder="Facultatif" value="${p && p.cost ? p.cost : ''}"></label>
        </div>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Quantité en stock</span><input id="p-qty" type="number" inputmode="decimal" step="any" placeholder="Vide = non suivi" value="${p && tracked(p) ? p.qty : ''}"></label>
          <label class="field"><span>Alerte si stock ≤</span><input id="p-min" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${p && p.min ? p.min : ''}"></label>
        </div>
        <p class="muted small" style="margin-top:10px">Coût de revient : ce que vous coûte une unité (ingrédients, emballage…). Il sert à calculer ce que chaque article vous rapporte dans le bilan.</p>
        <p class="muted small" style="margin-top:6px">Le stock baisse à chaque vente et remonte à chaque dépense qui porte le même nom. Laissez la quantité vide pour un service ou un plat préparé.</p>
        <button class="btn" style="margin-top:14px">Enregistrer</button>
      </form>
      ${p ? `<button class="btn danger" data-act="product-delete" data-id="${id}">${I.trash} Supprimer l’article</button>` : ''}`);
    $('#product-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#p-name').value.trim();
      if (!name) { toast('Donnez un nom à l’article 🙂'); return; }
      const twin = findProduct(name);
      if (twin && twin.id !== id) { toast('Un article porte déjà ce nom'); return; }
      const rec = p || { id: uid() };
      rec.name = name;
      rec.price = num($('#p-price').value);
      rec.cost = num($('#p-cost').value);
      rec.qty = $('#p-qty').value === '' ? null : num($('#p-qty').value);
      rec.min = num($('#p-min').value);
      if (!p) db.products.push(rec);
      save(); closeSheet(); render(); toast(p ? 'Article mis à jour ✅' : 'Article ajouté 📦');
    });
    if (!p) setTimeout(() => { const el = $('#p-name'); if (el) el.focus(); }, 300);
  }

  // ---------------------------------------------------------------- Bilan
  function groupBy(pairs) {
    const map = new Map();
    pairs.forEach(([k, v, q]) => { const g = map.get(k) || { v: 0, q: 0 }; g.v += v; g.q += q || 0; map.set(k, g); });
    return Array.from(map, ([k, g]) => ({ k, v: round(g.v), q: g.q })).sort((a, b) => b.v - a.v);
  }
  const barRows = (rows, sub) => {
    const max = Math.max(1, ...rows.map((r) => r.v));
    return `<div class="card bars">${rows.map((r) => `<div class="bar-row"><div class="top"><span>${esc(r.k)}${sub ? ` <small>${esc(sub(r))}</small>` : ''}</span><b>${esc(fmtN(r.v))}</b></div><div class="track"><i style="width:${Math.max(2, Math.round((r.v / max) * 100))}%"></i></div></div>`).join('')}</div>`;
  };
  function dayBars(p, sales) {
    if (p.type === 'year') {
      const y = p.start.slice(0, 4), cm = today().slice(0, 7);
      const vals = Array.from({ length: 12 }, (_, i) => { const m = `${y}-${pad(i + 1)}`; return { m, v: sum(sales.filter((x) => x.date.slice(0, 7) === m)) }; });
      const mx = Math.max(1, ...vals.map((x) => x.v));
      return vals.map((x, i) => `<div class="col ${x.m === cm ? 'today' : ''} ${x.m > cm ? 'future' : ''}" title="${esc(fmt(x.v))}"><i style="height:${Math.round((x.v / mx) * 100)}%"></i>${'JFMAMJJASOND'[i]}</div>`).join('');
    }
    const n = daysBetween(p.start, p.end) + 1;
    const t = today();
    const days = Array.from({ length: n }, (_, i) => { const d = addDays(p.start, i); return { d, i, v: sum(sales.filter((x) => x.date === d)) }; });
    const max = Math.max(1, ...days.map((x) => x.v));
    return days.map((x) => {
      const day = toDate(x.d).getDate();
      const lbl = p.type === 'week' ? 'LMMJVSD'[x.i] : (day === 1 || day % 5 === 0 ? day : '&nbsp;');
      return `<div class="col ${x.d === t ? 'today' : ''} ${x.d > t ? 'future' : ''}" title="${esc(niceDate(x.d))} : ${esc(fmt(x.v))}"><i style="height:${Math.round((x.v / max) * 100)}%"></i>${lbl}</div>`;
    }).join('');
  }

  function statsFor(a, b) {
    const sales = inRange(db.sales, a, b), purchases = inRange(db.purchases, a, b);
    const tS = sum(sales), tP = sum(purchases);
    const ht = round(sales.reduce((t, r) => t + netOf(r), 0));
    const vat = round(sales.reduce((t, r) => t + taxOf(r), 0));
    let margin = 0, marginBase = 0;
    const items = new Map();
    sales.forEach((r) => r.items.forEach((it) => {
      const g = items.get(norm(it.name)) || { k: it.name, v: 0, q: 0, m: 0, mk: false, pct: 0 };
      const v = it.qty * it.price;
      g.v += v; g.q += it.qty;
      const pr = findProduct(it.name);
      if (pr && pr.cost) { const m = it.qty * (it.price - pr.cost); g.m += m; g.mk = true; margin += m; marginBase += v; }
      items.set(norm(it.name), g);
    }));
    const days = groupBy(sales.map((r) => [r.date, total(r)]));
    return {
      sales, purchases, tS, tP, ht, vat, profit: round(ht - tP),
      cashed: round(sales.reduce((t, r) => t + paidOf(r), 0)),
      owed: round(sales.reduce((t, r) => t + owedSale(r), 0)),
      margin: round(margin), marginBase: round(marginBase),
      items: Array.from(items.values()).map((g) => Object.assign(g, { v: round(g.v), m: round(g.m), pct: g.v ? Math.round((g.m / g.v) * 100) : 0 })).sort((x, y) => y.v - x.v),
      clients: groupBy(sales.filter((r) => norm(r.who)).map((r) => [r.who.trim(), total(r)])),
      bestDay: days[0] || null,
    };
  }

  // Période précédente, coupée à la même date quand la période en cours n'est pas finie.
  function comparable(p) {
    const prev = stepPeriod(p, -1);
    const t = today();
    let end = prev.end;
    if (t >= p.start && t <= p.end) { const e = addDays(prev.start, daysBetween(p.start, t)); if (e < end) end = e; }
    return statsFor(prev.start, end);
  }
  const pctChange = (cur, before) => (before ? Math.round(((cur - before) / Math.abs(before)) * 100) : null);
  const delta = (cur, before) => {
    const d = pctChange(cur, before);
    return d === null ? '' : `<div class="cmp">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} %</div>`;
  };

  function insights(p, cur, base) {
    const out = [];
    const t = today();
    const isCurrent = t >= p.start && t <= p.end;
    const word = { week: 'la semaine dernière', month: 'le mois dernier', year: 'l’année dernière' }[p.type];
    if (!cur.sales.length) out.push('Aucune vente enregistrée sur cette période.');
    const d = pctChange(cur.tS, base.tS);
    if (d !== null && cur.tS) out.push(d >= 0 ? `📈 Ventes en hausse de ${d} % par rapport à ${word}${isCurrent ? ' à la même date' : ''}.` : `📉 Ventes en baisse de ${-d} % par rapport à ${word}${isCurrent ? ' à la même date' : ''}.`);
    if (cur.tP > cur.tS && cur.tS > 0) out.push('⚠️ Vos dépenses dépassent vos ventes sur cette période. Vérifiez vos prix et vos achats.');
    const top = cur.items[0];
    if (top) out.push(`🏆 ${top.k} est votre meilleure vente : ${fmtQ(top.q)} vendu${top.q > 1 ? 's' : ''} pour ${fmt(top.v)}.`);
    if (cur.bestDay && cur.sales.length > 1) out.push(`📅 Meilleur jour : ${toDate(cur.bestDay.k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, avec ${fmt(cur.bestDay.v)}.`);
    const weak = cur.items.filter((g) => g.mk && g.v > 0 && g.pct < 25).sort((a, b) => a.pct - b.pct)[0];
    if (weak) out.push(`💡 ${weak.k} rapporte peu : ${weak.pct} % de marge. Pensez à revoir son prix ou son coût.`);
    else if (cur.items.length && !db.products.some((x) => x.cost)) out.push('💡 Indiquez le coût de revient de vos plats dans « Articles & stock » pour voir ce que chacun vous rapporte vraiment.');
    if (cur.owed > 0) out.push(`⏳ ${fmt(cur.owed)} de ventes de cette période ne sont pas encore payés. Pensez à relancer.`);
    if (cur.clients[0] && cur.clients[0].v > 0) out.push(`💛 Meilleur client : ${cur.clients[0].k}, ${fmt(cur.clients[0].v)}.`);
    const elapsed = isCurrent ? daysBetween(p.start, t) + 1 : 99;
    if (elapsed >= 4) {
      const sold = new Set(cur.items.map((g) => norm(g.k)));
      const idle = db.products.filter((x) => !sold.has(norm(x.name)) && db.sales.some((r) => r.items.some((it) => norm(it.name) === norm(x.name)))).map((x) => x.name);
      if (idle.length) out.push(`🔎 Pas vendu sur cette période : ${idle.slice(0, 3).join(', ')}${idle.length > 3 ? '…' : ''}.`);
    }
    if (isCurrent) {
      const soon = db.orders.filter((o) => !o.saleId && o.due && o.due >= t && o.due <= addDays(t, 7));
      if (soon.length) out.push(`📋 ${soon.length} commande${soon.length > 1 ? 's' : ''} à livrer dans les 7 prochains jours, pour ${fmt(sum(soon))}.`);
    }
    return out.slice(0, 7);
  }

  function viewBilan() {
    const p = ui.period;
    const t = today();
    const cur = statsFor(p.start, p.end);
    const base = comparable(p);
    const isCurrent = t >= p.start && t <= p.end;
    const nav = `${back}
      <div class="chips">${[['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']].map(([v, l]) => `<button class="chip ${p.type === v ? 'on' : ''}" data-act="period-type" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="month-nav"><button data-act="period" data-v="-1" aria-label="Période précédente">${I.back}</button><b>${esc(periodLabel(p))}</b><button data-act="period" data-v="1" aria-label="Période suivante" ${p.end >= t ? 'disabled' : ''}><span style="display:inline-block;transform:scaleX(-1)">${I.back}</span></button></div>`;
    if (!cur.sales.length && !cur.purchases.length) {
      return nav + `<div class="empty"><div class="big">${I.chart}</div><b>Rien sur cette période</b>Les ventes et les dépenses enregistrées apparaîtront ici.</div>`;
    }
    const word = { week: 'la semaine dernière', month: 'le mois dernier', year: 'l’année dernière' }[p.type];
    const pays = groupBy(cur.sales.map((x) => [x.pay === 'credit' ? '⏳ Pas encore payé' : `${PAY[x.pay][0]} ${PAY[x.pay][1]}`, total(x)]));
    const cats = groupBy(cur.purchases.map((x) => [x.cat || 'Autre', total(x)]));
    return `${nav}
      <div class="stats">
        <div class="stat s-sales"><div class="lbl">Ventes</div><div class="val">${esc(fmtN(cur.tS))}</div>${delta(cur.tS, base.tS)}</div>
        <div class="stat s-exp"><div class="lbl">Dépenses</div><div class="val">${esc(fmtN(cur.tP))}</div>${delta(cur.tP, base.tP)}</div>
        <div class="stat s-profit"><div class="lbl">Résultat</div><div class="val">${cur.profit > 0 ? '+' : ''}${esc(fmtN(cur.profit))}</div>${delta(cur.profit, base.profit)}</div>
      </div>
      ${base.tS || base.tP ? `<p class="muted small cmp-note">▲▼ : comparé à ${word}${isCurrent ? ' à la même date' : ''}. Résultat = ventes hors taxes − dépenses.</p>` : '<p class="muted small cmp-note">Résultat = ventes hors taxes − dépenses.</p>'}
      <div class="section-title">Compte de résultat</div>
      <div class="card pl">
        <div class="kv"><span>Chiffre d’affaires hors taxes</span><b>${esc(fmt(cur.ht))}</b></div>
        <div class="kv"><span>Dépenses</span><b>− ${esc(fmt(cur.tP))}</b></div>
        <div class="kv total"><span>Résultat</span><b class="${cur.profit >= 0 ? 'pos' : 'neg'}">${esc(fmt(cur.profit))}</b></div>
        ${cur.vat ? `<div class="kv"><span>Taxes collectées (à reverser)</span><span>${esc(fmt(cur.vat))}</span></div>` : ''}
        ${cur.marginBase ? `<div class="kv"><span>Marge sur articles (coût de revient)</span><span>${esc(fmt(cur.margin))}</span></div>` : ''}
      </div>
      <div class="section-title">Trésorerie</div>
      <div class="card pl">
        <div class="kv"><span>Encaissé sur les ventes</span><b class="pos">+ ${esc(fmt(cur.cashed))}</b></div>
        <div class="kv"><span>Payé en dépenses</span><b>− ${esc(fmt(cur.tP))}</b></div>
        <div class="kv total"><span>Flux net</span><b>${esc(fmt(round(cur.cashed - cur.tP)))}</b></div>
        ${cur.owed ? `<div class="kv"><span>Ventes pas encore payées</span><b class="neg">${esc(fmt(cur.owed))}</b></div>` : ''}
      </div>
      <div class="card">
        <div class="kv"><span>Nombre de ventes</span><span>${cur.sales.length}</span></div>
        <div class="kv"><span>Vente moyenne</span><span>${esc(fmt(cur.sales.length ? round(cur.tS / cur.sales.length) : 0))}</span></div>
        <div class="kv"><span>Clients servis</span><span>${new Set(cur.sales.map((r) => norm(r.who) || r.id)).size}</span></div>
      </div>
      <div class="section-title">Points clés</div>
      <div class="card tips">${insights(p, cur, base).map((x) => `<p>${esc(x)}</p>`).join('')}</div>
      <div class="section-title">Ventes par ${p.type === 'year' ? 'mois' : 'jour'} <small>${esc(S().currency)}</small></div>
      <div class="card"><div class="week ${p.type === 'month' ? 'month' : ''}">${dayBars(p, cur.sales)}</div></div>
      ${cur.items.length ? `<div class="section-title">Meilleures ventes</div>${barRows(cur.items.slice(0, 6), (r) => `× ${fmtQ(r.q)}${r.mk ? ` · rapporte ${fmtN(r.m)}` : ''}`)}` : ''}
      ${cur.clients.length ? `<div class="section-title">Meilleurs clients</div>${barRows(cur.clients.slice(0, 5))}` : ''}
      ${pays.length ? `<div class="section-title">Paiements</div>${barRows(pays)}` : ''}
      ${cats.length ? `<div class="section-title">Dépenses par catégorie</div>${barRows(cats)}` : ''}
      <div class="btn-row" style="margin-top:20px">
        <button class="btn" data-act="share-bilan">${I.share} Partager le bilan</button>
        <button class="btn ghost" data-act="csv">${I.download} Excel (CSV)</button>
      </div>`;
  }

  function bilanText() {
    const p = ui.period;
    const cur = statsFor(p.start, p.end);
    const L = [`Bilan · ${periodLabel(p)}`, S().name, '',
      `Ventes : ${fmt(cur.tS)} (${cur.sales.length} vente${cur.sales.length > 1 ? 's' : ''})`,
      `Dépenses : ${fmt(cur.tP)}`,
      `Résultat : ${fmt(cur.profit)}`,
      `Déjà encaissé : ${fmt(cur.cashed)}`];
    if (cur.owed) L.push(`Pas encore payé : ${fmt(cur.owed)}`);
    if (cur.items.length) L.push('', 'Meilleures ventes :', ...cur.items.slice(0, 5).map((g) => `- ${g.k} × ${fmtQ(g.q)} : ${fmt(g.v)}`));
    const tips = insights(p, cur, comparable(p));
    if (tips.length) L.push('', 'Points clés :', ...tips.map((x) => `- ${x}`));
    return L.join('\n');
  }

  function exportCsv() {
    const p = ui.period;
    const cell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const n = (v) => String(v).replace('.', ',');
    const rows = [['Date', 'Type', 'Référence', 'Client / Fournisseur', 'Article', 'Quantité', 'Prix unitaire', 'Total ligne', 'Paiement / Catégorie', 'Total', 'Payé', 'Reste']];
    [['sales', 'Vente'], ['purchases', 'Dépense']].forEach(([kind, label]) => inRange(db[kind], p.start, p.end)
      .sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at)
      .forEach((r) => r.items.forEach((it, i) => rows.push([fullDate(r.date), label, ref(kind, r), r.who, it.name, n(it.qty), n(it.price), n(round(it.qty * it.price)),
        kind === 'sales' ? PAY[r.pay][1] : r.cat,
        i ? '' : n(total(r)), i ? '' : n(kind === 'sales' ? paidOf(r) : total(r)), i ? '' : n(kind === 'sales' ? owedSale(r) : 0)]))));
    const csv = '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `gestio-${p.start}-au-${p.end}.csv`);
  }

  // ---------------------------------------------------------------- Clients
  const clientRow = (c) => `<button class="row" data-act="client" data-key="${esc(c.key)}">
      <div class="ico initial">${esc(initials(c.name))}</div>
      <div class="mid"><div class="title">${esc(c.name)}${c.credit > 0 ? ` <span class="badge orange">Doit ${esc(fmtN(c.credit))}</span>` : ''}</div>
        <div class="sub">${c.sales.length} achat${c.sales.length > 1 ? 's' : ''}${c.pending ? ' · commande en cours' : ''} · ${esc(niceDate(c.last))}</div></div>
      <div class="amt">${esc(fmtN(c.spent))}<small>dépensés</small></div>
    </button>`;
  function clientsBody() {
    const q = norm(ui.query.clients);
    let list = clientList();
    const owedTotal = round(db.sales.reduce((a, r) => a + owedSale(r), 0));
    const owedOnly = ui.filter.clients === 'owed';
    if (owedOnly) list = list.filter((c) => c.credit > 0);
    if (ui.filter.clients === 'loyal') list = list.filter((c) => c.sales.length >= 5);
    if (ui.filter.clients === 'idle') list = list.filter((c) => c.last && c.last < addDays(today(), -30));
    if (q) list = list.filter((c) => c.key.includes(q) || (c.phone || '').includes(q) || norm(c.email).includes(q));
    list.sort((a, b) => (b.credit > 0) - (a.credit > 0) || b.last.localeCompare(a.last));
    const anon = owedOnly && !q ? db.sales.filter((r) => !norm(r.who) && owedSale(r) > 0) : [];
    const headH = `<div class="card summary"><div><div class="muted small">On vous doit</div><b>${esc(fmt(owedTotal))}</b></div>${I.user}</div>`;
    if (!list.length && !anon.length) {
      const any = clientList().length > 0;
      return headH + `<div class="empty"><div class="big">${any ? '👍' : I.user}</div><b>${any ? (owedOnly ? 'Personne ne vous doit d’argent' : 'Aucun client trouvé') : 'Aucun client pour l’instant'}</b>${any ? '' : 'Indiquez le nom du client quand vous enregistrez une vente ou une commande : il apparaîtra ici avec tout son historique.'}</div>`;
    }
    return headH + `<div class="list">${list.map(clientRow).join('')}
      ${anon.length ? `<div class="day-head"><span>Ventes sans nom de client</span><span>${esc(fmtN(round(anon.reduce((a, r) => a + owedSale(r), 0))))}</span></div>${anon.map((r) => rowHtml('sales', r)).join('')}` : ''}</div>`;
  }
  function viewClients() {
    return `
      <div class="chips">${[['all', 'Tous'], ['owed', 'Ils vous doivent'], ['loyal', 'Fidèles'], ['idle', 'Inactifs (30 j)']].map(([v, l]) => `<button class="chip ${ui.filter.clients === v ? 'on' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('')}</div>
      <input class="search" id="q" type="search" placeholder="Rechercher un client…" value="${esc(ui.query.clients)}">
      <div id="list-body" class="view" style="padding:0">${clientsBody()}</div>`;
  }
  function openClient(key) {
    const c = clientList().find((x) => x.key === key);
    if (!c) return;
    const hist = [...c.sales.map((r) => ['sales', r]), ...c.orders.map((r) => ['orders', r])]
      .sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].at - a[1].at);
    const k = `data-key="${esc(key)}"`;
    openSheet(`${head(esc(c.name))}
      <div class="stats">
        <div class="stat s-sales"><div class="val">${esc(fmtN(c.spent))}</div><div class="lbl">Dépensés</div></div>
        <div class="stat s-profit"><div class="val">${c.sales.length}</div><div class="lbl">Achat${c.sales.length > 1 ? 's' : ''}</div></div>
        <div class="stat s-exp"><div class="val">${esc(fmtN(c.credit))}</div><div class="lbl">Reste à payer</div></div>
      </div>
      <div class="card">
        <div class="kv"><span>Téléphone</span><span>${esc(c.phone || '—')}</span></div>
        ${c.email ? `<div class="kv"><span>E-mail</span><span>${esc(c.email)}</span></div>` : ''}
        ${c.address ? `<div class="kv"><span>Adresse</span><span>${esc(c.address)}</span></div>` : ''}
        ${c.note ? `<div class="kv"><span>Note</span><span>${esc(c.note)}</span></div>` : ''}
        <div class="kv"><span>Client depuis</span><span>${esc(c.sales.length || c.orders.length ? fullDate([...c.sales, ...c.orders].map((r) => r.date).sort()[0]) : '—')}</span></div>
        ${c.pending ? `<div class="kv"><span>Commandes en cours</span><span>${esc(fmt(c.pending))}</span></div>` : ''}
      </div>
      <button class="btn ghost" data-act="client-edit" data-key="${esc(key)}">${I.edit} Modifier la fiche</button>
      ${c.credit > 0 ? `<button class="btn" data-act="remind" ${k}>${I.message} Envoyer un rappel de paiement</button>` : ''}
      <button class="btn ghost" data-act="sale-for" ${k}>${I.plus} Nouvelle vente pour ${esc(c.name)}</button>
      <div class="section-title">Historique <small>${hist.length} opération${hist.length > 1 ? 's' : ''}</small></div>
      <div class="list">${hist.map(([kd, r]) => rowHtml(kd, r, true)).join('')}</div>`);
  }
  function openClientForm(key) {
    const c = key ? clientList().find((x) => x.key === key) : null;
    openSheet(`${head(c ? 'Modifier la fiche' : 'Nouveau client')}
      <form id="client-form" novalidate>
        <label class="field"><span>Nom</span><input id="ct-name" value="${esc(c ? c.name : '')}" ${c ? 'readonly' : ''} autocomplete="off"></label>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Téléphone</span><input id="ct-phone" type="tel" placeholder="+221…" value="${esc(c ? c.phone : '')}"></label>
          <label class="field"><span>E-mail</span><input id="ct-email" type="email" value="${esc(c ? c.email : '')}"></label>
        </div>
        <label class="field" style="margin-top:12px"><span>Adresse</span><input id="ct-address" value="${esc(c ? c.address : '')}"></label>
        <label class="field" style="margin-top:12px"><span>Note</span><input id="ct-note" placeholder="Préférences, entreprise, n° fiscal…" value="${esc(c ? c.note : '')}"></label>
        <button class="btn" style="margin-top:16px">${I.check} Enregistrer</button>
      </form>`);
    $('#client-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#ct-name').value.trim();
      if (!name) { toast('Indiquez le nom du client 🙂'); return; }
      const k = key || norm(name);
      if (!key && clientList().some((x) => x.key === k)) { toast('Ce client existe déjà'); return; }
      db.contacts = db.contacts || {};
      db.contacts[k] = { name: c ? c.name : name, phone: $('#ct-phone').value.trim(), email: $('#ct-email').value.trim(), address: $('#ct-address').value.trim(), note: $('#ct-note').value.trim() };
      save(); render(); openClient(k); toast(c ? 'Fiche mise à jour ✅' : 'Client ajouté ✅');
    });
    if (!c) setTimeout(() => { const el = $('#ct-name'); if (el) el.focus(); }, 250);
  }
  function openRemind(key) {
    const c = clientList().find((x) => x.key === key);
    if (!c) return;
    const lines = c.sales.filter((r) => owedSale(r) > 0).sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => `- ${fullDate(r.date)} : ${itemsLabel(r)}, reste ${fmt(owedSale(r))}`);
    const text = `Bonjour ${c.name},\nPetit rappel de ${S().name} : il reste ${fmt(c.credit)} à régler.\n${lines.join('\n')}\nMerci beaucoup !`;
    const digits = (c.phone || '').replace(/[^\d+]/g, '');
    const intl = /^(\+|00)\d{8,}$/.test(digits) ? digits.replace(/^(\+|00)/, '') : '';
    const wa = (t) => `https://wa.me/${intl}?text=${encodeURIComponent(t)}`;
    openSheet(`${head('Rappel de paiement')}
      <p class="muted small">Vous pouvez modifier le message avant de l’envoyer.</p>
      <textarea id="share-text" class="share-text" rows="7">${esc(text)}</textarea>
      ${intl ? `<a class="btn" id="wa-link" href="${esc(wa(text))}" target="_blank" rel="noopener">${I.message} Envoyer sur WhatsApp</a>` : ''}
      <button class="btn ${intl ? 'ghost' : ''}" data-act="share-remind">${I.share} Partager ou copier</button>
      ${intl ? '' : '<p class="muted small">Enregistrez le numéro du client avec l’indicatif (ex. +221…) pour l’envoyer directement sur WhatsApp.</p>'}
      <button class="btn plain" data-act="client" data-key="${esc(key)}">${I.back} Retour</button>`);
    if (intl) $('#share-text').addEventListener('input', (e) => { $('#wa-link').href = wa(e.target.value); });
  }

  // Partage de texte : feuille de partage du téléphone, sinon presse-papiers, sinon texte à sélectionner.
  async function shareText(text, title) {
    if (navigator.share) {
      try { await navigator.share({ title, text }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast('Texte copié : collez-le dans WhatsApp 📋'); return; } catch (e) { /* refusé */ }
    let ta = $('#share-text');
    if (!ta) {
      openSheet(`${head(esc(title))}<textarea id="share-text" class="share-text" rows="12" readonly>${esc(text)}</textarea><p class="muted small">Sélectionnez le texte puis copiez-le.</p>`);
      ta = $('#share-text');
    }
    ta.focus(); ta.select();
  }

  // ---------------------------------------------------------------- Recherche globale
  function openSearch() {
    openSheet(`${head('Rechercher')}
      <input class="search" id="gq" type="search" placeholder="Client, plat, n° de vente, montant…" autocomplete="off">
      <div id="gres" class="list"></div>`);
    const run = () => { $('#gres').innerHTML = searchResults($('#gq').value); };
    $('#gq').addEventListener('input', run);
    run();
    setTimeout(() => { const el = $('#gq'); if (el) el.focus(); }, 250);
  }
  function searchResults(raw) {
    const q = norm(raw);
    if (!q) return '<p class="muted small">Tapez le nom d’un client, un plat, un numéro (V-0012, R-0012) ou un montant.</p>';
    const digits = q.replace(/[\s.,]/g, '');
    const isNum = /^\d+$/.test(digits);
    const cl = clientList().filter((c) => c.key.includes(q)).slice(0, 5);
    const recs = [];
    ['sales', 'orders', 'purchases'].forEach((kind) => db[kind].forEach((r) => {
      const hay = norm(`${r.who || ''} ${itemsLabel(r)} ${r.cat || ''} ${r.note || ''} ${ref(kind, r)} ${kind !== 'purchases' ? docRef(kind, r) : ''}`);
      if (hay.includes(q) || (isNum && String(total(r)).includes(digits))) recs.push([kind, r]);
    }));
    recs.sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].at - a[1].at);
    if (!cl.length && !recs.length) return `<div class="empty"><div class="big">🔍</div><b>Aucun résultat</b>Vérifiez l’orthographe ou essayez un autre mot.</div>`;
    return `${cl.map(clientRow).join('')}
      ${recs.length ? `<div class="day-head"><span>${recs.length} opération${recs.length > 1 ? 's' : ''}</span><span>${esc(fmtN(round(recs.reduce((a, [k, r]) => a + (k === 'purchases' ? 0 : total(r)), 0))))}</span></div>` : ''}
      ${recs.slice(0, 50).map(([k, r]) => rowHtml(k, r, true)).join('')}`;
  }

  // ---------------------------------------------------------------- Feuilles (modales)
  let sheetLocked = false;
  function openSheet(html, opts) {
    sheetLocked = !!(opts && opts.locked);
    $('#sheet').className = 'sheet' + (opts && opts.cls ? ' ' + opts.cls : '');
    $('#sheet').innerHTML = html;
    $('#sheet').scrollTop = 0;
    $('#sheet-backdrop').hidden = false;
  }
  function closeSheet() { $('#sheet-backdrop').hidden = true; $('#sheet').innerHTML = ''; sheetLocked = false; pending = null; }
  const head = (title) => `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="close" aria-label="Fermer">${I.x}</button></div>`;

  let pending = null;
  function ask(msg, okLabel, ok, cancel) {
    pending = { ok, cancel };
    openSheet(`${head('Confirmer')}<p>${esc(msg)}</p>
      <div class="btn-row"><button class="btn plain" data-act="confirm-no">Annuler</button><button class="btn danger" data-act="confirm-yes">${esc(okLabel)}</button></div>`);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  }

  // ---------------------------------------------------------------- Formulaire vente / achat / commande
  function knownItems(kind) {
    const src = kind === 'purchases' ? db.purchases : db.sales.concat(db.orders);
    const map = new Map();
    src.slice().sort((a, b) => a.at - b.at).forEach((r) => r.items.forEach((it) => map.set(it.name, it.price)));
    db.products.forEach((p) => { if (kind !== 'purchases') map.set(p.name, p.price); else if (!map.has(p.name)) map.set(p.name, ''); });
    return map;
  }
  function knownPeople(kind) {
    const src = kind === 'purchases' ? db.purchases : db.sales.concat(db.orders);
    return Array.from(new Set(src.map((r) => r.who).filter(Boolean)));
  }

  const lineHtml = (it) => `<div class="line">
      <input class="l-name" list="dl-items" placeholder="Article ou service" value="${esc(it ? it.name : '')}" autocomplete="off">
      <input class="l-qty" type="number" inputmode="decimal" min="0" step="any" value="${it ? it.qty : 1}" aria-label="Quantité">
      <input class="l-price" type="number" inputmode="decimal" min="0" step="any" placeholder="Prix" value="${it ? it.price : ''}" aria-label="Prix unitaire">
      <button type="button" class="del" data-act="line-del" aria-label="Supprimer la ligne">${I.x}</button>
    </div>`;

  const chipGroup = (name, opts, val) => `<div class="chips" data-group="${name}">${opts.map(([v, l]) =>
    `<button type="button" class="chip ${v === val ? 'on' : ''}" data-act="pick" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
  const picked = (name) => { const el = $(`#sheet [data-group="${name}"] .on`); return el ? el.dataset.v : ''; };

  let formCtx = null;
  function openForm(kind, id, tpl) {
    const k = KIND[kind];
    const rec = id ? db[kind].find((r) => r.id === id) : null;
    const src = rec || tpl || null;
    const items = knownItems(kind);
    formCtx = { kind, id, items };
    let extra = '';
    if (kind === 'sales') {
      extra = `<div class="field"><span>Paiement</span>${chipGroup('pay', Object.entries(PAY).map(([v, p]) => [v, v === 'credit' ? '⏳ Plus tard (facture)' : `${p[0]} ${p[1]}`]), rec ? rec.pay : 'cash')}</div>
        <label class="field" id="due-wrap" style="margin-top:12px" ${rec && rec.pay === 'credit' ? '' : 'hidden'}><span>Échéance de paiement</span><input id="f-due" type="date" value="${rec && rec.due ? rec.due : addDays(today(), S().terms || 7)}"></label>`;
    } else if (kind === 'purchases') {
      const cats = expenseCats();
      extra = `<div class="field"><span>Catégorie</span>${chipGroup('cat', cats.map((c) => [c, c]), rec && rec.cat ? rec.cat : cats[0])}</div>`;
    } else {
      extra = `<div class="grid2">
          <label class="field"><span>Livraison prévue</span><input id="f-due" type="date" value="${rec ? rec.due || '' : addDays(today(), 1)}"></label>
          <label class="field"><span>Acompte reçu</span><input id="f-deposit" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${rec && rec.deposit ? rec.deposit : ''}"></label>
        </div>
        <label class="field"><span>Téléphone du client</span><input id="f-phone" type="tel" placeholder="Facultatif" value="${esc(rec ? rec.phone : '')}"></label>`;
    }
    openSheet(`
      ${head(`${rec ? 'Modifier la' : 'Nouvelle'} ${k.one}`)}
      <form id="entry-form" novalidate>
        <label class="field"><span>${k.who}</span><input id="f-who" list="dl-people" placeholder="${kind === 'purchases' ? 'Facultatif' : 'Nom du client (conseillé pour le suivi)'}" value="${esc(src ? src.who : '')}" autocomplete="off"></label>
        ${kind !== 'purchases' && db.products.length ? `<div class="chips" id="quick-items" style="margin-top:12px">${db.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map((p) =>
          `<button type="button" class="chip" data-act="quick-item" data-id="${p.id}">${I.plus} ${esc(p.name)}</button>`).join('')}</div>` : ''}
        <div style="margin-top:12px">
          <div class="line-head"><span>Article</span><span>Qté</span><span>Prix unit.</span><span></span></div>
          <div class="lines" id="lines" style="margin-top:5px">${(src && src.items ? src.items : [null]).map(lineHtml).join('')}</div>
          <button type="button" class="btn ghost sm" data-act="line-add" style="margin-top:8px">+ Ajouter une ligne</button>
        </div>
        ${kind !== 'purchases' ? `<details class="more" style="margin-top:12px" ${src && (src.disc || src.tax) ? 'open' : ''}><summary>Remise et taxe</summary>
          <div class="grid2">
            <label class="field"><span>Remise (${esc(S().currency || '')})</span><input id="f-disc" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${src && src.disc ? src.disc : ''}"></label>
            <label class="field"><span>Taxe / TVA (%)</span><input id="f-tax" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${src && src.tax != null ? src.tax || '' : S().taxRate || ''}"></label>
          </div></details>` : ''}
        <div class="total-box" style="margin-top:12px"><span>Total</span><b id="f-total" class="num">${esc(fmt(src && src.items ? total(src) : 0))}</b></div>
        <div class="breakdown" id="f-break" style="margin-top:6px"></div>
        <div style="margin-top:12px">${extra}</div>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Date</span><input id="f-date" type="date" value="${rec ? rec.date : today()}"></label>
          <label class="field"><span>Note</span><input id="f-note" placeholder="Facultatif" value="${esc(rec ? rec.note : '')}"></label>
        </div>
        <button class="btn" style="margin-top:16px">${I.check} ${rec ? 'Enregistrer' : `Enregistrer la ${k.one}`}</button>
      </form>
      <datalist id="dl-items">${Array.from(items.keys()).map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      <datalist id="dl-people">${knownPeople(kind).map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    `);
    const form = $('#entry-form');
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('l-name')) {
        const price = $('.l-price', e.target.parentNode);
        if (!price.value && items.has(e.target.value)) price.value = items.get(e.target.value);
      }
      updateFormTotal();
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(); });
    updateFormTotal();
    if (!rec && !$('#quick-items')) setTimeout(() => { const el = $('#lines .l-name'); if (el) el.focus(); }, 300);
  }

  function formRec() {
    const d = $('#f-disc'), t = $('#f-tax');
    return { items: readLines(), disc: d ? num(d.value) : 0, tax: t ? num(t.value) : 0 };
  }
  function updateFormTotal() {
    const r = formRec();
    $('#f-total').textContent = fmt(total(r));
    const b = $('#f-break');
    if (b) b.innerHTML = r.disc || r.tax ? `<span>Sous-total ${esc(fmt(subtotal(r)))}</span>${r.disc ? `<span>Remise − ${esc(fmt(r.disc))}</span>` : ''}${r.tax ? `<span>Taxe ${esc(String(r.tax).replace('.', ','))} % : ${esc(fmt(taxOf(r)))}</span>` : ''}` : '';
  }

  function readLines() {
    return $$('#lines .line').map((l) => ({
      name: $('.l-name', l).value.trim(),
      qty: num($('.l-qty', l).value),
      price: num($('.l-price', l).value),
    })).filter((it) => it.name || it.price);
  }

  function submitForm() {
    const { kind, id } = formCtx;
    const k = KIND[kind];
    const items = readLines().map((it) => ({ name: it.name || 'Article', qty: it.qty || 1, price: it.price }));
    const fr = formRec();
    if (!items.length || total({ items, disc: fr.disc, tax: fr.tax }) <= 0) { toast('Ajoutez au moins un article avec un prix 🙂'); return; }
    const before = sum(db.sales.filter((s) => s.date === today()));
    const rec = id ? db[kind].find((r) => r.id === id) : { id: uid(), n: ++db.seq[k.seq], at: Date.now() };
    if (id) moveStock(kind, rec.items, -1);
    rec.who = $('#f-who').value.trim();
    rec.items = items;
    moveStock(kind, items, 1);
    rec.date = $('#f-date').value || today();
    rec.note = $('#f-note').value.trim();
    if (kind !== 'purchases') { rec.disc = fr.disc; rec.tax = fr.tax; }
    if (kind === 'sales') rec.pay = picked('pay') || 'cash';
    if (kind === 'sales') rec.due = rec.pay === 'credit' ? $('#f-due').value || '' : rec.due || '';
    if (kind === 'sales' && rec.pay === 'credit' && (rec.paid || 0) >= total(rec)) rec.paid = 0;
    if (kind === 'purchases') rec.cat = picked('cat');
    if (kind === 'orders') {
      rec.due = $('#f-due').value;
      rec.deposit = Math.min(num($('#f-deposit').value), total(rec));
      rec.phone = $('#f-phone').value.trim();
      rec.status = rec.status || 'new';
    }
    if (!id) db[kind].push(rec);
    save();
    closeSheet();
    ui.tab = ui.tab === 'home' ? 'home' : kind;
    render();
    if (id) { toast('Modifications enregistrées ✅'); return; }
    if (kind === 'sales') {
      const after = sum(db.sales.filter((s) => s.date === today()));
      const goal = S().goal || 0;
      if (goal && before < goal && after >= goal) { confetti(160); toast('🎉 Objectif du jour atteint !'); }
      else { confetti(40); toast(`Vente enregistrée : +${fmt(total(rec))} 🎉`); }
      openDetail('sales', rec.id);
    } else {
      toast(kind === 'purchases' ? 'Dépense enregistrée ✅' : 'Commande enregistrée 📋');
    }
  }

  // ---------------------------------------------------------------- Détail
  function openDetail(kind, id) {
    const r = db[kind].find((x) => x.id === id);
    if (!r) return;
    const k = KIND[kind];
    const d = `data-kind="${kind}" data-id="${id}"`;
    let info = '';
    let actions = '';
    if (kind === 'sales') {
      const owed = owedSale(r);
      info = `<div class="kv"><span>Paiement</span><span>${r.pay === 'credit' ? '⏳ Pas encore payé' : `${PAY[r.pay][0]} ${PAY[r.pay][1]}`}</span></div>
        ${(r.payments || []).map((v) => `<div class="kv"><span>Versement du ${esc(fullDate(v.date))}</span><span>${esc(fmt(v.amount))} · ${esc(PAY[v.method] ? PAY[v.method][1] : '')}</span></div>`).join('')}
        ${owed > 0 ? `<div class="kv"><span>Reste à payer</span><b class="neg">${esc(fmt(owed))}</b></div>` : ''}
        ${owed > 0 && r.due ? `<div class="kv"><span>Échéance</span><span>${esc(niceDate(r.due))} <span class="badge ${invStatus(r)[2]}">${invStatus(r)[1]}</span></span></div>` : ''}
        <div class="kv"><span>Facture</span><span>${invNo(r)}</span></div>`;
      actions = `${owed > 0 ? `<button class="btn" data-act="cash-in" ${d}>${I.coin} Encaisser un paiement</button>` : ''}
        <div class="btn-row"><button class="btn ${owed > 0 ? 'ghost' : ''}" data-act="invoice" ${d}>${I.invoice} Facture</button><button class="btn ghost" data-act="receipt" ${d}>${I.receipt} Reçu</button></div>
        <button class="btn ghost" data-act="repeat" ${d}>${I.repeat} Refaire cette vente</button>`;
    } else if (kind === 'purchases') {
      info = `<div class="kv"><span>Catégorie</span><span>${esc(r.cat || '—')}</span></div>`;
    } else {
      const rest = round(total(r) - (r.deposit || 0));
      info = `${r.phone ? `<div class="kv"><span>Téléphone</span><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>` : ''}
        <div class="kv"><span>Livraison prévue</span><span>${r.due ? esc(niceDate(r.due)) : '—'}</span></div>
        <div class="kv"><span>Acompte</span><span>${esc(fmt(r.deposit || 0))}</span></div>
        <div class="kv"><span>${r.saleId ? 'Reste payé à la livraison' : 'Reste à payer'}</span><b>${esc(fmt(rest))}</b></div>`;
      actions = `<div class="steps">${Object.entries(STATUS).map(([v, s]) => `<button class="${r.status === v ? 'on' : ''}" data-act="status" data-v="${v}" ${d}>${s[0]}<br>${s[1]}</button>`).join('')}</div>
        ${r.saleId ? `<button class="btn ghost" data-act="detail" data-kind="sales" data-id="${r.saleId}">${I.coin} Voir la vente</button>` : `<button class="btn" data-act="to-sale" ${d}>${I.check} Livrer et encaisser</button>`}
        <button class="btn ghost" data-act="receipt" ${d}>${I.receipt} Bon de commande avec QR</button>`;
    }
    openSheet(`
      ${head(`${ref(kind, r)}`)}
      <div class="card flat">
        <div class="kv"><span>${k.who}</span>${kind !== 'purchases' && norm(r.who) ? `<button class="link" data-act="client" data-key="${esc(norm(r.who))}">${esc(r.who)}</button>` : `<span>${esc(r.who || '—')}</span>`}</div>
        <div class="kv"><span>Date</span><span>${esc(niceDate(r.date))}</span></div>
        ${info}
        ${r.note ? `<div class="kv"><span>Note</span><span>${esc(r.note)}</span></div>` : ''}
      </div>
      <div>${r.items.map((it) => `<div class="kv"><span style="color:var(--text)">${esc(it.name)} <small class="muted">${fmtN(it.qty).replace(/,0+$/, '')} × ${esc(fmtN(it.price))}</small></span><span>${esc(fmtN(round(it.qty * it.price)))}</span></div>`).join('')}</div>
      ${r.disc || r.tax ? `<div class="breakdown"><span>Sous-total ${esc(fmt(subtotal(r)))}</span>${r.disc ? `<span>Remise − ${esc(fmt(r.disc))}</span>` : ''}${r.tax ? `<span>Taxe ${esc(String(r.tax).replace('.', ','))} % : ${esc(fmt(taxOf(r)))}</span>` : ''}</div>` : ''}
      <div class="total-box"><span>Total</span><b class="num">${esc(fmt(total(r)))}</b></div>
      ${actions}
      <div class="btn-row">
        <button class="btn plain" data-act="edit" ${d}>${I.edit} Modifier</button>
        <button class="btn danger" data-act="delete" ${d}>${I.trash} Supprimer</button>
      </div>`);
  }

  function openCashIn(id) {
    const r = db.sales.find((x) => x.id === id);
    const rest = owedSale(r);
    openSheet(`${head('Encaisser un paiement')}
      <div class="card flat">
        <div class="kv"><span>${esc(r.who || 'Client de passage')}</span><span>${ref('sales', r)} · ${esc(niceDate(r.date))}</span></div>
        <div class="kv"><span>Total</span><span>${esc(fmt(total(r)))}</span></div>
        <div class="kv"><span>Déjà payé</span><span>${esc(fmt(r.paid || 0))}</span></div>
        <div class="kv"><span>Reste à payer</span><b>${esc(fmt(rest))}</b></div>
      </div>
      <label class="field"><span>Montant reçu</span><input id="c-amount" type="number" inputmode="decimal" min="0" step="any" value="${rest}"></label>
      <div class="field"><span>Moyen de paiement</span>${chipGroup('pay', Object.entries(PAY).filter(([v]) => v !== 'credit').map(([v, x]) => [v, `${x[0]} ${x[1]}`]), 'cash')}</div>
      <button class="btn" data-act="cash-in-save" data-id="${id}">${I.check} Enregistrer le paiement</button>
      <button class="btn plain" data-act="detail" data-kind="sales" data-id="${id}">${I.back} Retour</button>`);
  }
  function openDeliver(id) {
    const o = db.orders.find((x) => x.id === id);
    const rest = owedOrder(o);
    openSheet(`${head('Livrer la commande')}
      <div class="card flat">
        <div class="kv"><span>${esc(o.who || 'Client')}</span><span>${ref('orders', o)}</span></div>
        <div class="kv"><span>Total</span><span>${esc(fmt(total(o)))}</span></div>
        <div class="kv"><span>Acompte reçu</span><span>${esc(fmt(o.deposit || 0))}</span></div>
        <div class="kv"><span>Reste à payer</span><b>${esc(fmt(rest))}</b></div>
      </div>
      ${rest > 0 ? `<div class="field"><span>Le client paie le reste…</span>${chipGroup('pay', Object.entries(PAY).map(([v, x]) => [v, v === 'credit' ? '⏳ Plus tard' : `${x[0]} ${x[1]}`]), 'cash')}</div>` : ''}
      <p class="muted small">La commande devient une vente datée d’aujourd’hui et compte dans votre bilan.</p>
      <button class="btn" data-act="deliver" data-id="${id}">${I.check} Confirmer la livraison</button>
      <button class="btn plain" data-act="detail" data-kind="orders" data-id="${id}">${I.back} Retour</button>`);
  }

  // ---------------------------------------------------------------- Canvas : outils
  function qrMatrix(text) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr;
  }
  function drawQR(ctx, text, x, y, size, color) {
    const qr = qrMatrix(text);
    const n = qr.getModuleCount();
    const cell = size / n;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = color || '#000';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(Math.floor(x + c * cell), Math.floor(y + r * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Color Emoji", "Apple Color Emoji", sans-serif';
  const font = (ctx, px, weight) => { ctx.font = `${weight || 400} ${px}px ${FONT}`; };
  function fit(ctx, text, maxW) {
    text = String(text || '');
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }
  function wrap(ctx, text, maxW, maxLines) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach((w) => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    const out = lines.slice(0, maxLines || 3);
    if (lines.length > out.length) out[out.length - 1] = fit(ctx, out[out.length - 1] + ' …', maxW);
    return out.map((l) => fit(ctx, l, maxW));
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawLogo(ctx, x, y, size, r) {
    const s = Math.min(logoImg.width, logoImg.height);
    ctx.save();
    rrect(ctx, x, y, size, size, r);
    ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size);
    ctx.drawImage(logoImg, (logoImg.width - s) / 2, (logoImg.height - s) / 2, s, s, x, y, size, size);
    ctx.restore();
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
  }

  async function shareCanvas(canvas, filename, title) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return toast('Image indisponible');
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    downloadBlob(blob, filename);
  }
  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Enregistré dans vos téléchargements 📥');
  }
  async function downloadCanvas(canvas, filename) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (blob) downloadBlob(blob, filename);
  }

  // ---------------------------------------------------------------- Reçu
  function receiptText(kind, r) {
    const lines = [
      `${kind === 'orders' ? 'BON DE COMMANDE' : 'REÇU'} ${docRef(kind, r)}`,
      S().name,
      `Date : ${fullDate(r.date)}`,
    ];
    if (r.who) lines.push(`Client : ${r.who}`);
    lines.push(`Total : ${fmt(total(r))}`);
    if (kind === 'sales') lines.push(r.pay === 'credit' ? `Payé : ${fmt(r.paid || 0)} · Reste : ${fmt(owedSale(r))}` : `Paiement : ${PAY[r.pay][1]}`);
    else lines.push(`Acompte : ${fmt(r.deposit || 0)}`, `Reste : ${fmt(round(total(r) - (r.deposit || 0)))}`);
    lines.push(`Code : ${controlCode(r)}`);
    if (S().phone) lines.push(`Tél : ${S().phone}`);
    return lines.join('\n');
  }
  const docRef = (kind, r) => (kind === 'sales' ? 'R' : 'C') + '-' + String(r.n).padStart(4, '0');

  function drawReceipt(kind, r) {
    const W = 600, P = 40, INK = '#111114', GREY = '#7a7b84';
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = 4000;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, tmp.height);
    ctx.textBaseline = 'alphabetic';
    let y = 86;
    const center = (t, px, w, col, gap) => { font(ctx, px, w); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(fit(ctx, t, W - 2 * P), W / 2, y); y += gap; };
    const pair = (l, v, px, w, col) => {
      font(ctx, px, w); ctx.fillStyle = col || INK;
      ctx.textAlign = 'right'; ctx.fillText(v, W - P, y);
      const vw = ctx.measureText(v).width;
      ctx.textAlign = 'left'; ctx.fillText(fit(ctx, l, W - 2 * P - vw - 16), P, y);
    };
    const dash = () => { ctx.strokeStyle = '#c9cddd'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke(); ctx.setLineDash([]); y += 38; };

    if (logoImg) { drawLogo(ctx, W / 2 - 42, 14, 84, 18); y += 50; } else center(bizType().emoji, 60, 400, INK, 50);
    center(S().name || 'Mon entreprise', 34, 800, INK, 34);
    if (S().address) center(S().address, 21, 400, GREY, 28);
    if (S().phone) center('Tél : ' + S().phone, 21, 400, GREY, 28);
    y += 4; dash();

    center(kind === 'orders' ? 'BON DE COMMANDE' : 'REÇU DE PAIEMENT', 25, 800, INK, 38);
    pair('N° ' + docRef(kind, r), fullDate(r.date), 22, 600); y += 32;
    if (r.who) { pair('Client', r.who, 22, 400, GREY); y += 32; }
    y -= 4; dash();

    r.items.forEach((it) => {
      pair(it.name, fmtN(round(it.qty * it.price)), 24, 600); y += 28;
      font(ctx, 20, 400); ctx.fillStyle = GREY; ctx.textAlign = 'left';
      ctx.fillText(`${fmtN(it.qty).replace(/,0+$/, '')} × ${fmtN(it.price)}`, P, y); y += 38;
    });
    y -= 8; dash();

    if (r.disc || r.tax) {
      pair('Sous-total', fmt(subtotal(r)), 22, 400, GREY); y += 32;
      if (r.disc) { pair('Remise', '− ' + fmt(r.disc), 22, 400, GREY); y += 32; }
      if (r.tax) { pair(`Taxe ${String(r.tax).replace('.', ',')} %`, fmt(taxOf(r)), 22, 400, GREY); y += 32; }
      y += 6;
    }
    pair('TOTAL', fmt(total(r)), 34, 800); y += 44;
    if (kind === 'sales') {
      if (r.pay === 'credit') {
        pair('Déjà payé', fmt(r.paid || 0), 22, 400, GREY); y += 32;
        pair('Reste à payer', fmt(owedSale(r)), 24, 700, '#c8412f'); y += 30;
      } else { pair('Paiement', PAY[r.pay][1], 22, 400, GREY); y += 30; }
    } else {
      if (r.due) { pair('Livraison prévue', fullDate(r.due), 22, 400, GREY); y += 32; }
      pair('Acompte reçu', fmt(r.deposit || 0), 22, 400, GREY); y += 32;
      pair('Reste à payer', fmt(round(total(r) - (r.deposit || 0))), 24, 700); y += 30;
    }
    y += 22;
    const Q = 210;
    drawQR(ctx, receiptText(kind, r), (W - Q) / 2, y, Q, INK);
    y += Q + 34;
    center('Code de contrôle : ' + controlCode(r), 20, 600, GREY, 40);
    font(ctx, 22, 500);
    wrap(ctx, S().footer || 'Merci pour votre confiance !', W - 2 * P, 3).forEach((l) => center(l, 22, 500, INK, 30));
    y += 20;

    const out = document.createElement('canvas');
    out.width = W; out.height = Math.ceil(y);
    out.getContext('2d').drawImage(tmp, 0, 0);
    return out;
  }

  // Facture au format page : en-tête entreprise, client, lignes, totaux, statut, QR.
  function drawInvoice(r) {
    const W = 900, P = 56, INK = '#111114', GREY = '#7a7b84', LINE = '#e3e4e8';
    const tint = COLORS.includes(S().color) ? S().color : COLORS[0];
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = 6000;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, tmp.height);
    ctx.textBaseline = 'alphabetic';
    const txt = (t, x, y, px, w, col, align) => { font(ctx, px, w); ctx.fillStyle = col || INK; ctx.textAlign = align || 'left'; ctx.fillText(t, x, y); };
    const c = clientList().find((x) => x.key === norm(r.who)) || {};
    const st = invStatus(r);

    ctx.fillStyle = tint; ctx.fillRect(0, 0, W, 220);
    let ly = 64;
    if (logoImg) { drawLogo(ctx, P, 44, 64, 18); } else { font(ctx, 44, 400); ctx.textAlign = 'left'; ctx.fillText(bizType().emoji, P, 92); }
    font(ctx, 28, 700); txt(fit(ctx, S().name || 'Mon entreprise', 420), P + 84, ly + 6, 28, 700);
    ly += 36;
    [S().address, [S().phone, S().email].filter(Boolean).join(' · '), S().taxId ? `N° fiscal : ${S().taxId}` : ''].filter(Boolean).forEach((l) => {
      font(ctx, 17, 500); txt(fit(ctx, l, 440), P + 84, ly, 17, 500, '#3d3d46'); ly += 25;
    });
    txt('FACTURE', W - P, 92, 46, 750, INK, 'right');
    txt(`N° ${invNo(r)}`, W - P, 128, 20, 600, INK, 'right');
    txt(`Date : ${fullDate(r.date)}`, W - P, 158, 18, 500, '#3d3d46', 'right');
    if (r.due) txt(`Échéance : ${fullDate(r.due)}`, W - P, 184, 18, 500, '#3d3d46', 'right');

    let y = 270;
    txt('FACTURÉ À', P, y, 15, 700, GREY); y += 32;
    txt(fit(ctx, r.who || 'Client de passage', 500), P, y, 24, 700); y += 30;
    [c.phone, c.email, c.address].filter(Boolean).forEach((l) => { font(ctx, 18, 500); txt(fit(ctx, l, 500), P, y, 18, 500, '#3d3d46'); y += 26; });
    const badgeW = 210;
    ctx.fillStyle = st[0] === 'paid' ? '#e3f0da' : st[0] === 'late' ? '#f8dcd7' : '#f4e7cf';
    rrect(ctx, W - P - badgeW, 252, badgeW, 50, 25); ctx.fill();
    txt(st[1].toUpperCase(), W - P - badgeW / 2, 284, 19, 750, st[0] === 'paid' ? '#3d7a1d' : st[0] === 'late' ? '#b23a2a' : '#94621a', 'center');
    y = Math.max(y, 320) + 24;

    const cQ = W - P - 300, cP = W - P - 160, cT = W - P;
    ctx.fillStyle = '#f3f3f5'; rrect(ctx, P - 14, y, W - 2 * P + 28, 48, 14); ctx.fill();
    y += 31;
    txt('DÉSIGNATION', P, y, 14, 700, GREY); txt('QTÉ', cQ, y, 14, 700, GREY, 'right'); txt('PRIX UNIT.', cP, y, 14, 700, GREY, 'right'); txt('TOTAL', cT, y, 14, 700, GREY, 'right');
    y += 44;
    r.items.forEach((it) => {
      font(ctx, 19, 600); txt(fit(ctx, it.name, cQ - P - 70), P, y, 19, 600);
      txt(fmtN(it.qty).replace(/,0+$/, ''), cQ, y, 19, 500, INK, 'right');
      txt(fmtN(it.price), cP, y, 19, 500, INK, 'right');
      txt(fmtN(round(it.qty * it.price)), cT, y, 19, 600, INK, 'right');
      y += 18; ctx.fillStyle = LINE; ctx.fillRect(P, y, W - 2 * P, 1.5); y += 36;
    });

    y += 6;
    const tl = W - P - 340;
    const trow = (l, v, px, w, col) => { txt(l, tl, y, px, w, col || GREY); txt(v, W - P, y, px, w, col || INK, 'right'); y += px + 16; };
    trow('Sous-total', fmt(subtotal(r)), 19, 500);
    if (r.disc) trow('Remise', '− ' + fmt(r.disc), 19, 500);
    if (r.tax) trow(`Taxe ${String(r.tax).replace('.', ',')} %`, fmt(taxOf(r)), 19, 500);
    ctx.fillStyle = INK; rrect(ctx, tl - 18, y - 8, W - P - tl + 36, 64, 18); ctx.fill();
    y += 34; txt('TOTAL', tl, y, 20, 700, '#ffffff'); txt(fmt(total(r)), W - P, y, 28, 750, '#ffffff', 'right'); y += 52;
    trow('Déjà payé', fmt(paidOf(r)), 19, 500);
    if (owedSale(r) > 0) trow('Reste à payer', fmt(owedSale(r)), 21, 750, '#b23a2a');

    y += 20;
    const Q = 170, qy = y;
    drawQR(ctx, receiptText('sales', r), P, qy, Q, INK);
    font(ctx, 17, 500);
    let fy = qy + 26;
    [`Paiement : ${r.pay === 'credit' ? 'à régler avant le ' + (r.due ? fullDate(r.due) : 'terme convenu') : PAY[r.pay][1]}`, `Code de contrôle : ${controlCode(r)}`].forEach((l) => { txt(fit(ctx, l, W - 2 * P - Q - 30), P + Q + 30, fy, 17, 500, '#3d3d46'); fy += 28; });
    fy += 8;
    font(ctx, 18, 600);
    wrap(ctx, S().footer || 'Merci pour votre confiance !', W - 2 * P - Q - 30, 3).forEach((l) => { txt(l, P + Q + 30, fy, 18, 600, INK); fy += 26; });
    y = Math.max(qy + Q, fy) + 50;

    const out = document.createElement('canvas');
    out.width = W; out.height = Math.ceil(y);
    out.getContext('2d').drawImage(tmp, 0, 0);
    return out;
  }

  let receiptCanvas = null;
  function openReceipt(kind, id, mode) {
    const r = db[kind].find((x) => x.id === id);
    if (!r) return;
    const inv = mode === 'invoice';
    receiptCanvas = inv ? drawInvoice(r) : drawReceipt(kind, r);
    receiptCanvas.dataset.name = inv ? `facture-${invNo(r)}.png` : `${kind === 'orders' ? 'commande' : 'recu'}-${docRef(kind, r)}.png`;
    openSheet(`
      ${head(inv ? `Facture ${invNo(r)}` : kind === 'orders' ? 'Bon de commande' : 'Reçu')}
      <img class="preview ${inv ? '' : 'ticket'}" alt="Aperçu du document" src="${receiptCanvas.toDataURL('image/png')}">
      <p class="muted small" style="text-align:center">Le code QR contient le résumé du document. Votre client peut le scanner pour le vérifier.</p>
      <div class="btn-row">
        <button class="btn" data-act="receipt-share">${I.share} Partager</button>
        <button class="btn ghost" data-act="receipt-dl">${I.download} Télécharger</button>
      </div>
      <button class="btn plain" data-act="detail" data-kind="${kind}" data-id="${id}">${I.back} Retour</button>`);
  }

  // ---------------------------------------------------------------- Carte de visite
  const CARD_TPL = [['modern', 'Moderne'], ['gradient', 'Dégradé'], ['minimal', 'Minimal']];
  function cardData() {
    const c = db.card || {};
    return {
      tpl: c.tpl || 'modern',
      color: CARD_COLORS.includes(c.color) ? c.color : CARD_COLORS[0],
      name: c.name || '',
      role: c.role || '',
      phone: c.phone != null ? c.phone : S().phone || '',
      email: c.email || '',
      address: c.address != null ? c.address : S().address || '',
      web: c.web || '',
    };
  }
  function vcard(c) {
    const e = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, ' ');
    const name = c.name || S().name;
    const out = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(name)};;;;`, `FN:${e(name)}`, `ORG:${e(S().name)}`];
    if (c.role) out.push(`TITLE:${e(c.role)}`);
    if (c.phone) out.push(`TEL;TYPE=CELL:${e(c.phone)}`);
    if (c.email) out.push(`EMAIL:${e(c.email)}`);
    if (c.address) out.push(`ADR:;;${e(c.address)};;;;`);
    if (c.web) out.push(`URL:${e(c.web)}`);
    out.push('END:VCARD');
    return out.join('\n');
  }

  function drawCard(canvas) {
    const c = cardData();
    const W = 1050, H = 600, INK = '#171a2b', GREY = '#6d7286';
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const name = c.name || 'Votre nom';
    const role = c.role || 'Votre fonction';
    const biz = S().name || 'Mon entreprise';
    const emoji = bizType().emoji;
    const contacts = [['📞', c.phone], ['✉️', c.email], ['📍', c.address], ['🌐', c.web]].filter((x) => x[1]);
    const qr = vcard(c);
    const list = (x, y, gap, px, col, maxW) => contacts.forEach(([ico, t], i) => {
      font(ctx, px, 400); ctx.fillStyle = col;
      ctx.fillText(ico, x, y + i * gap);
      ctx.fillText(fit(ctx, t, maxW - px * 1.7), x + px * 1.7, y + i * gap);
    });

    if (c.tpl === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, shade(c.color, 0.12)); g.addColorStop(1, shade(c.color, -0.45));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.arc(W - 90, 60, 230, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(120, H + 60, 210, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      if (logoImg) drawLogo(ctx, 64, 62, 54, 14); else { font(ctx, 40, 400); ctx.fillText(emoji, 64, 104); }
      font(ctx, 30, 700); ctx.fillStyle = '#fff'; ctx.fillText(fit(ctx, biz, 560), 132, 100);
      font(ctx, 58, 800); ctx.fillText(fit(ctx, name, 640), 64, 268);
      font(ctx, 28, 500); ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillText(fit(ctx, role, 640), 64, 314);
      list(64, 400, 44, 25, '#fff', 640);
      ctx.fillStyle = '#fff'; rrect(ctx, W - 300, 180, 240, 240, 26); ctx.fill();
      drawQR(ctx, qr, W - 280, 200, 200, INK);
    } else if (c.tpl === 'minimal') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.color; ctx.fillRect(0, 0, W, 16);
      font(ctx, 56, 800); ctx.fillStyle = INK; ctx.fillText(fit(ctx, name, 640), 70, 160);
      font(ctx, 28, 600); ctx.fillStyle = c.color; ctx.fillText(fit(ctx, role, 640), 70, 206);
      font(ctx, 26, 500); ctx.fillStyle = GREY;
      if (logoImg) { drawLogo(ctx, 70, 230, 38, 10); ctx.fillStyle = GREY; ctx.fillText(fit(ctx, biz, 590), 120, 258); }
      else ctx.fillText(fit(ctx, `${emoji}  ${biz}`, 640), 70, 258);
      ctx.fillStyle = '#e6e8f2'; ctx.fillRect(70, 292, 90, 4);
      list(70, 362, 46, 25, INK, 640);
      drawQR(ctx, qr, W - 270, 190, 200, INK);
      font(ctx, 20, 500); ctx.fillStyle = GREY; ctx.textAlign = 'center'; ctx.fillText('Scannez-moi', W - 170, 424);
    } else {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c.color); g.addColorStop(1, shade(c.color, -0.3));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 350, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(175, 232, 96, 0, 7); ctx.fill();
      if (logoImg) drawLogo(ctx, 175 - 84, 232 - 84, 168, 84); else { font(ctx, 96, 400); ctx.fillStyle = '#fff'; ctx.fillText(emoji, 175, 266); }
      ctx.fillStyle = '#fff';
      font(ctx, 32, 800);
      wrap(ctx, biz, 290, 2).forEach((l, i) => ctx.fillText(l, 175, 394 + i * 40));
      ctx.textAlign = 'left';
      font(ctx, 52, 800); ctx.fillStyle = INK; ctx.fillText(fit(ctx, name, 620), 400, 140);
      font(ctx, 28, 600); ctx.fillStyle = c.color; ctx.fillText(fit(ctx, role, 620), 400, 186);
      ctx.fillStyle = '#e6e8f2'; ctx.fillRect(400, 220, 90, 4);
      list(400, 300, 48, 25, INK, 410);
      drawQR(ctx, qr, W - 220, H - 220, 170, INK);
    }
    ctx.textAlign = 'left';
  }

  function viewCard() {
    const c = cardData();
    const f = (id, label, type, ph, val) => `<label class="field"><span>${label}</span><input data-card="${id}" type="${type}" placeholder="${ph}" value="${esc(val)}" autocomplete="off"></label>`;
    return `${back}
      <canvas id="card-canvas" class="preview"></canvas>
      <div class="chips" data-group="tpl">${CARD_TPL.map(([v, l]) => `<button class="chip ${c.tpl === v ? 'on' : ''}" data-act="card-tpl" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="swatches">${CARD_COLORS.map((col) => `<button style="background:${col}" class="${c.color === col ? 'on' : ''}" data-act="card-color" data-v="${col}" aria-label="Couleur ${col}"></button>`).join('')}</div>
      <div class="card view" style="padding:16px">
        ${f('name', 'Nom complet', 'text', 'Ex. Awa Diallo', c.name)}
        ${f('role', 'Fonction', 'text', 'Ex. Gérante', c.role)}
        <div class="grid2">
          ${f('phone', 'Téléphone', 'tel', '+…', c.phone)}
          ${f('email', 'E-mail', 'email', 'vous@exemple.com', c.email)}
        </div>
        ${f('address', 'Adresse', 'text', 'Quartier, ville', c.address)}
        ${f('web', 'Site web ou réseau social', 'text', 'Facultatif', c.web)}
      </div>
      <p class="muted small" style="text-align:center">Le code QR ajoute votre contact directement dans le téléphone de la personne qui le scanne.</p>
      <div class="btn-row">
        <button class="btn" data-act="card-share">${I.share} Partager</button>
        <button class="btn ghost" data-act="card-dl">${I.download} Télécharger</button>
      </div>`;
  }
  function mountCard() {
    const canvas = $('#card-canvas');
    drawCard(canvas);
    $$('[data-card]').forEach((inp) => inp.addEventListener('input', () => {
      db.card = Object.assign(cardData(), { [inp.dataset.card]: inp.value });
      save();
      drawCard(canvas);
    }));
  }

  // ---------------------------------------------------------------- Paramètres & bienvenue
  const typePicker = (val) => `<div class="emoji-pick" data-group="type">${TYPES.map((t) =>
    `<button type="button" class="${t.id === val ? 'on' : ''}" data-act="pick" data-v="${t.id}"><span>${t.emoji}</span>${t.label}</button>`).join('')}</div>`;
  const currencySelect = (val) => `<select id="s-currency">${CURRENCIES.map(([c]) => `<option ${c === val ? 'selected' : ''}>${c}</option>`).join('')}</select>`;

  let draftLogo = '';
  function pickLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 240 / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
        const ctx = cv.getContext('2d');
        ctx.drawImage(im, 0, 0, cv.width, cv.height);
        let url = cv.toDataURL('image/png');
        if (url.length > 200000) { // photo lourde : JPEG sur fond blanc
          ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
          url = cv.toDataURL('image/jpeg', 0.85);
        }
        draftLogo = url;
        showDraftLogo();
      };
      im.onerror = () => toast('Cette image ne peut pas être lue ⚠️');
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  function showDraftLogo() {
    $('#s-logo').innerHTML = logoHtml(draftLogo);
    $('[data-act="logo-clear"]').hidden = !draftLogo;
  }

  function openSettings() {
    const s = S();
    draftLogo = s.logo || '';
    openSheet(`
      ${head('Paramètres')}
      <div class="grid2">
        <label class="field"><span>Nom de l’entreprise</span><input id="s-name" value="${esc(s.name)}"></label>
        <label class="field"><span>Votre prénom</span><input id="s-owner" value="${esc(s.owner)}" placeholder="Facultatif"></label>
      </div>
      <div class="field"><span>Logo</span><div class="logo-row">
        <div class="logo" id="s-logo">${logoHtml(draftLogo)}</div>
        <button type="button" class="btn ghost sm" data-act="logo-pick">${I.image} Choisir une image</button>
        <button type="button" class="btn plain sm" data-act="logo-clear" ${draftLogo ? '' : 'hidden'}>Retirer</button>
      </div></div>
      <div class="field"><span>Type d’activité</span>${typePicker(s.type)}</div>
      <div class="grid2">
        <label class="field"><span>Devise</span>${currencySelect(s.currency)}</label>
        <label class="field"><span>Objectif de ventes / jour</span><input id="s-goal" type="number" inputmode="decimal" min="0" step="any" placeholder="Facultatif" value="${s.goal || ''}"></label>
      </div>
      <div class="grid2">
        <label class="field"><span>Téléphone</span><input id="s-phone" type="tel" value="${esc(s.phone)}"></label>
        <label class="field"><span>E-mail</span><input id="s-email" type="email" value="${esc(s.email)}"></label>
      </div>
      <label class="field"><span>Adresse</span><input id="s-address" value="${esc(s.address)}"></label>
      <div class="section-title">Factures et taxes</div>
      <label class="field"><span>Numéro fiscal ou d’immatriculation</span><input id="s-taxid" placeholder="NIF, NINEA, SIRET, RCCM…" value="${esc(s.taxId)}"></label>
      <div class="grid2">
        <label class="field"><span>Taxe / TVA par défaut (%)</span><input id="s-tax" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${s.taxRate || ''}"></label>
        <label class="field"><span>Délai de paiement (jours)</span><input id="s-terms" type="number" inputmode="numeric" min="0" step="1" placeholder="7" value="${s.terms != null ? s.terms : ''}"></label>
      </div>
      <label class="field"><span>Message en bas des reçus et factures</span><input id="s-footer" placeholder="Merci pour votre confiance !" value="${esc(s.footer)}"></label>
      <div class="section-title">Apparence</div>
      <div class="field"><span>Teinte du panneau d’accueil</span><div class="swatches" data-group="color">${COLORS.map((c) => `<button type="button" style="background:${c}" class="${(COLORS.includes(s.color) ? s.color : COLORS[0]) === c ? 'on' : ''}" data-act="pick" data-v="${c}" aria-label="Couleur ${c}"></button>`).join('')}</div></div>
      <button class="btn" data-act="settings-save">Enregistrer</button>
      <div class="section-title">Sauvegarde</div>
      <p class="muted small">Vos données restent sur ce téléphone. Envoyez régulièrement une sauvegarde sur WhatsApp, par e-mail ou dans Google Drive : en cas de perte ou de changement de téléphone, il suffira de l’importer. ${db.lastBackup ? `Dernière sauvegarde : ${esc(niceDate(iso(new Date(db.lastBackup))))}.` : 'Aucune sauvegarde pour l’instant.'}</p>
      <div class="btn-row">
        <button class="btn ghost" data-act="export">${I.share} Exporter</button>
        <button class="btn ghost" data-act="import">${I.download} Importer</button>
      </div>
      <button class="btn danger" data-act="reset">${I.trash} Tout effacer</button>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
      <input type="file" id="logo-file" accept="image/*" hidden>`);
    $('#import-file').addEventListener('change', importFile);
    $('#logo-file').addEventListener('change', pickLogo);
  }

  function readSettings() {
    return {
      name: $('#s-name').value.trim(),
      type: picked('type') || 'other',
      currency: $('#s-currency').value,
      goal: num($('#s-goal').value),
    };
  }

  const onb = { step: 0, data: { name: '', owner: '', type: 'shop', currency: 'FCFA', goal: 0 } };
  function openOnboarding() {
    const dots = `<div class="dots">${[0, 1, 2].map((i) => `<i class="${i === onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
    const d = onb.data;
    let body;
    if (onb.step === 0) {
      body = `<div class="art">${ART}</div><h1 class="wordmark">Gestio</h1>
        <p>Caisse, factures, clients et finances : toute votre entreprise dans la poche, quel que soit votre métier.</p>
        ${dots}<button class="btn" data-act="onb-next">C’est parti</button>`;
    } else if (onb.step === 1) {
      body = `<h2>Votre entreprise</h2><p>L’application s’adapte à votre métier.</p>
        <div class="left view" style="padding:0;margin-top:14px">
          <div class="grid2">
            <label class="field"><span>Nom de l’entreprise</span><input id="s-name" placeholder="Ex. Studio Nova" value="${esc(d.name)}"></label>
            <label class="field"><span>Votre prénom</span><input id="s-owner" placeholder="Facultatif" value="${esc(d.owner)}"></label>
          </div>
          <div class="field"><span>Type d’activité</span>${typePicker(d.type)}</div>
        </div>
        ${dots}<button class="btn" data-act="onb-next">Continuer</button>`;
    } else {
      body = `<h2>Dernière étape</h2><p>Devise, taxe et objectif : modifiables à tout moment.</p>
        <div class="left view" style="padding:0;margin-top:14px">
          <div class="grid2">
            <label class="field"><span>Devise</span>${currencySelect(d.currency)}</label>
            <label class="field"><span>Taxe / TVA (%)</span><input id="s-tax" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${d.tax || ''}"></label>
          </div>
          <label class="field"><span>Objectif de ventes par jour (facultatif)</span><input id="s-goal" type="number" inputmode="decimal" min="0" step="any" placeholder="Ex. 50000" value="${d.goal || ''}"></label>
        </div>
        ${dots}<button class="btn" data-act="onb-next">Commencer</button>`;
    }
    openSheet(`<div class="onb">${body}</div>`, { locked: true, cls: onb.step === 0 ? 'full sun' : 'full' });
  }

  function onbNext() {
    const d = onb.data;
    if (onb.step === 1) {
      d.name = $('#s-name').value.trim();
      d.owner = $('#s-owner').value.trim();
      d.type = picked('type') || 'other';
      if (!d.name) { toast('Donnez un nom à votre entreprise 🙂'); return; }
    }
    if (onb.step === 2) {
      d.currency = $('#s-currency').value;
      d.goal = num($('#s-goal').value);
      d.tax = num($('#s-tax').value);
      db.settings = { name: d.name, owner: d.owner, type: d.type, currency: d.currency, goal: d.goal, taxRate: d.tax, terms: 7, color: COLORS[0], phone: '', email: '', address: '', taxId: '', footer: '' };
      save(); closeSheet(); render(); confetti(120);
      toast(`Bienvenue, ${d.name} ! 🎉`);
      return;
    }
    onb.step++;
    openOnboarding();
  }

  async function exportData() {
    const name = `gestio-sauvegarde-${today()}.json`;
    const blob = new Blob([JSON.stringify(Object.assign({}, db, { lastBackup: Date.now() }))], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    const done = () => { db.lastBackup = Date.now(); save(); if ($('#sheet-backdrop').hidden) render(); };
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde Gestio' }); done(); toast('Sauvegarde envoyée ✅'); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    downloadBlob(blob, name);
    done();
  }
  function importFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || !d.settings || !Array.isArray(d.sales) || !Array.isArray(d.purchases) || !Array.isArray(d.orders)) throw new Error('format');
        ask('Remplacer toutes les données actuelles par cette sauvegarde ?', 'Remplacer', () => {
          db = Object.assign(blank(), d);
          loadLogo();
          save(); render(); toast('Sauvegarde restaurée ✅');
        }, openSettings);
      } catch (err) { toast('Ce fichier n’est pas une sauvegarde Gestio ⚠️'); }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------- Confettis
  function confetti(count) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const parts = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.45,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      s: Math.random() * 7 + 5, r: Math.random() * 6, c: COLORS[(Math.random() * COLORS.length) | 0],
    }));
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += 0.2; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - frame / 90);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (++frame < 90) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    })();
  }

  // ---------------------------------------------------------------- Actions
  const actions = {
    close: closeSheet,
    new: (d) => openForm(d.kind),
    detail: (d) => openDetail(d.kind, d.id),
    edit: (d) => openForm(d.kind, d.id),
    filter: (d) => { ui.filter[ui.tab] = d.v; render(); },
    credits: () => { ui.tab = 'clients'; ui.filter.clients = 'owed'; ui.query.clients = ''; render(); window.scrollTo(0, 0); },
    'open-bilan': () => { ui.tab = 'bilan'; ui.period = periodOf('week', today()); render(); window.scrollTo(0, 0); },
    'period-type': (d) => { ui.period = periodOf(d.v, today()); render(); },
    period: (d) => { ui.period = stepPeriod(ui.period, Number(d.v)); render(); },
    'share-bilan': () => shareText(bilanText(), 'Bilan'),
    client: (d) => openClient(d.key),
    remind: (d) => openRemind(d.key),
    'share-remind': () => shareText($('#share-text').value, 'Rappel de paiement'),
    'sale-for': (d) => { const c = clientList().find((x) => x.key === d.key); openForm('sales', null, { who: c ? c.name : '' }); },
    repeat: (d) => { const r = db.sales.find((x) => x.id === d.id); openForm('sales', null, { who: r.who, items: r.items.map((it) => Object.assign({}, it)), disc: r.disc, tax: r.tax }); },
    'cash-in': (d) => openCashIn(d.id),
    'cash-in-save': (d) => {
      const r = db.sales.find((x) => x.id === d.id);
      const amt = Math.min(round(num($('#c-amount').value)), owedSale(r));
      if (!(amt > 0)) { toast('Indiquez le montant reçu 🙂'); return; }
      const method = picked('pay') || 'cash';
      r.payments = (r.payments || []).concat({ date: today(), amount: amt, method });
      r.paid = round((r.paid || 0) + amt);
      const full = owedSale(r) <= 0;
      if (full) r.pay = method;
      save(); render(); openDetail('sales', r.id);
      if (full) { confetti(50); toast('Vente entièrement payée 💵'); } else toast(`${fmt(amt)} encaissés · reste ${fmt(owedSale(r))}`);
    },
    deliver: (d) => {
      const o = db.orders.find((x) => x.id === d.id);
      const pay = owedOrder(o) > 0 ? picked('pay') || 'cash' : 'cash';
      const sale = { id: uid(), n: ++db.seq.sale, at: Date.now(), who: o.who, items: o.items.map((it) => Object.assign({}, it)), date: today(), note: `Commande ${ref('orders', o)}`, pay, disc: o.disc || 0, tax: o.tax || 0 };
      if (pay === 'credit') sale.due = addDays(today(), S().terms != null ? S().terms : 7);
      if (o.deposit) sale.payments = [{ date: o.date, amount: o.deposit, method: 'cash' }];
      if (pay === 'credit') sale.paid = o.deposit || 0;
      else if (o.deposit && owedOrder(o) > 0) sale.payments.push({ date: today(), amount: owedOrder(o), method: pay });
      db.sales.push(sale);
      moveStock('sales', sale.items, 1);
      o.saleId = sale.id; o.status = 'done';
      save(); render(); confetti(60); toast('Commande livrée et ajoutée aux ventes 📦');
      openDetail('sales', sale.id);
    },
    'low-stock': () => { ui.tab = 'stock'; ui.filter.stock = 'low'; render(); window.scrollTo(0, 0); },
    go: (d) => { ui.tab = d.v; render(); window.scrollTo(0, 0); },
    settings: () => openSettings(),
    product: (d) => openProduct(d.id),
    'product-delete': (d) => ask('Supprimer cet article ? Vos ventes et achats passés ne changent pas.', 'Supprimer', () => {
      db.products = db.products.filter((p) => p.id !== d.id);
      save(); render(); toast('Article supprimé 🗑️');
    }, () => openProduct(d.id)),
    'quick-item': (d) => {
      const p = db.products.find((x) => x.id === d.id);
      const lines = $$('#lines .line');
      let line = lines.find((l) => norm($('.l-name', l).value) === norm(p.name));
      if (line) { const q = $('.l-qty', line); q.value = num(q.value) + 1; }
      else {
        line = lines.find((l) => !$('.l-name', l).value.trim() && !$('.l-price', l).value);
        if (!line) { $('#lines').insertAdjacentHTML('beforeend', lineHtml()); line = $('#lines .line:last-child'); }
        $('.l-name', line).value = p.name; $('.l-qty', line).value = 1; $('.l-price', line).value = p.price;
      }
      $('#f-total').textContent = fmt(total({ items: readLines() }));
    },
    csv: exportCsv,
    'logo-pick': () => $('#logo-file').click(),
    'logo-clear': () => { draftLogo = ''; showDraftLogo(); },
    pick: (d, el) => {
      $$('.on', el.parentNode).forEach((x) => x.classList.remove('on')); el.classList.add('on');
      if (el.parentNode.dataset.group === 'pay' && $('#due-wrap')) $('#due-wrap').hidden = d.v !== 'credit';
    },
    invoice: (d) => openReceipt('sales', d.id, 'invoice'),
    'client-new': () => openClientForm(),
    'client-edit': (d) => openClientForm(d.key),
    'pos-add': (d) => {
      const p = db.products.find((x) => x.id === d.id);
      if (!p) return;
      cartAdd(p.name, p.price, 1);
      if (ui.tab !== 'pos') { ui.tab = 'pos'; cart.keypad = false; render(); window.scrollTo(0, 0); } else render();
    },
    'cart-inc': (d) => { const it = cart.items[+d.i]; if (it) { it.qty += 1; render(); } },
    'cart-dec': (d) => { const it = cart.items[+d.i]; if (!it) return; it.qty -= 1; if (it.qty <= 0) cart.items.splice(+d.i, 1); render(); },
    'pos-clear': () => { cart.items = []; cart.who = ''; render(); },
    'pos-mode': (d) => { cart.keypad = d.v === 'keypad'; render(); },
    key: (d) => {
      let e = cart.entry;
      if (d.v === '⌫') e = e.slice(0, -1);
      else if (d.v === ',') { if (!e.includes('.')) e = (e || '0') + '.'; }
      else if (d.v === '00') { if (e) e += '00'; }
      else e = e === '0' ? d.v : e + d.v;
      if (e.includes('.') && e.split('.')[1].length > decimals()) return;
      if (e.replace('.', '').length > 12) return;
      cart.entry = e; render();
    },
    'kp-add': () => {
      const v = round(num(cart.entry));
      if (!(v > 0)) return;
      cartAdd(cart.label.trim() || 'Montant libre', v, 1);
      cart.entry = ''; cart.label = '';
      render(); toast(`Ajouté au panier : ${fmt(v)}`);
    },
    'pos-pay': () => openCheckout(),
    'pos-confirm': () => {
      const pay = picked('pay') || 'cash';
      const before = sum(db.sales.filter((x) => x.date === today()));
      const sale = { id: uid(), n: ++db.seq.sale, at: Date.now(), who: $('#co-who').value.trim(), items: cart.items.map((it) => Object.assign({}, it)), date: today(), note: '', pay, disc: 0, tax: 0 };
      if (pay === 'credit') { sale.paid = 0; sale.due = $('#f-due').value || ''; }
      db.sales.push(sale);
      moveStock('sales', sale.items, 1);
      save();
      cart.items = []; cart.who = ''; cart.entry = ''; cart.label = '';
      render();
      const after = sum(db.sales.filter((x) => x.date === today()));
      const goal = S().goal || 0;
      if (goal && before < goal && after >= goal) { confetti(160); toast('🎉 Objectif du jour atteint !'); }
      else { confetti(40); toast(`Vente enregistrée : +${fmt(total(sale))}`); }
      openDetail('sales', sale.id);
    },
    'pos-client': () => openPosClient(),
    'pos-client-ok': () => { cart.who = $('#pc-who').value.trim(); closeSheet(); render(); },
    'pos-client-pick': (d) => { const c = clientList().find((x) => x.key === d.key); cart.who = c ? c.name : ''; closeSheet(); render(); },
    'pos-client-none': () => { cart.who = ''; closeSheet(); render(); },
    'line-add': () => { $('#lines').insertAdjacentHTML('beforeend', lineHtml()); $('#lines .line:last-child .l-name').focus(); },
    'line-del': (d, el) => {
      if ($$('#lines .line').length > 1) el.parentNode.remove();
      else $$('input', el.parentNode).forEach((i) => { i.value = i.classList.contains('l-qty') ? 1 : ''; });
      $('#f-total').textContent = fmt(total({ items: readLines() }));
    },
    delete: (d) => {
      ask(`Supprimer cette ${KIND[d.kind].one} ?`.replace('cette achat', 'cet achat'), 'Supprimer', () => {
        moveStock(d.kind, db[d.kind].find((r) => r.id === d.id).items, -1);
        db[d.kind] = db[d.kind].filter((r) => r.id !== d.id);
        if (d.kind === 'sales') db.orders.forEach((o) => { if (o.saleId === d.id) delete o.saleId; });
        save(); render(); toast('Supprimé 🗑️');
      }, () => openDetail(d.kind, d.id));
    },
    status: (d) => {
      const o = db.orders.find((x) => x.id === d.id);
      if (d.v === 'done' && !o.saleId) { openDeliver(o.id); return; }
      o.status = d.v; save(); render(); openDetail('orders', d.id);
    },
    'to-sale': (d) => openDeliver(d.id),
    receipt: (d) => openReceipt(d.kind, d.id),
    'receipt-share': () => shareCanvas(receiptCanvas, receiptCanvas.dataset.name, 'Reçu'),
    'receipt-dl': () => downloadCanvas(receiptCanvas, receiptCanvas.dataset.name),
    'card-tpl': (d) => { db.card = Object.assign(cardData(), { tpl: d.v }); save(); render(); },
    'card-color': (d) => { db.card = Object.assign(cardData(), { color: d.v }); save(); render(); },
    'card-share': () => shareCanvas($('#card-canvas'), 'carte-de-visite.png', 'Carte de visite'),
    'card-dl': () => downloadCanvas($('#card-canvas'), 'carte-de-visite.png'),
    'settings-save': () => {
      const s = readSettings();
      if (!s.name) { toast('Le nom de l’entreprise est requis'); return; }
      Object.assign(db.settings, s, {
        phone: $('#s-phone').value.trim(), address: $('#s-address').value.trim(), email: $('#s-email').value.trim(), owner: $('#s-owner').value.trim(),
        taxId: $('#s-taxid').value.trim(), taxRate: num($('#s-tax').value), terms: $('#s-terms').value === '' ? 7 : Math.max(0, Math.round(num($('#s-terms').value))),
        footer: $('#s-footer').value.trim(), color: picked('color') || COLORS[0], logo: draftLogo,
      });
      loadLogo();
      save(); closeSheet(); render(); toast('Paramètres enregistrés ✅');
    },
    export: exportData,
    import: () => $('#import-file').click(),
    reset: () => {
      ask('Effacer définitivement toutes les données de l’application ?', 'Tout effacer', () => {
        try { localStorage.removeItem(KEY); } catch (e) { /* stockage indisponible */ }
        db = blank(); onb.step = 0; ui.tab = 'home';
        loadLogo(); render(); openOnboarding();
      }, openSettings);
    },
    'confirm-yes': () => { const p = pending; closeSheet(); if (p) p.ok(); },
    'confirm-no': () => { const p = pending; closeSheet(); if (p && p.cancel) p.cancel(); },
    'onb-next': onbNext,
    'fab-menu': () => openSheet(`${head('Ajouter')}
      <div class="quick">
        <button data-act="go-close" data-v="pos"><span>${I.pos}</span>Caisse</button>
        <button data-act="new" data-kind="sales"><span>${I.invoice}</span>Facture</button>
        <button data-act="new" data-kind="purchases"><span>${I.arrowDown}</span>Dépense</button>
        <button data-act="new" data-kind="orders"><span>${I.clip}</span>Commande</button>
        <button data-act="client-new"><span>${I.user}</span>Client</button>
        <button data-act="product"><span>${I.tag}</span>Article</button>
      </div>`),
    'go-close': (d) => { closeSheet(); ui.tab = d.v; render(); window.scrollTo(0, 0); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && actions[el.dataset.act]) { actions[el.dataset.act](el.dataset, el); return; }
    const tab = e.target.closest('#tabbar button');
    if (tab) { ui.tab = tab.dataset.tab; render(); window.scrollTo(0, 0); return; }
    if (e.target.id === 'sheet-backdrop' && !sheetLocked) closeSheet();
  });
  $('#fab').addEventListener('click', () => {
    if (ui.tab === 'home') actions['fab-menu']();
    else if (ui.tab === 'stock') openProduct();
    else if (ui.tab === 'clients') openClientForm();
    else openForm(ui.tab === 'invoices' ? 'sales' : ui.tab);
  });
  $('#btn-search').addEventListener('click', () => { if (db.settings) openSearch(); });
  $('#btn-settings').addEventListener('click', () => { if (db.settings) openSettings(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheetLocked && !$('#sheet-backdrop').hidden) closeSheet(); });

  // ---------------------------------------------------------------- Démarrage
  $$('[data-icon]').forEach((el) => { (el.querySelector('span') || el).innerHTML = I[el.dataset.icon]; });
  loadLogo();
  render();
  if (!db.settings) openOnboarding();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
