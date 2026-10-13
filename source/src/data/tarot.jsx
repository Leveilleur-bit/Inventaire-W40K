// ══════════════════════════════════════════════════════════
// TAROT DU RELIQUAIRE — jeux d'armée, lames renversées, lames personnelles, tirage en trois
// ══════════════════════════════════════════════════════════
import { TAROT_CARDS, isoWeekKey } from './lore.jsx';
import { findUnit } from './units.jsx';
import { POINTS_DB } from './points.jsx';

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// Illustration de la lame (public/tarot/tarot-NN.jpg), si tu l'as ajoutée
const NUM = { "0":0, I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12, XIII:13, XIV:14, XV:15, XVI:16, XVII:17, XVIII:18, XIX:19, XX:20, XXI:21 };
export const tarotImage = (numeral) => `${import.meta.env.BASE_URL}tarot/tarot-${String(NUM[numeral] ?? 0).padStart(2, "0")}.jpg`;

// ── Sens renversé du jeu impérial ──
const REVERSED = {
  I:"Le Trône peut attendre. Cette semaine, peins seulement ce qui te fait plaisir, sans rien prouver.",
  II:"Trop de recettes tuent l'envie. Ferme le livre et fie-toi à ta main.",
  III:"Pas de hasard cette semaine : choisis toi-même, et assume ton choix.",
  IV:"Assez attendu. Ce qui traîne depuis trop longtemps mérite une heure, aujourd'hui.",
  V:"Le colosse attendra encore. Et ce n'est pas grave.",
  VI:"Le silence te réussira cette semaine. Coupe la musique, écoute le pinceau.",
  VII:"Ta liste a raison, pour une fois. Suis l'ordre que tu t'étais fixé.",
  VIII:"Freine. Une seule figurine bien faite vaut mieux que trois bâclées.",
  IX:"L'équilibre peut pencher : cette semaine, un achat sans remords est permis.",
  X:"Partage ta session : peins avec quelqu'un, ou montre ton travail.",
  XI:"Ne jette rien : une vieille figurine oubliée mérite peut-être une seconde chance.",
  XII:"Oublie les détails. Avance à grands traits, la précision viendra après.",
  XIII:"La tentation est passée. Tu peux t'offrir quelque chose, tu l'as mérité.",
  XIV:"Reviens sur terre : ton armée actuelle a encore besoin de toi.",
  XV:"La brume est levée : tu sais exactement quoi peindre. Vas-y.",
  XVI:"Journée sans éclat ? Peins une petite figurine facile, juste pour le plaisir.",
  XVII:"Ne te retourne pas cette semaine. Ce qui compte, c'est la prochaine couche.",
  XVIII:"Pas besoin de terminer quoi que ce soit : avance un peu sur tout.",
  XIX:"Reviens aux bases. La technique que tu maîtrises te servira mieux que l'inconnu.",
  XX:"Le servo-crâne est revenu… avec un message illisible. Fais comme tu le sens.",
  "0":"Un plan, pour une fois. Prépare ta palette avant de commencer.",
  XXI:"Laisse le passé où il est. Tes vieilles figurines ont leur charme tel quel.",
};

