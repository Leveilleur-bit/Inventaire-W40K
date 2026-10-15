// ══════════════════════════════════════════════════════════
// L'ARCHIVISTE : fragments de lore (carte de l'Accueil, en alternance avec les archives)
// ══════════════════════════════════════════════════════════
// Textes écrits pour l'app (pas de citation d'ouvrages). Par faction quand c'est possible :
// l'Archiviste parle de préférence des armées présentes dans la collection.

export const LORE_GENERAL = [
  "L'Imperium compte plus d'un million de mondes. Aucun registre ne les connaît tous ; l'Administratum en perd quelques-uns chaque siècle, par simple erreur de classement.",
  "Le Trône d'Or maintient l'Empereur entre la vie et la mort depuis dix mille ans. Chaque jour, des psykers sont sacrifiés pour nourrir l'Astronomican.",
  "L'Astronomican est un phare psychique qui guide les navigateurs à travers le Warp. Au-delà de sa portée, la galaxie redevient un labyrinthe obscur.",
  "Un message astropathique peut mettre des mois à arriver, et arriver avant d'être parti. Le Warp ne respecte ni la distance ni le temps.",
  "La Grande Faille a coupé la galaxie en deux. D'un côté, l'Imperium Sanctus ; de l'autre, l'Imperium Nihilus, plongé dans le silence et la nuit.",
  "Le Munitorum mesure ses guerres en régiments, en tonnes et en siècles. Un ordre de mobilisation peut arriver trois générations après la bataille.",
  "Les Forges de Mars produisent des machines dont personne ne comprend plus le fonctionnement. On les entretient par la prière, l'encens et l'huile sacrée.",
  "La Croisade Indomitus fut la plus vaste depuis la Grande Croisade de l'Empereur. Elle a duré plus d'un siècle et reconquis des milliers de mondes.",
  "Dans l'Imperium, savoir peut être une hérésie. Les archivistes les plus anciens gardent des salles entières que personne n'a le droit de lire.",
  "Une sainte relique peut être un os, une arme, un fragment d'armure. Certaines ont changé trois fois de propriétaire, et quatre fois de légende.",
  "Les Terres Sacrées de Terra sont couvertes d'une seule ville, le Palais Impérial, assez vaste pour qu'on y naisse et y meure sans en voir la fin.",
  "Le calendrier impérial note les années en millénaires. Le 41ᵉ s'achève dans les flammes ; le 42ᵉ commence dans le doute.",
];

