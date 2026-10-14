// ══════════════════════════════════════════════════════════
// LES TROPHÉES de la Salle des trophées (STATS)
// ══════════════════════════════════════════════════════════
// Une seule liste, calculée ici : STATS l'affiche, et App s'en sert pour annoncer un trophée
// par une courte cérémonie au moment où il se débloque (components/TrophyCeremony.jsx).
// Le NOM d'un trophée sert d'identifiant dans « trophiesSeen » : ne pas le renommer sans raison.
import { FACTIONS } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { findUnit } from '../data/units.jsx';
import { crusadeStartOf } from './utils.jsx';

const ENROL_DAYS = 7;        // période d'enrôlement (saisie de la collection)
const PURGE_MIN = 20;        // Purge Totale : taille minimale de l'armée
const PERFECTION_MIN = 50;   // Perfection : taille minimale de la collection

// Jours restants de la période d'enrôlement (0 = terminée). Date illisible : rien n'est bloqué.
export function enrolDaysLeft(appState = {}) {
  if (!appState.firstOpenAt) return 0;
  const daysIn = Math.floor((Date.now() - new Date(String(appState.firstOpenAt).slice(0, 10) + "T00:00:00").getTime()) / 86400000);
  return Number.isFinite(daysIn) ? Math.max(0, ENROL_DAYS - daysIn) : 0;
}
export { ENROL_DAYS };

