import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FactionIcon } from './heraldry.jsx';
import { IMG, SIZE, SkullSVG } from './ServoSkull.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { answerArmy, answerNext, answerOath, answerOldest, inspection, ownedArmies } from '../lib/servo.jsx';
import { playSfx } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// LE SERVO-CRÂNE, CONVOQUÉ : questions et inspection du Munitorum
// ══════════════════════════════════════════════════════════
// S'ouvre depuis le bouton du servo-crâne en haut de l'Accueil. Les réponses viennent de
// lib/servo.jsx. Une réponse qui concerne une relique propose de l'ouvrir ; l'inspection liste
// les anomalies, chacune s'ouvre d'un toucher.

const gold = "#b8922a";
const Btn = ({ onClick, children, on }) => (
  <button onClick={onClick}
    style={{ width:"100%", textAlign:"left", padding:"10px 12px", background: on ? `${gold}1c` : "rgba(10,8,6,0.7)", border:`1px solid ${on ? gold : "#2a2418"}`, color: on ? "#e8d4a0" : "#c8b890",
      fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer", touchAction:"manipulation", marginBottom:"6px" }}>{children}</button>
);

// Texte qui s'écrit vite, à la manière d'un terminal
function Typed({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(id); return v; } return v + 3; }), 16);
    return () => clearInterval(id);
  }, [text]);
  return <>{text.slice(0, n)}<span style={{ opacity: n < text.length ? 1 : 0 }}>▍</span></>;
}