// ── Jeux d'armée : [nom, sens, sens renversé] pour chaque lame ──
export const DECKS = {
  TY: { label:"Jeu de la Ruche", cards:{
    I:["L'Esprit de la Ruche","La Ruche ne dort jamais. Réveille la créature que tu laisses sommeiller depuis des mois.","Même la Ruche digère. Cette semaine, peins seulement ce qui te fait envie."],
    II:["Le Zoanthrope","La synapse se nourrit de savoir : consulte une recette avant d'attaquer.","Trop de pensées étouffent l'instinct. Laisse la main guider."],
    III:["La Spore Errante","La spore tombe où le vent la porte. Laisse le Dé du Destin choisir.","Pas de dérive cette semaine : choisis toi-même ta proie."],
    IV:["Le Lictor Patient","Le chasseur attend. La patience vaut mieux que la vitesse.","Assez guetté : frappe la proie qui traîne depuis trop longtemps."],
    V:["Le Bio-Titan","Une créature colossale attend dans l'ombre. C'est le moment de la réveiller.","Le monstre peut dormir encore. Et ce n'est pas grave."],
    VI:["Le Chant de la Ruche","Peins au rythme du chant qui te plaît, ou dans le silence du vide.","Coupe le bruit : écoute seulement le bruissement du pinceau."],
    VII:["La Synapse","Laisse l'instinct choisir la prochaine proie, pas ta liste.","La Ruche a un plan : suis l'ordre que tu t'étais fixé."],
    VIII:["La Marée d'Hormagaunts","Déferle vite cette semaine : vise haut et fonce.","Une seule créature bien achevée vaut mieux qu'une marée bâclée."],
    IX:["Le Bassin de Ponte","Une créature ajoutée, une créature consacrée : la Ruche aime l'équilibre.","Le bassin peut s'agrandir sans remords cette semaine."],
    X:["Le Rôdeur Solitaire","Chasse seul une session entière, sans distraction.","Chasse en meute : peins avec quelqu'un, ou montre ton travail."],
    XI:["La Carcasse","Abandonne la proie que tu ne dévoreras jamais. Termine celle que tu tiens.","Rien ne se perd pour la Ruche : ressors une vieille créature oubliée."],
    XII:["La Mue","Prends le temps de la mue : la précision avant la quantité.","Avance à grands traits, la chitine s'affinera plus tard."],
    XIII:["La Proie Tentante","Un monde-proie brille au loin : résiste une semaine à l'achat.","Le festin est permis : offre-toi une nouvelle créature."],
    XIV:["Les Flottes Lointaines","Rêve à la prochaine flotte-ruche, même si celle-ci n'a pas fini sa moisson.","La proie est ici : ta flotte actuelle a encore faim."],
    XV:["L'Ombre dans le Warp","Tout est brouillé cette semaine. Avance quand même, l'ombre finit toujours par se lever.","L'ombre se dissipe : tu sais exactement quoi peindre."],
    XVI:["Le Monde Dévoré","Jour de festin : attaque la créature la plus intimidante de ta pile.","Petite faim ? Une créature simple suffira, pour le plaisir."],
    XVII:["La Moisson","Contemple la moisson des quatre dernières semaines. Et sois fier de l'essaim.","Ne regarde pas en arrière : la prochaine couche seule compte."],
    XVIII:["L'Essaim Complet","Achève entièrement une seule couvée cette semaine.","Pas besoin d'achever : fais grandir toutes les couvées un peu."],
    XIX:["L'Adaptation","Évolue : une technique nouvelle résoudra un vieux problème.","Reviens à l'instinct premier : la technique que tu maîtrises."],
    XX:["La Synapse Rompue","Aucun ordre cette semaine : le lien synaptique s'est rompu.","Un ordre arrive, confus. Fais comme tu le sens."],
    "0":["Le Genestealer Égaré","Commence sans plan : laisse les couleurs muter à leur guise.","Planifie ta mutation : prépare ta palette avant de commencer."],
    XXI:["Le Norn Éveillé","Réveille une ancienne créature peinte et retouche-la avec ce que tu as appris.","Laisse les anciens dormir : ils ont leur charme tel quel."],
  }},
  IK: { label:"Jeu de la Maison", cards:{
    I:["Le Haut Monarque","Le Trône Méca s'impatiente. Ose le Chevalier que tu repousses depuis des mois.","Le Monarque accorde un répit : peins seulement ce qui te plaît."],
    II:["Le Sénéchal","Le savoir des ancêtres précède la charge : consulte une recette.","Ferme les archives de la Maison, fie-toi à ta main."],
    III:["La Joute du Destin","Laisse le Dé du Destin désigner ton adversaire.","Choisis toi-même ton champion cette semaine."],
    IV:["Le Chevalier Errant","Rien ne presse sur la longue route : la patience avant la vitesse.","La route s'arrête ici : attaque ce qui attend depuis trop longtemps."],
    V:["La Tour de la Maison","Un grand Chevalier t'attend dans le hangar. C'est le moment.","Le Chevalier peut rester au hangar encore. Et ce n'est pas grave."],
    VI:["Le Ménestrel","Peins en musique, comme aux tournois d'antan.","Le silence du hangar te réussira cette semaine."],
    VII:["L'Esprit du Trône Méca","Écoute les voix des ancêtres : laisse l'instinct choisir.","Tiens ton serment : suis l'ordre que tu t'étais fixé."],
    VIII:["La Charge","Lance la charge : vise haut et ne regarde pas en arrière.","Au pas : un seul Chevalier bien fini vaut mieux que trois bâclés."],
    IX:["Le Serment de Fer","Un Chevalier acquis, un Chevalier consacré : l'honneur l'exige.","La Maison peut s'enrichir sans remords cette semaine."],
    X:["La Veille d'Armes","Veille seul toute une session, sans distraction.","Réunis la cour : peins avec quelqu'un, ou montre ton travail."],
    XI:["Le Blason Effacé","Renonce au Chevalier que tu ne peindras jamais. Honore ceux que tu as commencés.","Relève un vieux blason oublié : il mérite une seconde chance."],
    XII:["L'Écuyer Appliqué","Soigne chaque héraldique : la précision avant la quantité.","Avance à grands traits, les blasons viendront après."],
    XIII:["Le Chevalier Déchu","La tentation guette : résiste une semaine entière à l'achat.","La Maison mérite un nouveau venu : offre-toi un Chevalier."],
    XIV:["Les Terres Lointaines","Rêve à ta prochaine Maison, même si celle-ci n'est pas complète.","Ta Maison actuelle a encore besoin de toi."],
    XV:["Le Brouillard du Champ","La bataille est incertaine : avance quand même.","Le champ est clair : tu sais quel Chevalier peindre."],
    XVI:["Le Tournoi","Jour de gloire : attaque le Chevalier le plus imposant de ton hangar.","Petite joute : un Armiger suffira, pour le plaisir."],
    XVII:["Le Conseil des Ancêtres","Contemple tes quatre dernières semaines. La Maison est fière.","Ne te retourne pas : la prochaine couche seule compte."],
    XVIII:["La Lance Complète","Achève entièrement une lance cette semaine.","Fais avancer toute la Maison, un peu chacun."],
    XIX:["Le Forgeron de la Maison","Essaie une technique nouvelle : l'armure n'en sera que plus belle.","Reviens aux gestes que tu maîtrises."],
    XX:["Le Héraut Perdu","Aucun message cette semaine : le héraut s'est égaré.","Le héraut est revenu, fourbu. Fais comme tu le sens."],
    "0":["Le Fou du Roi","Commence sans plan, laisse les couleurs choisir tes blasons.","Dessine ton blason avant de peindre."],
    XXI:["Le Roi-Chevalier Revenu","Ressors ton plus ancien Chevalier et retouche-le avec ce que tu as appris.","Laisse les anciens Chevaliers tels qu'ils sont : ils ont leur gloire."],
  }},
  CSM: { label:"Jeu des Puissances", cards:{
    I:["Le Trône de Crânes","Les Dieux méprisent l'inaction. Ose la figurine que tu repousses depuis des mois.","Les Puissances patientent : peins seulement ce qui te plaît."],
    II:["Le Sorcier","Le savoir interdit précède la victoire : consulte une recette.","Brûle le grimoire, fie-toi à ta main."],
    III:["Les Dés de Tzeentch","Le Changeant aime le hasard : laisse le Dé du Destin choisir.","Défie le destin : choisis toi-même."],
    IV:["Le Martyr Enchaîné","Dix mille ans d'attente t'ont appris la patience. Prends ton temps.","Assez de chaînes : attaque ce qui attend depuis trop longtemps."],
    V:["La Cathédrale Profanée","Un colosse attend dans l'ombre. Qu'il s'éveille.","Le colosse peut dormir encore. Et ce n'est pas grave."],
    VI:["Le Carnaval de Slaanesh","Peins en musique, avec excès.","Le silence a son charme : coupe la musique."],
    VII:["L'Oracle Aveugle","Laisse le Warp murmurer ta prochaine figurine.","Suis ton plan : même le Chaos a ses ordres."],
    VIII:["La Horde de Khorne","Du sang, du rythme : fonce sans regarder en arrière.","Même Khorne respecte le travail bien fait : une seule, mais parfaite."],
    IX:["Le Pacte","Chaque achat exige un sacrifice : une figurine peinte.","Le pacte est rompu : un achat sans remords est permis."],
    X:["L'Exilé","Retire-toi une session entière, loin de tout.","Rassemble ta bande : peins avec quelqu'un, ou montre ton travail."],
    XI:["La Pestilence","Laisse pourrir la pile que tu ne peindras jamais. Finis ce que tu as commencé.","Nurgle ne jette rien : ressors une vieille figurine oubliée."],
    XII:["L'Alchimiste","Dose chaque couche : la précision avant la quantité.","Grands traits, grand chaos : les détails viendront après."],
    XIII:["Le Tentateur","Une offre trop belle t'attend. Résiste une semaine.","Cède, pour une fois : tu l'as mérité."],
    XIV:["L'Œil de la Terreur","Rêve à ta prochaine bande, même si celle-ci n'est pas finie.","L'Œil se referme : ta bande actuelle t'attend."],
    XV:["Les Brumes du Warp","Tout se trouble. Avance quand même.","Le Warp s'apaise : tu sais quoi peindre."],
    XVI:["L'Étoile à Huit Branches","Jour faste : attaque la figurine la plus intimidante de ta pile.","Une petite offrande suffira : une figurine simple, pour le plaisir."],
    XVII:["Le Jugement des Dieux","Les Dieux contemplent tes quatre dernières semaines. Ils sont… satisfaits.","Ne regarde pas en arrière : les Dieux aiment l'avenir."],
    XVIII:["La Bande Complète","Achève entièrement une unité cette semaine.","Fais progresser toute ta bande, un peu chacun."],
    XIX:["Le Warpsmith","Une technique interdite résoudra un vieux problème.","Reviens aux rites que tu maîtrises."],
    XX:["Le Démon Égaré","Aucun présage cette semaine : le messager s'est perdu dans le Warp.","Le démon est revenu, avec un message illisible. Fais comme tu le sens."],
    "0":["Le Possédé","Laisse-toi posséder : commence sans plan.","Garde le contrôle : prépare ta palette."],
    XXI:["Le Prince Démon","Ressors ta plus vieille figurine et élève-la avec ce que tu as appris.","Les anciens damnés ont leur charme tel quel."],
  }},
  AE: { label:"Jeu des Chemins", cards:{
    I:["Le Chemin","Chaque Aeldari suit un Chemin. Le tien passe par l'œuvre que tu évites depuis des mois.","Aucun Chemin n'exige de hâte. Peins ce qui t'appelle."],
    II:["Le Prophète","La prescience précède le geste : médite une recette avant de peindre.","Trop de visions troublent la main. Fais confiance au présent."],
    III:["Les Runes du Destin","Les runes ont déjà choisi : laisse le Dé du Destin parler.","Les runes se taisent : le choix t'appartient."],
    IV:["L'Attente","Ce qui est éternel ne se presse jamais.","Même l'éternité a une fin : commence ce que tu repousses."],
    V:["Le Titan Spectral","Un géant d'os spectral attend son éveil. Écoute son appel.","Le géant dort encore. Le sommeil aussi est un chemin."],
    VI:["Le Chant de l'Harlequin","Peins au rythme d'une musique, comme dansent les Harlequins.","Le silence est aussi une danse."],
    VII:["Le Voyant","L'intuition voit plus loin que la liste.","La voie tracée a sa sagesse : suis-la."],
    VIII:["Le Guerrier Aspect","Revêts ton Aspect de guerre : avance avec ardeur.","Le guerrier sait aussi s'arrêter : une seule œuvre, mais parfaite."],
    IX:["L'Harmonie","À chaque acquisition répond une œuvre achevée.","L'harmonie tolère un déséquilibre passager : accorde-toi un plaisir."],
    X:["Le Solitaire","Marche seul une session entière, dans le silence.","Le vaisseau-monde est une communauté : partage ton art."],
    XI:["Le Deuil","Laisse partir ce que tu ne peindras jamais. Honore ce que tu as commencé.","Rien n'est tout à fait perdu : une vieille œuvre peut renaître."],
    XII:["La Patience de l'Artisan","La perfection naît de la lenteur. Soigne chaque détail.","Laisse l'ébauche respirer : la perfection viendra plus tard."],
    XIII:["La Soif","La Soif guette ceux qui désirent trop : résiste une semaine.","Un désir mesuré n'est pas une chute : offre-toi quelque chose."],
    XIV:["Les Étoiles Mortes","Contemple les étoiles et rêve de tes armées futures.","Les étoiles attendront : ton œuvre présente t'appelle."],
    XV:["Le Voile","Le futur est voilé. Avance quand même, à pas mesurés.","Le voile se lève : ta prochaine œuvre est claire."],
    XVI:["La Lumière d'Isha","Un jour lumineux : ose l'œuvre la plus ambitieuse.","Une lueur douce suffit : une petite œuvre, pour la joie."],
    XVII:["Le Miroir","Regarde ton œuvre des quatre dernières semaines, sans complaisance ni reproche.","Ne te contemple pas : crée."],
    XVIII:["La Complétude","Achève une seule œuvre, entièrement.","L'inachevé a sa beauté : avance un peu partout."],
    XIX:["Le Forgeur d'Âmes","Une technique nouvelle ouvrira un chemin inconnu.","La maîtrise est un chemin aussi : reviens à ce que tu sais."],
    XX:["La Pierre-Esprit Silencieuse","La pierre-esprit se tait cette semaine. Écoute ce silence.","Un murmure s'en échappe, incompréhensible. Suis ton cœur."],
    "0":["Le Fou Rieur","Cegorach rit des plans : commence sans schéma.","Même le Dieu Rieur prépare ses tours : prépare ta palette."],
    XXI:["Le Retour du Phénix","Ressors une œuvre ancienne et fais-la renaître.","Le passé est parfait tel qu'il fut. Laisse-le reposer."],
  }},
};
export const DECK_CHOICES = [["auto","Automatique"],["base","Impérial"],["TY","Tyranides"],["IK","Chevaliers"],["CSM","Chaos"],["AE","Aeldari"]];
const FACTION_DECK = { TY:"TY", GC:"TY", IK:"IK", CSM:"CSM", CK:"CSM", LD:"CSM", AE:"AE" };

