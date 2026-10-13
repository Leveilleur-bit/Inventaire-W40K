import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';

// ══════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════

export const Ic = {
  Plus:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Back:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  Trash:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

// SHARED STYLES
// ══════════════════════════════════════════════════════════

export const btnSm     = { background:"transparent", border:"1px solid #1c1c1c", color:"#b3a48c", padding:"5px 12px", cursor:"pointer", fontSize:"12.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" };

export const qtyBtn    = { background:"#030303", border:"1px solid #1c1c1c", color:"#b8922a", width:"36px", height:"36px", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"serif" };

// paddingBottom : la marge du bas (pour dégager le bouton son) fait partie de la page, donc le fond
// d'écran la couvre aussi. Avant, elle était sur le conteneur et laissait une bande noire en bas.
export const pageStyle = { minHeight:"100%", boxSizing:"border-box", paddingBottom:"112px", display:"flex", flexDirection:"column", fontFamily:"'Crimson Pro',Georgia,serif" , background:"rgba(2,2,2,0.82)" };

// Fonds d'écran des vues : chemin construit via BASE_URL (comme sons/xxx.mp3)
// pour rester valide sous un sous-chemin GitHub Pages (/InventaireW40K/...).
// Le voile (gradient) + l'image sont posés en inline style, appliqués APRÈS
// le "background" de pageStyle donc ils gagnent naturellement (pas besoin
// de !important) ; seuls background-size/position/repeat restent en CSS.
export const FOND_VEIL = {
  lists:     `linear-gradient(rgba(3,3,4,0.58), rgba(3,3,4,0.66)), url(${import.meta.env.BASE_URL}fonds/croisade.jpg)`,
  inventory: `linear-gradient(rgba(4,3,0,0.42), rgba(4,3,0,0.52)), url(${import.meta.env.BASE_URL}fonds/reliques.jpg)`,
  stats:     `linear-gradient(rgba(2,2,2,0.6), rgba(2,2,2,0.68)), url(${import.meta.env.BASE_URL}fonds/stats.jpg)`,
  codex:     `linear-gradient(rgba(2,2,2,0.55), rgba(2,2,2,0.65)), url(${import.meta.env.BASE_URL}fonds/codex.jpg)`,
  wishlist:  `linear-gradient(rgba(10,2,2,0.55), rgba(10,2,2,0.65)), url(${import.meta.env.BASE_URL}fonds/wishlist.jpg)`,
  shame:     `linear-gradient(rgba(12,3,0,0.55), rgba(12,3,0,0.68)), url(${import.meta.env.BASE_URL}fonds/shame.jpg)`,
};

// Le fond d'un onglet est posé sur le conteneur qui défile (App.jsx), pas sur la page :
// il reste ainsi en place, à la taille de l'écran, quand on fait défiler une page longue.
// Avant, l'image s'affichait à sa taille réelle (trop zoomée) et se répétait en mosaïque
// sur les pages longues. La page elle-même devient transparente.
export const pageFond = () => ({ background: "transparent" });

// Fond de l'Accueil : la photo de Parade choisie avec l'étoile ★ (prioritaire), sinon un fond
// qui change chaque jour parmi cette liste. Pour en ajouter un : déposer le fichier dans
// public/fonds/ et rajouter son nom ici.
// Comme pour les autres onglets, il est posé sur le conteneur qui défile (App.jsx) : l'image
// reste en place, cadrée sur l'écran. Avant, elle était étirée sur toute la hauteur de la page
// (très zoomée, et on n'en voyait qu'un morceau à la fois).
// Le voile à 49 % équivaut à l'ancien réglage (luminosité 62 % + voile noir de 18 %).
export const HOME_BG_POOL = ["accueil-1.jpg", "accueil-2.jpg", "accueil-3.jpg", "accueil-4.jpg", "accueil-5.jpg", "accueil-6.jpg", "accueil-7.jpg", "accueil-8.jpg", "accueil-9.jpg", "accueil-10.jpg", "accueil-11.jpg", "accueil-12.jpg", "accueil-13.jpg", "accueil-14.jpg", "accueil-15.jpg"];
export function homeFond(homeBackground) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const bg = homeBackground || `${import.meta.env.BASE_URL}fonds/${HOME_BG_POOL[dayOfYear % HOME_BG_POOL.length]}`;
  return `linear-gradient(rgba(1,1,1,0.49), rgba(1,1,1,0.49)), url("${bg}")`;
}

