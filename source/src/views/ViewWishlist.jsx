import React, { useState } from 'react';
import { EmptyState, Ic, IconBtn, Overlay, pageFond, pageStyle } from '../components/ui.jsx';
import { AddPrintForm, ModalAddUnit, WahapediaBtn } from '../components/units.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { CITADEL_PAINTS, CITADEL_TYPES, WISH_STATUS, WISH_STATUS_KEYS } from '../data/paints.jsx';
import { POINTS_DB } from '../data/points.jsx';
import { SHOP_PRICES } from '../data/prices.jsx';
import { findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { uid } from '../lib/utils.jsx';
import { FactionIcon } from '../components/heraldry.jsx';

export function ViewWishlist({ onNav, paintPct, unpainted, shameLawOff, onSetShameLaw, wishlist, paintWishlist, printList, ptsMap, onAdd, onDelete, onSetStatus, onSetPrice, onAddPaint, onDeletePaint, onAddPrint, onDeletePrint, onUpdatePrint }) {
  const [lawOpen, setLawOpen] = useState(false);
  useBackButton(lawOpen, React.useCallback(() => setLawOpen(false), []));
  const SHAME_LAW_THRESHOLD = 80;
  const lawBlocks = !shameLawOff && paintPct < SHAME_LAW_THRESHOLD && unpainted > 0;
  const [tab, setTab] = useState("units");
  const [showFactionPicker, setShowFactionPicker] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [modalFaction, setModalFaction] = useState("SM");
  const [sortBy, setSortBy] = useState("faction");
  const [paintSearch, setPaintSearch] = useState("");
  const [paintFilter, setPaintFilter] = useState("all");

  // ── UNITS ──────────────────────────────────────────────
  const allItems = (wishlist||[])
    .filter(i => i && i.unitId)
    .map(i => ({ ...i, unit: findUnit(i.faction, i.unitId)||null, fDef: FACTIONS[i.faction]||FACTIONS["SM"] }))
    .filter(i => i.unit);

  const sortedItems = [...allItems].sort((a,b) => {
    if (sortBy==="faction") return (a.faction||"").localeCompare(b.faction||"");
    if (sortBy==="role")    return (a.unit?.role||"").localeCompare(b.unit?.role||"");
    if (sortBy==="status")  return (a.status||"wanted").localeCompare(b.status||"wanted");
    if (sortBy==="price") {
      const pa = a.price||SHOP_PRICES[a.unit?.name]||0;
      const pb = b.price||SHOP_PRICES[b.unit?.name]||0;
      return pb - pa;
    }
    return 0;
  });

  const totalPrice = allItems.reduce((s,i) => { try { const unit=findUnit(i.faction, i.unitId); return s+(i.price||(unit?SHOP_PRICES[unit.name]:0)||0)*(i.qty||1); } catch{return s;} }, 0);
  const totalPts   = allItems.reduce((s,i) => { try { const unit=findUnit(i.faction, i.unitId); return s+(ptsMap[`${i.faction}:${i.unitId}`]||(unit?POINTS_DB[unit.name]:0)||0)*(i.qty||1); } catch{return s;} }, 0);

  const cycleStatus = (id) => {
    const item=(wishlist||[]).find(i=>i.id===id); if(!item) return;
    const idx=WISH_STATUS_KEYS.indexOf(item.status||"wanted");
    onSetStatus(id, WISH_STATUS_KEYS[(idx+1)%WISH_STATUS_KEYS.length]);
  };

  // ── PAINTS ─────────────────────────────────────────────
  const pw = paintWishlist||[];
  const paintTotal = pw.reduce((s,p) => s+(CITADEL_TYPES[p.type]?.price||5.60)*(p.qty||1), 0);
  const filteredPaints = CITADEL_PAINTS.filter(p => {
    const matchType = paintFilter==="all" || p.type===paintFilter;
    const matchSearch = !paintSearch || p.name.toLowerCase().includes(paintSearch.toLowerCase());
    return matchType && matchSearch;
  });
  const inWishlist = (name) => pw.some(p=>p.name===name);
  const grandTotal = totalPrice + paintTotal;

  return (
    <div style={{...pageStyle, ...pageFond("wishlist")}} className="bg-wishlist">
      {/* Header */}
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"14px 16px 12px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"60px", color:"#0b0a09", lineHeight:1, pointerEvents:"none", fontFamily:"serif", zIndex:0 }}>✦</div>
        {/* position/zIndex : sans ça, le filigrane ✦ ci-dessus se peignait PAR-DESSUS le bouton « + » et le masquait */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
          <div>
            <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", opacity:0.6, marginBottom:"3px" }}>ACQUISITIONS FUTURES</div>
            <div style={{ color:"#e8dfc0", fontSize:"17px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700" }}>WISHLIST</div>
            <div style={{ display:"flex", gap:"10px", marginTop:"3px" }}>
              {grandTotal>0 && <span style={{ color:"#6a9a3a", fontSize:"11.5px", fontWeight:"700" }}>~{Math.round(grandTotal).toLocaleString('fr')} € total</span>}
              {totalPts>0  && <span style={{ color:"#d8c8ac", fontSize:"12px" }}>{totalPts.toLocaleString('fr')} pts</span>}
            </div>
          </div>
          {tab==="units" && <IconBtn onClick={() => lawBlocks ? setLawOpen(true) : setShowFactionPicker(true)}><Ic.Plus /></IconBtn>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:"rgba(2,2,2,0.5)", borderBottom:"1px solid #0f0f0f" }}>
        {[{key:"units",label:"FIGURINES",icon:"⚔"},{key:"paints",label:"PEINTURES",icon:"◈"},{key:"print",label:"IMPRESSION",icon:"⎙"}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, background:"none", border:"none", borderBottom:tab===t.key?"2px solid #b8922a":"2px solid transparent",
              color:tab===t.key?"#b8922a":"#7a6c52", padding:"10px 0", cursor:"pointer",
              fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px" }}>
            <div style={{ fontSize:"15px", marginBottom:"2px" }}>{t.icon}</div>
            {t.label}
            {t.key==="units"  && allItems.length>0 && <div style={{ fontSize:"11px", color:tab===t.key?"#b8922a":"#7a6a58", marginTop:"1px" }}>{allItems.length}</div>}
            {t.key==="paints" && pw.length>0       && <div style={{ fontSize:"11px", color:tab===t.key?"#b8922a":"#7a6a58", marginTop:"1px" }}>{pw.length}</div>}
            {t.key==="print"  && (printList||[]).length>0 && <div style={{ fontSize:"11px", color:tab===t.key?"#b8922a":"#7a6a58", marginTop:"1px" }}>{(printList||[]).length}</div>}
          </button>
        ))}
      </div>

      {/* ── TAB FIGURINES ── */}
      {tab==="units" && (<>
        {/* Loi de l'Achat Interdit — bandeau d'état */}
        {lawBlocks && (
          <div className="hc-bare" style={{ background:"#12060688", borderLeft:"2px solid #c04040", padding:"7px 12px", margin:"8px 12px 0" }}>
            <div style={{ color:"#c04040", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>⚖ LOI DE L'ACHAT INTERDIT · ACTIVE</div>
            <div style={{ color:"#8a6a5a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"2px" }}>Collection peinte : {paintPct}% — le seuil inquisitorial est de {SHAME_LAW_THRESHOLD}%.</div>
          </div>
        )}
        {shameLawOff && (
          <button onClick={() => onSetShameLaw(false)}
            style={{ display:"block", width:"calc(100% - 24px)", margin:"8px 12px 0", background:"none", border:"1px solid #1c1a16", padding:"5px 10px", cursor:"pointer", textAlign:"left" }}>
            <span style={{ color:"#9a8a6a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>⚖ LOI DE L'ACHAT INTERDIT · DÉSACTIVÉE — RÉTABLIR</span>
          </button>
        )}
        <div style={{ display:"flex", gap:"4px", padding:"8px 12px", background:"rgba(2,2,2,0.5)", borderBottom:"1px solid #0f0f0f", overflowX:"auto" }}>
          <span style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", alignSelf:"center", flexShrink:0 }}>TRIER:</span>
          {[{k:"faction",l:"FACTION"},{k:"role",l:"RÔLE"},{k:"status",l:"STATUT"},{k:"price",l:"PRIX"}].map(s => (
            <button key={s.k} onClick={() => setSortBy(s.k)}
              style={{ padding:"4px 10px", background:sortBy===s.k?"#1a1200":"#060402", border:`1px solid ${sortBy===s.k?"#b8922a55":"#1c1c1c"}`, color:sortBy===s.k?"#b8922a":"#9a8a78", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
              {s.l}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
          {sortedItems.length===0 && <EmptyState icon="✦" title="Nul désir consigné" sub="Note ici les reliques que tu convoites pour tes futures croisades." />}
          {sortedItems.map((item, idx) => {
            if (!item.unit) return null;
            const ws = WISH_STATUS[item.status||"wanted"];
            const shopPrice = item.price||SHOP_PRICES[item.unit.name]||null;
            const isAuto = !item.price && !!SHOP_PRICES[item.unit.name];
            const unitPts = ptsMap[`${item.faction}:${item.unitId}`]||POINTS_DB[item.unit.name]||null;
            return (
              <div key={item.id} className="hcard hc-bare" style={{ background:"linear-gradient(180deg,rgba(24,21,18,0.6) 0%,rgba(18,16,8,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #222018", borderLeft:`3px solid ${ws.color}`, marginBottom:"5px", display:"flex", alignItems:"stretch", animation:`slideLeft 0.2s ${idx*20}ms ease both` }}>
                <button onClick={() => cycleStatus(item.id)} title={ws.label}
                  style={{ width:"30px", flexShrink:0, background:"none", border:"none", borderRight:`1px solid ${ws.color}22`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2px", cursor:"pointer", touchAction:"manipulation" }}>
                  <span style={{ fontSize:"13px", color:ws.color }}>{ws.icon}</span>
                  <span style={{ fontSize:"10px", color:ws.color, fontFamily:"'Cinzel',serif", writingMode:"vertical-rl", transform:"rotate(180deg)", whiteSpace:"nowrap", letterSpacing:"1px" }}>{ws.label.toUpperCase()}</span>
                </button>
                <div style={{ flex:1, padding:"8px 10px", display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"3px" }}>
                      <span style={{ color:item.fDef.accent }}><FactionIcon faction={item.faction} factionDef={item.fDef} size={14} /></span>
                      <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Cinzel',serif", lineHeight:1.2 }}>
                        {item.qty>1 && <span style={{ color:item.fDef.accent, marginRight:"4px", fontSize:"11.5px" }}>×{item.qty}</span>}
                        {item.unit.name}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                      <span style={{ color:"#c8b49a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{item.unit.role}</span>
                      <WahapediaBtn unitName={item.unit.name} faction={item.faction} accent={item.fDef.accent} />
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                    {unitPts && <span style={{ color:"#7a7060", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{(unitPts*item.qty).toLocaleString('fr')} pts</span>}
                    <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                      <input type="number" value={item.price||""} onChange={e => onSetPrice(item.id, parseInt(e.target.value)||0)}
                        placeholder={shopPrice?shopPrice.toFixed(0):"€"}
                        style={{ width:"52px", background:isAuto?"#0d1008":"#060402", border:`1px solid ${isAuto?"#6a9a4a":"#7a6a58"}`, color:isAuto?"#b8e890":"#e8dfc0", WebkitTextFillColor:isAuto?"#b8e890":"#e8dfc0", padding:"4px 5px", fontSize:"13px", fontFamily:"'Cinzel',serif", fontWeight:"700", outline:"none", textAlign:"center" }} />
                      <span style={{ color:isAuto?"#b8e890":"#e8dfc0", fontSize:"12.5px", fontWeight:"700" }}>€{isAuto&&<span style={{fontSize:"11px"}} title="Prix boutique de référence">*</span>}</span>
                    </div>
                    <button onClick={() => onDelete(item.id)} style={{ background:"none", border:"1px solid #2a2215", color:"#815a47", cursor:"pointer", padding:"5px", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}><Ic.Trash /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Étape 1 : choisir la faction */}
        {showFactionPicker && !showUnitModal && (
          <Overlay>
            <div style={{ background:"#0a0806", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", width:"100%", maxWidth:"420px", margin:"0 16px 76px", padding:"20px 16px", maxHeight:"calc(100dvh - 150px)", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexShrink:0 }}>
                <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>CHOISIR UNE FACTION</div>
                <button onClick={() => setShowFactionPicker(false)} style={{ background:"none", border:"none", color:"#7a7060", cursor:"pointer", fontSize:"18px", lineHeight:1 }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"8px", overflowY:"auto" }}>
                {Object.entries(FACTIONS).map(([k,v]) => (
                  <button key={k} onClick={() => { setModalFaction(k); setShowFactionPicker(false); setShowUnitModal(true); }}
                    style={{ padding:"12px 2px", background:`${v.accent}11`, border:`1px solid ${v.accent}44`, color:v.accent, cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"0.5px", display:"flex", flexDirection:"column", alignItems:"center", gap:"6px", touchAction:"manipulation" }}>
                    <span style={{ fontSize:"22px" }}>{v.icon}</span>
                    {v.short}
                  </button>
                ))}
              </div>
            </div>
          </Overlay>
        )}
        {/* Loi de l'Achat Interdit — modal */}
        {lawOpen && (
          <div onClick={() => setLawOpen(false)} style={{ position:"fixed", inset:0, background:"#000000d4", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
            <div onClick={e => e.stopPropagation()} className="ornate-corners" style={{ width:"100%", maxWidth:"350px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#150a0a 0%,#0a0606 100%)", border:"1px solid #c0404066", borderTop:"2px solid #c04040", padding:"18px 16px" }}>
              <div style={{ textAlign:"center", fontSize:"26px", color:"#c04040", marginBottom:"6px" }}>⚖</div>
              <div style={{ color:"#8a6a5a", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>ORDO HERETICUS</div>
              <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", margin:"3px 0 12px", textAlign:"center" }}>ACHAT REFUSÉ</div>
              <div style={{ color:"#c8bfa8", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.6, textAlign:"center", marginBottom:"10px" }}>
                « Purge d'abord ta pile, hérétique. {unpainted} âme{unpainted>1?"s":""} attend{unpainted>1?"ent":""} la consécration tandis que tu convoites du plastique neuf. »
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
                <button onClick={() => { onSetShameLaw(true); setLawOpen(false); setShowFactionPicker(true); }}
                  style={{ width:"100%", padding:"9px", background:"none", border:"1px solid #1c1a16", color:"#c4b59a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>J'assume ma honte</button>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 : choisir l'unité */}
        {showUnitModal && (
          <ModalAddUnit faction={modalFaction} inventory={[]} mode="wishlist"
            onClose={() => setShowUnitModal(false)}
            onAdd={entry => { onAdd({ unitId:entry.unitId, faction:entry.faction, qty:entry.qty||1, id:uid(), status:"wanted", price:0 }); setShowUnitModal(false); }} />
        )}
      </>)}

      {/* ── TAB PEINTURES ── */}
      {tab==="paints" && (<>
        <div style={{ padding:"8px 12px", background:"rgba(2,2,2,0.5)", borderBottom:"1px solid #0f0f0f" }}>
          <input value={paintSearch} onChange={e=>setPaintSearch(e.target.value)}
            placeholder="Rechercher une peinture..."
            style={{ width:"100%", background:"#060402", border:"1px solid #1c1c1c", color:"#e8dfc0", padding:"8px 10px", fontSize:"13px", outline:"none", marginBottom:"8px", fontFamily:"'Crimson Pro',serif", boxSizing:"border-box" }} />
          <div style={{ display:"flex", gap:"4px", overflowX:"auto" }}>
            {["all",...Object.keys(CITADEL_TYPES)].map(t => (
              <button key={t} onClick={() => setPaintFilter(t)}
                style={{ padding:"3px 10px", background:paintFilter===t?(CITADEL_TYPES[t]?.color||"#b8922a")+"33":"#060402",
                  border:`1px solid ${paintFilter===t?(CITADEL_TYPES[t]?.color||"#b8922a")+"88":"#1c1c1c"}`,
                  color:paintFilter===t?(CITADEL_TYPES[t]?.color||"#b8922a"):"#9a8a78",
                  fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                {t==="all"?"TOUT":t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
          {pw.length>0 && (
            <div className="hc-bare orn" style={{ marginBottom:"12px", padding:"8px 12px", background:"rgba(10,12,8,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #2a3a1a", borderLeft:"3px solid #5a8a3a" }}>
              <div style={{ color:"#5a8a3a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginBottom:"6px" }}>MA LISTE ({pw.length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {pw.map(p => (
                  <div key={p.id} className="hc-bare" style={{ display:"flex", alignItems:"center", gap:"4px", background:"rgba(6,8,4,0.6)", border:`1px solid ${CITADEL_TYPES[p.type]?.color||"#555"}44`, padding:"3px 8px" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:CITADEL_TYPES[p.type]?.color||"#888", flexShrink:0 }} />
                    <span style={{ color:"#c8b890", fontSize:"11.5px" }}>{p.name}</span>
                    <span style={{ color:"#4a6a2a", fontSize:"12px", fontWeight:"700" }}>{(CITADEL_TYPES[p.type]?.price||5.60).toFixed(2)}€</span>
                    <button onClick={() => onDeletePaint(p.id)} style={{ background:"none", border:"none", color:"#251810", cursor:"pointer", padding:"0 2px", fontSize:"11.5px" }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ color:"#4a6a2a", fontSize:"11.5px", marginTop:"8px", fontWeight:"700" }}>Total : {paintTotal.toFixed(2)}€</div>
            </div>
          )}
          {filteredPaints.map(paint => {
            const added = inWishlist(paint.name);
            const tc = CITADEL_TYPES[paint.type];
            return (
              <div key={paint.name} className="hc-bare" style={{ display:"flex", alignItems:"center", gap:"10px", padding:"7px 10px", marginBottom:"3px", background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1a1816", borderLeft:`3px solid ${added?tc.color:tc.color+"33"}`, opacity:added?1:0.7 }}>
                <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:tc.color, flexShrink:0, boxShadow:added?`0 0 6px ${tc.color}`:"none" }} />
                <div style={{ flex:1 }}>
                  <div style={{ color:added?"#e8dfc0":"#8a7050", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{paint.name}</div>
                  <div style={{ color:tc.color, fontSize:"11px", opacity:0.7, letterSpacing:"1px" }}>{paint.type.toUpperCase()}</div>
                </div>
                <span style={{ color:"#5a8a3a", fontSize:"11.5px", fontWeight:"700", minWidth:"36px", textAlign:"right" }}>{tc.price.toFixed(2)}€</span>
                <button onClick={() => added ? onDeletePaint(pw.find(p=>p.name===paint.name)?.id) : onAddPaint({id:uid(), name:paint.name, type:paint.type, qty:1})}
                  style={{ background:added?"#1a0a0a":"#0a1008", border:`1px solid ${added?"#7a1515":tc.color+"55"}`, color:added?"#c04040":tc.color, cursor:"pointer", padding:"4px 10px", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", flexShrink:0, touchAction:"manipulation" }}>
                  {added?"RETIRER":"+ AJOUTER"}
                </button>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ── TAB IMPRESSION ── */}
      {tab==="print" && (
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
          {(printList||[]).length === 0
            ? <EmptyState icon="⎙" title="Nulle impression en attente" sub="Consigne ici tes fichiers STL à faire imprimer." />
            : (printList||[]).map((item, idx) => (
              <div key={item.id} className="hc-bare orn" style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:"rgba(13,11,8,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a16", marginBottom:"6px" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Cinzel',serif", marginBottom:"2px" }}>{item.name}{item.qty > 1 && <span style={{ color:"#b8922a", fontSize:"12px" }}> ×{item.qty}</span>}</div>
                  {item.faction && <div style={{ fontSize:"11.5px" }}><FactionIcon faction={item.faction} size={13} /> <span style={{ color:"#c8b49a", fontSize:"12px" }}>{FACTIONS[item.faction]?.short}</span></div>}
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {[{k:"todo",l:"À imprimer",c:"#6a5a4a"},{k:"printing",l:"En cours",c:"#8a7a2a"},{k:"done",l:"Imprimé",c:"#2a7a2a"}].map(s => (
                      <button key={s.k} onClick={() => onUpdatePrint(item.id,{status:s.k})}
                        style={{ padding:"2px 8px", background:item.status===s.k?`${s.c}22`:"transparent", border:`1px solid ${item.status===s.k?s.c:"#1c1c1c"}`, color:item.status===s.k?s.c:"#4a3c28", fontSize:"11px", fontFamily:"'Cinzel',serif", cursor:"pointer", touchAction:"manipulation" }}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => onDeletePrint(item.id)} style={{ background:"none", border:"1px solid #2a2215", color:"#815a47", cursor:"pointer", padding:"5px", display:"flex", touchAction:"manipulation" }}><Ic.Trash /></button>
              </div>
            ))
          }
          <AddPrintForm onAdd={onAddPrint} />
        </div>
      )}        </div>
  );
}
