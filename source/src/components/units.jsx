import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Ic, Input, Label, Overlay, PrimaryBtn, Sheet, SheetHeader, Thumb, btnSm, qtyBtn } from './ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { CITADEL_TYPES } from '../data/paints.jsx';
import { MODEL_COUNT, POINTS_DB } from '../data/points.jsx';
import { PAINT_KEYS, PAINT_STATUS, UNITS_DB, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { compressPhoto, uid } from '../lib/utils.jsx';
import { wahapediaUrl } from '../lib/wahapedia.jsx';
import { randomName } from '../data/names.jsx';
import { FactionIcon } from './heraldry.jsx';

// ══════════════════════════════════════════════════════════
// PTS BADGE — saisie manuelle
// ══════════════════════════════════════════════════════════

function PtsBadge({ unitId, faction, qty=1, pts, onSetPts }) {
  const f = FACTIONS[faction];
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  // Lookup unit name to get default pts from POINTS_DB
  const unit = findUnit(faction, unitId);
  const defaultPts = unit ? POINTS_DB[unit.name] : null;
  // Use manual override if set, otherwise fall back to POINTS_DB
  const effectivePts = pts || defaultPts;
  const isDefault = !pts && !!defaultPts;  // true = from DB, not manually set
  const total = effectivePts ? effectivePts * qty : null;

  const confirm = () => {
    const n = parseInt(editVal);
    if (!isNaN(n) && n > 0) onSetPts(unitId, faction, n);
    setEditing(false); setEditVal("");
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"3px" }}>
      {editing ? (
        <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
          <input ref={inputRef} type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter") confirm(); if(e.key==="Escape") setEditing(false); }}
            placeholder={effectivePts||"pts"}
            style={{ width:"60px", background:"#030303", border:`1px solid ${f.accent}`, color:f.accent, padding:"4px 6px", fontSize:"14px", fontFamily:"'Cinzel',serif", outline:"none", textAlign:"center" }} />
          <button onClick={confirm} style={{ background:`${f.accent}33`, border:`1px solid ${f.accent}`, color:f.accent, cursor:"pointer", padding:"6px 12px", fontSize:"15px", touchAction:"manipulation" }}>✓</button>
          <button onClick={() => setEditing(false)} style={{ background:"none", border:"1px solid #1c1c1c", color:"#b3a48c", cursor:"pointer", padding:"6px 12px", fontSize:"15px", touchAction:"manipulation" }}>✕</button>
        </div>
      ) : (
        <div onClick={() => { setEditVal(effectivePts||""); setEditing(true); }} title={isDefault?"Points MFM (toucher pour modifier)":"Toucher pour modifier les points"}
          style={{ background:effectivePts?`${f.accent}22`:"#131313", border:`1px solid ${effectivePts?f.accent+"66":"#333"}`, padding:"4px 10px", display:"flex", alignItems:"center", minWidth:"70px", justifyContent:"center", cursor:"pointer", flexDirection:"column", gap:"1px" }}>
          {effectivePts
            ? <>
                <span style={{ color:f.accent, fontWeight:"900", fontFamily:"'Cinzel',serif", fontSize:"15px" }}>{total} pts</span>
                {isDefault && <span style={{ color:`${f.accent}55`, fontSize:"10px", letterSpacing:"1px" }}>MFM</span>}
              </>
            : <span style={{ color:"#6c6341", fontSize:"12.5px" }}>+ pts</span>
          }
        </div>
      )}

    </div>
  );
}

export const WahapediaBtn = ({ unitName, faction, accent }) => (
  <a href={wahapediaUrl(unitName, faction)} target="_blank" rel="noopener noreferrer"
    onClick={e => e.stopPropagation()}
    title={`Ouvrir ${unitName} sur Wahapedia`}
    style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 10px", background:"#0f0c08", border:`1px solid ${accent}55`, color:accent, textDecoration:"none", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", cursor:"pointer", flexShrink:0, touchAction:"manipulation" }}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    WAHA
  </a>
);

// ══════════════════════════════════════════════════════════
// PHOTO PICKER
// ══════════════════════════════════════════════════════════