// ══════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ══════════════════════════════════════════════════════════

const CrossDivider = ({ color="#151515" }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"8px", margin:"4px 0" }}>
    <div style={{ flex:1, height:"1px", background:color }} />
    <span style={{ color, fontSize:"11.5px" }}>✠</span>
    <div style={{ flex:1, height:"1px", background:color }} />
  </div>
);

export const Overlay = ({ children, zIndex = 100 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex, overflow:"hidden" }}>
    {children}
  </div>
);

export const Sheet = ({ children, accent }) => (
  <div style={{
    background:"linear-gradient(180deg,#0d0b08 0%,#080808 100%)",
    borderTop:`2px solid ${accent}`, borderLeft:"1px solid #131313", borderRight:"1px solid #131313",
    padding:"20px 20px 48px", width:"100%", maxWidth:"560px",
    maxHeight:"80dvh", overflowY:"auto", overflowX:"hidden",
    boxShadow:`0 -12px 60px rgba(0,0,0,0.9)`, position:"relative",
    WebkitOverflowScrolling:"touch",
  }}>
    <div style={{ position:"absolute", top:"8px", left:"8px", color:accent, fontSize:"11.5px", opacity:0.4 }}>✠</div>
    <div style={{ position:"absolute", top:"8px", right:"8px", color:accent, fontSize:"11.5px", opacity:0.4 }}>✠</div>
    <div style={{ position:"relative", zIndex:1 }}>{children}</div>
  </div>
);

