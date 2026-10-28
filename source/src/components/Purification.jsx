// ══════════════════════════════════════════════════════════
// PURIFICATION d'une relique maudite (après sa cérémonie de consécration)
// ══════════════════════════════════════════════════════════
// 1. la relique apparaît corrompue (teinte du Chaos, nom qui se brouille)
// 2. un éclat d'or balaie l'écran, la corruption se dissipe
// 3. verdict : « PURIFIÉE », durée de la malédiction ; toucher pour clore
import React, { useEffect, useState } from 'react';
import { playSfx } from '../lib/sfx.jsx';
import { CURSE_COLOR, curseFilter } from '../lib/curse.jsx';

export function Purification({ data, onClose }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    playSfx("cloche", 0.5);
    const a = setTimeout(() => { setT(1); playSfx("sceau", 0.8); }, 1700);
    const b = setTimeout(() => setT(2), 2900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const clean = t >= 1;
  return (
    <div onClick={() => t >= 2 && onClose()} style={{ position:"fixed", inset:0, zIndex:4800, background: clean ? "radial-gradient(circle at 50% 42%, #2a2010 0%, #050403 70%)" : "radial-gradient(circle at 50% 42%, #2a0f33 0%, #050205 70%)",
      transition:"background 1.2s ease", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", textAlign:"center", cursor: t >= 2 ? "pointer" : "default", overflow:"hidden" }}>
      <style>{`
        @keyframes pfGlitch { 0%,100% { transform:translate(0,0); } 20% { transform:translate(-2px,1px); } 40% { transform:translate(2px,-1px); } 60% { transform:translate(-1px,-2px); } 80% { transform:translate(1px,2px); } }
        @keyframes pfSweep { from { transform:translateY(-110%); opacity:0.95; } to { transform:translateY(110%); opacity:0; } }
        @keyframes pfRise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
      `}</style>
      {t === 1 && <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 0%, #ffe9a8 48%, #fff6d8 50%, #ffe9a8 52%, transparent 100%)", animation:"pfSweep 1.1s ease-out both", pointerEvents:"none", mixBlendMode:"screen" }} />}
      <div style={{ color: clean ? "#b8922a" : CURSE_COLOR, fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", marginBottom:"18px", transition:"color 1s" }}>
        {clean ? "RITE DE PURIFICATION" : `☠ ${String(data.levelName || "").toUpperCase()}`}
      </div>
      <div style={{ width:"180px", height:"180px", border:`2px solid ${clean ? "#d4b060" : CURSE_COLOR}`, boxShadow: clean ? "0 0 40px #d4b06066" : `0 0 40px ${CURSE_COLOR}88`, overflow:"hidden", background:"#0a0806", transition:"border-color 1s, box-shadow 1s", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {data.photo
          ? <img src={data.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter: clean ? "none" : curseFilter(Math.max(2, data.level || 0)), transition:"filter 1.4s ease" }} />
          : <span style={{ fontSize:"64px", color: clean ? "#d4b060" : CURSE_COLOR, transition:"color 1s" }}>{clean ? "✠" : "☠"}</span>}
      </div>
      <div style={{ color: clean ? "#f0e4c0" : "#d8b8e8", fontSize:"22px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginTop:"20px", lineHeight:1.2,
        animation: clean ? "none" : "pfGlitch 0.25s steps(2) infinite", textShadow: clean ? "0 0 12px #d4b06066" : `2px 0 ${CURSE_COLOR}, -2px 0 #3a8a5a` }}>
        {data.name}
      </div>
      {data.unitName && data.unitName !== data.name && <div style={{ color:"#9a8a6a", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"4px" }}>{data.unitName}</div>}
      {t >= 2 && (
        <div style={{ animation:"pfRise 0.6s ease both", marginTop:"18px", maxWidth:"320px" }}>
          <div style={{ color:"#e0c060", fontSize:"26px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"4px" }}>PURIFIÉE</div>
          <div style={{ color:"#d8c8ac", fontSize:"15px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginTop:"8px" }}>
            {data.days > 0 ? `${data.days} jour${data.days > 1 ? "s" : ""} de malédiction consumé${data.days > 1 ? "s" : ""} par le pinceau.` : "La malédiction n'aura pas tenu un jour."} La souillure est chassée, la relique rejoint les consacrés.
          </div>
          <div style={{ color:"#8a7a58", fontSize:"10.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginTop:"22px" }}>TOUCHER POUR CLORE</div>
        </div>
      )}
    </div>
  );
}
