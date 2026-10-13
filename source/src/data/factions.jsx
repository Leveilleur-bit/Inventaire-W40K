
export const FACTIONS = {
  "SM": {
    label: "Space Marines", short: "SM", icon: "✠",
    accent: "#b8922a",        // or templier
    accent2: "#c9a84c",       // or clair
    bg: "#0c0a06",
    bgCard: "linear-gradient(180deg,rgba(26,21,16,0.6) 0%,rgba(18,14,8,0.72) 100%)",
    borderColor: "#b8922a",
    pageGrain: "#0a0806",
    watermark: "✠",
    glow: "#b8922a44",
  },
  "TY": {
    label: "Tyranides",    short: "TY", icon: "☠",
    accent: "#c22525",        // rouge chitin
    accent2: "#c43030",       // rouge sang vif
    bg: "#0a0404",
    bgCard: "linear-gradient(180deg,rgba(26,12,12,0.6) 0%,rgba(17,6,6,0.72) 100%)",
    borderColor: "#8a1a1a",
    pageGrain: "#080304",
    watermark: "☠",
    glow: "#8a1a1a44",
  },
  "IK": {
    label: "Chevaliers Imp.", short: "IK", icon: "⚜",
    accent: "#7a8a3a",        // vert acier héraldique
    accent2: "#a0b050",       // vert clair
    bg: "#060a04",
    bgCard: "linear-gradient(180deg,rgba(18,26,8,0.6) 0%,rgba(10,16,6,0.72) 100%)",
    borderColor: "#7a8a3a",
    pageGrain: "#060804",
    watermark: "⚜",
    glow: "#7a8a3a44",
  },
  "IM": {
    label: "Imperium",
    short: "IM",
    icon: "☩",
    accent: "#c0b090",
    bg: "#060608",
    bgCard: "linear-gradient(180deg,rgba(16,16,14,0.6) 0%,rgba(10,10,12,0.72) 100%)",
  },
  "CSM": {
    label: "Chaos SM",
    short: "CSM",
    icon: "✴",
    accent: "#c22525",
    bg: "#060202",
    bgCard: "linear-gradient(180deg,rgba(16,8,8,0.6) 0%,rgba(10,4,4,0.72) 100%)",
    watermark: "✴",
    glow: "#8a1a1a44",
  },
  "NC": {
    label: "Nécrons",
    short: "NC",
    icon: "⚙",
    accent: "#3a9a5a",
    accent2: "#50c070",
    bg: "#020a04",
    bgCard: "linear-gradient(180deg,rgba(6,18,8,0.6) 0%,rgba(3,10,5,0.72) 100%)",
    borderColor: "#3a9a5a",
    pageGrain: "#030804",
    watermark: "⚙",
    glow: "#3a9a5a44",
  },
  "AE": {
    label: "Aeldari",
    short: "AE",
    icon: "✧",
    accent: "#3a7aca",
    accent2: "#5a9ae0",
    bg: "#04060a",
    bgCard: "linear-gradient(180deg,rgba(8,14,24,0.6) 0%,rgba(5,8,16,0.72) 100%)",
    borderColor: "#3a7aca",
    pageGrain: "#04060a",
    watermark: "✧",
    glow: "#3a7aca44",
  },
  "AC": {
    label: "Custodes",
    short: "AC",
    icon: "⛨",
    accent: "#d4af37",
    accent2: "#e8c860",
    bg: "#0a0802",
    bgCard: "linear-gradient(180deg,rgba(24,18,6,0.6) 0%,rgba(14,10,4,0.72) 100%)",
    borderColor: "#d4af37",
    pageGrain: "#080602",
    watermark: "⛨",
    glow: "#d4af3744",
  },
  "OR": {
    label: "Orks",
    short: "OR",
    icon: "⚒",
    accent: "#7aba20",
    accent2: "#9ada40",
    bg: "#060a02",
    bgCard: "linear-gradient(180deg,rgba(14,20,6,0.6) 0%,rgba(8,12,3,0.72) 100%)",
    borderColor: "#7aba20",
    pageGrain: "#060a02",
    watermark: "⚒",
    glow: "#7aba2044",
  },
  "AM": {
    label: "Astra Militarum",
    short: "AM",
    icon: "✪",
    accent: "#8a8a3a",
    accent2: "#aaa050",
    bg: "#080803",
    bgCard: "linear-gradient(180deg,rgba(16,16,6,0.6) 0%,rgba(10,10,4,0.72) 100%)",
    borderColor: "#8a8a3a",
    pageGrain: "#080803",
    watermark: "✪",
    glow: "#8a8a3a44",
  },
  "GC": {
    label: "Cultes Genestealers", short: "GC", icon: "☣",
    accent: "#9740a9", accent2: "#a85ab8",
    bg: "#08040a", bgCard: "linear-gradient(180deg,rgba(18,8,24,0.6) 0%,rgba(10,4,14,0.72) 100%)",
    borderColor: "#8a3a9a", pageGrain: "#08040a",
    watermark: "☣", glow: "#8a3a9a44",
  },
  "AS": {
    label: "Adepta Sororitas", short: "AS", icon: "✝",
    accent: "#b04058", accent2: "#d06078",
    bg: "#0a0406", bgCard: "linear-gradient(180deg,rgba(22,8,16,0.6) 0%,rgba(14,4,8,0.72) 100%)",
    borderColor: "#b04058", pageGrain: "#0a0406",
    watermark: "✝", glow: "#b0405844",
  },
  "AD": {
    label: "Adeptus Mechanicus", short: "AD", icon: "✇",
    accent: "#c05a1a", accent2: "#e07a30",
    bg: "#0a0602", bgCard: "linear-gradient(180deg,rgba(22,12,4,0.6) 0%,rgba(14,8,3,0.72) 100%)",
    borderColor: "#c05a1a", pageGrain: "#0a0602",
    watermark: "✇", glow: "#c05a1a44",
  },
  "CK": {
    label: "Chevaliers du Chaos", short: "CK", icon: "⛧",
    accent: "#704fc3", accent2: "#7a5aca",
    bg: "#06040a", bgCard: "linear-gradient(180deg,rgba(14,8,22,0.6) 0%,rgba(8,4,14,0.72) 100%)",
    borderColor: "#5a3aaa", pageGrain: "#06040a",
    watermark: "⛧", glow: "#5a3aaa44",
  },
  "DR": {
    label: "Drukhari", short: "DR", icon: "☽",
    accent: "#2a8a7a", accent2: "#40aa96",
    bg: "#020a08", bgCard: "linear-gradient(180deg,rgba(6,20,16,0.6) 0%,rgba(4,12,10,0.72) 100%)",
    borderColor: "#2a8a7a", pageGrain: "#020a08",
    watermark: "☽", glow: "#2a8a7a44",
  },
  "TA": {
    label: "Empire T'au", short: "TA", icon: "◉",
    accent: "#4ab8c8", accent2: "#6ad0e0",
    bg: "#02080a", bgCard: "linear-gradient(180deg,rgba(6,18,22,0.6) 0%,rgba(4,10,14,0.72) 100%)",
    borderColor: "#4ab8c8", pageGrain: "#02080a",
    watermark: "◉", glow: "#4ab8c844",
  },
  "LD": {
    label: "Legiones Daemonica", short: "LD", icon: "♆",
    accent: "#b03a7a", accent2: "#d05a9a",
    bg: "#0a0408", bgCard: "linear-gradient(180deg,rgba(22,8,18,0.6) 0%,rgba(14,4,10,0.72) 100%)",
    borderColor: "#b03a7a", pageGrain: "#0a0408",
    watermark: "♆", glow: "#b03a7a44",
  },
  "LV": {
    label: "Ligues de Votann", short: "LV", icon: "⛏",
    accent: "#9a7a50", accent2: "#ba9a70",
    bg: "#0a0804", bgCard: "linear-gradient(180deg,rgba(20,16,6,0.6) 0%,rgba(12,10,4,0.72) 100%)",
    borderColor: "#9a7a50", pageGrain: "#0a0804",
    watermark: "⛏", glow: "#9a7a5044",
  },
  "GK": {
    label: "Grey Knights", short: "GK", icon: "✟",
    accent: "#7a92b0", accent2: "#9ab2d0",
    bg: "#040608", bgCard: "linear-gradient(180deg,rgba(10,14,20,0.6) 0%,rgba(6,8,12,0.72) 100%)",
    borderColor: "#7a92b0", pageGrain: "#040608",
    watermark: "✟", glow: "#7a92b044",
  },
};