function PhotoPicker({ photo, onPhoto, accent, size=64 }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = "";
    compressPhoto(file).then(compressed => onPhoto(compressed));
  };
  if (size > 100) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px", width:"100%" }}>
      <div style={{ width:size, height:size, overflow:"hidden", border:`1px solid ${photo?accent+"66":"#1c1c1c"}`, background:"#040404", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {photo ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ textAlign:"center", opacity:0.3 }}><div style={{ fontSize:"36px" }}>✠</div><div style={{ color:accent, fontSize:"12px", marginTop:"6px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>AUCUNE PHOTO</div></div>}
      </div>
      <div style={{ display:"flex", gap:"10px", width:"100%" }}>
        <button onClick={() => cameraRef.current?.click()} style={{ flex:1, padding:"11px 0", background:"#060504", border:`1px solid ${accent}55`, color:accent, fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"1px", cursor:"pointer" }}>◉ APPAREIL</button>
        <button onClick={() => galleryRef.current?.click()} style={{ flex:1, padding:"11px 0", background:"#060504", border:"1px solid #1c1c1c", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"1px", cursor:"pointer" }}>▣ GALERIE</button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
    </div>
  );
  return (
    <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
      <div style={{ width:size, height:size, overflow:"hidden", border:`1px solid ${photo?accent+"55":"#1c1c1c"}`, background:"#040404", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {photo ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"20px", opacity:0.2 }}>✠</span>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        <button onClick={() => cameraRef.current?.click()} style={{ padding:"7px 14px", background:"#060504", border:`1px solid ${accent}55`, color:accent, fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"1px", cursor:"pointer" }}>◉ Appareil photo</button>
        <button onClick={() => galleryRef.current?.click()} style={{ padding:"7px 14px", background:"#060504", border:"1px solid #1c1c1c", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"1px", cursor:"pointer" }}>▣ Galerie</button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODAL EDIT PHOTO
// ══════════════════════════════════════════════════════════

export function ModalEditPhoto({ item, faction, onClose, onSave }) {
  const f = FACTIONS[faction];
  const unit = findUnit(faction, item.unitId);
  const [photo, setPhoto] = useState(item.photo||null);
  // Sauvegarder immédiatement dans IndexedDB dès que la photo est prise
  // pour survivre au rechargement Android PWA après capture caméra
  const handlePhoto = (newPhoto) => {
    setPhoto(newPhoto);
    onSave(newPhoto); // sauvegarde immédiate sans attendre ENREGISTRER
  };
  return (
    <Overlay>
      <Sheet accent={f.accent}>
        <SheetHeader title="Photo de la figurine" onClose={onClose} accent={f.accent} />
        <div style={{ color:"#706155", fontSize:"13px", textAlign:"center", marginBottom:"16px", fontStyle:"italic" }}>{unit?.name}</div>
        <PhotoPicker photo={photo} onPhoto={handlePhoto} accent={f.accent} size={180} />
        {photo && <button onClick={() => { setPhoto(null); onSave(null); }} style={{ display:"block", width:"100%", marginTop:"12px", background:"none", border:"1px solid #1c1c1c", color:"#935151", padding:"8px", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px" }}>✕ SUPPRIMER LA PHOTO</button>}
        <div style={{ marginTop:"20px" }}>
          <PrimaryBtn color={f.accent} onClick={() => { onClose(); }}>FERMER</PrimaryBtn>
        </div>
      </Sheet>
    </Overlay>
  );
}

export function ModalAddUnit({ faction, inventory, onClose, onAdd, mode="list" }) {
  const f = FACTIONS[faction];
  const units = UNITS_DB[faction]||[];
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [paint, setPaint] = useState("unpainted");
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("Tous");
  const [photo, setPhoto] = useState(null);

  const chapters = (faction==="SM"||faction==="CSM") ? ["Tous",...new Set(units.map(u=>u.chapter).filter(Boolean))] : [];
  const available = mode==="list" ? units.filter(u => inventory.some(i => i.unitId===u.id && i.faction===faction)) : units;
  const filtered = available
    .filter(u => chapterFilter==="Tous" || !u.chapter || u.chapter===chapterFilter || u.chapter==="Générique")
    .filter(u => chapterFilter==="Tous" || !(u.forbidden||[]).includes(chapterFilter))
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = filtered.reduce((acc,u) => { if(!acc[u.role]) acc[u.role]=[]; acc[u.role].push(u); return acc; }, {});

  return (
    <Overlay>
      <Sheet accent={f.accent}>
        <SheetHeader title={mode==="list"?"Ajouter à la liste":"Ajouter à l'inventaire"} onClose={onClose} accent={f.accent} />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ marginBottom:"8px" }} />
        {faction==="SM" && (
          <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"10px", paddingBottom:"4px" }}>
            {chapters.map(ch => (
              <button key={ch} onClick={() => setChapterFilter(ch)} style={{ ...btnSm, whiteSpace:"nowrap", fontSize:"11.5px", borderColor:chapterFilter===ch?f.accent:"#333", color:chapterFilter===ch?f.accent:"#555", background:chapterFilter===ch?`${f.accent}15`:"transparent" }}>{ch}</button>
            ))}
          </div>
        )}
        <div style={{ overflowY:"auto", maxHeight:"28vh", marginBottom:"16px" }}>
          {Object.entries(grouped).map(([role,roleUnits]) => (
            <div key={role}>
              <div style={{ color:"#8a7a5e", fontSize:"11.5px", letterSpacing:"2px", padding:"6px 4px 4px", fontFamily:"'Cinzel',serif" }}>{role.toUpperCase()}</div>
              {roleUnits.map(u => (
                <div key={u.id} onClick={() => setSelected(u.id)} style={{ padding:"9px 12px", marginBottom:"3px", background:selected===u.id?`${f.accent}22`:"#111", border:`1px solid ${selected===u.id?f.accent:"#222"}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ color:selected===u.id?"#fff":"#ccc", fontSize:"14px" }}>{u.name}</div>
                    {u.chapter && u.chapter!=="Générique" && <div style={{ color:f.accent, fontSize:"11.5px", opacity:0.7 }}>{u.chapter}</div>}
                  </div>
                  <span style={{ color:f.accent, fontSize:"16px" }}>✦</span>
                </div>
              ))}
            </div>
          ))}
          {filtered.length===0 && <div style={{ color:"#6c6341", textAlign:"center", padding:"20px", fontSize:"14px" }}>Aucun résultat</div>}
        </div>
        {selected && (
          <>
            <Label>Quantité</Label>
            <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"16px" }}>
              <button onClick={() => setQty(Math.max(1,qty-1))} style={qtyBtn}>−</button>
              <span style={{ color:"#e8dfc0", fontSize:"20px", fontWeight:"700", minWidth:"30px", textAlign:"center" }}>{qty}</span>
              <button onClick={() => setQty(qty+1)} style={qtyBtn}>+</button>
            </div>
            {(mode==="inventory") && (
              <>
                <Label>Statut peinture</Label>
                <div style={{ display:"flex", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
                  {Object.entries(PAINT_STATUS).map(([k,v]) => (
                    <button key={k} onClick={() => setPaint(k)} style={{ ...btnSm, borderColor:paint===k?v.color:"#636363", color:paint===k?"#fff":"#666", background:paint===k?`${v.color}33`:"transparent" }}>{v.label}</button>
                  ))}
                </div>
                <Label>Photo (optionnel)</Label>
                <div style={{ marginBottom:"16px" }}>
                  <PhotoPicker photo={photo} onPhoto={setPhoto} accent={f.accent} size={80} />
                </div>
              </>
            )}
          </>
        )}
        <PrimaryBtn color={f.accent} onClick={() => {
          if(!selected) return;
          // In list mode, link to an existing inventory item if available
          // In inventory mode, always create a new separate entry
          const invItem = mode==="list" ? inventory.find(i => i.unitId===selected && i.faction===faction) : null;
          onAdd({ unitId:selected, faction, qty, paintStatus:paint, photo, inventoryId:invItem?.id });
          onClose();
        }}>
          AJOUTER
        </PrimaryBtn>
      </Sheet>
    </Overlay>
  );
}

function PaintCycleBtn({ status, onCycle, onSet }) {
  const ps = PAINT_STATUS[status]||PAINT_STATUS.unpainted;
  const [animKey, setAnimKey] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lpRef = useRef(null);
  const clearLP = () => { if (lpRef.current) { clearTimeout(lpRef.current); lpRef.current = null; } };
  const handleClick = () => {
    setAnimKey(k => k+1);
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 400);
    onCycle();
  };
  return (
    <div style={{ position:"relative" }}>
    <button onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      onTouchStart={() => { clearLP(); lpRef.current = setTimeout(() => setMenuOpen(true), 500); }}
      onTouchEnd={clearLP}
      onTouchMove={clearLP}
      title="Tap : avancer · appui long : choisir"
      style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 12px",
        background:"#0d0b08", border:`1px solid ${ps.color}66`, cursor:"pointer",
        transition:"border-color 0.3s, background 0.3s", touchAction:"manipulation",
        position:"relative", overflow:"hidden" }}>
      {/* Ripple effect */}
      {showRipple && (
        <div style={{ position:"absolute", inset:0, background:`${ps.color}22`,
          animation:"paintPop 0.35s ease both", borderRadius:"inherit", pointerEvents:"none" }} />
      )}
      <div key={animKey} style={{ width:"8px", height:"8px", borderRadius:"50%", background:ps.color, flexShrink:0,
        boxShadow:`0 0 6px ${ps.color}`, animation:"paintPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }} />
      <span key={animKey+"t"} style={{ fontSize:"11.5px", color:ps.color, fontFamily:"'Cinzel',serif", letterSpacing:"1px", whiteSpace:"nowrap",
        animation:"slideLeft 0.2s ease both" }}>{ps.label}</span>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={ps.color} strokeWidth="2.5" opacity="0.7"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    {menuOpen && (
      <>
        <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:200 }} />
        <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0, zIndex:201, background:"#0d0b08", border:"1px solid #b8922a66", boxShadow:"0 4px 20px #000c", minWidth:"120px", animation:"splashIn 0.2s ease both" }}>
          {PAINT_KEYS.map(k => {
            const p = PAINT_STATUS[k];
            const cur = k === status;
            return (
              <button key={k} onClick={() => { onSet && onSet(k); setMenuOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"9px 12px", background: cur?`${p.color}18`:"none", border:"none", borderLeft:`2px solid ${cur?p.color:"transparent"}`, color: cur?p.color:"#d8c8ac", cursor:"pointer", touchAction:"manipulation", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"1px", textAlign:"left" }}>
                <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:p.color, flexShrink:0 }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </>
    )}
    </div>
  );
}

function QtyEditor({ qty, onUpdate, accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"2px" }}>
      <button onClick={() => qty>1 && onUpdate(qty-1)}
        style={{ width:"32px", height:"32px", background:"#0f0c08", border:`1px solid ${accent}55`, color: qty>1?accent:"#7a6a58", cursor: qty>1?"pointer":"default", fontSize:"18px", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>−</button>
      <div style={{ minWidth:"30px", textAlign:"center", fontSize:"14px", color:accent, fontFamily:"'Cinzel',serif", fontWeight:"700", background:"#080604", border:`1px solid ${accent}33`, padding:"4px 6px" }}>{qty}</div>
      <button onClick={() => onUpdate(qty+1)}
        style={{ width:"32px", height:"32px", background:"#0f0c08", border:`1px solid ${accent}55`, color:accent, cursor:"pointer", fontSize:"18px", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>+</button>
    </div>
  );
}

export function InventoryItem({ paintHistory, item, faction, ptsMap, onSetPts, honors, colossus, onUpdateColosse, onReplayCeremony, onDelete, onEditPhoto, onUpdatePaint, onUpdateQty, onUpdateModelCount, onUpdateNote, onUpdateNickname, onUpdatePurchased, onSplit, accent, viewMode, dragHandleProps, autoOpen, onAutoOpened, paintCatalog, onSetRecipe, siblings, onAddPaint, confirm }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusPick, setStatusPick] = useState(false); // choix du statut ouvert dans la fiche
  useEffect(() => { if (!sheetOpen) setStatusPick(false); }, [sheetOpen]);
  const [nickEdit, setNickEdit] = useState("");
  useBackButton(sheetOpen, React.useCallback(() => setSheetOpen(false), []));
  useEffect(() => { if (autoOpen) { setSheetOpen(true); onAutoOpened && onAutoOpened(); } }, [autoOpen]);


  const [noteOpen, setNoteOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeSel, setRecipeSel] = useState([]);
  const [newPaintName, setNewPaintName] = useState("");
  const [newPaintType, setNewPaintType] = useState("Base");
  const [splitN, setSplitN] = useState(1);
  const [splitStatus, setSplitStatus] = useState("unpainted");
  useBackButton(splitOpen, React.useCallback(() => setSplitOpen(false), []));
  const [noteVal, setNoteVal] = useState("");
  useBackButton(noteOpen, React.useCallback(() => setNoteOpen(false), []));
  const f = FACTIONS[faction] || FACTIONS["SM"];
  const ps = PAINT_STATUS[item.paintStatus]||PAINT_STATUS.unpainted;
  const defaultCount = MODEL_COUNT[item.unit?.name] || 1;
  const modelCount = item.modelCount || defaultCount;
  const totalFigs = modelCount * (item.qty||1);
  const cycleStatus = () => {
    const idx = PAINT_KEYS.indexOf(item.paintStatus||"unpainted");
    const next = PAINT_KEYS[(idx+1) % PAINT_KEYS.length];
    onUpdatePaint(item.id, next);
  };
  const borderColor = item.paintStatus==="painted" ? PAINT_STATUS.painted.color
    : item.paintStatus==="wip" ? PAINT_STATUS.wip.color
    : item.paintStatus==="primed" ? PAINT_STATUS.primed.color
    : accent;

  const sheetAndNote = createPortal((<>
          {sheetOpen && (
            <div onClick={() => setSheetOpen(false)} style={{ position:"fixed", inset:0, background:"#000000d8", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 0", overflowY:"auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"430px", maxHeight:"88dvh", overflowY:"auto", WebkitOverflowScrolling:"touch", animation:"splashIn 0.28s ease both", backgroundColor:"#0a0806", backgroundImage:`linear-gradient(180deg, rgba(8,6,4,0.6) 0%, rgba(8,6,4,0.8) 100%), url(${import.meta.env.BASE_URL}fonds/reliques.jpg)`, backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${accent}44`, borderTop:`3px solid ${accent}`, padding:"0 0 18px" }}>
                {/* Photo large */}
                <div onClick={() => { setSheetOpen(false); onEditPhoto(item); }} style={{ width:"100%", height:"180px", background:"#040404", overflow:"hidden", position:"relative", cursor:"pointer" }}>
                  {item.photo
                    ? <img src={item.photo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"6px", color:"#6d6253" }}><span style={{ fontSize:"34px" }}>◉</span><span style={{ fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>AJOUTER UNE PHOTO</span></div>}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 55%,rgba(8,6,4,0.8) 100%)", borderBottom:`1px solid ${accent}44` }} />
                </div>
                <div style={{ padding:"12px 16px 0" }}>
                  {/* En-tête */}
                  <div style={{ color:"#b3a48c", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}><FactionIcon faction={faction} size={12} /> {FACTIONS[faction]?.label?.toUpperCase()} · {item.unit.role?.toUpperCase()}</div>
                  <div style={{ color:"#e8dfc0", fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"700", margin:"3px 0 10px" }}>{item.unit.name}</div>
                  {/* Titres honorifiques (calculés automatiquement) */}
                  {honors?.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", margin:"-4px 0 12px" }}>
                      {honors.map(h => (
                        <span key={h.key} title={h.desc} style={{ padding:"3px 9px", border:`1px solid ${accent}77`, background:`${accent}14`, color:"#e8d4a0", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>✦ {h.label}</span>
                      ))}
                    </div>
                  )}
                  {honors?.length > 0 && <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"-6px 0 12px", lineHeight:1.4 }}>{honors.map(h => h.desc).join(" ")}</div>}
                  {/* Colosse : automatique (300 pts par figurine, ou grand Chevalier), forçable oui / non */}
                  {onUpdateColosse && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center", margin:"-2px 0 12px" }}>
                      <button onClick={() => onUpdateColosse(item.id, item.colosse == null ? true : item.colosse === true ? false : null)} /* auto → oui → non → auto */
                        title="Automatique · Oui · Non"
                        style={{ padding:"5px 10px", background: colossus ? `${accent}1c` : "none", border:`1px solid ${colossus ? accent : "#3a3020"}`, color: colossus ? "#e8d4a0" : "#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"1.5px", cursor:"pointer" }}>
                        ◈ COLOSSE : {colossus ? "OUI" : "NON"}{item.colosse === true || item.colosse === false ? " (forcé)" : " (auto)"}
                      </button>
                      {colossus && item.paintStatus === "painted" && onReplayCeremony && (
                        <button onClick={() => { setSheetOpen(false); onReplayCeremony(item.id); }}
                          style={{ padding:"5px 10px", background:"none", border:"1px solid #3a3020", color:"#b8a882", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"1.5px", cursor:"pointer" }}>
                          ▸ REVOIR LA CÉRÉMONIE
                        </button>
                      )}
                    </div>
                  )}
                  {/* Nom de baptême */}
                  <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>NOM DE BAPTÊME</div>
                  <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                    <input value={nickEdit} onChange={e => setNickEdit(e.target.value)} placeholder="ex : Lucius Ira Mortis"
                      style={{ flex:1, background:"#060402", border:`1px solid ${accent}44`, color:accent, padding:"9px 10px", fontSize:"15px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", outline:"none", boxSizing:"border-box" }} />
                    <button onClick={() => {
                        setNickEdit(n => randomName(item.faction, n)); // noms variés selon la faction (data/names.jsx)
                      }}
                      style={{ width:"40px", background:"#0d0b08", border:`1px solid ${accent}44`, color:accent, fontSize:"15px", cursor:"pointer", flexShrink:0 }}>⚄</button>
                  </div>
                  {/* Infos clés */}
                  <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:"90px", background:"#0a0806", border:"1px solid #16130e", padding:"8px 10px" }}>
                      <div style={{ color:accent, fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{((ptsMap[`${faction}:${item.unitId}`] || POINTS_DB[item.unit.name] || 0) * (item.qty||1))}</div>
                      <div style={{ color:"#9a8a6a", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>POINTS</div>
                    </div>
                    <div style={{ flex:1, minWidth:"90px", background:"#0a0806", border:"1px solid #16130e", padding:"8px 10px" }}>
                      <div style={{ color:"#e8dfc0", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{totalFigs}</div>
                      <div style={{ color:"#9a8a6a", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>FIGURINES</div>
                    </div>
                    {/* Statut : se touche pour le changer sans quitter la fiche */}
                    <button type="button" disabled={!onUpdatePaint} onClick={() => setStatusPick(v => !v)} aria-expanded={statusPick}
                      style={{ flex:1, minWidth:"90px", background:"#0a0806", border:`1px solid ${statusPick ? ps.color : ps.color + "66"}`, padding:"8px 10px", textAlign:"left", cursor: onUpdatePaint ? "pointer" : "default", touchAction:"manipulation", display:"block" }}>
                      <div style={{ color:ps.color, fontSize:"12.5px", fontFamily:"'Cinzel',serif", fontWeight:"700", paddingTop:"3px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"6px" }}>
                        <span>{ps.label}</span>
                        {onUpdatePaint && <span style={{ fontSize:"10px", color:"#9a8a6a", transform: statusPick ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▼</span>}
                      </div>
                      <div style={{ color:"#9a8a6a", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>STATUT</div>
                    </button>
                  </div>
                  {statusPick && onUpdatePaint && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", margin:"-4px 0 12px" }}>
                      {PAINT_KEYS.map(k => {
                        const st = PAINT_STATUS[k]; const current = (item.paintStatus || "unpainted") === k;
                        return (
                          <button key={k} type="button" onClick={() => {
                              setStatusPick(false);
                              if (current) return;
                              // « Peint » déclenche la cérémonie : on ferme la fiche pour la laisser s'afficher
                              if (k === "painted") setSheetOpen(false);
                              onUpdatePaint(item.id, k);
                            }}
                            style={{ flex:"1 1 30%", minHeight:"40px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"8px 6px", background: current ? `${st.color}26` : "#0a0806", border:`1px solid ${current ? st.color : st.color + "55"}`, color: current ? "#e8dfc0" : "#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"1px", cursor:"pointer", touchAction:"manipulation" }}>
                            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:st.color, flexShrink:0, boxShadow: current ? `0 0 6px ${st.color}` : "none" }} />
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Dates */}
                  <div style={{ color:"#c8b9a0", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"12px" }}>
                    {item.purchasedAt && <span>Acquis en {item.purchasedAt.split("-")[1]}/{item.purchasedAt.split("-")[0]}</span>}
                    {item.purchasedAt && item.paintedAt && <span> · </span>}
                    {item.paintedAt && <span>Peint en {item.paintedAt.split("-")[1]}/{item.paintedAt.split("-")[0]}</span>}
                    {!item.purchasedAt && !item.paintedAt && <span>Aucune date renseignée — vois la Pile of Shame pour dater l'acquisition.</span>}
                  </div>
                  {/* Relique héroïque */}
                  {item.paintStatus === "painted" && (() => {
                    const idx = (paintHistory||[]).findIndex(h => h.id === item.id);
                    const rank = idx >= 0 ? idx + 1 : null;
                    const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
                    const mth = item.paintedAt ? MONTHS[parseInt(item.paintedAt.split("-")[1])-1] : null;
                    const yr = item.paintedAt ? item.paintedAt.split("-")[0] : null;
                    const seed = Math.abs(Math.floor(Number(item.id)) || 0) + (rank||0);   // identifiant non numérique : 0, jamais « undefined »
                    const de = (w) => /^[aeiouyàâéèêîôûh]/i.test(w) ? `d'${w.toLowerCase()}` : `de ${w.toLowerCase()}`;   // « d'octobre », « de mars »
                    const m = mth ? mth.toLowerCase() : null;
                    const openings = [
                      `Consacré durant la Croisade ${mth ? de(mth) : "de jadis"}`,
                      `Béni sous les auspices ${mth ? de(mth) : "de l'oubli"}`,
                      `Sorti des forges en ${m||"des temps anciens"}`,
                      `Achevé au terme d'une longue vigile ${mth ? de(mth) : "de labeur"}`,
                      `Éveillé à la couleur en ${m||"un temps oublié"}`,
                      `Inscrit au registre en ${m||"des jours lointains"}`,
                      `Passé du gris à la gloire en ${m||"d'autres temps"}`,
                      `Marqué du sceau de pureté en ${m||"secret"}`,
                    ];
                    const nthM = rank === 1 ? "premier" : `${rank}ᵉ`, nthF = rank === 1 ? "première" : `${rank}ᵉ`;
                    const closings = rank ? [
                      `, il fut le ${nthM} à recevoir la bénédiction du pinceau.`,
                      `, ${nthF} relique inscrite au registre de ce Codex.`,
                      `, prenant sa place comme ${nthF} gloire de cette collection.`,
                      `, ${nthM} à quitter le gris pour la gloire.`,
                      `, et le registre le compte ${nthM} parmi les consacrés.`,
                      `, ${nthM} sceau apposé par ta main.`,
                    ] : [`, son inscription au registre demeure incertaine.`];
                    const line = openings[seed % openings.length] + (yr ? ` ${yr}` : "") + closings[seed % closings.length];
                    return (
                      <div style={{ background:"#0a0806", borderLeft:`2px solid ${accent}`, padding:"9px 11px", marginBottom:"12px" }}>
                        <div style={{ color:accent, fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>✠ RELIQUE CONSACRÉE</div>
                        <div style={{ color:"#c8bfa8", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5 }}>{line}</div>
                      </div>
                    );
                  })()}
                  {/* Note */}
                  {item.note && (
                    <div style={{ background:"#0a0806", borderLeft:`2px solid ${accent}66`, padding:"8px 10px", marginBottom:"12px" }}>
                      <div style={{ color:"#d8c8ac", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"3px" }}>ANNOTATION</div>
                      <div style={{ color:"#c8bfa8", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", whiteSpace:"pre-wrap" }}>{item.note}</div>
                    </div>
                  )}
                  {/* Recette de peinture */}
                  {item.recipe && item.recipe.length > 0 && (() => {
                    const usedPaints = item.recipe.map(pid => (paintCatalog||[]).find(p => p.id === pid)).filter(Boolean);
                    const byType = {};
                    usedPaints.forEach(p => { (byType[p.type] = byType[p.type] || []).push(p); });
                    return (
                      <div style={{ background:"#0a0806", borderLeft:`2px solid ${accent}66`, padding:"8px 10px", marginBottom:"12px" }}>
                        <div style={{ color:"#d8c8ac", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>◈ RECETTE DE PEINTURE</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                          {Object.entries(byType).map(([type, paints]) => (
                            <div key={type} style={{ display:"flex", alignItems:"baseline", gap:"6px", flexWrap:"wrap" }}>
                              <span style={{ color:CITADEL_TYPES[type]?.color||"#888", fontSize:"10px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", flexShrink:0 }}>{type.toUpperCase()}</span>
                              <span style={{ color:"#c8bfa8", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif" }}>{paints.map(p=>p.name).join(", ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Scinder l'entrée (escouade peinte en plusieurs fois) */}
                  {onSetRecipe && (
                    <button onClick={() => { setRecipeSel(item.recipe || []); setRecipeOpen(true); }}
                      style={{ width:"100%", padding:"10px", marginBottom:"8px", background:"none", border:"1px dashed #2a2215", color:"#7a6a48", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
                      ◈ RECETTE · {item.recipe?.length ? `${item.recipe.length} peinture${item.recipe.length>1?"s":""}` : "à renseigner"}
                    </button>
                  )}
                  {onSplit && totalFigs > 1 && (
                    <button onClick={() => { setSplitN(Math.floor(totalFigs/2)); setSplitStatus("unpainted"); setSplitOpen(true); }}
                      style={{ width:"100%", padding:"10px", marginBottom:"8px", background:"none", border:"1px dashed #2a2215", color:"#7a6a48", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
                      ⑂ SCINDER · {totalFigs} figurines
                    </button>
                  )}
                  {/* Actions */}
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button onClick={() => { const doDelete = () => { setSheetOpen(false); onDelete(item.id); }; confirm ? confirm(`Supprimer "${item.unit.name}" ? Sa recette, ses photos et ses notes seront perdues définitivement.`, doDelete, "#c04040", "SUPPRIMER", false) : doDelete(); }}
                      title="Supprimer cette relique"
                      style={{ width:"44px", padding:"11px 0", background:"none", border:"1px solid #3a2215", color:"#815a47", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.Trash /></button>
                    <a href={wahapediaUrl(item.unit.name, faction)} target="_blank" rel="noopener noreferrer"
                      style={{ flex:1, padding:"11px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", textAlign:"center", textDecoration:"none" }}>▤ WAHAPEDIA</a>
                    <button onClick={() => { onUpdateNickname && onUpdateNickname(item.id, nickEdit.trim()); setSheetOpen(false); }}
                      style={{ flex:1, padding:"11px", background:accent+"22", border:`1px solid ${accent}`, color:accent, fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ SCELLER</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {noteOpen && (
            <div onClick={() => setNoteOpen(false)} style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"380px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#14100a 0%,#0a0806 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"16px" }}>
                <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>ANNOTATION DU SCRIBE</div>
                <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginBottom:"10px" }}>{item.unit?.name || "Note"}</div>
                <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} rows={4} autoFocus
                  placeholder="Schéma de peinture, pièces manquantes, souvenirs de bataille..."
                  style={{ width:"100%", background:"#060402", border:"1px solid #2a2215", color:"#e8dfc0", padding:"10px", fontSize:"14px", fontFamily:"'Crimson Pro',serif", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                  <button onClick={() => setNoteOpen(false)}
                    style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
                  <button onClick={() => { onUpdateNote && onUpdateNote(item.id, noteVal); setNoteOpen(false); }}
                    style={{ flex:1, padding:"10px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ SCELLER</button>
                </div>
              </div>
            </div>
          )}
          {recipeOpen && (
            <div onClick={() => setRecipeOpen(false)} style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"380px", maxHeight:"85dvh", display:"flex", flexDirection:"column", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#14100a 0%,#0a0806 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"16px" }}>
                <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>RECETTE DE PEINTURE</div>
                <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginBottom:"6px" }}>{item.unit?.name || "Recette"}</div>
                <div style={{ color:"#8a7a5a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"12px", lineHeight:1.4 }}>
                  Tape sur chaque peinture utilisée pour cette figurine — elle se coche et rejoint la recette. Retape pour la retirer.
                </div>
                {/* Copie rapide depuis une figurine soeur déjà renseignée */}
                {recipeSel.length === 0 && siblings && siblings.some(s => s.recipe?.length) && (() => {
                  const source = siblings.find(s => s.recipe?.length);
                  return (
                    <button onClick={() => setRecipeSel(source.recipe)}
                      style={{ width:"100%", textAlign:"left", padding:"9px 11px", marginBottom:"12px", background:`${accent}15`, border:`1px solid ${accent}55`, color:accent, fontFamily:"'Crimson Pro',serif", fontSize:"12.5px", fontStyle:"italic", cursor:"pointer" }}>
                      ▤ Copier la recette d'une figurine identique de ta collection ({source.recipe.length} peinture{source.recipe.length>1?"s":""})
                    </button>
                  );
                })()}
                <div style={{ flex:1, overflowY:"auto", marginBottom:"12px" }}>
                  {(!paintCatalog || paintCatalog.length === 0) && (
                    <div style={{ color:"#8a7a5a", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", padding:"10px 0 18px" }}>
                      Ton catalogue de recettes est vide. Ajoute une première peinture ci-dessous — indépendant de ta WISHLIST.
                    </div>
                  )}
                  {recipeSel.length > 0 && (
                    <div style={{ color:accent, fontSize:"11.5px", fontFamily:"'Cinzel',serif", marginBottom:"10px" }}>✓ {recipeSel.length} peinture{recipeSel.length>1?"s":""} sélectionnée{recipeSel.length>1?"s":""}</div>
                  )}
                  {Object.keys(CITADEL_TYPES).filter(t => !["CSM","IK"].includes(t)).map(type => {
                    const paints = (paintCatalog||[]).filter(p => p.type === type);
                    if (!paints.length) return null;
                    return (
                      <div key={type} style={{ marginBottom:"12px" }}>
                        <div style={{ color:CITADEL_TYPES[type]?.color||"#888", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>{type.toUpperCase()}</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                          {paints.map(p => {
                            const on = recipeSel.includes(p.id);
                            const col = CITADEL_TYPES[type]?.color||"#888";
                            return (
                              <button key={p.id} onClick={() => setRecipeSel(sel => on ? sel.filter(id=>id!==p.id) : [...sel, p.id])}
                                style={{ display:"flex", alignItems:"center", gap:"9px", width:"100%", textAlign:"left", padding:"9px 11px", background: on ? col : "#0a08055a", border:`1px solid ${on?col:"#2a2215"}`, cursor:"pointer", touchAction:"manipulation" }}>
                                <span style={{ width:"16px", height:"16px", flexShrink:0, border:`1.5px solid ${on?"#020202":"#4a3c28"}`, background: on ? "#020202" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12.5px", color: on ? col : "transparent", fontWeight:"900" }}>✓</span>
                                <span style={{ color: on ? "#020202" : "#c8b9a0", fontFamily:"'Crimson Pro',serif", fontSize:"13px", fontWeight: on?"700":"400" }}>{p.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Ajout rapide — toujours accessible, même catalogue vide */}
                  {onAddPaint && (
                    <div style={{ marginTop:"6px", paddingTop:"12px", borderTop:"1px solid #1c1a16" }}>
                      <div style={{ color:"#8a7a5a", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>UNE COULEUR N'APPARAÎT PAS ?</div>
                      <input type="text" value={newPaintName} onChange={e => setNewPaintName(e.target.value)}
                        placeholder="Nom de la peinture…"
                        style={{ width:"100%", background:"#0a08055a", border:"1px solid #2a2215", color:"#e8dfc0", padding:"8px 10px", fontSize:"13px", fontFamily:"'Crimson Pro',serif", outline:"none", boxSizing:"border-box", marginBottom:"6px" }} />
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"8px" }}>
                        {Object.keys(CITADEL_TYPES).filter(t => !["CSM","IK"].includes(t)).map(type => (
                          <button key={type} onClick={() => setNewPaintType(type)}
                            style={{ padding:"4px 8px", background: newPaintType===type ? CITADEL_TYPES[type]?.color : "transparent", border:`1px solid ${CITADEL_TYPES[type]?.color||"#888"}`, color: newPaintType===type ? "#020202" : CITADEL_TYPES[type]?.color, fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor:"pointer" }}>
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => {
                          if (!newPaintName.trim()) return;
                          const newId = uid();
                          onAddPaint({ id:newId, name:newPaintName.trim(), type:newPaintType, qty:1 });
                          setRecipeSel(sel => [...sel, newId]);
                          setNewPaintName("");
                        }}
                        disabled={!newPaintName.trim()}
                        style={{ width:"100%", padding:"9px", background: newPaintName.trim() ? `${accent}22` : "none", border:`1px solid ${newPaintName.trim()?accent:"#2a2215"}`, color: newPaintName.trim() ? accent : "#5a4c3a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor: newPaintName.trim()?"pointer":"default" }}>
                        + AJOUTER ET SÉLECTIONNER
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                  <button onClick={() => setRecipeOpen(false)}
                    style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
                  <button onClick={() => { onSetRecipe && onSetRecipe(item.id, recipeSel); setRecipeOpen(false); }}
                    style={{ flex:1, padding:"10px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ SCELLER</button>
                </div>
              </div>
            </div>
          )}
          {splitOpen && (
            <div onClick={() => setSplitOpen(false)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:401, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", overflowY:"auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"330px", background:"linear-gradient(180deg,#14100a,#0a0806)", border:"1px solid #b8922a66", borderTop:`2px solid ${accent}`, padding:"20px 18px", animation:"splashIn 0.28s ease both" }}>
                <div style={{ fontSize:"24px", textAlign:"center", marginBottom:"2px" }}>⑂</div>
                <div style={{ color:accent, fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center" }}>SCINDER L'ENTRÉE</div>
                <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", margin:"6px 0 16px" }}>{item.unit.name} · {totalFigs} figurines</div>

                <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>FIGURINES À DÉTACHER</div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                  <button onClick={() => setSplitN(n => Math.max(1, n-1))} style={{ width:"38px", height:"38px", background:"#060402", border:"1px solid #2a2215", color:"#d8c8ac", fontSize:"18px", cursor:"pointer" }}>−</button>
                  <div style={{ flex:1, textAlign:"center", color:accent, fontSize:"26px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{splitN}</div>
                  <button onClick={() => setSplitN(n => Math.min(totalFigs-1, n+1))} style={{ width:"38px", height:"38px", background:"#060402", border:"1px solid #2a2215", color:"#d8c8ac", fontSize:"18px", cursor:"pointer" }}>+</button>
                </div>
                <input type="range" min="1" max={Math.max(1,totalFigs-1)} value={splitN} onChange={e => setSplitN(Number(e.target.value))}
                  style={{ width:"100%", accentColor:accent, marginBottom:"6px" }} />
                <div style={{ color:"#c8b9a0", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", marginBottom:"14px" }}>
                  Restera {totalFigs-splitN} en « {PAINT_STATUS[item.paintStatus||"unpainted"]?.label} » · {splitN} détachée{splitN>1?"s":""}
                </div>

                <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"6px" }}>STATUT DES DÉTACHÉES</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"5px", marginBottom:"16px" }}>
                  {Object.entries(PAINT_STATUS).map(([k,v]) => (
                    <button key={k} onClick={() => setSplitStatus(k)}
                      style={{ padding:"9px 2px", background: splitStatus===k?v.color+"33":"#060402", border:`1px solid ${splitStatus===k?v.color:"#78613c"}`, color: splitStatus===k?"#e8dfc0":"#6a5a4a", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"0.5px", cursor:"pointer" }}>{v.label}</button>
                  ))}
                </div>

                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => setSplitOpen(false)} style={{ flex:1, padding:"11px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
                  <button onClick={() => { onSplit(item.id, splitN, splitStatus); setSplitOpen(false); setSheetOpen(false); }}
                    style={{ flex:1.4, padding:"11px", background:accent+"22", border:`1px solid ${accent}`, color:accent, fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>⑂ SCINDER</button>
                </div>
              </div>
            </div>
          )}
  </>), document.body);

  // ── GRID CARD ─────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <div className="hcard card-stagger hc-bare" style={{ background:f.bgCard||"linear-gradient(180deg,rgba(24,21,18,0.6) 0%,rgba(14,12,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:`1px solid ${borderColor}22`, borderTop:`2px solid ${borderColor}`, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", transition:"background 0.4s, border-color 0.3s" }}>
        {/* Photo zone — takes most of the card */}
        <div onClick={() => onEditPhoto(item)} style={{ height:"110px", cursor:"pointer", background:"#040404", position:"relative", overflow:"hidden" }}>
          {item.photo
            ? <Thumb src={item.photo} px={260} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"4px" }}>
                <span style={{ fontSize:"28px", opacity:0.12 }}>{faction==="SM"?"✠":faction==="TY"?"☠":"⚜"}</span>
                <span style={{ color:accent, fontSize:"10px", opacity:0.3, fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>PHOTO</span>
              </div>
          }
          {/* Paint dot top-right */}
          <div style={{ position:"absolute", top:"6px", right:"6px", width:"8px", height:"8px", borderRadius:"50%", background:ps.color, boxShadow:`0 0 6px ${ps.color}88` }} />
          {/* Gradient overlay */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(10,8,6,0.85) 0%,transparent 55%)" }} />
          {/* Name at bottom of photo */}
          <div style={{ position:"absolute", bottom:"6px", left:"7px", right:"7px" }}>
            <div style={{ color:"#e8dfc0", fontSize:"11.5px", fontFamily:"'Cinzel',serif", lineHeight:1.2, textShadow:"0 1px 4px #000" }}>
              {item.qty>1 && <span style={{ color:accent, marginRight:"3px", fontSize:"12px" }}>×{item.qty}</span>}
              {item.unit.name}{honors?.length > 0 && <span style={{ color:accent, marginLeft:"4px" }}>✦</span>}
            </div>
          </div>
        </div>
        {/* Bottom controls */}
        <div style={{ padding:"7px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"4px" }}>
          <QtyEditor qty={item.qty} accent={accent} onUpdate={n => onUpdateQty(item.id, n)} />
          <div style={{ display:"flex", alignItems:"center", gap:"2px" }}>
            <button onClick={() => onUpdateModelCount && onUpdateModelCount(item.id, Math.max(1, modelCount-1))}
              style={{ width:"16px", height:"16px", background:"#060402", border:"1px solid #1c1c1c", color:"#785e41", cursor:"pointer", fontSize:"11.5px", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>−</button>
            <span style={{ color: item.modelCount ? accent : "#9a8a78", fontSize:"12px", fontFamily:"'Cinzel',serif", minWidth:"20px", textAlign:"center" }}>{modelCount}</span>
            <button onClick={() => onUpdateModelCount && onUpdateModelCount(item.id, modelCount+1)}
              style={{ width:"16px", height:"16px", background:"#060402", border:"1px solid #1c1c1c", color:"#785e41", cursor:"pointer", fontSize:"11.5px", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>+</button>
          </div>
          <button onClick={cycleStatus} title="Changer statut peinture"
            style={{ display:"flex", alignItems:"center", gap:"3px", padding:"2px 6px", background:"#060402", border:`1px solid ${ps.color}33`, cursor:"pointer" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:ps.color }} />
            <span style={{ fontSize:"10px", color:ps.color, fontFamily:"'Cinzel',serif" }}>{ps.label}</span>
          </button>
          <button onClick={() => { setNoteVal(item.note||""); setNoteOpen(true); }}
            style={{ background:"none", border:"1px solid #1c1c1c", color: item.note?"#b8922a":"#2a2215", cursor:"pointer", padding:"9px", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation", fontSize:"13px" }}>✎</button>
        </div>
        {sheetAndNote}
      </div>
    );
  }

  // ── LIST CARD (default) ────────────────────────────────
  return (
    <div className="hcard card-stagger hc-bare" style={{ background:f.bgCard||"linear-gradient(180deg,rgba(24,21,18,0.6) 0%,rgba(18,16,8,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:`1px solid ${borderColor}22`, borderLeft:`3px solid ${borderColor}`, marginBottom:"5px", display:"flex", alignItems:"stretch", transition:"background 0.4s, border-color 0.3s" }}>
      {/* Drag handle */}
      <div {...dragHandleProps} style={{ width:"22px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", cursor:"grab", borderRight:"1px solid #1a1a16", touchAction:"none" }}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none"><circle cx="3" cy="3" r="1.5" fill="#9a8a78"/><circle cx="7" cy="3" r="1.5" fill="#9a8a78"/><circle cx="3" cy="8" r="1.5" fill="#9a8a78"/><circle cx="7" cy="8" r="1.5" fill="#9a8a78"/><circle cx="3" cy="13" r="1.5" fill="#9a8a78"/><circle cx="7" cy="13" r="1.5" fill="#9a8a78"/></svg>
      </div>
      {/* Photo */}
      <div onClick={() => onEditPhoto(item)} style={{ width:"62px", flexShrink:0, cursor:"pointer", borderRight:"1px solid #0c0c0c", overflow:"hidden", position:"relative" }}>
        {item.photo ? (
          <>
            <Thumb src={item.photo} px={420} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 45%)" }} />
            <div style={{ position:"absolute", bottom:"3px", right:"3px", fontSize:"11px" }}>◉</div>
          </>
        ) : (
          <div style={{ width:"100%", minHeight:"54px", height:"100%", background:"#040404", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"3px" }}>
            <span style={{ fontSize:"16px", opacity:0.2 }}>◉</span>
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ flex:1, padding:"6px 10px", display:"flex", alignItems:"center", gap:"8px" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
            <div onClick={() => { setNickEdit(item.nickname||""); setSheetOpen(true); }} style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Cinzel',serif", lineHeight:1.25, cursor:"pointer" }}>{item.unit.name}{honors?.length > 0 && <span title={honors.map(h=>h.label).join(", ")} style={{ color:accent, marginLeft:"5px", fontSize:"12px" }}>✦</span>}</div>
            {modelCount > 1 && <span style={{ color:item.modelCount?accent:"#9a8a78", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{totalFigs>modelCount?`${modelCount}×${item.qty}`:`${modelCount}`}fig</span>}
          </div>
          {item.nickname && <div style={{ color:accent, fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"1px", opacity:0.85 }}>« {item.nickname} »</div>}
          {/* Taille de squad — inline avec le nom, compact */}
          <div style={{ display:"flex", gap:"6px", marginTop:"2px", alignItems:"center", flexWrap:"wrap" }}>
            <PaintCycleBtn status={item.paintStatus||"unpainted"} onCycle={cycleStatus} onSet={(s) => onUpdatePaint(item.id, s)} />
            <WahapediaBtn unitName={item.unit.name} faction={faction} accent={accent} />
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
          <QtyEditor qty={item.qty} accent={accent} onUpdate={n => onUpdateQty(item.id, n)} />
          <PtsBadge unitId={item.unit.id} faction={faction} qty={item.qty} pts={ptsMap[`${faction}:${item.unit.id}`]} onSetPts={onSetPts} />
        </div>
      </div>
      {sheetAndNote}
    </div>
  );
}

export function AddPrintForm({ onAdd }) {
  const [step, setStep] = React.useState("idle"); // idle | faction | unit
  const [faction, setFaction] = React.useState("SM");

  if (step === "idle") return (
    <button onClick={() => setStep("faction")} style={{ width:"100%", padding:"10px", background:"#080604", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer", marginTop:"8px", touchAction:"manipulation" }}>
      + AJOUTER UNE FIGURINE
    </button>
  );

  if (step === "faction") return (
    <Overlay>
      <Sheet accent="#b8922a">
        <SheetHeader title="Choisir une faction" onClose={() => setStep("idle")} accent="#b8922a" />
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", padding:"8px 0" }}>
          {Object.entries(FACTIONS).map(([k,v]) => (
            <button key={k} onClick={() => { setFaction(k); setStep("unit"); }}
              style={{ padding:"12px 16px", background:"#0a0806", border:`1px solid ${v.accent}44`, color:v.accent, fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"1px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:"10px", touchAction:"manipulation" }}>
              <span style={{ fontSize:"18px" }}>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
      </Sheet>
    </Overlay>
  );

  return (
    <ModalAddUnit
      faction={faction}
      inventory={[]}
      mode="inventory"
      onClose={() => setStep("idle")}
      onAdd={ent => {
        const unit = findUnit(faction, ent.unitId);
        onAdd({ unitId: ent.unitId, faction, name: unit?.name || ent.unitId, status:"todo" });
        setStep("idle");
      }}
    />
  );
}
