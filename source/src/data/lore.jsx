
// ══════════════════════════════════════════════════════════

export const WEEKLY_CITATIONS = [
  { text: 'Un Space Marine ne connaît pas la peur. Il connaît l\'objectif.', author: 'Codex Astartes' },
  { text: 'La peinture est la première bataille. Gagne-la avant le champ de guerre.', author: 'Chapelain inconnu' },
  { text: 'Pour l\'Empereur ! Chaque figurine peinte est une âme sauvée du chaos.', author: 'Black Templars' },
  { text: 'La patience est une vertu des serviteurs de l\'Empereur.', author: 'Livre des Cinq Anneaux Impériaux' },
  { text: 'Un guerrier non peint est un guerrier sans honneur.', author: 'Proverbe du Chapitre' },
  { text: 'Nul ne sait combien de temps durera la croisade. Mais chaque jour peint compte.', author: 'Haut Maréchal Helbrecht' },
  { text: 'Le Chaos ne dort jamais. La pile de honte non plus.', author: 'Inquisiteur anonyme' },
  { text: 'In the grim darkness of the far future, there is only... de l\'apprêt à appliquer.', author: 'Warhammer 40,000' },
  { text: 'Celui qui commence une figurine et ne la finit pas offense deux fois l\'Empereur.', author: 'Doctrine Martiale' },
  { text: 'La victoire appartient à celui qui persiste. Même avec un pinceau fin.', author: 'Roboute Guilliman' },
  { text: 'Un peintre lent vaut mieux qu\'un abandonniste rapide.', author: 'Sagesse du Chapitre' },
  { text: 'Chaque coup de pinceau te rapproche de la gloire. Chaque boîte achetée t\'en éloigne.', author: 'Chapelain de la Honte' },
  { text: 'L\'honneur d\'un guerrier se mesure à la qualité de sa peinture de base.', author: 'Maître des Forges' },
  { text: 'La Pile de Honte est le vrai ennemi. Plus redoutable que les Tyranides.', author: 'Vétéran de la 1ère Compagnie' },
  { text: 'Peindre est un acte de foi. Ne pas peindre est de l\'hérésie.', author: 'Sœurs de Bataille' },
  { text: 'L\'Empereur protège... mais il ne finit pas tes figurines à ta place.', author: 'Dicton populaire' },
  { text: 'Celui qui possède mille figurines et n\'en peint aucune est un collectionneur de plastique.', author: 'Conseil des Anciens' },
  { text: 'La croisade continue. Les pinceaux aussi.', author: 'Maréchal Amalrich' },
  { text: 'Un Chapitre se construit une figurine à la fois.', author: 'Codex Astartes, Tome VII' },
  { text: 'Même les plus grandes armées ont commencé par une seule figurine. Bien apprêtée.', author: 'Primaris Lieutenant' },
  // ── Ajouts du 7 octobre 2026 ──
  { text: "Le gris est une couleur. Ce n'est pas une excuse.", author: "Chapelain de la Honte" },
  { text: "On ne finit pas une armée. On cesse seulement d'en acheter une autre.", author: "Sagesse du Chapitre" },
  { text: "Dilue ta peinture, pas ta résolution.", author: "Maître des Forges" },
  { text: "Deux couches fines valent mieux qu'un serment épais.", author: "Proverbe de l'Atelier" },
  { text: "L'ennemi a des canons. Toi, tu as un pinceau de détail. Tremble pour lui.", author: "Sergent vétéran" },
  { text: "Celui qui apprête sous la pluie connaîtra le grain, et le regret.", author: "Litanie du Munitorum" },
  { text: "La foi déplace les montagnes. La pince coupante déplace les lignes de moulage.", author: "Techno-prêtre de passage" },
  { text: "Un socle nu est une prière interrompue.", author: "Sœur Hospitalière" },
  { text: "Mieux vaut une escouade peinte qu'une légion promise.", author: "Doctrine Martiale" },
  { text: "Le doute est le premier pas vers l'hérésie. Le deuxième, c'est « je la peindrai plus tard ».", author: "Inquisiteur anonyme" },
  { text: "Aucun plan de bataille ne survit au contact d'un pot renversé.", author: "Tacticien du Chapitre" },
  { text: "La lumière vient d'en haut. Tes éclaircissements aussi.", author: "Maître de la Sainteté" },
  { text: "Chaque boîte ouverte est un vœu. Tiens-le.", author: "Chapelain inconnu" },
  { text: "Le vernis protège. L'Empereur aussi, mais le vernis sèche plus vite.", author: "Dicton populaire" },
  { text: "Patience : même les Nécrons ont mis soixante millions d'années à se réveiller.", author: "Archiviste du Chapitre" },
  { text: "Un guerrier se juge à ses cicatrices. Une figurine, à ses yeux.", author: "Vétéran de la 1ère Compagnie" },
  { text: "Ne compte pas les figurines grises. Compte celle que tu vas peindre ce soir.", author: "Le Chapelain" },
  { text: "Le lavis pardonne beaucoup. Pas tout.", author: "Maître des Forges" },
  { text: "Il n'y a pas de petite figurine, seulement de petites ambitions.", author: "Proverbe du Chapitre" },
  { text: "L'atelier est un champ de bataille où l'on gagne assis.", author: "Sagesse du Chapitre" },
  { text: "Qui peint le soir récolte la gloire au matin. Et des cernes.", author: "Dicton populaire" },
  { text: "Le Warp murmure : « encore une boîte ». N'écoute pas le Warp.", author: "Inquisiteur anonyme" },
  { text: "Une armée peinte a déjà gagné avant le premier dé.", author: "Tacticien du Chapitre" },
  { text: "Même les héros de légende ont commencé par la sous-couche.", author: "Légende de l'Atelier" },
  { text: "Sers l'Empereur aujourd'hui : demain, la peinture aura séché dans le pot.", author: "Litanie du Munitorum" },
];

