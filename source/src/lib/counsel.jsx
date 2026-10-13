// ══════════════════════════════════════════════════════════
// LE CONSEIL DE L'ARCHIVISTE (carte de l'Accueil) : quelle relique peindre ensuite, et pourquoi
// ══════════════════════════════════════════════════════════
// Rien à saisir : le conseil se déduit de la collection. Ordre de priorité :
//   1. le serment en cours (parole donnée) ;
//   2. l'ordre du Dé du Destin accepté ;
//   3. la dernière relique à peindre d'une armée (elle la porte à 100 %) ;
//   4. une relique qui fait monter son armée d'un rang ;
//   5. sinon, celle qui rapproche le plus une armée de son prochain rang.
// À égalité, on préfère ce qui est déjà commencé (en cours, puis apprêté), puis le moins de points.
// Le conseil ne dépend que de la collection : il ne change pas d'une ouverture à l'autre tant
// que rien n'est peint.
import { FACTIONS, FACTION_TITLES, factionTitle } from '../data/factions.jsx';
import { POINTS_DB } from '../data/points.jsx';
import { findUnit } from '../data/units.jsx';

const STARTED = { wip: 0, primed: 1 };                 // déjà sur l'établi d'abord
const started = (i) => STARTED[i.paintStatus] ?? 2;

// Prochain palier de rang d'une armée : { min, label } ou null (rang maximal, ou armée sans rangs)
function nextRank(faction, pts) {
  const next = (FACTION_TITLES[faction] || []).find(([min]) => min > pts);
  return next ? { min: next[0], label: next[1] } : null;
}

// Renvoie null s'il n'y a rien à conseiller (collection vide ou entièrement peinte), sinon
// { item, unit, faction, kind, name, army, pts, rank, gap } — le texte est composé par l'Accueil.
export function chaplainCounsel({ inventory = [], ptsMap = {}, oath = null, fateChoice = null, listNames = {} }) {
  const known = inventory.map(i => ({ i, u: findUnit(i.faction, i.unitId) })).filter(x => x.u);
  const ptsOf = ({ i, u }) => (ptsMap[`${i.faction}:${i.unitId}`] || POINTS_DB[u.name] || 0) * (i.qty || 1);
  const todo = known.filter(x => x.i.paintStatus !== "painted");
  if (!todo.length) return null;

  const paintedPts = {}, left = {}, paintedCount = {};
  known.forEach(x => {
    const f = x.i.faction;
    if (x.i.paintStatus === "painted") { paintedPts[f] = (paintedPts[f] || 0) + ptsOf(x); paintedCount[f] = (paintedCount[f] || 0) + 1; }
    else left[f] = (left[f] || 0) + 1;
  });

  const out = (x, kind, extra = {}) => ({
    item: x.i, unit: x.u, faction: x.i.faction, kind, pts: ptsOf(x),
    name: x.i.nickname || x.u.name,
    army: listNames[x.i.faction] || FACTIONS[x.i.faction]?.label || "",
    ...extra,
  });
  const best = (list, score) => list.slice().sort((a, b) => started(a.i) - started(b.i) || score(a) - score(b) || String(a.i.id).localeCompare(String(b.i.id)))[0];

  // 1. Serment en cours sur une relique précise
  const sworn = oath?.unitId != null && todo.find(x => x.i.id === oath.unitId);
  if (sworn) return out(sworn, "oath");
  // 2. Ordre du Dé du Destin
  const fated = fateChoice?.id != null && todo.find(x => x.i.id === fateChoice.id);
  if (fated) return out(fated, "fate");
  // 3. Dernière relique d'une armée déjà entamée
  const last = todo.filter(x => left[x.i.faction] === 1 && (paintedCount[x.i.faction] || 0) > 0);
  if (last.length) return out(best(last, ptsOf), "complete");
  // 4. Montée de rang
  const promo = todo.filter(x => { const p = ptsOf(x), b = paintedPts[x.i.faction] || 0; return p > 0 && factionTitle(x.i.faction, b + p) !== factionTitle(x.i.faction, b); });
  if (promo.length) { const x = best(promo, ptsOf); return out(x, "promotion", { rank: factionTitle(x.i.faction, (paintedPts[x.i.faction] || 0) + ptsOf(x)) }); }
  // 5. Ce qui rapproche le plus d'un rang (écart restant après l'avoir peinte)
  const gapOf = (x) => { const after = (paintedPts[x.i.faction] || 0) + ptsOf(x); const n = nextRank(x.i.faction, after); return n ? n.min - after : Infinity; };
  const x = best(todo, gapOf);
  const after = (paintedPts[x.i.faction] || 0) + ptsOf(x), n = nextRank(x.i.faction, after);
  return out(x, "progress", n ? { rank: n.label, gap: n.min - after } : {});
}
