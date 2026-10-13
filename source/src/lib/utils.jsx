import { FACTIONS } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { findUnit } from '../data/units.jsx';

// ══════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════

// Version affichée en CODEX — injectée au moment du build (voir __BUILD_TIME__ dans
// vite.config.js), PAS calculée depuis document.lastModified. Cette dernière API est
// notoirement peu fiable : un document servi depuis un cache (service worker, cache
// HTTP, CDN) conserve souvent la date du tout premier chargement mis en cache, pas
// celle du fichier réel côté serveur — elle pouvait donc afficher une ancienne date
// même avec le tout dernier code déployé, rendant impossible de vérifier si une mise
// à jour a bien pris effet. __BUILD_TIME__ est gravé dans le bundle JS lui-même au
// moment de "npm run build" : il change forcément à chaque nouveau build, quel que
// soit l'état du cache du navigateur.
export const APP_VERSION = (() => {
  try {
    const raw = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : null;
    if (!raw) return "?";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "?";
    const day = String(d.getDate()).padStart(2,"0");
    const month = String(d.getMonth()+1).padStart(2,"0");
    const year = String(d.getFullYear()).slice(2);
    const h = String(d.getHours()).padStart(2,"0");
    const m = String(d.getMinutes()).padStart(2,"0");
    return `${day}/${month}/${year} ${h}:${m}`;
  } catch { return "?"; }
})();

// Générateur d'identifiants uniques — Date.now() seul peut produire deux IDs
// identiques si deux ajouts se produisent dans la même milliseconde (ajouts rapides
// successifs, ou double déclenchement tactile). Un compteur monotone en plus du
// timestamp élimine ce risque de collision, qui cassait silencieusement des choses
// supposant des ID uniques (suppression, recherche par ID...).
let __uidCounter = 0;

export function uid() { __uidCounter = (__uidCounter + 1) % 1000; return Date.now() * 1000 + __uidCounter; }

// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// COMPRESSION PHOTO
// ══════════════════════════════════════════════════════════
export function compressPhoto(file, maxSize=600, quality=0.75) {
  // Lit l'image via une URL d'objet (et non plus en base64 : une photo de téléphone de
  // 12 Mpx faisait ~8 Mo de texte en mémoire avant même d'être réduite), puis libère tout.
  return new Promise((resolve) => {
    const isString = typeof file === "string";
    const src = isString ? file : URL.createObjectURL(file);
    const img = new Image();
    const done = (out) => {
      if (!isString) { try { URL.revokeObjectURL(src); } catch {} }
      img.onload = img.onerror = null; img.src = "";
      resolve(out);
    };
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        // WebP : 25 à 35 % plus léger que le JPEG à qualité égale. Si le navigateur ne sait pas
        // l'encoder (il renvoie alors du PNG, bien plus lourd), on reste en JPEG.
        let out = canvas.toDataURL("image/webp", quality);
        if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", quality);
        canvas.width = canvas.height = 0; // libère le tampon de l'image tout de suite
        done(out);
      } catch { done(isString ? file : null); }
    };
    img.onerror = () => done(isString ? file : null);
    img.src = src;
  });
}

// ── Début de Croisade ──
// Date à partir de laquelle on considère que l'utilisateur "joue le jeu" dans l'app.
// Réglable dans le CODEX ; par défaut la première activité enregistrée (1re utilisation).
// Renvoie toujours une chaîne "YYYY-MM-DD" comparable lexicographiquement.
export function crusadeStartOf(appState, paintHistory) {
  if (appState?.crusadeStart) return appState.crusadeStart;
  const days = (paintHistory||[])
    .map(h => h.day || (h.date ? h.date + "-01" : null))
    .filter(Boolean)
    .sort();
  return days.length ? days[0] : localDay();
}