// ── Tarot du Reliquaire — tirage hebdomadaire ──
// 22 lames (0 à XXI, comme les arcanes majeurs), mélange de conseils sérieux dans le ton du Chapelain et de quelques
// lames volontairement plus légères/absurdes pour casser le sérieux de temps en temps.
export const TAROT_CARDS = [
  { numeral:"I",     name:"L'Empereur sur le Trône Doré", icon:"svg:templarshield", text:"L'immobilisme te guette. Ose peindre quelque chose que tu repousses depuis des mois." },
  { numeral:"II",    name:"Le Bibliothécaire",             icon:"✎",  text:"Cette semaine, la connaissance précède l'action — consulte une recette avant de te lancer." },
  { numeral:"III",   name:"La Roue de la Fortune",         icon:"⚄", text:"Le hasard favorise les audacieux. Laisse le Dé du Destin choisir à ta place, sans discuter son verdict." },
  { numeral:"IV",    name:"Le Pendu de Cadia",             icon:"⧗", text:"Rien ne presse. Cette semaine, la patience vaut mieux que la vitesse." },
  { numeral:"V",     name:"La Tour qui Tombe",             icon:"♜",  text:"Un Titan ou un Chevalier t'attend dans l'ombre. C'est le moment de t'y attaquer." },
  { numeral:"VI",    name:"Le Bouffon de l'Inquisition",   icon:"◈",  text:"Peins en musique cette semaine, ou pas du tout — l'Empereur ne juge pas les playlists." },
  { numeral:"VII",   name:"La Grande Prêtresse Astropathe",icon:"◉",  text:"Laisse ton instinct choisir la prochaine figurine, pas ta liste. L'intuition sait parfois mieux que la raison." },
  { numeral:"VIII",  name:"Le Char de Guerre",             icon:"⚔",  text:"Avance vite cette semaine. Fixe-toi un objectif ambitieux et fonce sans regarder en arrière." },
  { numeral:"IX",    name:"La Justice de l'Arbites",       icon:"⚖",  text:"Un achat, une figurine peinte. L'équilibre est la seule vraie loi de la Croisade." },
  { numeral:"X",     name:"L'Ermite du Désert Mécanique",  icon:"†",  text:"Isole-toi une session entière, sans écran ni distraction. Juste toi, le pinceau, et le silence." },
  { numeral:"XI",    name:"Le Grand Silence",              icon:"svg:tarotdeath", text:"Laisse mourir une vieille pile que tu ne peindras jamais. Termine ce que tu as vraiment commencé." },
  { numeral:"XII",   name:"La Tempérance",                 icon:"svg:paintbrush", text:"Ralentis sur les détails cette semaine. La précision vaut mieux que la quantité." },
  { numeral:"XIII",  name:"L'Hérétique",                   icon:"✹", text:"La tentation d'acheter guette. Résiste-lui une semaine complète, par pur défi." },
  { numeral:"XIV",   name:"Les Étoiles",                   icon:"✦",  text:"Pense à ta prochaine armée, même si celle-ci n'est pas finie. Rêver fait partie du hobby." },
  { numeral:"XV",    name:"Les Brumes de la Guerre",       icon:"☁",  text:"Cette semaine reste incertaine. Avance quand même — la brume se lève toujours." },
  { numeral:"XVI",   name:"Le Soleil sur Baal",            icon:"☀",  text:"Un jour faste s'annonce. Profites-en pour attaquer la figurine la plus intimidante de ta pile." },
  { numeral:"XVII",  name:"Le Jugement",                   icon:"⚖",  text:"Regarde ce que tu as peint ces quatre dernières semaines. Sois honnête — et fier, même un peu." },
  { numeral:"XVIII", name:"Le Monde Conquis",               icon:"Ω",  text:"La perfection existe, même à petite échelle. Termine complètement une seule unité cette semaine." },
  { numeral:"XIX",   name:"Le Tech-Prêtre Rusé",           icon:"⚙",  text:"Improvise. Une technique que tu n'as jamais essayée résoudra un problème que tu traînes depuis longtemps." },
  { numeral:"XX",    name:"Le Servo-crâne Perdu",          icon:"∅",  text:"Aucun conseil cette semaine. Le servo-crâne chargé du message s'est égaré quelque part dans le Warp." },
  { numeral:"0",     name:"Le Fou du Warp",                icon:"∞",  text:"Commence une figurine sans plan ni schéma. Laisse les couleurs décider — tu feras le tri après." },
  { numeral:"XXI",   name:"Le Primarque Revenu",           icon:"♔",  text:"Ressors une vieille figurine peinte il y a longtemps. Retouche-la avec tout ce que tu as appris depuis." },
];

