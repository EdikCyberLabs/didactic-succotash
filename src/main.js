import { CATEGORIES, balanceOf, budgetStatus, dailySpending, formatEUR, isExpense, monthSummary, spendingByCategory } from './core/analytics.js';
import { addDays, addMonths, endOfMonth, formatDay, formatMonth, startOfMonth, toISO } from './core/dates.js';
import { computeProgress } from './core/gamification.js';
import { DemoProvider } from './core/providers.js';
import { clearState, loadState, saveState } from './core/store.js';

const today = toISO(new Date());
const provider = new DemoProvider({ today });
const app = document.getElementById('app');

let state = loadState();
const ui = { view: 'accueil', period: 'mois', category: 'toutes', search: '', modal: null, institutions: [] };

// L'ouverture quotidienne de l'app alimente la série (streak).
if (!state.visits.includes(today)) {
  state.visits = [...state.visits, today].slice(-365);
  saveState(state);
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cat = (id) => CATEGORIES[id] || CATEGORIES.autre;
const pct = (r) => `${Math.round(Math.min(1, Math.max(0, r)) * 100)}%`;

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3800);
}

function periodRange() {
  if (ui.period === 'mois-dernier') {
    const m = addMonths(today, -1);
    return { from: startOfMonth(m), to: endOfMonth(m), label: formatMonth(m) };
  }
  if (ui.period === '30j') return { from: addDays(today, -29), to: today, label: '30 derniers jours' };
  return { from: startOfMonth(today), to: today, label: formatMonth(today) };
}

