// Moteur de gamification : XP, niveaux, quêtes hebdomadaires, badges, séries.
// Tout est *calculé* à partir des données (transactions, budgets, objectifs, visites)
// plutôt que stocké : impossible de « tricher » en modifiant un compteur, et
// le résultat est reproductible côté serveur.

import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek } from './dates.js';
import { budgetStatus, noSpendDays, totalSpent } from './analytics.js';

// ---------- Niveaux ----------

// XP cumulée nécessaire pour atteindre le niveau n : 100 * n(n-1)/2
// (niv. 2 = 100, niv. 3 = 300, niv. 4 = 600, ...)
export function xpForLevel(level) {
  return (100 * level * (level - 1)) / 2;
}

const TITLES = ['Apprenti épargnant', 'Gardien du budget', 'Stratège financier', 'Maître des finances', 'Légende de l\'épargne'];

export function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))],
    xpIntoLevel: xp - base,
    xpForNext: next - base,
    progress: (xp - base) / (next - base),
  };
}

// ---------- Quêtes hebdomadaires ----------

export const QUESTS = [
  {
    id: 'chef-maison',
    icon: '👨‍🍳',
    title: 'Chef à la maison',
    description: 'Moins de 40 € de restaurants cette semaine',
    reward: 60,
    kind: 'limit',
    measure: (txs, from, to) => totalSpent(txs, from, to, 'restaurants'),
    target: () => 40,
  },
  {
    id: 'journees-zen',
    icon: '🧘',
    title: 'Journées zen',
    description: '2 jours sans aucune dépense',
    reward: 50,
    kind: 'count',
    measure: (txs, from, to) => noSpendDays(txs, from, to).length,
    target: () => 2,
  },
  {
    id: 'shopping-light',
    icon: '🛍️',
    title: 'Shopping light',
    description: 'Moins de 50 € de shopping cette semaine',
    reward: 40,
    kind: 'limit',
    measure: (txs, from, to) => totalSpent(txs, from, to, 'shopping'),
    target: () => 50,
  },
  {
    id: 'sous-le-radar',
    icon: '🛰️',
    title: 'Sous le radar',
    description: 'Dépenses de la semaine (hors logement) sous ton budget hebdo',
    reward: 80,
    kind: 'limit',
    measure: (txs, from, to) => totalSpent(txs, from, to) - totalSpent(txs, from, to, 'logement'),
    target: (budgets) => weeklyBudget(budgets),
  },
];

/** Budget hebdo dérivé des budgets mensuels (hors logement), 250 € par défaut. */
export function weeklyBudget(budgets) {
  const monthly = Object.entries(budgets || {})
    .filter(([cat]) => cat !== 'logement')
    .reduce((s, [, v]) => s + (v || 0), 0);
  return monthly > 0 ? Math.round((monthly * 7) / 30) : 250;
}

/**
 * Évalue les quêtes pour la semaine commençant `weekStart`.
 * Si la semaine est terminée (`today` > dimanche), le statut est définitif.
 */
export function evaluateQuests(txs, budgets, weekStart, today) {
  const weekEnd = addDays(weekStart, 6);
  const finished = today > weekEnd;
  const to = finished ? weekEnd : today;
  return QUESTS.map((q) => {
    const value = Math.round(q.measure(txs, weekStart, to) * 100) / 100;
    const target = q.target(budgets);
    let status;
    if (q.kind === 'limit') {
      if (value > target) status = 'echouee';
      else status = finished ? 'reussie' : 'en-cours';
    } else {
      if (value >= target) status = 'reussie';
      else status = finished ? 'echouee' : 'en-cours';
    }
    const progress = target > 0 ? Math.min(1, value / target) : 1;
    return { ...q, weekStart, value, targetValue: target, status, progress };
  });
}