// Petites phrases de lore/Chapelain pour la bannière de célébration à chaque figurine
// achevée — piochées au hasard, pas besoin d'être déterministe ici (un simple aparté,
// pas un rituel daté comme les citations ou le tarot).
const CELEBRATION_LORE = [
  "« Une relique de plus rejoint le silence doré de l'Imperium. »",
  "« Le pinceau s'arrête, mais la gloire, elle, demeure. »",
  "« Ainsi soit-elle peinte, ainsi soit-elle sainte. »",
  "« La forge se tait un instant — la victoire, elle, résonne. »",
  "« Chaque figurine consacrée est une prière achevée. »",
  "« L'Empereur voit tout, même le dernier coup de pinceau. »",
  "« Une de plus. L'Imperium ne s'écrit qu'ainsi, figurine après figurine. »",
  "« Le gris recule encore d'un pas. »",
  "« Que cette relique serve fidèlement au combat, et au regard. »",
  "« Peinte, donc prête. Prête, donc sainte. »",
  "« Nulle victoire n'est petite sous l'œil du Chapelain. »",
  "« Un pas de plus vers un Chapitre sans tache. »",
  "« Le Munitorum enregistre une relique de plus. En trois exemplaires. »",
  "« Les litanies sont dites, les couleurs sont posées. »",
  "« L'Astropathe transmet la nouvelle : une relique de plus est prête. »",
  "« Le Chapelain hoche la tête. Venant de lui, c'est une ovation. »",
  "« Un sceau de pureté de plus à apposer. »",
  "« Que les archives en gardent la trace, pour les siècles à venir. »",
  "« Le registre s'allonge d'une ligne. Le Chapelain la relit deux fois. »",
  "« Du plastique gris, il ne reste que le souvenir. »",
  "« Qu'on sonne les cloches : une de plus se tient debout, en couleurs. »",
  "« Les serviteurs rangent les pinceaux. La relique, elle, ne se range pas : elle s'expose. »",
  "« Consacrée sous l'œil de l'Empereur, et sous la lampe de l'établi. »",
  "« Elle a attendu son tour. Elle l'a eu. »",
  "« Le Techno-prêtre confirme : l'esprit de la machine est satisfait de sa livrée. »",
  "« Encore une que l'ennemi ne trouvera pas grise. »",
  "« La pile de honte vient de perdre l'une des siennes. Elle ne s'en remettra pas. »",
  "« Un nom de plus sur les rôles de la Croisade. »",
  "« L'encens brûle, le vernis sèche, la gloire s'installe. »",
  "« Le devoir est accompli. Jusqu'à la prochaine. »",
];

