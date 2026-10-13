import React, { useEffect, useRef, useState } from 'react';
import { findUnit } from '../data/units.jsx';

// ══════════════════════════════════════════════════════════
// LE SERVO-CRÂNE DE L'ATELIER
// ══════════════════════════════════════════════════════════
// De temps en temps, un servo-crâne traverse l'Accueil. Si on le touche, il lâche une
// remarque, « scanne » une figurine… ou repart vexé sans un mot.

const QUIPS = [
  "Inventaire en cours. Veuillez ne pas bouger vos reliques.",
  "Taux de poussière sur l'établi : préoccupant. Signalement transmis.",
  "Pinceau n° 3 : poils en rébellion. Surveillance renforcée.",
  "Scan des pots de peinture… 4 pots secs détectés. Condoléances.",
  "Ce servo-crâne n'a rien vu. Ce servo-crâne ne dira rien.",
  "Bip. Bip bip. Traduction : l'Empereur protège.",
  "Batterie à 12 %. Je repasserai. Peut-être.",
  "Analyse : l'eau de rinçage a été confondue avec le café 3 fois ce mois-ci.",
  "Relevé d'atelier : trois pinceaux, dont un seul digne de ce nom.",
  "Figurine détectée sous le canapé. Sauvetage non prioritaire.",
  "Mise à jour des litanies… 3 %. Ne pas éteindre le servo-crâne.",
  "Taux de colle sur les doigts : nominal.",
  "Je consigne tout. Y compris ce que tu viens de dire à ce transfert.",
  "Analyse spectrale : ce rouge n'est pas le même que la dernière fois.",
  "Rappel du Munitorum : sous-coucher par temps humide est une hérésie mineure.",
  "Mémoire saturée. Suppression des souvenirs de ma vie d'avant. Terminé.",
  "L'esprit de la machine de ta lampe d'établi réclame une prière. Ou une ampoule.",
  "Comptage des grappes vides : je préfère ne pas donner le chiffre.",
  "Un poil dans le vernis. Ce n'est pas le mien. Je n'en ai plus.",
  "Patrouille terminée. Aucune hérésie. Quelques bavures.",
  "Requête : cesser de lécher le pinceau. Requête ignorée 41 fois.",
  "Ce pot était fermé, selon toi. Les faits disent autre chose.",
  "Je flotte, donc je sers.",
  "Transmission du Chapelain : « Moins de vidéos de peinture, plus de peinture. »",
];
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

const daysSince = (s) => { if (!s) return null; const d = new Date(String(s).length === 7 ? s + "-15" : String(s).slice(0,10)); return isNaN(d) ? null : Math.max(0, Math.floor((Date.now() - d) / 86400000)); };

function scanLine(inventory, paintHistory) {
  const painted = inventory.filter(i => i.paintStatus === "painted");
  const todo = inventory.filter(i => i.paintStatus !== "painted");
  const r = Math.random();
  if (painted.length && r < 0.55) {
    const pool = painted.filter(i => i.nickname).length ? painted.filter(i => i.nickname) : painted;
    const it = pool[Math.floor(Math.random() * pool.length)];
    const name = it.nickname || findUnit(it.faction, it.unitId)?.name || "Relique";
    const last = (paintHistory||[]).filter(h => h.id === it.id).map(h => h.day || h.date).sort().pop() || it.paintedAt;
    const d = daysSince(last);
    const age = d != null ? `${d} jour${d > 1 ? "s" : ""}` : null;
    return { scan: true, text: pickOne([
      `${name}. ${age ? `Consacré il y a ${age}. ` : ""}Aucune trace de gris. Conforme.`,
      `${name}. Pigments stables, honneur intact.${age ? ` Âge de la consécration : ${age}.` : ""}`,
      `Analyse de ${name}… Lignes de moulage : introuvables. Félicitations consignées.`,
      `${name}. Je l'ai regardé longtemps. C'est très bien. Ne le répète pas.`,
      `${name}${age ? `, consacré depuis ${age}` : ""}. Poussière : négligeable. Gloire : mesurable.`,
    ]) };
  }
  if (todo.length && r < 0.85) {
    const it = todo[Math.floor(Math.random() * todo.length)];
    const name = it.nickname || findUnit(it.faction, it.unitId)?.name || "Relique";
    const st = { sprue:"sur grappe", unpainted:"montée", built:"montée", primed:"sous-couchée", wip:"en cours" }[it.paintStatus] || "en attente";
    return { scan: true, text: pickOne([
      `${name}. Statut : ${st}. Patience notée. Aucune sanction prévue.`,
      `${name}. Statut : ${st}. Le Chapelain a été prévenu. Il soupire.`,
      `${name}. Statut : ${st}. Elle attend. Elle a l'habitude.`,
      `${name}. Statut : ${st}. Délai avant consécration : inconnu. Comme toujours.`,
      `Scan de ${name}… Gris détecté. Beaucoup de gris.`,
    ]) };
  }
  return null;
}