export function computeTrophies({ inventory = [], paintHistory = [], ptsMap = {}, appState = {} }) {
  const totalModels  = inventory.reduce((s,i) => { const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
  const totalPainted = inventory.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
  const factionsUsed = Object.keys(FACTIONS).filter(k => inventory.some(i => i.faction === k));
  // Purge Totale : une armée d'au moins PURGE_MIN figurines, entièrement peinte
  const factionFull = factionsUsed.some(k => { const its = inventory.filter(i=>i.faction===k); const m = its.reduce((s,i)=>{const u=findUnit(k, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0); const p = its.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{const u=findUnit(k, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0); return m>=PURGE_MIN && m===p; });
  // ── Période d'enrôlement ─────────────────────────────────────────
  // Les ENROL_DAYS premiers jours après la première ouverture, on saisit sa collection :
  // les trophées d'ÉTAT restent verrouillés (sinon quelques figurines déjà peintes entrées
  // d'abord donnent « Perfection » ou « Purge Totale » dès la première minute).
  const enrolLeft = enrolDaysLeft(appState);
  const enrolProg = enrolLeft > 0 ? `disponible dans ${enrolLeft} jour${enrolLeft > 1 ? "s" : ""}` : null;
  const stateOk = (cond) => enrolLeft === 0 && cond;
  // ── Début de Croisade ────────────────────────────────────────────
  // Les trophées d'EFFORT (peindre X figurines / X points / un Titan)
  // ne comptent que ce qui a été consacré depuis cette date, pour ne pas
  // être débloqués d'un coup par une collection déjà peinte importée.
  // Les trophées d'ÉTAT (nb d'armées, faction à 100%, Perfection) gardent
  // la collection entière : ils décrivent ce que tu possèdes, pas ton effort.
  const crusadeStart = crusadeStartOf(appState, paintHistory);
  const sinceEntries = (paintHistory||[]).filter(h => {
    const when = h.day || (h.date ? h.date+"-01" : null);
    return when && when >= crusadeStart;
  }).map(h => ({ h, it: inventory.find(i=>i.id===h.id) })).filter(x => x.it);
  const figsOfItem = (it) => { const u=findUnit(it.faction, it.unitId); return getModelCount(u?.name, it.qty||1, it.modelCount); };
  const paintedSince = sinceEntries.reduce((s,{it}) => s + figsOfItem(it), 0);
  const paintedPtsSince = sinceEntries.reduce((s,{it}) => { const u=findUnit(it.faction, it.unitId); const k=`${it.faction}:${it.unitId}`; return s+(ptsMap[k]!=null?ptsMap[k]:(POINTS_DB[u?.name]||0))*(it.qty||1); }, 0);
  const hasTitanSince = sinceEntries.some(({it}) => { const u=findUnit(it.faction, it.unitId); return u && (u.role==="Titanique" || (POINTS_DB[u.name]||0) >= 400); });
  // meilleur mois (déjà limité à l'activité enregistrée, recadré sur la croisade)
  const byMonth = {};
  sinceEntries.forEach(({h,it}) => { if(h.date){ byMonth[h.date]=(byMonth[h.date]||0)+figsOfItem(it); } });
  const bestMonth = Math.max(0, ...Object.values(byMonth), 0);
  const oathKept = (appState.oathRecord?.kept)||0;
  const badges = [
    { icon:"✠", name:"Première Consécration", desc:"Peindre ta première figurine", got: paintedSince >= 1, prog:`${Math.min(paintedSince,1)}/1` },
    { icon:"⚜", name:"Fondateur", desc:"Rassembler 5 armées", got: stateOk(factionsUsed.length >= 5), prog: enrolProg || `${Math.min(factionsUsed.length,5)}/5 armées` },
    { icon:"svg:paintbrush", name:"Artisan", desc:"50 figurines peintes", got: paintedSince >= 50, prog:`${Math.min(paintedSince,50)}/50` },
    { icon:"♛", name:"Maître Peintre", desc:"150 figurines peintes", got: paintedSince >= 150, prog:`${Math.min(paintedSince,150)}/150` },
    { icon:"†", name:"Titanicus", desc:"Peindre un Titan ou super-lourd (400+ pts)", got: hasTitanSince },
    { icon:"◉", name:"Purge Totale", desc:`Une armée d'au moins ${PURGE_MIN} figurines peinte à 100%`, got: stateOk(factionFull), prog: enrolProg },
    { icon:"❖", name:"Marathon", desc:"10 figurines en un seul mois", got: bestMonth >= 10, prog:`record : ${bestMonth}/10 en un mois` },
    { icon:"✷", name:"Forge Ardente", desc:"25 figurines en un seul mois", got: bestMonth >= 25, prog:`record : ${bestMonth}/25 en un mois` },
    { icon:"⚔", name:"Croisé", desc:"5 000 points peints", got: paintedPtsSince >= 5000, prog:`${paintedPtsSince.toLocaleString('fr')}/5 000 pts` },
    { icon:"⌂", name:"Archiviste", desc:"10 armées différentes", got: stateOk(factionsUsed.length >= 10), prog: enrolProg || `${Math.min(factionsUsed.length,10)}/10 armées` },
    { icon:"☩", name:"Serment Tenu", desc:"Honorer un serment de croisade", got: oathKept >= 1 },
    { icon:"✪", name:"Perfection", desc:`Collection entière à 100% (au moins ${PERFECTION_MIN} figurines)`, got: stateOk(totalModels >= PERFECTION_MIN && totalPainted === totalModels), prog: enrolProg || `${totalPainted}/${Math.max(totalModels, PERFECTION_MIN)} figurines` },
    { icon:"↻", name:"Assidu", desc:"7 jours de mission d'affilée", got: (appState.missionBest||0) >= 7, prog:`record : ${appState.missionBest||0}/7 jours` },
    { icon:"✛", name:"Dévotion", desc:"10 missions du jour accomplies", got: (appState.missionTotal||0) >= 10, prog:`${Math.min(appState.missionTotal||0,10)}/10 missions` },
    { icon:"❄", name:"Veilleur de l'Avent", desc:"Ouvrir les 24 portes du calendrier de l'Avent", got: (appState.adventDone||[]).length > 0, prog:`${Object.keys(appState.advent?.opened||{}).length}/24 portes` },
    { icon:"†", name:"Litanie Sans Fin", desc:"50 missions du jour accomplies", got: (appState.missionTotal||0) >= 50, prog:`${Math.min(appState.missionTotal||0,50)}/50 missions` },
  ];
  // Un trophée gagné reste gagné : déjà annoncé (« trophiesSeen »), il ne se reperd plus si la
  // collection change (nouvelle boîte non peinte, armée vendue…).
  const seen = new Set(Array.isArray(appState.trophiesSeen) ? appState.trophiesSeen : []);
  return badges.map(b => (!b.got && seen.has(b.name)) ? { ...b, got: true } : b);
}