// ---------- Séries (streaks) ----------

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) où l'utilisateur a ouvert l'app. */
export function visitStreak(visits, today) {
  const set = new Set(visits);
  let day = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

// ---------- Badges ----------

export const BADGES = [
  { id: 'premier-pas', icon: '🔗', title: 'Premier pas', description: 'Connecter un premier compte bancaire', test: (c) => c.accounts.length >= 1 },
  { id: 'multi-banques', icon: '🏦', title: 'Multi-banques', description: 'Connecter des comptes de 2 banques différentes', test: (c) => new Set(c.accounts.map((a) => a.institutionId)).size >= 2 },
  { id: 'architecte', icon: '📐', title: 'Architecte', description: 'Définir au moins 3 budgets', test: (c) => Object.values(c.budgets).filter((v) => v > 0).length >= 3 },
  { id: 'maitre-budget', icon: '🎯', title: 'Maître du budget', description: 'Respecter tous ses budgets sur un mois complet', test: (c) => c.perfectMonths > 0 },
  { id: 'zen', icon: '🧘', title: 'Esprit zen', description: '10 jours sans dépense sur les 30 derniers jours', test: (c) => c.noSpendDays30 >= 10 },
  { id: 'regulier', icon: '🔥', title: 'Régulier', description: 'Ouvrir l\'app 7 jours d\'affilée', test: (c) => c.streak >= 7 },
  { id: 'reveur', icon: '🌱', title: 'Rêveur', description: 'Créer un objectif d\'épargne', test: (c) => c.goals.length >= 1 },
  { id: 'objectif-atteint', icon: '🏆', title: 'Objectif atteint', description: 'Compléter un objectif d\'épargne', test: (c) => c.goals.some((g) => g.saved >= g.target) },
  { id: 'questeur', icon: '⚔️', title: 'Questeur', description: 'Réussir 5 quêtes hebdomadaires', test: (c) => c.questsCompleted >= 5 },
];

// ---------- Progression globale ----------

const XP = {
  account: 100,
  badge: 50,
  noSpendDay: 10,
  visitDay: 5,
  perfectMonth: 150,
  savedPer10: 1,
};

/** Nombre de mois complets (parmi les `n` derniers) où tous les budgets ont été respectés. */
function countPerfectMonths(txs, budgets, today, n = 3) {
  if (!Object.values(budgets).some((v) => v > 0)) return 0;
  let count = 0;
  for (let i = 1; i <= n; i += 1) {
    const month = addMonths(today, -i);
    const statuses = budgetStatus(txs, budgets, startOfMonth(month), endOfMonth(month));
    const hasData = txs.some((tx) => tx.date >= startOfMonth(month) && tx.date <= endOfMonth(month));
    if (hasData && statuses.every((s) => s.status !== 'depasse')) count += 1;
  }
  return count;
}

/**
 * Calcule toute la progression du joueur.
 * @param {object} p
 * @param {Array} p.accounts      comptes agrégés
 * @param {Array} p.transactions  transactions catégorisées
 * @param {object} p.budgets      { categorie: plafondMensuel }
 * @param {Array} p.goals         [{ id, name, target, saved }]
 * @param {Array} p.visits        dates ISO des jours où l'app a été ouverte
 * @param {string} p.today        date ISO
 */
export function computeProgress({ accounts = [], transactions = [], budgets = {}, goals = [], visits = [], today }) {
  const log = [];
  const add = (amount, reason) => { if (amount > 0) log.push({ amount, reason }); };

  add(accounts.length * XP.account, `${accounts.length} compte(s) connecté(s)`);

  const zen30 = transactions.length ? noSpendDays(transactions, addDays(today, -29), today).length : 0;
  add(zen30 * XP.noSpendDay, `${zen30} jour(s) sans dépense (30 j)`);

  const streak = visitStreak(visits, today);
  add(new Set(visits).size * XP.visitDay, `${new Set(visits).size} jour(s) de suivi`);

  const perfectMonths = countPerfectMonths(transactions, budgets, today);
  add(perfectMonths * XP.perfectMonth, `${perfectMonths} mois de budgets respectés`);

  const saved = goals.reduce((s, g) => s + Math.min(g.saved, g.target), 0);
  add(Math.floor(saved / 10) * XP.savedPer10, `${Math.round(saved)} € mis de côté`);

  // Quêtes des 4 semaines terminées + semaine en cours
  const thisWeek = startOfWeek(today);
  let questsCompleted = 0;
  let questXp = 0;
  if (transactions.length) {
    for (let w = 1; w <= 4; w += 1) {
      for (const q of evaluateQuests(transactions, budgets, addDays(thisWeek, -7 * w), today)) {
        if (q.status === 'reussie') { questsCompleted += 1; questXp += q.reward; }
      }
    }
  }
  const currentQuests = evaluateQuests(transactions, budgets, thisWeek, today);
  for (const q of currentQuests) {
    if (q.status === 'reussie') { questsCompleted += 1; questXp += q.reward; }
  }
  add(questXp, `${questsCompleted} quête(s) réussie(s)`);

  const ctx = { accounts, budgets, goals, streak, perfectMonths, noSpendDays30: zen30, questsCompleted };
  const badges = BADGES.map(({ test, ...b }) => ({ ...b, unlocked: Boolean(test(ctx)) }));
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  add(unlockedCount * XP.badge, `${unlockedCount} badge(s) débloqué(s)`);

  const xp = log.reduce((s, e) => s + e.amount, 0);
  return { xp, ...levelFromXp(xp), streak, badges, quests: currentQuests, questsCompleted, log };
}
