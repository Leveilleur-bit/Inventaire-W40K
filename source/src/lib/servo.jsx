// ══════════════════════════════════════════════════════════
// LE SERVO-CRÂNE ASSISTANT : réponses, inspection, nouvelles
// ══════════════════════════════════════════════════════════
// Tout est calculé à partir de la collection, sur le téléphone : rien n'est envoyé ailleurs.
// Le panneau (components/ServoAssistant.jsx) affiche ces réponses ; le servo-crâne qui traverse
// l'Accueil (components/ServoSkull.jsx) apporte la « nouvelle » du jour quand il y en a une.
import { FACTIONS, FACTION_TITLES, factionTitle } from '../data/factions.jsx';
import { AMBIGUOUS_UNITS, POINTS_DB, getModelCount } from '../data/points.jsx';
import { PAINT_STATUS, findUnit } from '../data/units.jsx';
import { candleState } from './oaths.jsx';
import { chaplainCounsel } from './counsel.jsx';

const formula = (o) => String(o?.label || "sans formule").replace(/[.\s]+$/, "");
const fmt = (n) => Number(n || 0).toLocaleString("fr");
const statusLabel = (s) => (PAINT_STATUS[s]?.label || "en attente").toLowerCase();
const nameOf = (i, u) => i.nickname ? `${i.nickname} (${u?.name || "relique"})` : (u?.name || "Relique inconnue");
const armyOf = (faction, listNames = {}) => listNames[faction] || FACTIONS[faction]?.label || "ton armée";
const ptsOfItem = (i, u, ptsMap) => (ptsMap[`${i.faction}:${i.unitId}`] || (u ? POINTS_DB[u.name] : 0) || 0) * (i.qty || 1);
const figsOf = (i, u) => getModelCount(u?.name, i.qty || 1, i.modelCount);

// Date d'arrivée d'une relique : la date d'achat si elle est connue, sinon la date d'ajout,
// lisible dans l'identifiant (Date.now() × 1000 au moment de l'ajout).
function arrivalOf(i) {
  if (i.purchasedAt) { const d = new Date(String(i.purchasedAt).length === 7 ? i.purchasedAt + "-15" : i.purchasedAt); if (!isNaN(d)) return { date: d, bought: true }; }
  const n = Number(i.id);
  if (n > 1e15) { const d = new Date(Math.floor(n / 1000)); if (!isNaN(d)) return { date: d, bought: false }; }
  return null;
}
const monthsSince = (d) => Math.max(0, Math.round((Date.now() - d.getTime()) / (30.44 * 86400000)));

// ── Les factions présentes dans la collection, dans l'ordre choisi dans le CODEX ──
export function ownedArmies(inventory = [], armyOrder = null) {
  const keys = Object.keys(FACTIONS).filter(k => inventory.some(i => i.faction === k));
  if (Array.isArray(armyOrder)) keys.sort((a, b) => (armyOrder.indexOf(a) + 1 || 99) - (armyOrder.indexOf(b) + 1 || 99));
  return keys;
}

// ── « Que dois-je peindre ? » ──
export function answerNext({ inventory, ptsMap = {}, oath, fateChoice, listNames }) {
  const c = chaplainCounsel({ inventory, ptsMap, oath, fateChoice, listNames });
  if (!c) return { text: "Analyse terminée. Plus rien à consacrer : toute la collection est peinte. Ce servo-crâne est… ému.", open: null };
  const army = armyOf(c.faction, listNames);
  const pts = c.pts ? `${fmt(c.pts)} points` : null;
  const why = {
    oath:      "Motif : ton serment est en cours. Un serment passe avant tout.",
    fate:      "Motif : ordre du Dé du Destin, accepté par tes soins.",
    complete:  `Motif : dernière relique de ${army}. Après elle, armée consacrée à 100 %.`,
    promotion: `Motif : ${pts}, de quoi faire passer ${army} au rang « ${c.rank} ».`,
    progress:  c.rank ? `Motif : ${pts ? pts + ". " : ""}Ensuite, il ne manquera que ${fmt(c.gap)} points à ${army} pour le rang « ${c.rank} ».`
                      : `Motif : ${pts ? pts + " de plus pour " + army : army + " l'attend"}.`,
  }[c.kind];
  const started = c.item.paintStatus === "wip" ? " Déjà sur l'établi : il suffit de l'achever." : "";
  return { text: `Recommandation : ${c.name}. ${why}${started}`, open: { faction: c.faction, itemId: c.item.id } };
}