// ══════════════════════════════════════════════════════════
// LORE & TITRES PAR FACTION
// ══════════════════════════════════════════════════════════
export const FACTION_LORE = {
  "SM":  "Les Adeptus Astartes sont l'épée de l'Empereur — des guerriers transhumains forgés pour la guerre éternelle. Chaque Chapitre garde ses rites, ses reliques et ses rancunes.",
  "TY":  "La Grande Dévoreuse ne connaît ni haine ni pitié — seulement la faim. Les flottes-ruches dévorent les mondes et laissent des rochers stériles.",
  "IK":  "Les Chevaliers Impériaux sont des maisons nobles anciennes, chaque machine portant l'âme et les honneurs de ses pilotes défunts. Honneur, tradition, dévastation.",
  "IM":  "Un million de mondes, un billion de destins — l'Imperium survit par la foi, le sang et l'obstination bureaucratique.",
  "CSM": "Jadis Astartes, désormais damnés. Dix mille ans dans l'Œil de la Terreur ont tordu leur chair et leur âme, mais pas leur soif de vengeance.",
  "NC":  "Endormis pendant soixante millions d'années, les Nécrons s'éveillent pour reprendre une galaxie qu'ils considèrent comme la leur. La chair fut leur faiblesse ; ils s'en sont libérés.",
  "AE":  "Une race mourante d'une élégance mortelle. Chaque Aeldari vit mille ans et danse au bord du gouffre creusé par sa propre arrogance.",
  "AC":  "Dorés, silencieux, inflexibles. Les Custodes gardent le Trône d'Or depuis dix mille ans — chacun vaut une compagnie d'Astartes.",
  "OR":  "WAAAGH! Les Orks vivent pour la baston. Plus c'est fort, plus c'est bruyant, mieux c'est. Ils gagnent parce qu'ils croient qu'ils gagnent.",
  "AM":  "Le marteau de l'Empereur. Des milliards de vies humaines, un fusil laser pour chacune, et la certitude que le Commissaire regarde.",
  "GC":  "Sous les cités-ruches, la famille prospère dans l'ombre. Quand les étoiles seront prêtes, le Patriarche appellera — et la ruche saignera.",
  "AS":  "La Foi est leur bouclier, la Flamme leur verdict. Les Sœurs de Bataille ne connaissent pas le doute — seulement le devoir sacré.",
  "AD":  "Louange à l'Omnimessie. La chair est faible, le métal est éternel, et la connaissance interdite se paie toujours.",
  "CK":  "Des maisons nobles tombées dans la damnation. Leurs machines hurlent désormais avec les voix des démons liés en leur cœur.",
  "DR":  "Les Drukhari survivent en volant la souffrance d'autrui. Commorragh est éternelle, cruelle, et affamée.",
  "TA":  "Pour le Bien Suprême. Jeune, technologique et étrangement optimiste — l'Empire T'au croit encore qu'un avenir meilleur est possible.",
  "LD":  "Les Puissances de la Ruine se manifestent. Sang, changement, pourriture, excès — chaque démon est une émotion faite chair.",
  "LV":  "Les Ligues de Votann exploitent la galaxie avec pragmatisme. Les Ancêtres jugent, les Kin obéissent, le profit prime.",
  "GK":  "Chevaliers Gris — le secret le mieux gardé de l'Imperium. Ceux qui les voient à l'œuvre ne vivent généralement pas assez pour en parler.",
};

