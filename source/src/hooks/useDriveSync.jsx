import React, { useState, useEffect, useCallback, useRef } from 'react';
import { driveForget, driveGetToken, driveLoadState, driveSaveState } from '../lib/drive.jsx';
import { notify } from '../lib/utils.jsx';
import { migrateUnitIds } from '../data/units.jsx';

// ══════════════════════════════════════════════════════════
// SYNCHRONISATION GOOGLE DRIVE
// ══════════════════════════════════════════════════════════
// Sortie d'App.jsx telle quelle : connexion (et reconnexion automatique au démarrage),
// envoi groupé 3 s après la dernière modification, envoi immédiat quand l'app passe en
// arrière-plan, gestion du conflit « local plus récent que Drive », déconnexion.
export function useDriveSync({ loaded, appState, setAppState, persist, askConfirm }) {
  const [driveStatus, setDriveStatus] = useState("idle");
  const driveTokenRef = useRef(null);
  const stateRef = useRef(appState);   // état le plus récent, pour les fonctions appelées plus tard
  stateRef.current = appState;

  // Reconnexion Google Drive silencieuse au démarrage — UNIQUEMENT une fois que les
  // données locales (IndexedDB) ont fini de charger. Sans ce garde-fou, driveConnect()
  // pouvait s'exécuter avant que loadApp() n'ait rempli appState : sa vérification
  // anti-écrasement se basait alors sur un appState encore vide (valeur par défaut),
  // la faisant passer à côté, et Drive pouvait écraser silencieusement des données
  // locales plus récentes (ex: la quête du jour tout juste validée) sans prévenir.
  useEffect(() => {
    if (!loaded) return;
    let wants = false;
    try { wants = localStorage.getItem("driveAutoConnect") === "1"; } catch {}
    if (!wants) return;
    // Attendre que le script Google soit chargé (async defer)
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        driveConnect();
      } else if (tries > 20) { clearInterval(timer); }
    }, 500);
    return () => clearInterval(timer);
  }, [loaded]);

  const driveDoSave = async (data) => {
    // Données légères + seulement les photos nouvelles (voir lib/drive.jsx)
    await driveSaveState(driveTokenRef.current, data);
  };

  const driveFailedRef = useRef(false); // un envoi a échoué : à retenter au retour du réseau
  const driveSave = React.useCallback(async (data) => {
    if (!driveTokenRef.current) return;
    try {
      setDriveStatus("syncing");
      await driveDoSave(data);
      driveFailedRef.current = false;
      setDriveStatus("synced");
    } catch(e) {
      // Seul un refus de Drive (401/403 : autorisation expirée) justifie de redemander
      // l'accès à Google. Pour toute autre erreur (hors ligne, Drive indisponible…),
      // on retentera simplement quand le réseau reviendra.
      const expired = /Drive 40[13]/.test(String(e?.message || ""));
      if (!expired) { driveFailedRef.current = true; setDriveStatus("error"); return; }
      try {
        const token = await driveGetToken();
        driveTokenRef.current = token;
        await driveDoSave(data);
        driveFailedRef.current = false;
        setDriveStatus("synced");
      } catch(e2) { driveFailedRef.current = true; setDriveStatus("error"); }
    }
  }, []);

  // Retour du réseau (ou de l'app au premier plan) après un envoi raté : on renvoie l'état actuel
  useEffect(() => {
    const retry = () => {
      if (!driveFailedRef.current || !driveTokenRef.current) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      driveSave(stateRef.current);
    };
    const onShow = () => { if (document.visibilityState === "visible") retry(); };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onShow);
    return () => { window.removeEventListener("online", retry); document.removeEventListener("visibilitychange", onShow); };
  }, [driveSave]);

  // Sauvegarde Drive groupée : attend 3s d'inactivité avant de pousser,
  // pour éviter une requête réseau à chaque micro-action. Le local reste immédiat.
  const driveDebounceRef = useRef(null);
  const drivePendingRef = useRef(null);
  const driveSaveDebounced = useCallback((data) => {
    if (!driveTokenRef.current) return;
    drivePendingRef.current = data;
    setDriveStatus("pending");
    if (driveDebounceRef.current) clearTimeout(driveDebounceRef.current);
    driveDebounceRef.current = setTimeout(() => {
      driveDebounceRef.current = null;
      const d = drivePendingRef.current;
      drivePendingRef.current = null;
      if (d) driveSave(d);
    }, 3000);
  }, [driveSave]);
  // Flush immédiat quand l'app passe en arrière-plan / se ferme (ne rien perdre)
  useEffect(() => {
    const flush = () => {
      if (driveDebounceRef.current && drivePendingRef.current) {
        clearTimeout(driveDebounceRef.current);
        driveDebounceRef.current = null;
        const d = drivePendingRef.current;
        drivePendingRef.current = null;
        driveSave(d);
      }
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush); };
  }, [driveSave]);

  // Déconnexion de Google Drive : la synchronisation s'arrête, la collection reste
  // intacte sur le téléphone ET sur Drive (on peut se reconnecter plus tard sans rien perdre).
  const driveDisconnect = () => askConfirm(
    "Se déconnecter de Google Drive ? Ta collection reste sur ce téléphone, et la copie déjà présente sur Drive n'est pas effacée. Les prochaines modifications ne seront simplement plus envoyées.",
    () => {
      if (driveDebounceRef.current) { clearTimeout(driveDebounceRef.current); driveDebounceRef.current = null; }
      drivePendingRef.current = null;
      driveFailedRef.current = false;
      driveForget(driveTokenRef.current);
      driveTokenRef.current = null;
      setDriveStatus("idle");
      try { localStorage.removeItem("driveAutoConnect"); } catch {}
      notify("Google Drive déconnecté. Pense à télécharger une sauvegarde de temps en temps.");
    }, "#b8922a", "SE DÉCONNECTER", false);

  const driveConnect = async () => {
    try {
      setDriveStatus("connecting");
      const token = await driveGetToken();
      driveTokenRef.current = token;
      setDriveStatus("syncing");
      const remote = await driveLoadState(token);
      if (remote) {
        const clean = migrateUnitIds(remote.data); // la copie Drive peut venir d'une version plus ancienne de l'app
        {
          let localAt = null;
          try { localAt = localStorage.getItem("lastLocalSave"); } catch {}
          const remoteAt = remote.savedAt;
          if (remoteAt && localAt && localAt > remoteAt && (stateRef.current.inventory||[]).length > 0) {
            // Conflit : les données locales sont plus récentes que Drive
            askConfirm(
              "⚠ Tes données locales sont plus récentes que celles sur Google Drive. Envoyer les données locales vers Drive ? (Annuler chargera la version Drive et écrasera les modifications locales.)",
              () => { driveSave(stateRef.current); },
              "#b8922a", "GARDER LOCALES", false,
              () => { setAppState(s => { const n = { ...s, ...clean }; persist(n); return n; }); }
            );
          } else {
            setAppState(s => { const n = { ...s, ...clean }; persist(n); return n; });
          }
        }
      }
      else if ((stateRef.current.inventory||[]).length) {
        // Rien encore sur Drive : on envoie tout de suite une première copie
        await driveSaveState(token, stateRef.current);
      }
      setDriveStatus("synced");
      try { localStorage.setItem("driveAutoConnect", "1"); } catch {}
    } catch(e) {
      console.error(e);
      // Raccordement incomplet (ex. la copie Drive n'a pas pu être lue en entier) : on ne garde
      // pas l'accès, pour qu'aucune modification ne soit envoyée par-dessus la copie Drive
      // avant un raccordement réussi (bouton « Connecter » du Codex).
      driveTokenRef.current = null;
      setDriveStatus("error");
    }
  };

  return { driveStatus, driveConnect, driveDisconnect, driveSaveDebounced };
}