// ── « Où en est mon armée ? » ──
export function answerArmy({ faction, inventory, ptsMap = {}, listNames }) {
  const its = inventory.map(i => ({ i, u: findUnit(i.faction, i.unitId) })).filter(x => x.i.faction === faction && x.u);
  if (!its.length) return { text: "Aucune relique enregistrée pour cette armée.", open: null };
  const painted = its.filter(x => x.i.paintStatus === "painted");
  const ptsAll = its.reduce((s, x) => s + ptsOfItem(x.i, x.u, ptsMap), 0);
  const ptsDone = painted.reduce((s, x) => s + ptsOfItem(x.i, x.u, ptsMap), 0);
  const figsAll = its.reduce((s, x) => s + figsOf(x.i, x.u), 0);
  const figsDone = painted.reduce((s, x) => s + figsOf(x.i, x.u), 0);
  const pct = figsAll ? Math.round(100 * figsDone / figsAll) : 0;
  const rank = factionTitle(faction, ptsDone);
  const next = (FACTION_TITLES[faction] || []).find(([min]) => min > ptsDone);
  const todo = its.length - painted.length;
  const lines = [
    `${armyOf(faction, listNames)} : ${fmt(ptsDone)} points consacrés sur ${fmt(ptsAll)}.`,
    `Figurines peintes : ${figsDone} sur ${figsAll} (${pct} %).`,
    rank ? `Rang : « ${rank} ».${next ? ` Prochain rang, « ${next[1]} », dans ${fmt(next[0] - ptsDone)} points.` : " Rang maximal atteint."}` : null,
    todo ? `Reste à peindre : ${todo} relique${todo > 1 ? "s" : ""}.` : "Plus rien à peindre. Armée entièrement consacrée.",
  ].filter(Boolean);
  return { text: lines.join(" "), open: null };
}

// ── « Où en est mon serment ? » ──
export function answerOath({ oath, inventory }) {
  if (!oath) return { text: "Aucun serment en cours. Tu peux en prêter un depuis l'Accueil, rubrique « Prêter serment ».", open: null };
  const c = candleState(oath);
  const it = oath.unitId != null ? inventory.find(i => i.id === oath.unitId) : null;
  const u = it ? findUnit(it.faction, it.unitId) : null;
  const candle = c ? (c.asleep ? "La bougie s'est éteinte : le serment attend que tu la rallumes." : `Bougie : ${c.daysLeft} jour${c.daysLeft > 1 ? "s" : ""} avant extinction.`) : "";
  if (it) {
    const done = it.paintStatus === "painted";
    return { text: `Serment en cours : « ${formula(oath)} ». Relique : ${nameOf(it, u)}, statut ${statusLabel(it.paintStatus)}. ${done ? "Elle est peinte : le serment est tenu." : candle}`, open: { faction: it.faction, itemId: it.id } };
  }
  return { text: `Serment en cours : « ${formula(oath)} »${oath.target ? `, ${oath.target} figurine${oath.target > 1 ? "s" : ""} à peindre` : ""}. ${candle}`, open: null };
}

// ── « Qui attend depuis le plus longtemps ? » ──
export function answerOldest({ inventory }) {
  const waiting = inventory.filter(i => i.paintStatus !== "painted").map(i => ({ i, a: arrivalOf(i) })).filter(x => x.a);
  if (!waiting.length) return { text: inventory.some(i => i.paintStatus !== "painted") ? "Aucune date connue pour les reliques en attente. Renseigne les dates d'achat dans SHAME." : "Aucune relique n'attend. Tout est peint.", open: null };
  waiting.sort((x, y) => x.a.date - y.a.date);
  const { i, a } = waiting[0];
  const u = findUnit(i.faction, i.unitId);
  const m = monthsSince(a.date);
  const when = `${String(a.date.getMonth() + 1).padStart(2, "0")}/${a.date.getFullYear()}`;
  const since = m >= 1 ? `depuis ${m} mois` : "depuis moins d'un mois";
  return { text: `Doyen de la pile : ${nameOf(i, u)}. Il attend ${since} (${a.bought ? "acquis" : "ajouté"} en ${when}). Statut : ${statusLabel(i.paintStatus)}. Patience admirable. La sienne, pas la tienne.`, open: { faction: i.faction, itemId: i.id } };
}