// Variantes propres à certaines factions : peindre un Tyranide ou un Space Marine du
// Chaos ne devrait pas faire parler l'Imperium. Les factions absentes d'ici utilisent
// les phrases impériales ci-dessus (factions de l'Imperium) ou neutres (xenos).
const CELEBRATION_LORE_FACTION = {
  TY: [
    "« Une nouvelle forme a quitté les bassins de ponte. »",
    "« La synapse s'étend. La proie ne le sait pas encore. »",
    "« L'essaim compte une gueule de plus. »",
    "« L'Esprit de la Ruche prend note. Il ne remercie jamais. »",
    "« Chitine consacrée — si l'on peut dire. »",
    "« L'Ombre dans le Warp s'épaissit d'un cran. »",
    "« La biomasse a pris des couleurs. La proie devrait s'inquiéter. »",
    "« Une griffe de plus dans la Grande Dévoreuse. »",
    "« Nouvelle bioforme prête. Elle a faim, comme les autres. »" ],
  GC: [
    "« Un enfant de plus pour la famille. Le Patriarche sourit. »",
    "« Le jour de l'Ascension approche, une figurine à la fois. »",
    "« Sous la cité-ruche, on se prépare en silence. »",
    "« Le culte grandit dans l'ombre, et sort enfin à la lumière. »",
    "« Les frères de couvée saluent le nouveau venu. À quatre bras. »",
    "« Le Magus l'avait vu en rêve. En couleurs, déjà. »" ],
  CSM: [
    "« Les Dieux Sombres approuvent. Pour cette fois. »",
    "« Dix mille ans de rancune, et enfin une armure à la hauteur. »",
    "« La Longue Guerre continue — en couleurs. »",
    "« Dans l'Œil de la Terreur, on applaudit rarement. On vient de le faire. »",
    "« Mort au Faux Empereur. Gloire au pinceau. »",
    "« Une âme de plus promise aux Puissances de la Ruine. Bien peinte, au moins. »",
    "« Dix mille ans de guerre, et toujours le souci du détail. »",
    "« Une trahison de plus, soigneusement éclaircie. »" ],
  CK: [
    "« La Maison Déchue gronde de satisfaction. »",
    "« Un Chevalier de plus a juré allégeance aux Ténèbres. »",
    "« Le démon lié à son cœur hurle de joie. Ou de rage. Difficile à dire. »",
    "« Le Chevalier renégat a trouvé ses couleurs. Elles font peur. »",
    "« Les serments brisés font les plus belles livrées. »",
    "« Son Trône murmure des choses sombres. Et quelques compliments. »" ],
  LD: [
    "« Une émotion de plus a pris chair. »",
    "« Le voile s'amincit. Les Puissances observent. »",
    "« Le Warp a craché une nouvelle créature — peinte, cette fois. »",
    "« Les Dieux se disputent déjà sa loyauté. »",
    "« Né d'un cauchemar, fini au pinceau fin. »",
    "« Le Grand Jeu compte un pion de plus. »" ],
  IK: [
    "« Un Chevalier de plus rejoint la Maison. Le Trône Méca s'éveille. »",
    "« Les ancêtres de la Maison reconnaissent leur héritier. »",
    "« Un blason de plus flotte au-dessus du champ de bataille. »",
    "« L'honneur de la Maison est sauf. »",
    "« Un colosse de plus prête serment à la Maison. »",
    "« Les Sacristains s'inclinent : la livrée est digne des ancêtres. »",
    "« Que sa bannière se voie depuis l'autre bout du champ de bataille. »",
    "« Le rituel est accompli. Le pilote et la machine ne font plus qu'un. »" ],
  NC: [
    "« Soixante millions d'années de sommeil, et enfin des couleurs. »",
    "« Le Protocole de Réveil suit son cours. »",
    "« Un guerrier de plus quitte la tombe. La chair n'a qu'à bien se tenir. »",
    "« Le nécroderme brille comme au premier jour de l'éternité. »",
    "« Le Cryptek note la date. Il notera aussi la suivante, dans mille ans. »",
    "« Les vivants ont eu soixante millions d'années d'avance. C'est fini. »" ],
  OR: [
    "« WAAAGH ! Et si elle est rouge, elle ira plus vite. »",
    "« Un boy de plus prêt pour la baston. »",
    "« Le Mek dit que c'est bien peint. Le Mek dit ça de tout. »",
    "« C'est peint. C'est kustom. C'est bon pour la bagarre. »",
    "« Les Gretchins ont porté les pots. Un seul a survécu. »",
    "« Plus y'a de couleurs, plus ça tape fort. C'est scientifik. »" ],
  AE: [
    "« Une âme de plus soustraite à la Soif. »",
    "« Les runes l'avaient prédit : elle serait achevée aujourd'hui. »",
    "« L'élégance aeldari ne pardonne pas l'à-peu-près. Celle-ci passe l'examen. »",
    "« Sa pierre-esprit luit doucement. Elle est satisfaite. »",
    "« Les Chemins sont longs. Celui-ci est arrivé à son terme. »",
    "« Une étoile de plus pour un peuple qui en perd tant. »" ],
  DR: [
    "« Commorragh apprécie le travail soigné. Et la souffrance qu'il a coûtée. »",
    "« Un raider de plus, prêt pour la prochaine razzia. »",
    "« La Kabale s'agrandit. Les esclaves apprécieront, brièvement. »",
    "« Belle, cruelle et vernie. »",
    "« Les Haemonculi ont trouvé le résultat… inspirant. »" ],
  TA: [
    "« Pour le Bien Suprême — et pour la vitrine. »",
    "« La Caste de la Terre valide les tolérances. »",
    "« Un guerrier de plus rejoint la Sphère d'Expansion. »",
    "« Les Éthérés approuvent. Sobrement, comme toujours. »",
    "« Nouvelle exo-armure opérationnelle. Les drones applaudissent. »",
    "« Le Bien Suprême progresse d'une figurine. »" ],
  LV: [
    "« Les Ancêtres évaluent le travail. Rentable. »",
    "« Une figurine de plus au registre des Kin. Rancune notée. »",
    "« Travail solide. Les Votann n'en attendaient pas moins. »",
    "« Une de plus pour la Ligue. Le Grimnyr hoche la barbe. »",
    "« Bien forgé, bien peint, et noté au Livre des Rancunes, colonne des satisfactions. »" ],
  SM: [
    "« Un frère de bataille de plus revêt les couleurs du Chapitre. »",
    "« Il ne connaîtra pas la peur. Ni le gris. »",
    "« L'armure est bénie, le bolter est prêt, les arêtes sont éclaircies. »",
    "« Le Codex Astartes approuve cette livrée. »",
    "« Qu'il se tienne dans la brèche, et dans la vitrine. »",
    "« Les anges de la mort comptent une lame de plus. »" ],
  AS: [
    "« Une sœur de plus porte la flamme et la foi. »",
    "« Les hymnes montent, le bolter est béni, la robe est éclaircie. »",
    "« L'Empereur protège celles qui peignent leurs fleurs de lys avec soin. »",
    "« Par le feu, par la foi, par le pinceau. »" ],
  AM: [
    "« Un soldat de plus dans le Marteau de l'Empereur. Il n'a rien demandé. »",
    "« Le Commissaire approuve. Personne ne sera fusillé aujourd'hui. »",
    "« Régiment renforcé. Le Munitorum réclame déjà le formulaire. »",
    "« Les chars passent, la peinture reste. »" ],
  AD: [
    "« L'Omnimessie contemple l'ouvrage et le déclare conforme. »",
    "« Protocole de consécration terminé. Huiles sacrées appliquées. »",
    "« La chair est faible. La peinture, elle, tient. »",
    "« 01010000. Traduction : peinte. »" ],
  AC: [
    "« Un gardien de plus veille devant le Trône d'Or. »",
    "« Dix mille ans de vigilance, et pas une trace de gris. »",
    "« L'auramite ne se peint pas à la légère. Celle-ci en est digne. »",
    "« Les Dix Mille comptent l'un des leurs de plus. »" ],
  GK: [
    "« Un chevalier de Titan de plus. Son nom ne sera jamais prononcé. »",
    "« Six cent soixante-six litanies plus tard, il est prêt. »",
    "« Les démons ont une raison de plus de trembler. »",
    "« Armure bénie, âme incorruptible, arêtes impeccables. »" ],
};

