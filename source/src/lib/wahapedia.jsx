// ══════════════════════════════════════════════════════════
// UNIT ROW
// ══════════════════════════════════════════════════════════

// Wahapedia URL: spaces→hyphens, Title-Case each word, remove apostrophes/special chars
// Format: wahapedia.ru/wh40k10ed/factions/[faction]/[Unit-Name]
import { WAHA_PAGES } from '../data/wahapediaPages.jsx';

// Page d'armée Wahapedia (secours quand la fiche exacte n'est pas connue)
const WAHA_FACTIONS = {
  SM:"space-marines", TY:"tyranids", IK:"imperial-knights", IM:"imperial-agents", CSM:"chaos-space-marines",
  AM:"astra-militarum", AS:"adepta-sororitas", NC:"necrons", AE:"aeldari", AC:"adeptus-custodes", OR:"orks",
  GC:"genestealer-cults", AD:"adeptus-mechanicus", CK:"chaos-knights", DR:"drukhari", TA:"t-au-empire",
  LD:"chaos-daemons", LV:"leagues-of-votann", GK:"grey-knights",
};

// Fiche exacte si elle a été vérifiée (data/wahapediaPages.jsx), sinon la page de l'armée.
export function wahapediaUrl(unitName, faction) {
  const base = "https://wahapedia.ru/wh40k10ed/factions/";
  const page = WAHA_PAGES[`${unitName}|${faction}`];
  if (page) return base + page;
  return base + (WAHA_FACTIONS[faction] || "space-marines") + "/";
}