// ── Inspection du Munitorum ──
// Renvoie des rubriques { key, title, hint, items: [{ label, sub, open | nav }] } ; vide = rien à signaler.
export function inspection({ inventory = [], ptsMap = {}, wishlist = [], orphanInventory = [] }) {
  const known = inventory.map(i => ({ i, u: findUnit(i.faction, i.unitId) })).filter(x => x.u);
  const item = (x, sub) => ({ label: nameOf(x.i, x.u), sub: sub ?? (FACTIONS[x.i.faction]?.label || ""), open: { faction: x.i.faction, itemId: x.i.id } });
  const manual = (x) => ptsMap[`${x.i.faction}:${x.i.unitId}`] != null;
  const out = [];
  const noPts = known.filter(x => !manual(x) && !(POINTS_DB[x.u.name] > 0));
  if (noPts.length) out.push({ key: "nopts", title: "Sans valeur en points", hint: "Comptées pour 0 dans les totaux. Corrige les points depuis la fiche.", items: noPts.map(x => item(x)) });
  const amb = known.filter(x => !manual(x) && AMBIGUOUS_UNITS.has(x.u.name));
  if (amb.length) out.push({ key: "amb", title: "Points incertains", hint: "Valeur à vérifier dans le MFM (fourchette ou conflit). Touche la relique pour corriger.", items: amb.map(x => item(x, `${FACTIONS[x.i.faction]?.label || ""} · ${fmt(POINTS_DB[x.u.name])} pts`)) });
  const noPhoto = known.filter(x => x.i.paintStatus === "painted" && !x.i.photo);
  if (noPhoto.length) out.push({ key: "nophoto", title: "Peintes, sans photo", hint: "Elles apparaîtront sans image dans les cérémonies et la Parade.", items: noPhoto.map(x => item(x)) });
  const noDate = known.filter(x => x.i.paintStatus !== "painted" && !x.i.purchasedAt);
  if (noDate.length) out.push({ key: "nodate", title: "En attente, sans date d'achat", hint: "La Pile of Shame ne peut pas dire depuis quand elles attendent.", items: noDate.map(x => item(x, `${FACTIONS[x.i.faction]?.label || ""} · ${statusLabel(x.i.paintStatus)}`)) });
  const owned = new Set(inventory.map(i => `${i.faction}:${i.unitId}`));
  const dupWish = wishlist.filter(w => owned.has(`${w.faction}:${w.unitId}`));
  if (dupWish.length) out.push({ key: "wish", title: "Wishlist : déjà dans ta collection", hint: "Peut-être voulu (une deuxième escouade). Sinon, à retirer de la Wishlist.", items: dupWish.map(w => ({ label: findUnit(w.faction, w.unitId)?.name || "Unité", sub: FACTIONS[w.faction]?.label || "", nav: "wishlist" })) });
  if (orphanInventory.length) out.push({ key: "orphans", title: "Reliques mises de côté", hint: "Leur unité n'existe plus dans l'app. À rattacher depuis le CODEX.", items: orphanInventory.map(o => ({ label: o.nickname || "Relique sans unité", sub: `${FACTIONS[o.faction]?.label || ""} · réf. ${o.unitId}`, nav: "codex" })) });
  return out;
}

// ── La nouvelle du jour, apportée par le servo-crâne qui traverse l'Accueil ──
// Au plus une par jour (App retient le jour dans « servoNewsDay »). null s'il n'y a rien d'important.
export function servoNews({ inventory = [], ptsMap = {}, oath, fateChoice, listNames }) {
  if (oath) {
    const c = candleState(oath);
    const it = oath.unitId != null ? inventory.find(i => i.id === oath.unitId) : null;
    if (c && !c.asleep && c.daysLeft <= 3 && (!it || it.paintStatus !== "painted")) {
      const u = it ? findUnit(it.faction, it.unitId) : null;
      return { key: "oath", text: `Alerte : la bougie du serment s'éteint dans ${c.daysLeft} jour${c.daysLeft > 1 ? "s" : ""}.${it ? ` ${nameOf(it, u)} attend.` : ""}`, open: it ? { faction: it.faction, itemId: it.id } : null };
    }
  }
  const c = chaplainCounsel({ inventory, ptsMap, oath: null, fateChoice: null, listNames });
  if (c && c.kind === "complete") return { key: "complete", text: `Rapport : ${armyOf(c.faction, listNames)} n'est plus qu'à une relique de la consécration totale. ${c.name}.`, open: { faction: c.faction, itemId: c.item.id } };
  if (c && c.kind === "promotion" && c.item.paintStatus === "wip") return { key: "promotion", text: `Rapport : achever ${c.name} ferait passer ${armyOf(c.faction, listNames)} au rang « ${c.rank} ».`, open: { faction: c.faction, itemId: c.item.id } };
  return null;
}
