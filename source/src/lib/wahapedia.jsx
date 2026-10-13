// ══════════════════════════════════════════════════════════
// UNIT ROW
// ══════════════════════════════════════════════════════════

// Wahapedia URL: spaces→hyphens, Title-Case each word, remove apostrophes/special chars
// Format: wahapedia.ru/wh40k10ed/factions/[faction]/[Unit-Name]
const WAHA_FACTIONS = {
  "SM": "space-marines",
  "TY": "tyranids",
  "IK": "imperial-knights",
  "IM": "agents-of-the-imperium",
  "CSM": "chaos-space-marines",
};

// Certaines unités IM sont sur adepta-sororitas plutôt que agents-of-the-imperium
const WAHA_SORORITAS = new Set(["Morvenn Vahl","Saint Celestine","Junith Eruita",
  "Triumph of Saint Katherine","Canoness","Palatine","Dialogus","Hospitaller",
  "Imagifier","Battle Sisters Squad","Dominion Squad","Celestian Sacresants",
  "Repentia Squad","Arco-flagellants","Death Cult Assassins","Mortifiers",
  "Penitent Engines","Paragon Warsuits","Retributor Squad","Seraphim Squad",
  "Zephyrim Squad","Novitiates","Castigator","Exorcist","Immolator","Sororitas Rhino"]);

export function wahapediaUrl(unitName, faction) {
  let factionSlug = WAHA_FACTIONS[faction] || "space-marines";
  if (faction === "IM" && WAHA_SORORITAS.has(unitName)) factionSlug = "adepta-sororitas";
  const slug = unitName
    .replace(/([a-z])'([A-Z])/g, "$1-$2") // apostrophe before uppercase → hyphen (El'Jonson → El-Jonson)
    .replace(/'/g, "")                      // all other apostrophes → remove (Kor'sarro, 's, etc.)
    .replace(/[^a-zA-Z0-9\s-]/g, "")      // other special chars → remove
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)) // Title-Case each word
    .join("-");
  return `https://wahapedia.ru/wh40k10ed/factions/${factionSlug}/${slug}`;
}