// Jeu utilisé : réglage du CODEX, ou l'armée qui compte le plus de figurines peintes
export function deckKeyFor(appState = {}) {
  const pref = appState.tarotDeck || "auto";
  if (pref !== "auto") return pref;
  const count = {};
  (appState.inventory || []).forEach(i => { if (i.paintStatus === "painted") count[i.faction] = (count[i.faction] || 0) + (i.qty || 1); });
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return (top && FACTION_DECK[top[0]]) || "base";
}

// Une lame du jeu choisi, dans le bon sens
export function dressCard(base, deckKey, reversed) {
  const d = DECKS[deckKey]?.cards?.[base.numeral];
  const name = d ? d[0] : base.name;
  const text = d ? (reversed ? d[2] : d[1]) : (reversed ? (REVERSED[base.numeral] || base.text) : base.text);
  return { ...base, name, text, reversed, deckLabel: DECKS[deckKey]?.label || "Jeu impérial" };
}

// Lame de la semaine : même lame qu'avant (tirage inchangé) ; une fois sur quatre, renversée
export function weeklyCard(weekKey, deckKey, baseDraw) {
  const reversed = hash("renverse:" + weekKey) % 4 === 0;
  return dressCard(baseDraw, deckKey, reversed);
}

// ── Lames qui parlent de ta collection (une ligne ajoutée sous le texte) ──
const monthsSince = (s) => { if (!s) return null; const d = new Date(String(s).length === 7 ? s + "-15" : String(s).slice(0,10)); return isNaN(d) ? null : Math.max(0, Math.round((Date.now() - d) / (30.4 * 86400000))); };
const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
export function personalLine(numeral, ctx) {
  const { inventory = [], paintHistory = [], fateChoice, wishlist = [], ptsMap = {}, isColossus } = ctx;
  const nameOf = (i) => i.nickname || findUnit(i.faction, i.unitId)?.name || "une relique";
  const unitPts = (i) => ptsMap[`${i.faction}:${i.unitId}`] || POINTS_DB[findUnit(i.faction, i.unitId)?.name] || 0;
  const todo = inventory.filter(i => i.paintStatus !== "painted");
  const byAge = (arr) => arr.filter(i => i.purchasedAt).sort((a, b) => String(a.purchasedAt).localeCompare(String(b.purchasedAt)));
  const mo = (n) => `${n} mois`;
  switch (numeral) {
    case "I": { const o = byAge(todo)[0]; const m = o && monthsSince(o.purchasedAt); return o && m >= 2 ? `La plus ancienne en attente : ${nameOf(o)}, depuis ${mo(m)}.` : null; }
    case "V": { const c = byAge(todo.filter(i => isColossus && isColossus(i)))[0] || todo.find(i => isColossus && isColossus(i)); if (!c) return null; const m = monthsSince(c.purchasedAt); return m ? `${nameOf(c)} t'attend dans l'ombre depuis ${mo(m)}.` : `${nameOf(c)} t'attend dans l'ombre.`; }
    case "XVI": { const b = [...todo].sort((a, b) => unitPts(b) - unitPts(a))[0]; return b && unitPts(b) ? `La plus imposante de ta pile : ${nameOf(b)} (${unitPts(b).toLocaleString("fr")} pts).` : null; }
    case "XI": { const s = byAge(todo.filter(i => i.paintStatus === "sprue"))[0]; const m = s && monthsSince(s.purchasedAt); return s ? `Sur grappe depuis le plus longtemps : ${nameOf(s)}${m ? `, ${mo(m)}` : ""}.` : null; }
    case "XXI": {
      const first = {}; paintHistory.forEach(h => { const d = h.day || (h.date ? h.date + "-15" : ""); if (d && (!first[h.id] || d < first[h.id])) first[h.id] = d; });
      const p = inventory.filter(i => i.paintStatus === "painted" && first[i.id]).sort((a, b) => first[a.id].localeCompare(first[b.id]))[0];
      if (!p) return null; const d = new Date(first[p.id].slice(0,10));
      return `Ta plus ancienne relique consacrée : ${nameOf(p)}, en ${MOIS[d.getMonth()]} ${d.getFullYear()}.`;
    }
    case "XVII": {
      const lim = Date.now() - 28 * 86400000; const seen = new Set();
      const n = paintHistory.filter(h => { const d = new Date((h.day || (h.date ? h.date + "-15" : "")).slice(0,10)); if (isNaN(d) || d < lim || seen.has(h.id)) return false; seen.add(h.id); return true; }).length;
      return `Ces quatre dernières semaines : ${n} relique${n > 1 ? "s" : ""} consacrée${n > 1 ? "s" : ""}.`;
    }
    case "IX": {
      const _n = new Date(); const ym = `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,"0")}`; // mois LOCAL (pas UTC)
      const bought = inventory.filter(i => String(i.purchasedAt || "").startsWith(ym)).length;
      const painted = new Set(paintHistory.filter(h => (h.day || h.date || "").startsWith(ym)).map(h => h.id)).size;
      return `Ce mois-ci : ${bought} acquise${bought > 1 ? "s" : ""}, ${painted} consacrée${painted > 1 ? "s" : ""}.`;
    }
    case "III": { if (!fateChoice) return null; const it = inventory.find(i => i.id === fateChoice.id); return it && it.paintStatus !== "painted" ? `Ordre du Destin en cours : ${nameOf(it)}.` : null; }
    case "XIV": { const w = wishlist[0]; const u = w && findUnit(w.faction, w.unitId); return u ? `En tête de ta Wishlist : ${u.name}.` : null; }
    default: return null;
  }
}

