import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AmbientSound } from './components/AmbientSound.jsx';
import { NavGlyph } from './components/heraldry.jsx';
import { FOND_VEIL, HOME_BG_POOL, NotifyToast, homeFond, useConfirm } from './components/ui.jsx';
const IDLE_PARADE_MIN = 10;   // Mode Serviteur : photos de Parade nécessaires avant de quitter les fonds d'écran
import { FACTIONS, factionTitle } from './data/factions.jsx';
import { WEEKLY_CITATIONS, celebrationLoreFor } from './data/lore.jsx';
import { POINTS_DB, getModelCount } from './data/points.jsx';
import { UNITS_DB, findUnit, migrateUnitIds } from './data/units.jsx';
import { useDriveSync } from './hooks/useDriveSync.jsx';
import { buildBackup, readBackup } from './lib/backup.jsx';
import { loadApp, saveApp } from './lib/storage.jsx';
import { compressPhoto, localDay, notify, uid } from './lib/utils.jsx';
import { playSfx, setHapticsEnabled, setSfxEnabled } from './lib/sfx.jsx';
import { GoldBurst } from './components/effects.jsx';
import { ColossusCeremony } from './components/ColossusCeremony.jsx';
import { LightCeremony } from './components/LightCeremony.jsx';
import { TrophyCeremony } from './components/TrophyCeremony.jsx';
import { computeTrophies, enrolDaysLeft } from './lib/trophies.jsx';
import { OathCeremony } from './components/OathCeremony.jsx';
import { OATH_TIERS, candleDaysFor, figsOfItem, nameOfItem, oathFormula } from './lib/oaths.jsx';
import { isColossus } from './lib/colossus.jsx';
import { computeHonors } from './lib/honors.jsx';
import { classicDate, imperialDate } from './components/imperial.jsx';
import { SplashOverlay } from './views/SplashOverlay.jsx';
import { ViewHome } from './views/ViewHome.jsx';

// ── Onglets chargés à la demande ──
// L'Accueil et l'écran d'ouverture sont dans le fichier principal ; les autres onglets
// sont téléchargés séparément (démarrage plus rapide), puis préchargés en arrière-plan
// quelques secondes après l'ouverture pour que le premier passage reste instantané.
const VIEW_LOADERS = {
  ViewChronicle: () => import('./views/ViewChronicle.jsx'),
  ViewCodex: () => import('./views/ViewCodex.jsx'),
  ViewLists: () => import('./views/ViewCroisade.jsx'),
  ViewInventory: () => import('./views/ViewInventory.jsx'),
  ViewParade: () => import('./views/ViewParade.jsx'),
  ViewShame: () => import('./views/ViewShame.jsx'),
  ViewStats: () => import('./views/ViewStats.jsx'),
  ViewWishlist: () => import('./views/ViewWishlist.jsx'),
};
function lazyView(name) {
  return React.lazy(() => VIEW_LOADERS[name]().then(m => ({ default: m[name] })).catch(err => {
    // Après un déploiement, une page restée ouverte peut réclamer un ancien fichier qui
    // n'existe plus : on recharge une fois pour récupérer la nouvelle version.
    try {
      if (!sessionStorage.getItem("reloadedForChunk")) {
        sessionStorage.setItem("reloadedForChunk", "1");
        window.location.reload();
        return new Promise(() => {});
      }
    } catch {}
    throw err;
  }));
}
const ViewChronicle = lazyView("ViewChronicle");
const ViewCodex     = lazyView("ViewCodex");
const ViewLists     = lazyView("ViewLists");
const ViewInventory = lazyView("ViewInventory");
const ViewParade    = lazyView("ViewParade");
const ViewShame     = lazyView("ViewShame");
const ViewStats     = lazyView("ViewStats");
const ViewWishlist  = lazyView("ViewWishlist");
const ViewFallback = () => <div style={{ padding:"60px 20px", textAlign:"center", color:"#746246", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"3px" }}>✠</div>;

// Fond de chaque onglet (la Parade partage celui de la Wishlist ; l'Accueil a le sien)
const FOND_OF_VIEW = { inventory:"inventory", shame:"shame", lists:"lists", stats:"stats", wishlist:"wishlist", parade:"wishlist", codex:"codex" };

