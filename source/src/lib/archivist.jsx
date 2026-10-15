// ══════════════════════════════════════════════════════════
// L'ARCHIVISTE : une entrée par jour pour la carte de l'Accueil
// ══════════════════════════════════════════════════════════
// Un jour sur deux, un souvenir tiré de la collection (archives) ; l'autre jour, un fragment de
// lore, de préférence sur une armée possédée. Pendant l'enrôlement, seulement du lore : les
// archives n'ont pas encore de sens. Tout est déterministe pour la journée (même texte toute la journée).
import { FACTIONS } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { findUnit } from '../data/units.jsx';
import { LORE_BY_FACTION, LORE_GENERAL } from '../data/archives.jsx';

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const longDate = (d) => { const [y, m, j] = d.split("-").map(Number); return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${y}`; };
const monthYear = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MOIS[m - 1]} ${y}`; };
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

// Date d'entrée d'une relique : son identifiant contient l'instant de création (uid), sinon la date d'achat
function addedDay(it) {
  const n = Number(it.id);
  if (Number.isFinite(n) && n > 1.5e15) { const d = new Date(n / 1000); if (d.getFullYear() > 2015) return d.toISOString().slice(0, 10); }
  if (it.purchasedAt) return (it.purchasedAt.length === 7 ? it.purchasedAt + "-01" : it.purchasedAt);
  return null;
}

export function archivistEntry({ appState, ptsMap = {}, today, enrolling }) {
  const inv = appState.inventory || [];
  const hist = appState.paintHistory || [];
  const names = appState.listNames || {};
  const dayNum = Math.floor(new Date(today + "T12:00:00").getTime() / 86400000);
  const pick = (arr, salt = 0) => arr[(dayNum * 7 + salt) % arr.length];
  const nameOf = (it) => it.nickname || findUnit(it.faction, it.unitId)?.name || "une relique";
  const armyOf = (f) => names[f] || FACTIONS[f]?.label || "ton armée";
  const figs = (it) => getModelCount(findUnit(it.faction, it.unitId)?.name, it.qty || 1, it.modelCount);
  const pts = (it) => { const u = findUnit(it.faction, it.unitId); return (ptsMap[`${it.faction}:${it.unitId}`] ?? POINTS_DB[u?.name] ?? 0) * (it.qty || 1); };

  // ── Lore ──
  const owned = [...new Set(inv.map(i => i.faction))].filter(f => LORE_BY_FACTION[f]);
  const lore = () => {
    const useFaction = owned.length && (dayNum % 3 !== 0);
    if (useFaction) {
      const f = pick(owned, 3);
      return { kind: "lore", label: `Lore · ${FACTIONS[f]?.label || ""}`, text: pick(LORE_BY_FACTION[f], 5) };
    }
    return { kind: "lore", label: "Lore", text: pick(LORE_GENERAL, 1) };
  };
  if (enrolling || dayNum % 2 === 0) return lore();

  // ── Archives : souvenirs possibles aujourd'hui ──
  const items = [];
  const byId = new Map(inv.map(i => [i.id, i]));
  const dated = hist.filter(h => h.day && byId.has(h.id));
  const md = today.slice(5);
  // Anniversaire d'une consécration
  dated.filter(h => h.day.slice(5) === md && h.day < today).forEach(h => {
    const n = Number(today.slice(0, 4)) - Number(h.day.slice(0, 4));
    items.push({ prio: 3, text: `Il y a ${n} an${n > 1 ? "s" : ""} jour pour jour, tu consacrais ${nameOf(byId.get(h.id))}. ${armyOf(byId.get(h.id).faction)} s'en souvient.` });
  });
  // Une consécration passée (au moins un mois)
  const old = dated.filter(h => daysBetween(h.day, today) >= 30);
  if (old.length) { const h = pick(old, 11); const it = byId.get(h.id);
    items.push({ prio: 1, text: `Le ${longDate(h.day)}, ${nameOf(it)} recevait sa consécration. Les registres de ${armyOf(it.faction)} en gardent la trace.` }); }
  // Première consécration inscrite
  if (dated.length >= 5) { const h = [...dated].sort((a, b) => a.day.localeCompare(b.day))[0];
    items.push({ prio: 1, text: `Première consécration inscrite au registre : ${nameOf(byId.get(h.id))}, le ${longDate(h.day)}. Tout a commencé là.` }); }
  // Record mensuel
  const byMonth = {};
  hist.forEach(h => { const it = byId.get(h.id); const ym = h.date || (h.day || "").slice(0, 7); if (it && ym) byMonth[ym] = (byMonth[ym] || 0) + figs(it); });
  const best = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 3) items.push({ prio: 1, text: `Ton record tient toujours : ${best[1]} figurines consacrées en ${monthYear(best[0])}. Le registre attend qu'on le batte.` });
  // Le doyen de la pile
  const waiting = inv.filter(i => i.paintStatus !== "painted").map(i => ({ i, d: addedDay(i) })).filter(x => x.d).sort((a, b) => a.d.localeCompare(b.d));
  if (waiting.length) { const { i, d } = waiting[0]; const n = daysBetween(d, today);
    if (n >= 60) items.push({ prio: 2, text: `${nameOf(i)} attend depuis ${n} jours. C'est le doyen de ta pile : l'Archiviste l'a noté, sans juger.` }); }
  // Croissance récente d'une armée
  const recent = {};
  inv.forEach(i => { const d = addedDay(i); if (d && daysBetween(d, today) <= 90) recent[i.faction] = (recent[i.faction] || 0) + 1; });
  const grow = Object.entries(recent).sort((a, b) => b[1] - a[1])[0];
  if (grow && grow[1] >= 2) items.push({ prio: 1, text: `${armyOf(grow[0])} a accueilli ${grow[1]} nouvelles reliques en trois mois.` });
  // Poids de la collection
  const total = inv.reduce((s, i) => s + pts(i), 0);
  if (total >= 2000) items.push({ prio: 0, text: `Ta collection pèse ${total.toLocaleString("fr")} points : de quoi aligner ${Math.floor(total / 2000)} armée${total >= 4000 ? "s" : ""} de 2 000 points.` });
  // Depuis le 1er janvier
  const y = today.slice(0, 4);
  const thisYear = hist.filter(h => (h.day || h.date || "").startsWith(y)).reduce((s, h) => { const it = byId.get(h.id); return s + (it ? figs(it) : 0); }, 0);
  if (thisYear >= 1) items.push({ prio: 0, text: `Depuis le 1er janvier, ${thisYear} figurine${thisYear > 1 ? "s" : ""} consacrée${thisYear > 1 ? "s" : ""}. L'année n'est pas finie.` });

  if (!items.length) return lore();
  const top = Math.max(...items.map(x => x.prio));
  const pool = top >= 3 ? items.filter(x => x.prio === 3) : items;   // un anniversaire passe avant tout
  return { kind: "archive", label: "Des archives", text: pick(pool, 17).text };
}
