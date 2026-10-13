import React, { useState, useEffect } from 'react';
import { FACTIONS } from '../data/factions.jsx';
import { getModelCount } from '../data/points.jsx';
import { PAINT_STATUS, UNITS_DB, findUnit } from '../data/units.jsx';
import { FactionIcon } from '../components/heraldry.jsx';

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════

export function SplashOverlay({ inventory, lists, ptsMap, onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "hold" | "out"
  const totalModels  = inventory.reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
  const painted      = inventory.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
  const paintPct     = totalModels ? Math.round(painted/totalModels*100) : 0;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2600);
    const t2 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const factionSummary = Object.entries(FACTIONS).map(([k,f]) => {
    const items = inventory.filter(i=>i.faction===k);
    const models = items.reduce((s,i)=>{ const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
    // Figurines réellement peintes (et pas le nombre de lignes/boîtes), comme le total `models`
    const p = items.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
    return { key:k, f, models, painted:p };
  }).filter(s=>s.models>0);
  const paintedFactionsCount = Object.keys(FACTIONS).filter(fKey =>
    inventory.some(i => i.faction===fKey && i.paintStatus==="painted" && UNITS_DB[fKey]?.some(u=>u.id===i.unitId))
  ).length;

  return (
    <div onClick={onDone} style={{
      position:"fixed", inset:0, zIndex:9999, background:"#020202",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden",
      fontFamily:"'Cinzel',serif", cursor:"pointer",
      opacity: phase==="out" ? 0 : 1,
      transition: phase==="out" ? "opacity 0.6s ease" : "none",
      maxWidth:"430px", margin:"0 auto",
    }}>
      {/* Fond : le reliquaire (public/fonds/ouverture.jpg). Le haut et le bas sont assombris
          pour les textes ; le centre, avec l'emblème, reste bien visible. */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`url(${import.meta.env.BASE_URL}fonds/ouverture.jpg)`, backgroundSize:"cover", backgroundPosition:"center 38%", animation:"breathe 20s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"linear-gradient(180deg, #020202f2 0%, #02020299 13%, transparent 26%, transparent 46%, #020202b3 60%, #020202f5 76%, #020202 100%)" }} />

      <div style={{ position:"relative", width:"100%", height:"100%", maxWidth:"340px", padding:"calc(26px + env(safe-area-inset-top, 0px)) 24px calc(22px + env(safe-area-inset-bottom, 0px))", boxSizing:"border-box", display:"flex", flexDirection:"column", justifyContent:"space-between", animation:"splashIn 0.5s ease both" }}>
        {/* Title */}
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"#efe4c4", fontSize:"21px", letterSpacing:"7px", fontFamily:"'Cinzel Decorative',serif", fontWeight:"900", textShadow:"0 2px 18px #000, 0 0 30px #b8922a55" }}>RELIQUAIRE 40K</div>
          <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"4px", marginTop:"5px", textShadow:"0 2px 10px #000" }}>CODEX ASTARTES</div>
        </div>

        {/* Bas de l'écran : état de la force */}
        <div>

        {inventory.length > 0 && (<>
          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"20px" }}>
            <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,transparent,#2a2215)" }} />
            <div style={{ color:"#c8b49a", fontSize:"11px", letterSpacing:"4px" }}>ÉTAT DE LA FORCE</div>
            <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,#2a2215,transparent)" }} />
          </div>

          {/* Big stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"20px", animation:"statSlide 0.5s 0.2s ease both" }}>
            {[
              { val: totalModels, label:"FIGURINES" },
              { val: `${paintPct}%`, label:"PEINT" },
              { val: paintedFactionsCount, label:"ARMÉES" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(10,8,6,0.72)", border:"1px solid #2a2418", padding:"12px 8px", textAlign:"center" }}>
                <div style={{ color:"#b8922a", fontSize:"22px", fontWeight:"900", lineHeight:1 }}>{s.val}</div>
                <div style={{ color:"#c8b49a", fontSize:"10px", letterSpacing:"2px", marginTop:"4px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Paint bar */}
          <div style={{ marginBottom:"20px", animation:"statSlide 0.5s 0.35s ease both" }}>
            <div style={{ display:"flex", height:"3px", gap:"1px", marginBottom:"6px" }}>
              {["painted","wip","primed","unpainted"].map(status => {
                const cnt = inventory.filter(i=>(i.paintStatus||"unpainted")===status).reduce((s,i)=>s+i.qty,0);
                return cnt>0 ? <div key={status} style={{ flex:cnt, background:PAINT_STATUS[status].color, transition:"flex 0.8s" }} /> : null;
              })}
            </div>
          </div>

          {/* Faction breakdown */}
          {factionSummary.length>0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"6px", animation:"statSlide 0.5s 0.5s ease both" }}>
              {factionSummary.map(({ key, f, models, painted }) => {
                const pct = models ? Math.round(painted/models*100) : 0;
                return (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ width:"20px", textAlign:"center", color:f.accent }}><FactionIcon faction={key} factionDef={f} size={16} /></span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", height:"2px", background:"#0f0f0f", marginBottom:"3px" }}>
                        <div style={{ width:`${pct}%`, background: pct===100?"#2a7a2a":f.accent, transition:"width 1s 0.5s" }} />
                      </div>
                    </div>
                    <span style={{ color:"#c8b49a", fontSize:"11px", width:"28px", textAlign:"right" }}>{models} fig</span>
                    <span style={{ color: pct===100?"#2a7a2a":f.accent, fontSize:"12px", fontWeight:"700", width:"32px", textAlign:"right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* Tap hint */}
        <div style={{ textAlign:"center", marginTop:"22px", color:"#b8a882", fontSize:"11px", letterSpacing:"3px", animation:"pulse 2s 1s infinite" }}>
          TOUCHER POUR ENTRER
        </div>
        </div>
      </div>
    </div>
  );
}
