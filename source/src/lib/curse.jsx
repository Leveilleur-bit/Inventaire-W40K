// ══════════════════════════════════════════════════════════
// LA RELIQUE MAUDITE
// ══════════════════════════════════════════════════════════
// Chaque mois (au premier lancement du mois, hors enrôlement), s'il n'y a pas déjà une relique
// maudite, celle qui attend depuis le plus longtemps est frappée. Elle reste maudite tant qu'elle
// n'est pas peinte. La corruption monte d'un degré par semaine (5 degrés) ; passer la relique
// « En cours » la fige. La peindre déclenche la purification.
// État : appState.curse = { id, since, frozenAt|null }, appState.curseMonth = "AAAA-MM",
//        appState.cursesLifted = [{ id, since, day, days }]
import { localDay } from './utils.jsx';

export const CURSE_LEVELS = [
  { name: "Le Murmure",   text: "Une voix ténue s'élève de la grappe. Rien de grave… pour l'instant." },
  { name: "La Souillure", text: "Le plastique gris se tache de reflets malsains. Le Chapelain fronce les sourcils." },
  { name: "La Gangrène",  text: "La corruption gagne. Sur l'étagère, les autres reliques s'écartent d'elle." },
  { name: "La Possession", text: "Quelque chose regarde à travers elle. Le registre lui-même commence à se brouiller." },
  { name: "La Damnation", text: "Elle appartient presque aux Puissances. Seul le pinceau peut encore la sauver." },
];

const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000));
const addedDay = (it) => {
  const n = Number(it.id);
  if (Number.isFinite(n) && n > 1.5e15) { const d = new Date(n / 1000); if (d.getFullYear() > 2015) return localDay(d); }
  return null;
};
// Depuis quand la relique attend : date d'achat d'abord, sinon entrée au registre
const waitingSince = (it) => it.purchasedAt ? (it.purchasedAt.length === 7 ? it.purchasedAt + "-01" : it.purchasedAt) : addedDay(it);

// La relique qui attend depuis le plus longtemps (hors « En cours », hors ordre du Dé et serment)
export function pickCursed(appState) {
  const inv = appState.inventory || [];
  const skip = new Set([appState.fateChoice?.id, appState.oath?.unitId].filter(x => x != null));
  const pool = inv.filter(i => i.paintStatus !== "painted" && i.paintStatus !== "wip" && !skip.has(i.id));
  if (!pool.length) return null;
  return pool.map(i => ({ i, d: waitingSince(i) || "9999" })).sort((a, b) => a.d.localeCompare(b.d) || String(a.i.id).localeCompare(String(b.i.id)))[0].i;
}

// Malédiction active (relique présente et non peinte), avec son degré
export function activeCurse(appState, today = localDay()) {
  const c = appState.curse;
  if (!c) return null;
  const item = (appState.inventory || []).find(i => i.id === c.id);
  if (!item || item.paintStatus === "painted") return null;
  const days = daysBetween(c.since, c.frozenAt || today);
  const level = Math.min(CURSE_LEVELS.length - 1, Math.floor(days / 7));
  return { ...c, item, days, level, frozen: !!c.frozenAt, ...CURSE_LEVELS[level] };
}

// Mise à jour de l'état quand le statut de la relique maudite change
export function curseOnStatus(s, id, status, today = localDay()) {
  const c = s.curse;
  if (!c || c.id !== id) return {};
  if (status === "painted") {
    const days = daysBetween(c.since, c.frozenAt || today);
    return { curse: null, cursesLifted: [...(s.cursesLifted || []), { id, since: c.since, day: today, days }] };
  }
  if (status === "wip" && !c.frozenAt) return { curse: { ...c, frozenAt: today } };
  if (status !== "wip" && c.frozenAt) {
    // Reprise de la corruption : on décale le départ de la durée passée figée
    const d = new Date(c.since + "T12:00:00"); d.setDate(d.getDate() + daysBetween(c.frozenAt, today));
    return { curse: { ...c, since: localDay(d), frozenAt: null } };
  }
  return {};
}

// Style de corruption appliqué à une photo, selon le degré (0 à 4)
export const curseFilter = (level) =>
  `hue-rotate(${70 + level * 25}deg) saturate(${1.2 + level * 0.25}) contrast(${1 + level * 0.08}) brightness(${1 - level * 0.06})`;
export const CURSE_COLOR = "#a05ac8";