export const FACTION_TITLES = {
  "SM":  [[0,"Néophyte"],[500,"Frère de Bataille"],[1500,"Vétéran"],[3000,"Champion du Chapitre"],[5000,"Maréchal"],[8000,"Grand Maître de Chapitre"]],
  "TY":  [[0,"Spore Errante"],[500,"Essaim Mineur"],[1500,"Nœud Synaptique"],[3000,"Terreur de la Ruche"],[5000,"Flotte-Ruche"],[8000,"Esprit de la Ruche"]],
  "IK":  [[0,"Écuyer"],[500,"Chevalier Errant"],[1500,"Chevalier Banneret"],[3000,"Seigneur du Bastion"],[5000,"Princeps"],[8000,"Princeps Senioris"]],
  "IM":  [[0,"Serviteur"],[500,"Agent"],[1500,"Acolyte"],[3000,"Inquisiteur"],[5000,"Lord Inquisiteur"],[8000,"Haut Seigneur"]],
  "CSM": [[0,"Cultiste"],[500,"Renégat"],[1500,"Champion Damné"],[3000,"Seigneur du Chaos"],[5000,"Élu des Dieux"],[8000,"Prince Démon"]],
  "NC":  [[0,"Guerrier Éveillé"],[500,"Immortel"],[1500,"Cryptek"],[3000,"Seigneur"],[5000,"Overlord"],[8000,"Roi Silencieux"]],
  "AE":  [[0,"Apprenti de la Voie"],[500,"Guerrier Aspect"],[1500,"Exarque"],[3000,"Autarque"],[5000,"Grand Voyant"],[8000,"Phénix Renaissant"]],
  "AC":  [[0,"Custodien"],[500,"Gardien du Trône"],[1500,"Tribun"],[3000,"Capitaine-Général"],[5000,"Gardien Éternel"],[8000,"Compagnon de l'Empereur"]],
  "OR":  [[0,"Grot"],[500,"Boy"],[1500,"Nob"],[3000,"Big Boss"],[5000,"Warboss"],[8000,"WAAAGH! Boss"]],
  "AM":  [[0,"Conscrit"],[500,"Garde"],[1500,"Sergent"],[3000,"Commissaire"],[5000,"Lord Général"],[8000,"Lord Solar"]],
  "GC":  [[0,"Néophyte"],[500,"Acolyte"],[1500,"Primus"],[3000,"Magus"],[5000,"Patriarche"],[8000,"Ruche Ascendante"]],
  "AS":  [[0,"Novice"],[500,"Sœur de Bataille"],[1500,"Palatine"],[3000,"Canonesse"],[5000,"Abbesse"],[8000,"Sainte Vivante"]],
  "AD":  [[0,"Servitor"],[500,"Skitarii"],[1500,"Tech-Prêtre"],[3000,"Magos"],[5000,"Archimagos"],[8000,"Fabricator General"]],
  "CK":  [[0,"Damné"],[500,"Chevalier Renégat"],[1500,"Seigneur Infernal"],[3000,"Tyran Damné"],[5000,"Élu de la Ruine"],[8000,"Roi des Chevaliers Déchus"]],
  "DR":  [[0,"Esclave"],[500,"Kabalite"],[1500,"Sybarite"],[3000,"Archonte"],[5000,"Seigneur de Commorragh"],[8000,"Tyran de la Cité Sombre"]],
  "TA":  [[0,"Shas'la"],[500,"Shas'ui"],[1500,"Shas'vre"],[3000,"Shas'el"],[5000,"Shas'o"],[8000,"Commandeur Suprême"]],
  "LD":  [[0,"Sbire du Warp"],[500,"Héraut"],[1500,"Élu"],[3000,"Grand Démon"],[5000,"Favori des Dieux"],[8000,"Avatar de la Ruine"]],
  "LV":  [[0,"Kin"],[500,"Hearthkyn"],[1500,"Einhyr"],[3000,"Kâhl"],[5000,"Grimnyr"],[8000,"Voix des Ancêtres"]],
  "GK":  [[0,"Initié"],[500,"Justicar"],[1500,"Paladin"],[3000,"Brother-Captain"],[5000,"Grand Master"],[8000,"Suprême Grand Master"]],
};