// ── Générateur de vœux thématiques (Serment de Croisade) ──
// Chaque entrée ne s'affiche que si l'inventaire réel contient une figurine
// non peinte correspondante — la liste qui sort dépend donc de ta pile.
export function buildOathSuggestions(inventory) {
  const unpainted = inventory.filter(i => i.paintStatus !== "painted");
  const unitOf   = (i) => findUnit(i.faction, i.unitId);
  const nameOf   = (i) => unitOf(i)?.name || "cette figurine";
  const figsOf   = (i) => getModelCount(unitOf(i)?.name, i.qty||1, i.modelCount);
  const ptsOf    = (i) => (POINTS_DB[unitOf(i)?.name]||0) * (i.qty||1);
  const byRole   = (roles) => unpainted.find(i => { const u=unitOf(i); return u && roles.includes(u.role); });
  const list = [];
  const addUnit = (item, kind, days) => { if (item) list.push({ label:`Peindre ${nameOf(item)}`, kind, days, target: figsOf(item), itemId: item.id }); };

  addUnit(byRole(["Titanique","Seigneur de guerre"]), "Titan", 90);
  addUnit(byRole(["Armiger","Chevalier Acastus","Chevalier Cerastus","Chevalier Dominus","Chevalier Questoris"]), "Chevalier", 30);
  addUnit(byRole(["QG"]), "Personnage", 21);
  addUnit(byRole(["Élite"]), "Élite", 30);
  addUnit(byRole(["Soutien lourd"]), "Soutien lourd", 30);
  addUnit(byRole(["Troupes"]), "Troupes", 14);
  addUnit(byRole(["Rapide","Attaque rapide"]), "Attaque rapide", 14);
  addUnit(byRole(["Transport"]), "Transport", 14);

  // La plus ancienne figurine en attente (celle qui traîne depuis le plus longtemps)
  if (unpainted.length) {
    const oldest = [...unpainted].sort((a,b) => (a.purchasedAt||"9999") < (b.purchasedAt||"9999") ? -1 : 1)[0];
    list.push({ label:`Enfin peindre ${nameOf(oldest)}`, kind:"Dette ancienne", days:30, target: figsOf(oldest), itemId: oldest.id });
  }

  // La figurine non peinte la plus chère en points (le monstre à abattre)
  if (unpainted.length) {
    const priciest = [...unpainted].sort((a,b) => ptsOf(b)-ptsOf(a))[0];
    if (ptsOf(priciest) > 0) list.push({ label:`Abattre ${nameOf(priciest)}`, kind:"Le monstre", days:45, target: figsOf(priciest), itemId: priciest.id });
  }

  // Par faction : nettoyer une petite armée entière, ou attaquer le plus gros chantier
  const factionsUnpainted = {};
  unpainted.forEach(i => { factionsUnpainted[i.faction] = (factionsUnpainted[i.faction]||0) + figsOf(i); });
  const entries = Object.entries(factionsUnpainted);
  const small = entries.filter(([,n]) => n>0 && n<=5).sort((a,b)=>a[1]-b[1])[0];
  if (small) list.push({ label:`Nettoyer entièrement ${FACTIONS[small[0]]?.label||small[0]}`, kind:"Faction", days:21, target: small[1] });
  const near = entries.filter(([,n]) => n>5 && n<=10).sort((a,b)=>a[1]-b[1])[0];
  if (near) list.push({ label:`Finir la faction ${FACTIONS[near[0]]?.label||near[0]}`, kind:"Faction proche", days:Math.max(21, near[1]*4), target: near[1] });
  const biggest = entries.sort((a,b)=>b[1]-a[1])[0];
  if (biggest && biggest[1] > 10) list.push({ label:`Entamer le gros morceau : ${FACTIONS[biggest[0]]?.label||biggest[0]}`, kind:"Gros chantier", days:45, target: Math.min(10, biggest[1]) });

  // Objectif de points peints (accumule des figurines non peintes jusqu'à ~500 pts)
  if (unpainted.length) {
    let acc = 0, count = 0;
    for (const i of [...unpainted].sort((a,b)=>ptsOf(b)-ptsOf(a))) { if (acc>=500) break; acc += ptsOf(i); count += figsOf(i); }
    if (count > 0) list.push({ label:`Peindre l'équivalent de 500 points`, kind:"Objectif points", days:60, target: count });
  }

  // Un quart de la pile totale
  const totalUnpainted = unpainted.reduce((s,i)=>s+figsOf(i),0);
  if (totalUnpainted >= 4) {
    const quarter = Math.ceil(totalUnpainted/4);
    list.push({ label:`Entamer sérieusement la pile (¼)`, kind:"Grand ménage", days:Math.min(120, Math.max(30, quarter*3)), target: quarter });
  }

  // La pile entière — le grand serment
  if (totalUnpainted > 0 && totalUnpainted <= 60) {
    list.push({ label:`Purger la pile en entier`, kind:"Purge Totale", days:180, target: totalUnpainted });
  }

  return list;
}

export function orderedFactionEntries() {
  let order = [];
  try { order = JSON.parse(localStorage.getItem("factionOrder")||"[]"); } catch {}
  const keys = Object.keys(FACTIONS);
  const sorted = [...keys].sort((a,b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia===-1?999:ia) - (ib===-1?999:ib);
  });
  return sorted.map(k => [k, FACTIONS[k]]);
}

// Notification dans le style de l'app (remplace les notify() natives du navigateur).
// Utilisable de n'importe où : notify("Texte") ; notify("Texte", { sticky:true }) reste
// affichée jusqu'au toucher (pour les messages importants).
export function notify(text, opts = {}) {
  try { window.dispatchEvent(new CustomEvent("reliquaire:notify", { detail: { text: String(text), sticky: !!opts.sticky } })); } catch {}
}

// Date du jour au format AAAA-MM-JJ en heure LOCALE. toISOString() donne l'heure UTC :
// en France, entre minuit et 1h/2h du matin, il renvoyait encore la date de la veille
// (missions et Dé du Destin qui ne se renouvelaient qu'à 2h, peinture datée de la veille…).
export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
