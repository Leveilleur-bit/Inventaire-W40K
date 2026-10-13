// ══════════════════════════════════════════════════════════
// SONS D'INTERFACE (célébration, dé, carte, sceau)
// ══════════════════════════════════════════════════════════
// Fichiers à déposer dans public/sons/. S'il en manque un, l'app reste simplement silencieuse.
const FILES = {
  celebration: "sons/sfx-celebration.mp3", // figurine consacrée, promotion
  de:          "sons/sfx-de.mp3",          // Dé du Destin
  carte:       "sons/sfx-carte.mp3",       // lame du Tarot retournée
  sceau:       "sons/sfx-sceau.mp3",       // Jugement scellé
  cloche:      "sons/sfx-cloche.mp3",      // cérémonie d'un colosse (glas)
  colosse:     "sons/sfx-colosse.mp3",     // cérémonie d'un colosse (musique, ~1 min)
};
let enabled = true, haptics = true;
export const setSfxEnabled = (v) => { enabled = v !== false; };
export const setHapticsEnabled = (v) => { haptics = v !== false; };

// Vibrations associées (Android ; ignoré ailleurs). Réglage séparé des sons.
const PATTERNS = {
  celebration: [35, 45, 70],
  promotion:   [60, 50, 60, 50, 140],
  de:          [12, 40, 12, 40, 12],
  carte:       [22],
  sceau:       [90],
  destin:      [25, 40, 60],   // résultat du Dé du Destin
  tap:         [20],           // appui long (changement de fond)
  cloche:      [220],
  colosse:     [120, 80, 120, 80, 300],
};
export function vibrate(name) {
  if (!haptics || !PATTERNS[name]) return;
  try { navigator.vibrate?.(PATTERNS[name]); } catch {}
}
const cache = {};
export function playSfx(name, volume = 0.6, vib = name) {
  vibrate(vib);
  if (!enabled || !FILES[name]) return;
  try {
    if (!cache[name]) { cache[name] = new Audio(import.meta.env.BASE_URL + FILES[name]); cache[name].preload = "auto"; }
    const a = cache[name].cloneNode();   // permet deux lectures rapprochées
    a.volume = volume;
    const p = a.play(); if (p) p.catch(() => {});
  } catch {}
}

// Joue un son et renvoie de quoi l'arrêter (pour la musique de la cérémonie des colosses)
export function playLong(name, volume = 0.7) {
  if (!enabled || !FILES[name]) return () => {};
  try {
    const a = new Audio(import.meta.env.BASE_URL + FILES[name]); a.volume = volume;
    const p = a.play(); if (p) p.catch(() => {});
    return () => { try { a.pause(); } catch {} };
  } catch { return () => {}; }
}
