// ══════════════════════════════════════════════════════════
// PHOTOS RANGÉES À PART
// ══════════════════════════════════════════════════════════
// En mémoire, l'app manipule toujours les photos comme avant (des images « data: »
// directement dans l'inventaire, la Parade…) : aucun écran n'a besoin de changer.
// C'est seulement à l'ENREGISTREMENT que les photos sont sorties de l'état et remplacées
// par une petite référence. Chaque photo n'est ainsi écrite qu'une seule fois (sur le
// téléphone comme sur Google Drive), au lieu d'être réécrite à chaque modification.

export const PHOTO_REF = "reliquaire-photo:";

// Une photo = une longue chaîne « data:image/… ». Les toutes petites restent en ligne.
const isInlinePhoto = (v) => typeof v === "string" && v.length > 1500 && v.startsWith("data:image/");
const isRef = (v) => typeof v === "string" && v.startsWith(PHOTO_REF);

const idByData = new Map();   // image → identifiant (la même image garde toujours le même id)
const dataById = new Map();   // identifiant → image
const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export function photoIdFor(data) {
  let id = idByData.get(data);
  if (!id) { id = newId(); idByData.set(data, id); dataById.set(id, data); }
  return id;
}
export function photoData(id) { return dataById.get(id); }
export function registerPhoto(id, data) { idByData.set(data, id); dataById.set(id, data); }

// Remplace chaque photo par sa référence. Renvoie l'état allégé et les identifiants utilisés.
export function dehydrate(state) {
  const ids = new Set();
  const walk = (v) => {
    if (isInlinePhoto(v)) { const id = photoIdFor(v); ids.add(id); return PHOTO_REF + id; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      const o = {}; for (const k in v) o[k] = walk(v[k]); return o;
    }
    return v;
  };
  return { state: walk(state), ids };
}

// Remet les photos à leur place. Une référence introuvable devient null (photo absente)
// plutôt que de laisser un texte illisible là où l'écran attend une image.
export function rehydrate(state, photos /* { id: data } ou Map */) {
  const get = (id) => (photos instanceof Map ? photos.get(id) : photos?.[id]) ?? dataById.get(id);
  const missing = [];
  const walk = (v) => {
    if (isRef(v)) {
      const id = v.slice(PHOTO_REF.length); const d = get(id);
      if (d) { registerPhoto(id, d); return d; }
      missing.push(id); return null;
    }
    if (isInlinePhoto(v)) { photoIdFor(v); return v; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      const o = {}; for (const k in v) o[k] = walk(v[k]); return o;
    }
    return v;
  };
  return { state: walk(state), missing };
}

// Vrai si l'état contient encore des photos « en ligne » (ancien format).
export function hasInlinePhotos(state) {
  let found = false;
  const walk = (v) => {
    if (found) return;
    if (isInlinePhoto(v)) { found = true; return; }
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const k in v) walk(v[k]);
  };
  walk(state); return found;
}
