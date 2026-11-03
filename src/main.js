import { CATEGORIES, balanceOf, budgetStatus, formatEUR, isExpense, isIncome, spendingByCategory, totalSpent } from './core/analytics.js';
import { addDays, addMonths, daysBetween, endOfMonth, formatDay, formatMonth, startOfMonth, startOfWeek, toISO } from './core/dates.js';
import { computeProgress } from './core/gamification.js';
import { DemoProvider } from './core/providers.js';
import { clearState, loadState, saveState } from './core/store.js';
import { icon, mascot } from './ui/icons.js';

const today = toISO(new Date());
const provider = new DemoProvider({ today });
const app = document.getElementById('app');

let state = loadState();
const ui = { view: 'accueil', period: '30j', category: 'toutes', search: '', limit: 20, modal: null, institutions: [], animate: true };

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
const PALETTE = ['#F2B33D', '#7C86C9', '#E8735A', '#7E9F4F', '#E79BB0', '#5FB3A8'];
const INST_COLORS = { 'demo-banque-azur': '#7C86C9', 'demo-neo-pixel': '#E79BB0', 'demo-credit-vert': '#7E9F4F' };

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3800);
}

function go(view) {
  ui.view = view;
  ui.animate = true;
  render();
  window.scrollTo(0, 0);
}

const PERIODS = {
  semaine: () => ({ from: startOfWeek(today), to: today, label: 'Cette semaine' }),
  '30j': () => ({ from: addDays(today, -29), to: today, label: '30 derniers jours' }),
  mois: () => ({ from: startOfMonth(today), to: today, label: 'Ce mois-ci' }),
  'mois-dernier': () => {
    const m = addMonths(today, -1);
    return { from: startOfMonth(m), to: endOfMonth(m), label: formatMonth(m) };
  },
};

