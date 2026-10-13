// ══════════════════════════════════════════════════════════
// VISITES RARES ET FÊTES DU CALENDRIER IMPÉRIAL
// ══════════════════════════════════════════════════════════
// Rien à faire ni à valider : de la surprise et de l'ambiance, rien d'autre.

// Visites : environ un jour sur trente, fixé par la date (impossible de « relancer »).
// rarity : c = courante, r = rare, l = légendaire. faction : seulement si tu possèdes cette armée.
export const VISITS = [
  { id:"servo",      rarity:"c", icon:"◉", title:"Un servo-crâne égaré", text:"Il tourne trois fois au-dessus de ton établi, scanne un pot de peinture vide, puis repart vers les archives sans un bruit." },
  { id:"pelerin",    rarity:"c", icon:"✠", title:"Un pèlerin en route vers Terra", text:"Il s'arrête devant ta vitrine, trace le signe de l'aquila et reprend sa route. Il dit qu'il en parlera là-bas." },
  { id:"scribe",     rarity:"c", icon:"▤", title:"Un scribe du Munitorum", text:"Il recompte tes figurines, deux fois, fronce les sourcils, et repart avec un formulaire de plus." },
  { id:"cherubin",   rarity:"c", icon:"✧", title:"Un chérubin porteur de parchemin", text:"Il dépose un rouleau scellé sur ton établi. Il est vierge. Le message, dit-il, c'est à toi de l'écrire." },
  { id:"vox",        rarity:"c", icon:"≋", title:"Un appel vox brouillé", text:"« …ici la 7ᵉ Compagnie… tenons la position… quelqu'un a-t-il vu le pot de Leadbelcher ?… » Puis plus rien." },
  { id:"inquisiteur",rarity:"r", icon:"⸸", title:"Un Inquisiteur inspecte l'atelier", text:"Il soulève une figurine grise, la repose sans un mot et note quelque chose. Tu ne sauras jamais quoi." },
  { id:"astropathe", rarity:"r", icon:"◎", title:"Un Astropathe porteur d'une vision", text:"Il a vu tes étagères dans le Warp : pleines, peintes, rayonnantes. Il ne dit pas quand." },
  { id:"techpretre", rarity:"r", icon:"⚙", title:"Un Tech-prêtre bénit tes pinceaux", text:"Trois gouttes d'huile sacrée, une litanie binaire, et tes pinceaux sont purifiés. Les poils, eux, restent tordus." },
  { id:"commissaire",rarity:"r", icon:"✪", title:"Un Commissaire de passage", text:"Il observe l'atelier, hoche la tête et rengaine son pistolet. Tu as bien fait de ranger." },
  { id:"archiviste", rarity:"r", icon:"❖", title:"Un Archiviste consulte ton registre", text:"Il s'attarde sur tes plus anciennes reliques et murmure leurs noms, comme on salue de vieux compagnons." },
  { id:"spore",      rarity:"r", faction:"TY",  icon:"☣", title:"Une spore mycétique", text:"Elle s'est écrasée près de l'atelier. Quelque chose y a remué. Tes Tyranides semblent… impatients." },
  { id:"murmure",    rarity:"r", faction:"CSM", icon:"✴", title:"Un murmure du Chaos", text:"Une voix promet de peindre tout ton Chaos en une nuit. Il suffirait de dire oui. Tu as bien fait de refuser." },
  { id:"heraut",     rarity:"r", faction:"IK",  icon:"⚜", title:"Le héraut d'une Maison noble", text:"Il vient confirmer que tes Chevaliers sont dignes du blason, puis repart en fanfare, ce qui réveille tout le voisinage." },
  { id:"scarabee",   rarity:"r", faction:"NC",  icon:"⚙", title:"Un scarabée canoptek", text:"Il inspecte tes socles, cliquette d'un air désapprobateur et s'enfouit sous le tapis de découpe." },
  { id:"grot",       rarity:"r", faction:"OR",  icon:"⚒", title:"Un grot perdu", text:"Il réclame « le rouge qui va plus vite ». Tu lui montres le pot. Il repart ravi." },
  { id:"prophete",   rarity:"r", faction:"AE",  icon:"✧", title:"Un Prophète aeldari", text:"Il lit les runes, soupire longuement et repart sans rien dire. Les Aeldari sont comme ça." },
  { id:"chevaliergris", rarity:"l", icon:"✟", title:"Un Chevalier Gris de passage", text:"Il n'est resté qu'un instant. Ton atelier est désormais, officiellement, exempt de toute trace démoniaque." },
  { id:"echo",       rarity:"l", icon:"∞", title:"Un écho du Warp", text:"Pendant une seconde, toutes tes figurines grises ont semblé peintes. Puis la réalité est revenue. Était-ce une promesse ?" },
  { id:"ombre",      rarity:"l", icon:"♔", title:"L'ombre d'un Primarque", text:"Une silhouette immense se découpe dans l'encadrement de la porte. Quand tu te retournes, il n'y a personne. Mais le pinceau est encore chaud." },
];
export const RARITY = {
  c: { label:"VISITE",            color:"#b8a882" },
  r: { label:"VISITE RARE",       color:"#6aa0d8" },
  l: { label:"VISITE LÉGENDAIRE", color:"#e0b040" },
};

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// La visite du jour (ou null). ownedFactions : Set des factions possédées.
export function visitForDay(dayKey, ownedFactions) {
  if (hash("visite:" + dayKey) % 30 !== 0) return null;
  const roll = hash("rarete:" + dayKey) % 100;
  const rarity = roll < 5 ? "l" : roll < 30 ? "r" : "c";
  const pool = VISITS.filter(v => v.rarity === rarity && (!v.faction || ownedFactions.has(v.faction)));
  if (!pool.length) return null;
  return pool[hash("qui:" + dayKey) % pool.length];
}

