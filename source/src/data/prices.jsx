// ═════════════════════════════════════════════════
// PRIX BOUTIQUE : les valeurs sont dans prices.json (hausse de prix = modifier ce fichier)
// ═════════════════════════════════════════════════
import PRICES_FILE from './prices.json';
// Les sections (par faction) ne servent qu'à la lisibilité du fichier : on les aplatit ici.
export const SHOP_PRICES = Object.assign({}, ...Object.values(PRICES_FILE.sections));
export const PRICES_SOURCE = PRICES_FILE.source;

