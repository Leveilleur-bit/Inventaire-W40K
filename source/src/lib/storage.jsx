// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// STORAGE (IndexedDB — fonctionne en file://, PWA, Android)
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════

import { dehydrate, rehydrate, hasInlinePhotos, photoData, PHOTO_REF } from './photoStore.jsx';

// Deux tiroirs dans la base locale : « appdata » pour les données (légères) et
// « photos » pour les images, une entrée par photo, écrite une seule fois.
// Version 2 de la base : ajout du tiroir « photos » (les données existantes sont conservées).
const DB_VERSION = 2;

// Une seule connexion, réutilisée. Avant, chaque sauvegarde en ouvrait une nouvelle
// sans jamais la fermer : après plusieurs ajouts d'affilée, les connexions et les copies
// de toute la collection (photos comprises) s'accumulaient jusqu'à ce qu'Android tue l'app.
let dbPromise = null;
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open("wh40k-codex", DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("appdata")) db.createObjectStore("appdata");
      if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
    };
    req.onsuccess = e => {
      const db = e.target.result;
      // Si le navigateur ferme la connexion (mise à jour, mémoire…), on en rouvrira une
      db.onclose = () => { dbPromise = null; };
      db.onversionchange = () => { try { db.close(); } catch {} dbPromise = null; };
      resolve(db);
    };
    req.onerror = e => { dbPromise = null; reject(e.target.error); };
  });
  return dbPromise;
}

const storedPhotoIds = new Set(); // photos déjà présentes dans le tiroir « photos »

// Vrai quand la lecture de la base a échoué. Tant que c'est le cas, AUCUNE écriture n'est
// faite : on ne sait pas ce que contient la base, et enregistrer l'état (vide) de l'app
// par-dessus effacerait la vraie collection.
let loadFailed = false;
export const storageLoadFailed = () => loadFailed;

// Lit la collection. Renvoie l'état, ou null s'il n'y a ENCORE RIEN d'enregistré
// (première ouverture). Si la lecture échoue, lève une erreur : « rien d'enregistré »
// et « lecture impossible » ne doivent jamais être confondus.
export async function loadApp() {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const state = await readState();
      loadFailed = false;
      return state;
    } catch (e) {
      lastErr = e;
      dbPromise = null; // la prochaine tentative rouvre une connexion neuve
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  loadFailed = true;
  throw lastErr || new Error("lecture");
}

async function readState() {
  const db = await openDB();
  const { raw, photos } = await new Promise((resolve, reject) => {
    const tx = db.transaction(["appdata", "photos"], "readonly");
    const out = { raw: null, photos: new Map() };
    tx.objectStore("appdata").get("state").onsuccess = e => { out.raw = e.target.result || null; };
    const ps = tx.objectStore("photos");
    const keysReq = ps.getAllKeys(), valsReq = ps.getAll();
    tx.oncomplete = () => { (keysReq.result||[]).forEach((k, i) => out.photos.set(k, valsReq.result[i])); resolve(out); };
    // Lecture incomplète : on échoue franchement plutôt que de renvoyer une collection
    // sans ses photos (elles seraient ensuite enregistrées comme « absentes », puis effacées).
    tx.onerror = tx.onabort = () => reject(tx.error || new Error("lecture"));
  });
  if (!raw) return null;
  photos.forEach((_, id) => storedPhotoIds.add(id));
  const { state, missing } = rehydrate(raw, photos);
  if (missing.length) console.warn("Photos introuvables :", missing.length);
  // Ancien format (photos dans les données) : on range tout de suite les photos à part
  if (hasInlinePhotos(raw)) saveApp(state);
  else cleanupPhotos(db, raw, photos);
  return state;
}

// Supprime du tiroir les photos qui ne sont plus utilisées (relique supprimée, photo remplacée).
// Sans risque : données et photos sont toujours écrites ensemble, dans une même transaction.
function cleanupPhotos(db, raw, photos) {
  try {
    const used = new Set(); // les références présentes dans les données
    JSON.stringify(raw, (k, v) => { if (typeof v === "string" && v.startsWith(PHOTO_REF)) used.add(v.slice(PHOTO_REF.length)); return v; });
    const orphans = [...photos.keys()].filter(id => !used.has(id));
    if (!orphans.length) return;
    const tx = db.transaction("photos", "readwrite");
    orphans.forEach(id => { tx.objectStore("photos").delete(id); storedPhotoIds.delete(id); });
  } catch {}
}

// File d'attente : une seule écriture à la fois. Si plusieurs sauvegardes arrivent pendant
// qu'une écriture est en cours, seule la plus récente est écrite ensuite (les états
// intermédiaires sont inutiles, et les écrire tous saturait la mémoire).
let writing = null;       // promesse de l'écriture en cours
let pending = null;       // { data, resolvers[] } : dernier état en attente
export function saveApp(d) {
  return new Promise((resolve) => {
    if (pending) { pending.data = d; pending.resolvers.push(resolve); }
    else pending = { data: d, resolvers: [resolve] };
    if (!writing) pump();
  });
}
async function pump() {
  while (pending) {
    const job = pending; pending = null;
    writing = writeState(job.data);
    const ok = await writing;
    job.resolvers.forEach(r => r(ok));
  }
  writing = null;
}
async function writeState(d) {
  if (loadFailed) return false; // base illisible au démarrage : on n'écrit rien par-dessus
  try {
    const db = await openDB();
    const { state, ids } = dehydrate(d);
    const fresh = [...ids].filter(id => !storedPhotoIds.has(id));
    const ok = await new Promise((resolve) => {
      // Photos nouvelles + données, dans UNE transaction : tout est écrit, ou rien
      const tx = db.transaction(["appdata", "photos"], "readwrite");
      fresh.forEach(id => tx.objectStore("photos").put(photoData(id), id));
      tx.objectStore("appdata").put(state, "state");
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => resolve(false);
      tx.onabort    = () => resolve(false); // ex. QuotaExceededError : stockage plein
    });
    if (ok) fresh.forEach(id => storedPhotoIds.add(id));
    return ok;
  } catch { return false; }
}