// Images du servo-crâne (public/) : normale, et « scan » (œil chargé d'énergie).
// Œil situé à 61 % de la largeur et 43 % de la hauteur de l'image : départ du rayon.
export const SIZE = 64;
export const EYE = { x: SIZE * 0.613, y: SIZE * 0.426 };
export const IMG = (scan) => `${import.meta.env.BASE_URL}${scan ? "servo-crane-scan.png" : "servo-crane.png"}`;

// Dessin de secours, si les images ne sont pas (encore) sur le site : jamais d'image cassée
export const SkullSVG = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 46 52" aria-hidden="true">
    <defs>
      <radialGradient id="sk-bone" cx="45%" cy="35%" r="65%"><stop offset="0%" stopColor="#efe6cf"/><stop offset="100%" stopColor="#a89878"/></radialGradient>
      <radialGradient id="sk-eye" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffb0a0"/><stop offset="45%" stopColor="#ff3020"/><stop offset="100%" stopColor="#7a0a0a"/></radialGradient>
    </defs>
    <line x1="30" y1="6" x2="36" y2="0" stroke="#8a8070" strokeWidth="1.5"/><circle cx="36" cy="1" r="1.4" fill="#ff5040"/>
    <path d="M23 5c-9 0-15 6.5-15 14.5 0 4.5 2 7.6 4.6 9.6V34h20.8v-4.9C36 27.1 38 24 38 19.5 38 11.5 32 5 23 5z" fill="url(#sk-bone)" stroke="#5a5040" strokeWidth="1"/>
    <ellipse cx="17" cy="20" rx="4.2" ry="4.6" fill="#1a1410"/>
    <circle cx="29.5" cy="20" r="5.2" fill="#2a2a2a" stroke="#6a6a6a" strokeWidth="1.2"/><circle cx="29.5" cy="20" r="3.3" fill="url(#sk-eye)"/>
    <path d="M21.5 26.5l1.5-2.5 1.5 2.5z" fill="#1a1410"/>
    <path d="M15.5 30.5h15M18 30.5v3.5M21 30.5v3.5M24 30.5v3.5M27 30.5v3.5" stroke="#5a5040" strokeWidth="0.9"/>
    <path d="M17 34h12l-2 5h-8z" fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.8"/>
    <ellipse cx="23" cy="44" rx="11" ry="3.2" fill="none" stroke="#60c0e0" strokeWidth="1.4" opacity="0.8"/>
    <ellipse cx="23" cy="44" rx="7" ry="1.8" fill="#60c0e0" opacity="0.25"/>
  </svg>
);

// Rayon de scan : part de l'œil, légèrement vers le bas, et scintille
const Beam = () => (
  <svg width="150" height="60" viewBox="0 0 150 60" aria-hidden="true"
    style={{ position:"absolute", left:`${EYE.x}px`, top:`${EYE.y - 8}px`, overflow:"visible", pointerEvents:"none", animation:"beamFlicker 0.18s steps(2) infinite", filter:"drop-shadow(0 0 4px #ff2a1a)" }}>
    <defs>
      <linearGradient id="beam-g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffe0d8" stopOpacity="1"/>
        <stop offset="18%" stopColor="#ff3a2a" stopOpacity="0.95"/>
        <stop offset="100%" stopColor="#ff1a0a" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="0,6 150,22 150,40 0,10" fill="url(#beam-g)" />
  </svg>
);

