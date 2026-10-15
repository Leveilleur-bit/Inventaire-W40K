import React, { useState, useEffect, useRef } from 'react';

// ── Ambiance sonore ─────────────────────────────────────────────────────
// Pistes par ambiance : déposer les fichiers dans public/sons/ puis ajouter leur
// nom ici. Dès qu'une ambiance a 2 pistes ou plus, elles s'enchaînent en aléatoire
// (jamais deux fois la même d'affilée) ; avec une seule piste, elle tourne en boucle.
const AMBIENT_TRACKS = {
  // Pistes Pixabay (licence Pixabay : usage libre, attribution facultative),
  // normalisées à -18 LUFS. Anciennes pistes retirées : "sons/chant.mp3", "sons/tambours.mp3", "sons/lames.mp3".
  chant:      ["sons/chant-gothic-choir.mp3", "sons/chant-candlelight.mp3"],
  lames:      ["sons/lames-sword-16.mp3", "sons/lames-sword-5.mp3"],
  tambours:   ["sons/tambours-gothic-storm.mp3", "sons/tambours-empires-fall.mp3", "sons/tambours-war-yudin.mp3", "sons/tambours-war-mountain.mp3"],
  complainte: ["sons/complainte-dark-sadness.mp3"],
};
// « Toutes les musiques » (choix du 14 octobre 2026) : les 9 pistes mélangées, qui s'enchaînent
// sans jamais changer avec l'onglet. Remplace l'ancien mode « Automatique » (une ambiance par
// onglet, qui coupait la musique à chaque changement d'onglet).
AMBIENT_TRACKS.playlist = [...new Set(Object.values(AMBIENT_TRACKS).flat())];

const AMBIENT_LABELS = { playlist:"Toutes les musiques", chant:"Chant liturgique", lames:"Cliquetis de lames", tambours:"Tambours de guerre", complainte:"Complainte" };

// L'ancien réglage « auto » (enregistré chez certains) est lu comme « playlist ».

// Par défaut : silence. Le choix de l'utilisateur est mémorisé dans appState.ambient (synchro Drive).
// mute : « couper tout le son » (musique et sons d'interface) sans perdre les réglages.
const AMBIENT_DEFAULTS = { on:false, mode:"playlist", vol:0.5, bg:false, sfx:true, haptics:true, mute:false };

const AMBIENT_FADE_MS = 1500;