export function ServoAssistant({ open, onClose, appState, inventory, ptsMap, onOpenRelic, onNav }) {
  const [mode, setMode] = useState(null);          // null | "next" | "army" | "oath" | "oldest" | "inspect"
  const [army, setArmy] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  useBackButton(open, React.useCallback(() => onClose(), [onClose]));
  useEffect(() => { if (open) { setMode(null); setArmy(null); } }, [open]);
  if (!open) return null;

  const listNames = appState.listNames || {};
  let order = null; try { order = JSON.parse(localStorage.getItem("factionOrder") || "null"); } catch {}
  const armies = ownedArmies(inventory, order);
  const ctx = { inventory, ptsMap, oath: appState.oath, fateChoice: appState.fateChoice, listNames };

  let answer = null, report = null;
  if (mode === "next") answer = answerNext(ctx);
  if (mode === "oath") answer = answerOath(ctx);
  if (mode === "oldest") answer = answerOldest(ctx);
  if (mode === "army" && army) answer = answerArmy({ ...ctx, faction: army });
  if (mode === "inspect") report = inspection({ inventory, ptsMap, wishlist: appState.wishlist || [], orphanInventory: appState.orphanInventory || [] });

  const greeting = mode === "army" && !army ? "Quelle armée dois-je scanner ?"
    : mode === "inspect" ? (report.length ? `Inspection terminée. ${report.reduce((s, r) => s + r.items.length, 0)} points à signaler, en ${report.length} rubrique${report.length > 1 ? "s" : ""}.` : "Inspection terminée. Aucune anomalie. Le Munitorum est déçu : il aime les formulaires.")
    : answer ? answer.text
    : "Servo-crâne 7-Alpha, à tes ordres. Que dois-je analyser ?";
  const ask = (m) => { setMode(m); setArmy(null); playSfx("carte", 0.35, null); };
  const openRelic = (o) => { onClose(); setTimeout(() => onOpenRelic(o.faction, o.itemId), 50); };

  return createPortal(
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:450, background:"rgba(0,0,0,0.86)", display:"flex", alignItems:"flex-end", justifyContent:"center", animation:"viewFade 0.25s ease both" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:"430px", maxHeight:"86dvh", display:"flex", flexDirection:"column", background:"linear-gradient(180deg,#110d08 0%,#070504 100%)", borderTop:`2px solid ${gold}`, boxShadow:"0 -10px 40px #000",
          padding:"14px 14px calc(14px + env(safe-area-inset-bottom, 0px))", boxSizing:"border-box", fontFamily:"'Crimson Pro',serif" }}>

        {/* En-tête : le servo-crâne et sa réponse */}
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-start", flexShrink:0 }}>
          <div style={{ width:`${SIZE}px`, height:`${SIZE}px`, flexShrink:0, animation:"skullBob 2.6s ease-in-out infinite", filter:"drop-shadow(0 4px 8px #000)" }}>
            {imgFailed ? <SkullSVG /> : <img src={IMG(!!mode)} alt="" width={SIZE} height={SIZE} onError={() => setImgFailed(true)} style={{ display:"block" }} />}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:gold, fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"3px" }}>SERVO-CRÂNE 7-ALPHA</span>
              <button onClick={onClose} aria-label="Fermer" style={{ background:"none", border:"none", color:"#8a7a5a", fontSize:"18px", cursor:"pointer", padding:"0 2px" }}>×</button>
            </div>
            <div style={{ marginTop:"4px", background:"rgba(10,8,6,0.94)", border:"1px solid #6a5a3a", padding:"8px 10px", color:"#e0d4b4", fontStyle:"italic", fontSize:"14px", lineHeight:1.45, minHeight:"42px" }}>
              <Typed text={greeting} />
            </div>
            {answer?.open && (
              <button onClick={() => openRelic(answer.open)}
                style={{ marginTop:"6px", background:"none", border:`1px solid ${gold}88`, color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"2px", padding:"6px 10px", cursor:"pointer" }}>OUVRIR LA FICHE ›</button>
            )}
          </div>
        </div>

        {/* Corps : questions, choix d'armée ou rapport d'inspection */}
        <div style={{ overflowY:"auto", marginTop:"12px", flex:1, minHeight:0 }}>
          {mode === "army" && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"10px" }}>
              {armies.map(k => (
                <button key={k} onClick={() => setArmy(k)}
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 10px", background: army === k ? `${FACTIONS[k]?.accent || gold}22` : "rgba(10,8,6,0.7)", border:`1px solid ${army === k ? (FACTIONS[k]?.accent || gold) : "#2a2418"}`, color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11px", cursor:"pointer" }}>
                  <FactionIcon faction={k} size={14} /> {listNames[k] || FACTIONS[k]?.label}
                </button>
              ))}
            </div>
          )}

          {mode === "inspect" && report.map(r => (
            <div key={r.key} style={{ marginBottom:"12px" }}>
              <div style={{ color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px" }}>{r.title.toUpperCase()} · {r.items.length}</div>
              <div style={{ color:"#9a8a6a", fontStyle:"italic", fontSize:"12.5px", margin:"2px 0 6px" }}>{r.hint}</div>
              {r.items.slice(0, 40).map((it, k) => (
                <button key={k} onClick={() => it.open ? openRelic(it.open) : (onClose(), onNav(it.nav))}
                  style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"8px", textAlign:"left", padding:"7px 10px", marginBottom:"3px", background:"rgba(10,8,6,0.6)", border:"1px solid #1c1a16", color:"#d8c8ac", cursor:"pointer", touchAction:"manipulation" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:"12px", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.label}</span>
                  <span style={{ color:"#8a7a5a", fontSize:"11.5px", fontStyle:"italic", whiteSpace:"nowrap", flexShrink:0 }}>{it.sub} ›</span>
                </button>
              ))}
              {r.items.length > 40 && <div style={{ color:"#8a7a5a", fontStyle:"italic", fontSize:"12px" }}>… et {r.items.length - 40} autres.</div>}
            </div>
          ))}

          <div style={{ color:"#7a6c52", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"3px", margin:"4px 0 6px" }}>{mode ? "AUTRE REQUÊTE" : "REQUÊTES"}</div>
          <Btn on={mode === "next"} onClick={() => ask("next")}>⚜︎ Que dois-je peindre ?</Btn>
          <Btn on={mode === "army"} onClick={() => ask("army")}>◈ Où en est mon armée ?</Btn>
          <Btn on={mode === "oath"} onClick={() => ask("oath")}>☩ Où en est mon serment ?</Btn>
          <Btn on={mode === "oldest"} onClick={() => ask("oldest")}>⧗ Qui attend depuis le plus longtemps ?</Btn>
          <Btn on={mode === "inspect"} onClick={() => ask("inspect")}>✠ Inspection du Munitorum</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}
