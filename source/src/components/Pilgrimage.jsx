// ══════════════════════════════════════════════════════════
// LA CARTE DU PÈLERINAGE (onglet CROISADE)
// ══════════════════════════════════════════════════════════
// La flotte avance d'un monde tous les 500 points consacrés. On voit le segmentum en cours :
// 12 mondes sur une route sinueuse, les mondes atteints dorés, la flotte sur le monde actuel.
// Toucher un monde atteint affiche son fragment ; les mondes à venir restent inconnus.
import React, { useEffect, useState } from 'react';
import { PILGRIM_STEP, pilgrimState, worldAt } from '../data/pilgrimage.jsx';

const PER_SEG = 12;
const W = 340, H = 214;
// Route sinueuse : 3 rangées de 4 mondes, en serpentin (gauche → droite, puis retour)
const nodePos = (k) => {
  const row = Math.floor(k / 4), col = k % 4;
  const x = 38 + (row % 2 === 0 ? col : 3 - col) * 88;
  const y = 22 + row * 72 + (col % 2 ? 8 : -4);
  return { x, y };
};
const routePath = (upto = PER_SEG - 1) => {
  let d = "";
  for (let k = 0; k <= upto; k++) {
    const { x, y } = nodePos(k);
    if (k === 0) { d = `M ${x} ${y}`; continue; }
    const p = nodePos(k - 1);
    const turn = k % 4 === 0;   // changement de rangée : grande courbe sur le bord
    if (turn) { const side = (Math.floor(k / 4) % 2 === 1) ? 1 : -1; d += ` C ${p.x + side * 40} ${p.y}, ${x + side * 40} ${y}, ${x} ${y}`; }
    else d += ` Q ${(p.x + x) / 2} ${(p.y + y) / 2 + (k % 2 ? 14 : -14)}, ${x} ${y}`;
  }
  return d;
};
const ROUTE = routePath();
// Nom sur deux lignes au plus (coupé aux espaces), pour rester lisible sous chaque monde
const labelLines = (name) => {
  if (name.length <= 13) return [name];
  const words = name.split(" "); let a = "";
  while (words.length && (a + " " + words[0]).trim().length <= 13) a = (a + " " + words.shift()).trim();
  if (!a) a = words.shift();
  const rest = words.join(" ");
  return [a, rest.length > 14 ? rest.slice(0, 13) + "…" : rest].filter(Boolean);
};

