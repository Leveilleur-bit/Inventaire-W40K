// ══════════════════════════════════════════════════════════
// LA CARTE DU PÈLERINAGE : les mondes traversés par la flotte de la Croisade
// ══════════════════════════════════════════════════════════
// Un monde tous les PILGRIM_STEP points consacrés (points des figurines peintes, comme dans CROISADE).
// 5 segmentums de 12 mondes, puis un voyage sans fin au-delà de la Grande Faille.
// Textes écrits pour l'app. Quelques mondes connus de l'univers, les autres inventés.

import { POINTS_DB } from './points.jsx';
import { UNITS_DB, findUnit } from './units.jsx';

export const PILGRIM_STEP = 500;

export const SEGMENTUMS = [
  { key: "solar", name: "Segmentum Solar", color: "#d4b060", worlds: [
    { name: "Terra", text: "Le berceau. La flotte quitte l'orbite du Trône d'Or sous le regard de mille cathédrales. Aucun pèlerin ne revient tout à fait le même." },
    { name: "Luna", text: "La lune grise de Terra. Les docks y sont si anciens que certains quais portent encore des noms qu'aucun registre ne sait traduire." },
    { name: "Mars", text: "Le Monde-Forge primordial. Les Tech-Prêtres bénissent les moteurs de la flotte en échange d'un serment : rapporter tout savoir perdu." },
    { name: "Titan", text: "Lune de Saturne, forteresse silencieuse. On n'y accoste pas : on salue de loin, et l'on sent des regards qui pèsent sur les boucliers." },
    { name: "Necromunda", text: "Un monde-ruche dont les tours percent les nuages toxiques. La flotte y recrute des pilotes nés sans jamais avoir vu le ciel." },
    { name: "Sainte-Ossuaire", text: "Un monde-reliquaire où chaque colline est un tombeau. Les pèlerins y laissent une figurine de cire, pour que leur nom reste en orbite." },
    { name: "Dorvane Prime", text: "Champs de blé gris à perte de vue, sous un soleil pâle. Ses moissons nourrissent trois systèmes, et ses enfants partent tous à la guerre." },
    { name: "Le Phare d'Ascalon", text: "Une station de navigation plantée dans le vide. Son astropathe aveugle connaît le nom de chaque vaisseau qui l'a croisé depuis neuf siècles." },
    { name: "Hespéria", text: "Monde-jardin réservé aux nobles de l'Administratum. Les fontaines y coulent d'eau claire, ce qui suffit à le rendre suspect." },
    { name: "Kessel-Ultor", text: "Un astéroïde-prison creusé de galeries. Ses détenus forgent des chaînes qu'on envoie aux quatre coins de l'Imperium." },
    { name: "Le Chœur de Varn", text: "Une ceinture de stations-chapelles qui chantent en continu depuis la Grande Croisade. Si le chant s'arrête, dit-on, le Segmentum s'éteint." },
    { name: "La Porte Solaire", text: "Dernière balise avant le grand saut. Les capitaines y gravent leur nom sur la coque d'un ancien croiseur, en guise d'adieu." },
  ]},
  { key: "pacificus", name: "Segmentum Pacificus", color: "#6a9ac8", worlds: [
    { name: "Myrthos", text: "Un monde-océan sans un seul continent. Ses cités flottent, s'amarrent et se séparent au gré des tempêtes et des querelles." },
    { name: "Les Récifs d'Oran", text: "Un champ de débris où dérivent des vaisseaux morts depuis l'Hérésie. Les pillards du Mechanicus y fouillent avec une piété inquiète." },
    { name: "Calvarion", text: "Monde-cathédrale construit sur un seul miracle. Personne ne se souvient du miracle, mais la cathédrale, elle, n'a jamais cessé de grandir." },
    { name: "Ferrovia", text: "Monde-forge mineur, fier de ses canons. Chaque obus porte une prière gravée à la main par un ouvrier qui ne verra jamais la bataille." },
    { name: "Thule-sous-Glace", text: "Une planète gelée dont les habitants vivent sous la banquise. Ils fêtent chaque arrivée de vaisseau comme un lever de soleil." },
    { name: "Ambreval", text: "Monde agricole où l'on cultive l'encens du Ministorum. Toute l'atmosphère sent la chapelle, et les enfants y naissent en toussant." },
    { name: "La Cicatrice de Pyrrhe", text: "Un monde brisé en trois morceaux par une arme oubliée. Entre les fragments, des épaves de cuirassés tournent encore en silence." },
    { name: "Aurelia Minor", text: "Planète-université où l'on forme les scribes de l'Administratum. On y apprend à recopier, jamais à comprendre." },
    { name: "Le Bastion de Sorn", text: "Forteresse orbitale tenue par un régiment oublié. Ses soldats attendent toujours des ordres envoyés il y a deux cents ans." },
    { name: "Vaelhim", text: "Monde de forêts géantes où les arbres sont plus vieux que l'Imperium. Les bûcherons y prient avant chaque abattage, par prudence." },
    { name: "Néréa Station", text: "Un relais de ravitaillement fréquenté par des marchands libres. On y trouve de tout, surtout ce qu'il vaudrait mieux ne pas trouver." },
    { name: "Le Seuil de Pacificus", text: "Une nébuleuse dorée qui marque la frontière. Les navigateurs disent qu'elle chante, et refusent d'expliquer ce qu'elle chante." },
  ]},
  { key: "tempestus", name: "Segmentum Tempestus", color: "#5aa08a", worlds: [
    { name: "Lethis", text: "Monde-marais aux brumes vertes. Les régiments qu'on y lève sont réputés pour ne jamais se perdre, même dans le noir le plus complet." },
    { name: "Orcadia", text: "Une planète-tempête où le vent ne tombe jamais. Ses forteresses sont basses, rondes et profondément enterrées." },
    { name: "Le Puits de Karst", text: "Une mine si profonde qu'elle aurait atteint le noyau. Personne n'est remonté pour le confirmer." },
    { name: "Sainte-Évangéline", text: "Monde-couvent des Sœurs de Bataille. Les cloches sonnent à chaque vaisseau qui passe, et se taisent pour ceux qui ne reviennent pas." },
    { name: "Gorgonax", text: "Un monde reconquis aux Orks il y a trois générations. On y trouve encore des carcasses de machines peintes en rouge, qui démarrent parfois seules." },
    { name: "Valdis IV", text: "Planète-hôpital où l'on rafistole les héros. Les médecins y sont si nombreux qu'on dit qu'aucun soldat n'y meurt sans autorisation." },
    { name: "Les Lunes de Tharn", text: "Sept lunes alignées autour d'une géante gazeuse. Chacune garde un fragment d'une même relique, et aucune ne veut céder le sien." },
    { name: "Cendrebrune", text: "Monde volcanique où l'on forge les armures des gardes d'honneur. Le métal y est trempé dans l'huile sainte et dans la sueur." },
    { name: "Ilyrion", text: "Un monde abandonné par ses habitants en une seule nuit. Les tables sont encore mises, et les lampes allumées." },
    { name: "Le Monastère d'Ebon", text: "Un monastère accroché à un astéroïde. Ses moines recopient l'histoire de chaque Croisade qui passe, la tienne comprise." },
    { name: "Kordaron", text: "Monde-garnison aux remparts infinis. Chaque génération ajoute une muraille, sans jamais savoir contre quel ennemi." },
    { name: "Les Portes de l'Orage", text: "Un couloir de tempêtes du Warp que seuls les navigateurs les plus fous empruntent. Ta flotte l'a franchi, couche après couche." },
  ]},
  { key: "ultima", name: "Segmentum Ultima", color: "#4a7ab8", worlds: [
    { name: "Macragge", text: "Capitale d'Ultramar, ordonnée comme un traité de stratégie. Même les jardins y suivent un plan de bataille." },
    { name: "Talassar", text: "Un monde d'archipels où l'on construit les navires de guerre à la main. Chaque coque porte le nom de l'artisan qui l'a bénie." },
    { name: "Baal", text: "Un monde rouge et désolé, aux lunes irradiées. On y respecte une soif ancienne, et l'on évite d'en parler à voix haute." },
    { name: "Ossuaire de Verlune", text: "Champ de bataille contre les Tyranides devenu sanctuaire. La biomasse n'est jamais revenue, mais les pèlerins si." },
    { name: "Calth", text: "Un monde qui a vu son soleil trahi. Ses habitants vivent sous terre depuis dix mille ans, et ne remontent qu'en de rares occasions." },
    { name: "Le Reliquaire d'Ixion", text: "Une station où l'on garde des armures de héros tombés. Certaines, la nuit, changeraient de position." },
    { name: "Damoclès", text: "Frontière avec l'Empire T'au. On y parle de Bien Suprême à voix basse, et l'on surveille ceux qui en parlent trop bien." },
    { name: "Bellicor", text: "Monde de casernes et de terrains d'exercice. Même les enfants y marchent au pas, et le dimanche on y défile." },
    { name: "Orphée Secundus", text: "Planète morte dont le ciel garde encore la lueur d'une flotte-ruche. Rien n'y pousse, sauf le silence." },
    { name: "Les Forges de Valtis", text: "Un monde-forge qui a survécu à trois invasions. Ses Tech-Prêtres comptent les années en mises à jour de catéchisme." },
    { name: "Sanctuaire d'Ardent", text: "Un monde de pèlerinage où brûle une flamme jamais éteinte. Ta flotte y allume une bougie, pour chaque relique consacrée." },
    { name: "La Lisière Orientale", text: "Au-delà, l'Imperium se fait rare. Les cartes deviennent floues, et les prières plus longues." },
  ]},
  { key: "obscurus", name: "Segmentum Obscurus", color: "#9a5ab8", worlds: [
    { name: "Fenris", text: "Monde de glace et de loups. On y mesure un homme à la saga qu'on chantera sur lui, et la flotte y laisse quelques couplets." },
    { name: "Belis Corona", text: "Grand port de guerre où se rassemblent les flottes avant l'orage. Les quais y sont plus peuplés que bien des planètes." },
    { name: "Agripinaa", text: "Monde-forge aux usines sans fin, nourri de minerai et de prières. La fumée y est si dense qu'on y allume les lampes à midi." },
    { name: "Cadia", text: "La forteresse qui tenait la porte. Elle est tombée, mais ses survivants n'ont jamais cessé de se tenir droits." },
    { name: "Les Ruines de Mordant", text: "Un monde déchu dont les cathédrales ont été retournées contre leurs fidèles. La flotte y passe sans s'arrêter, et sans regarder." },
    { name: "Vigilus", text: "Un monde balafré par une tempête du Warp. Ses remparts tiennent, et ses habitants ont appris à dormir avec une arme." },
    { name: "Scarus", text: "Secteur de garnisons où l'on garde un œil sur l'Œil. Personne n'y parle fort, comme si l'ennemi pouvait entendre." },
    { name: "La Citadelle de Kasr Vane", text: "Un bastion reconstruit avec les pierres d'une forteresse perdue. Chaque mur porte le nom d'un mort." },
    { name: "Port-Cendral", text: "Un port immense où l'on répare les vaisseaux de ligne. La flotte y recharge ses torpilles et ses certitudes." },
    { name: "Le Champ des Saints", text: "Une plaine couverte de statues de héros anonymes. On dit qu'il en apparaît une nouvelle chaque fois qu'une Croisade passe." },
    { name: "Le Scriptorium de Thoum", text: "Un monde-bibliothèque tenu par des archivistes aveugles. Ils lisent du bout des doigts, et ne prêtent jamais rien." },
    { name: "La Grande Faille", text: "La plaie qui coupe la galaxie. Au-delà commence l'Imperium Nihilus, où la lumière de l'Astronomican ne porte plus. La Croisade continue." },
  ]},
];

