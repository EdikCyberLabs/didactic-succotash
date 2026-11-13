/* Gestio — gestion simple pour petites entreprises.
   Tout est stocké localement sur l'appareil (localStorage). */
(function () {
  'use strict';

  // ---------------------------------------------------------------- Constantes
  const KEY = 'gestio.v1';

  const TYPES = [
    { id: 'shop', emoji: '🏪', label: 'Boutique', cats: ['Marchandises', 'Transport', 'Loyer', 'Autre'] },
    { id: 'food', emoji: '🍽️', label: 'Restauration', cats: ['Ingrédients', 'Boissons', 'Énergie', 'Loyer', 'Autre'] },
    { id: 'service', emoji: '🛠️', label: 'Services', cats: ['Matériel', 'Transport', 'Sous-traitance', 'Autre'] },
    { id: 'beauty', emoji: '💇', label: 'Beauté', cats: ['Produits', 'Matériel', 'Loyer', 'Autre'] },
    { id: 'fashion', emoji: '👗', label: 'Mode', cats: ['Tissus', 'Fournitures', 'Main-d’œuvre', 'Autre'] },
    { id: 'tech', emoji: '📱', label: 'Tech', cats: ['Appareils', 'Accessoires', 'Pièces', 'Autre'] },
    { id: 'farm', emoji: '🌾', label: 'Agriculture', cats: ['Semences', 'Intrants', 'Transport', 'Autre'] },
    { id: 'other', emoji: '✨', label: 'Autre', cats: ['Stock', 'Charges', 'Transport', 'Autre'] },
  ];

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

  const COLORS = ['#6c72c4', '#dd5f4a', '#5d8736', '#3f86c9', '#cf5a97', '#2f8f86', '#7b4fb0'];

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
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>'
  });

  // Illustration d'accueil : un reçu, des pièces et quelques étincelles.
  const ART = `<svg viewBox="0 0 260 220" fill="none" stroke="#25214d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M36 36v20M26 46h20M222 26v14M215 33h14M232 96v16M224 104h16M22 118v12M16 124h12"/>
    <circle cx="212" cy="62" r="7" fill="#fffdf7"/><circle cx="56" cy="84" r="5" fill="#e8806c"/>
    <g transform="rotate(-8 130 110)">
      <path d="M88 40h96v150l-12-9-12 9-12-9-12 9-12-9-12 9-12-9-12 9z" fill="#25214d"/>
      <path d="M82 34h96v150l-12-9-12 9-12-9-12 9-12-9-12 9-12-9-12 9z" fill="#fffdf7"/>
      <path d="M97 56h46" stroke="#6c72c4" stroke-width="7"/><path d="M97 74h66M97 90h38"/>
      <rect x="97" y="108" width="46" height="46" rx="5" fill="#fff"/>
      <path d="M105 116h9v9h-9zM126 116h9v9h-9zM105 137h9v9h-9z" fill="#25214d"/><path d="M124 136h5M133 141v6M124 146h4"/>
      <path d="M153 150h10"/>
    </g>
    <circle cx="211" cy="161" r="25" fill="#25214d"/><circle cx="206" cy="156" r="25" fill="#8fb04f"/><path d="M196 156l7 7 13-14"/>
    <circle cx="51" cy="171" r="19" fill="#25214d"/><circle cx="47" cy="167" r="19" fill="#e8806c"/><circle cx="47" cy="167" r="10"/>
  </svg>`;

  const KIND = {
    sales: { one: 'vente', title: 'Ventes', ico: I.coin, prefix: 'V', who: 'Client', seq: 'sale' },
    purchases: { one: 'achat', title: 'Achats', ico: I.cart, prefix: 'A', who: 'Fournisseur', seq: 'purchase' },
    orders: { one: 'commande', title: 'Commandes', ico: I.clip, prefix: 'C', who: 'Client', seq: 'order' },
  };

  // ---------------------------------------------------------------- Utilitaires
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
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
  const blank = () => ({ settings: null, sales: [], purchases: [], orders: [], products: [], card: {}, seq: { sale: 0, purchase: 0, order: 0 } });

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
  const total = (rec) => round((rec.items || []).reduce((s, it) => s + it.qty * it.price, 0));
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
    filter: { sales: 'month', purchases: 'month', orders: 'open', stock: 'all' },
    query: { sales: '', purchases: '', orders: '', stock: '' },
    month: today().slice(0, 7),
  };
  const SUB = ['stock', 'report', 'card'];

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
    document.documentElement.style.setProperty('--primary', S().color || COLORS[0]);
  }

  function renderBrand() {
    const h = new Date().getHours();
    const hello = h < 12 ? 'Bonjour 👋' : h < 18 ? 'Bon après-midi ☀️' : 'Bonsoir 🌙';
    $('#brand').innerHTML = `<div class="logo">${logoHtml(S().logo)}</div>
      <div style="min-width:0"><div class="hello">${hello}</div><div class="name">${esc(S().name || 'Gestio')}</div></div>`;
  }

  function render() {
    applyTheme();
    renderBrand();
    const top = SUB.includes(ui.tab) ? 'more' : ui.tab;
    $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === top));
    $('#fab').hidden = ['more', 'report', 'card'].includes(ui.tab);
    const v = $('#view');
    if (ui.tab === 'home') v.innerHTML = viewHome();
    else if (ui.tab === 'more') v.innerHTML = viewMore();
    else if (ui.tab === 'stock') { v.innerHTML = viewStock(); mountSearch('stock', stockBody); }
    else if (ui.tab === 'report') v.innerHTML = viewReport();
    else if (ui.tab === 'card') { v.innerHTML = viewCard(); mountCard(); }
    else { const kind = ui.tab; v.innerHTML = viewList(kind); mountSearch(kind, () => listBody(kind)); }
  }

  // ---------------------------------------------------------------- Accueil
  function viewHome() {
    const t = today();
    const sToday = sum(db.sales.filter((s) => s.date === t));
    const pToday = sum(db.purchases.filter((p) => p.date === t));
    const goal = S().goal || 0;
    const pct = goal ? Math.min(100, Math.round((sToday / goal) * 100)) : 0;
    let msg;
    if (!sToday) msg = 'Prêt pour la première vente du jour ? 💪';
    else if (!goal) msg = 'Belle journée, continuez ! 🚀';
    else if (pct >= 100) msg = 'Objectif atteint, bravo ! 🎉';
    else if (pct >= 50) msg = `Presque ! Encore ${fmt(round(goal - sToday))}`;
    else msg = 'Bon début, on continue ! 🚀';

    const bal = round(sToday - pToday);
    const st = streak();

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(t, -i);
      days.push({ d, v: sum(db.sales.filter((s) => s.date === d)) });
    }
    const max = Math.max(1, ...days.map((x) => x.v));
    const week = days.map((x) => `<div class="col ${x.d === t ? 'today' : ''}" title="${esc(fmt(x.v))}">
        <i style="height:${Math.round((x.v / max) * 100)}%"></i>${toDate(x.d).toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase()}</div>`).join('');

    const credits = db.sales.filter((s) => s.pay === 'credit');
    const lowStock = db.products.filter(isLow);
    const open = db.orders.filter((o) => o.status !== 'done').sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).slice(0, 3);
    const recent = [
      ...db.sales.map((r) => ['sales', r]), ...db.purchases.map((r) => ['purchases', r]), ...db.orders.map((r) => ['orders', r]),
    ].sort((a, b) => b[1].at - a[1].at).slice(0, 5);

    return `
      <div class="hero">
        <div class="label">Ventes du jour</div>
        <div class="amount">${esc(fmt(sToday))}</div>
        ${goal ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
        <div class="goal"><span>${esc(msg)}</span>${goal ? `<span>${pct}% de ${esc(fmt(goal))}</span>` : ''}</div>
      </div>

      <div class="stats">
        <div class="stat"><div class="ico">${I.cart}</div><div class="val">${esc(fmtN(pToday))}</div><div class="lbl">Achats du jour</div></div>
        <div class="stat"><div class="ico">${bal >= 0 ? I.up : I.down}</div><div class="val ${bal >= 0 ? 'pos' : 'neg'}">${bal > 0 ? '+' : ''}${esc(fmtN(bal))}</div><div class="lbl">Solde du jour</div></div>
        <div class="stat"><div class="ico">${I.flame}</div><div class="val">${st} jour${st > 1 ? 's' : ''}</div><div class="lbl">Série de ventes</div></div>
      </div>

      <div class="quick">
        <button data-act="new" data-kind="sales"><span>${I.coin}</span>Vente</button>
        <button data-act="new" data-kind="purchases"><span>${I.cart}</span>Achat</button>
        <button data-act="new" data-kind="orders"><span>${I.clip}</span>Commande</button>
      </div>

      ${credits.length ? `<button class="row" data-act="credits">
          <div class="ico">${I.hourglass}</div><div class="mid"><div class="title">À encaisser</div><div class="sub">${credits.length} vente${credits.length > 1 ? 's' : ''} à crédit</div></div>
          <div class="amt">${esc(fmt(sum(credits)))}</div></button>` : ''}

      ${lowStock.length ? `<button class="row" data-act="low-stock">
          <div class="ico">${I.alert}</div><div class="mid"><div class="title">Stock à réapprovisionner</div><div class="sub">${esc(lowStock.map((p) => p.name).join(', '))}</div></div>
          <div class="amt">${lowStock.length}<small>article${lowStock.length > 1 ? 's' : ''}</small></div></button>` : ''}

      <div class="section-title">7 derniers jours <small>${esc(fmt(round(days.reduce((s, x) => s + x.v, 0))))}</small></div>
      <div class="card"><div class="week">${week}</div></div>

      ${open.length ? `<div class="section-title">Commandes à livrer <small>${db.orders.filter((o) => o.status !== 'done').length} en cours</small></div>
        <div class="list">${open.map((o) => rowHtml('orders', o)).join('')}</div>` : ''}

      <div class="section-title">Activité récente</div>
      ${recent.length ? `<div class="list">${recent.map(([k, r]) => rowHtml(k, r, true)).join('')}</div>`
        : `<div class="card empty"><div class="big">🌱</div><b>Tout commence ici</b>Appuyez sur <b style="display:inline">+</b> pour enregistrer votre première vente.</div>`}
    `;
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
    const who = r.who || (kind === 'purchases' ? (r.cat || 'Achat') : 'Client de passage');
    let extra = '';
    if (kind === 'sales' && r.pay === 'credit') extra = ' <span class="badge orange">Crédit</span>';
    if (kind === 'orders') extra = ' ' + dueBadge(r);
    const sign = kind === 'purchases' ? '−' : '';
    return `<button class="row" data-act="detail" data-kind="${kind}" data-id="${r.id}">
      <div class="ico">${k.ico}</div>
      <div class="mid"><div class="title">${esc(who)}${extra}</div><div class="sub">${kind === 'orders' && r.status !== 'done' ? STATUS[r.status][1] + ' · ' : ''}${esc(itemsLabel(r))}</div></div>
      <div class="amt ${kind === 'purchases' && showKind ? 'neg' : ''}">${sign}${esc(fmtN(total(r)))}<small>${esc(niceDate(r.date))}</small></div>
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
      list = f === 'credit' ? list.filter((s) => s.pay === 'credit') : list.filter((r) => inPeriod(r.date, f));
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
    return head + `<div class="list">${list.map((r) => rowHtml(kind, r)).join('')}</div>`;
  }

  function viewList(kind) {
    const chips = kind === 'orders'
      ? [['open', 'En cours'], ['done', 'Livrées'], ['all', 'Toutes']]
      : [['today', 'Aujourd’hui'], ['week', '7 jours'], ['month', 'Ce mois'], ['all', 'Tout']].concat(kind === 'sales' ? [['credit', 'Crédits']] : []);
    return `
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
    const m = today().slice(0, 7);
    const row = (act, v, ico, title, sub) => `<button class="row" data-act="${act}" data-v="${v}">
      <div class="ico">${ico}</div><div class="mid"><div class="title">${title}</div><div class="sub">${esc(sub)}</div></div><div class="chev">›</div></button>`;
    return `<div class="list">
      ${row('go', 'stock', I.box, 'Articles & stock', db.products.length ? `${db.products.length} article${db.products.length > 1 ? 's' : ''}${low ? ` · ${low} à réapprovisionner` : ''}` : 'Vos produits, services et quantités')}
      ${row('go', 'report', I.chart, 'Rapport du mois', `${fmt(sum(db.sales.filter((x) => x.date.slice(0, 7) === m)))} de ventes ce mois`)}
      ${row('go', 'card', I.idcard, 'Carte de visite', 'Avec code QR de contact')}
      ${row('settings', '', I.gear, 'Paramètres', 'Entreprise, logo, devise, sauvegarde')}
    </div>`;
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
      <div class="mid"><div class="title">${esc(p.name)}${stockBadge(p)}</div><div class="sub">${esc(fmt(p.price))}</div></div>
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
        <label class="field" style="margin-top:12px"><span>Prix de vente</span><input id="p-price" type="number" inputmode="decimal" min="0" step="any" value="${p ? p.price : ''}"></label>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Quantité en stock</span><input id="p-qty" type="number" inputmode="decimal" step="any" placeholder="Vide = non suivi" value="${p && tracked(p) ? p.qty : ''}"></label>
          <label class="field"><span>Alerte si stock ≤</span><input id="p-min" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${p && p.min ? p.min : ''}"></label>
        </div>
        <p class="muted small" style="margin-top:10px">Le stock baisse à chaque vente et remonte à chaque achat de cet article. Laissez la quantité vide pour un service.</p>
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
      rec.qty = $('#p-qty').value === '' ? null : num($('#p-qty').value);
      rec.min = num($('#p-min').value);
      if (!p) db.products.push(rec);
      save(); closeSheet(); render(); toast(p ? 'Article mis à jour ✅' : 'Article ajouté 📦');
    });
    if (!p) setTimeout(() => { const el = $('#p-name'); if (el) el.focus(); }, 300);
  }

  // ---------------------------------------------------------------- Rapport mensuel
  const inMonth = (list, m) => list.filter((r) => r.date.slice(0, 7) === m);
  function groupBy(pairs) {
    const map = new Map();
    pairs.forEach(([k, v, q]) => { const g = map.get(k) || { v: 0, q: 0 }; g.v += v; g.q += q || 0; map.set(k, g); });
    return Array.from(map, ([k, g]) => ({ k, v: round(g.v), q: g.q })).sort((a, b) => b.v - a.v);
  }
  const barRows = (rows, sub) => {
    const max = Math.max(1, ...rows.map((r) => r.v));
    return `<div class="card bars">${rows.map((r) => `<div class="bar-row"><div class="top"><span>${esc(r.k)}${sub ? ` <small>${esc(sub(r))}</small>` : ''}</span><b>${esc(fmtN(r.v))}</b></div><div class="track"><i style="width:${Math.max(2, Math.round((r.v / max) * 100))}%"></i></div></div>`).join('')}</div>`;
  };
  function viewReport() {
    const m = ui.month;
    const sales = inMonth(db.sales, m), purchases = inMonth(db.purchases, m);
    const tS = sum(sales), tP = sum(purchases), bal = round(tS - tP);
    const label = toDate(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const nav = `${back}<div class="month-nav"><button data-act="month" data-v="-1" aria-label="Mois précédent">‹</button><b>${esc(label)}</b><button data-act="month" data-v="1" aria-label="Mois suivant" ${m >= today().slice(0, 7) ? 'disabled' : ''}>›</button></div>`;
    if (!sales.length && !purchases.length) {
      return nav + `<div class="empty"><div class="big">${I.chart}</div><b>Rien ce mois-ci</b>Les ventes et achats de ce mois apparaîtront ici.</div>`;
    }
    const [y, mo] = m.split('-').map(Number);
    const nDays = new Date(y, mo, 0).getDate();
    const days = Array.from({ length: nDays }, (_, i) => { const d = `${m}-${pad(i + 1)}`; return { d, n: i + 1, v: sum(sales.filter((x) => x.date === d)) }; });
    const max = Math.max(1, ...days.map((x) => x.v));
    const best = days.reduce((a, b) => (b.v > a.v ? b : a));
    const items = groupBy([].concat(...sales.map((x) => x.items.map((it) => [it.name, it.qty * it.price, it.qty])))).slice(0, 5);
    const pays = groupBy(sales.map((x) => [`${PAY[x.pay][0]} ${PAY[x.pay][1]}`, total(x)]));
    const cats = groupBy(purchases.map((x) => [x.cat || 'Autre', total(x)]));
    return `${nav}
      <div class="stats">
        <div class="stat"><div class="ico">${I.coin}</div><div class="val">${esc(fmtN(tS))}</div><div class="lbl">Ventes</div></div>
        <div class="stat"><div class="ico">${I.cart}</div><div class="val">${esc(fmtN(tP))}</div><div class="lbl">Achats</div></div>
        <div class="stat"><div class="ico">${bal >= 0 ? I.up : I.down}</div><div class="val ${bal >= 0 ? 'pos' : 'neg'}">${bal > 0 ? '+' : ''}${esc(fmtN(bal))}</div><div class="lbl">Bénéfice estimé</div></div>
      </div>
      <div class="card">
        <div class="kv"><span>Nombre de ventes</span><span>${sales.length}</span></div>
        <div class="kv"><span>Vente moyenne</span><span>${esc(fmt(sales.length ? round(tS / sales.length) : 0))}</span></div>
        ${best.v ? `<div class="kv"><span>Meilleur jour 🏆</span><span>${esc(niceDate(best.d))} · ${esc(fmt(best.v))}</span></div>` : ''}
      </div>
      <div class="section-title">Ventes par jour <small>${esc(S().currency)}</small></div>
      <div class="card"><div class="week month">${days.map((x) => `<div class="col ${x.d === today() ? 'today' : ''}" title="${x.n} : ${esc(fmt(x.v))}"><i style="height:${Math.round((x.v / max) * 100)}%"></i>${x.n === 1 || x.n % 5 === 0 ? x.n : '&nbsp;'}</div>`).join('')}</div></div>
      ${items.length ? `<div class="section-title">Meilleures ventes</div>${barRows(items, (r) => `× ${fmtQ(r.q)}`)}` : ''}
      ${pays.length ? `<div class="section-title">Paiements</div>${barRows(pays)}` : ''}
      ${cats.length ? `<div class="section-title">Achats par catégorie</div>${barRows(cats)}` : ''}
      <button class="btn ghost" data-act="csv">${I.download} Exporter le mois (Excel / CSV)</button>`;
  }
  function exportCsv() {
    const m = ui.month;
    const cell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const n = (v) => String(v).replace('.', ',');
    const rows = [['Date', 'Type', 'Référence', 'Client / Fournisseur', 'Article', 'Quantité', 'Prix unitaire', 'Total', 'Paiement / Catégorie']];
    [['sales', 'Vente'], ['purchases', 'Achat']].forEach(([kind, label]) => inMonth(db[kind], m)
      .sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at)
      .forEach((r) => r.items.forEach((it) => rows.push([fullDate(r.date), label, ref(kind, r), r.who, it.name, n(it.qty), n(it.price), n(round(it.qty * it.price)), kind === 'sales' ? PAY[r.pay][1] : r.cat]))));
    const csv = '\ufeff' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `gestio-${m}.csv`);
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
  function openForm(kind, id) {
    const k = KIND[kind];
    const rec = id ? db[kind].find((r) => r.id === id) : null;
    const items = knownItems(kind);
    formCtx = { kind, id, items };
    let extra = '';
    if (kind === 'sales') {
      extra = `<div class="field"><span>Paiement</span>${chipGroup('pay', Object.entries(PAY).map(([v, p]) => [v, `${p[0]} ${p[1]}`]), rec ? rec.pay : 'cash')}</div>`;
    } else if (kind === 'purchases') {
      extra = `<div class="field"><span>Catégorie</span>${chipGroup('cat', bizType().cats.map((c) => [c, c]), rec ? rec.cat : bizType().cats[0])}</div>`;
    } else {
      extra = `<div class="grid2">
          <label class="field"><span>Livraison prévue</span><input id="f-due" type="date" value="${rec ? rec.due || '' : addDays(today(), 1)}"></label>
          <label class="field"><span>Acompte reçu</span><input id="f-deposit" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${rec && rec.deposit ? rec.deposit : ''}"></label>
        </div>
        <label class="field"><span>Téléphone du client</span><input id="f-phone" type="tel" placeholder="Facultatif" value="${esc(rec ? rec.phone : '')}"></label>`;
    }
    openSheet(`
      ${head(`${rec ? 'Modifier' : 'Nouvelle'} ${k.one}`.replace('Nouvelle achat', 'Nouvel achat'))}
      <form id="entry-form" novalidate>
        <label class="field"><span>${k.who}</span><input id="f-who" list="dl-people" placeholder="Facultatif" value="${esc(rec ? rec.who : '')}" autocomplete="off"></label>
        ${kind !== 'purchases' && db.products.length ? `<div class="chips" id="quick-items" style="margin-top:12px">${db.products.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map((p) =>
          `<button type="button" class="chip" data-act="quick-item" data-id="${p.id}">${I.plus} ${esc(p.name)}</button>`).join('')}</div>` : ''}
        <div style="margin-top:12px">
          <div class="line-head"><span>Article</span><span>Qté</span><span>Prix unit.</span><span></span></div>
          <div class="lines" id="lines" style="margin-top:5px">${(rec ? rec.items : [null]).map(lineHtml).join('')}</div>
          <button type="button" class="btn ghost sm" data-act="line-add" style="margin-top:8px">+ Ajouter une ligne</button>
        </div>
        <div class="total-box" style="margin-top:12px"><span>Total</span><b id="f-total">${esc(fmt(rec ? total(rec) : 0))}</b></div>
        <div style="margin-top:12px">${extra}</div>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Date</span><input id="f-date" type="date" value="${rec ? rec.date : today()}"></label>
          <label class="field"><span>Note</span><input id="f-note" placeholder="Facultatif" value="${esc(rec ? rec.note : '')}"></label>
        </div>
        <button class="btn" style="margin-top:16px">${rec ? 'Enregistrer' : `Enregistrer la ${k.one}`.replace("la achat", "l’achat")}</button>
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
      $('#f-total').textContent = fmt(total({ items: readLines() }));
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(); });
    if (!rec && !$('#quick-items')) setTimeout(() => { const el = $('#lines .l-name'); if (el) el.focus(); }, 300);
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
    if (!items.length || total({ items }) <= 0) { toast('Ajoutez au moins un article avec un prix 🙂'); return; }
    const before = sum(db.sales.filter((s) => s.date === today()));
    const rec = id ? db[kind].find((r) => r.id === id) : { id: uid(), n: ++db.seq[k.seq], at: Date.now() };
    if (id) moveStock(kind, rec.items, -1);
    rec.who = $('#f-who').value.trim();
    rec.items = items;
    moveStock(kind, items, 1);
    rec.date = $('#f-date').value || today();
    rec.note = $('#f-note').value.trim();
    if (kind === 'sales') rec.pay = picked('pay') || 'cash';
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
      toast(kind === 'purchases' ? 'Achat enregistré ✅' : 'Commande enregistrée 📋');
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
      info = `<div class="kv"><span>Paiement</span><span>${PAY[r.pay][0]} ${PAY[r.pay][1]}</span></div>
              <div class="kv"><span>Code de contrôle</span><span>${controlCode(r)}</span></div>`;
      actions = `<button class="btn" data-act="receipt" ${d}>${I.receipt} Reçu avec code QR</button>
        ${r.pay === 'credit' ? `<button class="btn ghost" data-act="paid" ${d}>${I.check} Marquer comme payé</button>` : ''}`;
    } else if (kind === 'purchases') {
      info = `<div class="kv"><span>Catégorie</span><span>${esc(r.cat || '—')}</span></div>`;
    } else {
      const rest = round(total(r) - (r.deposit || 0));
      info = `${r.phone ? `<div class="kv"><span>Téléphone</span><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></div>` : ''}
        <div class="kv"><span>Livraison prévue</span><span>${r.due ? esc(niceDate(r.due)) : '—'}</span></div>
        <div class="kv"><span>Acompte</span><span>${esc(fmt(r.deposit || 0))}</span></div>
        <div class="kv"><span>Reste à payer</span><b>${esc(fmt(rest))}</b></div>`;
      actions = `<div class="steps">${Object.entries(STATUS).map(([v, s]) => `<button class="${r.status === v ? 'on' : ''}" data-act="status" data-v="${v}" ${d}>${s[0]}<br>${s[1]}</button>`).join('')}</div>
        ${r.saleId ? '<p class="muted small" style="text-align:center">💰 Déjà transformée en vente</p>' : `<button class="btn" data-act="to-sale" ${d}>${I.coin} Transformer en vente</button>`}
        <button class="btn ghost" data-act="receipt" ${d}>${I.receipt} Bon de commande avec QR</button>`;
    }
    openSheet(`
      ${head(`${k.ico} ${ref(kind, r)}`)}
      <div class="card" style="box-shadow:none;background:var(--bg)">
        <div class="kv"><span>${k.who}</span><span>${esc(r.who || '—')}</span></div>
        <div class="kv"><span>Date</span><span>${esc(niceDate(r.date))}</span></div>
        ${info}
        ${r.note ? `<div class="kv"><span>Note</span><span>${esc(r.note)}</span></div>` : ''}
      </div>
      <div>${r.items.map((it) => `<div class="kv"><span style="color:var(--text)">${esc(it.name)} <small class="muted">${fmtN(it.qty).replace(/,0+$/, '')} × ${esc(fmtN(it.price))}</small></span><span>${esc(fmtN(round(it.qty * it.price)))}</span></div>`).join('')}</div>
      <div class="total-box"><span>Total</span><b>${esc(fmt(total(r)))}</b></div>
      ${actions}
      <div class="btn-row">
        <button class="btn plain" data-act="edit" ${d}>${I.edit} Modifier</button>
        <button class="btn danger" data-act="delete" ${d}>${I.trash} Supprimer</button>
      </div>`);
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
    if (kind === 'sales') lines.push(`Paiement : ${r.pay === 'credit' ? 'NON PAYÉ (crédit)' : PAY[r.pay][1]}`);
    else lines.push(`Acompte : ${fmt(r.deposit || 0)}`, `Reste : ${fmt(round(total(r) - (r.deposit || 0)))}`);
    lines.push(`Code : ${controlCode(r)}`);
    if (S().phone) lines.push(`Tél : ${S().phone}`);
    return lines.join('\n');
  }
  const docRef = (kind, r) => (kind === 'sales' ? 'R' : 'C') + '-' + String(r.n).padStart(4, '0');

  function drawReceipt(kind, r) {
    const W = 600, P = 40, INK = '#171a2b', GREY = '#6d7286';
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

    center(kind === 'orders' ? 'BON DE COMMANDE' : 'REÇU DE PAIEMENT', 25, 800, S().color || COLORS[0], 38);
    pair('N° ' + docRef(kind, r), fullDate(r.date), 22, 600); y += 32;
    if (r.who) { pair('Client', r.who, 22, 400, GREY); y += 32; }
    y -= 4; dash();

    r.items.forEach((it) => {
      pair(it.name, fmtN(round(it.qty * it.price)), 24, 600); y += 28;
      font(ctx, 20, 400); ctx.fillStyle = GREY; ctx.textAlign = 'left';
      ctx.fillText(`${fmtN(it.qty).replace(/,0+$/, '')} × ${fmtN(it.price)}`, P, y); y += 38;
    });
    y -= 8; dash();

    pair('TOTAL', fmt(total(r)), 34, 800); y += 44;
    if (kind === 'sales') {
      pair('Paiement', r.pay === 'credit' ? 'NON PAYÉ (crédit)' : PAY[r.pay][1], 22, 400, r.pay === 'credit' ? '#e5484d' : GREY); y += 30;
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

  let receiptCanvas = null;
  function openReceipt(kind, id) {
    const r = db[kind].find((x) => x.id === id);
    if (!r) return;
    receiptCanvas = drawReceipt(kind, r);
    receiptCanvas.dataset.name = `${kind === 'orders' ? 'commande' : 'recu'}-${docRef(kind, r)}.png`;
    openSheet(`
      ${head(kind === 'orders' ? 'Bon de commande' : 'Reçu')}
      <img class="preview ticket" alt="Aperçu du reçu" src="${receiptCanvas.toDataURL('image/png')}">
      <p class="muted small" style="text-align:center">Le code QR contient le résumé du reçu. Votre client peut le scanner pour le vérifier.</p>
      <div class="btn-row">
        <button class="btn" data-act="receipt-share">${I.share} Partager</button>
        <button class="btn ghost" data-act="receipt-dl">${I.download} Télécharger</button>
      </div>
      <button class="btn plain" data-act="detail" data-kind="${kind}" data-id="${id}">← Retour</button>`);
  }

  // ---------------------------------------------------------------- Carte de visite
  const CARD_TPL = [['modern', 'Moderne'], ['gradient', 'Dégradé'], ['minimal', 'Minimal']];
  function cardData() {
    const c = db.card || {};
    return {
      tpl: c.tpl || 'modern',
      color: c.color || S().color || COLORS[0],
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
      <div class="swatches">${COLORS.map((col) => `<button style="background:${col}" class="${c.color === col ? 'on' : ''}" data-act="card-color" data-v="${col}" aria-label="Couleur ${col}"></button>`).join('')}</div>
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
      <label class="field"><span>Nom de l’entreprise</span><input id="s-name" value="${esc(s.name)}"></label>
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
      <label class="field"><span>Téléphone</span><input id="s-phone" type="tel" value="${esc(s.phone)}"></label>
      <label class="field"><span>Adresse</span><input id="s-address" value="${esc(s.address)}"></label>
      <label class="field"><span>Message en bas des reçus</span><input id="s-footer" placeholder="Merci pour votre confiance !" value="${esc(s.footer)}"></label>
      <div class="field"><span>Couleur</span><div class="swatches" data-group="color">${COLORS.map((c) => `<button type="button" style="background:${c}" class="${(s.color || COLORS[0]) === c ? 'on' : ''}" data-act="pick" data-v="${c}" aria-label="Couleur ${c}"></button>`).join('')}</div></div>
      <button class="btn" data-act="settings-save">Enregistrer</button>
      <div class="section-title">Sauvegarde</div>
      <p class="muted small">Vos données restent sur ce téléphone. Exportez-les régulièrement pour ne rien perdre.</p>
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

  const onb = { step: 0, data: { name: '', type: 'shop', currency: 'FCFA', goal: 0 } };
  function openOnboarding() {
    const dots = `<div class="dots">${[0, 1, 2].map((i) => `<i class="${i === onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
    const d = onb.data;
    let body;
    if (onb.step === 0) {
      body = `<div class="art">${ART}</div><h1 class="wordmark">Gestio</h1>
        <p>Ventes, achats, commandes, reçus et cartes de visite : toute votre activité dans la poche.</p>
        ${dots}<button class="btn" data-act="onb-next">C’est parti</button>`;
    } else if (onb.step === 1) {
      body = `<div class="big">🏪</div><h2>Votre entreprise</h2><p>Dites-nous en un peu plus.</p>
        <div class="left view" style="padding:0;margin-top:14px">
          <label class="field"><span>Nom de l’entreprise</span><input id="s-name" placeholder="Ex. Chez Awa" value="${esc(d.name)}"></label>
          <div class="field"><span>Type d’activité</span>${typePicker(d.type)}</div>
        </div>
        ${dots}<button class="btn" data-act="onb-next">Continuer</button>`;
    } else {
      body = `<div class="big">🎯</div><h2>Dernière étape</h2><p>Un objectif quotidien rend les ventes plus motivantes !</p>
        <div class="left view" style="padding:0;margin-top:14px">
          <label class="field"><span>Devise</span>${currencySelect(d.currency)}</label>
          <label class="field"><span>Objectif de ventes par jour (facultatif)</span><input id="s-goal" type="number" inputmode="decimal" min="0" step="any" placeholder="Ex. 50000" value="${d.goal || ''}"></label>
        </div>
        ${dots}<button class="btn" data-act="onb-next">Terminer ✨</button>`;
    }
    openSheet(`<div class="onb">${body}</div>`, { locked: true, cls: onb.step === 0 ? 'full sun' : 'full' });
  }

  function onbNext() {
    const d = onb.data;
    if (onb.step === 1) {
      d.name = $('#s-name').value.trim();
      d.type = picked('type') || 'other';
      if (!d.name) { toast('Donnez un nom à votre entreprise 🙂'); return; }
    }
    if (onb.step === 2) {
      d.currency = $('#s-currency').value;
      d.goal = num($('#s-goal').value);
      db.settings = { name: d.name, type: d.type, currency: d.currency, goal: d.goal, color: COLORS[0], phone: '', address: '', footer: '' };
      save(); closeSheet(); render(); confetti(120);
      toast(`Bienvenue, ${d.name} ! 🎉`);
      return;
    }
    onb.step++;
    openOnboarding();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `gestio-sauvegarde-${today()}.json`);
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
    credits: () => { ui.tab = 'sales'; ui.filter.sales = 'credit'; render(); },
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
    month: (d) => {
      const [y, mo] = ui.month.split('-').map(Number);
      const dt = new Date(y, mo - 1 + Number(d.v), 1);
      ui.month = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`;
      render();
    },
    csv: exportCsv,
    'logo-pick': () => $('#logo-file').click(),
    'logo-clear': () => { draftLogo = ''; showDraftLogo(); },
    pick: (d, el) => { $$('.on', el.parentNode).forEach((x) => x.classList.remove('on')); el.classList.add('on'); },
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
    paid: (d) => {
      const r = db.sales.find((x) => x.id === d.id);
      r.pay = 'cash'; save(); render(); openDetail('sales', d.id); confetti(40); toast('Paiement encaissé 💵');
    },
    status: (d) => {
      const o = db.orders.find((x) => x.id === d.id);
      o.status = d.v; save(); render(); openDetail('orders', d.id);
      if (d.v === 'done') { confetti(40); toast('Commande livrée 📦'); }
    },
    'to-sale': (d) => {
      const o = db.orders.find((x) => x.id === d.id);
      const sale = { id: uid(), n: ++db.seq.sale, at: Date.now(), who: o.who, items: o.items.map((it) => Object.assign({}, it)), date: today(), note: `Commande ${ref('orders', o)}`, pay: 'cash' };
      db.sales.push(sale);
      moveStock('sales', sale.items, 1);
      o.saleId = sale.id; o.status = 'done';
      save(); render(); confetti(60); toast('Commande transformée en vente 💰');
      openDetail('sales', sale.id);
    },
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
        phone: $('#s-phone').value.trim(), address: $('#s-address').value.trim(),
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
        <button data-act="new" data-kind="sales"><span>${I.coin}</span>Vente</button>
        <button data-act="new" data-kind="purchases"><span>${I.cart}</span>Achat</button>
        <button data-act="new" data-kind="orders"><span>${I.clip}</span>Commande</button>
      </div>`),
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && actions[el.dataset.act]) { actions[el.dataset.act](el.dataset, el); return; }
    const tab = e.target.closest('#tabbar button');
    if (tab) { ui.tab = tab.dataset.tab; render(); window.scrollTo(0, 0); return; }
    if (e.target.id === 'sheet-backdrop' && !sheetLocked) closeSheet();
  });
  $('#fab').addEventListener('click', () => (ui.tab === 'home' ? actions['fab-menu']() : ui.tab === 'stock' ? openProduct() : openForm(ui.tab)));
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
