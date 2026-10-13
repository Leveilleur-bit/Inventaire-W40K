// ══════════════════════════════════════════════════════════
// CALENDRIER DE L'AVENT : « La Veille du Reliquaire », feuilleton en 24 nuits
// ══════════════════════════════════════════════════════════
// Une porte par jour du 1er au 24 décembre (rattrapage possible jusqu'au 31).
// {A} = nom de l'armée principale (listNames ou nom de faction), {H} = son héros (surnom d'un
// personnage peint, sinon nom de l'unité, sinon « le chef de guerre »).
// Texte écrit pour fonctionner avec n'importe quelle faction : on évite d'accorder {H} au
// masculin ou au féminin, et on parle de « l'armée {A} » et de « ses guerriers ».

export const ADVENT_TITLE = "La Veille du Reliquaire";

export const ADVENT_STORY = [
  { t: "Le signal",
    p: "Au premier jour du mois de la Veille, une balise oubliée s'est réveillée sous les glaces d'Hiémale Secundus. Elle ne répète qu'un mot, en haut gothique ancien : « Reliquaire ». Les archives ne mentionnent aucun monde de ce nom. Pourtant, l'armée {A} a reçu l'appel, et {H} a ordonné que l'on prépare le départ." },
  { t: "La traversée",
    p: "Le Warp fut mauvais. Pendant onze heures, les navigateurs parlèrent d'un chant qui montait des profondeurs, si lent qu'on aurait dit une respiration. Personne à bord n'osa le dire tout haut, mais tous l'entendirent : le chant connaissait le nom de chaque guerrier de l'armée {A}." },
  { t: "Le monde blanc",
    p: "Hiémale Secundus apparut enfin : une boule de glace sous un soleil mourant, sans une lumière, sans une ville. Les auspex ne trouvèrent qu'une chose, au pôle nord, une flèche de pierre noire plantée dans la banquise comme un clou dans un cercueil. {H} désigna la flèche. « Là. »" },
  { t: "Le débarquement",
    p: "Le vent arracha la peinture des coques en quelques minutes. Les guerriers de l'armée {A} prirent pied dans une tempête si dense qu'ils devaient se tenir par l'épaule pour avancer. Au bout de deux heures de marche, la flèche noire se dressait devant eux, haute comme une ruche. Sa porte était ouverte. Elle les attendait." },
  { t: "Le vestibule",
    p: "À l'intérieur, la tempête se tut d'un coup. Des milliers de niches couraient le long des murs, toutes vides, chacune gravée d'un nom effacé par le temps. Au centre, un servo-crâne couvert de givre reprit vie dans un claquement d'engrenages et prononça d'une voix sèche : « Enfin. Le registre attendait un visiteur. »" },
  { t: "Le gardien de cuivre",
    p: "Le servo-crâne se présenta comme le Gardien du Registre, numéro d'inventaire 7-Oméga. Il servait ici depuis neuf mille ans, et n'avait vu entrer personne depuis huit mille. « Une longue suite de portes sépare ce vestibule du cœur du Reliquaire, dit-il. Une par nuit, pas davantage. Les règles sont anciennes, et je ne les ai pas écrites. »" },
  { t: "La première porte",
    p: "La première porte ne s'ouvrit qu'à minuit exactement. Derrière elle, une salle remplie de pinceaux pétrifiés, posés dans des pots de pigments durcis depuis des millénaires. Sur un pupitre, un parchemin : « Ici travaillaient ceux qui consacraient les guerriers. Ils ne sont jamais partis. Ils se sont simplement arrêtés. » {H} referma la salle avec respect." },
  { t: "Les ombres",
    p: "Cette nuit-là, les sentinelles virent bouger les ombres dans les niches vides. Rien d'hostile : des silhouettes grises, inachevées, qui se tournaient vers la lumière des lampes comme des plantes vers le soleil. Le Gardien expliqua qu'il s'agissait de guerriers jamais consacrés, restés à l'état d'esquisse, et qui espéraient encore." },
  { t: "La salle des grappes",
    p: "Derrière la porte suivante s'étendait une salle immense, pleine de grappes de plastique sacré, empilées jusqu'à la voûte. Des armées entières, encore attachées à leurs carottes. Le silence y était lourd de reproches. « La Pile Originelle, souffla le Gardien. Celle dont toutes les autres descendent. » Personne ne fit de commentaire." },
  { t: "Le premier assaut",
    p: "Cette nuit-là, quelque chose répondit à leur présence. Des formes de glace se détachèrent des murs, griffues, sans visage, et se jetèrent sur les guerriers de l'armée {A}. Le combat fut bref et brutal. Quand tout fut fini, {H} ramassa un éclat de glace : il portait, gravé à l'intérieur, le nom d'une figurine jamais peinte." },
  { t: "Le doute",
    p: "Ce soir-là, autour d'un brasero, un vétéran demanda à voix basse s'il était sage de continuer. Ce lieu ne contenait ni or ni armes, seulement des souvenirs inachevés. {H} répondit sans lever les yeux du feu : « Justement. Quelqu'un doit aller au bout. Sinon, à quoi auront servi toutes ces heures ? »" },
  { t: "L'atelier des maîtres",
    p: "Derrière la porte de cette nuit, un atelier intact, comme quitté la veille. Sur l'établi, un guerrier à demi peint, la couche de base posée avec un soin infini, le pinceau encore humide à côté. Le Gardien affirma que ce pinceau n'avait jamais séché en neuf mille ans. Il attendait seulement que quelqu'un le reprenne." },
  { t: "La litanie",
    p: "Cette nuit-là, l'armée {A} entendit enfin distinctement le chant du Warp. Ce n'était pas une menace. C'était une litanie, récitée par des voix innombrables : des noms d'unités, de chapitres, d'escouades, de héros. Le Reliquaire récitait l'inventaire de tout ce qui avait un jour été commencé dans la galaxie." },
  { t: "La trahison du froid",
    p: "Pendant la nuit, le froid gagna une salle de garde et figea deux sentinelles. On les retrouva au matin, immobiles mais vivantes, couvertes d'une fine pellicule blanche, comme une sous-couche. Il fallut des heures de feu pour les ramener. Le Gardien murmura : « Le Reliquaire n'aime pas qu'on s'arrête en chemin. »" },
  { t: "La bibliothèque des recettes",
    p: "La porte suivante s'ouvrit sur une bibliothèque de tablettes de cuivre. Chacune portait une recette : trois couches, deux lavis, un brossage à sec, un éclat sur les arêtes. Des millions de recettes, pour des millions de guerriers. {H} en prit une au hasard et la rangea contre son armure. On ne sait jamais." },
  { t: "La moitié du chemin",
    p: "À mi-chemin, le Gardien demanda une halte. Il fit apporter des lampes et montra, peints au plafond, douze guerriers de toutes les armées connues, achevés avec une perfection irréelle. « Ceux qui sont allés au bout, dit-il. Leurs auteurs n'étaient pas plus doués que vous. Ils ont seulement continué. »" },
  { t: "La salle des miroirs",
    p: "Derrière la porte suivante, des miroirs de givre renvoyaient à chacun l'image de ce qu'il aurait pu devenir. {H} s'y vit couverte de gloire, ou couvert d'or, selon la façon dont on regardait : les reflets eux-mêmes semblaient hésiter. {H} haussa les épaules et passa son chemin. Seul compte ce qui est accompli." },
  { t: "Les gardiens de pierre",
    p: "Les portes suivantes étaient gardées par des statues qui exigeaient un tribut. Pas de sang, pas d'or : une histoire. Chaque guerrier de l'armée {A} dut raconter la bataille dont il était le plus fier. Les statues écoutèrent, puis s'écartèrent dans un grondement. Elles avaient eu faim de récits pendant huit mille ans." },
  { t: "La tempête intérieure",
    p: "Une tempête se leva à l'intérieur même du Reliquaire, chargée d'éclats de pigments gelés. Ocre, bleu, rouge sang, vert nécrosé : les couleurs fouettaient les armures et s'y accrochaient. À l'aube, l'armée {A} ressemblait à une palette vivante. Le Gardien jura que c'était un honneur. Personne ne le crut tout à fait." },
  { t: "Le nom oublié",
    p: "Sur la porte de cette nuit, un seul nom était encore lisible, et c'était celui de {H}. Gravé il y a neuf mille ans, dans une écriture qu'aucun scribe vivant ne connaît. Le Gardien n'eut pas l'air surpris. « Le registre note les visiteurs avant qu'ils n'arrivent, dit-il. Sinon, comment saurait-il qui attendre ? »" },
  { t: "La dernière garde",
    p: "La vingt et unième nuit, la plus longue, les formes de glace revinrent par centaines. L'armée {A} tint la ligne jusqu'à l'aube, dos à la porte suivante. Quand le soleil mourant toucha enfin la flèche, les créatures fondirent toutes à la fois, et dans chaque flaque brillait un minuscule éclat d'or." },
  { t: "Le seuil",
    p: "Il ne restait que deux portes. La première s'ouvrit sur un escalier qui descendait en spirale dans une lumière chaude, la première depuis des semaines. Le Gardien s'arrêta en haut des marches. « Je n'ai jamais eu le droit d'aller plus loin. Vous me raconterez ? » {H} promit." },
  { t: "La veille",
    p: "La dernière nuit avant l'Ascension, personne ne dormit. Les guerriers de l'armée {A} nettoyèrent leurs armes, réparèrent leurs bannières, et relurent les noms de leurs morts. Au fond de l'escalier, derrière l'ultime porte, une lumière battait doucement, au rythme d'un cœur immense et très ancien." },
  { t: "Le cœur du Reliquaire",
    p: "L'ultime porte s'ouvrit sans un bruit. Au cœur du Reliquaire, il n'y avait ni trésor ni arme : seulement un socle de marbre, vide, éclairé d'en haut. Une inscription y était gravée, toute fraîche : « Ici reposera ton œuvre. » {H} comprit alors pourquoi la balise s'était réveillée. Le registre n'attendait pas un sauveur. Il attendait un peintre. Et l'armée {A} remonta vers la surface, où l'Ascension commençait." },
];

// Fait le texte d'un épisode à partir des noms retenus
export function adventText(i, { army, hero }) {
  const e = ADVENT_STORY[i];
  if (!e) return null;
  // {H} en début de phrase (« le chef de guerre ») prend une majuscule
  const text = e.p.replaceAll("{A}", army).replace(/(^|[.!?»]\s+|«\s*)?\{H\}/g, (m, before) =>
    before !== undefined ? before + hero.charAt(0).toUpperCase() + hero.slice(1) : hero);
  // espaces insécables devant la ponctuation haute et dans les guillemets (pas de « » orphelin en fin de ligne)
  return { title: e.t, text: text.replace(/« /g, "«\u00A0").replace(/ ([»:;?!])/g, "\u00A0$1") };
}