export function App() {
  const [appState, setAppState] = useState({ inventory:[], lists:[], ptsMap:{}, wishlist:[], paintWishlist:[], paintCatalog:[], parade:[], printList:[], homeBackground:null, listNames:{}, listGoals:{}, firstOpenAt: localDay() });
  const [lightCeremony, setLightCeremony] = useState(null);   // cérémonie courte d'une figurine peinte (hors colosses)
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false); // la base locale n'a pas pu être lue
  const [askConfirm, confirmModal] = useConfirm();
  const [splashDone, setSplashDone] = useState(() => {
    // Show splash max 3 times
    try {
      const n = parseInt(localStorage.getItem("wh40k-splash-count")||"0");
      return n >= 3;
    } catch { return false; }
  });
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [idleCit, setIdleCit] = useState(0);
  // Diaporama : un nouveau mélange à chaque mise en veille (voir le rendu du Mode Serviteur)
  const [idleSeed, setIdleSeed] = useState(1);
  const idleStartRef = useRef(0);      // valeur du compteur au début de la veille
  const lastSlideRef = useRef(null);   // dernière photo montrée (pour ne pas recommencer par elle)

  const [idleClock, setIdleClock] = useState(() => new Date());
  const [activeView, setActiveView] = useState(() => {
    try {
      const v = new URLSearchParams(window.location.search).get("view");
      if (v && ["home","lists","inventory","wishlist","parade","shame","stats","codex"].includes(v)) return v;
    } catch {}
    return "home";
  });

  const [lastSaved, setLastSaved] = useState(null); // timestamp
  const [inventoryFocus, setInventoryFocus] = useState(null); // { faction, itemId } — pour ouvrir directement une figurine depuis SHAME
  const [lastExport, setLastExport] = useState(() => { try { const v = localStorage.getItem("lastExport"); return v ? new Date(v).getTime() : null; } catch { return null; } });
  const [promotion, setPromotion] = useState(null); // { faction, from, to }
  const [burst, setBurst] = useState(null);         // gerbe d'or en cours : { key, big }
  const [colossus, setColossus] = useState(null);   // cérémonie de consécration d'un colosse en cours
  const pendingPromoRef = useRef(null);             // promotion à annoncer après la cérémonie
  const [oathDone, setOathDone] = useState(null);   // cérémonie « Serment tenu » en cours
  const pendingOathRef = useRef(null);              // serment tenu à annoncer après la cérémonie d'un colosse
  const [trophyQueue, setTrophyQueue] = useState([]);   // trophées tout juste débloqués, en attente d'annonce
  const [trophyShown, setTrophyShown] = useState(null); // cérémonie d'un trophée en cours
  const [saveBadge, setSaveBadge] = useState(false);
  const saveBadgeT = useRef(null);
  const [saveAnim, setSaveAnim] = useState(false);   // flash animation

  // Réglage « Sons d'interface » (menu du bouton son), actif par défaut
  // Un seul interrupteur (bouton du son, en bas à droite) : sons d'interface et vibrations
  // suivent la musique — actifs quand le son est activé, coupés sinon.
  const soundOn = !!appState.ambient?.on && !appState.ambient?.mute;
  useEffect(() => { setSfxEnabled(soundOn); setHapticsEnabled(soundOn); }, [soundOn]);

  // ── Mode Serviteur : veille après 2 min d'inactivité ──
  useEffect(() => {
    let timer = null;
    const reset = () => {
      setIdle(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { setIdleSeed(Math.floor(Math.random() * 1e9) + 1); setIdle(true); }, 120000);
    };
    const evts = ["pointerdown","keydown","wheel","touchstart"];
    evts.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { if (timer) clearTimeout(timer); evts.forEach(e => window.removeEventListener(e, reset)); };
  }, []);

  // Horloge + rotation des citations en veille
  useEffect(() => {
    if (!idle) return;
    setIdleClock(new Date());
    const clock = setInterval(() => setIdleClock(new Date()), 10000);
    const cits = setInterval(() => setIdleCit(c => c + 1), 12000);
    return () => { clearInterval(clock); clearInterval(cits); };
  }, [idle]);


  useEffect(() => {
    loadApp().then(saved => {
      if (saved) {
        // Anciens identifiants d'unités en double → identifiant conservé (voir data/units.jsx).
        // Copie superficielle : la suite modifie « saved » directement.
        saved = { ...migrateUnitIds(saved) };
        // Reliques dont l'unité n'existe plus dans UNITS_DB (unité renommée ou retirée par une
        // mise à jour) : elles ne sont PAS supprimées. Elles sont mises de côté, avec leurs
        // photos, dans « orphanInventory » (enregistré et sauvegardé comme le reste), et
        // reviennent d'elles-mêmes dans la collection dès que l'unité existe de nouveau.
        {
          const known = (i) => !!(i && UNITS_DB[i.faction]?.some(u => u.id === i.unitId));
          const before = (saved.orphanInventory || []).length;
          const inInv = new Set((saved.inventory || []).map(i => i && i.id));
          // (une relique déjà revenue dans la collection n'est pas reprise une seconde fois)
          const everything = [...(saved.inventory || []), ...(saved.orphanInventory || []).filter(o => o && !inInv.has(o.id))];
          saved.inventory = everything.filter(known);
          const aside = everything.filter(i => i && !known(i));
          // La liste reste présente même vide (plutôt que retirée) : c'est ce qui permet à un
          // autre appareil, via Drive, de savoir qu'une relique a été rattachée ou supprimée.
          if (aside.length || saved.orphanInventory) saved.orphanInventory = aside;
          if (aside.length > before) {
            const n = aside.length - before;
            setTimeout(() => notify(`${n} relique${n > 1 ? "s" : ""} mise${n > 1 ? "s" : ""} de côté : unité inconnue de cette version de l'app.\nRien n'est effacé. Ouvre le CODEX pour ${n > 1 ? "les" : "la"} rattacher à une unité.`, { sticky:true }), 1500);
          }
        }
        // Nettoyage de l'historique de peinture : retirer les entrées dont la figurine
        // n'est plus "Peint" aujourd'hui (accidents de cyclage de statut)
        if (saved.paintHistory && saved.inventory) {
          const paintedIds = new Set([...saved.inventory, ...(saved.orphanInventory || [])].filter(i => i.paintStatus === "painted").map(i => i.id));
          saved.paintHistory = saved.paintHistory.filter(h => paintedIds.has(h.id));
          // Recaler lastPaintAt sur la dernière peinture réelle restante
          const days = saved.paintHistory.map(h => h.day).filter(Boolean).sort();
          if (days.length) saved.lastPaintAt = days[days.length - 1];
          else if (!paintedIds.size) saved.lastPaintAt = null;
        }
        // Marqueur de première utilisation, pour les fonctionnalités qui ne doivent
        // apparaître qu'après un certain temps d'usage (ex: le Tarot du Reliquaire).
        // Un utilisateur déjà en cours d'utilisation (qui a des données mais pas encore
        // ce marqueur, ajouté après coup) ne doit pas se retrouver bloqué comme un
        // nouvel arrivant : on le date sur son activité la plus ancienne connue.
        if (!saved.firstOpenAt) {
          const oldestDay = (saved.paintHistory||[]).map(h=>h.day||(h.date?h.date+"-01":null)).filter(Boolean).sort()[0];
          const oldestPurchase = (saved.inventory||[]).map(i=>i.purchasedAt).filter(Boolean).sort()[0];
          saved.firstOpenAt = oldestDay || oldestPurchase || localDay(new Date(Date.now() - 30*86400000));
        }
        setAppState({ inventory:[], lists:[], ptsMap:{}, wishlist:[], paintWishlist:[], paintCatalog:[], parade:[], ...saved });
      }
      setLoaded(true);
    }).catch(e => {
      // Lecture impossible : on n'ouvre PAS l'app sur une collection vide (la première
      // modification l'aurait enregistrée par-dessus la vraie). Écran d'erreur, voir plus bas.
      console.error(e);
      setLoadError(true);
    });
  }, []);

  const saveErrWarned = useRef(false);
  const persist = useCallback((s) => {
    setSaveAnim(true);
    // Le badge « Sauvegardé » ne s'affiche que quelques secondes après chaque enregistrement
    setSaveBadge(true);
    clearTimeout(saveBadgeT.current);
    saveBadgeT.current = setTimeout(() => setSaveBadge(false), 3500);
    saveApp(s).then(ok => {
      if (ok) {
        saveErrWarned.current = false;
        setLastSaved(Date.now());
        try { localStorage.setItem("lastLocalSave", new Date().toISOString()); } catch {}
      } else if (!saveErrWarned.current) {
        // Prévenir une seule fois (pas à chaque modification), jusqu'à la prochaine réussite
        saveErrWarned.current = true;
        notify("La sauvegarde sur cet appareil a échoué (espace de stockage plein ?).\nTes dernières modifications risquent d'être perdues : fais un export depuis le CODEX.", { sticky:true });
      }
    });
    setTimeout(() => setSaveAnim(false), 800);
  }, []);

  // Demande au navigateur de ne jamais effacer les données de l'app pour libérer de la place
  // (sans ça, Android peut vider IndexedDB — photos comprises — quand le téléphone est plein).
  useEffect(() => { try { navigator.storage?.persist?.().catch(() => {}); } catch {} }, []);

  // Human-readable "il y a X" label, refreshed every 30s
  const [, forceRender] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceRender(n => n+1), 30000);
    return () => clearInterval(t);
  }, []);
  const savedLabel = (() => {
    if (!lastSaved) return null;
    const sec = Math.floor((Date.now() - lastSaved) / 1000);
    if (sec < 10)  return "à l'instant";
    if (sec < 60)  return `il y a ${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60)  return `il y a ${min} min`;
    return `il y a ${Math.floor(min/60)}h`;
  })();

  // Google Drive (voir hooks/useDriveSync.jsx)
  const { driveStatus, driveConnect, driveDisconnect, driveSaveDebounced } = useDriveSync({ loaded, appState, setAppState, persist, askConfirm });

  const updateApp = useCallback((fn) => { setAppState(prev => { const next=fn(prev); persist(next); driveSaveDebounced(next); return next; }); }, [persist, driveSaveDebounced]);

  // Allègement unique des photos stockées en pleine résolution par l'ancienne mission photo
  // (plusieurs Mo chacune). Elles gonflaient chaque sauvegarde au point de faire planter l'app
  // sur téléphone lors d'ajouts successifs. On les réduit comme toutes les autres (600 px).
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      const big = (appState.inventory || []).filter(i => typeof i.photo === "string" && i.photo.length > 400000);
      if (!big.length) return;
      const out = {}; let before = 0, after = 0;
      for (const it of big) {
        if (cancelled) return;
        const small = await compressPhoto(it.photo, 600, 0.75);
        if (small && small.length < it.photo.length) { out[it.id] = small; before += it.photo.length; after += small.length; }
        await new Promise(r => setTimeout(r, 30)); // laisse respirer l'interface entre deux photos
      }
      if (cancelled || !Object.keys(out).length) return;
      updateApp(s => ({ ...s, inventory: s.inventory.map(i => (out[i.id] && i.photo && i.photo.length > 400000) ? { ...i, photo: out[i.id] } : i) }));
      const n = Object.keys(out).length;
      notify(`${n} photo${n > 1 ? "s" : ""} allégée${n > 1 ? "s" : ""} : ${Math.max(1, Math.round((before - after) * 0.75 / 1048576))} Mo libérés sur ce téléphone.`);
    })();
    return () => { cancelled = true; };
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Préchargement des onglets en arrière-plan, une fois l'app ouverte
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      Promise.all(Object.values(VIEW_LOADERS).map(l => l()))
        .then(() => { try { sessionStorage.removeItem("reloadedForChunk"); } catch {} })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [loaded]);

  // Jugement oublié : au premier lancement de la nouvelle année, l'année écoulée est scellée
  // avec l'état actuel (quelques jours d'écart au plus) plutôt que perdue pour toujours.
  useEffect(() => {
    if (!loaded) return;
    const inv = appState.inventory || [];
    const figs = (i) => getModelCount(findUnit(i.faction, i.unitId)?.name, i.qty||1, i.modelCount);
    const total = inv.reduce((s,i)=>s+figs(i),0);
    if (!total) return;
    const painted = inv.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+figs(i),0);
    const y = new Date().getFullYear() - 1;
    const started = appState.firstOpenAt && Number(String(appState.firstOpenAt).slice(0,4)) <= y;
    if (!started || (appState.judgments||[]).some(j => j.year === y)) return;
    updateApp(s => ({ ...s, judgments: [...(s.judgments||[]).filter(j=>j.year!==y), { year:y, pct: Math.round(painted/total*100), painted, total, sealedAt: new Date().toISOString(), auto:true }] }));
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set pts for a unit (stored in ptsMap keyed by "faction:unitId")
  const handleSetPts = useCallback((unitId, faction, pts) => {
    updateApp(s => ({ ...s, ptsMap:{ ...s.ptsMap, [`${faction}:${unitId}`]: pts } }));
  }, [updateApp]);

  // ── Sauvegarde / Restauration ──────────────────────────────
  // Un seul fichier .zip contient tout (collection, réglages, Parade, photos).
  // La restauration accepte ce fichier ET tous les anciens formats de l'app.
  const downloadBackup = () => {
    try {
      const { blob, name, photos } = buildBackup(appState);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      try { localStorage.setItem("lastExport", new Date().toISOString()); } catch {}
      setLastExport(Date.now());
      notify(`Sauvegarde complète téléchargée : ${appState.inventory.length} entrées, ${photos} photo${photos > 1 ? "s" : ""}, ${(blob.size / 1048576).toFixed(1).replace(".", ",")} Mo.`);
    } catch (e) { console.error(e); notify("La sauvegarde n'a pas pu être créée.", { sticky:true }); }
  };

  const restoreBackup = async (file) => {
    let res;
    try { res = await readBackup(file); }
    catch { notify("Ce fichier n'est pas une sauvegarde du Reliquaire.", { sticky:true }); return; }

    if (res.kind === "full") {
      const p = migrateUnitIds(res.state); // une sauvegarde ancienne peut contenir d'anciens identifiants
      const next = { ...p, inventory: p.inventory || [], lists: p.lists || [], wishlist: p.wishlist || [], paintWishlist: p.paintWishlist || [],
        paintCatalog: p.paintCatalog || [], parade: p.parade || [], ptsMap: p.ptsMap || {} };
      const nPhotos = next.inventory.filter(i => i.photo).length + next.parade.filter(x => x.photo).length;
      askConfirm(
        `Restaurer cette sauvegarde (${next.inventory.length} entrées, ${nPhotos} photos) ? Elle remplacera toutes les données actuelles de cet appareil.`,
        () => {
          updateApp(() => next); // enregistrée sur le téléphone ET envoyée sur Drive
          setActiveView("inventory"); setSplashDone(true);
          notify(res.missing ? `Sauvegarde restaurée (${res.missing} photo${res.missing>1?"s":""} manquante${res.missing>1?"s":""} dans le fichier).` : "Sauvegarde restaurée.");
        }, "#b8922a", "RESTAURER", false);
    } else if (res.kind === "photos") {
      // Ancien fichier « photos par faction » : on remet les photos sur les reliques correspondantes
      const byId = new Map(res.photos.filter(x => x.photo).map(x => [x.id, x.photo]));
      const matches = appState.inventory.filter(i => byId.has(i.id)).length;
      if (!matches) { notify("Aucune relique de ce fichier ne correspond à ta collection actuelle.", { sticky:true }); return; }
      askConfirm(`Remettre ${matches} photo${matches>1?"s":""} (${FACTIONS[res.faction]?.label || res.faction || "ancien fichier"}) sur tes reliques ?`, async () => {
        const out = {};
        for (const [id, ph] of byId) { out[id] = await compressPhoto(ph, 600, 0.75) || ph; }
        updateApp(s => ({ ...s, inventory: s.inventory.map(i => out[i.id] ? { ...i, photo: out[i.id] } : i) }));
        notify(`${matches} photo${matches>1?"s":""} restaurée${matches>1?"s":""}.`);
      }, "#b8922a", "RESTAURER", false);
    } else if (res.kind === "parade") {
      // Ancien fichier « photos Parade » : on ajoute celles qui manquent
      const have = new Set((appState.parade||[]).map(x => x.id));
      const add = res.items.filter(x => x && !have.has(x.id));
      if (!add.length) { notify("Toutes ces photos sont déjà dans ta Parade."); return; }
      askConfirm(`Ajouter ${add.length} photo${add.length>1?"s":""} à la Parade ?`, () => {
        updateApp(s => ({ ...s, parade: [...(s.parade||[]), ...add] }));
        notify("Photos ajoutées à la Parade.");
      }, "#b8922a", "AJOUTER", false);
    }
  };

  // Reliques mises de côté (unité inconnue) : rattachement à une unité existante, ou suppression
  const reassignOrphan = (id, faction, unitId) => {
    const u = findUnit(faction, unitId);
    if (!u) return;
    updateApp(s => {
      const it = (s.orphanInventory || []).find(o => o.id === id);
      if (!it) return s;
      return { ...s, inventory: [...s.inventory, { ...it, faction, unitId }], orphanInventory: s.orphanInventory.filter(o => o.id !== id) };
    });
    notify(`Relique rattachée à « ${u.name} » : elle est de retour dans ta collection.`);
  };
  const deleteOrphan = id => askConfirm("Supprimer définitivement cette relique mise de côté, avec sa photo ?",
    () => updateApp(s => ({ ...s, orphanInventory: (s.orphanInventory || []).filter(o => o.id !== id) })), "#b8922a", "SUPPRIMER", true);

  const addInventory  = entry => updateApp(s => ({
    ...s, inventory:[...s.inventory,{id:uid(),...entry}]
  }));
  // La confirmation est demandée par la fiche de la relique (message plus précis) : pas une deuxième ici
  // Supprimer une relique libère aussi l'ordre du Dé et le serment qui la visaient (sinon ils resteraient bloqués)
  const deleteInventory = id => updateApp(s => ({ ...s, inventory:s.inventory.filter(i=>i.id!==id),
    ...(s.fateChoice?.id === id ? { fateChoice: null } : {}),
    ...(s.oath?.unitId === id ? { oath: null } : {}) }));
  const updatePhoto     = (id,photo) => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,photo}:i) }));
  // Données de la cérémonie d'un colosse (pour une consécration, ou pour la revoir depuis sa fiche)
  const buildColossusData = (item, inv, history) => {
    const u = findUnit(item.faction, item.unitId);
    const pm = appState.ptsMap || {};
    const f = FACTIONS[item.faction] || {};
    const firstDay = {};
    history.forEach(h => { const d = h.day || (h.date ? h.date + "-15" : ""); if (d && (!firstDay[h.id] || d < firstDay[h.id])) firstDay[h.id] = d; });
    const painted = inv.filter(i => i.paintStatus === "painted" && isColossus(i, pm)).sort((a,b) => (firstDay[a.id]||"9").localeCompare(firstDay[b.id]||"9"));
    const pos = painted.findIndex(i => i.id === item.id);
    return {
      name: item.nickname || u?.name || "Colosse", unitName: u?.name || "Colosse",
      armyLabel: appState.listNames?.[item.faction] || f.label || "", faction: item.faction, accent: f.accent, icon: f.icon,
      pts: (pm[`${item.faction}:${item.unitId}`] || (u ? POINTS_DB[u.name] : 0) || 0) * (item.qty || 1),
      photo: item.photo || null, index: pos >= 0 ? pos + 1 : painted.length + 1,
      honors: (computeHonors(inv, history, pm).get(item.id) || []).map(h => h.label),
    };
  };
  const replayCeremony = (id) => {
    const item = appState.inventory.find(i => i.id === id); if (!item) return;
    setColossus(buildColossusData(item, appState.inventory, appState.paintHistory || []));
  };
  const updateColosse = (id, value) => updateApp(s => ({ ...s, inventory: s.inventory.map(i => i.id === id ? { ...i, colosse: value } : i) }));
  const showPromotion = (p) => setTimeout(() => { setPromotion(p); playSfx("celebration", 0.8, "promotion"); setBurst({ key: Date.now(), big: true }); }, 400);
  const closeCeremony = () => {
    setColossus(null); setLightCeremony(null);
    const o = pendingOathRef.current; pendingOathRef.current = null;
    if (o) { setTimeout(() => setOathDone(o), 400); return; }   // la promotion suivra le serment
    const p = pendingPromoRef.current; pendingPromoRef.current = null;
    if (p) showPromotion(p);
  };
  // ── Trophées : annoncés par une courte cérémonie au moment où ils se débloquent ──
  // « trophiesSeen » (enregistré avec le reste) garde les trophées déjà annoncés. À la première
  // ouverture après cette mise à jour, ou après une sauvegarde restaurée qui ne le contient pas,
  // il est rempli en silence : pas de cérémonies en rafale pour des trophées obtenus avant.
  useEffect(() => {
    if (!loaded) return;
    const all = computeTrophies({ inventory: appState.inventory || [], paintHistory: appState.paintHistory || [], ptsMap: appState.ptsMap || {}, appState });
    const got = all.filter(b => b.got);
    const seen = appState.trophiesSeen;
    if (!Array.isArray(seen)) { updateApp(s => Array.isArray(s.trophiesSeen) ? s : ({ ...s, trophiesSeen: got.map(b => b.name) })); return; }
    const fresh = got.filter(b => !seen.includes(b.name));
    if (!fresh.length) return;
    updateApp(s => ({ ...s, trophiesSeen: [...new Set([...(s.trophiesSeen || []), ...fresh.map(b => b.name)])] }));
    setTrophyQueue(q => [...q, ...fresh.filter(b => !q.some(x => x.name === b.name)).map(b => ({ icon: b.icon, name: b.name, desc: b.desc, count: got.length, total: all.length }))]);
  }, [loaded, appState]);
  // Un trophée ne s'annonce que lorsque tout le reste est clos (consécration, serment, promotion),
  // après un court silence.
  const ceremoniesQuiet = loaded && splashDone && !idle && !colossus && !lightCeremony && !oathDone && !promotion;
  useEffect(() => {
    if (trophyShown || !trophyQueue.length || !ceremoniesQuiet) return;
    const tm = setTimeout(() => {
      if (pendingOathRef.current || pendingPromoRef.current) return;   // un serment ou une promotion arrive : ils passent d'abord
      setTrophyShown({ ...trophyQueue[0], more: trophyQueue.length - 1 });
      setTrophyQueue(q => q.slice(1));
    }, 1200);
    return () => clearTimeout(tm);
  }, [ceremoniesQuiet, trophyQueue, trophyShown]);

  const closeOathCeremony = () => {
    setOathDone(null);
    const p = pendingPromoRef.current; pendingPromoRef.current = null;
    if (p) showPromotion(p);
  };

  const updatePaint     = (id,status) => {
    // Période d'enrôlement (7 premiers jours) : on saisit sa collection, rien ne compte encore.
    // Le statut change, mais sans cérémonie, sans historique de peinture (donc ni trophée,
    // ni record, ni Chronique), sans promotion et sans effet sur le serment.
    if (enrolDaysLeft(appState) > 0) {
      updateApp(s => ({ ...s, inventory: s.inventory.map(i => i.id === id ? { ...i, paintStatus: status, paintedAt: null } : i),
        paintHistory: (s.paintHistory || []).filter(h => h.id !== id) }));
      return;
    }
    if (status==="painted") {
      // Célébration (la vibration part avec le son, voir playSfx plus bas)
      const item = appState.inventory.find(i=>i.id===id);
      const u = item ? findUnit(item.faction, item.unitId) : null;
      const pm = appState.ptsMap || {};
      const pts = item ? ((pm[`${item.faction}:${item.unitId}`] || (u?POINTS_DB[u.name]:0) || 0) * (item.qty||1)) : 0;
      // Un colosse a droit à sa cérémonie complète (environ une minute et demie) ; les autres à la cérémonie courte (30 s)
      const colossal = item && item.paintStatus !== "painted" && isColossus(item, pm);
      // Serment tenu ? (figurine précise ; ou, pour un ancien serment chiffré, total atteint)
      const oath = appState.oath;
      let oathHit = false;
      if (item && item.paintStatus !== "painted" && oath) {
        if (oath.unitId) oathHit = oath.unitId === id;
        else {
          const since = (appState.paintHistory||[]).filter(h => (h.day || (h.date ? h.date+"-01" : "")) >= oath.sworn);
          const prog = since.reduce((acc,h) => { const it = appState.inventory.find(i => i.id === h.id); return acc + (it ? figsOfItem(it) : 0); }, 0) + figsOfItem(item);
          oathHit = prog >= (oath.target || 1);
        }
      }
      if (oathHit) {
        const n = (appState.oathRecord?.kept || 0) + 1;
        const tier = OATH_TIERS.find(tr => tr.n === n)?.label || null;
        const o = { name: nameOfItem(item), formula: oath.label || oathFormula(item), n, tier };
        pendingOathRef.current = o;   // annoncé à la fermeture de la cérémonie (courte ou complète)
      }
      if (colossal) {
        const inv = appState.inventory.map(i => i.id === id ? { ...i, paintStatus:"painted" } : i);
        setColossus(buildColossusData({ ...item, paintStatus:"painted" }, inv, [...(appState.paintHistory||[]), { id, date: localDay().slice(0,7), day: localDay() }]));
      } else {
      // Cérémonie courte : photo, sceau, nom, points et phrase de la faction (remplace l'ancienne bannière)
      // Gerbe d'or plus ample pour les grosses pièces (Chevaliers, Titans, 250 pts et plus)
      const bigPiece = (u?.role||"").match(/Titan|Chevalier|Seigneur de guerre/i) || ((pm[`${item?.faction}:${item?.unitId}`] || (u?POINTS_DB[u.name]:0) || 0) >= 250);
      const f = FACTIONS[item?.faction] || {};
      setLightCeremony({ key: Date.now(), name: item?.nickname || u?.name || "Unité", unitName: u?.name || "Unité", pts, photo: item?.photo || null,
        armyLabel: appState.listNames?.[item?.faction] || f.label || "", faction: item?.faction, accent: f.accent, icon: f.icon, lore: celebrationLoreFor(item?.faction), big: !!bigPiece,
        rank: item ? appState.inventory.filter(i => i.faction === item.faction && i.paintStatus === "painted" && i.id !== item.id).length + 1 : 0 });
      // Le son et la vibration partent avec le sceau, dans la cérémonie
      }
      // Cérémonie de promotion : cette peinture fait-elle monter l'armée d'un rang ?
      if (item && item.paintStatus !== "painted") {
        const ptsOfIt = (i) => { const uu = findUnit(i.faction, i.unitId); return (pm[`${i.faction}:${i.unitId}`] || (uu?POINTS_DB[uu.name]:0) || 0) * (i.qty||1); };
        const before = appState.inventory.filter(i => i.faction===item.faction && i.paintStatus==="painted").reduce((acc,i)=>acc+ptsOfIt(i),0);
        const from = factionTitle(item.faction, before), to = factionTitle(item.faction, before + pts);
        if (from !== to) {
          // Consignée pour le Livre de la Croisade, puis annoncée juste après la célébration
          updateApp(s => ({ ...s, promotions: [...(s.promotions||[]), { faction:item.faction, from, to, day: localDay() }] }));
          pendingPromoRef.current = { faction:item.faction, from, to }; // annoncée après la cérémonie (et après le serment)
        }
      }
    }
    updateApp(s => {
      const leavingPainted = status !== "painted";
      const newHistory = status === "painted"
        ? [...(s.paintHistory||[]), { id, date: localDay().slice(0,7), day: localDay() }]
        : (s.paintHistory||[]).filter(h => h.id !== id);
      // Recaler lastPaintAt sur la dernière entrée réelle restante
      let newLastPaint;
      if (status === "painted") {
        newLastPaint = localDay();
      } else {
        const days = newHistory.map(h => h.day).filter(Boolean).sort();
        newLastPaint = days.length ? days[days.length - 1] : null;
      }
      const newInventory = s.inventory.map(i => i.id===id ? {
        ...i, paintStatus:status,
        // Titre « Élu du Destin » : peinte alors que le Dé du Destin l'avait désignée
        ...(status==="painted" && s.fateChoice?.id === id ? { fateChosen:true } : {}),
        paintedAt: status==="painted" ? localDay().slice(0,7) : (leavingPainted ? null : i.paintedAt)
      } : i);
      // Le serment se valide désormais par l'ACTE de peindre la bonne figurine,
      // pas par un bouton séparé à cliquer (qui pouvait se déclencher par erreur).
      let newOath = s.oath, newOathRecord = s.oathRecord, oathKeptEntry = null;
      if (status === "painted" && s.oath) {
        const oath = s.oath;
        let fulfilled;
        if (oath.unitId) {
          // Vœu verrouillé sur UNE figurine précise : uniquement si c'est elle qu'on vient de peindre.
          fulfilled = (oath.unitId === id);
        } else {
          // Vœu générique (nombre de figurines) : recalcule la progression avec cette nouvelle entrée incluse.
          const prog = newHistory.reduce((acc,h) => {
            const when = h.day || (h.date ? h.date+"-01" : null);
            if (!when || when < oath.sworn) return acc;
            const it = newInventory.find(i => i.id === h.id);
            if (!it) return acc;
            const u = findUnit(it.faction, it.unitId);
            return acc + getModelCount(u?.name, it.qty||1, it.modelCount);
          }, 0);
          fulfilled = prog >= oath.target;
        }
        if (fulfilled) {
          newOath = null;
          newOathRecord = { ...(s.oathRecord||{}), kept: (s.oathRecord?.kept||0)+1 };
          oathKeptEntry = { day: localDay(), itemId: id, text: oath.label || null };
        }
      }
      const finalInventory = oathKeptEntry ? newInventory.map(i => i.id === id ? { ...i, oathKept: true } : i) : newInventory;
      return {
        ...s,
        inventory: finalInventory,
        paintHistory: newHistory,
        lastPaintAt: newLastPaint,
        oath: newOath,
        oathRecord: newOathRecord,
        ...(oathKeptEntry ? { oathsKept: [...(s.oathsKept||[]), oathKeptEntry] } : {})
      };
    });
  };
  const updateQty        = (id,qty)    => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,qty:Math.max(1,qty)}:i) }));
  const updateModelCount = (id,count) => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,modelCount:count>0?count:null}:i) }));
  // Scinder une entrée : détache n figurines dans une nouvelle cartouche
  const splitInventory = (id, n, newStatus) => updateApp(s => {
    const item = s.inventory.find(i => i.id === id);
    if (!item) return s;
    const u = findUnit(item.faction, item.unitId);
    const total = getModelCount(u?.name, item.qty||1, item.modelCount);
    if (!(n >= 1 && n < total)) return s;
    const newId = uid();
    const detached = { ...item, id: newId, qty: 1, modelCount: n, paintStatus: newStatus, photo: null, nickname: null, note: null,
      paintedAt: newStatus === "painted" ? (item.paintedAt || localDay().slice(0,7)) : null };
    const inv = s.inventory.map(i => i.id === id ? { ...i, qty: 1, modelCount: total - n } : i).concat([detached]);
    // Historique : donner une entrée à la partie détachée si elle est peinte
    let hist = s.paintHistory || [];
    if (newStatus === "painted") {
      const src = hist.find(h => h.id === id);
      hist = [...hist, { id: newId, date: src?.date || localDay().slice(0,7), day: src?.day || localDay() }];
    }
    return { ...s, inventory: inv, paintHistory: hist };
  });
  const updateNote       = (id,note) => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,note}:i) }));
  const setRecipe        = (id,recipe) => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,recipe}:i) }));
  const updateNickname   = (id,nick) => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,nickname:nick||null}:i) }));
  const updatePurchased  = (id,d)    => updateApp(s => ({ ...s, inventory:s.inventory.map(i=>i.id===id?{...i,purchasedAt:d||null}:i) }));
  const setHomeBackground = (photo)  => updateApp(s => ({ ...s, homeBackground:photo }));
  const setAmbientPrefs = (patch) => updateApp(s => ({ ...s, ambient:{ ...(s.ambient||{}), ...patch } }));
  const setBlessing = (day) => updateApp(s => ({ ...s, lastBlessing:day }));
  const setBackupDismiss = (day) => updateApp(s => ({ ...s, lastBackupDismiss:day }));
  const setFateChoice = (info) => updateApp(s => ({ ...s, fateChoice: info }));
  const setFateRollDay = (day) => updateApp(s => ({ ...s, lastFateRollDay: day }));
  const setTarotWeek = (weekKey) => updateApp(s => ({ ...s, lastTarotWeek: weekKey }));
  // Mission du jour accomplie : série, compteur, mémo de la dernière mission
  const completeMission = (day, info) => updateApp(s => {
    if (s.lastMissionDay === day) return { ...s, lastBlessing:day, missionLast: info };
    // Enrôlement : la mission est faite, mais ne compte ni pour la série ni pour les trophées
    if (enrolDaysLeft(s) > 0) return { ...s, lastBlessing: day, lastMissionDay: day, missionLast: info };
    const yest = localDay(new Date(new Date(day+"T12:00:00").getTime() - 86400000));
    const streak = s.lastMissionDay === yest ? (s.missionStreak||0) + 1 : 1;
    return {
      ...s,
      lastBlessing: day,
      lastMissionDay: day,
      missionStreak: streak,
      missionBest: Math.max(s.missionBest||0, streak),
      missionTotal: (s.missionTotal||0) + 1,
      missionLast: info,
    };
  });
  const setCrusade = (crusade) => updateApp(s => ({ ...s, crusade }));
  const setShameLaw = (off) => updateApp(s => ({ ...s, shameLawOff: off }));
  const swearOath = (target, deadline, label=null, unitId=null) => updateApp(s => ({ ...s, oath: { target, deadline, sworn: localDay(), startCount: homeTotalPainted, label, unitId } }));
  const sealJudgment = () => {
    const year = new Date().getFullYear();
    updateApp(s => ({ ...s, judgments: [...(s.judgments||[]).filter(j=>j.year!==year), { year, pct: globalPaintPct, painted: homeTotalPainted, total: homeTotalModels, sealedAt: new Date().toISOString() }] }));
  };
  const setCrusadeStart = (date) => updateApp(s => ({ ...s, crusadeStart: date || null }));
  const swearOathOn = (itemId) => updateApp(s => {
    const it = s.inventory.find(i => i.id === itemId); if (!it) return s;
    return { ...s, oath: { unitId: itemId, label: oathFormula(it), sworn: localDay(), litAt: localDay(), candleDays: candleDaysFor(it, s.ptsMap || {}), target: figsOfItem(it) } };
  });
  const relightOath = () => updateApp(s => s.oath ? ({ ...s, oath: { ...s.oath, litAt: localDay(), candleDays: s.oath.candleDays || 30 } }) : s);
  const releaseOath = () => updateApp(s => ({ ...s, oath: null, oathRecord: { ...(s.oathRecord||{}), released: (s.oathRecord?.released||0) + 1 } }));
  // Ancien serment chiffré (avant la refonte) déjà accompli : consigné avec sa cérémonie
  const keepLegacyOath = () => {
    const oath = appState.oath; if (!oath) return;
    const n = (appState.oathRecord?.kept || 0) + 1;
    setOathDone({ name: "ta Croisade", formula: oath.label || "Serment de Croisade", n, tier: OATH_TIERS.find(tr => tr.n === n)?.label || null });
    updateApp(s => ({ ...s, oath: null, oathRecord: { ...(s.oathRecord||{}), kept: (s.oathRecord?.kept||0) + 1 }, oathsKept: [...(s.oathsKept||[]), { day: localDay(), itemId: null, text: oath.label || null }] }));
  };
  const burnParchments = () => updateApp(s => ({ ...s, oathBurnDay: localDay() }));
  const resolveOath = (kept) => updateApp(s => ({ ...s, oath: null, oathRecord: { kept: (s.oathRecord?.kept||0) + (kept?1:0), broken: (s.oathRecord?.broken||0) + (kept?0:1) } }));
  const setListName = (faction, name) => updateApp(s => ({ ...s, listNames:{ ...(s.listNames||{}), [faction]:name } }));
  const setListGoal = (faction, goal) => updateApp(s => ({ ...s, listGoals:{ ...(s.listGoals||{}), [faction]:goal } }));
  // Reorder: move draggedId to position of targetId within same faction
  const reorderInventory = (draggedId, targetId, faction) => updateApp(s => {
    const inv = [...s.inventory];
    const dragIdx  = inv.findIndex(i=>i.id==draggedId);
    const targetIdx = inv.findIndex(i=>i.id==targetId);
    if (dragIdx<0||targetIdx<0) return s;
    const [moved] = inv.splice(dragIdx,1);
    inv.splice(targetIdx,0,moved);
    return { ...s, inventory: inv };
  });
  const addWish       = entry    => updateApp(s => ({ ...s, wishlist:[...(s.wishlist||[]),entry] }));
  const addPrint      = item => updateApp(s => ({ ...s, printList:[...(s.printList||[]),{id:uid(),...item}] }));
  const deletePrint   = id   => updateApp(s => ({ ...s, printList:(s.printList||[]).filter(i=>i.id!==id) }));
  const updatePrint   = (id,fields) => updateApp(s => ({ ...s, printList:(s.printList||[]).map(i=>i.id===id?{...i,...fields}:i) }));
  const deleteWish    = id       => askConfirm("Retirer de la wishlist ?", () => updateApp(s => ({ ...s, wishlist:(s.wishlist||[]).filter(i=>i.id!==id) })), "#b8922a", "RETIRER", true);
  const setWishStatus = (id,status) => updateApp(s => ({ ...s, wishlist:(s.wishlist||[]).map(i=>i.id===id?{...i,status}:i) }));
  const setWishPrice  = (id,price)  => updateApp(s => ({ ...s, wishlist:(s.wishlist||[]).map(i=>i.id===id?{...i,price}:i) }));
  const addPaintWish    = entry => updateApp(s => ({ ...s, paintWishlist:[...(s.paintWishlist||[]),entry] }));
  // Catalogue de peintures pour les RECETTES uniquement — totalement indépendant de
  // paintWishlist (qui reste une vraie liste "à acheter", jamais touchée par les recettes).
  const addPaintCatalog = entry => updateApp(s => ({ ...s, paintCatalog:[...(s.paintCatalog||[]),entry] }));
  const deletePaintWish = id    => updateApp(s => ({ ...s, paintWishlist:(s.paintWishlist||[]).filter(p=>p.id!==id) }));
  const addParade    = entry => updateApp(s => ({ ...s, parade:[...(s.parade||[]),entry] }));
  // La confirmation est demandée par la Parade elle-même (sinon elle apparaissait deux fois)
  const deleteParade = id    => updateApp(s => {
    const gone = (s.parade||[]).find(p => p.id === id);
    return { ...s, parade:(s.parade||[]).filter(p=>p.id!==id), ...(gone && s.homeBackground && s.homeBackground === gone.photo ? { homeBackground: null } : {}) };
  });

  if (loadError) return (
    <div style={{ background:"#020202", height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'Cinzel',serif", gap:"16px" }}>
      <div style={{ fontSize:"40px", color:"#b8922a" }}>⚠</div>
      <div style={{ color:"#e8dfc0", fontSize:"15px", letterSpacing:"2px", textAlign:"center" }}>LECTURE DU RELIQUAIRE IMPOSSIBLE</div>
      <div style={{ color:"#d8c8ac", fontSize:"14px", fontFamily:"'Crimson Pro',serif", textAlign:"center", maxWidth:"320px", lineHeight:1.6 }}>
        Ta collection n'a pas pu être lue sur cet appareil. Rien n'a été modifié ni effacé.
        Ferme complètement l'app puis rouvre-la, ou touche Réessayer. Si le problème persiste, redémarre le téléphone.
      </div>
      <button onClick={() => window.location.reload()} style={{ background:"#0f0c08", border:"1px solid #b8922a55", color:"#b8922a", padding:"10px 24px", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"3px", cursor:"pointer", marginTop:"8px" }}>RÉESSAYER</button>
    </div>
  );

  if (!loaded) return (
    <div style={{ background:"#020202", height:"100vh", maxWidth:"430px", margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", fontFamily:"'Cinzel',serif" }}>
      {/* Même fond que l'écran d'ouverture qui suit, pour une transition sans rupture */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`url(${import.meta.env.BASE_URL}fonds/ouverture.jpg)`, backgroundSize:"cover", backgroundPosition:"center 38%", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, #02020266 20%, #020202f0 85%)", pointerEvents:"none" }} />
      {/* Content */}
      <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:"0", animation:"splashIn 0.7s ease both" }}>
        <div style={{ marginTop:"20px", textAlign:"center" }}>
          <div className="gold-shine-slow" style={{ fontSize:"26px", letterSpacing:"7px", fontFamily:"'Cinzel Decorative',serif", fontWeight:"900", animation:"bootText 0.8s ease both, goldShimmer 9s linear infinite" }}>RELIQUAIRE</div>
          <div style={{ color:"#756141", fontSize:"11px", letterSpacing:"5px", marginTop:"6px" }}>CODEX PERSONNEL · M42</div>
        </div>
        {/* Ornamental divider */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"20px 0", width:"220px" }}>
          <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,transparent,#b8922a44)" }} />
          <div style={{ color:"#d8c8ac", fontSize:"11.5px" }}>✦</div>
          <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,#b8922a44,transparent)" }} />
        </div>
        {/* Loading pulse */}
        <div style={{ width:"180px", textAlign:"center" }}>
          <div style={{ height:"2px", background:"#100c06", overflow:"hidden", marginBottom:"8px" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#6a5420,#b8922a,#e0c060)", animation:"bootBar 1.1s ease-out both" }} />
          </div>
          <div style={{ color:"#76614a", fontSize:"10px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>CONSULTATION DES ARCHIVES</div>
          <div style={{ color:"#735f50", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"14px", maxWidth:"240px", lineHeight:1.5 }}>{
            ["Bénie soit la main qui tient le pinceau.","Dans la patience, la perfection.","Chaque figurine est une prière.","L'Empereur veille sur les artisans.","Le gris n'est qu'un état transitoire.","La foi guide le pinceau.","Nul ne peint seul sous le regard de l'Empereur.","Que ce jour serve la Croisade."][Math.floor(Math.random()*8)]
          }</div>
        </div>
      </div>
    </div>
  );



  const ptsMap = appState.ptsMap || {};

  // ── Teinte dominante : faction avec le plus de figurines peintes ──
  const [themeAccent, themeAccent2] = (() => {
    const inv = appState.inventory || [];
    if (!inv.length) return ["#b8922a", "#c9a84c"];
    const tally = {};
    inv.filter(i => i.paintStatus === "painted").forEach(i => {
      const u = findUnit(i.faction, i.unitId);
      tally[i.faction] = (tally[i.faction] || 0) + getModelCount(u?.name, i.qty||1, i.modelCount);
    });
    const top = Object.entries(tally).sort((a,b) => b[1]-a[1])[0];
    const f = top ? FACTIONS[top[0]] : null;
    return f ? [f.accent, f.accent2 || f.accent] : ["#b8922a", "#c9a84c"];
  })();
  const homeTotalModels = (appState.inventory||[]).reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
  const homeTotalPainted = (appState.inventory||[]).filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
  const homeTotalPts = (appState.inventory||[]).reduce((s,i) => {
    const u = findUnit(i.faction, i.unitId);
    const key = `${i.faction}:${i.unitId}`;
    return s + (ptsMap[key] != null ? ptsMap[key] : (POINTS_DB[u?.name]||0)) * (i.qty||1);
  }, 0);
  const globalPaintPct = (() => {
    const total = appState.inventory.reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
    const painted = appState.inventory.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
    return total ? Math.round(painted/total*100) : 100;
  })();
  // ── Périmètre de la Loi de l'Achat Interdit ──
  // La Loi juge TOUTE la collection (choix du 14 octobre 2026), pas seulement les achats
  // depuis le Début de Croisade. Pendant l'enrôlement (7 premiers jours), elle dort : on doit
  // pouvoir saisir toute sa pile sans être bloqué.
  const lawStats = (() => {
    if (enrolDaysLeft(appState) > 0) return { pct: 100, unpainted: 0 };
    const figs = (i) => { const u=findUnit(i.faction, i.unitId); return getModelCount(u?.name, i.qty||1, i.modelCount); };
    const items = appState.inventory || [];
    const total = items.reduce((s,i)=>s+figs(i),0);
    const painted = items.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+figs(i),0);
    return { pct: total ? Math.round(painted/total*100) : 100, unpainted: Math.max(0, total - painted) };
  })();
  const shameAlert = globalPaintPct < 80 && appState.inventory.length > 0;
  const exportDue = appState.inventory.length > 0 && (lastExport === null || (Date.now() - lastExport) >= 14*86400000);

  return (
    <div className="vignette-wrap" style={{ background:"#020202", maxWidth:"430px", margin:"0 auto", position:"fixed", top:0, bottom:0, left:0, right:0, display:"flex", flexDirection:"column", overflow:"hidden", "--accent": themeAccent, "--accent2": themeAccent2 }}>
      <style>{`
            @keyframes viewFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
            @keyframes sealStamp { 0% { transform:scale(2.6) rotate(-14deg); opacity:0; } 55% { transform:scale(0.9) rotate(2deg); opacity:1; } 75% { transform:scale(1.07); } 100% { transform:scale(1); } }
            @keyframes beamFlicker { 0% { opacity:0.95; } 100% { opacity:0.7; } }
            @keyframes tabIn { from { opacity:0; transform:translateY(10px); filter:sepia(0.35) brightness(1.25); } to { opacity:1; transform:none; filter:none; } }
            @keyframes tabSweep { from { background-position:120% 0; opacity:1; } to { background-position:-40% 0; opacity:0; } }
            /* Cadres harmonisés : ornements d'angle dorés sur les cartes principales */
            .orn { position:relative; }
            .orn::after { content:""; position:absolute; inset:4px; pointer-events:none; z-index:1; opacity:0.75;
              background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cg%20transform%3D%27rotate%280%208%208%29%27%3E%3Cpath%20d%3D%27M1.5%2015V6.5C1.5%203.7%203.7%201.5%206.5%201.5H15%27%20fill%3D%27none%27%20stroke%3D%27%23c8a050%27%20stroke-width%3D%271.3%27%2F%3E%3Cpath%20d%3D%27M5%205.2l1.4-1.4%201.4%201.4-1.4%201.4z%27%20fill%3D%27%23d4b060%27%2F%3E%3Ccircle%20cx%3D%271.5%27%20cy%3D%2715%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%271.5%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") top left / 15px 15px no-repeat, url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cg%20transform%3D%27rotate%2890%208%208%29%27%3E%3Cpath%20d%3D%27M1.5%2015V6.5C1.5%203.7%203.7%201.5%206.5%201.5H15%27%20fill%3D%27none%27%20stroke%3D%27%23c8a050%27%20stroke-width%3D%271.3%27%2F%3E%3Cpath%20d%3D%27M5%205.2l1.4-1.4%201.4%201.4-1.4%201.4z%27%20fill%3D%27%23d4b060%27%2F%3E%3Ccircle%20cx%3D%271.5%27%20cy%3D%2715%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%271.5%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") top right / 15px 15px no-repeat,
                          url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cg%20transform%3D%27rotate%28270%208%208%29%27%3E%3Cpath%20d%3D%27M1.5%2015V6.5C1.5%203.7%203.7%201.5%206.5%201.5H15%27%20fill%3D%27none%27%20stroke%3D%27%23c8a050%27%20stroke-width%3D%271.3%27%2F%3E%3Cpath%20d%3D%27M5%205.2l1.4-1.4%201.4%201.4-1.4%201.4z%27%20fill%3D%27%23d4b060%27%2F%3E%3Ccircle%20cx%3D%271.5%27%20cy%3D%2715%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%271.5%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") bottom left / 15px 15px no-repeat, url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cg%20transform%3D%27rotate%28180%208%208%29%27%3E%3Cpath%20d%3D%27M1.5%2015V6.5C1.5%203.7%203.7%201.5%206.5%201.5H15%27%20fill%3D%27none%27%20stroke%3D%27%23c8a050%27%20stroke-width%3D%271.3%27%2F%3E%3Cpath%20d%3D%27M5%205.2l1.4-1.4%201.4%201.4-1.4%201.4z%27%20fill%3D%27%23d4b060%27%2F%3E%3Ccircle%20cx%3D%271.5%27%20cy%3D%2715%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%271.5%27%20r%3D%271%27%20fill%3D%27%23c8a050%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") bottom right / 15px 15px no-repeat; }
            @keyframes sealSplitL { from { transform:none; opacity:1; } to { transform:translate(-14px,6px) rotate(-20deg); opacity:0.15; } }
            @keyframes sealSplitR { from { transform:none; opacity:1; } to { transform:translate(14px,6px) rotate(20deg); opacity:0.15; } }
            @keyframes flameFlicker { 0%,100% { transform:scale(1,1); opacity:1; } 30% { transform:scale(0.92,1.08); opacity:0.92; } 60% { transform:scale(1.05,0.95); } }
            @keyframes tarotShufL { from { transform:translateX(0) rotate(0deg); } to { transform:translateX(-46%) rotate(-9deg); } }
            @keyframes tarotShufR { from { transform:translateX(0) rotate(0deg); } to { transform:translateX(46%) rotate(9deg); } }
            @keyframes tarotFlipIn { from { transform:rotateY(180deg); } to { transform:rotateY(0deg); } }
            @keyframes raysSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
            @keyframes scanSweep { from { transform:rotate(-8deg); } to { transform:rotate(14deg); } }
            @keyframes skullBob { 0%,100% { translate:0 0; } 50% { translate:0 -7px; } }
            @keyframes sealRing { 0% { transform:scale(0.5); opacity:0.9; } 100% { transform:scale(2.4); opacity:0; } }
            @keyframes stampShake { 0%,100% { transform:none; } 20% { transform:translate(-3px,2px); } 45% { transform:translate(3px,-2px); } 70% { transform:translate(-1px,1px); } }
            /* La page elle-même ne doit jamais défiler : seul le contenu de l'onglet défile.
               Sinon, après la fermeture du clavier (Android décale la page pour montrer le champ
               saisi), la barre d'onglets pouvait rester repoussée tout en bas du contenu. */
            html, body { height:100%; overflow:hidden; overscroll-behavior:none; }
            button { transition: transform 0.12s ease, filter 0.12s ease; -webkit-tap-highlight-color: transparent; }
            button:active { transform: scale(0.96); filter: brightness(1.35); }
            @keyframes celebIn { 0% { opacity:0; transform:translate(-50%,20px) scale(0.8); } 15% { opacity:1; transform:translate(-50%,0) scale(1.05); } 25% { transform:translate(-50%,0) scale(1); } 80% { opacity:1; } 100% { opacity:0; transform:translate(-50%,-14px); } }
          `}</style>
      {/* ── Chroniques ── */}
      {chronicleOpen && <React.Suspense fallback={null}><ViewChronicle inventory={appState.inventory} paintHistory={appState.paintHistory||[]} ptsMap={ptsMap} promotions={appState.promotions||[]} oathsKept={appState.oathsKept||[]} listNames={appState.listNames||{}} onClose={() => setChronicleOpen(false)} /></React.Suspense>}

      <NotifyToast />
      <AmbientSound prefs={appState.ambient} onChange={setAmbientPrefs} hidden={idle} />

      {/* ── Mode Serviteur (veille) ── */}
      {idle && (
        <div onClick={() => setIdle(false)}
          style={{ position:"fixed", inset:0, zIndex:900, background:"#010101", cursor:"pointer", animation:"viewFade 0.8s ease both", overflow:"hidden" }}>
          {(() => {
            // Diaporama lent, une image toutes les 12 s. Tant que la Parade compte moins de
            // IDLE_PARADE_MIN photos, ce sont les fonds d'écran de l'Accueil qui défilent ;
            // ensuite, les reliques peintes avec photo et la Parade.
            const paradePhotos = (appState.parade||[]).filter(p => p.photo).length;
            const slides = paradePhotos < IDLE_PARADE_MIN
              ? HOME_BG_POOL.map(f => ({ photo: `${import.meta.env.BASE_URL}fonds/${f}`, title:"", sub:"" }))
              : [
              ...(appState.inventory||[]).filter(i => i.paintStatus==="painted" && i.photo).map(i => {
                const u = findUnit(i.faction, i.unitId);
                return { photo:i.photo, title: i.nickname || u?.name || "", sub: (i.nickname ? (u?.name ? u.name+" · " : "") : "") + (appState.listNames?.[i.faction] || FACTIONS[i.faction]?.label || ""), accent: FACTIONS[i.faction]?.accent };
              }),
              ...(appState.parade||[]).filter(p => p.photo).map(p => ({ photo:p.photo, title: p.title || appState.listNames?.[p.faction] || FACTIONS[p.faction]?.label || "Army on Parade", sub: "Parade" + (p.date ? " · " + p.date : ""), accent: FACTIONS[p.faction]?.accent || "#b8922a" })),

              ];
            // Ordre tiré au hasard à chaque mise en veille ; toutes les photos passent avant qu'une
            // revienne, et la veille ne recommence jamais par la dernière photo vue.
            // Au début de chaque veille : on note le compteur et la dernière photo vue la fois précédente
            if (idleStartRef.current.seed !== idleSeed) idleStartRef.current = { seed: idleSeed, at: idleCit, avoid: lastSlideRef.current };
            let a = idleSeed;
            const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
            const order = slides.map((_, k) => k);
            for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
            if (order.length > 1 && slides[order[0]].photo === idleStartRef.current.avoid) [order[0], order[1]] = [order[1], order[0]];
            const step = idleCit - idleStartRef.current.at;
            const shot = slides.length ? slides[order[((step % slides.length) + slides.length) % slides.length]] : null;
            if (shot) lastSlideRef.current = shot.photo;
            const cits = WEEKLY_CITATIONS.length ? WEEKLY_CITATIONS : [{text:"L'Empereur protège.", author:"Litanie"}];
            const c = cits[idleCit % cits.length];
            const hh = String(idleClock.getHours()).padStart(2,"0");
            const mm = String(idleClock.getMinutes()).padStart(2,"0");
            return (
              <>
                {shot?.photo && (
                  <img key={idleCit} src={shot.photo} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.78) saturate(0.95)", animation:"breathe 20s ease-in-out infinite" }} />
                )}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, #010101e6 0%, #01010166 20%, transparent 34%, transparent 52%, #01010199 70%, #010101f0 100%)" }} />
                <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"calc(30px + env(safe-area-inset-top, 0px)) 24px calc(18px + env(safe-area-inset-bottom, 0px))", textAlign:"center", boxSizing:"border-box" }}>
                  {/* Heure */}
                  <div>
                    <div className="stat-hero" style={{ color:"#e8dfc0", fontSize:"clamp(44px, 8vh, 64px)", lineHeight:1, letterSpacing:"3px", textShadow:"0 0 50px #000, 0 0 90px #b8922a33" }}>{hh}:{mm}</div>
                    <div style={{ color:"#c8b49a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", marginTop:"6px" }}>MODE SERVITEUR · VEILLE</div>
                    <div style={{ color:"#b8a882", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginTop:"8px", textShadow:"0 2px 10px #000" }}>{imperialDate(idleClock)}</div>
                    <div style={{ color:"#8a7a5a", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"2px", textShadow:"0 2px 10px #000" }}>{classicDate(idleClock)}</div>
                  </div>
                  {/* Progression (la citation est placée en bas pour laisser le centre à la figurine) */}
                  <div>
                    <div key={idleCit} style={{ animation:"splashIn 1s ease both", maxWidth:"330px", margin:"0 auto 14px" }}>
                      <div style={{ color:"#e8dfc0", fontSize:"14.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.55, textShadow:"0 2px 16px #000, 0 0 4px #000" }}>« {c.text} »</div>
                      <div style={{ color:"#d8c8ac", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginTop:"6px", textShadow:"0 2px 10px #000" }}>— {c.author}</div>
                    </div>
                    {shot?.title && (
                      <div key={"cap"+idleCit} style={{ animation:"splashIn 1.2s ease both", marginBottom:"12px" }}>
                        <div style={{ color:"#efe4c4", fontSize:"15px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", textShadow:"0 2px 14px #000" }}>{shot.title}</div>
                        {shot.sub && <div style={{ color: shot.accent || "#b8922a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginTop:"3px", textShadow:"0 2px 10px #000" }}>{shot.sub.toUpperCase()}</div>}
                      </div>
                    )}
                    <div style={{ width:"200px", margin:"0 auto 10px", height:"2px", background:"#00000088" }}>
                      <div style={{ width:`${globalPaintPct}%`, height:"100%", background:"linear-gradient(90deg,#6a5420,#b8922a,#e0c060)", transition:"width 1s" }} />
                    </div>
                    <div className="stat-hero" style={{ color:"#b8922a", fontSize:"22px", textShadow:"0 0 30px #000" }}>{globalPaintPct}%</div>
                    <div style={{ color:"#c8b49a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginTop:"3px" }}>{homeTotalPainted} / {homeTotalModels} FIGURINES CONSACRÉES</div>
                    <div style={{ color:"#735f50", fontSize:"10px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginTop:"10px" }}>TOUCHER POUR REPRENDRE</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── Serment tenu ── */}
      {oathDone && <OathCeremony data={oathDone} onClose={closeOathCeremony} />}

      {/* ── Consécration d'un colosse ── */}
      {colossus && <ColossusCeremony data={colossus} onClose={closeCeremony} />}
      {lightCeremony && !colossus && <LightCeremony key={lightCeremony.key} data={lightCeremony} onClose={closeCeremony} />}
      {trophyShown && <TrophyCeremony key={trophyShown.name} data={trophyShown} onClose={() => setTrophyShown(null)} />}

      {/* ── Gerbe d'or (figurine peinte, promotion) ── */}
      {burst && <GoldBurst key={burst.key} big={burst.big} onDone={() => setBurst(null)} />}

      {/* ── Cérémonie de promotion ── */}
      {promotion && createPortal(
        <div onClick={() => setPromotion(null)} style={{ position:"fixed", inset:0, zIndex:4500, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", animation:"viewFade 0.5s ease both", cursor:"pointer" }}>
          {(() => {
            const f = FACTIONS[promotion.faction] || {}; const acc = f.accent || "#b8922a";
            const LINES = {
              SM:"Le Chapitre reconnaît ta valeur. Que ton nom soit gravé sur le Mur des Héros.",
              TY:"L'Esprit de la Ruche t'accorde une place plus haute dans la synapse.",
              IK:"La Maison t'élève en dignité. Le Trône Méca frémit sous ta main.",
              CK:"Les Puissances te couronnent d'un titre plus sombre encore.",
              CSM:"Les Dieux Sombres ont remarqué ton ascension. Fais-en bon usage.",
              OR:"Tu es plus gros, plus fort, plus vert. Le boss est content.",
              NC:"Les Dynasties inscrivent ton nom dans les registres éternels.",
              GC:"Le Patriarche t'accorde un regard. C'est plus que la plupart n'en auront jamais.",
              LD:"Les Puissances t'offrent un nom plus long et plus terrible.",
              AE:"Les Prophètes avaient vu ton ascension. Ils n'en ont rien dit, par élégance.",
              DR:"Tu montes dans la hiérarchie de Commorragh. Surveille ton dos.",
              TA:"Le Bien Suprême reconnaît ton mérite. Une ligne s'ajoute à ton nom.",
              LV:"Les Ancêtres valident la promotion. La prime est en cours de calcul.",
              AS:"L'Ordre t'élève. Que ta foi brûle plus haut encore.",
              AM:"Le régiment te promeut. Le Commissaire te surveillera de plus près.",
              AD:"Tes mérites ont été compilés. Rang supérieur attribué. Louée soit l'Omnimessie.",
              AC:"Un nom de plus s'ajoute au tien. Le Trône d'Or en est témoin.",
              GK:"Le Chapitre t'élève en silence. Personne ne le saura jamais.",
              IM:"L'Inquisition étend ton mandat. Uses-en sans trembler.",
            };
            const line = LINES[promotion.faction] || "Les archives consignent ton ascension. Le Chapelain s'incline.";
            return (
              <div style={{ animation:"stampShake 0.35s 0.32s ease-out both", width:"100%", maxWidth:"360px", textAlign:"center", background:"linear-gradient(180deg,#120e08 0%,#080604 100%)", border:`1px solid ${acc}88`, borderTop:`2px solid ${acc}`, padding:"26px 20px 20px", boxShadow:`0 0 60px ${acc}33` }}>
                <div style={{ color:acc, fontSize:"11px", letterSpacing:"6px", fontFamily:"'Cinzel',serif" }}>PROMOTION</div>
                <div style={{ position:"relative", height:"70px", margin:"12px 0 6px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ position:"absolute", width:"64px", height:"64px", borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 0.9s 0.35s ease-out both" }} />
                  <div style={{ color:acc, fontSize:"48px", textShadow:`0 0 24px ${acc}88`, animation:"sealStamp 0.6s cubic-bezier(.3,1.4,.6,1) both" }}>{f.icon || "✠"}</div>
                </div>
                <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{appState.listNames?.[promotion.faction] || f.label}</div>
                <div style={{ color:"#8a7a5a", fontSize:"14px", fontFamily:"'Cinzel',serif", textDecoration:"line-through", marginTop:"14px" }}>{promotion.from}</div>
                <div style={{ color:"#8a7a5a", fontSize:"14px", margin:"4px 0" }}>↓</div>
                <div style={{ color:"#efe4c4", fontSize:"22px", fontFamily:"'Cinzel',serif", fontWeight:"700", textShadow:`0 0 18px ${acc}66` }}>{promotion.to}</div>
                <div style={{ color:"#d8c8ac", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, margin:"16px 0 18px" }}>« {line} »</div>
                <div style={{ color:"#7a6c52", fontSize:"10px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>TOUCHER POUR FERMER</div>
              </div>
            );
          })()}
        </div>, document.body)}

      {/* Confirm modal */}
      {confirmModal}
      {/* Splash overlay — shown on first open after load */}
      {!splashDone && <SplashOverlay inventory={appState.inventory} lists={appState.lists} ptsMap={ptsMap} onDone={() => {
        try {
          const n = parseInt(localStorage.getItem("wh40k-splash-count")||"0");
          localStorage.setItem("wh40k-splash-count", String(n+1));
        } catch {}
        setSplashDone(true);
      }} />}
      {/* Save indicator — persistent bottom-right label */}
      {savedLabel && saveBadge && (
        <div style={{ position:"fixed", bottom:"72px", left:"12px", zIndex:200, display:"flex", alignItems:"center", gap:"5px",
          background: saveAnim ? "#0f0c06" : "#060402",
          border: `1px solid ${saveAnim ? "#b8922a66" : "#0f0f0f"}`,
          padding:"4px 10px", transition:"all 0.4s", pointerEvents:"none" }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%",
            background: saveAnim ? "#b8922a" : "#2a4a2a",
            boxShadow: saveAnim ? "0 0 6px #b8922a" : "none",
            transition:"all 0.4s" }} />
          <span style={{ color: saveAnim ? "#b8922a" : "#2a4a2a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", transition:"color 0.4s" }}>
            {saveAnim ? "SAUVEGARDE..." : `SAUVEGARDÉ ${savedLabel.toUpperCase()}`}
          </span>
        </div>
      )}

      <div key={"sweep-"+activeView} aria-hidden="true" style={{ position:"absolute", top:0, left:0, right:0, bottom:"56px", zIndex:5, pointerEvents:"none",
          background:"linear-gradient(100deg, transparent 38%, rgba(212,176,96,0.16) 50%, transparent 62%)", backgroundSize:"260% 100%", animation:"tabSweep 0.75s ease-out both" }} />
        <div key={activeView} className="tab-fade" style={{ flex:1, overflowY:"auto", animation:"tabIn 0.45s ease backwards" /* pas de « both » : une animation maintenue rend les fenêtres fixes relatives à la page défilée */,
          ...(FOND_OF_VIEW[activeView] ? { backgroundImage: FOND_VEIL[FOND_OF_VIEW[activeView]], backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat", backgroundColor:"#020202" }
            : activeView === "home" && (appState.inventory || []).length > 0 ? { backgroundImage: homeFond(appState.homeBackground), backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat", backgroundColor:"#020202" }
            : activeView === "home" ? { backgroundColor:"#020202" } : {}) }}>
        <React.Suspense fallback={<ViewFallback />}>
        {activeView==="home" && <ViewHome ready={splashDone} onCompleteMission={completeMission} onUpdateNickname={updateNickname} onUpdatePhoto={updatePhoto} onSetCrusade={setCrusade} onSetBlessing={setBlessing} onSwearOath={swearOath} onKeepLegacyOath={keepLegacyOath} onSwearOathOn={swearOathOn} onRelightOath={relightOath} onReleaseOath={releaseOath} onBurnParchments={burnParchments} onResolveOath={resolveOath} openChronicle={() => setChronicleOpen(true)} inventory={appState.inventory} appState={appState} paintPct={globalPaintPct} totalModels={homeTotalModels} totalPainted={homeTotalPainted} totalPts={homeTotalPts} onNav={setActiveView} homeBackground={appState.homeBackground} onSetBackground={setHomeBackground} onOpenInInventory={(faction, itemId) => { setInventoryFocus({ faction, itemId }); setActiveView("inventory"); }} confirm={askConfirm} onSetTarotWeek={setTarotWeek} lastExport={lastExport} onExport={downloadBackup} driveSynced={driveStatus==="synced"} onSetBackupDismiss={setBackupDismiss} onSetListName={setListName} listNames={appState.listNames} onUpdatePurchased={updatePurchased} onSetListGoal={setListGoal} listGoals={appState.listGoals} onSetPts={handleSetPts} ptsMap={ptsMap} onServoNewsShown={(day) => updateApp(s => ({ ...s, servoNewsDay: day }))} onUpdatePaint={updatePaint} onMarkReviewed={(id) => updateApp(s => ({ ...s, inventory: s.inventory.map(i => i.id === id ? { ...i, reviewedAt: localDay() } : i) }))} onSetWeekMission={(m) => updateApp(s => ({ ...s, weekMission: m }))} onSetAdvent={(fn) => updateApp(fn)} />}
        {activeView==="lists" && <ViewLists inventory={appState.inventory} ptsMap={ptsMap} listNames={appState.listNames||{}} listGoals={appState.listGoals||{}} onSetName={setListName} onSetGoal={setListGoal} />}
        {activeView==="inventory" && <ViewInventory onUpdateColosse={updateColosse} onReplayCeremony={replayCeremony} paintHistory={appState.paintHistory||[]} inventory={appState.inventory} ptsMap={ptsMap} onSetPts={handleSetPts} onAdd={addInventory} onDelete={deleteInventory} onUpdatePhoto={updatePhoto} onUpdatePaint={updatePaint} onUpdateQty={updateQty} onUpdateModelCount={updateModelCount} onReorder={reorderInventory} onUpdateNote={updateNote} onUpdateNickname={updateNickname} onUpdatePurchased={updatePurchased} onSplit={splitInventory} paintPct={lawStats.pct} unpainted={lawStats.unpainted} shameLawOff={!!appState.shameLawOff} onSetShameLaw={setShameLaw} onNav={setActiveView} focusItem={inventoryFocus} onFocusHandled={() => setInventoryFocus(null)} paintCatalog={appState.paintCatalog||[]} onSetRecipe={setRecipe} onAddPaint={addPaintCatalog} confirm={askConfirm} />}
        {activeView==="stats"    && <ViewStats oath={appState.oath} appState={appState} openChronicle={() => setChronicleOpen(true)} inventory={appState.inventory} lists={appState.lists} ptsMap={ptsMap} wishlist={appState.wishlist||[]} paintHistory={appState.paintHistory||[]} confirm={askConfirm} onSealJudgment={sealJudgment} />}
        {activeView==="wishlist" && <ViewWishlist onNav={setActiveView} paintPct={lawStats.pct} unpainted={lawStats.unpainted} shameLawOff={!!appState.shameLawOff} onSetShameLaw={setShameLaw} wishlist={appState.wishlist||[]} paintWishlist={appState.paintWishlist||[]} printList={appState.printList||[]} ptsMap={ptsMap} onAdd={addWish} onDelete={deleteWish} onSetStatus={setWishStatus} onSetPrice={setWishPrice} onAddPaint={addPaintWish} onDeletePaint={deletePaintWish} onAddPrint={addPrint} onDeletePrint={deletePrint} onUpdatePrint={updatePrint} />}
        {activeView==="parade"   && <ViewParade parade={appState.parade||[]} onAdd={addParade} onDelete={deleteParade} homeBackground={appState.homeBackground} onSetHomeBackground={(photo) => setHomeBackground(appState.homeBackground === photo ? null : photo)} confirm={askConfirm} />}
        {activeView==="shame"    && <ViewShame onSwearOathOn={swearOathOn} inventory={appState.inventory} appState={appState} onSetFate={setFateChoice} onUpdatePaint={updatePaint} onUpdatePurchased={updatePurchased} confirm={askConfirm} paintPct={globalPaintPct} paintHistory={appState.paintHistory||[]} onOpenInInventory={(faction, itemId) => { setInventoryFocus({ faction, itemId }); setActiveView("inventory"); }} onSetFateRollDay={setFateRollDay} />}
        {activeView==="codex"    && <ViewCodex onReassignOrphan={reassignOrphan} onDeleteOrphan={deleteOrphan} onSetTarotDeck={(k) => updateApp(st => ({ ...st, tarotDeck:k }))} lastExport={lastExport} onExport={downloadBackup} onImport={restoreBackup} inventory={appState.inventory} lists={appState.lists} parade={appState.parade||[]} driveStatus={driveStatus} onDriveConnect={driveConnect} onDriveDisconnect={driveDisconnect} appState={appState} onSetCrusadeStart={setCrusadeStart} />}
        </React.Suspense>
      </div>

      {/* ── Nav basse ── (icônes toutes dessinées dans le même trait, onglet actif mis en valeur) */}
      {splashDone && (
        <div style={{ display:"flex", background:"linear-gradient(180deg,#070503 0%,#020202 100%)", borderTop:"1px solid #1e1810", boxShadow:"0 -6px 18px #000c", flexShrink:0, zIndex:10, position:"relative", paddingRight: idle ? 0 : "40px" /* place du bouton son, rangé dans la barre */ }}>
          {[
            { key:"home",      icon:"templarshield", label:"ACCUEIL"  },
            { key:"inventory", icon:"unite",         label:"RELIQUES" },
            { key:"shame",     icon:"wanted",        label:"SHAME",    badge:shameAlert },
            { key:"lists",     icon:"ironcross",     label:"CROISADE" },
            { key:"parade",    icon:"camera",        label:"PARADE"   },
            { key:"stats",     icon:"stats",         label:"STATS",    badge:shameAlert },
            { key:"wishlist",  icon:"wishlist",      label:"WISHLIST" },
            { key:"codex",     icon:"codex",         label:"CODEX",    badge:exportDue },
          ].map(t => { const on = activeView===t.key; return (
            <button key={t.key} onClick={() => setActiveView(t.key)} aria-label={t.label}
              style={{ flex:1, position:"relative", background:"none", border:"none", padding:"10px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", minHeight:"56px", justifyContent:"center", touchAction:"manipulation" }}>
              {/* filet doré qui s'estompe sur les côtés + halo derrière l'icône */}
              <span style={{ position:"absolute", top:0, left:"12%", right:"12%", height:"2px", background:"linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: on ? 1 : 0, boxShadow: on ? "0 0 8px var(--accent)" : "none", transition:"opacity 0.25s" }} />
              <span style={{ position:"absolute", top:"4px", left:"50%", width:"46px", height:"36px", marginLeft:"-23px", borderRadius:"50%", background:"radial-gradient(ellipse, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)", opacity: on ? 1 : 0, transition:"opacity 0.3s", pointerEvents:"none" }} />
              <span style={{ position:"relative", display:"inline-block", lineHeight:0, color: on ? "var(--accent)" : "#6a5c44", filter: on ? "drop-shadow(0 0 6px var(--accent))" : "none", transform: on ? "translateY(-1px) scale(1.08)" : "none", transition:"all 0.25s" }}>
                <NavGlyph id={t.icon} size={20} color="currentColor" />
                {t.badge && <span style={{ position:"absolute", top:"-3px", right:"-6px", width:"8px", height:"8px", borderRadius:"50%", background:"#c04040", display:"block", boxShadow:"0 0 4px #c04040" }} />}
              </span>
              {on && <span style={{ fontSize:"9.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", color:"var(--accent)", whiteSpace:"nowrap", animation:"viewFade 0.3s ease both" }}>{t.label}</span>}
              {on && <span style={{ width:"4px", height:"4px", transform:"rotate(45deg)", background:"var(--accent)", opacity:0.7 }} />}
            </button>
          ); })}
        </div>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ background:"#020202", height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'Cinzel',serif", gap:"16px" }}>
        <div style={{ fontSize:"40px", color:"#c02121" }}>⚠</div>
        <div style={{ color:"#e8dfc0", fontSize:"15px", letterSpacing:"2px", textAlign:"center" }}>ERREUR — RECHARGER LA PAGE</div>
        <div style={{ color:"#d8c8ac", fontSize:"11.5px", fontFamily:"monospace", textAlign:"center", maxWidth:"300px", lineHeight:1.6 }}>{this.state.error.message}</div>
        <button onClick={() => window.location.reload()} style={{ background:"#0f0c08", border:"1px solid #b8922a55", color:"#b8922a", padding:"10px 24px", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"3px", cursor:"pointer", marginTop:"8px" }}>RECHARGER</button>
      </div>
    );
    return this.props.children;
  }
}
