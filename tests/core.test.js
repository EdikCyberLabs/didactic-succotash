import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addDays, startOfWeek, endOfMonth } from '../src/core/dates.js';
import { categorize, budgetStatus, spendingByCategory, monthSummary, noSpendDays, totalSpent } from '../src/core/analytics.js';
import { levelFromXp, xpForLevel, evaluateQuests, visitStreak, computeProgress } from '../src/core/gamification.js';
import { DemoProvider } from '../src/core/providers.js';

const tx = (date, label, amount) => ({ id: `${date}-${label}`, accountId: 'a', date, label, amount, category: categorize(label) });

test('dates : semaine commençant le lundi et fin de mois', () => {
  assert.equal(startOfWeek('2026-11-05'), '2026-11-02'); // jeudi → lundi
  assert.equal(startOfWeek('2026-11-08'), '2026-11-02'); // dimanche → lundi
  assert.equal(endOfMonth('2028-02-10'), '2028-02-29');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('catégorisation par libellé', () => {
  assert.equal(categorize('CB SUPERMARCHE DU COIN'), 'alimentation');
  assert.equal(categorize('PIZZERIA NAPOLI'), 'restaurants');
  assert.equal(categorize('VIREMENT INTERNE VERS LIVRET'), 'transferts');
  assert.equal(categorize('SALAIRE ENTREPRISE'), 'revenus');
  assert.equal(categorize('INTERETS LIVRET'), 'revenus');
  assert.equal(categorize('XYZ INCONNU'), 'autre');
});

test('les virements internes ne comptent ni en dépense ni en revenu', () => {
  const txs = [
    tx('2026-10-01', 'SALAIRE ENTREPRISE', 2000),
    tx('2026-10-02', 'VIREMENT INTERNE VERS LIVRET', -300),
    tx('2026-10-03', 'PIZZERIA NAPOLI', -25),
  ];
  const s = monthSummary(txs, '2026-10-15');
  assert.deepEqual([s.income, s.expenses, s.net], [2000, 25, 1975]);
  assert.deepEqual(spendingByCategory(txs, '2026-10-01', '2026-10-31'), [{ category: 'restaurants', total: 25 }]);
});

test('statut des budgets', () => {
  const txs = [tx('2026-10-02', 'PIZZERIA', -90), tx('2026-10-03', 'SUPERMARCHE', -100)];
  const status = budgetStatus(txs, { restaurants: 100, alimentation: 80, loisirs: 50 }, '2026-10-01', '2026-10-31');
  const by = Object.fromEntries(status.map((s) => [s.category, s.status]));
  assert.deepEqual(by, { restaurants: 'attention', alimentation: 'depasse', loisirs: 'ok' });
  assert.equal(status[0].category, 'alimentation'); // trié par taux de consommation
});

test('jours sans dépense', () => {
  const txs = [tx('2026-10-01', 'PIZZERIA', -10), tx('2026-10-03', 'SALAIRE', 1000)];
  assert.deepEqual(noSpendDays(txs, '2026-10-01', '2026-10-03'), ['2026-10-02', '2026-10-03']);
});

test('niveaux et XP', () => {
  assert.equal(xpForLevel(2), 100);
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(99).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  const l = levelFromXp(450); // niv. 3 (300) → niv. 4 (600)
  assert.equal(l.level, 3);
  assert.equal(l.xpIntoLevel, 150);
  assert.equal(l.xpForNext, 300);
});

test('quêtes : en cours, réussies, échouées', () => {
  const week = '2026-10-26';
  const txs = [tx('2026-10-26', 'PIZZERIA', -50), tx('2026-10-27', 'VETEMENTS MODE', -20)];
  const ongoing = Object.fromEntries(evaluateQuests(txs, {}, week, '2026-10-28').map((q) => [q.id, q.status]));
  assert.equal(ongoing['chef-maison'], 'echouee'); // 50 € > 40 €
  assert.equal(ongoing['shopping-light'], 'en-cours');
  assert.equal(ongoing['journees-zen'], 'en-cours'); // 1 seul jour sans dépense (28/10)
  const done = Object.fromEntries(evaluateQuests(txs, {}, week, '2026-11-02').map((q) => [q.id, q.status]));
  assert.equal(done['shopping-light'], 'reussie');
  assert.equal(done['journees-zen'], 'reussie');
});

test('série de visites', () => {
  assert.equal(visitStreak(['2026-11-01', '2026-10-31', '2026-10-29'], '2026-11-02'), 2);
  assert.equal(visitStreak(['2026-11-02', '2026-11-01'], '2026-11-02'), 2);
  assert.equal(visitStreak([], '2026-11-02'), 0);
});

test('progression : XP cohérente et badges', () => {
  const p = computeProgress({
    accounts: [{ institutionId: 'x' }, { institutionId: 'y' }],
    transactions: [],
    budgets: {},
    goals: [{ id: 'g', name: 'Vacances', target: 500, saved: 500 }],
    visits: ['2026-11-02'],
    today: '2026-11-02',
  });
  const unlocked = p.badges.filter((b) => b.unlocked).map((b) => b.id);
  assert.deepEqual(unlocked.sort(), ['multi-banques', 'objectif-atteint', 'premier-pas', 'reveur']);
  assert.equal(p.xp, p.log.reduce((s, e) => s + e.amount, 0));
  // 2 comptes (200) + 1 visite (5) + 500 € épargnés (50) + 4 badges (200)
  assert.equal(p.xp, 455);
});

test('fournisseur démo : déterministe, sans fonds détenus, soldes cohérents', async () => {
  const provider = new DemoProvider({ today: '2026-11-02' });
  const conn = await provider.connect('demo-banque-azur');
  const accounts = await provider.fetchAccounts(conn);
  assert.equal(accounts.length, 2);
  const txs1 = await provider.fetchTransactions(conn, accounts[0]);
  const txs2 = await provider.fetchTransactions(conn, accounts[0]);
  assert.deepEqual(txs1, txs2);
  assert.ok(txs1.length > 50);
  assert.ok(txs1.every((t) => t.date <= '2026-11-02'));
  assert.ok(totalSpent(txs1, '2026-10-01', '2026-10-31') > 0);
  await assert.rejects(provider.connect('banque-inexistante'));
});