// Au-delà de la Faille : mondes sans nom, générés de façon stable
const NIHILUS_PREFIX = ["Écho", "Cendre", "Veille", "Ombre", "Relais", "Brasier", "Silence", "Bastion", "Lueur", "Tombeau"];
const NIHILUS_LINES = [
  "Un monde sans nom dans le noir de Nihilus. La flotte y plante une balise, pour que d'autres retrouvent le chemin.",
  "Une colonie coupée de Terra depuis la Faille. Ses habitants pleurent en voyant les couleurs de ta Croisade.",
  "Un système vide, sauf un vaisseau mort qui émet toujours le même message. La flotte l'écoute, puis repart.",
  "Un monde qui priait seul depuis des années. Ta flotte n'a rien apporté, sinon la preuve qu'il n'est pas oublié.",
  "Une lune couverte de reliques abandonnées. On en ramène une, par respect, et l'on laisse les autres reposer.",
  "Une station dont l'Astropathe chante encore. La lumière de l'Empereur arrive ici, faible, mais elle arrive.",
];
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

export const NAMED_WORLDS = SEGMENTUMS.reduce((n, s) => n + s.worlds.length, 0);

// Monde n° idx (0 = Terra). Renvoie { name, text, segment, color, nihilus }
export function worldAt(idx) {
  let k = idx;
  for (const s of SEGMENTUMS) {
    if (k < s.worlds.length) return { ...s.worlds[k], segment: s.name, segKey: s.key, color: s.color, index: idx };
    k -= s.worlds.length;
  }
  const n = idx - NAMED_WORLDS;
  return {
    name: `${NIHILUS_PREFIX[n % NIHILUS_PREFIX.length]}-${ROMAN[Math.floor(n / NIHILUS_PREFIX.length) % ROMAN.length]}`,
    text: NIHILUS_LINES[n % NIHILUS_LINES.length],
    segment: "Imperium Nihilus", segKey: "nihilus", color: "#7a6a9a", index: idx, nihilus: true,
  };
}

// Position de la flotte pour un total de points consacrés
export function pilgrimState(pts) {
  const reached = Math.floor(Math.max(0, pts) / PILGRIM_STEP);    // nombre de mondes atteints après Terra
  const into = Math.max(0, pts) - reached * PILGRIM_STEP;
  return { current: reached, toNext: PILGRIM_STEP - into, frac: into / PILGRIM_STEP };
}

// Points consacrés (figurines peintes), calculés comme dans l'onglet CROISADE
export function consecratedPoints(inventory = [], ptsMap = {}) {
  return inventory.reduce((s, i) => {
    if (i.paintStatus !== "painted" || !UNITS_DB[i.faction]?.some(u => u.id === i.unitId)) return s;
    const u = findUnit(i.faction, i.unitId);
    const p = ptsMap[`${i.faction}:${i.unitId}`] || (u ? POINTS_DB[u.name] : 0) || 0;
    return s + p * (i.qty || 1);
  }, 0);
}