export function factionTitle(faction, pts) {
  const list = FACTION_TITLES[faction];
  if (!list) return null;
  let t = list[0][1];
  for (const [min, label] of list) if (pts >= min) t = label;
  return t;
}

// ── Codex Vivant : un texte de fluff généré à partir de la vraie composition
// d'armée (répartition par rôle), pas un texte figé — change selon ce que le
// joueur possède réellement, dans le style d'une notice de codex Warhammer.
export function generateArmyLore(grouped, totalCount, seedKey) {
  if (!totalCount) return null;
  const pct = (roles) => roles.reduce((s,r) => s + (grouped[r]?.length||0), 0) / totalCount;
  const troupes = pct(["Troupes"]);
  const qg = pct(["QG"]);
  const lourd = pct(["Soutien lourd","Lourd","Titanique","Seigneur de guerre"]);
  const rapide = pct(["Rapide","Attaque rapide"]);
  const transport = pct(["Transport"]);
  const elite = pct(["Élite"]);
  const chevalier = pct(["Chevalier Acastus","Chevalier Cerastus","Chevalier Dominus","Chevalier Questoris","Armiger"]);
  const hasTitan = (grouped["Titanique"]?.length||0) > 0 || (grouped["Seigneur de guerre"]?.length||0) > 0;

  // Racine déterministe (pas Math.random) : la même composition donne toujours le
  // même texte tant que rien ne change dans l'armée, mais deux armées différentes —
  // ou la même après avoir peint davantage — tombent sur des formulations différentes.
  let h = 0; const seed = String(seedKey||"") + totalCount;
  for (let i=0;i<seed.length;i++) h = (h*31 + seed.charCodeAt(i)) >>> 0;
  const pick = (arr, salt=0) => arr[(h + salt) % arr.length];

  // Traits possibles, chacun avec un poids (plus haut = plus notable) et plusieurs
  // formulations possibles — on retient les 2 traits les plus marquants et on tire
  // une formulation par trait selon la racine déterministe.
  const traits = [];
  if (hasTitan) traits.push({ w:1.0, texts:[
    "portée par la présence écrasante d'un Titan sur le champ de bataille",
    "où un Titan projette son ombre sur tous les autres combattants",
    "dont la seule silhouette du Titan suffit à vider certains champs de bataille" ] });
  if (chevalier >= 0.6) traits.push({ w:0.95, texts:[
    "formée en phalange de Chevaliers, indifférente aux petites escarmouches",
    "où le fracas des Chevaliers couvre tous les autres bruits de la guerre",
    "bâtie autour d'une colonne de Chevaliers qu'on ne détourne pas facilement" ] });
  else if (chevalier >= 0.3) traits.push({ w:0.7, texts:[
    "renforcée par une poignée de Chevaliers, prêts à décider du sort d'une bataille",
    "où quelques Chevaliers suffisent à faire basculer l'issue d'un combat" ] });
  if (lourd === 0 && rapide + transport >= 0.3) traits.push({ w:0.75, texts:[
    "taillée pour la vitesse plutôt que pour le siège",
    "qui frappe vite et ne s'attarde jamais là où elle n'a rien à gagner",
    "conçue pour l'assaut-éclair, pas la guerre de position" ] });
  if (lourd >= 0.4) traits.push({ w:0.85, texts:[
    "dotée d'une puissance de feu redoutable, pensée pour écraser plutôt que manœuvrer",
    "qui privilégie le canon à la manœuvre, et s'en porte très bien",
    "dont chaque affrontement se règle à coups de tirs massifs, sans grande subtilité" ] });
  else if (lourd >= 0.2) traits.push({ w:0.55, texts:[
    "épaulée par un noyau de soutien lourd, discret mais décisif au bon moment",
    "qui garde toujours de quoi frapper fort en réserve" ] });
  if (transport >= 0.3) traits.push({ w:0.75, texts:[
    "hautement mécanisée, capable de frappes rapides derrière les lignes ennemies",
    "qui ne marche jamais quand elle peut rouler",
    "montée sur blindés, prête à percer là où la ligne ennemie cède" ] });
  if (troupes >= 0.5) traits.push({ w:0.7, texts:[
    "portée par une infanterie disciplinée, qui tient le terrain coûte que coûte",
    "qui compte sur le nombre et la discipline plus que sur l'éclat",
    "où chaque objectif se tient au contact, pas à distance" ] });
  else if (troupes === 0 && totalCount >= 5) traits.push({ w:0.65, texts:[
    "dépourvue d'infanterie de ligne — elle mise tout sur l'élite",
    "qui ne connaît que des spécialistes, jamais de simples recrues",
    "sans une seule ligne de troupes ordinaires dans ses rangs" ] });
  if (qg >= 0.35) traits.push({ w:0.55, texts:[
    "au commandement dense, où chaque unité est menée avec soin",
    "où les chefs sont presque aussi nombreux que ceux qu'ils dirigent",
    "dont la chaîne de commandement ne laisse jamais un soldat sans ordre" ] });
  if (elite >= 0.45) traits.push({ w:0.6, texts:[
    "dominée par des vétérans d'élite plus que par le nombre",
    "où chaque guerrier a gagné sa place au prix du sang versé ailleurs",
    "qui ne compte dans ses rangs que des guerriers éprouvés" ] });
  if (rapide >= 0.35 && transport < 0.15) traits.push({ w:0.6, texts:[
    "rapide et imprévisible, frappant là où l'ennemi s'y attend le moins",
    "qui ne laisse jamais le temps à l'adversaire de reprendre son souffle" ] });
  if (totalCount <= 4) traits.push({ w:0.4, texts:[
    "encore jeune, mais déjà porteuse d'une identité propre",
    "à ses débuts — une poignée de fidèles autour d'un noyau solide" ] });
  else if (totalCount >= 30) traits.push({ w:0.5, texts:[
    "d'une ampleur considérable, digne d'un ordre de bataille complet",
    "dont l'ampleur seule impose le respect avant même le premier coup de feu" ] });

  traits.sort((a,b) => b.w-a.w);
  const picked = traits.slice(0,2).map((tr,idx) => pick(tr.texts, idx*7));
  // Tous féminins : les fragments ci-dessus s'accordent au féminin (« taillée », « bâtie »…)
  const openers = ["Une force", "Une armée", "Une croisade"];
  if (!picked.length) {
    const balanced = [
      "Une force équilibrée, prête à s'adapter à toutes les situations du champ de bataille.",
      "Une armée sans excès ni faiblesse marquée — solide, sans être spectaculaire.",
      "Un ordre de bataille classique, qui ne laisse rien au hasard." ];
    return pick(balanced, 3);
  }
  const [first, second] = picked;
  const opener = pick(openers, 11);
  // Si le premier fragment contient déjà une virgule, un tiret sépare mieux le second (lecture moins hachée)
  const sep = (first.includes(",") && !first.includes("—")) ? " — " : ", ";
  return second ? `${opener} ${first}${sep}${second}.` : `${opener} ${first}.`;
}