// ── Fêtes ── (mois-jour de début et de fin, inclus ; la Saint-Sylvestre déborde sur janvier)
const FESTIVALS = [
  { id:"nouvelan", from:"12-31", to:"01-02", icon:"✦", color:"#d4b060", title:"Nouvel An impérial",
    text:"Une nouvelle année s'ouvre dans les registres du Munitorum. Que chacune de ses pages porte une relique consacrée.",
    cits:[ { text:"Nouvelle année, même pinceau. Il a bien servi, il servira encore.", author:"Le Chapelain" },
           { text:"Le Munitorum a clos les registres de l'an passé. Les tiens restent ouverts.", author:"Rapport du Munitorum" },
           { text:"Que l'année qui vient soit riche en couleurs, et pauvre en gris.", author:"Vœux du Chapitre" } ] },
  { id:"devotion", from:"02-14", to:"02-14", icon:"♡", color:"#d06078", title:"Fête de la Dévotion",
    text:"En ce jour, on célèbre ce que l'on aime vraiment. Tes figurines ne t'ont jamais demandé de fleurs. Juste un peu de peinture.",
    cits:[ { text:"Aucune dévotion n'est plus fidèle que celle d'un peintre à sa pile.", author:"Le Chapelain, attendri" },
           { text:"Offre-toi une soirée avec ta figurine préférée. Elle, au moins, ne bougera pas.", author:"Sagesse du Chapitre" },
           { text:"L'amour est un pigment rare. Tu en mets dans chaque couche.", author:"Observation astropathique" } ] },
  { id:"solstice", from:"06-21", to:"06-21", icon:"☼", color:"#e0a040", title:"Veillée du Solstice",
    text:"La nuit la plus courte de l'année. Les forges ne s'éteignent jamais tout à fait.",
    cits:[ { text:"Longue lumière, courte nuit : les conditions idéales pour les détails.", author:"Le Chapelain" },
           { text:"Même le soleil de Terra s'attarde pour regarder ton travail.", author:"Observation astropathique" } ] },
  { id:"warp", from:"10-29", to:"11-01", icon:"✴", color:"#9a5ad0", tint:"#5a2a8a", title:"Nuit du Warp",
    text:"Le voile s'amincit. Des murmures traversent l'atelier. Garde les lumières allumées et le pinceau à la main.",
    cits:[ { text:"Ce soir, les ombres de l'atelier bougent un peu trop. Peins vite, et peins bien.", author:"Murmure du Warp" },
           { text:"Une figurine grise laissée seule cette nuit pourrait bien se peindre… de couleurs que tu n'as pas choisies.", author:"Ordo Malleus" },
           { text:"Le Warp rit. Les Puissances observent. Le Chapelain, lui, a allumé toutes les bougies.", author:"Le Chapelain, nerveux" } ] },
  { id:"ascension", from:"12-24", to:"12-26", icon:"✠", color:"#e0c060", title:"Jour de l'Ascension",
    text:"L'Imperium célèbre l'Ascension de l'Empereur. Même le Chapelain s'autorise un sourire.",
    cits:[ { text:"En ce jour saint, chaque relique consacrée vaut double. Officieusement.", author:"Le Chapelain, d'humeur festive" },
           { text:"Les cloches de Terra sonnent. Dans ton atelier aussi, si l'on tend l'oreille.", author:"Liturgie du Chapitre" },
           { text:"Que l'Empereur veille sur tes reliques, et sur tes pinceaux.", author:"Bénédiction de l'Ascension" } ] },
];
const FRIDAY13 = { id:"vendredi13", icon:"⸸", color:"#b04040", title:"Jour de mauvais augure",
  text:"Les augures sont formels : aujourd'hui, ne renverse pas ton eau de rinçage sur ta palette.",
  cits:[ { text:"Vendredi 13. Garde un œil sur ton pot d'eau et l'autre sur ton chat.", author:"Les augures" },
         { text:"Mauvais présage : la peinture sèchera exactement quand tu n'auras pas fini.", author:"Observation astropathique" } ] };

const md = (d) => `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const inRange = (k, from, to) => from <= to ? (k >= from && k <= to) : (k >= from || k <= to);

// La fête du jour (ou null). crusadeStart / firstOpenAt : dates ISO éventuelles.
export function festivalFor(date, { crusadeStart, firstOpenAt } = {}) {
  const k = md(date);
  const anniv = (iso, title, what) => {
    if (!iso) return null;
    const d = new Date(String(iso).slice(0,10) + "T12:00:00");
    if (isNaN(d) || md(d) !== k) return null;
    const years = date.getFullYear() - d.getFullYear();
    if (years < 1) return null;
    return { id:"anniv-"+title, icon:"✦", color:"#d4b060", title,
      text:`${years} an${years>1?"s":""} ${what}. Chaque figurine peinte depuis ce jour-là en porte la trace.`,
      cits:[ { text:`${years} an${years>1?"s":""}, et le pinceau n'a pas dit son dernier mot.`, author:"Le Chapelain, ému" },
             { text:"Les archives s'en souviennent. Le Chapitre aussi.", author:"Scriptorium du Chapitre" } ] };
  };
  return anniv(crusadeStart, "Anniversaire de ta Croisade", "de Croisade")
      || anniv(firstOpenAt, "Anniversaire de ta collection", "que ta collection est consignée ici")
      || FESTIVALS.find(f => inRange(k, f.from, f.to))
      || (date.getDay() === 5 && date.getDate() === 13 ? FRIDAY13 : null);
}