// Progression + détection des montées de niveau / nouveaux badges.
function progress() {
  const p = computeProgress({ ...state, today });
  const unlocked = p.badges.filter((b) => b.unlocked).map((b) => b.id);
  const seen = state.seenBadges || [];
  const fresh = p.badges.filter((b) => b.unlocked && !seen.includes(b.id));
  const firstRun = state.lastLevel === undefined;
  if (!firstRun) {
    if (p.level > state.lastLevel) toast(`⬆️ Niveau ${p.level} ! Pixou devient « ${p.title} »`);
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

function topbar(title, { left = '', right = '' } = {}) {
  return `<header class="topbar">${left || '<span></span>'}<h1>${esc(title)}</h1>${right || '<span></span>'}</header>`;
}
const backBtn = (to = 'accueil') => `<button class="round" data-view="${to}" aria-label="Retour">${icon('back')}</button>`;

function txRow(tx) {
  const c = cat(tx.category);
  const account = state.accounts.find((a) => a.id === tx.accountId);
  return `<div class="tx">
    <div class="ico" style="background:${c.color}">${icon(tx.category in CATEGORIES ? tx.category : 'autre', 20)}</div>
    <div style="min-width:0"><div class="lbl">${esc(tx.label.toLowerCase())}</div>
      <div class="meta">${formatDay(tx.date)} · ${esc(c.label)}${account ? ` · ${esc(account.institutionName.replace(' (démo)', ''))}` : ''}</div></div>
    <div class="amt">${tx.amount > 0 ? '+ ' : '− '}${formatEUR(Math.abs(tx.amount))}</div>
  </div>`;
}

function cardDeco(seed) {
  const plus = (x, y) => `<path d="M${x - 7} ${y}h14M${x} ${y - 7}v14" stroke="#1D1D2C" stroke-width="2.5" stroke-linecap="round"/>`;
  const c = PALETTE[seed % PALETTE.length];
  const c2 = PALETTE[(seed + 2) % PALETTE.length];
  return `<svg class="deco" viewBox="0 0 300 190" preserveAspectRatio="none" aria-hidden="true">
    <circle cx="268" cy="104" r="34" fill="${c}" opacity=".22"/>
    ${plus(236, 72)}${plus(276, 52)}${plus(214, 120)}
    <rect x="252" y="96" width="16" height="16" rx="3" fill="${c}" stroke="#1D1D2C" stroke-width="2"/>
    <rect x="204" y="86" width="10" height="10" rx="2" fill="${c2}" stroke="#1D1D2C" stroke-width="2"/>
  </svg>`;
}

function bankCards() {
  const total = `<article class="bank-card total">
      ${cardDeco(1)}
      <div class="bank"><span>Toutes mes banques</span><span>${state.accounts.length} comptes</span></div>
      <div><div class="small" style="font-weight:600;position:relative">Solde total</div><div class="bal">${formatEUR(balanceOf(state.accounts))}</div></div>
      <div class="num"><span>Lecture seule</span>${icon('lock', 18)}</div>
    </article>`;
  const cards = state.accounts.map((a, i) => `<article class="bank-card">
      ${cardDeco(i + 3)}
      <div class="bank"><span>${esc(a.institutionName.replace(' (démo)', ''))}</span><span class="muted">${a.type === 'epargne' ? 'Épargne' : 'Courant'}</span></div>
      <div><div class="small" style="font-weight:600;position:relative">${esc(a.name)}</div><div class="bal">${formatEUR(a.balance)}</div></div>
      <div class="num"><span>${esc(a.iban.slice(0, 4))} •• ${esc(a.iban.slice(-4))}</span><span class="chip" style="background:${INST_COLORS[a.institutionId] || '#F2B33D'}"></span></div>
    </article>`).join('');
  const n = state.accounts.length + 1;
  return `<div class="carousel" data-carousel><span class="spacer"></span>${total}${cards}<span class="spacer"></span></div>
    <div class="dots" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>`;
}

function playerCard(p) {
  return `<button class="player" data-view="quetes" style="width:100%;text-align:left;font:inherit">
    ${mascot(p.level, 76)}
    <div>
      <div class="row"><strong>Niveau ${p.level} · ${esc(p.title)}</strong></div>
      <div class="bar"><span style="width:${pct(p.progress)}"></span></div>
      <div class="row"><span>${p.xpIntoLevel} / ${p.xpForNext} XP</span>
        <span class="streak">${icon('flame', 16)} ${p.streak} j</span></div>
    </div>
  </button>`;
}

/** Colonnes « principales dépenses » : % du budget (proratisé) ou part des dépenses. */
function columns(from, to) {
  const rows = spendingByCategory(state.transactions, from, to).slice(0, 4);
  if (!rows.length) return '<p class="muted">Aucune dépense sur la période 🎉</p>';
  const all = spendingByCategory(state.transactions, from, to).reduce((s, r) => s + r.total, 0);
  const days = daysBetween(from, to) + 1;
  const cols = rows.map((r, i) => {
    const budget = state.budgets[r.category];
    const ratio = budget ? r.total / ((budget * days) / 30) : r.total / all;
    const value = Math.round(ratio * 100);
    const height = Math.max(26, Math.min(100, value));
    return `<div class="col" title="${esc(cat(r.category).label)} : ${formatEUR(r.total)}${budget ? ` sur un budget de ${formatEUR(budget)}/mois` : ''}">
      <span class="ico">${icon(r.category, 22)}</span>
      <div class="pillar ${value > 100 && budget ? 'over' : ''}" style="height:${height}%;background:${cat(r.category).color};animation-delay:${i * 70}ms">
        <span class="pct">${value}<sup>%</sup></span></div>
      <span class="name">${esc(cat(r.category).label)}</span>
    </div>`;
  }).join('');
  return `<div class="cols">${cols}</div>
    <p class="muted small" style="margin:10px 0 0">% du budget du mois (proratisé) quand il existe, sinon part des dépenses totales.</p>`;
}

function incomeSource(label) {
  const l = label.toUpperCase();
  if (l.includes('SALAIRE')) return 'Salaire';
  if (l.includes('REMBOURSEMENT')) return 'Remboursements';
  if (l.includes('INTERETS')) return 'Intérêts';
  return 'Autres';
}

function incomes(from, to) {
  const totals = {};
  for (const tx of state.transactions) {
    if (tx.date < from || tx.date > to || !isIncome(tx)) continue;
    const k = incomeSource(tx.label);
    totals[k] = (totals[k] || 0) + tx.amount;
  }
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const sum = rows.reduce((s, [, v]) => s + v, 0);
  if (!sum) return { html: '<p class="muted">Aucun revenu sur la période.</p>', sum: 0 };
  const colors = ['#7C86C9', '#B9BEE6', '#F2B33D', '#E8735A'];
  const parts = rows.map(([k, v], i) => {
    const w = (v / sum) * 100;
    return { k, v, w, color: colors[i % colors.length] };
  });
  const html = `
    <div class="seg" role="img" aria-label="Répartition des revenus">${parts.map((p) => `<span style="width:${p.w}%;background:${p.color}" title="${esc(p.k)} : ${formatEUR(p.v)}"></span>`).join('')}</div>
    <div class="legend">${parts.map((p) => `<span><i style="background:${p.color}"></i>${esc(p.k)} <em>${Math.round(p.w)}%</em></span>`).join('')}</div>
    <p class="small" style="margin:8px 0 0"><strong>${formatEUR(sum)}</strong> <span class="muted">reçus sur la période</span></p>`;
  return { html, sum };
}

function scallopPath(lobes = 12, r = 41, bump = 12) {
  const pts = Array.from({ length: lobes }, (_, i) => {
    const a = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  });
  return `M${pts[0].join(' ')}${pts.map((_, i) => ` A${bump} ${bump} 0 0 1 ${pts[(i + 1) % lobes].join(' ')}`).join('')}Z`;
}

function comparison(from, to, incomeSum) {
  const spent = totalSpent(state.transactions, from, to);
  const saved = state.transactions
    .filter((t) => t.date >= from && t.date <= to && t.category === 'transferts' && t.amount < 0)
    .reduce((s, t) => s - t.amount, 0);
  const share = (v) => (incomeSum ? Math.round((v / incomeSum) * 100) : null);
  const rest = incomeSum ? Math.max(0, 100 - share(spent) - share(saved)) : null;
  const stroke = 'stroke="#1D1D2C" stroke-width="3" vector-effect="non-scaling-stroke"';
  const cell = (svg, label, value, color = '#1D1D2C') => `<div class="shape">${svg}
    <div class="txt" style="color:${color}"><small>${label}</small><b>${value ?? '—'}</b><i>%</i></div></div>`;
  return `<div class="shapes">
    ${cell(`<svg viewBox="0 0 100 100"><polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="#F2B33D" ${stroke}/></svg>`, 'Dépensé', share(spent))}
    ${cell(`<svg viewBox="0 0 100 100"><path d="${scallopPath()}" fill="#FFFDF7" ${stroke}/></svg>`, 'Reste', rest)}
    ${cell(`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#7E9F4F" ${stroke}/></svg>`, 'Épargné', share(saved), '#fff')}
  </div>
  <p class="muted small" style="margin:8px 0 0">En % de tes revenus sur la période${incomeSum ? '' : ' (aucun revenu détecté)'}.</p>`;
}

function questCard(q, i) {
  const statusLabel = { reussie: 'Réussie', echouee: 'Échouée', 'en-cours': 'En cours' }[q.status];
  const valueText = q.kind === 'limit' ? `${formatEUR(q.value)} / ${formatEUR(q.targetValue)}` : `${q.value} / ${q.targetValue} jours`;
  const barColor = q.status === 'echouee' ? '#E8735A' : q.status === 'reussie' ? '#7E9F4F' : '#7C86C9';
  return `<div class="quest">
    <div class="badge-ico" style="background:${PALETTE[i % PALETTE.length]}">${q.icon}</div>
    <div style="min-width:0">
      <div class="top"><h3>${esc(q.title)}</h3><span class="tag ${q.status}">${statusLabel}</span></div>
      <div class="muted small">${esc(q.description)}</div>
      <div class="meter"><span style="width:${pct(q.progress)};background:${barColor}"></span></div>
      <div class="foot"><span>${valueText}</span><span class="tag xp">+${q.reward} XP</span></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Vues
// ---------------------------------------------------------------------------

function viewOnboarding() {
  return `<main class="screen mustard"><div class="onboarding">
    <div class="art">${mascot(1, 320)}</div>
    <div>
      <div class="wordmark">PixelBudget</div>
      <p class="tagline">Ton argent devient un jeu : dépense mieux, épargne plus, monte de niveau.</p>
      <div class="reassure">${icon('lock', 16)} Lecture seule · aucun fonds détenu · aucun paiement possible</div>
      <button class="btn block" data-action="open-connect">Commencer</button>
    </div>
  </div></main>`;
}

function viewAccueil(p) {
  const latest = state.transactions.slice(0, 6);
  return `<main class="screen peri">
    ${topbar('Mes comptes', {
      left: `<button class="lvl-pill" data-view="quetes" aria-label="Niveau ${p.level}">Niv. ${p.level}</button>`,
      right: `<button class="round" data-view="comptes" aria-label="Gérer mes banques">${icon('sliders')}</button>`,
    })}
    ${bankCards()}
    <nav class="actions" aria-label="Raccourcis">
      <button class="action" data-view="depenses"><span class="bubble">${icon('chart', 24)}</span>Dépenses</button>
      <button class="action" data-view="budgets"><span class="bubble">${icon('target', 24)}</span>Budgets</button>
      <button class="action" data-view="quetes"><span class="bubble">${icon('trophy', 24)}</span>Quêtes</button>
      <button class="action" data-view="comptes"><span class="bubble">${icon('dots', 24)}</span>Plus</button>
    </nav>
    ${playerCard(p)}
    <div class="section-title"><h2>Transactions</h2><button class="link" data-view="depenses">Tout voir</button></div>
    ${latest.map(txRow).join('')}
  </main>`;
}

function viewDepenses() {
  const { from, to } = PERIODS[ui.period]();
  const inc = incomes(from, to);
  const q = ui.search.trim().toUpperCase();
  const list = state.transactions.filter((tx) => tx.date >= from && tx.date <= to
    && (ui.category === 'toutes' || tx.category === ui.category)
    && (!q || tx.label.toUpperCase().includes(q)));
  const spent = list.filter(isExpense).reduce((s, tx) => s - tx.amount, 0);
  const usedCats = [...new Set(state.transactions.filter((t) => t.date >= from && t.date <= to).map((t) => t.category))];
  return `<main class="screen paper">
    ${topbar('Détails', { left: backBtn(), right: `<button class="round" data-action="focus-search" aria-label="Rechercher">${icon('search')}</button>` })}
    <div class="section-title" style="margin-top:0"><h2>Principales dépenses</h2></div>
    <select data-input="period" aria-label="Période" style="border:0;background:none;padding:0;font-weight:600;font-size:14px;margin-top:-6px">
      ${Object.entries(PERIODS).map(([k, f]) => `<option value="${k}" ${ui.period === k ? 'selected' : ''}>${esc(f().label)}</option>`).join('')}
    </select>
    ${columns(from, to)}
    <div class="section-title"><h2>Revenus</h2></div>
    ${inc.html}
    <div class="section-title"><h2>Comparaison</h2></div>
    ${comparison(from, to, inc.sum)}
    <div class="section-title"><h2>Opérations</h2><span class="small" style="font-weight:700">${formatEUR(spent)} dépensés</span></div>
    <div class="filters">
      <label class="search">${icon('search', 18)}<input type="search" placeholder="Rechercher un libellé…" value="${esc(ui.search)}" data-input="search" aria-label="Rechercher" /></label>
    </div>
    <div class="chips" role="group" aria-label="Catégories">
      <button class="chip" data-cat="toutes" aria-pressed="${ui.category === 'toutes'}">Toutes</button>
      ${usedCats.map((id) => `<button class="chip" data-cat="${id}" aria-pressed="${ui.category === id}">
        <span style="width:10px;height:10px;border-radius:50%;background:${cat(id).color};border:1.5px solid #1D1D2C"></span>${esc(cat(id).label)}</button>`).join('')}
    </div>
    <div class="panel">${list.slice(0, ui.limit).map(txRow).join('') || '<p class="muted">Aucune opération.</p>'}</div>
    ${list.length > ui.limit ? `<button class="btn block light" data-action="more" style="margin-top:12px">Voir plus (${list.length - ui.limit} restantes)</button>` : ''}
  </main>`;
}

function viewBudgets() {
  const statuses = Object.fromEntries(budgetStatus(state.transactions, state.budgets, startOfMonth(today), today).map((s) => [s.category, s]));
  const spendingCats = Object.keys(CATEGORIES).filter((c) => !['revenus', 'transferts'].includes(c));
  const meterColor = { ok: '#7E9F4F', attention: '#F2B33D', depasse: '#E8735A' };
  const budgets = spendingCats.map((id) => {
    const s = statuses[id];
    return `<div class="budget">
      <span class="ico" style="background:${cat(id).color}">${icon(id, 20)}</span>
      <div>
        <div class="head"><span>${esc(cat(id).label)}</span>
          <input type="number" min="0" step="10" inputmode="numeric" value="${state.budgets[id] || ''}" placeholder="— €" data-budget="${id}" aria-label="Budget mensuel ${esc(cat(id).label)}" /></div>
        ${s ? `<div class="meter"><span style="width:${pct(s.ratio)};background:${meterColor[s.status]}"></span></div>
          <div class="muted small">${formatEUR(s.spent)} sur ${formatEUR(s.limit)} · ${s.status === 'depasse' ? 'dépassé 😬' : `reste ${formatEUR(s.limit - s.spent)}`}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const goals = state.goals.map((g, i) => {
    const done = g.saved >= g.target;
    return `<div class="budget">
      <span class="ico" style="background:${PALETTE[i % PALETTE.length]};font-size:20px">${done ? '🏆' : '🌱'}</span>
      <div>
        <div class="head"><span>${esc(g.name)}</span><span class="small">${formatEUR(g.saved)} / ${formatEUR(g.target)}</span></div>
        <div class="meter"><span style="width:${pct(g.saved / g.target)};background:${done ? '#7E9F4F' : '#7C86C9'}"></span></div>
        <div class="goal-actions">
          <button class="btn sm yellow" data-action="goal-add" data-id="${g.id}" data-amount="10">+10 €</button>
          <button class="btn sm yellow" data-action="goal-add" data-id="${g.id}" data-amount="50">+50 €</button>
          <button class="btn sm light" data-action="goal-add" data-id="${g.id}" data-amount="-10">−10 €</button>
          <button class="btn sm danger" data-action="goal-delete" data-id="${g.id}" aria-label="Supprimer l'objectif">${icon('trash', 16)}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<main class="screen paper">
    ${topbar('Budgets', { left: backBtn() })}
    <div class="section-title" style="margin-top:0"><h2>${esc(formatMonth(today))}</h2></div>
    <p class="notice">🎯 Respecte tous tes budgets un mois complet : <strong>+150 XP</strong> et le badge « Maître du budget ».</p>
    <div class="panel flat">${budgets}</div>
    <div class="section-title"><h2>Objectifs d'épargne</h2></div>
    <p class="notice">Note ce que tu mets de côté : +1 XP tous les 10 €. L'app ne déplace jamais d'argent, c'est toi qui fais tes virements.</p>
    <div class="panel flat">
      ${goals || '<p class="muted" style="margin-top:0">Aucun objectif pour l\'instant.</p>'}
      <form class="filters" data-form="goal" style="margin-top:12px">
        <input name="name" placeholder="Ex. Vacances d'été" required maxlength="40" style="flex:2;min-width:150px" aria-label="Nom de l'objectif" />
        <input name="target" type="number" min="1" step="1" placeholder="Montant €" required style="flex:1;min-width:100px" aria-label="Montant cible" />
        <button class="btn block">${icon('plus', 18)} Créer l'objectif</button>
      </form>
    </div>
  </main>`;
}

function viewQuetes(p) {
  return `<main class="screen paper">
    ${topbar('Progression', { left: backBtn() })}
    <section class="hero-level">
      ${mascot(p.level, 190)}
      <h2>Niveau ${p.level}</h2>
      <div style="font-weight:600">${esc(p.title)}</div>
      <div class="bar" style="margin:10px 0 4px"><span style="width:${pct(p.progress)}"></span></div>
      <div class="small" style="display:flex;justify-content:space-between;font-weight:700">
        <span>${p.xpIntoLevel} / ${p.xpForNext} XP</span><span class="streak">${icon('flame', 16)} série de ${p.streak} j</span></div>
      <p class="small" style="margin:8px 0 0">Pixou s'équipe en montant de niveau : casquette au niveau 3, couronne au niveau 5.</p>
    </section>
    <div class="section-title"><h2>Quêtes de la semaine</h2></div>
    <p class="muted small" style="margin:-4px 0 0">Nouvelles quêtes chaque lundi, résultat définitif le dimanche soir.</p>
    ${p.quests.map(questCard).join('')}
    <div class="section-title"><h2>Badges</h2><span class="small" style="font-weight:700">${p.badges.filter((b) => b.unlocked).length}/${p.badges.length}</span></div>
    <div class="badges">${p.badges.map((b, i) => `<div class="badge ${b.unlocked ? '' : 'locked'}">
      <div class="medal" style="background:${PALETTE[i % PALETTE.length]}"><span>${b.icon}</span></div>
      <strong>${esc(b.title)}</strong><small>${esc(b.description)}</small></div>`).join('')}</div>
    <div class="section-title"><h2>D'où vient ton XP</h2><span class="small" style="font-weight:700">${p.xp} XP</span></div>
    <div class="panel">
      ${p.log.map((e) => `<div class="xp-line"><span>${esc(e.reason)}</span><span class="tag xp">+${e.amount}</span></div>`).join('')}
      <p class="muted small" style="margin-bottom:0">L'XP est recalculée à partir de tes vraies données : pas de triche possible 😉</p>
    </div>
  </main>`;
}

function viewComptes() {
  const byInst = {};
  for (const a of state.accounts) (byInst[a.institutionId] ||= []).push(a);
  const blocks = Object.entries(byInst).map(([instId, accounts]) => {
    const conn = state.connections.find((c) => c.institutionId === instId);
    return `<section class="panel flat">
      <div style="display:flex;align-items:center;gap:10px;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px"><span class="round" style="width:38px;height:38px;background:${INST_COLORS[instId] || '#F2B33D'};color:#1D1D2C">${icon('bank', 18)}</span>
        <strong>${esc(accounts[0].institutionName)}</strong></div>
        <div style="display:flex;gap:6px">
          <button class="btn sm light" data-action="sync" data-inst="${instId}" aria-label="Synchroniser">${icon('refresh', 16)}</button>
          <button class="btn sm danger" data-action="disconnect" data-inst="${instId}" aria-label="Déconnecter">${icon('trash', 16)}</button>
        </div>
      </div>
      ${accounts.map((a) => `<div class="acc"><strong>${esc(a.name)}</strong><strong>${formatEUR(a.balance)}</strong>
        <span class="muted small">${esc(a.iban)}</span><span class="muted small">${a.type === 'epargne' ? 'Épargne' : 'Courant'}</span></div>`).join('')}
      ${conn ? `<p class="muted small" style="margin-bottom:0">Consentement accordé le ${formatDay(conn.connectedAt)} · à renouveler tous les 180 jours (DSP2)</p>` : ''}
    </section>`;
  }).join('');
  return `<main class="screen paper">
    ${topbar('Mes banques', { left: backBtn() })}
    <p class="notice">${'🔒'} Accès en <strong>lecture seule</strong> : PixelBudget ne détient pas tes fonds, ne voit jamais tes
      identifiants bancaires et ne peut initier aucun paiement. Mode démo : banques et opérations fictives.</p>
    ${blocks}
    <button class="btn block" data-action="open-connect" style="margin-top:16px">${icon('plus', 18)} Ajouter une banque</button>
    <button class="btn block danger" data-action="reset" style="margin-top:14px">Effacer toutes mes données</button>
  </main>`;
}

function modal() {
  if (!ui.modal) return '';
  let body;
  if (ui.modal.step === 'choose') {
    const connected = new Set(state.connections.map((c) => c.institutionId));
    body = `<h3 id="mt">Choisis ta banque</h3>
      ${ui.institutions.map((i) => `<button class="inst" data-action="choose-inst" data-inst="${i.id}" ${connected.has(i.id) ? 'disabled' : ''}>
        <span class="logo" style="background:${INST_COLORS[i.id] || '#F2B33D'}"></span><span>${esc(i.name)}${connected.has(i.id) ? ' · déjà connectée' : ''}</span></button>`).join('')}
      <button class="btn block light" data-action="close-modal">Annuler</button>`;
  } else {
    const inst = ui.institutions.find((i) => i.id === ui.modal.institutionId);
    body = `<h3 id="mt">Autoriser ${esc(inst.name)}</h3>
      <p style="margin:0">PixelBudget demande à consulter :</p>
      <ul><li>la liste et le solde de tes comptes</li><li>l'historique de tes opérations</li></ul>
      <p class="notice">Tu seras redirigé·e vers ta banque pour t'authentifier. PixelBudget ne reçoit jamais tes identifiants
        et <strong>ne peut effectuer aucun paiement</strong>. Révocable à tout moment, valable 180 jours.</p>
      <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:14px">
        <button class="btn light" data-action="close-modal">Refuser</button>
        <button class="btn" data-action="consent" ${ui.modal.loading ? 'disabled' : ''}>${ui.modal.loading ? 'Connexion…' : 'Autoriser · +100 XP'}</button>
      </div>`;
  }
  return `<div class="sheet-backdrop" data-action="close-modal"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mt">
    <div class="grab"></div>${body}</div></div>`;
}

const NAV = [
  ['accueil', 'home', 'Accueil'],
  ['depenses', 'chart', 'Dépenses'],
  ['budgets', 'target', 'Budgets'],
  ['quetes', 'trophy', 'Quêtes'],
  ['comptes', 'bank', 'Banques'],
];

function render() {
  const p = progress();
  const focused = document.activeElement?.dataset?.input;
  let html;
  if (!state.accounts.length) {
    html = viewOnboarding();
  } else {
    const views = { accueil: viewAccueil, depenses: viewDepenses, budgets: viewBudgets, quetes: viewQuetes, comptes: viewComptes };
    html = `${views[ui.view](p)}
      <nav class="nav" aria-label="Navigation"><div class="nav-inner">${NAV.map(([id, ic, l]) =>
        `<button data-view="${id}" ${ui.view === id ? 'aria-current="page"' : ''}>${icon(ic, 20)}${l}</button>`).join('')}</div></nav>`;
  }
  app.innerHTML = html + modal();
  app.firstElementChild.classList.toggle('animate', ui.animate);
  ui.animate = false;

  if (focused) {
    const el = app.querySelector(`[data-input="${focused}"]`);
    if (el) { el.focus(); if (el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); }
  }
  const carousel = app.querySelector('[data-carousel]');
  if (carousel) {
    const dots = app.querySelectorAll('.dots i');
    carousel.addEventListener('scroll', () => {
      const cards = [...carousel.querySelectorAll('.bank-card')];
      const mid = carousel.scrollLeft + carousel.clientWidth / 2;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)) best = i;
      });
      dots.forEach((d, i) => d.classList.toggle('on', i === best));
    }, { passive: true });
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
  if (viewBtn) { go(viewBtn.dataset.view); return; }

  const catBtn = e.target.closest('[data-cat]');
  if (catBtn) { ui.category = catBtn.dataset.cat; ui.limit = 20; render(); return; }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  // Un clic sur le fond de la feuille la ferme, mais pas un clic à l'intérieur.
  if (action === 'close-modal' && el.classList.contains('sheet-backdrop') && e.target !== el) return;

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
    case 'more':
      ui.limit += 30;
      break;
    case 'focus-search':
      app.querySelector('[data-input="search"]')?.focus();
      app.querySelector('.filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    case 'consent': {
      const { institutionId } = ui.modal;
      ui.modal.loading = true;
      render();
      try {
        const conn = await provider.connect(institutionId);
        state.connections.push({ ...conn, connectedAt: today });
        await syncInstitution(institutionId);
        toast('✅ Banque connectée · +100 XP');
        ui.view = 'accueil';
        ui.animate = true;
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
      ui.view = 'accueil';
      break;
    default:
      return;
  }
  render();
});

app.addEventListener('input', (e) => {
  const key = e.target.dataset.input;
  if (key) { ui[key] = e.target.value; ui.limit = 20; if (key === 'period') ui.animate = true; render(); }
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