const CELEBRATION_LORE_NEUTRAL = [
  "« Le gris recule encore d'un pas. »",
  "« Terminée. L'ennemi n'a plus aucune excuse. »",
  "« Une figurine de plus sort de l'ombre. »",
  "« Peinte, donc prête. Prête, donc redoutable. »",
  "« Une de moins dans la pile. Une de plus dans la légende. »",
  "« Le pinceau repose. Le travail parle. »",
  "« Elle est prête pour la guerre. Et pour la photo. »",
  "« Finie. Vraiment finie. Ne retouche plus rien. »" ];

const IMPERIAL_FACTIONS = new Set(["SM","IK","IM","AC","AM","AS","AD","GK"]);

export function celebrationLoreFor(faction) {
  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const common = IMPERIAL_FACTIONS.has(faction) || !faction ? CELEBRATION_LORE : CELEBRATION_LORE_NEUTRAL;
  const own = CELEBRATION_LORE_FACTION[faction];
  // Six fois sur dix, une phrase propre à l'armée quand elle en a ; sinon une phrase commune
  // (sans ce tirage en deux temps, les phrases d'armée seraient noyées dans les communes).
  return own && Math.random() < 0.6 ? pick(own) : pick(common);
}

// Numéro de semaine ISO (YYYY-Www), utilisé pour caler le tirage et savoir si on
// en doit un nouveau depuis la dernière ouverture.
export function isoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
}

// Tirage déterministe : même semaine = même lame partout, pas de vrai hasard
// (reproductible, pas de risque de résultat différent entre deux rendus).
export function tarotForWeek(weekKey) {
  let h = 0; for (let i=0;i<weekKey.length;i++) h = (h*31 + weekKey.charCodeAt(i)) >>> 0;
  // Les lames 0 et XXI ont été ajoutées en septembre 2026 : les semaines déjà tirées
  // gardent l'ancien jeu de 20, pour que la lame de la semaine en cours ne change pas.
  const deck = weekKey < "2026-W40" ? TAROT_CARDS.slice(0, 20) : TAROT_CARDS;
  return deck[h % deck.length];
}
