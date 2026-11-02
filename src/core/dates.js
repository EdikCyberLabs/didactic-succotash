// Utilitaires de dates. Toutes les dates métier sont des chaînes "YYYY-MM-DD"
// (heure locale) pour éviter les décalages de fuseau horaire.

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso) {
  const d = fromISO(startOfMonth(iso));
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toISO(d);
}

export function addMonths(iso, n) {
  const d = fromISO(startOfMonth(iso));
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

/** Lundi de la semaine contenant `iso`. */
export function startOfWeek(iso) {
  const d = fromISO(iso);
  const offset = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - offset);
  return toISO(d);
}

export function daysBetween(fromIso, toIso) {
  const ms = fromISO(toIso) - fromISO(fromIso);
  return Math.round(ms / 86400000);
}

export function eachDay(fromIso, toIso) {
  const days = [];
  for (let d = fromIso; d <= toIso; d = addDays(d, 1)) days.push(d);
  return days;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function formatDay(iso) {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatMonth(iso) {
  const d = fromISO(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