// Volume et fondus passent par Web Audio (GainNode) : sur iPhone, audio.volume
// est en lecture seule, un fondu fait avec lui ne marcherait pas.
export function AmbientSound({ prefs: rawPrefs, onChange, activeView, hidden }) {
  const prefs = { ...AMBIENT_DEFAULTS, ...(rawPrefs||{}) };
  const [open, setOpen] = useState(false);
  const [volUi, setVolUi] = useState(prefs.vol);

  // Choix du 15 octobre 2026 : un seul bouton (son activé / coupé) ; la musique est toujours le
  // chant liturgique. Les autres pistes restent dans AMBIENT_TRACKS pour plus tard.
  const mode = "chant";
  const effectiveAmb = "chant";
  const playing = prefs.on && !prefs.mute;

  const prefsRef = useRef(prefs);         prefsRef.current = prefs;
  const ambRef = useRef(effectiveAmb);    ambRef.current = effectiveAmb;
  const onChangeRef = useRef(onChange);   onChangeRef.current = onChange;
  const ctxRef = useRef(null);            // AudioContext unique, créé au 1er geste
  const masterRef = useRef(null);         // gain maître = volume utilisateur
  const decksRef = useRef(null);          // deux lecteurs persistants (fondu enchaîné A ↔ B)
  const curRef = useRef(null);            // lecteur actif
  const unlockedRef = useRef(false);      // true après le premier geste de la session
  const volTimer = useRef(null);

  const ramp = (gainNode, v) => {
    const ctx = ctxRef.current; if (!ctx) return;
    const t = ctx.currentTime, g = gainNode.gain;
    try { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + AMBIENT_FADE_MS/1000); } catch {}
  };

  const setSession = (amb, isPlaying) => {
    const ms = navigator.mediaSession; if (!ms) return;
    try {
      if (amb && window.MediaMetadata) ms.metadata = new MediaMetadata({ title: AMBIENT_LABELS[amb] || "Ambiance", artist: "Reliquaire", album: "Ambiance sonore" });
      ms.playbackState = isPlaying ? "playing" : "paused";
    } catch {}
  };

  const pickTrack = (amb, prevSrc) => {
    const list = AMBIENT_TRACKS[amb] || [];
    if (list.length <= 1) return list[0];
    const pool = list.filter(s => s !== prevSrc);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const fadeOut = (d) => {
    ramp(d.gain, 0);
    clearTimeout(d.killT);
    d.killT = setTimeout(() => { if (curRef.current !== d) { try { d.el.pause(); } catch {} } }, AMBIENT_FADE_MS + 100);
  };

  const playAmb = (amb, prevSrc) => {
    const decks = decksRef.current, ctx = ctxRef.current;
    if (!decks || !ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const src = pickTrack(amb, prevSrc); if (!src) return;
    const old = curRef.current;
    const d = decks[0] === old ? decks[1] : decks[0];
    clearTimeout(d.killT);
    d.amb = amb; d.src = src; d.nextFired = false;
    d.el.loop = (AMBIENT_TRACKS[amb] || []).length <= 1;
    d.el.src = import.meta.env.BASE_URL + src;
    curRef.current = d;
    const p = d.el.play(); if (p) p.catch(() => {});
    ramp(d.gain, 1);
    if (old) fadeOut(old);
    setSession(amb, true);
  };

  const stopAll = () => {
    const d = curRef.current; curRef.current = null;
    if (d) fadeOut(d);
    setSession(null, false);
  };

  const makeDeck = (ctx) => {
    const el = new Audio(); el.preload = "auto";
    const node = ctx.createMediaElementSource(el);
    const gain = ctx.createGain(); gain.gain.value = 0;
    node.connect(gain); gain.connect(masterRef.current);
    const d = { el, gain, amb:null, src:null, killT:null, nextFired:false };
    // Playlist : on lance la piste suivante un peu avant la fin pour que le fondu se chevauche.
    const next = () => { if (curRef.current === d && !el.loop && !d.nextFired) { d.nextFired = true; playAmb(d.amb, d.src); } };
    el.addEventListener("timeupdate", () => { if (el.duration && el.duration - el.currentTime < AMBIENT_FADE_MS/1000 + 0.2) next(); });
    el.addEventListener("ended", next);
    return d;
  };

  // À appeler PENDANT un geste utilisateur (exigence des navigateurs, surtout iOS).
  const unlock = () => {
    if (unlockedRef.current) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = prefsRef.current.vol; master.connect(ctx.destination);
    ctxRef.current = ctx; masterRef.current = master;
    ctx.resume().catch(() => {});
    decksRef.current = [makeDeck(ctx), makeDeck(ctx)];
    // iOS : un <audio> doit être lancé une première fois pendant un geste pour pouvoir
    // rejouer plus tard sans geste (changement d'onglet, piste suivante…).
    decksRef.current.forEach(d => {
      d.el.src = import.meta.env.BASE_URL + AMBIENT_TRACKS.chant[0];
      const p = d.el.play();
      if (p) p.then(() => { if (curRef.current !== d) d.el.pause(); }).catch(() => {});
    });
    unlockedRef.current = true;
    return true;
  };

  // Premier contact de la session : on déverrouille l'audio, et on reprend la musique
  // seulement si l'utilisateur l'avait laissée allumée la dernière fois.
  useEffect(() => {
    const kick = () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      if (!unlock()) return;
      if (prefsRef.current.on && ambRef.current && !curRef.current) playAmb(ambRef.current);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => { window.removeEventListener("pointerdown", kick); window.removeEventListener("keydown", kick); };
  }, []);

  // Suit les préférences (la musique ne dépend plus de l'onglet affiché).
  useEffect(() => {
    if (!unlockedRef.current) return;
    const cur = curRef.current;
    if (playing) { if (!cur || cur.amb !== effectiveAmb) playAmb(effectiveAmb); }
    else if (cur) stopAll();
  }, [playing, effectiveAmb]);

  // Volume venant d'ailleurs (autre appareil via Drive, chargement initial).
  useEffect(() => {
    setVolUi(prefs.vol);
    const m = masterRef.current, ctx = ctxRef.current;
    if (m && ctx) m.gain.setTargetAtTime(prefs.vol, ctx.currentTime, 0.05);
  }, [prefs.vol]);

  // Cérémonie d'un colosse : la musique d'ambiance s'efface, puis revient
  useEffect(() => {
    const onDuck = (e) => {
      const m = masterRef.current, ctx = ctxRef.current; if (!m || !ctx) return;
      m.gain.setTargetAtTime(e.detail ? prefsRef.current.vol * 0.12 : prefsRef.current.vol, ctx.currentTime, 0.6);
    };
    window.addEventListener("reliquaire:duck", onDuck);
    return () => window.removeEventListener("reliquaire:duck", onDuck);
  }, []);

  // Application en arrière-plan : pause, sauf si l'option « arrière-plan » est cochée.
  useEffect(() => {
    const onVis = () => {
      const ctx = ctxRef.current; if (!ctx) return;
      const d = curRef.current;
      if (document.hidden) {
        if (!prefsRef.current.bg) { if (d) d.el.pause(); ctx.suspend().catch(() => {}); }
      } else {
        ctx.resume().catch(() => {});
        if (d && d.el.paused) { const p = d.el.play(); if (p) p.catch(() => {}); }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Contrôles de l'écran verrouillé / du centre de contrôle.
  useEffect(() => {
    const ms = navigator.mediaSession; if (!ms) return;
    const set = (a, f) => { try { ms.setActionHandler(a, f); } catch {} };
    set("play",  () => { unlock(); onChangeRef.current({ on:true }); });
    set("pause", () => onChangeRef.current({ on:false }));
    set("stop",  () => onChangeRef.current({ on:false }));
    set("nexttrack", () => { const d = curRef.current; if (d && (AMBIENT_TRACKS[d.amb]||[]).length > 1) playAmb(d.amb, d.src); });
    return () => ["play","pause","stop","nexttrack"].forEach(a => set(a, null));
  }, []);

  useEffect(() => () => {
    clearTimeout(volTimer.current);
    (decksRef.current || []).forEach(d => { try { d.el.pause(); } catch {} });
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
  }, []);

  const chooseMode = (m) => {
    unlock(); // le tap sur le menu est un geste valide
    if (prefs.on && mode === m && !prefs.mute) onChange({ on:false });
    else onChange({ mode:m, on:true, mute:false });   // choisir une ambiance remet le son
  };

  const onVol = (v) => {
    setVolUi(v);
    const m = masterRef.current, ctx = ctxRef.current;
    if (m && ctx) m.gain.setTargetAtTime(v, ctx.currentTime, 0.03);
    clearTimeout(volTimer.current);
    volTimer.current = setTimeout(() => onChangeRef.current({ vol:v }), 400); // pas une sauvegarde à chaque cran
  };

  // Le composant reste monté pendant le Mode Serviteur : la musique continue, seul le bouton disparaît.
  if (hidden) return null;

  const gold = "#b8922a", dim = "#8a7a58", line = "#2a2215";
  const MODES = [["playlist","✦","Toutes les musiques"],["chant","♪","Chant liturgique"],["lames","⚔","Cliquetis de lames"],["tambours","◉","Tambours de guerre"],["complainte","☾","Complainte"]];
  return (
    <div style={{ position:"absolute", bottom:"14px", right:"5px", zIndex:120,   /* dans la barre du bas, à droite des onglets : ne recouvre plus le contenu */ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
      <button onClick={() => { unlock(); onChange({ on: !playing, mute: false }); }} aria-label={playing ? "Couper le son" : "Activer le son"}
        style={{ width:"32px", height:"32px", borderRadius:"50%", opacity: playing ? 0.95 : 0.55, transition:"opacity 0.2s, transform 0.12s ease, filter 0.12s ease", background: playing?`${gold}22`:"#0a0806e0", border:`1px solid ${playing?gold:(prefs.mute?"#7a3030":line)}`, color: playing?gold:(prefs.mute?"#b05a4a":"#6a5a4a"), cursor:"pointer", boxShadow:"0 2px 10px #000a", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {playing
            ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></>
            : <path d="M17 9.5l5 5M22 9.5l-5 5" />}
        </svg>
      </button>
    </div>
  );
}