// ══════════════════════════════════════════════════════════
// LE CODEX VIVANT GRANDIT AVEC L'ARMÉE
// ══════════════════════════════════════════════════════════
// Rang atteint (0 = premier titre). Sert à rendre le récit plus épique à chaque promotion.
export function factionTier(faction, pts) {
  const list = FACTION_TITLES[faction]; if (!list) return 0;
  let t = 0; list.forEach(([min], i) => { if (pts >= min) t = i; }); return t;
}

const EPIC = {
  imperial: {
    places: ["Vorlese Prime", "Kharon IV", "la ruche de Tarsis", "les plaines de Morrow", "la citadelle d'Aurum", "Hydra Cordatus", "la lune de Sepheris"],
    named: [
      (h, p) => `On raconte qu'à ${p}, ${h} tint la brèche seul pendant trois nuits.`,
      (h, p) => `Les archives de ${p} gardent la trace de ${h}, dernier debout quand la ligne céda.`,
      (h, p) => `À ${p}, c'est ${h} qui releva l'étendard quand tout semblait perdu.`,
    ],
    anon: [
      (p) => `On raconte qu'à ${p}, ses guerriers tinrent la brèche trois nuits durant.`,
      (p) => `Les archives de ${p} gardent la trace de ceux qui restèrent debout quand la ligne céda.`,
      (p) => `À ${p}, l'étendard ne tomba jamais, malgré tout ce qui s'abattit sur lui.`,
    ],
  },
  TY: {
    places: ["la lune agricole de Serra", "le monde-forge de Ghalor", "la colonie de Vashti", "Kelmar Secundus", "les récifs de Thule"],
    named: [
      (h, p) => `La flotte-ruche se souvient de ${p} : ${h} y engloutit trois régiments avant l'aube.`,
      (h, p) => `De ${p}, il ne reste qu'un rocher nu. ${h} en fut la première vague.`,
      (h, p) => `À ${p}, les défenseurs apprirent à craindre le cri de ${h}.`,
    ],
    anon: [
      (p) => `La flotte-ruche se souvient de ${p} : trois régiments y furent engloutis avant l'aube.`,
      (p) => `De ${p}, il ne reste qu'un rocher nu. L'essaim n'a rien laissé derrière lui.`,
      (p) => `À ${p}, les défenseurs apprirent à craindre le bruissement des chitines.`,
    ],
  },
  chaos: {
    places: ["la cathédrale de Saint-Veyne", "la faille de Mordant", "les forges d'Olmar", "Cadia", "le monde-sanctuaire d'Elysia"],
    named: [
      (h, p) => `À ${p}, ${h} fit taire les cloches une à une.`,
      (h, p) => `Les survivants de ${p} ne prononcent plus le nom de ${h} qu'à voix basse.`,
      (h, p) => `${p} brûle encore. ${h} y a laissé sa marque, et quelques prières inachevées.`,
    ],
    anon: [
      (p) => `À ${p}, les cloches se turent une à une.`,
      (p) => `Les survivants de ${p} ne parlent de cette armée qu'à voix basse.`,
      (p) => `${p} brûle encore, et quelques prières y restent inachevées.`,
    ],
  },
  xenos: {
    places: ["Dal'yth", "le monde-vaisseau de Lugganath", "la nécropole de Solemnace", "Piscina IV", "le système de Kolovan"],
    named: [
      (h, p) => `À ${p}, ${h} changea le cours d'une bataille que tous croyaient perdue.`,
      (h, p) => `Les récits de ${p} font de ${h} une légende, et d'aucuns jurent qu'elle est vraie.`,
      (h, p) => `${p} n'a pas oublié ${h}. Ses ennemis non plus.`,
    ],
    anon: [
      (p) => `À ${p}, le cours d'une bataille que tous croyaient perdue fut renversé.`,
      (p) => `Les récits de ${p} parlent encore de cette armée, et d'aucuns jurent qu'ils sont vrais.`,
      (p) => `${p} n'a rien oublié. Ses ennemis non plus.`,
    ],
  },
};
const flavorOf = (f) => f === "TY" || f === "GC" ? "TY" : (f === "CSM" || f === "CK" || f === "LD") ? "chaos" : ["NC","AE","DR","TA","OR","LV"].includes(f) ? "xenos" : "imperial";

