// ══════════════════════════════════════════════════════════
// GOOGLE DRIVE SYNC
// ══════════════════════════════════════════════════════════
const GOOGLE_CLIENT_ID = "736064962259-7fa9n0c66blaa0kg4qfljnbeu8hlmnsq.apps.googleusercontent.com";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const DRIVE_FILE_NAME = "wh40k-inventory.json";

export async function driveGetToken() {
  return new Promise((resolve, reject) => {
    if (!window.google) { reject(new Error("Google non chargé")); return; }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) reject(new Error(resp.error));
        else resolve(resp.access_token);
      },
      // Fenêtre Google bloquée par le navigateur, ou fermée sans répondre : sans ceci,
      // la demande n'aboutissait jamais et l'app restait sur « synchronisation ».
      error_callback: (err) => reject(new Error(err?.type || "google")),
    });
    client.requestAccessToken({ prompt: "" });
  });
}

import { dehydrate, rehydrate, photoData } from './photoStore.jsx';

// Sur Drive : un fichier de données, léger, réécrit à chaque modification, et les photos
// réparties en 16 fichiers. Ajouter une photo ne renvoie que le fichier qui la contient
// (environ 1/16e des photos), au lieu de renvoyer toute la collection à chaque fois.
const PHOTO_BUCKETS = 16;
const bucketName = (b) => `wh40k-photos-${b}.json`;
const bucketOf = (id) => parseInt(id.slice(-1), 36) % PHOTO_BUCKETS;
const fileIds = {}; // nom de fichier → identifiant Drive (évite de le rechercher à chaque fois)

async function driveFind(token, name) {
  if (fileIds[name] !== undefined) return fileIds[name];
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(`name='${name}' and trashed=false`) + "&fields=files(id,name)",
    { headers: { Authorization: "Bearer " + token } }
  );
  if (!res.ok) throw new Error("Drive " + res.status);
  const data = await res.json();
  return (fileIds[name] = data.files?.[0]?.id || null);
}

async function driveRead(token, name) {
  const id = await driveFind(token, name);
  if (!id) return null;
  const res = await fetch("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media", { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) throw new Error("Drive " + res.status);
  return await res.json();
}

async function driveWrite(token, name, data) {
  const body = JSON.stringify(data);
  const id = await driveFind(token, name);
  if (id) {
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media", {
      method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body });
    if (!res.ok) throw new Error("Drive " + res.status);
  } else {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({ name })], { type: "application/json" }));
    form.append("file", new Blob([body], { type: "application/json" }));
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
    if (!res.ok) throw new Error("Drive " + res.status);
    fileIds[name] = (await res.json()).id || null;
  }
}

// Contenu déjà envoyé pour chaque fichier de photos (liste des identifiants)
const SIG_KEY = "drivePhotoSig";
const loadSigs = () => { try { return JSON.parse(localStorage.getItem(SIG_KEY) || "{}"); } catch { return {}; } };
const saveSigs = (s) => { try { localStorage.setItem(SIG_KEY, JSON.stringify(s)); } catch {} };

export async function driveSaveState(token, state) {
  const { state: light, ids } = dehydrate(state);
  const buckets = Array.from({ length: PHOTO_BUCKETS }, () => []);
  ids.forEach(id => buckets[bucketOf(id)].push(id));
  const sigs = loadSigs();
  // 1. Les photos d'abord (seulement les fichiers dont le contenu a changé)…
  for (let b = 0; b < PHOTO_BUCKETS; b++) {
    const sig = buckets[b].sort().join(",");
    if (sigs[b] === sig) continue;
    if (!sig && sigs[b] === undefined) { sigs[b] = sig; continue; } // fichier vide jamais créé : inutile de le créer
    const content = {}; buckets[b].forEach(id => { content[id] = photoData(id); });
    await driveWrite(token, bucketName(b), content);
    sigs[b] = sig; saveSigs(sigs);
  }
  // 2. …puis les données : elles ne désignent ainsi jamais une photo pas encore envoyée
  await driveWrite(token, DRIVE_FILE_NAME, { ...light, _savedAt: new Date().toISOString(), _photoBuckets: PHOTO_BUCKETS });
}

// Renvoie { data, savedAt } ou null. Lit aussi l'ancien format (photos dans les données).
export async function driveLoadState(token) {
  const main = await driveRead(token, DRIVE_FILE_NAME);
  if (!main || !main.inventory) return null;
  const { _savedAt, _photoBuckets, ...raw } = main;
  let photos = {};
  if (_photoBuckets) {
    const sigs = {};
    // Un fichier de photos qui n'existe pas renvoie null (normal : il n'a jamais été créé).
    // Mais s'il existe et que sa lecture ÉCHOUE (coupure réseau…), on abandonne tout le
    // chargement : continuer aurait marqué ses photos comme « absentes », et cette absence
    // aurait ensuite été enregistrée sur le téléphone puis renvoyée sur Drive.
    const parts = await Promise.all(Array.from({ length: _photoBuckets }, (_, b) => driveRead(token, bucketName(b))));
    parts.forEach((p, b) => { if (p) { Object.assign(photos, p); sigs[b] = Object.keys(p).sort().join(","); } });
    saveSigs(sigs);
  }
  const { state } = rehydrate(raw, photos);
  return { data: state, savedAt: _savedAt || null };
}

// Déconnexion : oublie les fichiers repérés et les envois mémorisés. Au prochain
// raccordement (même compte ou un autre), tout sera revérifié et renvoyé si besoin.
export function driveForget(token) {
  Object.keys(fileIds).forEach(k => delete fileIds[k]);
  try { localStorage.removeItem(SIG_KEY); } catch {}
  // Retire l'autorisation donnée à l'app sur ce compte Google
  try { if (token && window.google?.accounts?.oauth2?.revoke) window.google.accounts.oauth2.revoke(token, () => {}); } catch {}
}