export function PilgrimageMap({ pts, enrolling, seen, onSeen }) {
  const { current, toNext, frac } = pilgrimState(pts);
  const curSeg = Math.floor(current / PER_SEG);
  const [seg, setSeg] = useState(curSeg);
  const [sel, setSel] = useState(current);
  const fresh = seen == null ? null : (current > seen ? current - seen : 0);
  // La carte a été vue : on retient le monde atteint (le rappel de l'Accueil disparaît)
  useEffect(() => { if (!enrolling && onSeen && seen !== current) onSeen(current); }, [current, enrolling]);
  useEffect(() => { setSeg(curSeg); setSel(current); }, [current]);

  const cur = worldAt(current), next = worldAt(current + 1), shown = worldAt(sel);
  const segWorlds = Array.from({ length: PER_SEG }, (_, k) => worldAt(seg * PER_SEG + k));
  const color = segWorlds[0].color;

  if (enrolling) return (
    <div className="hc-bare orn" style={{ background:"linear-gradient(135deg,#0f0c08,#080604)", border:"1px solid #2a2418", borderTop:"2px solid #b8922a", padding:"14px", marginBottom:"12px" }}>
      <div style={{ color:"#b8922a", fontSize:"11.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>☩ LE PÈLERINAGE</div>
      <div style={{ color:"#c8b9a0", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5 }}>La flotte attend à quai, en orbite de Terra. Le voyage commencera à la fin de l'enrôlement, et toutes tes consécrations compteront.</div>
    </div>
  );

  return (
    <div className="hc-bare orn" style={{ background:"linear-gradient(135deg,#0f0c08,#080604)", border:"1px solid #2a2418", borderTop:`2px solid ${cur.color}`, padding:"14px 14px 12px", marginBottom:"12px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"8px" }}>
        <div style={{ color:"#b8922a", fontSize:"11.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>☩ LE PÈLERINAGE</div>
        <div style={{ color:"#9a8a6a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>MONDE {current + 1}</div>
      </div>
      <div style={{ color:"#e8dfc0", fontSize:"17px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginTop:"4px" }}>
        {cur.name}
        {fresh > 0 && <span style={{ marginLeft:"8px", fontSize:"10px", letterSpacing:"2px", color:"#141008", background:"#d4b060", padding:"2px 6px", verticalAlign:"middle" }}>{fresh > 1 ? `+${fresh} MONDES` : "NOUVEAU"}</span>}
      </div>
      <div style={{ color:cur.color, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{cur.segment}</div>

      {/* Navigation entre segmentums déjà ouverts */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px" }}>
        <button onClick={() => setSeg(s => Math.max(0, s - 1))} disabled={seg === 0} aria-label="Segmentum précédent"
          style={{ background:"none", border:"1px solid #2a2418", color: seg === 0 ? "#3a3428" : "#b8922a", width:"34px", height:"30px", cursor: seg === 0 ? "default" : "pointer", fontSize:"14px" }}>‹</button>
        <div style={{ color, fontSize:"11px", letterSpacing:"2.5px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>{segWorlds[0].segment.toUpperCase()}</div>
        <button onClick={() => setSeg(s => Math.min(curSeg, s + 1))} disabled={seg >= curSeg} aria-label="Segmentum suivant"
          style={{ background:"none", border:"1px solid #2a2418", color: seg >= curSeg ? "#3a3428" : "#b8922a", width:"34px", height:"30px", cursor: seg >= curSeg ? "default" : "pointer", fontSize:"14px" }}>›</button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:"block", marginTop:"6px", overflow:"visible" }}>
        <defs>
          <radialGradient id="pg-glow"><stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.9" /><stop offset="100%" stopColor="#d4b060" stopOpacity="0" /></radialGradient>
        </defs>
        {/* étoiles de fond, fixes */}
        {Array.from({ length: 26 }, (_, k) => <circle key={k} cx={(k * 97 + seg * 41) % W} cy={(k * 53 + seg * 17) % H} r={k % 5 === 0 ? 1 : 0.6} fill="#e8dfc0" opacity={0.25} />)}
        <path d={ROUTE} fill="none" stroke="#3a3428" strokeWidth="2" strokeDasharray="3 5" />
        {/* portion parcourue */}
        {(() => {
          const done = seg < curSeg ? PER_SEG - 1 : current - seg * PER_SEG;
          if (done <= 0) return null;
          return <path d={routePath(Math.min(PER_SEG - 1, done))} fill="none" stroke={color} strokeWidth="2" opacity="0.6" />;
        })()}
        {segWorlds.map((w, k) => {
          const { x, y } = nodePos(k);
          const reached = w.index <= current, isCur = w.index === current, isSel = w.index === sel;
          return (
            <g key={k} onClick={() => reached && setSel(w.index)} style={{ cursor: reached ? "pointer" : "default" }}>
              {isCur && <circle cx={x} cy={y} r="17" fill="url(#pg-glow)" />}
              <circle cx={x} cy={y} r={isCur ? 8 : 6} fill={reached ? (isCur ? "#ffe9a8" : color) : "#0a0806"} stroke={reached ? "#d4b060" : "#4a4030"} strokeWidth={isSel ? 2.5 : 1.2} />
              <text x={x} y={y + 20} textAnchor="middle" fontSize="8.5" fontFamily="Cinzel, serif" fill={reached ? "#d8c8ac" : "#5a5040"}>
                {(reached ? labelLines(w.name) : ["?"]).map((l, j) => <tspan key={j} x={x} dy={j ? 10 : 0}>{l}</tspan>)}
              </text>
              {/* hit-zone confortable au doigt */}
              <circle cx={x} cy={y} r="18" fill="transparent" />
            </g>
          );
        })}
      </svg>

      {/* Fragment du monde choisi */}
      <div style={{ borderLeft:`2px solid ${shown.color}`, padding:"6px 10px", marginTop:"4px", background:"#0a080666" }}>
        <div style={{ color:shown.color, fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>{shown.name.toUpperCase()}</div>
        <div style={{ color:"#d8c8ac", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45, marginTop:"2px" }}>{shown.text}</div>
      </div>

      {/* Prochain monde */}
      <div style={{ marginTop:"10px" }}>
        <div style={{ height:"3px", background:"#1a1610" }}><div style={{ width:`${Math.round(frac * 100)}%`, height:"100%", background:"#d4b060" }} /></div>
        <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", marginTop:"5px" }}>
          Encore <span style={{ color:"#e0c060" }}>{toNext.toLocaleString("fr")} pts</span> à consacrer pour atteindre le monde suivant{next.segment !== cur.segment ? <> et entrer dans le <span style={{ color:next.color }}>{next.segment}</span></> : null}. <span style={{ opacity:0.7 }}>({PILGRIM_STEP} pts par monde)</span>
        </div>
      </div>
    </div>
  );
}