// Phrases ajoutées au Codex Vivant selon le rang : un fait d'armes (3ᵉ rang), la renommée
// (4ᵉ rang), puis la légende (5ᵉ rang et plus). heroes : surnoms des figurines peintes.
export function armyEpic({ faction, tier, heroes = [], armyName, seedKey = "" }) {
  if (tier < 2) return null;
  let h = 0; for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) >>> 0;
  const pick = (arr, salt) => arr[(h + salt * 7919) % arr.length];
  const ep = EPIC[flavorOf(faction)];
  const place = pick(ep.places, 2);
  const S = [heroes.length ? pick(ep.named, 1)(pick(heroes, 3), place) : pick(ep.anon, 1)(place)];
  const a = armyName;
  if (tier >= 3) S.push(pick([
    `Depuis, les exploits de ${a} passent de monde en monde.`,
    `Les recrues apprennent l'histoire de ${a} avant même leurs premières litanies.`,
    `Des récits se transmettent désormais sur ${a}, chaque fois un peu plus grands.`,
  ], 4));
  if (tier >= 4) S.push(pick([
    `Aujourd'hui, ${a} n'est plus une simple armée : c'est une légende en marche.`,
    `Aucun ennemi n'ignore plus le nom de ${a}, et certains fuient avant même la bataille.`,
    `Les chroniqueurs l'affirment : chaque bataille de ${a} ajoute une page au Codex.`,
  ], 6));
  // Contractions françaises (« de le » → « du », « à les » → « aux »…) et majuscule initiale
  let out = S.join(" ")
    .replace(/(^|[\s'])([Dd])e [Ll]e /g, "$1$2u ").replace(/(^|[\s'])([Dd])e [Ll]es /g, "$1$2es ")
    .replace(/(^|\s)à [Ll]e /g, "$1au ").replace(/(^|\s)À [Ll]e /g, "$1Au ").replace(/(^|\s)à [Ll]es /g, "$1aux ").replace(/(^|\s)À [Ll]es /g, "$1Aux ");
  return out.charAt(0).toUpperCase() + out.slice(1);
}
