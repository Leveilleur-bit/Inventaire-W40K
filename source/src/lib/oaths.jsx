// ══════════════════════════════════════════════════════════
// SERMENTS DE CROISADE — le rituel des trois parchemins
// ══════════════════════════════════════════════════════════
// Plus de nombre ni de date limite : un serment vise UNE figurine précise, tirée de la pile
// dans un parchemin scellé. Une bougie se consume pour le plaisir des yeux ; quand elle
// s'éteint, le serment « dort » (rallumer ou se délier), il n'est jamais « brisé ».
import { findUnit } from '../data/units.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { isColossus } from './colossus.jsx';

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const DAY = 86400000;

export const OATH_TIERS = [
  { n: 1,  label: "Étoile d'or" },
  { n: 3,  label: "Lauriers" },
  { n: 6,  label: "Chaînes de l'honneur" },
  { n: 10, label: "Couronne" },
  { n: 20, label: "Auréole" },
];

// Nom de l'unité (ex. « Canis Rex »), à afficher en petit à côté d'un surnom
export const unitNameOf = (i) => findUnit(i?.faction, i?.unitId)?.name || "";

export const nameOfItem = (i) => i?.nickname || findUnit(i?.faction, i?.unitId)?.name || "cette relique";

// Durée de la bougie : 3 semaines (personnage), 1 mois (unité), 2 mois (colosse)
export function candleDaysFor(item, ptsMap = {}) {
  if (isColossus(item, ptsMap)) return 60;
  const role = findUnit(item.faction, item.unitId)?.role;
  return (role === "QG" || role === "Seigneur de guerre") ? 21 : 30;
}

// Formule du serment, dans la voix de l'armée
const flavorOf = (f) => f === "IK" ? "knight" : (f === "TY" || f === "GC") ? "TY" : (f === "CSM" || f === "CK" || f === "LD") ? "chaos" : ["NC","AE","DR","TA","OR","LV"].includes(f) ? "xenos" : "imperial";
export function oathFormula(item) {
  const n = nameOfItem(item);
  return {
    imperial: `Je jure de consacrer ${n}. Que la Croisade en soit témoin.`,
    knight:   `Sur l'honneur de ma Maison, je jure de rendre ${n} à la guerre.`,
    TY:       `La Ruche exige ${n}. Je jure de l'éveiller.`,
    chaos:    `Par les Quatre, je jure de marquer ${n} de leur faveur.`,
    xenos:    `Sur les anciens registres, je jure d'achever ${n}.`,
  }[flavorOf(item.faction)];
}

// Les trois parchemins du jour (salt = 1 après « Brûler les parchemins »)
export function drawParchments(inventory = [], ptsMap = {}, dayKey = "", salt = 0) {
  const todo = inventory.filter(i => i.paintStatus !== "painted");
  if (!todo.length) return [];
  const pick = (arr, tag) => arr.length ? arr[hash(`${dayKey}:${salt}:${tag}`) % arr.length] : null;
  const used = new Set(); const out = [];
  const take = (it, kind, title, desc) => { if (it && !used.has(it.id)) { used.add(it.id); out.push({ item: it, kind, title, desc }); } };
  // Patience : déjà bien avancée (en cours, sinon apprêtée)
  const near = todo.filter(i => i.paintStatus === "wip"); const primed = todo.filter(i => i.paintStatus === "primed");
  take(pick(near.length ? near : primed, "patience"), "patience", "Serment de Patience", "Une victoire à portée de main");
  // Retour : la plus ancienne en attente (parmi les cinq plus anciennes, pour varier)
  const old = todo.filter(i => i.purchasedAt && !used.has(i.id)).sort((a, b) => String(a.purchasedAt).localeCompare(String(b.purchasedAt))).slice(0, 5);
  take(pick(old.length ? old : todo.filter(i => !used.has(i.id)), "retour"), "retour", "Serment du Retour", "Celle qui attend depuis le plus longtemps");
  // Grand serment : un colosse, sinon l'une des pièces les plus imposantes
  const pts = (i) => (ptsMap[`${i.faction}:${i.unitId}`] || POINTS_DB[findUnit(i.faction, i.unitId)?.name] || 0);
  const big = todo.filter(i => !used.has(i.id) && isColossus(i, ptsMap));
  const heavy = todo.filter(i => !used.has(i.id)).sort((a, b) => pts(b) - pts(a)).slice(0, 4);
  take(pick(big.length ? big : heavy, "grand"), "grand", "Grand Serment", "La pièce la plus redoutable");
  // Compléter si la pile est petite
  for (const i of todo) { if (out.length >= 3) break; take(i, "libre", "Serment", "Une relique de ta pile"); }
  return out;
}

// État de la bougie : { pct restant (0-1), daysLeft, asleep }
export function candleState(oath, now = Date.now()) {
  if (!oath) return null;
  const lit = new Date((oath.litAt || oath.sworn || "").slice(0,10) + "T00:00:00").getTime();
  const total = oath.candleDays
    ? oath.candleDays * DAY
    : Math.max(DAY, new Date((oath.deadline || oath.sworn) + "T23:59:59").getTime() - lit); // ancien serment à date
  const left = lit + total - now;
  return { pct: Math.max(0, Math.min(1, left / total)), daysLeft: Math.max(0, Math.ceil(left / DAY)), asleep: left <= 0 };
}

export const figsOfItem = (i) => getModelCount(findUnit(i.faction, i.unitId)?.name, i.qty || 1, i.modelCount);