// ── Tirage en trois lames (fêtes) : passé, présent, avenir ──
export const TRIPLE_FESTIVALS = new Set(["warp", "nouvelan", "ascension", "anniv-Anniversaire de ta Croisade"]);
const CLOSING = {
  warp: "Le Warp a parlé. Garde ces trois lames près de ton pinceau cette nuit.",
  nouvelan: "Que l'année qui s'ouvre suive le chemin que dessinent ces lames.",
  ascension: "En ce jour saint, les lames ont été tirées sous le regard de l'Empereur.",
};
export function tripleDraw(dayKey, deckKey, festivalId) {
  const idx = []; let k = 0;
  while (idx.length < 3 && k < 50) { const i = hash(`trois:${dayKey}:${k++}`) % TAROT_CARDS.length; if (!idx.includes(i)) idx.push(i); }
  const cards = idx.map((i, n) => dressCard(TAROT_CARDS[i], deckKey, hash(`trois-rev:${dayKey}:${n}`) % 4 === 0));
  const first = (t) => t.split(/(?<=[.!?])\s/)[0];
  const reading = `Ce qui fut : ${cards[0].name}${cards[0].reversed ? " (renversée)" : ""}. ${first(cards[0].text)} ` +
    `Ce qui est : ${cards[1].name}${cards[1].reversed ? " (renversée)" : ""}. ${first(cards[1].text)} ` +
    `Ce qui vient : ${cards[2].name}${cards[2].reversed ? " (renversée)" : ""}. ${first(cards[2].text)}`;
  return { cards, reading, closing: CLOSING[festivalId] || "Les archives de ta Croisade s'en souviendront." };
}
export { isoWeekKey };
