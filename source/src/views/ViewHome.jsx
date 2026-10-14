import React, { useState, useEffect, useRef } from 'react';
import { CrusadeBlazon, EMBLEMES, EMBLEME_IDS, Emblem, FactionIcon, NavIcon } from '../components/heraldry.jsx';
import { ScrollGlyph, pageStyle } from '../components/ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { WEEKLY_CITATIONS, isoWeekKey, tarotForWeek } from '../data/lore.jsx';
import { AMBIGUOUS_UNITS, POINTS_DB, getModelCount } from '../data/points.jsx';
import { UNIT_BY_ID, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { compressPhoto, crusadeStartOf, localDay } from '../lib/utils.jsx';
import { RARITY, festivalFor, visitForDay } from '../data/events.jsx';
import { candleDaysFor, candleState, drawParchments, nameOfItem, oathFormula, unitNameOf } from '../lib/oaths.jsx';
import { playSfx, vibrate } from '../lib/sfx.jsx';
import { SeasonFX, seasonFor } from '../components/effects.jsx';
import { ImperialDate } from '../components/imperial.jsx';
import { ServoSkull } from '../components/ServoSkull.jsx';
import { colossusCount, isColossus } from '../lib/colossus.jsx';
import { randomName } from '../data/names.jsx';
import { TRIPLE_FESTIVALS, deckKeyFor, personalLine, tarotImage, tripleDraw, weeklyCard } from '../data/tarot.jsx';
import { chaplainCounsel } from '../lib/counsel.jsx';
import { servoNews } from '../lib/servo.jsx';
import { ENROL_DAYS, enrolDaysLeft } from '../lib/trophies.jsx';
import { ServoAssistant } from '../components/ServoAssistant.jsx';
import { AdventCard } from '../components/Advent.jsx';
import { IMG as SKULL_IMG } from '../components/ServoSkull.jsx';

// Bougie du serment : la cire baisse avec le temps ; éteinte, un filet de fumée
function OathCandle({ pct = 1, asleep = false }) {
  const h = 12 + 34 * pct;
  return (
    <svg width="26" height="62" viewBox="0 0 26 62" aria-hidden="true" style={{ flexShrink:0 }}>
      <defs><linearGradient id="oc-wax" x1="0" x2="1"><stop offset="0%" stopColor="#d8ccb0"/><stop offset="50%" stopColor="#f4ecd8"/><stop offset="100%" stopColor="#b8aa88"/></linearGradient></defs>
      <rect x="4" y="58" width="18" height="3" rx="1" fill="#8a6a30"/>
      <rect x="7" y={58 - h} width="12" height={h} rx="2" fill="url(#oc-wax)"/>
      <line x1="13" y1={58 - h} x2="13" y2={54 - h} stroke="#3a2a1a" strokeWidth="1.2"/>
      {!asleep && <ellipse cx="13" cy={48 - h} rx="3.6" ry="6.5" fill="#ffb040" style={{ transformOrigin:`13px ${54 - h}px`, animation:"flameFlicker 1.6s ease-in-out infinite" }}/>}
      {!asleep && <ellipse cx="13" cy={49 - h} rx="1.6" ry="3.4" fill="#fff4c8"/>}
      {asleep && <path d={`M13 ${53 - h} q-4 -6 0 -11 q4 -5 0 -10`} fill="none" stroke="#8a8a8a" strokeWidth="1" opacity="0.6"/>}
    </svg>
  );
}

export function ViewHome({ ready = true, onKeepLegacyOath, onSwearOathOn, onRelightOath, onReleaseOath, onBurnParchments, onCompleteMission, onUpdateNickname, onUpdatePhoto, onSetCrusade, onSetBlessing, onSwearOath, onResolveOath, openChronicle, inventory, appState, paintPct, totalModels, totalPainted, totalPts, onNav, homeBackground, onSetBackground, onOpenInInventory, confirm, onSetTarotWeek, lastExport, onExport, driveSynced, onSetBackupDismiss, onSetListName, listNames, onUpdatePurchased, onSetListGoal, listGoals, onSetPts, ptsMap, onServoNewsShown, onUpdatePaint, onMarkReviewed, onSetWeekMission, onSetAdvent }) {
  // Portée top-level de ViewHome : nécessaire ici (pas seulement dans l'IIFE de la
  // citation plus bas) car le bandeau "Aucun ordre en cours" du Dé du Destin s'en sert
  // aussi, plus loin dans le rendu. Avant ce correctif, ce bandeau référençait un
  // "unpainted" qui n'existait que dans la portée de l'IIFE de citation — undefined
  // ici, ce qui plantait l'app entière (ReferenceError) dès qu'aucun ordre du Dé du
  // Destin n'était actif (typiquement : un appareil/profil neuf, sans historique).
  const unpainted = Math.max(0, totalModels - totalPainted);
  // Tarot du Reliquaire : nouvelle lame chaque semaine, révélée automatiquement à la
  // toute première ouverture de l'app cette semaine-là — mais seulement après 2
  // semaines d'usage réel de l'app, pour ne pas noyer un nouvel arrivant sous les
  // fonctionnalités dès le premier jour. On se base sur firstOpenAt (marqueur dédié,
  // fixe), pas sur le Début de Croisade (réglable par l'utilisateur dans CODEX).
  const daysSinceFirstOpen = appState.firstOpenAt ? Math.floor((Date.now() - new Date(appState.firstOpenAt).getTime()) / 86400000) : 0;
  const tarotUnlocked = daysSinceFirstOpen >= 14;
  const currentWeekKey = isoWeekKey();
  // Lame de la semaine : même tirage qu'avant, habillée selon le jeu de ton armée, parfois renversée
  const thisWeekCard = weeklyCard(currentWeekKey, deckKeyFor(appState), tarotForWeek(currentWeekKey));
  const tarotPersonal = personalLine(thisWeekCard.numeral, { inventory, paintHistory: appState.paintHistory || [], fateChoice: appState.fateChoice, wishlist: appState.wishlist || [], ptsMap: ptsMap || {}, isColossus: (i) => isColossus(i, ptsMap || {}) });
  const [tarotImgOk, setTarotImgOk] = useState(true);   // illustration public/tarot/… présente ?
  const [tripleOpen, setTripleOpen] = useState(false);  // tirage en trois lames (fêtes)
  const isNewWeek = tarotUnlocked && appState.lastTarotWeek !== currentWeekKey;
  const [tarotOpen, setTarotOpen] = useState(isNewWeek);
  const [tarotFlipped, setTarotFlipped] = useState(!isNewWeek); // déjà vue cette semaine → pas de ré-animation
  useBackButton(tarotOpen, React.useCallback(() => setTarotOpen(false), []));
  const [servoOpen, setServoOpen] = useState(false);   // le servo-crâne convoqué (components/ServoAssistant.jsx)
  useBackButton(tripleOpen, React.useCallback(() => setTripleOpen(false), []));
  useEffect(() => {
    // Seulement une fois l'écran d'ouverture fermé : sinon le mélange et le retournement
    // se jouaient derrière lui, et on arrivait sur une lame déjà retournée.
    if (isNewWeek && ready) {
      // Les cartes se mélangent un instant, puis la lame se retourne toute seule
      const t = setTimeout(() => { setTarotFlipped(true); playSfx("carte"); }, 1700);
      return () => clearTimeout(t);
    }
  }, [isNewWeek, ready]);
  const closeTarot = () => { setTarotOpen(false); if (isNewWeek) onSetTarotWeek && onSetTarotWeek(currentWeekKey); };
  const crusade = appState.crusade || null;
  const bgTimer = useRef(null);
  const bgLongPress = useRef(false);
  const missionCamRef = useRef(null);
  const missionGalRef = useRef(null);
  const [missionDone, setMissionDone] = useState(null);
  useBackButton(!!missionDone, React.useCallback(() => setMissionDone(null), []));
  const [baptismItem, setBaptismItem] = useState(null);
  const [baptismName, setBaptismName] = useState("");
  const [missionChoice, setMissionChoice] = useState(false);
  const [missionDateVal, setMissionDateVal] = useState("");
  const [missionArmyName, setMissionArmyName] = useState("");
  const [missionGoalVal, setMissionGoalVal] = useState("");
  const [missionPtsVal, setMissionPtsVal] = useState("");
  const [reviewAdvance, setReviewAdvance] = useState(false);   // mission « revue de la pile » : choix du nouveau statut
  useBackButton(!!baptismItem, React.useCallback(() => setBaptismItem(null), []));
  useBackButton(missionChoice, React.useCallback(() => setMissionChoice(false), []));
  const openCrusadeEditor = () => {
    setHerName(crusade?.name||""); setHerShape(crusade?.shape||"heater");
    setHerSymbol(crusade?.symbol||"croix");
    setHerDivision(crusade?.division||"plain"); setHerMetal(crusade?.metal||"or");
    setHerMotto(crusade?.motto||"");
    setHerC1(crusade?.c1||"#7a1518"); setHerC2(crusade?.c2||"#0a0a0a");
    setHerOpen(true);
  };
  const [herOpen, setHerOpen] = useState(false);
  const [herName, setHerName] = useState("");
  const [herShape, setHerShape] = useState("heater");
  const [herSymbol, setHerSymbol] = useState("croix");
  const [herDivision, setHerDivision] = useState("plain");
  const [herMetal, setHerMetal] = useState("or");
  const [herMotto, setHerMotto] = useState("");
  const [herC1, setHerC1] = useState("#7a1518");
  const [herC2, setHerC2] = useState("#0a0a0a");
  useBackButton(herOpen, React.useCallback(() => setHerOpen(false), []));
  const [oathOpen, setOathOpen] = useState(false);
  const [oathPick, setOathPick] = useState(null);   // parchemin choisi (indice)
  useBackButton(oathOpen, React.useCallback(() => setOathOpen(false), []));
  // Citation — contextuelle si une situation le mérite, sinon hebdomadaire
  const dayNum = Math.round((new Date(localDay()+"T00:00:00").getTime() - new Date("2024-01-01T00:00:00").getTime()) / 86400000); // jour local (round : absorbe les changements d'heure)
  // Viviers des missions du jour : mémorisés. Avant, ils étaient recalculés sur tout
  // l'inventaire à chaque frappe dans n'importe quel champ de l'Accueil.
  const missionPools = React.useMemo(() => {
    const inv = appState.inventory || [];
    const photoPool = inv.filter(i => i.paintStatus !== "painted" && !i.photo && UNIT_BY_ID.has(i.unitId));
    const photoPaintedPool = inv.filter(i => i.paintStatus === "painted" && !i.photo && UNIT_BY_ID.has(i.unitId));
    const datePool = inv.filter(i => i.paintStatus !== "painted" && !i.purchasedAt && UNIT_BY_ID.has(i.unitId));
    // Baptême : seulement les personnages et colosses DÉJÀ PEINTS, pas encore nommés
    // (une figurine achevée mérite son nom ; les Armigers aussi, les escouades non).
    const baptismPool = inv.filter(i => {
      if (i.nickname || i.paintStatus !== "painted") return false;
      if (!UNIT_BY_ID.has(i.unitId)) return false;
      const u = findUnit(i.faction, i.unitId);
      return u?.role === "QG" || u?.role === "Seigneur de guerre" || u?.role === "Armiger" || isColossus(i, ptsMap || {});
    });
    // Armées possédant au moins une figurine peinte, mais toujours sur leur nom
    // générique (jamais personnalisées dans CROISADE).
    const armyPool = Object.keys(FACTIONS).filter(fKey => {
      if (listNames?.[fKey]) return false;
      return inv.some(i => i.faction===fKey && i.paintStatus==="painted");
    }).map(fKey => ({ id:`army-${fKey}`, faction:fKey, isArmy:true }));
    // Armées possédant au moins une figurine peinte, mais toujours sur l'objectif
    // de points par défaut (jamais fixé volontairement dans CROISADE).
    const goalPool = Object.keys(FACTIONS).filter(fKey => {
      if (listGoals?.[fKey]) return false;
      return inv.some(i => i.faction===fKey && i.paintStatus==="painted");
    }).map(fKey => ({ id:`goal-${fKey}`, faction:fKey, isGoal:true }));
    // Figurines possédées d'une unité dont la valeur en points reste incertaine
    // depuis le MFM (voir AMBIGUOUS_UNITS), et qui n'a pas encore de correction
    // personnelle enregistrée dans ptsMap pour cette faction précise.
    const ambigPool = inv.filter(i => {
      if (!UNIT_BY_ID.has(i.unitId)) return false;
      const u = findUnit(i.faction, i.unitId);
      if (!u || !AMBIGUOUS_UNITS.has(u.name)) return false;
      return ptsMap?.[`${i.faction}:${i.unitId}`] == null;
    });

    // Revue de la pile : reliques encore sur grappe ou seulement montées, jamais passées en revue
    // ou pas depuis 90 jours. Une simple vérification du statut, sans obligation de peindre.
    const reviewPool = inv.filter(i => {
      if (i.paintStatus !== "sprue" && i.paintStatus !== "unpainted") return false;
      if (!UNIT_BY_ID.has(i.unitId)) return false;
      if (!i.reviewedAt) return true;
      return (Date.now() - new Date(i.reviewedAt + "T00:00:00").getTime()) / 86400000 >= 90;
    });

    return { baptism: baptismPool, photo: photoPool, date: datePool, photo_painted: photoPaintedPool, army: armyPool, goal: goalPool, ambig: ambigPool, review: reviewPool };
  }, [appState.inventory, listNames, listGoals, ptsMap]);
  // ── Mission de la semaine : immortaliser une armée dans la Parade, 7 jours pour le faire ──
  // Vivier : armées qui ont au moins une figurine peinte et aucune photo dans la Parade.
  // La mission est enregistrée (« weekMission ») ; elle est accomplie dès qu'une photo de cette
  // armée entre dans la Parade, et une nouvelle est tirée 7 jours après le début de la précédente.
  const weekPool = React.useMemo(() => {
    const inv = appState.inventory || [], par = appState.parade || [];
    return Object.keys(FACTIONS).filter(k => inv.some(i => i.faction === k && i.paintStatus === "painted") && !par.some(p => p.faction === k));
  }, [appState.inventory, appState.parade]);
  const weekMission = appState.weekMission || null;
  const weekAge = weekMission ? Math.floor((new Date(localDay() + "T00:00:00") - new Date(weekMission.start + "T00:00:00")) / 86400000) : null;
  useEffect(() => {
    if (!onSetWeekMission) return;
    const today = localDay();
    if (weekMission && !weekMission.done && (appState.parade || []).some(p => p.faction === weekMission.faction)) {
      onSetWeekMission({ ...weekMission, done: today });
      return;
    }
    if ((!weekMission || weekAge >= 7) && weekPool.length) {
      const others = weekPool.filter(k => k !== weekMission?.faction);
      const list = others.length ? others : weekPool;
      onSetWeekMission({ type: "parade", faction: list[Math.floor(Math.random() * list.length)], start: today });
    }
  }, [weekMission?.start, weekMission?.done, weekAge, weekPool.join(","), (appState.parade || []).length]);

  const contextual = (() => {
    const unpainted = Math.max(0, totalModels - totalPainted);
    const lp = appState.lastPaintAt;
    const daysIdle = lp ? Math.floor((Date.now() - new Date(lp).getTime()) / 86400000) : null;
    const pool = [];
    // Pendant l'enrôlement (7 premiers jours) : accueil, pas de jugement sur le taux de peinture
    if (enrolDaysLeft(appState) > 0) pool.push(
      { text: "Le registre s'ouvre. Inscris chaque relique : le Chapelain jugera plus tard.", author: "Scriptorium du Chapitre" },
      { text: "Un Chapitre ne se recense pas en un jour. Prends le temps de tout consigner.", author: "Le Chapelain" },
      { text: "Chaque figurine inscrite est une âme de plus au service de la Croisade.", author: "Sagesse du Chapitre" },
      { text: "Le Munitorum compte, trie et classe. Pour une fois, c'est toi qui tiens le registre.", author: "Rapport du Munitorum" },
      { text: "L'enrôlement d'abord. Le pinceau ensuite. Le jugement, bien plus tard.", author: "Le Chapelain, patient" });
    else if (totalModels > 0 && totalPainted === 0 && !(appState.paintHistory||[]).length) pool.push(
      { text: "Toute croisade commence par une figurine grise et un pinceau propre. Tu as les deux.", author: "Le Chapelain" },
      { text: "Le registre est ouvert. Le Chapelain attend ta première consécration.", author: "Scriptorium du Chapitre" },
      { text: "Nul n'est né Maître de Chapitre. Commence par une seule figurine.", author: "Sagesse du Chapitre" },
      { text: "Les premières couches sont les plus difficiles. Les suivantes aussi, mais on s'y fait.", author: "Le Chapelain, honnête" },
      { text: "Bienvenue dans la Croisade, frère. Le gris ne se rendra pas tout seul.", author: "Le Chapelain" });
    else if (totalModels > 0 && paintPct >= 100) pool.push(
      { text: "Toute relique a reçu sa bénédiction. Le Codex est complet — pour l'instant.", author: "Le Chapelain, satisfait" },
      { text: "Un Chapitre entier prêt au combat. L'Empereur lui-même s'attarderait sur tant de perfection.", author: "Sagesse du Chapitre" },
      { text: "Plus une once de gris. Même l'Inquisition n'a rien à redire.", author: "Ordo Hereticus, déçu de ne rien trouver" },
      { text: "La perfection n'est pas un état, frère. C'est une garde qu'il faudra tenir.", author: "Le Chapelain" },
      { text: "Chaque figurine consacrée. L'Astropathe n'a plus rien à signaler.", author: "Rapport du Magos" },
      { text: "Le Codex se referme, complet. Il s'en rouvrira un autre bientôt — c'est la loi de la Croisade.", author: "Sagesse du Chapitre" },
      { text: "Ni gris ni doute. Une armée entière parle d'une seule voix, peinte.", author: "Le Chapelain" },
      { text: "Les Nécrons eux-mêmes n'ont pas d'armée aussi uniforme que la tienne aujourd'hui.", author: "Observation astropathique" },
      { text: "Il n'y a plus rien à juger ici. L'Ordo Hereticus s'ennuie déjà.", author: "Ordo Hereticus" },
      { text: "Cent pour cent. Range le pinceau une heure, frère — tu l'as mérité.", author: "Le Chapelain, rare compliment" },
      { text: "Même le Munitorum n'a rien trouvé à inventorier en gris. Il est désemparé.", author: "Rapport du Munitorum" },
      { text: "Une collection achevée est une prière exaucée. Savoure le silence.", author: "Le Chapelain" },
      { text: "Les archives n'ont plus de ligne « à peindre ». Le scribe a posé sa plume.", author: "Scriptorium du Chapitre" },
      { text: "Tout est consacré. La prochaine boîte, elle, le sait déjà.", author: "Le Chapelain, lucide" });
    else if (totalModels > 0 && paintPct >= 90) pool.push(
      { text: "Le devoir touche à sa fin, frère. Ne faiblis pas au seuil de la gloire.", author: "Le Chapelain" },
      { text: "Si près du but. Les derniers coups de pinceau sont les plus sacrés.", author: "Sagesse du Chapitre" },
      { text: "Le sommet se voit déjà. C'est là que beaucoup lâchent le pinceau — pas toi.", author: "Le Chapelain, vigilant" },
      { text: "Quelques reliques encore, et le silence des rangs sera enfin doré.", author: "Rapport du Magos" },
      { text: "Dix pour cent séparent l'ordinaire de la légende. Franchis-les.", author: "Le Chapelain" },
      { text: "L'Inquisition referme déjà son dossier sur ton Chapitre. Ne le rouvre pas.", author: "Ordo Hereticus" },
      { text: "Presque plus rien de gris. Le regard s'y attarde encore, par habitude.", author: "Observation astropathique" },
      { text: "Neuf sur dix. Le Chapelain prépare déjà les derniers rites.", author: "Le Chapelain" },
      { text: "L'ultime ligne droite ne pardonne pas la paresse — surtout pas maintenant.", author: "Sagesse du Chapitre" },
      { text: "Si peu de gris qu'on pourrait presque croire à un accident.", author: "Rapport du Magos, taquin" },
      { text: "Les derniers pas d'une croisade se font en silence. Écoute ton pinceau.", author: "Le Chapelain" },
      { text: "Le Munitorum prépare déjà le sceau de pureté. Ne le fais pas attendre.", author: "Rapport du Munitorum" },
      { text: "À ce stade, chaque figurine grise est une exception, pas une habitude.", author: "Observation astropathique" });
    else if (unpainted >= 60) pool.push(
      { text: `L'Adeptus Mechanicus pleure devant ${unpainted} figurines de plastique vierge.`, author: "Rapport du Magos" },
      { text: "Ta pile de la honte a sa propre gravité. Des lunes s'y forment.", author: "Observation astropathique" },
      { text: `${unpainted} âmes grises attendent dans le noir. Certaines depuis des cycles.`, author: "Le Chapelain, las" },
      { text: "Une pile pareille pourrait servir de bouclier. Ça n'excuse rien.", author: "Sagesse du Chapitre" },
      { text: `${unpainted} figurines. À ce stade, l'Ordo Hereticus ouvre un dossier permanent à ton nom.`, author: "Ordo Hereticus" },
      { text: "La lumière peine à traverser une pile aussi dense. Même elle hésite.", author: "Observation astropathique" },
      { text: `Soixante figurines et plus. Le Magos suggère une prière, à défaut d'un plan.`, author: "Rapport du Magos" },
      { text: "Une armée de plastique nu dort sous ton toit. Elle rêve de couleur.", author: "Sagesse du Chapitre" },
      { text: "Il existe des Titans plus petits que cette pile. C'est un fait, pas une insulte.", author: "Le Chapelain, sarcastique" },
      { text: `${unpainted} figurines à peindre. L'Empereur ne compte pas les jours — Il compte celles-ci.`, author: "Le Chapelain" },
      { text: `${unpainted} figurines. Le Munitorum a créé un registre rien que pour elles.`, author: "Rapport du Munitorum" },
      { text: "On ne vide pas un océan à la cuillère. Sauf toi. Commence.", author: "Le Chapelain" },
      { text: "Cette pile a vu passer des éditions entières du codex.", author: "Scriptorium du Chapitre" });
    else if (unpainted >= 30) pool.push(
      { text: `${unpainted} âmes attendent leur consécration. L'Inquisition prend des notes.`, author: "Ordo Hereticus" },
      { text: "Le gris n'est pas une couleur de Chapitre, frère.", author: "Le Chapelain, sévère" },
      { text: `${unpainted} figurines nues devant l'Empereur. Il patiente. Pas éternellement.`, author: "Le Chapelain" },
      { text: "Chaque semaine sans pinceau est une semaine que l'ennemi, lui, ne perd pas.", author: "Rapport du Magos" },
      { text: `Trente reliques ou plus dans l'ombre. Le Chapelain les compte, encore et encore.`, author: "Le Chapelain" },
      { text: "Une pile respectable, dans le mauvais sens du terme.", author: "Sagesse du Chapitre" },
      { text: `${unpainted} âmes en sursis. Aucune sentence n'est tombée — pas encore.`, author: "Ordo Hereticus" },
      { text: "Le plastique ne vieillit pas. Ta patience à le regarder, si.", author: "Observation astropathique" },
      { text: "Trente figurines, ce sont trois escouades entières qui manquent à l'appel.", author: "Rapport du Magos" },
      { text: `Le Codex note ${unpainted} absences. Il ne juge pas. Il attend.`, author: "Le Chapelain" },
      { text: `${unpainted} figurines. Une escouade par semaine, et l'affaire est close avant l'hiver.`, author: "Le Chapelain, pragmatique" },
      { text: "Le gris domine encore certaines de tes étagères. Pas pour longtemps.", author: "Observation astropathique" },
      { text: "Commence par la plus petite. Les victoires modestes ouvrent la voie aux grandes.", author: "Sagesse du Chapitre" });
    else if (unpainted >= 10) pool.push(
      { text: `Plus que ${unpainted} âmes à consacrer. La fin de la croisade se devine.`, author: "Le Chapelain" },
      { text: `${unpainted} reliques encore grises. Le reste du Chapitre les attend au front.`, author: "Sagesse du Chapitre" },
      { text: "La pile rétrécit. C'est là qu'il ne faut surtout pas ralentir.", author: "Le Chapelain, encourageant" },
      { text: `${unpainted} figurines. Un dernier effort, pas un sprint — la précision compte encore.`, author: "Rapport du Magos" },
      { text: "Une poignée de reliques grises entre toi et le silence satisfait de l'Inquisition.", author: "Ordo Hereticus" },
      { text: `${unpainted} âmes en attente. Le Chapelain les connaît presque par leur nom, désormais.`, author: "Le Chapelain" },
      { text: "Ce n'est plus une montagne, frère. C'est une colline. Grimpe-la.", author: "Sagesse du Chapitre" },
      { text: `Moins de trente figurines : c'est le moment où la discipline compte plus que l'envie.`, author: "Le Chapelain, sévère" },
      { text: "L'Astropathe signale une pile en voie de disparition. Continue ainsi.", author: "Observation astropathique" },
      { text: `${unpainted} reliques. Le Magos a cessé de s'inquiéter pour ton Chapitre — presque.`, author: "Rapport du Magos" },
      { text: `${unpainted} figurines. On les compterait presque une par une — et c'est bon signe.`, author: "Le Chapelain" },
      { text: "La fin se dessine. Garde le même rythme, pas plus, pas moins.", author: "Sagesse du Chapitre" },
      { text: "Le Munitorum ferme déjà des dossiers à ton nom. Des bons, pour une fois.", author: "Rapport du Munitorum" });
    else if (unpainted >= 1) pool.push(
      { text: `${unpainted} relique${unpainted>1?"s":""} seulement te sépare${unpainted>1?"nt":""} de la perfection. Ne flanche pas.`, author: "Le Chapelain, impatient" },
      { text: "Si près de zéro que l'Inquisition en a presque refermé le dossier.", author: "Ordo Hereticus" },
      { text: "Le dernier effort est souvent le plus vite oublié. Ne l'oublie pas.", author: "Sagesse du Chapitre" },
      { text: `Une poignée d'âmes encore grises. Le Chapelain retient son souffle.`, author: "Le Chapelain" },
      { text: "C'est dans les derniers pas qu'on trébuche le plus souvent. Reste concentré.", author: "Rapport du Magos" },
      { text: `${unpainted} relique${unpainted>1?"s":""} et le silence complet. Presque à portée de main.`, author: "Observation astropathique" },
      { text: "Le zéro absolu approche. Même l'Ordo Hereticus retient son verdict.", author: "Ordo Hereticus" },
      { text: "Une figurine grise dans une armée dorée se voit comme un mensonge dans une prière.", author: "Le Chapelain" },
      { text: "Ce qu'il reste tiendrait dans une seule main. Termine le geste.", author: "Sagesse du Chapitre" },
      { text: `Le compte est presque bon. ${unpainted} de moins, et le Codex se tait enfin.`, author: "Le Chapelain, impatient" },
      { text: "Il ne reste que des survivants. Honore-les comme les autres.", author: "Le Chapelain" },
      { text: "Les dernières reliques sont souvent les plus redoutées. C'est pour ça qu'elles restent.", author: "Observation astropathique" },
      { text: `Encore ${unpainted}. Après, il faudra trouver une nouvelle excuse pour acheter.`, author: "Le Chapelain, taquin" });
    if (daysIdle !== null && daysIdle >= 30) pool.push(
      { text: "Les pinceaux sèchent. Les serviteurs murmurent. L'Empereur attend.", author: "Le Chapelain, inquiet" },
      { text: "Un mois sans peinture. Même les Nécrons se réveillent plus vite.", author: "Sagesse du Chapitre" },
      { text: "Le silence de l'atelier commence à ressembler à de l'hérésie.", author: "Ordo Hereticus, qui observe" },
      { text: "Trente jours de gris. L'Empereur ne juge pas la vitesse — mais Il note l'absence.", author: "Le Chapelain" },
      { text: "La peinture a séché dans les pots. Ce n'est pas encore irréversible.", author: "Rapport du Magos" },
      { text: "Un mois de silence. L'Astropathe se demande si le Chapitre existe encore.", author: "Observation astropathique" },
      { text: "Trente jours sans une seule relique consacrée. Même les plus patientes commencent à douter.", author: "Le Chapelain, sec" },
      { text: "L'Ordo Hereticus n'accuse pas encore. Il note, simplement. C'est pire.", author: "Ordo Hereticus" },
      { text: "Trente jours. Le pinceau n'a pas disparu — il attend juste ton retour.", author: "Sagesse du Chapitre" },
      { text: "Le silence prolongé d'un artisan inquiète plus que ses erreurs.", author: "Le Chapelain" },
      { text: "Une seule figurine suffit à rompre le silence. Même petite. Surtout petite.", author: "Le Chapelain" },
      { text: "Le servo-crâne de l'atelier tourne en rond. Il cherche son maître.", author: "Rapport du Magos" },
      { text: "Le plus dur n'est pas de peindre. C'est d'ouvrir le premier pot.", author: "Sagesse du Chapitre" });
    if (daysIdle !== null && daysIdle <= 2) pool.push(
      { text: "Le pinceau est encore chaud. Continue, frère — la croisade se gagne ainsi.", author: "Le Chapelain, encourageant" },
      { text: "La peinture fraîche d'hier appelle celle d'aujourd'hui.", author: "Sagesse du Chapitre" },
      { text: "Un rythme comme celui-là, et le Codex se remplit tout seul.", author: "Rapport du Magos" },
      { text: "L'élan est rare. Ne le laisse pas retomber pour rien.", author: "Le Chapelain" },
      { text: "Tu as peint il y a peu. L'Inquisition n'a même pas eu le temps de s'inquiéter.", author: "Ordo Hereticus" },
      { text: "La constance vaut mieux que la vitesse. Tu as les deux, en ce moment.", author: "Sagesse du Chapitre" },
      { text: "L'atelier sent encore la peinture fraîche. Garde cette odeur-là.", author: "Observation astropathique" },
      { text: "Peu de Chapitres gardent le pinceau aussi chaud. Le tien, si.", author: "Le Chapelain, satisfait" },
      { text: "La main ne tremble pas encore de fatigue. Profites-en.", author: "Rapport du Magos" },
      { text: "Chaque session compte comme une victoire silencieuse. L'Empereur les compte aussi.", author: "Le Chapelain" },
      { text: "Tu tiens le rythme. L'ennemi, lui, commence à le sentir.", author: "Observation astropathique" },
      { text: "Une habitude se forge comme une armure : couche après couche.", author: "Sagesse du Chapitre" },
      { text: "Le pinceau a trouvé sa cadence. Ne le laisse pas refroidir.", author: "Le Chapelain" });
    if (!pool.length) return null;
    return pool[dayNum % pool.length];
  })();
  // ── Fête du calendrier impérial et visite rare du jour ──
  const festival = festivalFor(new Date(), { crusadeStart: crusadeStartOf(appState, appState.paintHistory), firstOpenAt: appState.firstOpenAt });
  const visit = visitForDay(localDay(), new Set((inventory||[]).map(i => i.faction)));
  const [hiddenCards, setHiddenCards] = useState(() => { try { return JSON.parse(localStorage.getItem("hiddenCards:" + localDay()) || "{}"); } catch { return {}; } });
  const hideCard = (k) => { const n = { ...hiddenCards, [k]: true }; setHiddenCards(n); try { localStorage.setItem("hiddenCards:" + localDay(), JSON.stringify(n)); } catch {} };
  // Pendant une fête, le Chapelain prend la voix de la fête
  const citation = (festival?.cits?.length ? festival.cits[dayNum % festival.cits.length] : null) || contextual || WEEKLY_CITATIONS[dayNum % WEEKLY_CITATIONS.length];

  // ── Onboarding : première visite, inventaire vide ──
  if ((inventory||[]).length === 0) {
    return (
      <div style={{ ...pageStyle, alignItems:"center", justifyContent:"center", padding:"32px 24px", textAlign:"center" }}>
        <div style={{ color:"#b8922a", lineHeight:0, marginBottom:"18px", animation:"crossGrow 0.9s ease both", filter:"drop-shadow(0 0 18px #b8922a66)" }}>
          <NavIcon id="templarshield" size={52} color="currentColor" />
        </div>
        <div style={{ color:"#b3a48c", fontSize:"12px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>REGISTRE DE GUERRE</div>
        <div style={{ color:"#e8dfc0", fontSize:"30px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"2px", lineHeight:1.1, marginBottom:"14px" }}>RELIQUAIRE</div>
        <div style={{ color:"#d8c8ac", fontSize:"15px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, maxWidth:"300px", marginBottom:"6px" }}>
          Ton codex personnel pour Warhammer 40,000 : recense tes figurines, suis ta peinture, bâtis tes armées.
        </div>
        <div style={{ color:"#9a8a6a", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"26px" }}>
          19 factions · pts officiels · sauvegarde Google Drive
        </div>
        <button onClick={() => onNav("inventory")}
          style={{ padding:"14px 28px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"13px", letterSpacing:"3px", cursor:"pointer", touchAction:"manipulation", boxShadow:"0 0 24px #b8922a22" }}>
          ⚔ COMMENCER MA CROISADE
        </button>
        <div style={{ color:"#8a7a5e", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"18px", maxWidth:"280px" }}>
          Choisis ton armée, ajoute ta première figurine — l'Empereur observe.
        </div>
        {/* Nouveau téléphone, navigateur vidé… : la restauration était cachée au fond du CODEX */}
        <button onClick={() => onNav("codex")}
          style={{ marginTop:"34px", padding:"10px 18px", background:"none", border:"1px solid #3a3020", color:"#9a8a6a", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
          J'AI DÉJÀ UNE COLLECTION
        </button>
        <div style={{ color:"#7a6c52", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"8px", maxWidth:"280px" }}>
          Récupère-la depuis Google Drive ou un fichier de sauvegarde.
        </div>
      </div>
    );
  }

  // Dernière photo parade
  const lastParade = (appState.parade||[]).slice(-1)[0];

  // Shame-o-meter
  // Débutant (rien peint, compte de moins de 14 jours) : pas de « Renégat » dès le premier jour
  const isNovice = totalPainted === 0 && (!appState.firstOpenAt || (Date.now() - new Date(appState.firstOpenAt).getTime()) < 14*86400000);
  const shameColor = isNovice ? "#b8922a" : paintPct>=80?"#3ea23e":paintPct>=60?"#c2a83e":paintPct>=40?"#d68a3e":"#d64545";
  const shameTitle = isNovice ? "✧ Aspirant de la Croisade"
    : paintPct>=95?"⚔ Croisé Exemplaire"
    :paintPct>=80?"✠ Serviteur Loyal"
    :paintPct>=60?"⚠ Sous Surveillance"
    :paintPct>=40?"⸸ Honte Croissante"
    :paintPct>=20?"● Hérétique du Pot de Peinture"
    :"☠ Renégat Confirmé";



  return (
    <div style={{ flex:1, overflowY:"auto", background:"transparent", position:"relative", minHeight:"100%", boxSizing:"border-box", paddingBottom:"112px" }}>
      {/* Ambiance de saison (neige, braises, cendres…) derrière le contenu */}
      <SeasonFX kind={seasonFor(new Date(), festival)} />
      {/* Le servo-crâne se tient à l'écart quand une fenêtre est ouverte (Tarot, missions, serment…) :
          il passait par-dessus, les fenêtres de l'Accueil étant dans le même plan que lui. */}
      <ServoSkull inventory={inventory} paintHistory={appState.paintHistory || []}
        hidden={!!(servoOpen || tarotOpen || tripleOpen || missionDone || missionChoice || baptismItem || herOpen || oathOpen)}
        news={appState.servoNewsDay === localDay() ? null : servoNews({ inventory, ptsMap: ptsMap || {}, oath: appState.oath, fateChoice: appState.fateChoice, listNames: listNames || {} })}
        onNewsShown={() => onServoNewsShown && onServoNewsShown(localDay())}
        onNewsOpen={(o) => onOpenInInventory && onOpenInInventory(o.faction, o.itemId)} />
      <ServoAssistant open={servoOpen} onClose={() => setServoOpen(false)} appState={appState} inventory={inventory} ptsMap={ptsMap || {}}
        onOpenRelic={(faction, itemId) => onOpenInInventory && onOpenInInventory(faction, itemId)} onNav={(v) => onNav && onNav(v)} />
      {festival && <div style={{ position:"absolute", top:0, left:0, right:0, height:"420px", pointerEvents:"none", zIndex:1, background:`radial-gradient(ellipse at 50% 0%, ${(festival.tint || festival.color)}38 0%, transparent 70%)` }} />}
      {/* Le fond d'accueil est posé par App sur le conteneur qui défile (voir homeFond dans components/ui.jsx) */}
      <div style={{ position:"relative", zIndex:2 }}>

      {/* ── Bannière dernière photo Parade ── */}
      {lastParade && (
        <div style={{ position:"relative", cursor:"pointer" }}
          onClick={() => { if (bgLongPress.current) { bgLongPress.current = false; return; } onNav("parade"); }}
          onTouchStart={() => {
            bgLongPress.current = false;
            if (bgTimer.current) clearTimeout(bgTimer.current);
            bgTimer.current = setTimeout(() => {
              const photos = appState.parade||[];
              if (photos.length > 1) {
                const cur = photos.findIndex(p => p.photo === homeBackground);
                onSetBackground(photos[(cur + 1) % photos.length].photo);
                bgLongPress.current = true;
                vibrate("tap");
              }
            }, 550);
          }}
          onTouchEnd={() => { if (bgTimer.current) clearTimeout(bgTimer.current); }}
          onTouchMove={() => { if (bgTimer.current) clearTimeout(bgTimer.current); }}>
          <img src={lastParade.photo} alt="" style={{ width:"100%", height:"240px", objectFit:"cover", display:"block", filter:"brightness(0.6)" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, #020202 100%)" }} />
          {(appState.parade||[]).length > 1 && (
            <div style={{ position:"absolute", top:"10px", right:"12px", color:"rgba(232,223,192,0.4)", fontSize:"10px", letterSpacing:"1px", fontFamily:"'Cinzel',serif", pointerEvents:"none" }}>⊚ appui long · ou ★ dans PARADE</div>
          )}
          <div style={{ position:"absolute", bottom:"16px", left:"16px" }}>
            <div style={{ color:"#c8a23a", fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>ARMY ON PARADE</div>
            <div style={{ color:"#e8dfc0", fontSize:"16px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"700" }}>{crusade?.name || lastParade.title || "Ma collection"}</div>
          </div>
          {crusade && (
            <div onClick={(e) => { e.stopPropagation(); openCrusadeEditor(); }} title="Modifier le blason" style={{ position:"absolute", bottom:"16px", right:"16px", cursor:"pointer", touchAction:"manipulation" }}>
              <CrusadeBlazon oaths={appState.oathRecord?.kept || 0} shape={crusade.shape} symbol={crusade.symbol} division={crusade.division} metal={crusade.metal} c1={crusade.c1} c2={crusade.c2} size={52} />
            </div>
          )}
        </div>
      )}

      {/* ── Header si pas de photo ── */}
      {!lastParade && (
        <div style={{ padding:"32px 20px 20px", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", opacity:0.05, lineHeight:1, pointerEvents:"none", color:"#b8922a" }}><NavIcon id="templarshield" size={190} color="currentColor" /></div>
          <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"6px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>REGISTRE DE GUERRE</div>
          <ImperialDate style={{ marginBottom:"10px", position:"relative" }} />
          {crusade ? (
            <div onClick={openCrusadeEditor} title="Modifier le blason" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", cursor:"pointer", touchAction:"manipulation" }}>
              <CrusadeBlazon oaths={appState.oathRecord?.kept || 0} shape={crusade.shape} symbol={crusade.symbol} division={crusade.division} metal={crusade.metal} c1={crusade.c1} c2={crusade.c2} motto={crusade.motto} size={64} />
              <div className="gold-shine-slow" style={{ fontSize:"24px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"1px", lineHeight:1.1 }}>{crusade.name}</div>
            </div>
          ) : (
            <div className="gold-shine-slow" style={{ fontSize:"28px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"2px", lineHeight:1.1 }}>AD VICTORIAM</div>
          )}
        </div>
      )}

      <div>
        <div style={{ padding:"16px" }}>

        {/* ── Fête du calendrier ── */}
        {festival && !hiddenCards["fete-" + festival.id] && (
          <div className="hc-bare orn" style={{ position:"relative", background:"linear-gradient(135deg,#120e0acc 0%,#0a0806cc 100%)", border:`1px solid ${festival.color}66`, borderTop:`2px solid ${festival.color}`, padding:"12px 14px", marginBottom:"12px", boxShadow:`0 0 24px ${festival.color}22` }}>
            <button onClick={() => hideCard("fete-" + festival.id)} aria-label="Masquer" style={{ position:"absolute", top:"6px", right:"8px", background:"none", border:"none", color:"#8a7a5a", fontSize:"16px", cursor:"pointer" }}>×</button>
            <div style={{ color:festival.color, fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", paddingRight:"18px" }}>{festival.icon} {festival.title.toUpperCase()}</div>
            <div style={{ color:"#e0d4b4", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginTop:"6px" }}>{festival.text}</div>
            {TRIPLE_FESTIVALS.has(festival.id) && (
              <button onClick={() => setTripleOpen(true)}
                style={{ marginTop:"10px", padding:"8px 14px", background:`${festival.color}1a`, border:`1px solid ${festival.color}`, color:festival.color, fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", cursor:"pointer" }}>
                ✦ TIRAGE DES TROIS LAMES
              </button>
            )}
          </div>
        )}
        {/* ── Visite rare ── */}
        {visit && !hiddenCards["visite"] && (
          <div className="hc-bare orn" style={{ position:"relative", background:"linear-gradient(135deg,#0c0a08e6 0%,#060504e6 100%)", border:`1px solid ${RARITY[visit.rarity].color}55`, borderLeft:`3px solid ${RARITY[visit.rarity].color}`, padding:"12px 14px", marginBottom:"12px", animation:"viewFade 0.8s ease both" }}>
            <button onClick={() => hideCard("visite")} aria-label="Masquer" style={{ position:"absolute", top:"6px", right:"8px", background:"none", border:"none", color:"#8a7a5a", fontSize:"16px", cursor:"pointer" }}>×</button>
            <div style={{ color:RARITY[visit.rarity].color, fontSize:"10.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>{RARITY[visit.rarity].label}</div>
            <div style={{ display:"flex", gap:"12px", alignItems:"flex-start", marginTop:"6px" }}>
              <div style={{ color:RARITY[visit.rarity].color, fontSize:"26px", lineHeight:1, width:"30px", textAlign:"center", flexShrink:0 }}>{visit.icon}</div>
              <div style={{ flex:1, paddingRight:"12px" }}>
                <div style={{ color:"#efe4c4", fontSize:"14px", fontFamily:"'Cinzel',serif" }}>{visit.title}</div>
                <div style={{ color:"#d0c4a4", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginTop:"4px" }}>{visit.text}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions rapides : convoquer le servo-crâne ; fonder la croisade s'il n'y en a pas ── */}
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
          <button onClick={() => { setServoOpen(true); playSfx("carte", 0.35, null); }} aria-label="Convoquer le servo-crâne"
            style={{ display:"flex", alignItems:"center", gap:"6px", height:"36px", padding:"0 10px 0 4px", background:"#0a080688", border:"1px solid #2a2418", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
            <img src={SKULL_IMG(false)} alt="" width="28" height="28" style={{ display:"block", filter:"drop-shadow(0 2px 4px #000)" }} onError={e => { e.currentTarget.style.display = "none"; }} />
            SERVO-CRÂNE
          </button>
          {!crusade && (
            <button onClick={openCrusadeEditor} title="Fonder ma croisade"
              style={{ width:"36px", height:"36px", background:"#0a080688", border:"1px solid #1c1a16", color:"#c8b9a0", fontSize:"15px", cursor:"pointer", touchAction:"manipulation", display:"flex", alignItems:"center", justifyContent:"center" }}>⚜</button>
          )}
        </div>

        {/* ── Urgence de sauvegarde : pas d'export depuis 2 mois ── */}
        {(() => {
          const today = localDay();
          if (appState.lastBackupDismiss === today) return null;
          const daysSinceExport = lastExport ? Math.floor((Date.now() - lastExport) / 86400000) : null;
          // Jamais exporté : on laisse une semaine au nouveau venu avant de l'alarmer
          const ageDays = appState.firstOpenAt ? Math.floor((Date.now() - new Date(appState.firstOpenAt).getTime()) / 86400000) : 0;
          // Google Drive actif = sauvegarde automatique hors du téléphone : inutile de relancer
          if (driveSynced) return null;
          const stale = daysSinceExport === null ? ageDays >= 7 : daysSinceExport >= 30;
          if (!stale) return null;
          return (
            <div className="hc-bare orn" style={{ background:"linear-gradient(135deg,#1a0e08cc 0%,#0a0806cc 60%,#100c08cc 100%)", border:"1px solid #c0704044", borderTop:"2px solid #c07040", padding:"12px 14px", marginBottom:"12px", position:"relative" }}>
              <button onClick={() => onSetBackupDismiss && onSetBackupDismiss(today)} style={{ position:"absolute", top:"6px", right:"8px", background:"none", border:"none", color:"#9a8a6a", fontSize:"15px", cursor:"pointer", lineHeight:1 }}>✕</button>
              <div style={{ color:"#c07040", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"6px", paddingRight:"16px" }}>⚠ AUCUNE COPIE HORS DU TÉLÉPHONE</div>
              <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginBottom:"10px" }}>
                {daysSinceExport === null ? "Ta collection n'existe que sur ce téléphone." : `Dernière sauvegarde il y a ${daysSinceExport} jours, et Google Drive n'est pas connecté.`} Connecte Google Drive dans le CODEX, ou télécharge une sauvegarde complète.
              </div>
              <button onClick={() => onExport && onExport()}
                style={{ padding:"8px 16px", background:"#c0704022", border:"1px solid #c07040", color:"#e0a878", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", cursor:"pointer" }}>
                ⬇ TÉLÉCHARGER UNE SAUVEGARDE
              </button>
            </div>
          );
        })()}

        {/* ── Bénédiction du jour ── */}
        {(() => {
          const today = localDay();
          const streak = appState.missionStreak || 0;
          const doneToday = appState.lastMissionDay === today;
          // Mission accomplie aujourd'hui : carte de réussite jusqu'à demain
          if (doneToday) {
            const ml = appState.missionLast || {};
            return (
              <div className="hc-bare orn" style={{ background:"linear-gradient(135deg,#0d1408cc 0%,#0a0806cc 60%,#0c1008cc 100%)", border:"1px solid #5a8a3a55", borderTop:"2px solid #5a8a3a", padding:"12px 14px", marginBottom:"12px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                  <div style={{ color:"#7aaa5a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>✓ MISSION ACCOMPLIE</div>
                  {streak > 1 && <div style={{ color:"#c8a23a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>✹ {streak} JOURS</div>}
                </div>
                <div style={{ color:"#c8bfa8", fontSize:"13px", fontFamily:"'Crimson Pro',serif", lineHeight:1.5 }}>
                  {ml.type === "baptism"
                    ? <>Tu as baptisé <span style={{ color:"#8aba6a" }}>{ml.name}</span>{ml.nickname ? <> · <em>« {ml.nickname} »</em></> : null}.</>
                    : ml.type === "photo" || ml.type === "photo_painted"
                    ? <>Tu as immortalisé <span style={{ color:"#8aba6a" }}>{ml.name}</span>.</>
                    : ml.type === "date"
                    ? <>Tu as retrouvé la date d'achat de <span style={{ color:"#8aba6a" }}>{ml.name}</span>.</>
                    : ml.type === "army"
                    ? <>Tu as baptisé ton armée <span style={{ color:"#8aba6a" }}>« {ml.name} »</span>.</>
                    : ml.type === "goal"
                    ? <>Tu as fixé un objectif pour <span style={{ color:"#8aba6a" }}>{ml.name}</span>.</>
                    : ml.type === "ambig"
                    ? <>Tu as vérifié la valeur de <span style={{ color:"#8aba6a" }}>{ml.name}</span>.</>
                    : ml.type === "review"
                    ? <>Tu as passé en revue <span style={{ color:"#8aba6a" }}>{ml.name}</span>.</>
                    : <>Le devoir du jour est accompli.</>}
                </div>
                <div style={{ color:"#546940", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"6px" }}>
                  {(appState.missionTotal||0)} mission{(appState.missionTotal||0)>1?"s":""} accomplie{(appState.missionTotal||0)>1?"s":""} · Nouvelle mission demain.
                </div>
              </div>
            );
          }
          if (appState.lastBlessing === today) return null;
          const dayNum = new Date().getDate();
          // Ensemble de tous les identifiants d'unité valides, toutes factions confondues —
          // sert à écarter toute figurine dont le unitId ne correspondrait à rien dans la
          // base (données orphelines/désynchronisées). Sans ce filtre, une telle figurine
          // pouvait être tirée comme "pick" sans "pickUnit" correspondant, ce qui faisait
          // disparaître TOUTE la section Mission du Jour sans aucun message d'erreur —
          // la bénédiction s'affichait seule, comme si aucune mission n'existait aujourd'hui.
          // Cinq viviers, un par type de mission. Toutes "administratives" (dates, photos,
          // noms manquants) sauf baptême — choisies pour ne jamais mettre la pression à
          // peindre quoi que ce soit, uniquement compléter des données déjà là.
          const pools = missionPools;
          const order = ["baptism","photo","date","photo_painted","army","goal","ambig","review"];
          // Type "prévu" du jour, puis on cherche le premier vivier non vide en partant de
          // là (boucle sur les 8 types) — jamais de mission manquante tant qu'AU MOINS un
          // vivier a du contenu quelque part.
          let missionType = null, pool = null;
          for (let i = 0; i < order.length; i++) {
            const t = order[(dayNum + i) % order.length];
            if (pools[t].length) { missionType = t; pool = pools[t]; break; }
          }
          const pick = pool && pool.length ? pool[Math.floor((dayNum * 7) % pool.length)] : null;
          const pickUnit = (pick && !pick.isArmy && !pick.isGoal) ? UNIT_BY_ID.get(pick.unitId) : null;
          // Valeur actuelle affichée pour une unité "ambiguë" (avant correction) — sert
          // de repère/placeholder dans le champ de saisie de la mission.
          const ambigCurrentPts = (missionType === "ambig" && pick) ? (ptsMap?.[`${pick.faction}:${pick.unitId}`] ?? POINTS_DB[pickUnit?.name] ?? 0) : null;
          const blessings = [
            "Que ta main soit ferme et ton pinceau béni.",
            "L'Empereur guide chaque coup de brosse.",
            "En ce jour, la croisade réclame ta dévotion.",
            "Le devoir t'appelle, frère. Réponds.",
            "Chaque figurine consacrée repousse les ténèbres.",
            "Que ton poignet ne tremble pas et que ton lavis coule juste.",
            "Aujourd'hui encore, le gris doit reculer.",
            "L'Empereur n'exige pas la perfection. Seulement que tu t'y mettes.",
            "Un coup de pinceau aujourd'hui vaut dix serments demain.",
            "Que la lumière de l'établi soit ton phare dans la nuit.",
            "La croisade n'attend pas. Tes pots non plus.",
            "Sois béni, toi qui ouvres un pot plutôt qu'une nouvelle boîte.",
            "Que tes transferts ne plissent pas et que ton vernis reste mat.",
            "Le Chapelain a prié pour ta patience. Ne le déçois pas.",
            "Une figurine t'attend. Elle ne se plaindra pas. C'est pire.",
          ];
          const bl = blessings[dayNum % blessings.length];
          return (
            <div className="hc-bare orn" style={{ background:"linear-gradient(135deg,#14100acc 0%,#0a0806cc 60%,#100c08cc 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"12px 14px", marginBottom:"12px", position:"relative" }}>
              <button onClick={() => onSetBlessing && onSetBlessing(today)} style={{ position:"absolute", top:"6px", right:"8px", background:"none", border:"none", color:"#9a8a6a", fontSize:"15px", cursor:"pointer", lineHeight:1 }}>✕</button>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px", paddingRight:"16px" }}>
                <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>✠ BÉNÉDICTION DU JOUR</div>
                {streak > 0 && <div style={{ color:"#c8a23a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }} title="Série de jours consécutifs">✹ {streak}</div>}
              </div>
              <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginBottom: pick?"8px":"0" }}>{bl}</div>
              {pick && (pickUnit || pick.isArmy || pick.isGoal) && (
                <div style={{ borderTop:"1px solid #16130e", paddingTop:"8px" }}>
                  <span style={{ color:"#7a6a48", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>MISSION DU JOUR</span>
                  {missionType === "photo" && (
                    <div onClick={() => setMissionChoice(true)} style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginTop:"3px", cursor:"pointer", touchAction:"manipulation" }}>
                      ◉ Immortalise <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a", borderBottom:`1px dotted ${FACTIONS[pick.faction]?.accent||"#b8922a"}88` }}>{pickUnit.name}</span>.
                    </div>
                  )}
                  {missionType === "photo_painted" && (
                    <div onClick={() => setMissionChoice(true)} style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginTop:"3px", cursor:"pointer", touchAction:"manipulation" }}>
                      ◉ Documente <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a", borderBottom:`1px dotted ${FACTIONS[pick.faction]?.accent||"#b8922a"}88` }}>{pickUnit.name}</span>, déjà consacrée mais jamais photographiée.
                    </div>
                  )}
                  {missionType === "baptism" && (
                    <div onClick={() => { setBaptismName(pick.nickname||""); setBaptismItem(pick); }} style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginTop:"3px", cursor:"pointer", touchAction:"manipulation" }}>
                      ⚜ Baptise <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a", borderBottom:`1px dotted ${FACTIONS[pick.faction]?.accent||"#b8922a"}88` }}>{pickUnit.name}</span>.
                    </div>
                  )}
                  {missionType === "date" && (
                    <div style={{ marginTop:"3px" }}>
                      <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginBottom:"6px" }}>
                        ▦ Retrouve la date d'achat de <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a" }}>{pickUnit.name}</span>.
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <input type="date" value={missionDateVal} onChange={e => setMissionDateVal(e.target.value)}
                          style={{ flex:1, background:"#0a08055a", border:"1px solid #2a2215", color:"#e8dfc0", padding:"7px 9px", fontSize:"12px", fontFamily:"'Crimson Pro',serif", outline:"none", colorScheme:"dark" }} />
                        <button onClick={() => {
                            if (!missionDateVal) return;
                            onUpdatePurchased && onUpdatePurchased(pick.id, missionDateVal);
                            onCompleteMission && onCompleteMission(today, { type:"date", name:pickUnit.name });
                            setMissionDone({ type:"date", name:pickUnit.name });
                            setMissionDateVal("");
                          }}
                          disabled={!missionDateVal}
                          style={{ padding:"0 14px", background: missionDateVal?"#b8922a22":"none", border:`1px solid ${missionDateVal?"#b8922a":"#2a2215"}`, color: missionDateVal?"#b8922a":"#5a4c3a", fontFamily:"'Cinzel',serif", fontSize:"10px", cursor: missionDateVal?"pointer":"default" }}>✓</button>
                      </div>
                    </div>
                  )}
                  {missionType === "army" && (
                    <div style={{ marginTop:"3px" }}>
                      <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginBottom:"6px" }}>
                        ⚜ <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a" }}>{FACTIONS[pick.faction]?.label}</span> n'a jamais reçu de nom propre. Baptise ce Chapitre.
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <input type="text" value={missionArmyName} onChange={e => setMissionArmyName(e.target.value)} placeholder="Nom de l'armée…"
                          style={{ flex:1, background:"#0a08055a", border:"1px solid #2a2215", color:"#e8dfc0", padding:"7px 9px", fontSize:"12px", fontFamily:"'Crimson Pro',serif", outline:"none" }} />
                        <button onClick={() => {
                            if (!missionArmyName.trim()) return;
                            onSetListName && onSetListName(pick.faction, missionArmyName.trim());
                            onCompleteMission && onCompleteMission(today, { type:"army", name:missionArmyName.trim() });
                            setMissionDone({ type:"army", name:missionArmyName.trim() });
                            setMissionArmyName("");
                          }}
                          disabled={!missionArmyName.trim()}
                          style={{ padding:"0 14px", background: missionArmyName.trim()?"#b8922a22":"none", border:`1px solid ${missionArmyName.trim()?"#b8922a":"#2a2215"}`, color: missionArmyName.trim()?"#b8922a":"#5a4c3a", fontFamily:"'Cinzel',serif", fontSize:"10px", cursor: missionArmyName.trim()?"pointer":"default" }}>✓</button>
                      </div>
                    </div>
                  )}
                  {missionType === "goal" && (
                    <div style={{ marginTop:"3px" }}>
                      <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginBottom:"6px" }}>
                        ◎ <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a" }}>{FACTIONS[pick.faction]?.label}</span> tourne encore sur l'objectif par défaut (2 000 pts). Fixe le tien.
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <input type="number" min="1" value={missionGoalVal} onChange={e => setMissionGoalVal(e.target.value)} placeholder="Objectif en pts…"
                          style={{ flex:1, background:"#0a08055a", border:"1px solid #2a2215", color:"#e8dfc0", padding:"7px 9px", fontSize:"12px", fontFamily:"'Crimson Pro',serif", outline:"none" }} />
                        <button onClick={() => {
                            const v = parseInt(missionGoalVal, 10);
                            if (!v || v < 1) return;
                            onSetListGoal && onSetListGoal(pick.faction, v);
                            onCompleteMission && onCompleteMission(today, { type:"goal", name:`${FACTIONS[pick.faction]?.label} — ${Number(v).toLocaleString('fr')} pts` });
                            setMissionDone({ type:"goal", name:`${FACTIONS[pick.faction]?.label} — ${Number(v).toLocaleString('fr')} pts` });
                            setMissionGoalVal("");
                          }}
                          disabled={!missionGoalVal}
                          style={{ padding:"0 14px", background: missionGoalVal?"#b8922a22":"none", border:`1px solid ${missionGoalVal?"#b8922a":"#2a2215"}`, color: missionGoalVal?"#b8922a":"#5a4c3a", fontFamily:"'Cinzel',serif", fontSize:"10px", cursor: missionGoalVal?"pointer":"default" }}>✓</button>
                      </div>
                    </div>
                  )}
                  {missionType === "ambig" && (
                    <div style={{ marginTop:"3px" }}>
                      <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginBottom:"6px" }}>
                        ⚖ La valeur de <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a" }}>{pickUnit?.name}</span> reste incertaine depuis le MFM (actuellement {ambigCurrentPts} pts). Vérifie et corrige si besoin.
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <input type="number" min="1" value={missionPtsVal} onChange={e => setMissionPtsVal(e.target.value)} placeholder={`${ambigCurrentPts} pts`}
                          style={{ flex:1, background:"#0a08055a", border:"1px solid #2a2215", color:"#e8dfc0", padding:"7px 9px", fontSize:"12px", fontFamily:"'Crimson Pro',serif", outline:"none" }} />
                        <button onClick={() => {
                            const v = parseInt(missionPtsVal, 10);
                            if (!v || v < 1) return;
                            onSetPts && onSetPts(pick.unitId, pick.faction, v);
                            onCompleteMission && onCompleteMission(today, { type:"ambig", name:pickUnit?.name });
                            setMissionDone({ type:"ambig", name:pickUnit?.name });
                            setMissionPtsVal("");
                          }}
                          disabled={!missionPtsVal}
                          style={{ padding:"0 14px", background: missionPtsVal?"#b8922a22":"none", border:`1px solid ${missionPtsVal?"#b8922a":"#2a2215"}`, color: missionPtsVal?"#b8922a":"#5a4c3a", fontFamily:"'Cinzel',serif", fontSize:"10px", cursor: missionPtsVal?"pointer":"default" }}>✓</button>
                      </div>
                    </div>
                  )}
                  {missionType === "review" && (() => {
                    const ST = { sprue:"sur grappe", unpainted:"monté" };
                    const next = (pick.paintStatus === "sprue" ? ["unpainted","primed","wip","painted"] : ["primed","wip","painted"]);
                    const LBL = { unpainted:"Monté", primed:"Apprêté", wip:"En cours", painted:"Peint" };
                    const done = (newStatus) => {
                      onMarkReviewed && onMarkReviewed(pick.id);
                      if (newStatus) onUpdatePaint && onUpdatePaint(pick.id, newStatus);
                      onCompleteMission && onCompleteMission(today, { type:"review", name:pickUnit.name });
                      setReviewAdvance(false);
                      if (newStatus !== "painted") setMissionDone({ type:"review", name:pickUnit.name });   // « Peint » : la cérémonie prend le relais
                    };
                    const btn = { padding:"7px 10px", background:"#0a08055a", border:"1px solid #2a2215", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"1px", cursor:"pointer", touchAction:"manipulation" };
                    return (
                      <div style={{ marginTop:"3px" }}>
                        <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", marginBottom:"7px" }}>
                          ⧗ Revue de la pile : <span style={{ color:FACTIONS[pick.faction]?.accent||"#b8922a" }}>{pick.nickname || pickUnit.name}</span> est-il toujours {ST[pick.paintStatus]} ?
                        </div>
                        {!reviewAdvance ? (
                          <div style={{ display:"flex", gap:"6px" }}>
                            <button onClick={() => done(null)} style={{ ...btn, flex:1 }}>TOUJOURS</button>
                            <button onClick={() => setReviewAdvance(true)} style={{ ...btn, flex:1, borderColor:"#b8922a", color:"#b8922a" }}>IL A AVANCÉ</button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                            {next.map(k => <button key={k} onClick={() => done(k)} style={{ ...btn, flex:"1 1 auto", borderColor: k === "painted" ? "#2a7a2a" : "#2a2215", color: k === "painted" ? "#5aaa5a" : "#d8c8ac" }}>{LBL[k]}</button>)}
                            <button onClick={() => setReviewAdvance(false)} style={{ ...btn, color:"#8a7a5a" }}>‹</button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <input ref={missionCamRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
                    onChange={e => { const file = e.target.files?.[0]; if (!file) return; compressPhoto(file).then(photo => { if (!photo) return; onUpdatePhoto && onUpdatePhoto(pick.id, photo); onCompleteMission && onCompleteMission(today, { type:missionType, name:pickUnit.name }); setMissionDone({ type:missionType, name:pickUnit.name, photo }); }); }} />
                  <input ref={missionGalRef} type="file" accept="image/*" style={{ display:"none" }}
                    onChange={e => { const file = e.target.files?.[0]; if (!file) return; compressPhoto(file).then(photo => { if (!photo) return; onUpdatePhoto && onUpdatePhoto(pick.id, photo); onCompleteMission && onCompleteMission(today, { type:missionType, name:pickUnit.name }); setMissionDone({ type:missionType, name:pickUnit.name, photo }); }); }} />
                </div>
              )}
              {!pick && (
                <div style={{ borderTop:"1px solid #16130e", paddingTop:"8px", marginTop:"8px" }}>
                  <div style={{ color:"#5a8a3a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>✓ Rien à compléter aujourd'hui — tes archives sont en ordre.</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Calendrier de l'Avent (décembre) ── */}
        {onSetAdvent && <AdventCard appState={appState} inventory={appState.inventory || []} listNames={listNames} onSetAdvent={onSetAdvent} />}

        {/* ── Mission de la semaine (Parade, 7 jours) ── */}
        {weekMission && weekAge != null && weekAge < 7 && (() => {
          const f = FACTIONS[weekMission.faction] || {};
          const army = (listNames || {})[weekMission.faction] || f.label || "ton armée";
          const left = 7 - weekAge, done = !!weekMission.done;
          return (
            <div className="hc-bare orn" onClick={() => { if (!done && onNav) onNav("parade"); }}
              style={{ background:"#08060488", border:"1px solid #1c1a1699", borderLeft:`3px solid ${done ? "#5a8a3a" : (f.accent || "#b8922a")}`, padding:"12px 14px", marginBottom:"12px", cursor: done ? "default" : "pointer", touchAction:"manipulation" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"6px" }}>
                <span style={{ color: done ? "#7aaa5a" : "#b8922a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>{done ? "✓ MISSION DE LA SEMAINE" : "MISSION DE LA SEMAINE"}</span>
                <span style={{ color: done ? "#7aaa5a" : (left <= 2 ? "#d08060" : "#c8a23a"), fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{done ? "ACCOMPLIE" : `⧗ ${left} JOUR${left > 1 ? "S" : ""}`}</span>
              </div>
              <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Crimson Pro',Georgia,serif", fontStyle:"italic", lineHeight:1.5 }}>
                {done
                  ? <>L'armée <span style={{ color:"#f4e4b0", fontStyle:"normal", fontFamily:"'Cinzel',serif", fontSize:"13px" }}>{army}</span> a pris sa place dans la Parade. Prochaine mission dans {left} jour{left > 1 ? "s" : ""}.</>
                  : <>Immortalise l'armée <span style={{ color:"#f4e4b0", fontStyle:"normal", fontFamily:"'Cinzel',serif", fontSize:"13px", borderBottom:`1px solid ${f.accent || "#b8922a"}` }}>{army}</span> dans la Parade : une photo de groupe de ses figurines peintes.</>}
              </div>
              {!done && <div style={{ color:"#8a7a58", fontSize:"10.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginTop:"8px" }}>OUVRIR LA PARADE ›</div>}
            </div>
          );
        })()}

        {/* ── Célébration : mission accomplie ── */}
        {missionDone && (
          <div onClick={() => setMissionDone(null)} style={{ position:"fixed", inset:0, background:"#000000e6", zIndex:402, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", overflowY:"auto" }}>
            <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"320px", background:"linear-gradient(180deg,#0d1408,#080604)", border:"1px solid #5a8a3a66", borderTop:"2px solid #5a8a3a", padding:"22px 18px", textAlign:"center", animation:"splashIn 0.3s ease both" }}>
              <div style={{ fontSize:"30px", marginBottom:"4px" }}>{missionDone.type === "baptism" ? "⚜" : missionDone.type === "date" ? "▦" : missionDone.type === "army" ? "⚜" : missionDone.type === "goal" ? "◎" : missionDone.type === "ambig" ? "⚖" : missionDone.type === "review" ? "⧗" : "◉"}</div>
              <div style={{ color:"#7aaa5a", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>MISSION ACCOMPLIE</div>
              {missionDone.photo && (
                <img src={missionDone.photo} alt="" style={{ width:"100%", maxHeight:"170px", objectFit:"cover", display:"block", margin:"12px 0", border:"1px solid #5a8a3a55" }} />
              )}
              <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel',serif", fontWeight:"700", margin:"8px 0 4px", lineHeight:1.3 }}>{missionDone.name}</div>
              {missionDone.nickname && <div style={{ color:"#8aba6a", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"4px" }}>« {missionDone.nickname} »</div>}
              <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"14px" }}>
                {missionDone.type === "baptism" ? "porte désormais un nom digne de sa gloire."
                  : missionDone.type === "date" ? "a retrouvé sa place dans les registres d'acquisition."
                  : missionDone.type === "army" ? "porte désormais ce nom dans les archives de la Croisade."
                  : missionDone.type === "goal" ? "a désormais un objectif digne de ce nom."
                  : missionDone.type === "ambig" ? "voit sa valeur enfin confirmée dans le registre."
                  : missionDone.type === "review" ? "a été passé en revue. Le registre est à jour."
                  : "est immortalisée dans les archives."}
              </div>
              {(appState.missionStreak||0) > 1 && (
                <div style={{ background:"#c8a23a14", border:"1px solid #c8a23a44", padding:"8px", marginBottom:"14px" }}>
                  <div style={{ color:"#c8a23a", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>✹ {appState.missionStreak} JOURS</div>
                  <div style={{ color:"#7a6a48", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"2px" }}>SÉRIE EN COURS</div>
                </div>
              )}
              <div style={{ color:"#546940", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"14px" }}>
                {appState.missionTotal||1} mission{(appState.missionTotal||1)>1?"s":""} au total
              </div>
              <button onClick={() => setMissionDone(null)}
                style={{ width:"100%", padding:"11px", background:"#5a8a3a22", border:"1px solid #5a8a3a", color:"#7aaa5a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ POUR L'EMPEREUR</button>
            </div>
          </div>
        )}

        {/* ── Choix caméra/galerie pour la mission photo ── */}
        {missionChoice && (
          <div onClick={() => setMissionChoice(false)} style={{ position:"fixed", inset:0, background:"#000000d8", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0" }}>
            <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"430px", background:"linear-gradient(180deg,#14100a,#0a0806)", borderTop:"2px solid #b8922a", padding:"20px 18px 28px", animation:"sheetUp 0.3s ease both" }}>
              <div style={{ color:"#b8922a", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center", marginBottom:"16px" }}>IMMORTALISER LA FIGURINE</div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => { setMissionChoice(false); setTimeout(() => missionCamRef.current?.click(), 100); }}
                  style={{ flex:1, padding:"16px 8px", background:"#b8922a18", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"1px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"26px" }}>◉</span>APPAREIL PHOTO</button>
                <button onClick={() => { setMissionChoice(false); setTimeout(() => missionGalRef.current?.click(), 100); }}
                  style={{ flex:1, padding:"16px 8px", background:"#0a080688", border:"1px solid #2a2215", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"1px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"26px" }}>▣</span>GALERIE</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal de baptême ── */}
        {baptismItem && (() => {
          const bu = UNIT_BY_ID.get(baptismItem.unitId);
          // Noms variés selon la faction (latin, prénom + épithète, titre de chevalier, bête…) : data/names.jsx
          const roll = () => setBaptismName(n => randomName(baptismItem.faction, n));
          return (
            <div onClick={() => setBaptismItem(null)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"330px", background:"linear-gradient(180deg,#14100a,#0a0806)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"22px 18px", animation:"splashIn 0.28s ease both" }}>
                <div style={{ fontSize:"26px", textAlign:"center", marginBottom:"4px" }}>⚜</div>
                <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>RITE DE BAPTÊME</div>
                <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", margin:"6px 0 16px" }}>{bu?.name || "Figurine"}</div>
                <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                  <input value={baptismName} onChange={e => setBaptismName(e.target.value)} placeholder="Nom de baptême…" maxLength={28} autoFocus
                    style={{ flex:1, background:"#060402", border:"1px solid #2a2215", color:"#e8dfc0", padding:"10px", fontSize:"15px", fontFamily:"'Cinzel',serif", outline:"none", boxSizing:"border-box" }} />
                  <button onClick={roll} title="Générer un nom" style={{ padding:"0 14px", background:"#b8922a18", border:"1px solid #b8922a", color:"#b8922a", fontSize:"18px", cursor:"pointer" }}>⚄</button>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => setBaptismItem(null)} style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
                  <button onClick={() => { if(baptismName.trim()){ const nm = baptismName.trim(); onUpdateNickname && onUpdateNickname(baptismItem.id, nm); onCompleteMission && onCompleteMission(localDay(), { type:"baptism", name:bu?.name||"Figurine", nickname:nm }); setMissionDone({ type:"baptism", name:bu?.name||"Figurine", nickname:nm, photo:baptismItem.photo||null }); setBaptismItem(null); } }}
                    style={{ flex:1.4, padding:"10px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>⚜ BAPTISER</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Tirage en trois lames (jours de fête) ── */}
        {tripleOpen && festival && (() => {
          const tri = tripleDraw(localDay(), deckKeyFor(appState), festival.id);
          const labels = ["PASSÉ", "PRÉSENT", "AVENIR"];
          return (
            <div onClick={() => setTripleOpen(false)} style={{ position:"fixed", inset:0, background:"#000000e8", zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", overflowY:"auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"380px", textAlign:"center" }}>
                <div style={{ color:festival.color, fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>{festival.icon} {festival.title.toUpperCase()}</div>
                <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"4px 0 14px" }}>{tri.cards[0].deckLabel}</div>
                <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
                  {tri.cards.map((c, n) => (
                    <div key={n} style={{ flex:1, perspective:"900px" }}>
                      <div style={{ color:"#8a7a5a", fontSize:"9.5px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>{labels[n]}</div>
                      <div style={{ position:"relative", aspectRatio:"0.62", transformStyle:"preserve-3d", animation:`tarotFlipIn 0.9s cubic-bezier(0.34,1.2,0.4,1) ${0.6 + n * 1.1}s both` }}>
                        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", border:"1px solid #b8922a99", background:"#0a0806", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"6px" }}>
                          <img src={tarotImage(c.numeral)} alt="" onError={e => { e.currentTarget.style.display = "none"; }} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform: c.reversed ? "rotate(180deg)" : "none" }} />
                          <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 40%, rgba(6,4,2,0.95) 85%)" }} />
                          <div style={{ position:"relative", color:"#e0c060", fontSize:"15px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900 }}>{c.numeral}</div>
                          <div style={{ position:"relative", color:"#f0e6c8", fontSize:"10.5px", fontFamily:"'Cinzel',serif", lineHeight:1.25, marginTop:"2px" }}>{c.name}</div>
                          {c.reversed && <div style={{ position:"relative", color:"#d08060", fontSize:"8.5px", letterSpacing:"1px", fontFamily:"'Cinzel',serif", marginTop:"2px" }}>⟲ RENVERSÉE</div>}
                        </div>
                        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", transform:"rotateY(180deg)", border:"1px solid #6a5a3a99", background:"#070504", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:"28px", color:"#b8922a", opacity:0.5 }}>✠</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ color:"#e0d4b4", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.55, marginTop:"16px", textAlign:"left", animation:"viewFade 1s 4s both" }}>{tri.reading}</div>
                <div style={{ color:festival.color, fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"10px", animation:"viewFade 1s 4.8s both" }}>{tri.closing}</div>
                <button onClick={() => setTripleOpen(false)} style={{ marginTop:"16px", padding:"9px 22px", background:"none", border:"1px solid #b8922a99", color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", cursor:"pointer", animation:"viewFade 1s 5s both" }}>J'AI ENTENDU</button>
              </div>
            </div>
          );
        })()}

        {/* ── Tarot du Reliquaire : révélation hebdomadaire ── */}
        {tarotOpen && (
          <div onClick={closeTarot} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px" }}>
            <div onClick={e => e.stopPropagation()} style={{ perspective:"1200px", width:"100%", maxWidth:"280px", position:"relative" }}>
              {isNewWeek && !tarotFlipped && [0,1].map(k => (
                <div key={k} style={{ position:"absolute", inset:0, border:"1px solid #6a5a3a99", background:"linear-gradient(rgba(4,3,2,0.9), rgba(4,3,2,0.9))", boxShadow:"0 6px 20px #000", animation:`${k ? "tarotShufR" : "tarotShufL"} 0.7s ease-in-out ${k * 0.15}s 2 alternate both`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:"40px", color:"#b8922a", opacity:0.4 }}>✠</span>
                </div>
              ))}
              <div style={{
                  position:"relative", width:"100%", aspectRatio:"0.62", transformStyle:"preserve-3d",
                  transition:"transform 0.9s cubic-bezier(0.34,1.2,0.4,1)", transform: tarotFlipped ? "rotateY(0deg)" : "rotateY(180deg)"
                }}>
                {/* Face visible : la lame tirée — fond repris de la nébuleuse (même image
                    que WISHLIST/PARADE), cohérent avec le reste de l'app plutôt qu'un
                    dégradé plat isolé. Voile sombre superposé pour garder le texte net. */}
                <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", backgroundImage:`linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.82) 60%, rgba(6,4,2,0.94) 100%), url(${import.meta.env.BASE_URL}fonds/wishlist.jpg)`, backgroundSize:"cover", backgroundPosition:"center", border:"2px solid #b8922a", boxShadow:"0 0 40px #b8922a44, 0 20px 60px #000", display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 16px", textAlign:"center" }}>
                  {tarotImgOk && (
                    <>
                      <img src={tarotImage(thisWeekCard.numeral)} alt="" onError={() => setTarotImgOk(false)}
                        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform: thisWeekCard.reversed ? "rotate(180deg)" : "none", zIndex:0 }} />
                      <div style={{ position:"absolute", inset:0, zIndex:0, background:"linear-gradient(180deg, rgba(6,4,2,0.55) 0%, rgba(6,4,2,0.1) 30%, rgba(6,4,2,0.55) 55%, rgba(6,4,2,0.94) 78%)" }} />
                    </>
                  )}
                  <div style={{ position:"relative", zIndex:1, color:"#c8b89a", fontSize:"10px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", marginBottom:"2px", textShadow:"0 1px 4px #000" }}>TAROT DU RELIQUAIRE</div>
                  <div style={{ position:"relative", zIndex:1, color:"#9a8a6a", fontSize:"10.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"6px", textShadow:"0 1px 4px #000" }}>{thisWeekCard.deckLabel}</div>
                  <div style={{ position:"relative", zIndex:1, color:"#e0c060", fontSize:"22px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", marginBottom: thisWeekCard.reversed ? "2px" : "10px", textShadow:"0 0 14px #00000099" }}>{thisWeekCard.numeral}</div>
                  {thisWeekCard.reversed && <div style={{ position:"relative", zIndex:1, color:"#d08060", fontSize:"10px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"8px", textShadow:"0 1px 4px #000" }}>⟲ RENVERSÉE</div>}
                  {tarotImgOk && <div style={{ flex:1 }} />}
                  <div style={{ display: tarotImgOk ? "none" : "flex", width:"64px", height:"64px", border:"1.5px solid #b8922a99", borderRadius:"50%", background:"#000000a0", backdropFilter:"blur(2px)", alignItems:"center", justifyContent:"center", color:"#e0c060", fontSize:"28px", marginBottom:"14px", flexShrink:0, boxShadow:"0 0 16px #00000099" }}>
                    {thisWeekCard.icon.startsWith("svg:") ? <NavIcon id={thisWeekCard.icon.slice(4)} size={30} color="currentColor" /> : thisWeekCard.icon}
                  </div>
                  <div style={{ position:"relative", zIndex:1, color:"#f0e6c8", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginBottom:"10px", lineHeight:1.3, textShadow:"0 1px 6px #000" }}>{thisWeekCard.name}</div>
                  <div style={{ position:"relative", zIndex:1, width:"40%", height:"1px", background:"#b8922a77", marginBottom:"10px" }} />
                  <div style={{ position:"relative", zIndex:1, color:"#e0d8c0", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.55, flex: tarotImgOk ? "none" : 1, textShadow:"0 1px 5px #000" }}>« {thisWeekCard.text} »</div>
                  {tarotPersonal && <div style={{ position:"relative", zIndex:1, color:"#d4b060", fontSize:"12px", fontFamily:"'Crimson Pro',serif", lineHeight:1.4, marginTop:"8px", textShadow:"0 1px 5px #000" }}>✦ {tarotPersonal}</div>}
                  <button onClick={closeTarot}
                    style={{ position:"relative", zIndex:1, marginTop:"14px", padding:"9px 22px", background:"#000000a0", border:"1px solid #b8922a99", color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", cursor:"pointer" }}>
                    J'AI ENTENDU
                  </button>
                </div>
                {/* Face cachée : dos de la carte, même fond mais assombri et flouté —
                    laisse deviner l'ambiance sans révéler la lame avant le retournement. */}
                <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", transform:"rotateY(180deg)", backgroundImage:`linear-gradient(rgba(4,3,2,0.88), rgba(4,3,2,0.88)), url(${import.meta.env.BASE_URL}fonds/wishlist.jpg)`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(1px)", border:"2px solid #6a5a3a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ width:"70%", height:"80%", border:"1px solid #6a5a3a99", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {crusade
                      ? <div style={{ opacity:0.85, filter:"drop-shadow(0 0 14px #b8922a55)" }}><CrusadeBlazon oaths={appState.oathRecord?.kept || 0} shape={crusade.shape} symbol={crusade.symbol} division={crusade.division} metal={crusade.metal} c1={crusade.c1} c2={crusade.c2} size={96} /></div>
                      : <span style={{ fontSize:"46px", opacity:0.6, textShadow:"0 0 20px #b8922a55" }}>✠</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ordre du Dé du Destin (rappel) — cliquable : vers la fiche de la
             figurine si un ordre est en cours, sinon invite à aller le tirer. ── */}
        {appState.fateChoice ? (() => {
          const fc = appState.fateChoice;
          const item = (appState.inventory||[]).find(i => i.id === fc.id);
          const done = item && item.paintStatus === "painted";
          if (!item) return null;
          // On affiche les données LIVE de la figurine (nom, surnom, photo), pas le
          // instantané figé au moment où le Dé a été accepté — sinon un rebaptême
          // ultérieur (mission du jour) laisse cette carte afficher un ancien surnom
          // périmé, en désaccord avec le reste de l'app pour la même figurine.
          const liveUnitName = findUnit(item.faction, item.unitId)?.name || fc.unitName;
          const liveNickname = item.nickname ?? fc.nickname;
          const livePhoto = item.photo || fc.photo;
          return (
            <div className="hc-bare orn" onClick={() => onOpenInInventory && onOpenInInventory(item.faction, item.id)}
              style={{ background:"linear-gradient(135deg,#14100acc,#0a0806cc)", border:"1px solid #8a7a2a55", borderLeft:"3px solid #b8922a", padding:"11px 13px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"11px", cursor:onOpenInInventory?"pointer":"default", touchAction:"manipulation" }}>
              {livePhoto
                ? <img src={livePhoto} alt="" style={{ width:"42px", height:"42px", objectFit:"cover", border:"1px solid #b8922a55", flexShrink:0 }} />
                : <span style={{ fontSize:"24px", flexShrink:0 }}>⚄</span>}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#8a7a58", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>ORDRE DU DÉ DU DESTIN</div>
                <div style={{ color:"#e0c060", fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700", lineHeight:1.2 }}>{liveUnitName}{liveNickname?<span style={{ color:"#d8c8ac", fontStyle:"italic", fontWeight:"400", fontSize:"12.5px" }}> · « {liveNickname} »</span>:null}</div>
                <div style={{ color: done?"#5a8a3a":"#8a5a2a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"0.5px", marginTop:"2px" }}>{done ? "✓ Consacrée — l'Empereur est satisfait" : "⧗ Toujours sur l'établi"}</div>
              </div>
              {onOpenInInventory && <span style={{ color:"#8a7a58", fontSize:"15px", flexShrink:0 }}>›</span>}
            </div>
          );
        })() : (unpainted > 0 && (() => {
          const todayKey = localDay();
          const rolledToday = appState.lastFateRollDay === todayKey;
          return (
            <div className="hc-bare orn" onClick={() => onNav && onNav("shame")}
              style={{ background:"linear-gradient(135deg,#14100acc,#0a0806cc)", border:"1px solid #8a7a2a55", borderLeft:"3px solid #b8922a", padding:"11px 13px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"11px", cursor:onNav?"pointer":"default", touchAction:"manipulation" }}>
              <span style={{ fontSize:"24px", flexShrink:0, opacity: rolledToday?0.5:1 }}>⚄</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#8a7a58", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>{rolledToday ? "ORDRE REFUSÉ" : "AUCUN ORDRE EN COURS"}</div>
                <div style={{ color:"#c8b9a0", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{rolledToday ? "Tu as décliné le Dé du Destin aujourd'hui. Reviens demain." : "Tape pour tenter ta chance auprès du Chapelain"}</div>
              </div>
              {onNav && <span style={{ color:"#8a7a58", fontSize:"15px", flexShrink:0 }}>›</span>}
            </div>
          );
        })())}

        {/* ── Citation du jour ── */}
        <div className="hc-bare orn" onClick={() => onNav && onNav("stats")} style={{ background:"#08060488", border:"1px solid #1c1a1699", borderLeft:"3px solid #b8922a", padding:"14px 16px", marginBottom:"12px", cursor:onNav?"pointer":"default", touchAction:"manipulation" }}>
          {(() => {
            const now = Date.now();
            const hist = appState.paintHistory || [];
            const last14 = hist.filter(h => h.day && new Date(h.day).getTime() >= now - 14*86400000).length;
            const lp = appState.lastPaintAt;
            const daysIdle = lp ? Math.floor((now - new Date(lp).getTime())/86400000) : 999;
            let w;
            if (last14 >= 8)       w = { icon:"✹", text:"Les forges rougeoient", col:"#c07030" };
            else if (last14 >= 4)  w = { icon:"⚔", text:"La ferveur monte", col:"#b8922a" };
            else if (last14 >= 1)  w = { icon:"✦", text:"Les braises couvent", col:"#8a7a4a" };
            else if (!hist.length && !lp) w = { icon:"✧", text:"Les premières lueurs", col:"#9a8a5a" };
            else if (daysIdle > 30)w = { icon:"❄", text:"Le silence des forges", col:"#5a6a7a" };
            else                   w = { icon:"☁", text:"Le calme avant la tempête", col:"#6a6a5a" };
            return (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"8px" }}>
                <span style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>MESSAGE DU CHAPELAIN</span>
                <span style={{ color:w.col, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{w.icon} {w.text}</span>
              </div>
            );
          })()}
          <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Crimson Pro',Georgia,serif", fontStyle:"italic", lineHeight:1.5, marginBottom:"6px" }}>« {citation.text} »</div>
          <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>— {citation.author}</div>
        </div>

        {/* ── Conseil de l'Archiviste : la relique à peindre ensuite, et pourquoi (lib/counsel.jsx) ── */}
        {(() => {
          const c = chaplainCounsel({ inventory, ptsMap, oath: appState.oath, fateChoice: appState.fateChoice, listNames: listNames || {} });
          if (!c) return null;
          const acc = FACTIONS[c.faction]?.accent || "#b8922a";
          // Nom en clair, souligné à la couleur de l'armée : écrit dans la couleur de l'armée, il
          // devenait illisible sur un fond de la même teinte (rouge Tyranide sur un fond rouge).
          const Name = <span style={{ color:"#f4e4b0", fontStyle:"normal", fontFamily:"'Cinzel',serif", fontSize:"13px", borderBottom:`1px solid ${acc}`, paddingBottom:"1px" }}>{c.name}</span>;
          const pts = c.pts > 0 ? `${c.pts.toLocaleString("fr")} points` : null;
          const wip = c.item.paintStatus === "wip";
          const army = c.army ? `l'armée ${c.army}` : "ton armée";
          const Rank = <span style={{ color:"#e0c060", fontStyle:"normal" }}>« {c.rank} »</span>;
          const V = wip ? "Achève" : "Peins", v = wip ? "achève" : "peins";
          const Pts = pts ? <> : {pts}</> : null;
          // Trois formules par cas. Le tirage dépend du jour et de la relique : la phrase reste
          // la même toute la journée, et change le lendemain ou quand le conseil change.
          const variants =
              c.kind === "oath" ? [
                <>Tu as juré. {Name} attend ton pinceau avant toute autre.</>,
                <>Un serment brûle encore : {Name} passe avant tout le reste.</>,
                <>La bougie se consume. {Name} d'abord, le reste ensuite.</> ]
            : c.kind === "fate" ? [
                <>Le Dé a parlé : {Name}. On ne discute pas le Destin.</>,
                <>Le Destin a désigné {Name}. L'Archiviste ne fait que transmettre.</>,
                <>Tu as accepté l'ordre du Dé. {Name} t'attend sur l'établi.</> ]
            : c.kind === "complete" ? [
                <>{V} {Name} : c'est la dernière relique, et {army} sera entièrement consacrée.</>,
                <>Il ne reste que {Name}. Un dernier effort, et {army} n'aura plus une once de gris.</>,
                <>Une seule relique sépare {army} de la perfection : {Name}.</> ]
            : c.kind === "promotion" ? [
                <>{V} {Name} : {pts}, et {army} passe au rang {Rank}.</>,
                <>{Name} vaut {pts}. C'est assez pour porter {army} au rang {Rank}.</>,
                <>Le rang {Rank} est à portée : {v} {Name}, et {army} l'obtient.</> ]
            : c.rank ? [
                <>{V} {Name}{Pts}. Il ne manquera plus que {c.gap.toLocaleString("fr")} points à {army} pour le rang {Rank}.</>,
                <>{V} {Name}{Pts}. Le rang {Rank} ne sera plus qu'à {c.gap.toLocaleString("fr")} points pour {army}.</>,
                <>{wip ? "Termine" : "Commence par"} {Name} : ensuite, {army} sera à {c.gap.toLocaleString("fr")} points du rang {Rank}.</> ]
            : [ <>{V} {Name}{pts ? <> : {pts} de plus pour {army}.</> : <> : {army} l'attend.</>}</> ];
          const line = variants[(dayNum + String(c.item.id).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % variants.length];
          return (
            <div className="hc-bare orn" onClick={() => onOpenInInventory && onOpenInInventory(c.faction, c.item.id)}
              style={{ background:"#08060488", border:"1px solid #1c1a1699", borderLeft:`3px solid ${acc}`, padding:"12px 14px", marginBottom:"12px", cursor:"pointer", touchAction:"manipulation" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"6px" }}>
                <span style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>CONSEIL DE L'ARCHIVISTE</span>
                <span style={{ color:"#8a7a58", fontSize:"14px" }}>›</span>
              </div>
              <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Crimson Pro',Georgia,serif", fontStyle:"italic", lineHeight:1.5 }}>{line}</div>
            </div>
          );
        })()}

        {/* ── Tarot du Reliquaire : rappel de la lame de la semaine ── */}
        {tarotUnlocked && (
          <div className="hc-bare orn" onClick={() => { setTarotFlipped(true); setTarotOpen(true); playSfx("carte"); }}
            style={{ background:"#08060488", border:"1px solid #1c1a1699", borderLeft:"3px solid #b8922a", padding:"11px 13px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"11px", cursor:"pointer", touchAction:"manipulation" }}>
            <span style={{ color:"#e0c060", fontSize:"20px", flexShrink:0, display:"flex" }}>
              {thisWeekCard.icon.startsWith("svg:") ? <NavIcon id={thisWeekCard.icon.slice(4)} size={20} color="currentColor" /> : thisWeekCard.icon}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#8a7a58", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>TAROT DE LA SEMAINE · {thisWeekCard.numeral}</div>
              <div style={{ color:"#e0c060", fontSize:"12.5px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{thisWeekCard.name}{thisWeekCard.reversed ? <span style={{ color:"#d08060", fontWeight:400, fontSize:"11px" }}> · renversée</span> : null}</div>
            </div>
            <span style={{ color:"#8a7a58", fontSize:"14px", flexShrink:0 }}>›</span>
          </div>
        )}

        {/* ── Rappel du Chapelain ── */}
        {(() => {
          const lp = appState.lastPaintAt;
          if (!lp) return null;
          const days = Math.floor((Date.now() - new Date(lp).getTime()) / 86400000);
          if (days < 14) return null;
          // Trois formules par palier ; elle change chaque jour (le nombre de jours sert de tirage)
          const tiers = days >= 60 ? [
              `☠ ${days} jours sans coup de pinceau. Le Chapelain a cessé de prier pour toi.`,
              `☠ ${days} jours. Tes pinceaux ont été déclarés disparus au combat.`,
              `☠ ${days} jours de silence. Même la pile de honte s'inquiète.` ]
            : days >= 30 ? [
              `⸸ ${days} jours d'inactivité. L'Empereur détourne le regard.`,
              `⸸ ${days} jours sans peindre. Les pots sèchent, la foi aussi.`,
              `⸸ ${days} jours. Le Chapelain a demandé de tes nouvelles. Sèchement.` ]
            : [
              `⚠ Frère, ${days} jours sans peindre. L'Empereur observe.`,
              `⚠ ${days} jours sans peindre, frère. L'établi prend la poussière.`,
              `⚠ ${days} jours. Une couche, une seule, et l'honneur est sauf.` ];
          const msg = tiers[days % tiers.length];
          const col = days >= 60 ? "#c04040" : days >= 30 ? "#a05030" : "#8a7a2a";
          return (
            <div onClick={() => onNav && onNav("shame")} style={{ background:"#0e0806cc", borderLeft:`3px solid ${col}`, padding:"8px 12px", marginBottom:"8px", cursor:onNav?"pointer":"default", touchAction:"manipulation" }}>
              <div style={{ color:col, fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{msg}</div>
            </div>
          );
        })()}

        {/* ── Mise en place de la collection (7 premiers jours) : remplace le Shame-o-meter ── */}
        {enrolDaysLeft(appState) > 0 && (() => {
          const left = enrolDaysLeft(appState), done = ENROL_DAYS - left;
          const nArmies = Object.keys(FACTIONS).filter(k => (appState.inventory||[]).some(i => i.faction === k)).length;
          return (
            <div className="hc-bare orn" onClick={() => onNav && onNav("inventory")} style={{ background:"linear-gradient(180deg,#0d0b0888 0%,#08060488 100%)", border:"1px solid #1c1a1699", borderTop:"2px solid #b8922a", padding:"14px 16px", marginBottom:"8px", cursor:onNav?"pointer":"default", touchAction:"manipulation" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"8px" }}>
                <div style={{ color:"#b8922a", fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>MISE EN PLACE DE LA COLLECTION</div>
                <div className="stat-hero" style={{ color:"#e0c060", fontSize:"22px", lineHeight:1 }}>J-{left}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:`repeat(${ENROL_DAYS}, 1fr)`, gap:"4px", marginBottom:"9px" }}>
                {Array.from({ length: ENROL_DAYS }, (_, k) => (
                  <div key={k} style={{ height:"6px", borderRadius:"2px", background: k < done ? "#b8922a" : k === done ? "#b8922a66" : "#0a0806", border:"1px solid #2a2215" }} />
                ))}
              </div>
              <div style={{ color:"#e0d4b4", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45 }}>
                Entre tes figurines à ton rythme. Le jugement du Chapelain et les grands trophées attendront la fin de l'enrôlement.
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px" }}>
                <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{totalModels} figurine{totalModels > 1 ? "s" : ""} enregistrée{totalModels > 1 ? "s" : ""}</div>
                <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{nArmies} armée{nArmies > 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })()}

        {/* ── Shame-o-meter ── */}
        {enrolDaysLeft(appState) === 0 && <div className="hc-bare orn" onClick={() => onNav && onNav("shame")} style={{ background:"linear-gradient(180deg,#0d0b0888 0%,#08060488 100%)", border:"1px solid #1c1a1699", borderTop:`2px solid ${shameColor}`, padding:"14px 16px", marginBottom:"8px", cursor:onNav?"pointer":"default", touchAction:"manipulation" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
            <div style={{ color:shameColor, fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{shameTitle}</div>
            <div style={{ color:shameColor, fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"900" }}>{paintPct}%</div>
          </div>
          <div style={{ height:"6px", background:"#0a0806", borderRadius:"3px", marginBottom:"8px" }}>
            <div style={{ width:`${paintPct}%`, height:"100%", background:shameColor, borderRadius:"3px", transition:"width 0.8s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{totalPainted} figurines peintes</div>
            <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{totalModels} au total</div>
          </div>
          {(() => { const c = colossusCount(inventory, ptsMap); return c.total > 0 && (
            <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"6px" }}>dont {c.total} colosse{c.total>1?"s":""} · {c.painted} consacré{c.painted>1?"s":""}</div>
          ); })()}
        </div>}

        {/* ── Serment de Croisade : une figurine, une bougie, jamais d'échec ── */}
        {(() => {
          const oath = appState.oath;
          const rec  = appState.oathRecord || {};
          if (!oath) {
            return (
              <button onClick={() => { setOathPick(null); setOathOpen(true); }}
                className="hc-bare" style={{ width:"100%", background:"#08060466", border:"1px solid #1c1a1699", borderLeft:"2px solid #b8922a", padding:"10px 12px", marginBottom:"8px", cursor:"pointer", touchAction:"manipulation", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:"#d4b060", fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>☩ PRÊTER SERMENT</span>
                {rec.kept ? <span style={{ color:"#9a8a6a", fontSize:"11px", fontFamily:"'Cinzel',serif" }}>{rec.kept} serment{rec.kept>1?"s":""} tenu{rec.kept>1?"s":""}</span> : <span style={{ color:"#9a8a6a", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>trois parchemins t'attendent</span>}
              </button>
            );
          }
          const cs = candleState(oath);
          const target = oath.unitId ? (appState.inventory||[]).find(i => i.id === oath.unitId) : null;
          const text = oath.label || (target ? oathFormula(target) : `Je jure de consacrer ${oath.target} figurine${oath.target>1?"s":""}.`);
          // Ancien serment chiffré : progression depuis la date du serment
          const legacy = !oath.unitId;
          const prog = legacy ? (appState.paintHistory||[]).reduce((acc,h) => {
            const when = h.day || (h.date ? h.date+"-01" : null);
            if (!when || when < oath.sworn) return acc;
            const it = (appState.inventory||[]).find(i => i.id === h.id); if (!it) return acc;
            return acc + getModelCount(findUnit(it.faction, it.unitId)?.name, it.qty||1, it.modelCount);
          }, 0) : 0;
          const col = cs.asleep ? "#8a7a5a" : "#d4b060";
          return (
            <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,#0d0b0888 0%,#08060488 100%)", border:"1px solid #1c1a1699", borderLeft:`2px solid ${col}`, padding:"12px 14px", marginBottom:"8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"8px" }}>
                <div style={{ color:col, fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>☩ SERMENT DE CROISADE</div>
                <div style={{ color:"#9a8a6a", fontSize:"11px", fontFamily:"'Cinzel',serif" }}>{cs.asleep ? "EN SOMMEIL" : `bougie · ${cs.daysLeft} j`}</div>
              </div>
              <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                <OathCandle pct={cs.pct} asleep={cs.asleep} />
                <div style={{ flex:1 }}>
                  <div style={{ color:"#e0d4b4", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45 }}>« {text} »</div>
                  {legacy && <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>{Math.min(prog, oath.target)} / {oath.target} consacrées</div>}
                  {/* Ancien serment chiffré déjà accompli : on le consigne d'un geste pour libérer la place */}
                  {legacy && prog >= (oath.target || 1) && onKeepLegacyOath && (
                    <button onClick={() => onKeepLegacyOath()} style={{ marginTop:"8px", padding:"7px 12px", background:"#5a8a3a22", border:"1px solid #6a9a4a", color:"#a8d088", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1.5px", cursor:"pointer" }}>☩ SERMENT ACCOMPLI · LE CONSIGNER</button>
                  )}
                  {target && !cs.asleep && <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", marginTop:"4px" }}>{target.nickname && unitNameOf(target) ? <span style={{ color:"#b8a882" }}>{unitNameOf(target)} · </span> : null}Le serment sera tenu dès que cette relique passera à « Peinte ».</div>}
                </div>
              </div>
              {cs.asleep ? (
                <>
                  <div style={{ color:"#b8a882", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"10px 0 8px" }}>La bougie s'est éteinte. Le serment dort, il n'est pas rompu.</div>
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button onClick={() => onRelightOath && onRelightOath()} style={{ flex:1, padding:"8px", background:"#b8922a1f", border:"1px solid #b8922a", color:"#e8c860", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1.5px", cursor:"pointer" }}>RALLUMER</button>
                    <button onClick={() => onReleaseOath && onReleaseOath()} style={{ flex:1, padding:"8px", background:"none", border:"1px solid #4a3e28", color:"#b0a080", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1.5px", cursor:"pointer" }}>SE DÉLIER</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"right", marginTop:"6px" }}>
                  <button onClick={() => confirm ? confirm("Te délier de ce serment ? Aucune honte : la Croisade est longue.", () => onReleaseOath && onReleaseOath(), "#b8922a", "SE DÉLIER", false) : (onReleaseOath && onReleaseOath())}
                    style={{ background:"none", border:"none", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"1.5px", cursor:"pointer", padding:0 }}>SE DÉLIER</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Modal Blason de Croisade ── */}
        {herOpen && (
          <div onClick={() => setHerOpen(false)} style={{ position:"fixed", inset:0, background:"#000000d4", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
            <div onClick={e => e.stopPropagation()} className="ornate-corners" style={{ width:"100%", maxWidth:"360px", maxHeight:"90dvh", overflowY:"auto", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#14100a 0%,#0a0806 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"18px 16px" }}>
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>HÉRALDIQUE IMPÉRIALE</div>
              <div className="gold-shine-slow" style={{ fontSize:"16px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", marginBottom:"14px", textAlign:"center" }}>MA CROISADE</div>
              {/* Aperçu */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"18px", padding:"6px 0" }}>
                <CrusadeBlazon oaths={appState.oathRecord?.kept || 0} shape={herShape} symbol={herSymbol} division={herDivision} metal={herMetal} c1={herC1} c2={herC2} motto={herMotto} size={96} />
              </div>
              {/* Nom */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>NOM DE LA CROISADE</div>
              <input value={herName} onChange={e => setHerName(e.target.value)} placeholder="ex : La Croisade des Cendres" maxLength={32}
                style={{ width:"100%", background:"#060402", border:"1px solid #2a2215", color:"#e8dfc0", padding:"9px 10px", fontSize:"15px", fontFamily:"'Cinzel',serif", outline:"none", boxSizing:"border-box", marginBottom:"12px" }} />
              {/* Devise */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>DEVISE <span style={{ color:"#9a8a6a" }}>(listel)</span></div>
              <input value={herMotto} onChange={e => setHerMotto(e.target.value)} placeholder="ex : Sans peur ni faille" maxLength={28}
                style={{ width:"100%", background:"#060402", border:"1px solid #2a2215", color:"#d4b860", padding:"8px 10px", fontSize:"13px", fontFamily:"'Cinzel',serif", outline:"none", boxSizing:"border-box", marginBottom:"12px" }} />
              {/* Forme d'écu */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>FORME DE L'ÉCU</div>
              <div style={{ display:"flex", gap:"5px", marginBottom:"14px", justifyContent:"space-between" }}>
                {[["heater","Chauffe"],["pointed","Pointu"],["bouche","À bouche"],["round","Templier"],["spade","Lance"]].map(([s,lbl]) => (
                  <button key={s} onClick={() => setHerShape(s)}
                    style={{ flex:1, padding:"6px 2px 4px", background: herShape===s?"#b8922a1a":"none", border:`1px solid ${herShape===s?"#b8922a":"#4a3e28"}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                    <CrusadeBlazon shape={s} symbol={herSymbol} division={herDivision} metal={herMetal} c1={herC1} c2={herC2} size={22} />
                    <span style={{ color: herShape===s?"#f0d070":"#a89878", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"0.2px" }}>{lbl}</span>
                  </button>
                ))}
              </div>
              {/* Symbole */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>EMBLÈME</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"5px", marginBottom:"14px" }}>
                {EMBLEME_IDS.map(s => (
                  <button key={s} onClick={() => setHerSymbol(s)} title={EMBLEMES[s].label}
                    style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", background: herSymbol===s?"#b8922a1a":"#060402", border:`1px solid ${herSymbol===s?"#b8922a":"#4a3e28"}`, cursor:"pointer", padding:"5px" }}>
                    <div style={{ width:"100%", height:"100%", color: herSymbol===s?"#e8c860":"#a8946a" }}><Emblem id={s} color="currentColor" size="100%" /></div>
                  </button>
                ))}
              </div>
              {/* Division */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>PARTITION DU CHAMP</div>
              <div style={{ display:"flex", gap:"5px", marginBottom:"14px" }}>
                {[["plain","Plein"],["parti","Parti"],["coupe","Coupé"],["ecartele","Écartelé"]].map(([d,lbl]) => (
                  <button key={d} onClick={() => setHerDivision(d)} style={{ flex:1, padding:"7px 2px", background: herDivision===d?"#b8922a1a":"none", border:`1px solid ${herDivision===d?"#b8922a":"#4a3e28"}`, color: herDivision===d?"#f0d070":"#a89878", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"0.5px", cursor:"pointer" }}>{lbl}</button>
                ))}
              </div>
              {/* Métal de l'emblème */}
              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>MÉTAL DE L'EMBLÈME</div>
              <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
                {[["or","Or"],["argent","Argent"]].map(([m,lbl]) => (
                  <button key={m} onClick={() => setHerMetal(m)} style={{ flex:1, padding:"8px", background: herMetal===m?"#b8922a1a":"none", border:`1px solid ${herMetal===m?"#b8922a":"#4a3e28"}`, color: herMetal===m?"#f0d070":"#a89878", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>{lbl}</button>
                ))}
              </div>
              {/* Émaux (couleurs héraldiques) */}
              <div style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>ÉMAIL I</div>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {[["#7a1518","Gueules"],["#16305a","Azur"],["#1a4a2a","Sinople"],["#4a1a4a","Pourpre"],["#0a0a0a","Sable"],["#8a6d1e","Or"]].map(([col,n]) => (
                      <button key={col} title={n} onClick={() => setHerC1(col)} style={{ width:"26px", height:"26px", background:col, border:`2px solid ${herC1===col?"#e8dfc0":"transparent"}`, cursor:"pointer" }} />
                    ))}
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>ÉMAIL II</div>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {[["#0a0a0a","Sable"],["#7a1518","Gueules"],["#16305a","Azur"],["#1a4a2a","Sinople"],["#3a3a42","Argent"],["#1a1508","Brun"]].map(([col,n]) => (
                      <button key={col} title={n} onClick={() => setHerC2(col)} style={{ width:"26px", height:"26px", background:col, border:`2px solid ${herC2===col?"#e8dfc0":"#2a2215"}`, cursor:"pointer" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                {crusade && <button onClick={() => { onSetCrusade(null); setHerOpen(false); }} style={{ padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>EFFACER</button>}
                <button onClick={() => setHerOpen(false)} style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
                <button onClick={() => { if(herName.trim()){ onSetCrusade({ name:herName.trim(), shape:herShape, symbol:herSymbol, division:herDivision, metal:herMetal, motto:herMotto.trim()||null, c1:herC1, c2:herC2 }); setHerOpen(false); } }}
                  style={{ flex:1, padding:"10px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ SCELLER</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rituel des trois parchemins ── */}
        {oathOpen && (() => {
          const burned = appState.oathBurnDay === localDay();
          const parch = drawParchments(inventory, ptsMap || {}, localDay(), burned ? 1 : 0);
          const chosen = oathPick != null ? parch[oathPick] : null;
          return (
            <div onClick={() => setOathOpen(false)} style={{ position:"fixed", inset:0, background:"#000000d8", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"18px" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"360px", maxHeight:"92dvh", overflowY:"auto", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#120e08 0%,#080604 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"18px 16px" }}>
                <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>DEVANT L'EMPEREUR</div>
                <div style={{ color:"#efe4c4", fontSize:"16px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900, textAlign:"center", margin:"2px 0 8px" }}>PRÊTER SERMENT</div>
                {!parch.length ? (
                  <div style={{ color:"#d8c8ac", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", padding:"16px 0" }}>Ta pile est vide : aucun serment à prêter. Gloire à toi.</div>
                ) : !chosen ? (
                  <>
                    <div style={{ color:"#b8a882", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", marginBottom:"12px" }}>Trois parchemins scellés ont été déposés. Choisis celui que tu jures d'honorer.</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                      {parch.map((pc, k) => (
                        <button key={pc.item.id} onClick={() => { setOathPick(k); playSfx("sceau"); }}
                          style={{ position:"relative", textAlign:"left", padding:"12px 54px 12px 14px", background:"linear-gradient(180deg,#e2d4b0 0%,#cdbb92 100%)", border:"none", borderRadius:"2px", boxShadow:"0 4px 12px #000a", cursor:"pointer", animation:`viewFade 0.5s ${k*0.12}s ease both` }}>
                          <div style={{ color:"#6a4414", fontSize:"10.5px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>{pc.title.toUpperCase()}</div>
                          <div style={{ color:"#2a1c0c", fontSize:"15px", fontFamily:"'Cinzel',serif", fontWeight:700, margin:"3px 0 2px" }}>{nameOfItem(pc.item)}{pc.item.nickname && unitNameOf(pc.item) && <span style={{ color:"#6a5030", fontSize:"11px", fontWeight:400, fontStyle:"italic", fontFamily:"'Crimson Pro',serif", marginLeft:"7px", letterSpacing:0 }}>{unitNameOf(pc.item)}</span>}</div>
                          <div style={{ color:"#5a4628", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{pc.desc}</div>
                          <div style={{ position:"absolute", right:"12px", top:"50%", marginTop:"-18px", width:"36px", height:"36px", borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)", boxShadow:"0 2px 6px #0008", display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:"17px" }}>✠</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ textAlign:"center", marginTop:"14px" }}>
                      {burned
                        ? <div style={{ color:"#8a7a5a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>Les parchemins ont déjà brûlé aujourd'hui. De nouveaux viendront demain.</div>
                        : <button onClick={() => { onBurnParchments && onBurnParchments(); setOathPick(null); }}
                            style={{ background:"none", border:"1px solid #4a3e28", color:"#c8a060", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"2px", padding:"7px 12px", cursor:"pointer" }}>✦ BRÛLER LES PARCHEMINS</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ position:"relative", padding:"22px 18px 30px", background:"linear-gradient(180deg,#e8dcbc 0%,#d2c298 100%)", borderRadius:"2px", boxShadow:"0 6px 18px #000a", textAlign:"center", animation:"viewFade 0.5s ease both" }}>
                      <div style={{ color:"#6a4414", fontSize:"10.5px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>{chosen.title.toUpperCase()}</div>
                      {chosen.item.nickname && unitNameOf(chosen.item) && <div style={{ color:"#6a5030", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"3px" }}>{unitNameOf(chosen.item)}</div>}
                      <div style={{ color:"#2a1c0c", fontSize:"16px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginTop:"10px" }}>« {oathFormula(chosen.item)} »</div>
                      <div style={{ color:"#5a4628", fontSize:"12px", fontFamily:"'Crimson Pro',serif", marginTop:"10px" }}>Une bougie de {candleDaysFor(chosen.item, ptsMap || {}) === 60 ? "deux mois" : candleDaysFor(chosen.item, ptsMap || {}) === 21 ? "trois semaines" : "un mois"} veillera sur ce serment.</div>
                      {/* sceau brisé */}
                      {[0,1].map(k => (
                        <div key={k} style={{ position:"absolute", left:"50%", bottom:"-18px", width:"40px", height:"40px", marginLeft:"-20px", borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)",
                          clipPath: k ? "polygon(52% 0,100% 0,100% 100%,46% 100%,56% 62%,44% 38%)" : "polygon(0 0,52% 0,44% 38%,56% 62%,46% 100%,0 100%)",
                          animation:`${k ? "sealSplitR" : "sealSplitL"} 0.8s ease-out both` }} />
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"8px", marginTop:"28px" }}>
                      <button onClick={() => setOathPick(null)} style={{ flex:1, padding:"10px", background:"none", border:"1px solid #4a3e28", color:"#b0a080", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1.5px", cursor:"pointer" }}>UN AUTRE</button>
                      <button onClick={() => { onSwearOathOn && onSwearOathOn(chosen.item.id); playSfx("celebration", 0.6, "sceau"); setOathOpen(false); setOathPick(null); }}
                        style={{ flex:1.3, padding:"10px", background:"#b8922a26", border:"1px solid #b8922a", color:"#f0d070", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer" }}>☩ JE LE JURE</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Chiffres clés cliquables ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"12px" }}>
          {[
            { val: `${totalPts.toLocaleString('fr')}`, label:"PTS TOTAL",  color:"#b8922a", nav:"stats" },
            { val: `${Object.keys(FACTIONS).filter(k=>(appState.inventory||[]).some(i=>i.faction===k)).length}`, label:"ARMÉES", color:"#c0b090", nav:"inventory" },
            { val: `${Math.max(0, totalModels - totalPainted)}`, label:"À PEINDRE", color:"#8a5a3a", nav:"shame" },
          ].map(({ val, label, color, nav }) => (
            <button key={label} onClick={() => onNav(nav)} className="press-btn"
              style={{ flex:1, background:"#08060466", border:"1px solid #1c1a1699", padding:"12px 8px", textAlign:"center", cursor:"pointer", touchAction:"manipulation", borderBottom:`2px solid ${color}44` }}>
              <div className="stat-hero" style={{ color, fontSize:"22px", lineHeight:1 }}>{val}</div>
              <div style={{ color:"#8a7a58", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>{label}</div>
            </button>
          ))}
        </div>



        {/* ── Dernière activité ── */}
        {(() => {
          const history = appState.paintHistory || [];
          if (!history.length) return null;
          const last = history[history.length - 1];
          const invItem = (appState.inventory||[]).find(i => i.id === last.id);
          const unit = invItem ? UNIT_BY_ID.get(invItem.unitId) : null;
          const faction = invItem ? FACTIONS[invItem.faction] : null;
          return (
            <div style={{ borderTop:"1px solid #0d0b08", paddingTop:"12px" }}>
              <div style={{ color:"#7a6a48", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"8px" }}>DERNIÈRE ACTIVITÉ</div>
              <button className="hc-bare" onClick={openChronicle} style={{ width:"100%", textAlign:"left", display:"flex", alignItems:"center", gap:"10px", background:"#080604", border:"1px solid #1c1a16", padding:"10px 12px", cursor:"pointer", touchAction:"manipulation" }}>
                <span style={{ fontSize:"16px" }}>◈</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#e8dfc0", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>
                    {unit?.name || "Figurine"} {faction && <span style={{ color:faction.accent }}><FactionIcon faction={invItem.faction} size={14} /></span>}
                  </div>
                  <div style={{ color:"#c8b49a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", marginTop:"2px" }}>
                    Peinte en {(() => { const [y, m] = String(last.date || "").split("-"); const mois = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][parseInt(m, 10) - 1]; return mois ? `${mois} ${y}` : (last.date || "…"); })()}
                  </div>
                </div>
                <span style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", whiteSpace:"nowrap" }}><ScrollGlyph size={12} /> CHRONIQUES ›</span>
              </button>
            </div>
          );
        })()}

        </div>
      </div>
      </div>
    </div>
  );
}
