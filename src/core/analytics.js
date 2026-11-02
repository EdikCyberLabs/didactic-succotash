// Analyse des dépenses : catégorisation, agrégations, suivi des budgets.
// Fonctions pures, sans accès au DOM ni au stockage → faciles à tester.

import { eachDay, endOfMonth, startOfMonth } from './dates.js';

export const CATEGORIES = {
  alimentation: { label: 'Courses', icon: '🛒', color: '#22c55e' },
  restaurants: { label: 'Restaurants', icon: '🍔', color: '#f97316' },
  transport: { label: 'Transport', icon: '🚇', color: '#3b82f6' },
  logement: { label: 'Logement', icon: '🏠', color: '#a855f7' },
  abonnements: { label: 'Abonnements', icon: '📺', color: '#ec4899' },
  shopping: { label: 'Shopping', icon: '🛍️', color: '#eab308' },
  loisirs: { label: 'Loisirs', icon: '🎮', color: '#14b8a6' },
  sante: { label: 'Santé', icon: '💊', color: '#ef4444' },
  revenus: { label: 'Revenus', icon: '💰', color: '#10b981' },
  transferts: { label: 'Virements internes', icon: '🔁', color: '#94a3b8' },
  autre: { label: 'Autre', icon: '📦', color: '#64748b' },
};

// Règles de catégorisation par mots-clés sur le libellé bancaire.
// L'ordre compte : la première règle qui correspond l'emporte.
const RULES = [
  ['transferts', /VIR(EMENT)? (INTERNE|EPARGNE)|VERS LIVRET/],
  ['revenus', /SALAIRE|REMBOURSEMENT|INTERETS| CAF |PRIME/],
  ['logement', /LOYER|EDF|ENGIE|EAU |ASSURANCE HABITATION/],
  ['abonnements', /ABONNEMENT|FORFAIT|STREAMING|MUSIQUE|SALLE DE SPORT/],
  ['alimentation', /SUPERMARCHE|EPICERIE|MARCHE |BOULANGERIE|PRIMEUR/],
  ['restaurants', /RESTAURANT|BRASSERIE|PIZZERIA|LIVRAISON REPAS|CAFE |SUSHI|KEBAB/],
  ['transport', /NAVIGO|METRO|TRAIN|CARBURANT|PEAGE|VTC|TROTTINETTE|PARKING/],
  ['sante', /PHARMACIE|MEDECIN|DENTISTE|MUTUELLE/],
  ['shopping', /VETEMENTS|LIBRAIRIE|ELECTRONIQUE|BRICOLAGE|MARKETPLACE/],
  ['loisirs', /CINEMA|CONCERT|JEUX VIDEO|MUSEE|BOWLING/],
];

export function categorize(label) {
  const text = ` ${label.toUpperCase()} `;
  for (const [category, regex] of RULES) {
    if (regex.test(text)) return category;
  }
  return 'autre';
}

/** Une dépense « réelle » : sortie d'argent qui n'est pas un virement entre ses propres comptes. */
export function isExpense(tx) {
  return tx.amount < 0 && tx.category !== 'transferts';
}

export function isIncome(tx) {
  return tx.amount > 0 && tx.category !== 'transferts';
}

export function inRange(txs, from, to) {
  return txs.filter((tx) => tx.date >= from && tx.date <= to);
}

const round2 = (n) => Math.round(n * 100) / 100;

export function totalSpent(txs, from, to, category = null) {
  return round2(
    inRange(txs, from, to)
      .filter((tx) => isExpense(tx) && (!category || tx.category === category))
      .reduce((sum, tx) => sum - tx.amount, 0),
  );
}

export function spendingByCategory(txs, from, to) {
  const totals = {};
  for (const tx of inRange(txs, from, to)) {
    if (!isExpense(tx)) continue;
    totals[tx.category] = (totals[tx.category] || 0) - tx.amount;
  }
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

export function dailySpending(txs, from, to) {
  const byDay = Object.fromEntries(eachDay(from, to).map((d) => [d, 0]));
  for (const tx of inRange(txs, from, to)) {
    if (isExpense(tx)) byDay[tx.date] -= tx.amount;
  }
  return Object.entries(byDay).map(([date, total]) => ({ date, total: round2(total) }));
}

export function noSpendDays(txs, from, to) {
  return dailySpending(txs, from, to).filter((d) => d.total === 0).map((d) => d.date);
}

export function monthSummary(txs, anyDayOfMonth) {
  const from = startOfMonth(anyDayOfMonth);
  const to = endOfMonth(anyDayOfMonth);
  const scoped = inRange(txs, from, to);
  const income = round2(scoped.filter(isIncome).reduce((s, tx) => s + tx.amount, 0));
  const expenses = round2(scoped.filter(isExpense).reduce((s, tx) => s - tx.amount, 0));
  return { from, to, income, expenses, net: round2(income - expenses) };
}

/**
 * État des budgets mensuels sur la période [from, to].
 * `budgets` : { [categorie]: plafondMensuel }
 */
export function budgetStatus(txs, budgets, from, to) {
  return Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const spent = totalSpent(txs, from, to, category);
      const ratio = spent / limit;
      const status = ratio > 1 ? 'depasse' : ratio > 0.8 ? 'attention' : 'ok';
      return { category, limit, spent, ratio, status };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export function balanceOf(accounts) {
  return round2(accounts.reduce((sum, a) => sum + a.balance, 0));
}

export function formatEUR(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