// news : la nouvelle du jour (lib/servo.jsx, servoNews), ou null. S'il y en a une, le servo-crâne
// passe à coup sûr, s'arrête au milieu de l'écran et l'annonce ; toucher la bulle ouvre la relique.
export function ServoSkull({ inventory = [], paintHistory = [], hidden = false, news = null, onNewsShown, onNewsOpen }) {
  const [visit, setVisit] = useState(null);     // { top, ltr, key }
  const [bubble, setBubble] = useState(null);
  const [imgFailed, setImgFailed] = useState(false); // image absente du site → dessin de secours
  const animRef = useRef(null);
  const elRef = useRef(null);
  useEffect(() => { const i = new Image(); i.src = IMG(true); }, []); // image de scan prête à l'emploi
  const newsRef = useRef(news); newsRef.current = news;

  // Une chance sur deux de passer, quelques secondes après l'arrivée sur l'Accueil
  useEffect(() => {
    try { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch {}
    const hasNews = !!newsRef.current;
    const t = setTimeout(() => {
      if (hasNews || Math.random() < 0.5) setVisit({ top: 18 + Math.random() * 50, ltr: Math.random() < 0.5, key: Date.now(), news: hasNews });
    }, hasNews ? 4000 + Math.random() * 3000 : 5000 + Math.random() * 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visit || !elRef.current) return;
    const W = window.innerWidth;
    const from = visit.ltr ? -60 : W + 10, to = visit.ltr ? W + 10 : -60;
    const a = elRef.current.animate(
      [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
      { duration: 16000, easing: "linear", fill: "forwards" });
    animRef.current = a;
    a.onfinish = () => { setVisit(null); setBubble(null); };
    // Nouvelle du jour : arrêt au milieu de l'écran, annonce, puis il repart
    let t1, t2;
    if (visit.news && newsRef.current) {
      t1 = setTimeout(() => {
        const n = newsRef.current; if (!n) return;
        a.pause(); place();
        setBubble({ text: n.text, news: n, scan: true });
        onNewsShown && onNewsShown();
        t2 = setTimeout(() => { setBubble(b => (b && b.news ? null : b)); a.playbackRate = 1.4; a.play(); }, 7000);
      }, 16000 * 0.42);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); a.cancel(); };
  }, [visit]);

  // Côté et largeur de la bulle, choisis au moment du toucher selon la place réelle à l'écran :
  // avant, elle partait toujours dans le sens du vol et sortait de l'écran près d'un bord.
  const placeRef = useRef({ side: "right", w: 190 });
  const place = () => {
    try {
      const r = elRef.current.getBoundingClientRect(), W = window.innerWidth;
      const right = W - r.right - 12, left = r.left - 12;   // place disponible de chaque côté (marge 6 + 6)
      const side = right >= left ? "right" : "left";
      placeRef.current = { side, w: Math.max(120, Math.min(190, Math.max(right, left))) };
    } catch { placeRef.current = { side: visit?.ltr ? "right" : "left", w: 190 }; }
  };
  const onTap = (e) => {
    e.stopPropagation();
    if (bubble) return;
    const a = animRef.current; if (a) a.pause();
    place();
    const r = Math.random();
    let text, vexed = false, scan = false;
    if (r < 0.15) { text = "…"; vexed = true; }
    else {
      const sc = r < 0.65 ? scanLine(inventory, paintHistory) : null;
      if (sc) { text = sc.text; scan = true; } else text = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    }
    setBubble({ text, vexed, scan });
    setTimeout(() => {
      setBubble(vexed ? { text: "(le servo-crâne repart, vexé)", vexed: true, aside: true } : null);
      if (a) { a.playbackRate = vexed ? 3 : 1.4; a.play(); }
      if (vexed) setTimeout(() => setBubble(null), 1800);
    }, vexed ? 1400 : 3800);
  };

  if (!visit) return null;
  // Une fenêtre est ouverte : il file hors de vue (sa traversée continue en coulisse)
  const hideStyle = hidden ? { opacity:0, pointerEvents:"none", transition:"opacity 0.3s" } : { opacity:1, transition:"opacity 0.3s" };
  return (
    <div style={{ position:"fixed", top:`${visit.top}%`, left:0, zIndex:3, pointerEvents:"none", ...hideStyle }}>
      <div ref={elRef} style={{ position:"relative", width:`${SIZE}px` }}>
        <div onClick={onTap} role="button" aria-label="Servo-crâne"
          style={{ position:"relative", pointerEvents: hidden ? "none" : "auto", cursor:"pointer", animation:"skullBob 2.6s ease-in-out infinite", filter:"drop-shadow(0 4px 8px #000)", transform: visit.ltr ? "none" : "scaleX(-1)" }}>
          {imgFailed
            ? <SkullSVG />
            : <img src={IMG(!!bubble?.scan)} alt="" width={SIZE} height={SIZE} draggable="false" onError={() => setImgFailed(true)} style={{ display:"block", width:`${SIZE}px`, height:`${SIZE}px` }} />}
          {bubble?.scan && <Beam />}
        </div>
        {bubble && (
          <div style={{ position:"absolute", top: bubble.scan ? "-34px" : "-8px", left: placeRef.current.side === "right" ? `${SIZE + 6}px` : "auto", right: placeRef.current.side === "left" ? `${SIZE + 6}px` : "auto", width:`${placeRef.current.w}px`,
            background: bubble.aside ? "none" : "rgba(10,8,6,0.94)", border: bubble.aside ? "none" : `1px solid ${bubble.news ? "#b8922a" : "#6a5a3a"}`, padding: bubble.aside ? 0 : "8px 10px",
            color: bubble.aside ? "#9a8a6a" : "#e0d4b4", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", fontSize:"13px", lineHeight:1.4,
            boxShadow: bubble.aside ? "none" : "0 4px 16px #000c", animation:"viewFade 0.25s ease both",
            pointerEvents: bubble.news && !hidden ? "auto" : "none", cursor: bubble.news ? "pointer" : "default" }}
            onClick={bubble.news ? (e) => { e.stopPropagation(); const o = bubble.news.open; setBubble(null); const a = animRef.current; if (a) { a.playbackRate = 1.4; a.play(); } if (o && onNewsOpen) onNewsOpen(o); } : undefined}>
            {bubble.text}
            {bubble.news?.open && <div style={{ fontStyle:"normal", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", color:"#e0c060", marginTop:"5px" }}>TOUCHER POUR OUVRIR ›</div>}
          </div>
        )}
      </div>
    </div>
  );
}