export const SheetHeader = ({ title, onClose, accent }) => (
  <div style={{ marginBottom:"20px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
      <h2 style={{ color:accent, fontFamily:"'Cinzel Decorative','Cinzel',serif", margin:0, fontSize:"15px", letterSpacing:"3px", textTransform:"uppercase", textShadow:`0 0 20px ${accent}44` }}>{title}</h2>
      <button onClick={onClose} style={{ background:"none", border:"1px solid #111", color:"#6c6341", cursor:"pointer", fontSize:"16px", width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
    </div>
    <CrossDivider color={accent+"44"} />
  </div>
);

export const Label = ({ children }) => (
  <div style={{ color:"#646464", fontSize:"11.5px", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"6px", fontFamily:"'Cinzel',serif" }}>{children}</div>
);

export const Input = ({ style={}, ...p }) => (
  <input style={{ background:"#050505", border:"1px solid #151515", borderBottom:"1px solid #1c1c1c", color:"#e8dfc0", padding:"10px 12px", fontSize:"15px", outline:"none", width:"100%", boxSizing:"border-box", marginBottom:"16px", fontFamily:"'Crimson Pro',serif", letterSpacing:"0.5px", ...style }} {...p} />
);

export function useScrollProgress() {
  const ref = useRef(null);
  const [prog, setProg] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const onScroll = React.useCallback((e) => {
    const el = e.target;
    const max = el.scrollHeight - el.clientHeight;
    setProg(max > 0 ? el.scrollTop / max : 0);
    setScrolled(el.scrollTop > 300);
  }, []);
  const toTop = () => { if (ref.current) ref.current.scrollTo({ top: 0, behavior: "smooth" }); };
  return { ref, prog, scrolled, onScroll, toTop };
}

export function ScrollBar({ prog, accent="#b8922a" }) {
  return (
    <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:"transparent", zIndex:30, pointerEvents:"none" }}>
      <div style={{ width:`${Math.round(prog*100)}%`, height:"100%", background:`linear-gradient(90deg, transparent, ${accent})`, transition:"width 0.1s linear" }} />
    </div>
  );
}

export function ToTopBtn({ show, onClick, accent="#b8922a" }) {
  if (!show) return null;
  return (
    <button onClick={onClick} title="Remonter"
      style={{ position:"absolute", bottom:"16px", right:"14px", zIndex:60, width:"40px", height:"40px", borderRadius:"50%", background:"#0a0806e8", border:`1px solid ${accent}77`, color:accent, fontSize:"18px", cursor:"pointer", boxShadow:"0 2px 12px #000a", display:"flex", alignItems:"center", justifyContent:"center", animation:"splashIn 0.3s ease both" }}>↑</button>
  );
}

export const PrimaryBtn = ({ children, color, onClick }) => (
  <button onClick={onClick} style={{ width:"100%", padding:"14px", background:"linear-gradient(180deg,#131313 0%,#0d0d0d 100%)", border:`1px solid ${color}`, borderTop:`2px solid ${color}`, color, fontFamily:"'Cinzel',serif", fontSize:"14px", letterSpacing:"3px", cursor:"pointer", textTransform:"uppercase", textShadow:`0 0 10px ${color}66` }}>{children}</button>
);

export const IconBtn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ background:"#b8922a22", border:"1.5px solid #b8922a99", width:"38px", height:"38px", cursor:"pointer", color:"#e0c060", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation", boxShadow:"0 0 8px #00000088" }}>{children}</button>
);

export const EmptyState = ({ icon, title, sub, accent="#2a2418", action }) => (
  <div style={{ textAlign:"center", padding:"56px 24px", animation:"splashIn 0.6s ease both" }}>
    <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:"72px", height:"72px", borderRadius:"50%", border:`1px solid ${accent}55`, marginBottom:"18px", position:"relative" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${accent}22`, transform:"scale(1.25)" }} />
      <span style={{ fontSize:"32px", opacity:0.45, filter:"grayscale(0.4)" }}>{icon}</span>
    </div>
    <CrossDivider color={accent+"44"} />
    <div style={{ color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"14px", letterSpacing:"3px", margin:"16px 0 8px", textTransform:"uppercase" }}>{title}</div>
    <div style={{ fontSize:"13px", color:"#7a6c52", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", maxWidth:"240px", margin:"0 auto", lineHeight:1.5 }}>{sub}</div>
    {action && (
      <button onClick={action.onClick}
        style={{ marginTop:"20px", padding:"11px 22px", background:"#b8922a1a", border:"1px solid #b8922a", color:"#d4b060", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
        {action.label}
      </button>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════

function ConfirmModal({ message, onConfirm, onCancel, accent="#b8922a", confirmLabel="CONFIRMER", danger=false }) {
  // Toujours au premier plan : une confirmation peut être demandée depuis une fiche déjà
  // ouverte (niveau 400, ex. supprimer une relique) — elle s'affichait alors DERRIÈRE la fiche.
  return (
    <Overlay zIndex={5000}>
      <div style={{ background:"#0a0806", border:`1px solid ${accent}44`, borderTop:`2px solid ${accent}`, padding:"24px 20px", width:"100%", maxWidth:"320px", margin:"0 16px" }}>
        <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginBottom:"8px", textAlign:"center" }}>CONFIRMATION</div>
        <div style={{ color:"#d8c8ac", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", marginBottom:"20px", lineHeight:1.6 }}>{message}</div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"14px", background:"#060402", border:"1px solid #1c1c1c", color:"#7a7060", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
            ANNULER
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"14px", background: danger?"#1a0a0a":`${accent}22`, border:`1px solid ${danger?"#7a1515":accent}`, color: danger?"#c04040":accent, fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function useConfirm() {
  const [state, setState] = useState(null);
  const ask = (message, onConfirm, accent, confirmLabel, danger, onCancel) => setState({ message, onConfirm, accent, confirmLabel, danger, onCancel });
  // On ferme AVANT d'exécuter l'action : si l'action ouvre elle-même une nouvelle
  // confirmation, celle-ci n'est plus effacée aussitôt (c'est ce qui bloquait la suppression).
  const cancel = () => { const s = state; setState(null); s?.onCancel && s.onCancel(); };
  const doConfirm = () => { const s = state; setState(null); s?.onConfirm(); };
  // Rendue directement dans la page (portail), comme la fiche d'une relique : sinon, depuis
  // cette fiche, la confirmation restait coincée derrière elle et « Supprimer » était intouchable.
  const modal = state ? createPortal(<ConfirmModal message={state.message} onConfirm={doConfirm} onCancel={cancel} accent={state.accent} confirmLabel={state.confirmLabel||"CONFIRMER"} danger={state.danger||false} />, document.body) : null;
  return [ask, modal];
}

export function NotifyToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const on = (e) => {
      setMsg(e.detail);
      clearTimeout(t);
      if (!e.detail.sticky) t = setTimeout(() => setMsg(null), 5000);
    };
    window.addEventListener("reliquaire:notify", on);
    return () => { window.removeEventListener("reliquaire:notify", on); clearTimeout(t); };
  }, []);
  if (!msg) return null;
  // Au-dessus de tout, fiches ouvertes comprises
  return createPortal(
    <div role="alert" onClick={() => setMsg(null)}
      style={{ position:"fixed", left:"50%", bottom:"calc(92px + env(safe-area-inset-bottom, 0px))", transform:"translateX(-50%)", zIndex:6000, width:"min(90vw, 400px)", boxSizing:"border-box",
        background:"#0a0806f5", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", color:"#e8dfc0", padding:"12px 16px 10px",
        fontFamily:"'Crimson Pro',serif", fontSize:"14.5px", lineHeight:1.4, textAlign:"center", whiteSpace:"pre-line", boxShadow:"0 8px 28px #000d", cursor:"pointer", animation:"viewFade 0.25s ease" }}>
      {msg.text}
      <div style={{ color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", marginTop:"6px" }}>{msg.sticky ? "TOUCHER POUR FERMER" : ""}</div>
    </div>,
    document.body
  );
}

// Petit rouleau de parchemin en SVG (remplace ❦/📜, rendus en émoji couleur sur Android).
export function ScrollGlyph({ size = 14, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign:"-0.15em", ...style }}>
      <path d="M7 3h11a2 2 0 0 1 2 2v2h-4" />
      <path d="M7 3a2 2 0 0 0-2 2v12" />
      <path d="M16 5v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h10v1a3 3 0 0 0 3 3" />
      <path d="M8.5 8h4.5M8.5 12h4.5" />
    </svg>
  );
}

// Croissant fin en SVG pour l'en-tête du Miroir (◐/◑ s'affichaient en gros disques sur Android).
export function Crescent({ flip }) {
  return (
    <svg width="9" height="11" viewBox="0 0 9 11" style={{ verticalAlign:"-1px", transform: flip ? "scaleX(-1)" : "none" }}>
      <path d="M6 0.5a5 5 0 1 0 0 10a7 7 0 0 1 0-10z" fill="currentColor" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
// VIGNETTES LÉGÈRES
// ══════════════════════════════════════════════════════════
// Afficher une photo de 1 400 px dans une case de 150 px oblige le téléphone à la décoder
// entière (environ 6 Mo de mémoire chacune). Ici, chaque photo n'est préparée qu'au moment où
// elle approche de l'écran, en version réduite à la taille utile, puis gardée pour la session.
const thumbCache = new Map();   // taille → Map(photo → Promise<vignette>)
let thumbActive = 0; const thumbQueue = [];
const runThumbs = () => { while (thumbActive < 2 && thumbQueue.length) { const job = thumbQueue.shift(); thumbActive++; job().finally(() => { thumbActive--; runThumbs(); }); } };
function makeThumb(src, px) {
  if (!thumbCache.has(px)) thumbCache.set(px, new Map());
  const bySize = thumbCache.get(px);
  if (bySize.has(src)) return bySize.get(src);
  const p = new Promise(resolve => {
    thumbQueue.push(() => new Promise(done => {
      const img = new Image();
      const finish = (out) => { img.onload = img.onerror = null; img.src = ""; resolve(out); done(); };
      img.onload = () => {
        try {
          const k = Math.min(1, px / Math.max(img.width, img.height));
          if (k >= 0.8) return finish(src);                 // déjà petite : inutile de la réduire
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          let out = c.toDataURL("image/webp", 0.82);
          if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", 0.82);
          c.width = c.height = 0;
          finish(out);
        } catch { finish(src); }
      };
      img.onerror = () => finish(src);
      img.src = src;
    }));
    runThumbs();
  });
  bySize.set(src, p);
  return p;
}

// <Thumb src={photo} px={taille utile en pixels} style={...} /> : remplace <img> dans les listes
export function Thumb({ src, px = 320, alt = "", style, ratio }) {
  const ref = useRef(null);
  const [out, setOut] = useState(null);
  useEffect(() => {
    setOut(null);
    if (!src) return;
    let cancelled = false;
    const go = () => makeThumb(src, px).then(t => { if (!cancelled) setOut(t); });
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { go(); return () => { cancelled = true; }; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [src, px]);
  return out
    ? <img ref={ref} src={out} alt={alt} decoding="async" style={style} />
    : <div ref={ref} style={{ ...style, background:"#0c0a08", ...(ratio ? { aspectRatio: ratio } : {}) }} />;
}
