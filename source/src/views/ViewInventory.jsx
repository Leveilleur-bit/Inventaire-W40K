import React, { useState, useEffect, useRef } from 'react';
import { EmptyState, Ic, IconBtn, ScrollBar, ToTopBtn, pageFond, pageStyle, useScrollProgress } from '../components/ui.jsx';
import { InventoryItem, ModalAddUnit, ModalEditPhoto } from '../components/units.jsx';
import { FACTIONS, FACTION_LORE, factionTitle } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { PAINT_STATUS, ROLE_ORDER, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { orderedFactionEntries } from '../lib/utils.jsx';
import { computeHonors } from '../lib/honors.jsx';
import { isColossus } from '../lib/colossus.jsx';
import { FactionIcon } from '../components/heraldry.jsx';

// Recherche insensible aux accents et aux majuscules
const norm = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Filtre de statut : "unpainted" (« Non peint ») = monté, sur grappe, ou sans statut
const matchPaint = (i, key) => key === "all" ? true
  : key === "unpainted" ? (!i.paintStatus || i.paintStatus === "unpainted" || i.paintStatus === "sprue")
  : i.paintStatus === key;

export function ViewInventory({ serviceCtx, onUpdateColosse, onReplayCeremony, paintHistory, inventory, ptsMap, onSetPts, onAdd, onDelete, onUpdatePhoto, onUpdatePaint, onUpdateQty, onUpdateModelCount, onReorder, onUpdateNote, onUpdateNickname, onUpdatePurchased, onSplit, paintPct, unpainted, shameLawOff, onSetShameLaw, onNav, focusItem, onFocusHandled, paintCatalog, onSetRecipe, onAddPaint, confirm }) {
  // Titres honorifiques de toutes les reliques (recalculés seulement quand la collection change)
  const honorsMap = React.useMemo(() => computeHonors(inventory, paintHistory, ptsMap), [inventory, paintHistory, ptsMap]);
  const scrollDetail = useScrollProgress();
  const [showModal, setShowModal] = useState(false);
  useBackButton(showModal, React.useCallback(() => setShowModal(false), []));
  const [lawOpen, setLawOpen] = useState(false);
  useBackButton(lawOpen, React.useCallback(() => setLawOpen(false), []));
  const SHAME_LAW_THRESHOLD = 80;
  const lawBlocks = !shameLawOff && paintPct < SHAME_LAW_THRESHOLD && unpainted > 0;
  const [editPhotoItem, setEditPhotoItem] = useState(null);
  const [faction, setFaction] = useState(null);
  useBackButton(!!faction, React.useCallback(() => setFaction(null), []));
  useEffect(() => { if (focusItem) setFaction(focusItem.faction); }, [focusItem]);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");   // recherche dans toutes les armées (page des armées)
  const [localFocus, setLocalFocus] = useState(null);   // relique à ouvrir après un choix dans la recherche globale
  const focus = focusItem || localFocus;
  const focusHandled = () => { setLocalFocus(null); onFocusHandled && onFocusHandled(); };
  const [chapterFilter, setChapterFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [paintFilter, setPaintFilter] = useState("all");
  const [collapsedRoles, setCollapsedRoles] = useState({});
  const dragState = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const f = FACTIONS[faction] || {};

  // ── PAGE RÉSUMÉ DES ARMÉES (faction non sélectionnée) ──
  if (!faction) {
    const factionSummary = orderedFactionEntries().map(([k, fac]) => {
      const items = inventory.filter(i => i.faction===k);
      const models = items.reduce((s,i) => { const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
      const painted = items.filter(i=>i.paintStatus==="painted").reduce((s,i) => { const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
      const ptsOfIt = (i) => { const u=findUnit(k, i.unitId); const p=ptsMap[`${k}:${i.unitId}`]||(u?POINTS_DB[u.name]:0)||0; return p*(i.qty||1); };
      const pts = items.reduce((s,i) => s + ptsOfIt(i), 0);
      // Le rang se mérite en PEIGNANT, comme en CROISADE : avant, il était calculé ici sur
      // tous les points possédés, d'où deux rangs différents pour la même armée selon l'onglet.
      const ptsPainted = items.filter(i => i.paintStatus === "painted").reduce((s,i) => s + ptsOfIt(i), 0);
      const pct = models ? Math.round(painted/models*100) : 0;
      return { k, fac, models, painted, pts, ptsPainted, pct, refs: items.length };
    });
    const withUnits = factionSummary.filter(s => s.refs > 0);
    const emptyFactions = factionSummary.filter(s => s.refs === 0);

    const grandTotal = factionSummary.reduce((s,x)=>s+x.models,0);
    const grandPainted = factionSummary.reduce((s,x)=>s+x.painted,0);

    return (
      <div style={{...pageStyle, ...pageFond("inventory")}} className="bg-inventory">
        <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"18px 16px 14px", flexShrink:0 }}>
          <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", opacity:0.6, marginBottom:"4px" }}>REGISTRE DES RELIQUES</div>
          <div style={{ color:"#e8dfc0", fontSize:"26px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"2px", fontWeight:"900", lineHeight:1 }}>INVENTAIRE</div>
          <div style={{ color:"#9a8a6a", fontSize:"12px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>{withUnits.length} ARMÉES · {grandTotal} FIGURINES · {grandTotal?Math.round(grandPainted/grandTotal*100):0}% PEINT</div>
        </div>
        <div className="cascade" style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {inventory.length > 0 && (
            <div style={{ position:"relative", marginBottom:"12px" }}>
              <input value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} placeholder="Chercher dans toute la collection…"
                style={{ width:"100%", background:"#0a0806", border:"1px solid #2a2418", color:"#e8dfc0", padding:"11px 34px 11px 12px", fontSize:"15px", fontFamily:"'Crimson Pro',serif", outline:"none", boxSizing:"border-box" }} />
              {globalQuery && <button onClick={() => setGlobalQuery("")} aria-label="Effacer"
                style={{ position:"absolute", right:"6px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#c8b9a0", cursor:"pointer", fontSize:"15px", padding:"6px" }}>✕</button>}
            </div>
          )}
          {norm(globalQuery) ? (() => {
            const q = norm(globalQuery);
            const hits = inventory.map(i => ({ i, u: findUnit(i.faction, i.unitId) }))
              .filter(({ i, u }) => u && (norm(u.name).includes(q) || norm(i.nickname).includes(q) || norm(i.note).includes(q)))
              .slice(0, 60);
            if (!hits.length) return <div style={{ color:"#9a8a6a", textAlign:"center", padding:"24px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", fontSize:"14px" }}>Aucune relique ne correspond.</div>;
            return hits.map(({ i, u }) => {
              const fac = FACTIONS[i.faction] || {};
              const st = PAINT_STATUS[i.paintStatus] || PAINT_STATUS.unpainted;
              const figs = getModelCount(u.name, i.qty || 1, i.modelCount);
              return (
                <button key={i.id} className="hc-bare" onClick={() => { setSearchQuery(""); setChapterFilter("all"); setPaintFilter("all"); setCollapsedRoles({}); setLocalFocus({ faction: i.faction, itemId: i.id }); setFaction(i.faction); setGlobalQuery(""); }}
                  style={{ width:"100%", textAlign:"left", background:"linear-gradient(135deg,#0f0c08,#080604)", border:"1px solid #1c1a16", borderLeft:`3px solid ${fac.accent || "#b8922a"}`, padding:"10px 12px", marginBottom:"6px", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", touchAction:"manipulation" }}>
                  {i.photo
                    ? <img src={i.photo} alt="" style={{ width:"40px", height:"40px", objectFit:"cover", border:`1px solid ${fac.accent || "#b8922a"}44`, flexShrink:0 }} />
                    : <span style={{ width:"40px", display:"flex", justifyContent:"center", color:fac.accent, flexShrink:0 }}><FactionIcon faction={i.faction} factionDef={fac} size={20} /></span>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8dfc0", fontSize:"13.5px", fontFamily:"'Cinzel',serif", lineHeight:1.2 }}>{u.name}{i.nickname ? <span style={{ color:"#d8c8ac", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}> · « {i.nickname} »</span> : null}</div>
                    <div style={{ fontSize:"12px", fontFamily:"'Crimson Pro',serif", marginTop:"2px", display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      <span style={{ color:fac.accent }}>{fac.label}</span>
                      <span style={{ color:st.color === "#2a7a2a" ? "#5a9a4a" : "#b8a882" }}>● {st.label}</span>
                      <span style={{ color:"#9a8a6a" }}>{figs} fig.</span>
                    </div>
                  </div>
                  <span style={{ color:"#8a7a58", fontSize:"15px", flexShrink:0 }}>›</span>
                </button>
              );
            });
          })() : <>
          {withUnits.map(({ k, fac, models, painted, pts, ptsPainted, pct }) => (
            <button key={k} className="hc-bare orn" onClick={() => { setFaction(k); setChapterFilter("all"); setPaintFilter("all"); setCollapsedRoles({}); }}
              style={{ width:"100%", textAlign:"left", background:"linear-gradient(180deg,rgba(13,11,8,0.34) 0%,rgba(8,6,4,0.46) 100%)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)", border:`1px solid ${fac.accent}33`, borderLeft:`3px solid ${fac.accent}`, padding:"14px", marginBottom:"10px", cursor:"pointer", touchAction:"manipulation", borderRadius:"var(--rayon)", boxShadow:"var(--ombre-carte)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ color:fac.accent }}><FactionIcon faction={k} factionDef={fac} size={24} /></span>
                  <div>
                    <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{fac.label}</div>
                    <div style={{ color:"#c8b9a0", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"2px" }}>{models} figurines · {pts.toLocaleString('fr')} pts</div>
                    <div style={{ color:fac.accent, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"2px" }}>{factionTitle(k, ptsPainted)}</div>
                  </div>
                </div>
                <div className="stat-hero" style={{ color:fac.accent, fontSize:"22px" }}>{pct}%</div>
              </div>
              <div style={{ height:"4px", background:"#0a0806" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:fac.accent, transition:"width 0.6s" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
                <span style={{ color:"#5a8a3a", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{painted} peintes</span>
                <span style={{ color:"#c8b9a0", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{models-painted} à peindre</span>
              </div>
            </button>
          ))}
          {/* ── Factions sans figurines ── */}
          {emptyFactions.length > 0 && (
            <div style={{ marginTop:"14px" }}>
              <div style={{ color:"#8a7a5e", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"8px", paddingLeft:"2px" }}>COMMENCER UNE NOUVELLE ARMÉE</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {emptyFactions.map(({ k, fac }) => (
                  <button key={k} onClick={() => { setFaction(k); setChapterFilter("all"); setPaintFilter("all"); setCollapsedRoles({}); }}
                    style={{ flex:"1 1 40%", background:"#080604", border:`1px dashed ${fac.accent}44`, padding:"12px 10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", touchAction:"manipulation" }}>
                    <span style={{ color:fac.accent, opacity:0.7 }}><FactionIcon faction={k} factionDef={fac} size={18} /></span>
                    <span style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{fac.label}</span>
                    <span style={{ color:fac.accent, fontSize:"15px", marginLeft:"2px" }}>+</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          </>}
        </div>
      </div>
    );
  }

  const availableChapters = faction === "SM" ? ["all", ...Array.from(new Set(
    inventory.filter(i=>i.faction==="SM")
      .map(i => findUnit("SM", i.unitId)?.chapter || "Générique")
      .filter(Boolean)
  ))] : [];

  const rawItems = inventory
    .filter(i=>i.faction===faction)
    .filter(i => {
      if (!searchQuery.trim()) return true;
      const unit = findUnit(i.faction, i.unitId);
      const name = unit?.name?.toLowerCase() || '';
      const q = norm(searchQuery);
      return norm(unit?.name).includes(q) || norm(i.nickname).includes(q) || norm(i.note).includes(q);
    })
    .filter(i=> matchPaint(i, paintFilter))
    .map(i => ({ ...i, unit:findUnit(i.faction, i.unitId) }))
    .filter(i=>i.unit)
    .filter(i=> {
      if ((faction !== "SM" && faction !== "CSM") || chapterFilter === "all") return true;
      const ch = i.unit?.chapter || "Générique";
      const forbidden = i.unit?.forbidden || [];
      if (forbidden.includes(chapterFilter)) return false;
      if (ch === "Générique") return true;
      return ch === chapterFilter;
    });

  // Group by role, respecting custom order (inventory order within each role)
  const grouped = {};
  ROLE_ORDER.forEach(r => { grouped[r] = []; });
  rawItems.forEach(item => {
    const role = item.unit.role;
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(item);
  });
  const usedRoles = ROLE_ORDER.filter(r => grouped[r]?.length > 0);

  const toggleRole = (role) => setCollapsedRoles(prev => ({ ...prev, [role]: !prev[role] }));

  // Drag-and-drop handlers
  const onDragStart = (e, item, role) => {
    dragState.current = { id: item.id, role, startY: e.touches?.[0]?.clientY ?? e.clientY };
    setDraggingId(item.id);
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", item.id); }
  };
  const onDragOver = (e, item) => {
    e.preventDefault();
    if (item.id !== draggingId) setDragOverId(item.id);
  };
  const onDrop = (e, targetItem) => {
    e.preventDefault();
    if (!dragState.current || dragState.current.id === targetItem.id) return;
    onReorder(dragState.current.id, targetItem.id, faction);
    setDraggingId(null); setDragOverId(null); dragState.current = null;
  };
  const onDragEnd = () => { setDraggingId(null); setDragOverId(null); dragState.current = null; };

  // Touch drag
  const onTouchStart = (e, item, role) => {
    dragState.current = { id: item.id, role, startY: e.touches[0].clientY };
    setDraggingId(item.id);
  };
  const onTouchMove = (e) => {
    if (!dragState.current) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = el?.closest("[data-itemid]");
    if (card) setDragOverId(card.dataset.itemid);
  };
  const onTouchEnd = () => {
    if (!dragState.current || !dragOverId) { setDraggingId(null); setDragOverId(null); dragState.current = null; return; }
    onReorder(dragState.current.id, dragOverId, faction);
    setDraggingId(null); setDragOverId(null); dragState.current = null;
  };

  return (
    <div style={{ ...pageStyle, ...pageFond("inventory"), "--veil": f.accent }} className={`bg-inventory faction-veil`}>
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"18px 16px 14px", position:"relative", overflow:"hidden", zIndex:1 }}>
        
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <button onClick={() => setFaction(null)} style={{ background:"none", border:"none", color:"#c8b9a0", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", marginBottom:"4px", padding:0 }}>← ARMÉES</button>
            <div style={{ color:f.accent||"#b8922a", fontSize:"18px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700", textShadow:"0 0 20px #b8922a22" }}><FactionIcon faction={faction} factionDef={f} size={20} /> {f.label||"INVENTAIRE"}</div>
            <div style={{ color:"#c8b49a", fontSize:"12px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"3px" }}>{inventory.filter(i=>i.faction===faction).length} RÉFÉRENCES</div>
          </div>
          <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                            <div style={{ flex:1, maxWidth:"160px", position:"relative" }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ width:"100%", background:"#0a0806", border:"1px solid #1c1c1c", color:"#e8dfc0", padding:"6px 24px 6px 8px", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", outline:"none", boxSizing:"border-box" }} />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position:"absolute", right:"4px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#c8b9a0", cursor:"pointer", fontSize:"13px" }}>✕</button>}
            </div>
            <button onClick={() => setViewMode(v => v==="list"?"grid":"list")}
              title={viewMode==="list"?"Vue grille":"Vue liste"}
              style={{ background:"none", border:"1px solid #1c1c1c", color: viewMode==="grid"?"#b8922a":"#2a2218", cursor:"pointer", padding:"7px 9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {viewMode==="list"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              }
            </button>
            <IconBtn onClick={() => lawBlocks ? setLawOpen(true) : setShowModal(true)}><Ic.Plus /></IconBtn>
          </div>
        </div>
        {FACTION_LORE[faction] && (
          <div className="lettrine" style={{ color:"#c4b59a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45, borderLeft:`2px solid ${f.accent}44`, background:"rgba(8,6,4,0.55)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", paddingLeft:"8px", padding:"6px 8px", marginTop:"8px" }}>{FACTION_LORE[faction]}</div>
        )}
      </div>
      {lawBlocks && (
        <div style={{ background:"#12060688", borderLeft:"2px solid #c04040", padding:"7px 12px" }}>
          <div style={{ color:"#c04040", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>⚖ LOI DE L'ACHAT INTERDIT · ACTIVE</div>
          <div style={{ color:"#8a6a5a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"2px" }}>Collection peinte : {paintPct}% — le seuil inquisitorial est de {SHAME_LAW_THRESHOLD}%.</div>
        </div>
      )}
      {/* Filtre chapter SM */}
      {faction === "SM" && availableChapters.length > 1 && (
        <div style={{ display:"flex", gap:"4px", overflowX:"auto", padding:"5px 12px", borderBottom:"1px solid #0f0e0d", scrollbarWidth:"none" }}>
          {availableChapters.map(ch => (
            <button key={ch} onClick={() => setChapterFilter(ch)}
              style={{ flexShrink:0, padding:"3px 8px", background:chapterFilter===ch?`${f.accent}22`:"transparent", border:`1px solid ${chapterFilter===ch?f.accent:"#1a1816"}`, color:chapterFilter===ch?f.accent:"#9a8a78", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor:"pointer", whiteSpace:"nowrap", touchAction:"manipulation" }}>
              {ch==="all"?"TOUS":ch.toUpperCase()}
            </button>
          ))}
        </div>
      )}
  {/* Filtre statut peinture */}
      <div style={{ display:"flex", gap:"4px", padding:"6px 12px", background:"rgba(2,2,2,0.5)", borderBottom:"1px solid #0a0a0a", overflowX:"auto" }}>
        {[
          // « Non peint » regroupe les figurines montées ET celles encore sur grappe
          // (avant, celles sur grappe n'apparaissaient que dans « Tout »).
          { key:"all",      label:"TOUT",      color:"#d8c8ac", dot:null },
          { key:"painted",  label:"PEINT",     color:PAINT_STATUS.painted.color,  dot:PAINT_STATUS.painted.color },
          { key:"wip",      label:"EN COURS",  color:PAINT_STATUS.wip.color,      dot:PAINT_STATUS.wip.color },
          { key:"primed",   label:"APPRÊTÉ",   color:PAINT_STATUS.primed.color,   dot:PAINT_STATUS.primed.color },
          { key:"unpainted",label:"NON PEINT", color:PAINT_STATUS.unpainted.color,dot:PAINT_STATUS.unpainted.color },
        ].map(fi => {
          // Compté en figurines (et non en lignes), comme partout ailleurs dans l'app
          const cnt = inventory.filter(i => i.faction===faction && matchPaint(i, fi.key)).reduce((s,i)=>s+getModelCount(findUnit(i.faction, i.unitId)?.name, i.qty||1, i.modelCount),0);
          const active = paintFilter===fi.key;
          return (
            <button key={fi.key} onClick={() => setPaintFilter(fi.key)}
              style={{ display:"flex", alignItems:"center", gap:"4px", padding:"4px 10px", background:active?`${fi.color}22`:"#060402", border:`1px solid ${active?fi.color+"66":"#1c1c1c"}`, color:active?fi.color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, touchAction:"manipulation" }}>
              {fi.dot && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:fi.dot, flexShrink:0 }} />}
              {fi.label}
              {cnt>0 && <span style={{ color:active?fi.color:"#c8b49a", fontFamily:"'Cinzel',serif", fontSize:"12px" }}>{cnt}</span>}
            </button>
          );
        })}
      </div>
      <ScrollBar prog={scrollDetail.prog} accent={f.accent} />
      <div ref={scrollDetail.ref} onScroll={scrollDetail.onScroll} style={{ flex:1, overflowY:"auto", padding:"12px 16px", position:"relative" }} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {rawItems.length===0 && <EmptyState icon={f.icon} accent={f.accent} title="Aucune relique" sub={`Le registre des ${f.label} est vierge. Ajoute ta première figurine.`}
              action={{ label:"+ AJOUTER UNE FIGURINE", onClick:() => lawBlocks ? setLawOpen(true) : setShowModal(true) }} />}
        {usedRoles.map(role => (
          <div key={role} style={{ marginBottom:"16px" }}>
            {/* Role header */}
            <button onClick={() => toggleRole(role)} style={{ width:"100%", background:"none", border:"none", display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px", cursor:"pointer", padding:"4px 0" }}>
              <div style={{ width:"2px", height:"12px", background:f.accent, opacity:0.6, flexShrink:0 }} />
              <span style={{ color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"4px", flex:1, textAlign:"left" }}>{role.toUpperCase()}</span>
              <span style={{ color:"#d8c8ac", fontSize:"11.5px" }}>{grouped[role].length} — </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9a8a78" strokeWidth="2.5"><polyline points={collapsedRoles[role]?"6 9 12 15 18 9":"18 15 12 9 6 15"}/></svg>
            </button>
            {!collapsedRoles[role] && (
              viewMode==="grid" ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"4px" }}>
                  {grouped[role].map((item, idx) => (
                    <InventoryItem serviceCtx={serviceCtx} paintHistory={paintHistory} honors={honorsMap.get(item.id)} colossus={isColossus(item, ptsMap)} onUpdateColosse={onUpdateColosse} onReplayCeremony={onReplayCeremony} key={item.id}
                      item={item} faction={faction} ptsMap={ptsMap} onSetPts={onSetPts}
                      onDelete={onDelete} onEditPhoto={setEditPhotoItem}
                      onUpdatePaint={onUpdatePaint} onUpdateQty={onUpdateQty} onUpdateModelCount={onUpdateModelCount} onUpdateNote={onUpdateNote} onUpdateNickname={onUpdateNickname} onUpdatePurchased={onUpdatePurchased} onSplit={onSplit}
                      accent={f.accent} viewMode="grid"
                      dragHandleProps={{}}
                      autoOpen={focus?.itemId === item.id} onAutoOpened={focusHandled}
                      paintCatalog={paintCatalog} onSetRecipe={onSetRecipe} onAddPaint={onAddPaint} confirm={confirm}
                      siblings={inventory.filter(i => i.faction===faction && i.unitId===item.unitId && i.id!==item.id)}
                    />
                  ))}
                </div>
              ) : (
                grouped[role].map((item, idx) => (
                  <div key={item.id} data-itemid={item.id}
                    style={{ opacity: draggingId===item.id ? 0.5 : 1, outline: dragOverId===item.id ? `2px solid ${f.accent}` : "none", background: draggingId===item.id ? `${f.accent}11` : "transparent", transition:"opacity 0.15s", animation:`slideLeft 0.2s ${idx*25}ms ease both` }}
                    onDragOver={e => onDragOver(e, item)}
                    onDrop={e => onDrop(e, item)}
                  >
                    <InventoryItem serviceCtx={serviceCtx} paintHistory={paintHistory} honors={honorsMap.get(item.id)} colossus={isColossus(item, ptsMap)} onUpdateColosse={onUpdateColosse} onReplayCeremony={onReplayCeremony}
                      item={item} faction={faction} ptsMap={ptsMap} onSetPts={onSetPts}
                      onDelete={onDelete} onEditPhoto={setEditPhotoItem}
                      onUpdatePaint={onUpdatePaint} onUpdateQty={onUpdateQty} onUpdateModelCount={onUpdateModelCount} onUpdateNote={onUpdateNote} onUpdateNickname={onUpdateNickname} onUpdatePurchased={onUpdatePurchased} onSplit={onSplit}
                      accent={f.accent} viewMode="list"
                      paintCatalog={paintCatalog} onSetRecipe={onSetRecipe} onAddPaint={onAddPaint} confirm={confirm}
                      siblings={inventory.filter(i => i.faction===faction && i.unitId===item.unitId && i.id!==item.id)}
                      dragHandleProps={{
                        draggable: true,
                        onDragStart: e => onDragStart(e, item, role),
                        onDragEnd,
                        onTouchStart: e => onTouchStart(e, item, role),
                      }}
                      autoOpen={focus?.itemId === item.id} onAutoOpened={focusHandled}
                    />
                  </div>
                ))
              )
            )}
          </div>
        ))}
        <ToTopBtn show={scrollDetail.scrolled} onClick={scrollDetail.toTop} accent={f.accent} />
      </div>
      {showModal && <ModalAddUnit faction={faction} inventory={inventory} mode="inventory" onClose={() => setShowModal(false)} onAdd={onAdd} />}
      {editPhotoItem && <ModalEditPhoto item={editPhotoItem} faction={faction} onClose={() => setEditPhotoItem(null)} onSave={photo => onUpdatePhoto(editPhotoItem.id, photo)} />}
      {/* Loi de l'Achat Interdit — modal (même verrou que la Wishlist) */}
      {lawOpen && (
        <div onClick={() => setLawOpen(false)} style={{ position:"fixed", inset:0, background:"#000000d4", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
          <div onClick={e => e.stopPropagation()} className="ornate-corners" style={{ width:"100%", maxWidth:"350px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#150a0a 0%,#0a0606 100%)", border:"1px solid #c0404066", borderTop:"2px solid #c04040", padding:"18px 16px" }}>
            <div style={{ textAlign:"center", fontSize:"26px", color:"#c04040", marginBottom:"6px" }}>⚖</div>
            <div style={{ color:"#8a6a5a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>ORDO HERETICUS</div>
            <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", margin:"3px 0 12px", textAlign:"center" }}>ACQUISITION REFUSÉE</div>
            <div style={{ color:"#c8bfa8", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.6, textAlign:"center", marginBottom:"10px" }}>
              « Purge d'abord ta pile, hérétique. {unpainted} âme{unpainted>1?"s":""} attend{unpainted>1?"ent":""} la consécration tandis que tu ajoutes du plastique neuf au registre. »
            </div>
            <div style={{ background:"#0a0606", border:"1px solid #2a1a16", padding:"8px 10px", marginBottom:"14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ color:"#8a6a5a", fontSize:"11px", letterSpacing:"1px", fontFamily:"'Cinzel',serif" }}>TOUTE LA COLLECTION</span>
                <span style={{ color:"#c04040", fontSize:"12px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{paintPct}% / {SHAME_LAW_THRESHOLD}%</span>
              </div>
              <div style={{ height:"4px", background:"#000", position:"relative" }}>
                <div style={{ width:`${paintPct}%`, height:"100%", background:"#c04040" }} />
                <div style={{ position:"absolute", left:`${SHAME_LAW_THRESHOLD}%`, top:"-2px", width:"1px", height:"8px", background:"#b8922a" }} />
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              <button onClick={() => { setLawOpen(false); onNav && onNav("shame"); }}
                style={{ width:"100%", padding:"11px", background:"#c0404022", border:"1px solid #c04040", color:"#c04040", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ J'OBÉIS — VOIR MA PILE</button>
              <button onClick={() => { onSetShameLaw(true); setLawOpen(false); setShowModal(true); }}
                style={{ width:"100%", padding:"9px", background:"none", border:"1px solid #1c1a16", color:"#c4b59a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>J'assume ma honte</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
