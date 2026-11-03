// Persistance locale (prototype). En production, l'état vivrait côté serveur,
// rattaché au compte utilisateur ; ici on garde tout dans le navigateur.

const KEY = 'pixel-budget:v1';

export const EMPTY_STATE = {
  connections: [], // { connectionId, institutionId, connectedAt }
  accounts: [],
  transactions: [],
  budgets: {},
  goals: [], // { id, name, target, saved }
  visits: [],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : JSON.parse(JSON.stringify(EMPTY_STATE));
  } catch {
    return JSON.parse(JSON.stringify(EMPTY_STATE));
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible (navigation privée...) : l'app reste utilisable pour la session
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
