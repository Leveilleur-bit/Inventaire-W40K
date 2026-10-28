import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { pageFond, pageStyle } from '../components/ui.jsx';
import { FACTIONS, FACTION_LORE, armyEpic, factionTier, factionTitle, generateArmyLore } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { ROLE_ORDER, UNITS_DB, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { orderedFactionEntries } from '../lib/utils.jsx';
import { FactionIcon } from '../components/heraldry.jsx';
import { PilgrimageMap } from '../components/Pilgrimage.jsx';

const GOAL_PRESETS = [1000, 2000, 3000, 5000, 7500, 10000, 15000];
const fmt = (n) => Number(n).toLocaleString("fr");

// Feuille pour régler l'objectif de points d'une armée : saisie, boutons ± 500, valeurs usuelles
function GoalSheet({ f, name, total, goal, onSave, onClose }) {
  const [val, setVal] = useState(String(goal));
  const n = parseInt(val, 10);
  const valid = Number.isFinite(n) && n >= 100 && n <= 100000;
  const step = (d) => setVal(String(Math.max(100, Math.min(100000, (valid ? n : goal) + d))));
  const pct = valid ? Math.min(100, Math.round(total / n * 100)) : null;
  const acc = f.accent;
  return createPortal(
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:450, background:"rgba(0,0,0,0.82)", display:"flex", alignItems:"center", justifyContent:"center", padding:"18px" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"340px", maxHeight:"92dvh", overflowY:"auto", background:"linear-gradient(180deg,#120e08 0%,#080604 100%)", border:`1px solid ${acc}66`, borderTop:`2px solid ${acc}`, padding:"18px 16px", animation:"splashIn 0.25s ease both" }}>
        <div style={{ color:"#b8a882", fontSize:"10.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>OBJECTIF DE POINTS</div>
        <div style={{ color:"#efe4c4", fontSize:"17px", fontFamily:"'Cinzel',serif", fontWeight:700, textAlign:"center", margin:"4px 0 14px" }}>{name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <button onClick={() => step(-500)} aria-label="Moins 500" style={{ width:"48px", height:"48px", background:"none", border:"1px solid #4a3e28", color:"#d4b060", fontSize:"15px", fontFamily:"'Cinzel',serif", cursor:"pointer" }}>−500</button>
          <input value={val} onChange={e => setVal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" aria-label="Objectif en points"
            style={{ flex:1, minWidth:0, height:"48px", textAlign:"center", background:"#060402", border:`1px solid ${valid ? acc + "88" : "#a04040"}`, color:"#f0e6c8", fontSize:"22px", fontFamily:"'Cinzel',serif", outline:"none" }} />
          <button onClick={() => step(500)} aria-label="Plus 500" style={{ width:"48px", height:"48px", background:"none", border:"1px solid #4a3e28", color:"#d4b060", fontSize:"15px", fontFamily:"'Cinzel',serif", cursor:"pointer" }}>+500</button>
        </div>
        <div style={{ color: valid ? "#b8a882" : "#d08060", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", margin:"8px 0 12px" }}>
          {valid ? `Avec ${fmt(total)} pts peints, tu serais à ${pct} % de cet objectif.` : "Entre un nombre de points entre 100 et 100 000."}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center", marginBottom:"16px" }}>
          {GOAL_PRESETS.map(v => (
            <button key={v} onClick={() => setVal(String(v))}
              style={{ padding:"6px 10px", background: n === v ? `${acc}26` : "none", border:`1px solid ${n === v ? acc : "#3a3020"}`, color: n === v ? "#f0d070" : "#b0a080", fontFamily:"'Cinzel',serif", fontSize:"11.5px", cursor:"pointer" }}>{fmt(v)}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:"none", border:"1px solid #4a3e28", color:"#b0a080", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1.5px", cursor:"pointer" }}>ANNULER</button>
          <button onClick={() => valid && onSave(n)} disabled={!valid}
            style={{ flex:1.3, padding:"11px", background: valid ? `${acc}26` : "none", border:`1px solid ${valid ? acc : "#3a3020"}`, color: valid ? "#f0d070" : "#6a5c44", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor: valid ? "pointer" : "default" }}>VALIDER</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ViewLists({ inventory, ptsMap, listNames, listGoals, onSetName, onSetGoal, enrolling, pilgrimSeen, onPilgrimSeen }) {
  const [goalFor, setGoalFor] = useState(null);   // armée dont on règle l'objectif de points
  useBackButton(!!goalFor, React.useCallback(() => setGoalFor(null), []));
  const [editingFaction, setEditingFaction] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [selectedFaction, setSelectedFaction] = useState(null);
  useBackButton(!!selectedFaction, React.useCallback(() => setSelectedFaction(null), []));

  // Construire les listes auto par faction
  const factionLists = orderedFactionEntries().map(([fKey, f]) => {
    const painted = inventory.filter(i => i.faction===fKey && i.paintStatus==="painted" && UNITS_DB[fKey]?.some(u=>u.id===i.unitId));
    const total = painted.reduce((s,i) => {
      const u = findUnit(fKey, i.unitId);
      const pts = ptsMap[`${fKey}:${i.unitId}`] || (u?POINTS_DB[u.name]:0) || 0;
      return s + pts * (i.qty||1);
    }, 0);
    // Nombre de FIGURINES peintes (pas le nombre de lignes d'inventaire) : une
    // escouade de 10 figurines entièrement peinte doit compter pour 10, pas pour 1.
    const paintedModels = painted.reduce((s,i) => {
      const u = findUnit(fKey, i.unitId);
      return s + getModelCount(u?.name, i.qty||1, i.modelCount);
    }, 0);
    const name = listNames?.[fKey] || f.label;
    const goal = listGoals?.[fKey] || 2000;
    return { fKey, f, painted, paintedModels, total, name, goal };
  }).filter(l => l.painted.length > 0);

  // Vue détail d'une faction
  if (selectedFaction) {
    const f = FACTIONS[selectedFaction];
    const painted = inventory.filter(i => i.faction===selectedFaction && i.paintStatus==="painted" && UNITS_DB[selectedFaction]?.some(u=>u.id===i.unitId));
    const name = listNames?.[selectedFaction] || f.label;
    const goal = listGoals?.[selectedFaction] || 2000;
    const total = painted.reduce((s,i) => {
      const u = findUnit(selectedFaction, i.unitId);
      const pts = ptsMap[`${selectedFaction}:${i.unitId}`] || (u?POINTS_DB[u.name]:0) || 0;
      return s + pts * (i.qty||1);
    }, 0);
    const paintedModels = painted.reduce((s,i) => {
      const u = findUnit(selectedFaction, i.unitId);
      return s + getModelCount(u?.name, i.qty||1, i.modelCount);
    }, 0);
    // Grouper par rôle
    const grouped = {};
    ROLE_ORDER.forEach(r => { grouped[r] = []; });
    painted.forEach(i => {
      const u = findUnit(selectedFaction, i.unitId);
      const role = u?.role || "Autre";
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push({ ...i, unitName: u?.name || i.unitId });
    });
    const usedRoles = ROLE_ORDER.filter(r => grouped[r]?.length > 0);

    return (
      <div style={{...pageStyle, ...pageFond("lists")}} className="bg-lists">
        <div style={{ background:"linear-gradient(180deg,#0a0808 0%,#050505 100%)", borderBottom:"1px solid #0d0b08", padding:"14px 16px 12px", flexShrink:0 }}>
          <button onClick={() => setSelectedFaction(null)} style={{ background:"none", border:"none", color:"#c8b9a0", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", marginBottom:"8px", padding:0 }}>← RETOUR</button>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ color:"#e8dfc0", fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}><FactionIcon faction={selectedFaction} factionDef={f} size={22} /> {name}</div>
              <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif", marginTop:"2px" }}>{paintedModels} FIGURINES · {total.toLocaleString('fr')} PTS</div>
              <div style={{ color:f.accent, fontSize:"11.5px", fontFamily:"'Cinzel',serif", fontStyle:"italic", marginTop:"3px", opacity:0.9 }}>{factionTitle(selectedFaction, total)}</div>
              {paintedModels >= 3 && (
                <div style={{ color:"#d2c3a6", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45, marginTop:"8px", maxWidth:"300px", padding:"8px 11px", backgroundColor:"#0a0806", backgroundImage:`linear-gradient(180deg, rgba(10,8,6,0.22) 0%, rgba(10,8,6,0.38) 100%), url(${import.meta.env.BASE_URL}fonds/parchemin.jpg)`, backgroundSize:"cover", backgroundPosition:"center", borderLeft:`2px solid ${f.accent}66`, boxShadow:"inset 0 0 18px #000a", textShadow:"0 1px 3px #000" }}>
                  {generateArmyLore(grouped, painted.length, selectedFaction)}
                  {/* Le récit s'étoffe à chaque rang (fait d'armes, renommée, légende) */}
                  {(() => {
                    const epic = armyEpic({ faction:selectedFaction, tier:factionTier(selectedFaction, total), heroes: painted.filter(i => i.nickname).map(i => i.nickname), armyName:name, seedKey:selectedFaction + ":" + factionTier(selectedFaction, total) });
                    return epic ? <div style={{ marginTop:"6px", color:"#e0d0a8" }}>{epic}</div> : null;
                  })()}
                </div>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:f.accent, fontSize:"28px", fontFamily:"'Cinzel',serif", fontWeight:"900", lineHeight:1.1 }}>{Math.min(100,Math.round(total/goal*100))}%</div>
              <button onClick={() => setGoalFor(selectedFaction)} aria-label="Modifier l'objectif de points"
                style={{ background:"none", border:"none", padding:"4px 0", cursor:"pointer", color:"#9a8a6a", fontSize:"10.5px", letterSpacing:"1.5px", fontFamily:"'Cinzel',serif" }}>
                / {goal.toLocaleString('fr')} pts <span style={{ color:f.accent }}>✎</span>
              </button>
            </div>
          </div>
          <div style={{ height:"3px", background:"#0a0806", marginTop:"8px" }}>
            <div style={{ width:`${Math.min(100,Math.round(total/goal*100))}%`, height:"100%", background:f.accent }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
          {FACTION_LORE[selectedFaction] && (
            <div className="hc-bare orn" style={{ borderLeft:`2px solid ${f.accent}44`, background:"rgba(8,6,4,0.3)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", padding:"6px 10px", marginBottom:"10px" }}>
              <div className="lettrine" style={{ color:"#c8b9a0", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5 }}>{FACTION_LORE[selectedFaction]}</div>
            </div>
          )}
          {usedRoles.map(role => (
            <div key={role}>
              <div style={{ color:"#9a7a4a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", padding:"6px 4px 2px", textShadow:"0 1px 4px #000, 0 0 8px #000" }}>{role.toUpperCase()}</div>
              {grouped[role].map(item => {
                const u = findUnit(selectedFaction, item.unitId);
                const pts = ptsMap[`${selectedFaction}:${item.unitId}`] || (u?POINTS_DB[u.name]:0) || 0;
                return (
                  <div key={item.id} className="hc-bare" style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 8px", background:"rgba(10,8,6,0.36)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", border:"1px solid #0d0b0899", marginBottom:"3px" }}>
                    {item.photo ? <img src={item.photo} style={{ width:"28px", height:"28px", objectFit:"cover", flexShrink:0 }} /> : <div style={{ width:"28px", height:"28px", background:"#050302", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#1a1a1a", fontSize:"14px" }}>⚔</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ color:"#e8dfc0", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{item.unitName}</span>
                      {(item.qty||1) > 1 && <span style={{ color:"#c8b9a0", fontSize:"12px", marginLeft:"5px" }}>×{item.qty||1}</span>}
                      {item.nickname && <div style={{ color:f.accent, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", opacity:0.85, lineHeight:1.2 }}>« {item.nickname} »</div>}
                    </div>
                    <div style={{ color:f.accent, fontSize:"12.5px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{pts * (item.qty||1)}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* ── À peindre ── */}
          {(() => {
            const unpainted = inventory.filter(i => i.faction===selectedFaction && i.paintStatus!=="painted" && UNITS_DB[selectedFaction]?.some(u=>u.id===i.unitId));
            if (!unpainted.length) return null;
            const unpaintedPts = unpainted.reduce((s,i) => {
              const u = findUnit(selectedFaction, i.unitId);
              const pts = ptsMap[`${selectedFaction}:${i.unitId}`] || (u?POINTS_DB[u.name]:0) || 0;
              return s + pts * (i.qty||1);
            }, 0);
            return (
              <div style={{ marginTop:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 4px 4px", borderTop:"1px solid #0d0b08" }}>
                  <div style={{ color:"#96523b", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textShadow:"0 1px 4px #000, 0 0 8px #000" }}>À PEINDRE</div>
                  <div style={{ color:"#96523b", fontSize:"11.5px", fontFamily:"'Cinzel',serif", textShadow:"0 1px 4px #000, 0 0 8px #000" }}>{unpaintedPts.toLocaleString('fr')} pts potentiels</div>
                </div>
                {unpainted.map(item => {
                  const u = findUnit(selectedFaction, item.unitId);
                  const pts = ptsMap[`${selectedFaction}:${item.unitId}`] || (u?POINTS_DB[u.name]:0) || 0;
                  const statusColor = item.paintStatus==="wip"?"#8a7a2a":item.paintStatus==="primed"?"#5a5a5a":"#3a2a1a";
                  return (
                    <div key={item.id} className="hc-bare" style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 8px", background:"rgba(8,5,3,0.34)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", border:"1px solid #0d0b0899", marginBottom:"3px", opacity:0.9 }}>
                      {item.photo ? <img src={item.photo} style={{ width:"28px", height:"28px", objectFit:"cover", flexShrink:0, filter:"grayscale(60%)" }} /> : <div style={{ width:"28px", height:"28px", background:"#050302", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#1a1a1a", fontSize:"14px" }}>⚔</div>}
                      <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
                        <span style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Cinzel',serif", textShadow:"0 1px 3px #000" }}>{u?.name || item.unitId}</span>
                        <span style={{ color:statusColor, fontSize:"10px", fontFamily:"'Cinzel',serif", textShadow:"0 1px 3px #000" }}>
                          {item.paintStatus==="wip"?"· En cours":item.paintStatus==="primed"?"· Apprêté":item.paintStatus==="sprue"?"· Sur grappe":"· Monté"}
                        </span>
                        {item.nickname && <span style={{ color:f.accent, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", opacity:0.8, width:"100%" }}>« {item.nickname} »</span>}
                      </div>
                      <div style={{ color:"#c8b9a0", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{pts * (item.qty||1)}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div style={{...pageStyle, ...pageFond("lists")}} className="bg-lists">
      <div style={{ background:"linear-gradient(180deg,#0a0808 0%,#050505 100%)", borderBottom:"1px solid #0d0b08", padding:"16px 16px 12px", flexShrink:0 }}>
        <div style={{ color:"#b3a48c", fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>CODEX ASTARTES</div>
        <div style={{ color:"#e8dfc0", fontSize:"26px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"2px", fontWeight:"900", lineHeight:1 }}>CROISADE</div>
        <div style={{ color:"#9a8a6a", fontSize:"12px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>{factionLists.length} ARMÉES · {factionLists.reduce((s,l)=>s+l.paintedModels,0)} FIGURINES PEINTES</div>
      </div>

      <div className="cascade" style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
        <PilgrimageMap pts={factionLists.reduce((s,l)=>s+l.total,0)} enrolling={enrolling} seen={pilgrimSeen} onSeen={onPilgrimSeen} />
        {factionLists.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#9a8a6a" }}>
            <div style={{ fontSize:"32px", marginBottom:"12px" }}>⚔</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"2px" }}>Aucune figurine peinte</div>
            <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:"12.5px", marginTop:"6px", fontStyle:"italic" }}>Peins des figurines pour voir tes armées ici</div>
          </div>
        )}
        {factionLists.map(({ fKey, f, painted, paintedModels, total, name, goal }) => {
          const pct = Math.min(100, Math.round(total/goal*100));
          const isEditing = editingFaction === fKey;
          return (
            <div key={fKey} onClick={() => !isEditing && setSelectedFaction(fKey)} className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(13,11,8,0.34) 0%,rgba(8,6,4,0.46) 100%)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", border:`1px solid ${f.accent}33`, borderTop:`2px solid ${f.accent}`, marginBottom:"10px", padding:"14px", cursor:"pointer" }}>
              {/* Nom de l'armée */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                <div style={{ flex:1 }}>
                  {isEditing ? (
                    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                      <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                        style={{ flex:1, background:"#060402", border:`1px solid ${f.accent}`, color:"#e8dfc0", padding:"4px 8px", fontSize:"15px", fontFamily:"'Cinzel',serif", outline:"none" }} />
                      <button onClick={() => { onSetName(fKey, editVal); setEditingFaction(null); }}
                        style={{ background:f.accent+"22", border:`1px solid ${f.accent}`, color:f.accent, padding:"4px 10px", cursor:"pointer", fontSize:"11.5px", fontFamily:"'Cinzel',serif" }}>✓</button>
                      <button onClick={() => setEditingFaction(null)}
                        style={{ background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", padding:"4px 10px", cursor:"pointer", fontSize:"11.5px" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <span style={{ color:f.accent, }}><FactionIcon faction={fKey} factionDef={f} size={18} /></span>
                      <span style={{ color:"#e8dfc0", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingFaction(fKey); setEditVal(name); }}
                        aria-label="Renommer l'armée" style={{ background:"none", border:"none", color:"#9a8a6a", cursor:"pointer", fontSize:"12.5px", padding:"6px 8px" }}>✎</button>
                    </div>
                  )}
                  <div style={{ color:"#c8b9a0", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginTop:"3px" }}>{f.label.toUpperCase()}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="stat-hero" style={{ color:f.accent, fontSize:"24px", lineHeight:1 }}>{total.toLocaleString('fr')}</div>
                  <button onClick={(e) => { e.stopPropagation(); setGoalFor(fKey); }} aria-label="Modifier l'objectif de points"
                    style={{ background:"none", border:"none", padding:"6px 0 4px 10px", margin:"-4px 0 0", cursor:"pointer", color:"#9a8a6a", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", touchAction:"manipulation" }}>
                    / {goal.toLocaleString('fr')} pts <span style={{ color:f.accent, fontSize:"12px", marginLeft:"2px" }}>✎</span>
                  </button>
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ height:"4px", background:"#0a0806", marginBottom:"8px" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:f.accent, transition:"width 0.6s" }} />
              </div>

              {/* Stats */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ color:"#8a7a5e", fontSize:"12.5px", fontStyle:"italic", fontFamily:"'Crimson Pro',serif" }}>
                  {paintedModels} {fKey==="TY"?"créatures":fKey==="CSM"?"renégats":fKey==="IK"?"chevaliers":fKey==="IM"?"agents":fKey==="OR"?"boyz":fKey==="NC"?"guerriers":fKey==="AE"?"aeldari":fKey==="AC"?"custodiens":fKey==="AM"?"soldats":fKey==="AS"?"sœurs":fKey==="AD"?"tech-prêtres":fKey==="DR"?"drukhari":fKey==="TA"?"guerriers":fKey==="LD"?"démons":fKey==="LV"?"kin":fKey==="GK"?"chevaliers gris":fKey==="GC"?"hybrides":fKey==="CK"?"chevaliers damnés":"frères de bataille"} · <span style={{ color:f.accent, opacity:0.9 }}>{factionTitle(fKey, total)}</span>
                </div>
                <div style={{ color:pct>=100?f.accent:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>
                  {pct>=100?"✠ OBJECTIF ATTEINT":`${pct}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {goalFor && (() => {
        const row = factionLists.find(x => x.fKey === goalFor); if (!row) return null;
        return <GoalSheet f={row.f} name={row.name} total={row.total} goal={row.goal} onClose={() => setGoalFor(null)}
          onSave={(v) => { onSetGoal(goalFor, v); setGoalFor(null); }} />;
      })()}
    </div>
  );
}
