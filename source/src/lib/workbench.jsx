// ══════════════════════════════════════════════════════════
// L'ÉTABLI : la relique « En cours » dont parlent le Chapelain et le Tarot
// ══════════════════════════════════════════════════════════
// Priorité : la relique du serment, puis un colosse, puis la dernière passée « En cours ».
import { isColossus } from './colossus.jsx';

export function workbenchRelic(appState = {}, ptsMap = {}) {
  const wips = (appState.inventory || []).filter(i => i.paintStatus === "wip");
  if (!wips.length) return null;
  const oathOn = appState.oath?.unitId != null && wips.find(i => i.id === appState.oath.unitId);
  const big = wips.find(i => isColossus(i, ptsMap));
  return oathOn || big || wips[wips.length - 1];
}

// Lecture de la lame de la semaine pour la relique sur l'établi ({n} = son nom)
const READINGS = {
  "I":     "{n} est sur l'établi : ne la laisse pas retomber dans l'immobilisme. Une couche cette semaine, au moins.",
  "II":    "Avant la prochaine couche sur {n}, relis ta recette, ou cherche comment d'autres ont peint la partie qui te résiste.",
  "III":   "Pour {n}, laisse le hasard choisir : lance un dé pour décider quelle partie peindre ensuite.",
  "IV":    "Rien ne presse avec {n}. Prends le temps qu'il faut : chaque couche bien posée compte.",
  "V":     "{n} est ton grand ouvrage du moment. Attaque cette semaine sa partie la plus impressionnante.",
  "VI":    "Offre à {n} une séance en musique : choisis la bande-son qui lui ressemble.",
  "VII":   "Sur {n}, suis ton instinct : commence par la zone qui te fait le plus envie.",
  "VIII":  "Pousse {n} vers la fin cette semaine : fixe-toi une étape précise, et tiens-la.",
  "IX":    "Tant que {n} n'est pas consacrée, la Justice te demande de ne rien acheter de neuf.",
  "X":     "Offre à {n} une session entière, sans écran ni distraction. Rien que toi et elle.",
  "XI":    "Termine ce que tu as commencé : {n} passe avant toute nouvelle figurine.",
  "XII":   "Sur {n}, soigne les détails : yeux, liserés, petites pièces. La précision avant la vitesse.",
  "XIII":  "{n} vaut mieux qu'un nouvel achat. Résiste à la tentation jusqu'à sa consécration.",
  "XIV":   "Pendant que {n} avance, rêve à la suivante… mais ne la commence qu'une fois celle-ci consacrée.",
  "XV":    "Si tu bloques sur {n}, avance quand même sur une petite zone. La brume finit toujours par se lever.",
  "XVI":   "Jour faste pour {n} : attaque la partie qui t'intimide le plus.",
  "XVII":  "Compare {n} à ce que tu peignais il y a un an. Sois honnête, et un peu fier.",
  "XVIII": "Vise une étape vraiment finie sur {n} : une zone achevée vaut mieux que dix commencées.",
  "XIX":   "Sur {n}, essaie une technique nouvelle : un lavis, un brossage à sec, un effet que tu n'as jamais osé.",
  "XX":    "Le servo-crâne s'est égaré dans le Warp, mais {n} t'attend toujours sur l'établi.",
  "0":     "Sur {n}, ose une couleur que tu n'avais pas prévue. Tu feras le tri après.",
  "XXI":   "Ressors une ancienne relique et pose-la à côté de {n} : tu mesureras le chemin parcouru.",
};
export function workbenchReading(numeral, name) {
  const t = READINGS[numeral];
  return t ? t.replace("{n}", name) : null;
}
