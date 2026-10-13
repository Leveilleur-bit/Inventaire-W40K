// ══════════════════════════════════════════════════════════
// LES COLOSSES : Titans, super-lourds et grands Chevaliers
// ══════════════════════════════════════════════════════════
// Automatiquement : 300 points ou plus PAR FIGURINE, ou un grand Chevalier (tous sauf les
// Armigers, quels que soient leurs points : les mises à jour MFM ne les font pas basculer).
// Sur la fiche d'une relique, l'interrupteur « Colosse » force oui ou non (item.colosse).
import { findUnit } from '../data/units.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';

export const COLOSSUS_MIN_PTS = 300;
const BIG_ROLES = new Set(["Titanique", "Seigneur de guerre", "Chevalier Questoris", "Chevalier Cerastus", "Chevalier Acastus", "Chevalier Dominus"]);

export function isColossusAuto(item, ptsMap = {}) {
  const u = findUnit(item.faction, item.unitId);
  if (!u) return false;
  if (BIG_ROLES.has(u.role)) return true;
  const unitPts = ptsMap[`${item.faction}:${item.unitId}`] || POINTS_DB[u.name] || 0;
  const perBox = getModelCount(u.name, 1, item.modelCount) || 1;
  return unitPts / perBox >= COLOSSUS_MIN_PTS;
}
export function isColossus(item, ptsMap = {}) {
  if (item.colosse === true) return true;
  if (item.colosse === false) return false;
  return isColossusAuto(item, ptsMap);
}
// { total, painted } : nombre de colosses dans la collection
export function colossusCount(inventory = [], ptsMap = {}) {
  let total = 0, painted = 0;
  inventory.forEach(i => { if (isColossus(i, ptsMap)) { const n = i.qty || 1; total += n; if (i.paintStatus === "painted") painted += n; } });
  return { total, painted };
}
