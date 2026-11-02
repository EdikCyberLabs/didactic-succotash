// Couche « fournisseur d'agrégation bancaire ».
//
// L'application ne détient JAMAIS de fonds : elle lit seulement les soldes et
// transactions des comptes que l'utilisateur autorise (service d'information
// sur les comptes, « AIS » au sens de la DSP2).
//
// En production, une implémentation de BankProvider parle à VOTRE backend,
// qui lui-même appelle un agrégateur agréé (ex. Bridge, Powens, Tink,
// GoCardless Bank Account Data, Plaid...). Le navigateur ne voit jamais les
// identifiants bancaires ni les jetons d'accès de l'agrégateur.
// Voir docs/ARCHITECTURE.md.

import { addDays, startOfMonth, toISO } from './dates.js';
import { categorize } from './analytics.js';

/**
 * Contrat commun à tous les fournisseurs.
 * @interface
 */
export class BankProvider {
  /** @returns {Promise<Array<{id, name, logo}>>} */
  async listInstitutions() { throw new Error('non implémenté'); }
  /**
   * Démarre le parcours de consentement. En réel : renvoie une URL de
   * redirection vers la banque (authentification forte DSP2).
   * @returns {Promise<{connectionId, institutionId, redirectUrl?}>}
   */
  async connect(institutionId) { throw new Error('non implémenté'); }
  /** @returns {Promise<Array<{id, institutionId, name, type, iban, balance}>>} */
  async fetchAccounts(connection) { throw new Error('non implémenté'); }
  /** @returns {Promise<Array<{id, accountId, date, label, amount}>>} */
  async fetchTransactions(connection, account) { throw new Error('non implémenté'); }
}

// ---------------------------------------------------------------------------
// Fournisseur de démonstration : banques fictives et données générées de façon
// déterministe (mêmes données pour une même banque et une même date).
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const DEMO_INSTITUTIONS = [
  { id: 'demo-banque-azur', name: 'Banque Azur (démo)', logo: '🔵' },
  { id: 'demo-neo-pixel', name: 'NéoPixel (démo)', logo: '🟣' },
  { id: 'demo-credit-vert', name: 'Crédit Vert (démo)', logo: '🟢' },
];

const DAILY_PATTERNS = [
  // [probabilité par jour, [libellés], [min, max]]
  [0.3, ['SUPERMARCHE DU COIN', 'EPICERIE BIO', 'BOULANGERIE DU MARCHE', 'PRIMEUR LEGUMES'], [4, 75]],
  [0.18, ['RESTAURANT LE PETIT ZINC', 'PIZZERIA NAPOLI', 'LIVRAISON REPAS', 'SUSHI EXPRESS', 'CAFE DE LA GARE', 'KEBAB ANKARA'], [6, 45]],
  [0.12, ['TICKET METRO', 'CARBURANT STATION', 'VTC COURSE', 'TROTTINETTE LIBRE', 'PARKING CENTRE'], [2, 60]],
  [0.07, ['VETEMENTS MODE', 'LIBRAIRIE PAGES', 'MARKETPLACE EN LIGNE', 'BRICOLAGE MAISON', 'ELECTRONIQUE PLUS'], [10, 120]],
  [0.05, ['CINEMA ETOILE', 'CONCERT SALLE ROCK', 'JEUX VIDEO STORE', 'MUSEE ART MODERNE', 'BOWLING STRIKE'], [8, 55]],
  [0.03, ['PHARMACIE CENTRALE', 'MEDECIN GENERALISTE'], [5, 30]],
];

const MONTHLY = [
  // [jour du mois, libellé, montant]
  [1, 'SALAIRE ENTREPRISE', 2350],
  [3, 'LOYER APPARTEMENT', -820],
  [5, 'EDF ELECTRICITE', -62],
  [6, 'FORFAIT MOBILE', -15.99],
  [8, 'ABONNEMENT STREAMING VIDEO', -13.49],
  [10, 'ABONNEMENT MUSIQUE', -10.99],
  [12, 'NAVIGO MENSUEL', -86.4],
  [15, 'SALLE DE SPORT', -29.9],
  [20, 'MUTUELLE SANTE', -38],
  [26, 'VIREMENT INTERNE VERS LIVRET', -150],
];

export class DemoProvider extends BankProvider {
  constructor({ today = toISO(new Date()), historyDays = 120 } = {}) {
    super();
    this.today = today;
    this.historyDays = historyDays;
  }

  async listInstitutions() {
    return DEMO_INSTITUTIONS;
  }

  async connect(institutionId) {
    if (!DEMO_INSTITUTIONS.some((i) => i.id === institutionId)) {
      throw new Error(`Banque inconnue : ${institutionId}`);
    }
    return { connectionId: `conn-${institutionId}`, institutionId };
  }

  async fetchAccounts({ institutionId }) {
    const inst = DEMO_INSTITUTIONS.find((i) => i.id === institutionId);
    const rand = mulberry32(hash(institutionId));
    const iban = `FR76 ${Math.floor(rand() * 9000 + 1000)} **** **** ${Math.floor(rand() * 9000 + 1000)}`;
    const accounts = [{
      id: `${institutionId}-courant`,
      institutionId,
      institutionName: inst.name,
      name: 'Compte courant',
      type: 'courant',
      iban,
    }];
    if (institutionId !== 'demo-neo-pixel') {
      accounts.push({
        id: `${institutionId}-livret`,
        institutionId,
        institutionName: inst.name,
        name: 'Livret d\'épargne',
        type: 'epargne',
        iban: iban.replace(/\d{4}$/, '0001'),
      });
    }
    // Solde = solde d'ouverture + somme des transactions générées.
    for (const acc of accounts) {
      const txs = this.#generate(acc);
      const opening = acc.type === 'epargne' ? 2500 + Math.round(rand() * 3000) : 900 + Math.round(rand() * 800);
      acc.balance = Math.round((opening + txs.reduce((s, t) => s + t.amount, 0)) * 100) / 100;
    }
    return accounts;
  }

  async fetchTransactions(_connection, account) {
    return this.#generate(account);
  }

  #generate(account) {
    const rand = mulberry32(hash(account.id));
    const txs = [];
    const from = addDays(this.today, -this.historyDays);
    let n = 0;
    const push = (date, label, amount) => {
      txs.push({
        id: `${account.id}-${n++}`,
        accountId: account.id,
        date,
        label,
        amount: Math.round(amount * 100) / 100,
        category: categorize(label),
      });
    };

    const isMain = account.institutionId === 'demo-banque-azur';
    for (let d = from; d <= this.today; d = addDays(d, 1)) {
      const dayOfMonth = Number(d.slice(8));
      if (account.type === 'epargne') {
        if (dayOfMonth === 26) push(d, 'VIREMENT EPARGNE RECU', 150);
        if (d === startOfMonth(d) && rand() < 0.3) push(d, 'INTERETS LIVRET', 4 + rand() * 6);
        continue;
      }
      if (isMain) {
        for (const [day, label, amount] of MONTHLY) if (day === dayOfMonth) push(d, label, amount);
      }
      // Les comptes secondaires ont une activité plus faible.
      const intensity = isMain ? 1 : 0.4;
      for (const [p, labels, [min, max]] of DAILY_PATTERNS) {
        if (rand() < p * intensity) {
          const label = labels[Math.floor(rand() * labels.length)];
          push(d, label, -(min + rand() * (max - min)));
        }
      }
      if (!isMain && dayOfMonth === 2) push(d, 'REMBOURSEMENT AMI', 20 + Math.round(rand() * 40));
    }
    return txs.reverse();
  }
}