// Progression + détection des montées de niveau / nouveaux badges.
function progress() {
  const p = computeProgress({ ...state, today });
  const unlocked = p.badges.filter((b) => b.unlocked).map((b) => b.id);
  const seen = state.seenBadges || [];
  const fresh = p.badges.filter((b) => b.unlocked && !seen.includes(b.id));
  const firstRun = state.lastLevel === undefined;
  if (!firstRun) {
    if (p.level > state.lastLevel) toast(`⬆️ Niveau ${p.level} atteint ! « ${p.title} »`);
    fresh.forEach((b) => toast(`${b.icon} Badge débloqué : ${b.title}`));
  }
  if (firstRun || fresh.length || p.level !== state.lastLevel) {
    state.lastLevel = p.level;
    state.seenBadges = unlocked;
    saveState(state);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------

function donut(rows) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  if (!total) return '<p class="muted">Aucune dépense sur la période 🎉</p>';
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = rows.map((row) => {
    const len = (row.total / total) * c;
    const arc = `<circle r="${r}" cx="80" cy="80" fill="none" stroke="${cat(row.category).color}" stroke-width="22"
      stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"><title>${esc(cat(row.category).label)} : ${formatEUR(row.total)}</title></circle>`;
    offset += len;
    return arc;
  }).join('');
  const legend = rows.map((row) => `
    <li><span class="dot" style="background:${cat(row.category).color}"></span>
      <span>${cat(row.category).icon} ${esc(cat(row.category).label)}</span>
      <strong>${formatEUR(row.total)}</strong></li>`).join('');
  return `<div class="donut-wrap">
    <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Répartition des dépenses">
      ${arcs}
      <text x="80" y="76" text-anchor="middle" fill="var(--muted)" font-size="11">Total</text>
      <text x="80" y="95" text-anchor="middle" fill="var(--text)" font-size="16" font-weight="800">${esc(formatEUR(total))}</text>
    </svg>
    <ul class="legend">${legend}</ul>
  </div>`;
}

function bars(days) {
  const max = Math.max(1, ...days.map((d) => d.total));
  return `<div class="bars" role="img" aria-label="Dépenses par jour">${days.map((d) =>
    `<span class="${d.total === 0 ? 'zero' : ''}" style="height:${d.total === 0 ? 4 : Math.max(3, (d.total / max) * 100)}%" title="${formatDay(d.date)} : ${formatEUR(d.total)}"></span>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin:6px 0 0">Les barres vertes = jours sans dépense (+10 XP chacun)</p>`;
}

function txRow(tx) {
  const account = state.accounts.find((a) => a.id === tx.accountId);
  return `<div class="tx">
    <div class="ico">${cat(tx.category).icon}</div>
    <div style="min-width:0"><div class="lbl">${esc(tx.label)}</div>
      <div class="meta">${formatDay(tx.date)} · ${esc(cat(tx.category).label)}${account ? ` · ${esc(account.institutionName)}` : ''}</div></div>
    <div class="amt ${tx.amount > 0 ? 'pos' : ''}">${tx.amount > 0 ? '+' : ''}${formatEUR(tx.amount)}</div>
  </div>`;
}

function questCard(q) {
  const statusLabel = { 'reussie': 'Réussie', 'echouee': 'Échouée', 'en-cours': 'En cours' }[q.status];
  const valueText = q.kind === 'limit'
    ? `${formatEUR(q.value)} / ${formatEUR(q.targetValue)}`
    : `${q.value} / ${q.targetValue} jours`;
  return `<div class="quest">
    <div class="ico">${q.icon}</div>
    <div>
      <div class="row between wrap"><h3>${esc(q.title)}</h3><span class="chip ${q.status}">${statusLabel}</span></div>
      <div class="muted" style="font-size:13px">${esc(q.description)}</div>
      <div class="progress ${q.status}" style="margin:8px 0 4px"><span style="width:${pct(q.progress)}"></span></div>
      <div class="row between" style="font-size:12px"><span class="muted">${valueText}</span><span class="chip xp">+${q.reward} XP</span></div>
    </div>
  </div>`;
}

function header(p) {
  return `<header class="player">
    <div class="avatar" aria-label="Niveau ${p.level}"><div><small>Niv.</small>${p.level}</div></div>
    <div>
      <h1>${esc(p.title)}</h1>
      <div class="xpbar"><span style="width:${pct(p.progress)}"></span></div>
      <div class="xptext">${p.xpIntoLevel} / ${p.xpForNext} XP · ${p.xp} XP au total</div>
    </div>
    <div class="streak" title="Jours consécutifs de suivi">🔥 ${p.streak}<small>série</small></div>
  </header>`;
}

function emptyState() {
  return `<section class="card hero">
    <div class="big">🏦✨</div>
    <h2>Connecte ta première banque</h2>
    <p class="muted">PixelBudget lit tes soldes et tes transactions en <strong>lecture seule</strong>.
      Aucun argent ne transite par l'application, aucun paiement n'est possible.</p>
    <button class="btn" data-action="open-connect">Connecter un compte · +100 XP</button>
  </section>`;
}

// ---------------------------------------------------------------------------
// Vues
// ---------------------------------------------------------------------------

function viewAccueil(p) {
  if (!state.accounts.length) return emptyState();
  const month = monthSummary(state.transactions, today);
  const top = spendingByCategory(state.transactions, startOfMonth(today), today);
  const latest = state.transactions.slice(0, 6);
  const alerts = budgetStatus(state.transactions, state.budgets, startOfMonth(today), today).filter((b) => b.status !== 'ok');
  return `
    <div class="grid three">
      <div class="card stat"><div class="label">Solde total (${state.accounts.length} comptes)</div><div class="value">${formatEUR(balanceOf(state.accounts))}</div></div>
      <div class="card stat"><div class="label">Dépenses · ${formatMonth(today)}</div><div class="value ${month.expenses > 0 ? 'neg' : ''}">${formatEUR(month.expenses)}</div></div>
      <div class="card stat"><div class="label">Revenus − dépenses</div><div class="value ${month.net >= 0 ? 'pos' : 'neg'}">${month.net >= 0 ? '+' : ''}${formatEUR(month.net)}</div></div>
    </div>
    ${alerts.length ? `<div class="card" style="margin-top:14px;border-color:var(--warn)">
      <h2>⚠️ Alertes budget</h2>
      ${alerts.map((a) => `<div class="row between"><span>${cat(a.category).icon} ${esc(cat(a.category).label)}</span>
        <span class="${a.status === 'depasse' ? 'neg' : ''}">${formatEUR(a.spent)} / ${formatEUR(a.limit)}</span></div>`).join('')}
    </div>` : ''}
    <div class="grid two">
      <section class="card"><h2>Où part ton argent ce mois-ci</h2>${donut(top.slice(0, 6))}</section>
      <section class="card"><div class="row between"><h2>Quêtes de la semaine</h2><button class="btn ghost small" data-view="quetes">Tout voir</button></div>
        <div class="grid" style="margin-top:0">${p.quests.slice(0, 2).map(questCard).join('')}</div></section>
    </div>
    <section class="card" style="margin-top:14px">
      <div class="row between"><h2>Dernières opérations</h2><button class="btn ghost small" data-view="depenses">Tout voir</button></div>
      ${latest.map(txRow).join('')}
    </section>`;
}

function viewDepenses() {
  if (!state.accounts.length) return emptyState();
  const { from, to, label } = periodRange();
  const rows = spendingByCategory(state.transactions, from, to);
  const q = ui.search.trim().toUpperCase();
  const list = state.transactions.filter((tx) => tx.date >= from && tx.date <= to
    && (ui.category === 'toutes' || tx.category === ui.category)
    && (!q || tx.label.toUpperCase().includes(q)));
  const spent = list.filter(isExpense).reduce((s, tx) => s - tx.amount, 0);
  return `
    <div class="card" style="margin-top:14px">
      <div class="row wrap">
        <select data-input="period" aria-label="Période">
          <option value="mois" ${ui.period === 'mois' ? 'selected' : ''}>Ce mois-ci</option>
          <option value="mois-dernier" ${ui.period === 'mois-dernier' ? 'selected' : ''}>Mois dernier</option>
          <option value="30j" ${ui.period === '30j' ? 'selected' : ''}>30 derniers jours</option>
        </select>
        <select data-input="category" aria-label="Catégorie">
          <option value="toutes">Toutes catégories</option>
          ${Object.entries(CATEGORIES).map(([id, c]) => `<option value="${id}" ${ui.category === id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
        </select>
        <input type="search" placeholder="Rechercher un libellé…" value="${esc(ui.search)}" data-input="search" style="flex:1;min-width:140px" />
      </div>
    </div>
    <div class="grid two">
      <section class="card"><h2>Répartition · ${esc(label)}</h2>${donut(rows)}</section>
      <section class="card"><h2>Jour par jour</h2>${bars(dailySpending(state.transactions, from, to))}</section>
    </div>
    <section class="card" style="margin-top:14px">
      <div class="row between"><h2>${list.length} opérations</h2><strong class="neg">${formatEUR(spent)} dépensés</strong></div>
      ${list.map(txRow).join('') || '<p class="muted">Aucune opération.</p>'}
    </section>`;
}

function viewBudgets() {
  const statuses = Object.fromEntries(budgetStatus(state.transactions, state.budgets, startOfMonth(today), today).map((s) => [s.category, s]));
  const spendingCats = Object.keys(CATEGORIES).filter((c) => !['revenus', 'transferts'].includes(c));
  const budgets = spendingCats.map((id) => {
    const s = statuses[id];
    return `<div class="budget">
      <div class="row between"><span>${cat(id).icon} ${esc(cat(id).label)}</span>
        <label class="row" style="gap:6px"><span class="muted" style="font-size:12px">Plafond/mois</span>
          <input type="number" min="0" step="10" inputmode="numeric" value="${state.budgets[id] || ''}" placeholder="—" data-budget="${id}" aria-label="Budget ${esc(cat(id).label)}" /></label></div>
      ${s ? `<div class="progress ${s.status}"><span style="width:${pct(s.ratio)}"></span></div>
        <div class="muted" style="font-size:12px">${formatEUR(s.spent)} dépensés sur ${formatEUR(s.limit)} · ${s.status === 'depasse' ? 'dépassé 😬' : `reste ${formatEUR(s.limit - s.spent)}`}</div>` : ''}
    </div>`;
  }).join('');

  const goals = state.goals.map((g) => `<div class="budget">
    <div class="row between"><strong>${g.saved >= g.target ? '🏆' : '🌱'} ${esc(g.name)}</strong>
      <span>${formatEUR(g.saved)} / ${formatEUR(g.target)}</span></div>
    <div class="progress ${g.saved >= g.target ? 'reussie' : 'en-cours'}"><span style="width:${pct(g.saved / g.target)}"></span></div>
    <div class="row wrap">
      <button class="btn ghost small" data-action="goal-add" data-id="${g.id}" data-amount="10">+10 €</button>
      <button class="btn ghost small" data-action="goal-add" data-id="${g.id}" data-amount="50">+50 €</button>
      <button class="btn ghost small" data-action="goal-add" data-id="${g.id}" data-amount="-10">−10 €</button>
      <button class="btn danger small" data-action="goal-delete" data-id="${g.id}">Supprimer</button>
    </div>
  </div>`).join('');

  return `
    <div class="grid two">
      <section class="card"><h2>Budgets mensuels · ${formatMonth(today)}</h2>
        <p class="notice">Respecter tous tes budgets sur un mois complet rapporte <strong>+150 XP</strong> et le badge 🎯.</p>
        ${budgets}</section>
      <section class="card"><h2>Objectifs d'épargne</h2>
        <p class="notice">Note ici ce que tu mets de côté (sur ton livret, par exemple). +1 XP tous les 10 € épargnés.
          L'app ne déplace jamais d'argent : c'est toi qui fais les virements depuis ta banque.</p>
        ${goals || '<p class="muted">Aucun objectif pour l\'instant.</p>'}
        <form class="row wrap" data-form="goal" style="margin-top:10px">
          <input name="name" placeholder="Ex. Vacances d'été" required maxlength="40" style="flex:1;min-width:140px" aria-label="Nom de l'objectif" />
          <input name="target" type="number" min="1" step="1" placeholder="Montant €" required style="width:110px" aria-label="Montant cible" />
          <button class="btn small">Créer</button>
        </form></section>
    </div>`;
}

function viewQuetes(p) {
  return `
    <div class="grid two">
      <section class="card"><h2>Quêtes de la semaine</h2>
        <p class="notice">Nouvelles quêtes chaque lundi. Le statut devient définitif le dimanche soir.</p>
        <div class="grid" style="margin-top:10px">${p.quests.map(questCard).join('')}</div></section>
      <section class="card"><h2>D'où vient ton XP</h2>
        ${p.log.map((e) => `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(e.reason)}</span><span class="chip xp">+${e.amount} XP</span></div>`).join('') || '<p class="muted">Connecte un compte pour gagner tes premiers XP.</p>'}
        <p class="muted" style="font-size:12px">L'XP est recalculée à partir de tes vraies données : pas de triche possible 😉</p>
      </section>
    </div>
    <section class="card" style="margin-top:14px"><h2>Badges · ${p.badges.filter((b) => b.unlocked).length}/${p.badges.length}</h2>
      <div class="badges">${p.badges.map((b) => `<div class="badge ${b.unlocked ? 'unlocked' : 'locked'}">
        <div class="ico">${b.icon}</div><strong>${esc(b.title)}</strong><small>${esc(b.description)}</small></div>`).join('')}</div>
    </section>`;
}

function viewComptes() {
  const byInst = {};
  for (const a of state.accounts) (byInst[a.institutionId] ||= []).push(a);
  const blocks = Object.entries(byInst).map(([instId, accounts]) => {
    const conn = state.connections.find((c) => c.institutionId === instId);
    return `<section class="card" style="margin-top:14px">
      <div class="row between wrap"><h2>${esc(accounts[0].institutionName)}</h2>
        <div class="row"><button class="btn ghost small" data-action="sync" data-inst="${instId}">🔄 Synchroniser</button>
        <button class="btn danger small" data-action="disconnect" data-inst="${instId}">Déconnecter</button></div></div>
      ${accounts.map((a) => `<div class="account"><strong>${esc(a.name)}</strong><strong>${formatEUR(a.balance)}</strong>
        <span class="muted" style="font-size:12px">${esc(a.iban)}</span><span class="muted" style="font-size:12px">${a.type === 'epargne' ? 'Épargne' : 'Courant'}</span></div>`).join('')}
      ${conn ? `<p class="muted" style="font-size:12px;margin-bottom:0">Consentement accordé le ${formatDay(conn.connectedAt)} · à renouveler tous les 180 jours (DSP2)</p>` : ''}
    </section>`;
  }).join('');
  return `
    <section class="card" style="margin-top:14px">
      <div class="row between wrap"><h2>Mes banques</h2><button class="btn" data-action="open-connect">+ Ajouter une banque</button></div>
      <p class="notice">🔒 Accès en <strong>lecture seule</strong> (soldes et historique). PixelBudget ne détient pas tes fonds,
        ne voit jamais tes identifiants bancaires et ne peut initier aucun paiement.
        <br />Mode démo : les banques et opérations ci-dessous sont fictives.</p>
    </section>
    ${blocks}
    <section class="card" style="margin-top:14px"><h2>Données</h2>
      <button class="btn danger small" data-action="reset">Effacer toutes mes données locales</button></section>`;
}

function modal() {
  if (!ui.modal) return '';
  if (ui.modal.step === 'choose') {
    const connected = new Set(state.connections.map((c) => c.institutionId));
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
      <h3 id="mt">Choisis ta banque</h3>
      ${ui.institutions.map((i) => `<button class="inst" data-action="choose-inst" data-inst="${i.id}" ${connected.has(i.id) ? 'disabled' : ''}>
        <span style="font-size:24px">${i.logo}</span><span>${esc(i.name)}${connected.has(i.id) ? ' · déjà connectée' : ''}</span></button>`).join('')}
      <button class="btn ghost" data-action="close-modal">Annuler</button></div></div>`;
  }
  const inst = ui.institutions.find((i) => i.id === ui.modal.institutionId);
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
    <h3 id="mt">${inst.logo} Autoriser l'accès à ${esc(inst.name)}</h3>
    <p>PixelBudget demande à consulter :</p>
    <ul><li>la liste et le solde de tes comptes</li><li>l'historique de tes opérations</li></ul>
    <p class="notice">Tu seras redirigé·e vers ta banque pour t'authentifier (authentification forte).
      PixelBudget ne reçoit jamais tes identifiants et <strong>ne peut effectuer aucun paiement</strong>.
      Tu peux révoquer l'accès à tout moment. Consentement valable 180 jours.</p>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn ghost" data-action="close-modal">Refuser</button>
      <button class="btn" data-action="consent" ${ui.modal.loading ? 'disabled' : ''}>${ui.modal.loading ? 'Connexion…' : 'Autoriser'}</button>
    </div></div></div>`;
}

const NAV = [
  ['accueil', '🏠', 'Accueil'],
  ['depenses', '📊', 'Dépenses'],
  ['budgets', '🎯', 'Budgets'],
  ['quetes', '⚔️', 'Quêtes'],
  ['comptes', '🏦', 'Comptes'],
];

function render() {
  const p = progress();
  const views = { accueil: viewAccueil, depenses: viewDepenses, budgets: viewBudgets, quetes: viewQuetes, comptes: viewComptes };
  const focused = document.activeElement?.dataset?.input;
  app.innerHTML = `<div class="shell">${header(p)}${views[ui.view](p)}</div>
    <nav class="nav"><div class="nav-inner">${NAV.map(([id, i, l]) =>
      `<button data-view="${id}" ${ui.view === id ? 'aria-current="page"' : ''}><span class="i">${i}</span>${l}</button>`).join('')}</div></nav>
    ${modal()}`;
  if (focused) {
    const el = app.querySelector(`[data-input="${focused}"]`);
    if (el) { el.focus(); if (el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function syncInstitution(institutionId) {
  const connection = state.connections.find((c) => c.institutionId === institutionId);
  const accounts = await provider.fetchAccounts(connection);
  const txs = (await Promise.all(accounts.map((a) => provider.fetchTransactions(connection, a)))).flat();
  state.accounts = [...state.accounts.filter((a) => a.institutionId !== institutionId), ...accounts];
  const ids = new Set(accounts.map((a) => a.id));
  state.transactions = [...state.transactions.filter((t) => !ids.has(t.accountId)), ...txs]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  saveState(state);
}

app.addEventListener('click', async (e) => {
  const viewBtn = e.target.closest('[data-view]');
  if (viewBtn) { ui.view = viewBtn.dataset.view; render(); window.scrollTo(0, 0); return; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  // Un clic sur le fond de la modale la ferme, mais pas un clic à l'intérieur.
  if (action === 'close-modal' && el.classList.contains('modal-backdrop') && e.target !== el) return;

  switch (action) {
    case 'open-connect':
      ui.institutions = await provider.listInstitutions();
      ui.modal = { step: 'choose' };
      break;
    case 'choose-inst':
      ui.modal = { step: 'consent', institutionId: el.dataset.inst };
      break;
    case 'close-modal':
      ui.modal = null;
      break;
    case 'consent': {
      const { institutionId } = ui.modal;
      ui.modal.loading = true;
      render();
      try {
        const conn = await provider.connect(institutionId);
        state.connections.push({ ...conn, connectedAt: today });
        await syncInstitution(institutionId);
        toast('✅ Compte connecté · +100 XP');
        ui.view = 'accueil';
      } catch (err) {
        toast(`❌ ${err.message}`);
      }
      ui.modal = null;
      break;
    }
    case 'sync':
      await syncInstitution(el.dataset.inst);
      toast('🔄 Comptes synchronisés');
      break;
    case 'disconnect': {
      const inst = el.dataset.inst;
      if (!confirm('Déconnecter cette banque et supprimer ses données de l\'app ?')) return;
      const ids = new Set(state.accounts.filter((a) => a.institutionId === inst).map((a) => a.id));
      state.connections = state.connections.filter((c) => c.institutionId !== inst);
      state.accounts = state.accounts.filter((a) => !ids.has(a.id));
      state.transactions = state.transactions.filter((t) => !ids.has(t.accountId));
      saveState(state);
      break;
    }
    case 'goal-add': {
      const g = state.goals.find((x) => x.id === el.dataset.id);
      g.saved = Math.max(0, Math.round((g.saved + Number(el.dataset.amount)) * 100) / 100);
      saveState(state);
      break;
    }
    case 'goal-delete':
      state.goals = state.goals.filter((x) => x.id !== el.dataset.id);
      saveState(state);
      break;
    case 'reset':
      if (!confirm('Effacer toutes les données (comptes, budgets, objectifs, progression) ?')) return;
      clearState();
      state = loadState();
      state.visits = [today];
      saveState(state);
      break;
    default:
      return;
  }
  render();
});

app.addEventListener('input', (e) => {
  const key = e.target.dataset.input;
  if (key) { ui[key] = e.target.value; render(); }
});

app.addEventListener('change', (e) => {
  const id = e.target.dataset.budget;
  if (!id) return;
  const value = Math.max(0, Number(e.target.value) || 0);
  if (value) state.budgets[id] = value; else delete state.budgets[id];
  saveState(state);
  render();
});

app.addEventListener('submit', (e) => {
  if (e.target.dataset.form !== 'goal') return;
  e.preventDefault();
  const data = new FormData(e.target);
  const name = String(data.get('name')).trim();
  const target = Number(data.get('target'));
  if (!name || !(target > 0)) return;
  state.goals.push({ id: crypto.randomUUID?.() || String(Date.now()), name, target, saved: 0 });
  saveState(state);
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.modal) { ui.modal = null; render(); }
});

render();