export const LORE_BY_FACTION = {
  SM: [
    "Un Space Marine reçoit dix-neuf organes implantés. L'un d'eux, la glande progénoïde, sera prélevée à sa mort pour créer un nouveau frère.",
    "Le Codex Astartes fixe à mille le nombre de guerriers d'un Chapitre. Beaucoup l'appliquent à la lettre ; d'autres le traitent comme un conseil.",
    "Les Primaris sont nés dans les laboratoires de Belisarius Cawl, au terme de dix mille ans de travail secret. Leur arrivée a changé chaque Chapitre.",
    "Un Chapitre se souvient de ses morts dans ses reliquaires : une armure de Dreadnought peut abriter un héros vieux de plusieurs millénaires.",
  ],
  IK: [
    "Un Chevalier se pilote par le Trône Méca, qui relie l'esprit du pilote à ceux de tous ses prédécesseurs. Certains entendent leurs ancêtres en combat.",
    "Les Maisons de Chevaliers ont gardé leurs serments féodaux pendant l'Âge des Luttes, quand toute la galaxie s'effondrait autour d'elles.",
    "Un Chevalier sans Maison est un Franc-Lancier : il a choisi l'exil, ou il y a été contraint. Il garde ses couleurs, mais plus ses serments.",
    "La cérémonie de l'Élévation lie un noble à son Chevalier pour la vie. Ceux que le Trône rejette n'en parlent jamais.",
  ],
  TY: [
    "L'Esprit de la Ruche ne gaspille rien : une flotte tyranide dévore la biomasse d'une planète jusqu'à l'atmosphère, puis repart vers la suivante.",
    "Avant une invasion, l'Ombre dans le Warp étouffe les communications astropathiques. Les mondes tombent souvent dans un silence complet.",
    "Les Genestealers précèdent les flottes-ruches. Leurs cultes préparent le terrain pendant des générations, persuadés d'attendre des dieux.",
    "Chaque créature tyranide est une arme conçue pour un rôle. Quand un ennemi résiste, l'Esprit de la Ruche invente la suivante.",
  ],
  CSM: [
    "La Longue Guerre ne s'est jamais terminée pour les Légions Renégates. Certains de leurs guerriers ont vu l'Hérésie d'Horus de leurs propres yeux.",
    "L'Œil de la Terreur est une plaie dans la réalité où le temps s'écoule autrement. Dix mille ans dehors peuvent n'y être que quelques siècles.",
    "Les dieux du Chaos accordent des dons à leurs champions. Peu survivent assez longtemps pour devenir princes-démons ; beaucoup finissent enfants du Chaos.",
  ],
  AM: [
    "L'Astra Militarum aligne des milliards d'hommes. Un régiment levé sur un monde peut ne jamais le revoir : on lui offre souvent une planète conquise.",
    "Le Leman Russ est produit sur des milliers de mondes, dans des centaines de variantes. Certains équipages vivent et meurent dans le même char.",
    "Les commissaires veillent au moral des troupes. Leur méthode est connue de tous, et rarement discutée à voix haute.",
  ],
  IM: [
    "L'Inquisition ne répond qu'à elle-même. Un Inquisiteur peut réquisitionner une flotte, une armée, ou condamner un monde entier.",
    "L'Ordo Malleus traque les démons, l'Ordo Hereticus les hérétiques, l'Ordo Xenos les extraterrestres. Leurs querelles internes sont légendaires.",
    "Un Exterminatus détruit toute vie d'une planète. On ne l'ordonne qu'en dernier recours, ou quand un Inquisiteur estime qu'il l'est.",
  ],
  AS: [
    "Les Sœurs de Bataille contournent le Décret Passif : l'Ecclésiarchie n'a pas le droit d'avoir d'hommes en armes, elle a donc des femmes.",
    "Les Actes de Foi des Sœurs sont des miracles. Personne ne sait vraiment s'ils viennent de l'Empereur ou de leur seule conviction.",
  ],
  AD: [
    "L'Adeptus Mechanicus vénère le Dieu-Machine. Pour un Tech-Prêtre, remplacer un bras par une prothèse est un pas vers la pureté.",
    "Les skitarii sont des soldats augmentés dont l'esprit peut être pris en main à distance par leurs Tech-Prêtres.",
  ],
  GK: [
    "Les Chevaliers Gris sont tous psykers. Leur forteresse de Titan est l'un des lieux les plus secrets de l'Imperium.",
    "Un Chevalier Gris connaît le vrai nom de nombreux démons. Le prononcer peut suffire à les bannir.",
  ],
  CK: [
    "Les Chevaliers du Chaos ont trahi leurs Maisons. Leurs Trônes Méca murmurent désormais des voix qui ne sont plus celles des ancêtres.",
  ],
  LD: [
    "Un démon tué dans le monde réel ne meurt pas : il retourne dans le Warp, d'où il attend la prochaine occasion de revenir.",
  ],
  NC: [
    "Les Nécrons ont échangé leurs corps contre des carcasses de métal il y a soixante millions d'années. Beaucoup ont perdu leur esprit en chemin.",
    "Les dynasties nécrones se réveillent tombe par tombe. Certains seigneurs se croient encore au temps de leur ancienne gloire.",
  ],
  OR: [
    "Les Orks croient si fort à leurs machines qu'elles fonctionnent. Peindre un véhicule en rouge le rendrait plus rapide, et c'est vrai.",
    "Une Waaagh! commence par un chef plus gros que les autres. Elle s'arrête quand il n'y a plus personne contre qui se battre.",
  ],
  AE: [
    "La chute des Aeldari a donné naissance à Slaanesh. Depuis, chaque Aeldari craint pour son âme à l'heure de sa mort.",
    "Les vaisseaux-mondes errent dans le vide depuis la Chute. Leurs Voies guident chaque Aeldari vers une seule vocation à la fois.",
  ],
  DR: [
    "Commorragh est cachée dans la Toile. Les Drukhari y repoussent leur damnation en se nourrissant de la souffrance des autres.",
  ],
  TA: [
    "L'Empire T'au poursuit le Bien Suprême. Il intègre volontiers d'autres espèces, tant qu'elles acceptent sa vision de l'avenir.",
  ],
  GC: [
    "Un culte genestealer peut vivre caché pendant quatre générations. La cinquième voit enfin arriver les étoiles qu'elle priait.",
  ],
  LV: [
    "Les Ligues de Votann sont guidées par leurs Ancêtres, des intelligences artificielles qui ont traversé les âges noirs.",
  ],
  AC: [
    "Les Custodes sont les gardiens personnels de l'Empereur. Pendant des millénaires, ils n'ont presque jamais quitté Terra.",
  ],
};
