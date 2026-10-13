// ══════════════════════════════════════════════════════════
// TITRES HONORIFIQUES DES FIGURINES
// ══════════════════════════════════════════════════════════
// Calculés à partir de l'historique : rien à saisir. Seules les figurines peintes en portent.
import { findUnit } from '../data/units.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';

const DAY = 86400000;
const toDate = (s) => { if (!s) return null; const t = String(s); const d = new Date((t.length === 7 ? t + "-15" : t.slice(0,10)) + "T12:00:00"); return isNaN(d) ? null : d; };
const MILESTONES = [[50,"Le Cinquantième"],[100,"Le Centième"],[200,"Le Deux-centième"],[300,"Le Trois-centième"],[500,"Le Cinq-centième"],[1000,"Le Millième"]];

// Renvoie une Map : id de relique → [{ key, label, desc }]
export function computeHonors(inventory, paintHistory, ptsMap = {}) {
  const byId = new Map((inventory||[]).map(i => [i.id, i]));
  const isPainted = (id) => byId.get(id)?.paintStatus === "painted";
  const unitOf = (i) => findUnit(i.faction, i.unitId);
  const unitPts = (i) => ptsMap[`${i.faction}:${i.unitId}`] || POINTS_DB[unitOf(i)?.name] || 0;
  const figs = (i) => getModelCount(unitOf(i)?.name, i.qty || 1, i.modelCount);

  const first = {}, last = {};
  (paintHistory||[]).forEach(h => {
    const d = h.day || (h.date ? h.date + "-15" : null); if (!d) return;
    if (!first[h.id] || d < first[h.id]) first[h.id] = d;
    if (!last[h.id] || d > last[h.id]) last[h.id] = d;
  });

  const out = new Map();
  const add = (id, key, label, desc) => { if (!isPainted(id)) return; if (!out.has(id)) out.set(id, []); out.get(id).push({ key, label, desc }); };

  // Ordre de consécration des figurines encore peintes
  const seen = new Set(), order = [];
  (paintHistory||[]).forEach((h, idx) => { if (seen.has(h.id) || !isPainted(h.id) || !first[h.id]) return; seen.add(h.id); order.push({ id: h.id, d: first[h.id], idx }); });
  order.sort((a, b) => a.d.localeCompare(b.d) || a.idx - b.idx);

  // Le Premier (par armée) et les paliers (50e, 100e… figurine peinte, toutes armées)
  const firstOfFaction = new Set(); let total = 0, m = 0;
  order.forEach(({ id }) => {
    const it = byId.get(id);
    if (!firstOfFaction.has(it.faction)) { firstOfFaction.add(it.faction); add(id, "premier", "Le Premier", "La toute première figurine peinte de son armée."); }
    const before = total; total += figs(it);
    while (m < MILESTONES.length && before < MILESTONES[m][0] && total >= MILESTONES[m][0]) {
      add(id, "palier" + MILESTONES[m][0], MILESTONES[m][1], `Elle a porté ta collection à ${MILESTONES[m][0]} figurines peintes.`); m++;
    }
  });

  const now = Date.now();
  (inventory||[]).forEach(i => {
    if (i.paintStatus !== "painted") return;
    const paintedOn = toDate(last[i.id] || i.paintedAt);
    if (paintedOn && now - paintedOn.getTime() >= 365 * DAY) add(i.id, "veteran", "Vétéran", "Peinte depuis plus d'un an.");
    const bought = toDate(i.purchasedAt), consecrated = toDate(first[i.id] || i.paintedAt);
    if (bought && consecrated && consecrated - bought >= 365 * DAY) add(i.id, "revenant", "Le Revenant", "Restée plus d'un an sur grappe avant d'être peinte.");
    if (i.fateChosen) add(i.id, "destin", "Élu du Destin", "Peinte alors que le Dé du Destin l'avait désignée.");
    if (i.oathKept) add(i.id, "serment", "Serment Tenu", "Peinte pour honorer un serment de Croisade.");
  });

  // Le Colosse : la plus grosse pièce peinte de chaque armée (250 pts minimum par figurine)
  const best = {};
  (inventory||[]).forEach(i => { if (i.paintStatus !== "painted") return; const p = unitPts(i); if (p >= 250 && (!best[i.faction] || p > best[i.faction].p)) best[i.faction] = { id: i.id, p }; });
  Object.values(best).forEach(({ id }) => add(id, "colosse", "Le Colosse", "La plus imposante pièce peinte de son armée."));

  return out;
}
