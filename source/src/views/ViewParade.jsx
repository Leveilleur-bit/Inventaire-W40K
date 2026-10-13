import React, { useState, useRef } from 'react';
import { FactionIcon, NavIcon } from '../components/heraldry.jsx';
import { EmptyState, Ic, IconBtn, Overlay, PrimaryBtn, Thumb, pageFond, pageStyle } from '../components/ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { compressPhoto, uid } from '../lib/utils.jsx';

// ══════════════════════════════════════════════════════════
// VIEW: Codex (paramètres + données)
// ══════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════
// VIEW PARADE
// ══════════════════════════════════════════════════════════
export function ViewParade({ parade, onAdd, onDelete, homeBackground, onSetHomeBackground, confirm }) {
  const [selected, setSelected] = useState(null);
  const [vitrine, setVitrine] = useState(false);
  useBackButton(vitrine, React.useCallback(() => setVitrine(false), []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", faction:"SM", date:"", photo:null });
  const fileRef = useRef(null);
  const swipeRef = useRef(null);

  const selectedPhoto = selected !== null ? parade[selected] : (parade.length > 0 ? parade[parade.length-1] : null);
  const selectedIdx = selected !== null ? selected : parade.length > 0 ? parade.length-1 : 0;
  const isHomeBg = !!(selectedPhoto && homeBackground && selectedPhoto.photo === homeBackground);

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = "";
    compressPhoto(file, 1400, 0.88).then(compressed => setForm(f => ({ ...f, photo: compressed })));
  };

  const handleAdd = () => {
    if (!form.photo) return;
    onAdd({
      id: uid(),
      photo: form.photo,
      faction: form.faction,
      date: form.date || new Date().toLocaleDateString("fr-FR"),
    });
    setForm({ title:"", faction:"SM", date:"", photo:null });
    setShowForm(false);
    setSelected(parade.length); // sélectionner la nouvelle photo
  };

  const [posterUrl, setPosterUrl] = useState(null);
  const [posterBusy, setPosterBusy] = useState(false);
  useBackButton(!!posterUrl, React.useCallback(() => setPosterUrl(null), []));

  const genPoster = () => {
    if (!parade.length) return;
    setPosterBusy(true);
    const shots = parade.slice(-15); // les 15 plus récentes, pour garder l'affiche lisible
    const cols = shots.length <= 4 ? 2 : 3;
    const rows = Math.ceil(shots.length / cols);
    const W = 1080, pad = 36, gap = 10;
    const cellW = (W - pad*2 - gap*(cols-1)) / cols;
    const cellH = cellW; // vignettes carrées
    const headerH = 190, footerH = 90;
    const H = headerH + rows*cellH + (rows-1)*gap + footerH + pad;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const bg = x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#0a0806"); bg.addColorStop(1,"#020202");
    x.fillStyle = bg; x.fillRect(0,0,W,H);
    x.strokeStyle = "#b8922a"; x.lineWidth = 3; x.strokeRect(18,18,W-36,H-36);
    x.strokeStyle = "#b8922a55"; x.lineWidth = 1; x.strokeRect(30,30,W-60,H-60);
    x.textAlign = "center";
    x.fillStyle = "#786858"; x.font = "24px Georgia"; x.fillText("· ARMY ON PARADE ·", W/2, 78);
    x.fillStyle = "#e8dfc0"; x.font = "bold 46px Georgia"; x.fillText("MA COLLECTION", W/2, 128);
    x.fillStyle = "#8a7a5a"; x.font = "20px Georgia"; x.fillText(`${parade.length} photo${parade.length>1?"s":""} de la croisade`, W/2, 160);

    Promise.all(shots.map(s => new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = s.photo; })))
      .then(imgs => {
        imgs.forEach((img, i) => {
          if (!img) return;
          const col = i % cols, row = Math.floor(i / cols);
          const cx = pad + col*(cellW+gap), cy = headerH + row*(cellH+gap);
          // cover-crop carré
          const s = Math.min(img.width, img.height);
          const sx = (img.width - s)/2, sy = (img.height - s)/2;
          x.save();
          x.beginPath(); x.rect(cx, cy, cellW, cellH); x.clip();
          x.drawImage(img, sx, sy, s, s, cx, cy, cellW, cellH);
          x.restore();
          x.strokeStyle = "#b8922a44"; x.lineWidth = 1.5; x.strokeRect(cx, cy, cellW, cellH);
        });
        x.textAlign = "center"; x.fillStyle = "#5a4c3a"; x.font = "italic 20px Georgia";
        x.fillText("Reliquaire 40K — Codex personnel", W/2, H - pad - 24);
        setPosterUrl(cv.toDataURL("image/png"));
        setPosterBusy(false);
      });
  };

  return (
    <div style={{...pageStyle, ...pageFond("wishlist")}} className="bg-wishlist">
      {/* Header */}
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"14px 16px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", opacity:0.6, marginBottom:"3px" }}>GALERIE</div>
          <div style={{ color:"#e8dfc0", fontSize:"18px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700" }}>ARMY ON PARADE</div>
          {parade.length > 0 && <div style={{ color:"#d8c8ac", fontSize:"12px", marginTop:"2px" }}>{parade.length} photo{parade.length>1?"s":""}</div>}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {parade.length > 0 && (
            <button onClick={genPoster} disabled={posterBusy} style={{ background:"none", border:"1px solid #2a2215", color:"#8a7a58", padding:"6px 10px", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", cursor:posterBusy?"default":"pointer", display:"flex", alignItems:"center", gap:"5px" }}>{posterBusy ? "⧗ …" : <><NavIcon id="midnightclaw" size={11} color="currentColor" /> AFFICHE</>}</button>
          )}
          {parade.length > 0 && (
            <button onClick={() => setVitrine(true)} style={{ background:"none", border:"1px solid #2a2215", color:"#8a7a58", padding:"6px 10px", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", cursor:"pointer" }}>⊞ VITRINE</button>
          )}
          <IconBtn onClick={() => setShowForm(true)}><Ic.Plus /></IconBtn>
        </div>
      </div>

      {/* ── Résultat de l'affiche ── */}
      {posterUrl && (
        <div onClick={() => setPosterUrl(null)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:600, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"20px", gap:"14px", overflowY:"auto" }}>
          <img src={posterUrl} alt="Affiche de la collection" style={{ maxWidth:"100%", maxHeight:"70dvh", border:"1px solid #b8922a55", boxShadow:"0 8px 40px #000", flexShrink:0, marginTop:"auto" }} onClick={e => e.stopPropagation()} />
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }} onClick={e => e.stopPropagation()}>
            <a href={posterUrl} download="ma-collection-40k.png"
              style={{ padding:"11px 20px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", textDecoration:"none" }}>⬇ ENREGISTRER</a>
            <button onClick={() => setPosterUrl(null)}
              style={{ padding:"11px 20px", background:"none", border:"1px solid #2a2215", color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>FERMER</button>
          </div>
          <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", maxWidth:"280px", marginBottom:"auto" }}>{parade.length > 15 ? "Limitée aux 15 photos les plus récentes pour rester lisible. " : ""}Enregistre l'image puis partage-la sur tes réseaux ou forums.</div>
        </div>
      )}

      {/* ── Mode Vitrine plein écran ── */}
      {vitrine && (
        <div onClick={() => setVitrine(false)} style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(rgba(1,1,1,0.82), rgba(1,1,1,0.88)), url(${import.meta.env.BASE_URL}fonds/wishlist.jpg)`, backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat", zIndex:800, overflowY:"auto", animation:"viewFade 0.5s ease both" }}>
          <div style={{ padding:"18px 12px 8px", textAlign:"center", position:"sticky", top:0, background:"linear-gradient(rgba(1,1,1,0.85), rgba(1,1,1,0.75), transparent)", zIndex:2 }}>
            <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif" }}>VITRINE</div>
            <div style={{ color:"#e8dfc0", fontSize:"15px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"2px" }}>ARMY ON PARADE</div>
            <div style={{ color:"#735f50", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>TOUCHER POUR FERMER</div>
          </div>
          <div style={{ columnCount:2, columnGap:"6px", padding:"0 6px 30px" }}>
            {parade.map((p) => (
              <div key={p.id} style={{ breakInside:"avoid", marginBottom:"6px", position:"relative" }}>
                <Thumb src={p.photo} px={560} ratio="4/3" style={{ width:"100%", display:"block", borderRadius:"2px" }} />
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top, #010101cc, transparent)", padding:"12px 8px 6px", display:"flex", alignItems:"center", gap:"5px" }}>
                  <span style={{ }}><FactionIcon faction={p.faction} size={14} /></span>
                  <span style={{ color:FACTIONS[p.faction]?.accent||"#b8922a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{FACTIONS[p.faction]?.label||p.faction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parade.length === 0 ? (
        <EmptyState icon="▣" title="Nulle parade" sub="Immortalise tes armées peintes et tes dioramas de bataille." />
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Grande photo principale */}
          {selectedPhoto && (
            <div style={{ position:"relative", flexShrink:0 }}
              onTouchStart={e => { swipeRef.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (!swipeRef.current) return;
                const dx = e.changedTouches[0].clientX - swipeRef.current;
                swipeRef.current = null;
                if (Math.abs(dx) < 40) return;
                if (dx < 0) setSelected(i => Math.min((i??0)+1, parade.length-1));
                else setSelected(i => Math.max((i??0)-1, 0));
              }}>
              <img src={selectedPhoto.photo} alt=""
                style={{ width:"100%", height:"380px", objectFit:"cover", display:"block" }} />
              {/* Overlay info */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top, rgba(2,2,2,0.95) 0%, transparent 100%)", padding:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ }}><FactionIcon faction={selectedPhoto.faction} size={18} /></span>
                  <span style={{ color:FACTIONS[selectedPhoto.faction]?.accent||"#b8922a", fontSize:"12.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>
                    {FACTIONS[selectedPhoto.faction]?.label || selectedPhoto.faction}
                  </span>
                  <span style={{ color:"#d8c8ac", fontSize:"12px", marginLeft:"auto" }}>{selectedPhoto.date}</span>
                </div>
              </div>
              {/* Actions sur la photo sélectionnée */}
              <div style={{ position:"absolute", top:"10px", right:"10px", display:"flex", gap:"6px" }}>
                <button onClick={() => onSetHomeBackground && onSetHomeBackground(selectedPhoto.photo)}
                  title="Définir comme fond d'accueil"
                  style={{ background:"#0a0806cc", border:`1px solid ${isHomeBg?"#b8922a":"#2a2215"}`, color:isHomeBg?"#b8922a":"#8a7a58", cursor:"pointer", padding:"6px 8px", fontSize:"13px", lineHeight:1, touchAction:"manipulation" }}>
                  {isHomeBg ? "★" : "☆"}
                </button>
                <button onClick={() => { const doDelete = () => { onDelete(selectedPhoto.id); setSelected(null); }; confirm ? confirm("Supprimer cette photo ? Elle sera perdue définitivement.", doDelete, "#c04040", "SUPPRIMER", false) : doDelete(); }}
                  style={{ background:"#0a0806cc", border:"1px solid #3a2215", color:"#815a47", cursor:"pointer", padding:"6px", display:"flex", touchAction:"manipulation" }}>
                  <Ic.Trash />
                </button>
              </div>
              {/* Libellé d'aide sous les actions */}
              <div style={{ position:"absolute", top:"44px", right:"10px", color: isHomeBg?"#b8922a":"rgba(232,223,192,0.45)", fontSize:"10px", letterSpacing:"1px", fontFamily:"'Cinzel',serif", pointerEvents:"none", textShadow:"0 1px 3px #000" }}>
                {isHomeBg ? "FOND D'ACCUEIL" : "★ = FOND D'ACCUEIL"}
              </div>
            </div>
          )}

          {/* Vignettes */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"8px" }}>
              {parade.map((p, i) => {
                const f = FACTIONS[p.faction];
                const isActive = i === selectedIdx;
                return (
                  <div key={p.id} onClick={() => setSelected(i)}
                    style={{ position:"relative", cursor:"pointer", border:`2px solid ${isActive ? (f?.accent||"#b8922a") : "transparent"}`, overflow:"hidden" }}>
                    <Thumb src={p.photo} px={440} style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                    <div style={{ position:"absolute", bottom:"2px", left:"3px", fontSize:"13px" }}>{f?.icon||"⚔"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout photo */}
      {showForm && (
        <Overlay>
          <div style={{ background:"#0a0806", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", width:"100%", maxWidth:"420px", margin:"0 16px 76px", padding:"20px 16px", maxHeight:"calc(100dvh - 150px)", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexShrink:0 }}>
              <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>NOUVELLE PHOTO</div>
              <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", color:"#7a7060", cursor:"pointer", fontSize:"18px" }}>✕</button>
            </div>

            {/* Zone défilante : un seul niveau de scroll pour tout le formulaire */}
            <div style={{ flex:1, minHeight:0, overflowY:"auto" }}>
            {/* Preview photo */}
            <div onClick={() => fileRef.current?.click()}
              style={{ width:"100%", height:"180px", background:"#040404", border:`1px dashed ${form.photo?"#b8922a55":"#7a6a58"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:"14px", overflow:"hidden", flexShrink:0 }}>
              {form.photo
                ? <img src={form.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ textAlign:"center", color:"#d8c8ac" }}>
                    <div style={{ fontSize:"32px", marginBottom:"8px" }}>◉</div>
                    <div style={{ fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>TAP POUR AJOUTER</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />

            {/* Faction */}
            <div style={{ marginBottom:"14px" }}>
              <div style={{ color:"#7a7060", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginBottom:"8px" }}>FACTION</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"6px" }}>
                {Object.entries(FACTIONS).map(([k,v]) => (
                  <button key={k} onClick={() => setForm(f=>({...f, faction:k}))}
                    style={{ padding:"8px 2px", background:form.faction===k?`${v.accent}15`:"#060402", border:`1px solid ${form.faction===k?v.accent:"#1c1c1c"}`, color:form.faction===k?v.accent:"#7a6a58", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"11px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", touchAction:"manipulation" }}>
                    <span style={{ fontSize:"16px" }}>{v.icon}</span>
                    {v.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom:"4px" }}>
              <div style={{ color:"#7a7060", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginBottom:"6px" }}>DATE (optionnel)</div>
              <input type="text" value={form.date} onChange={e => setForm(f=>({...f, date:e.target.value}))}
                placeholder={new Date().toLocaleDateString("fr-FR")}
                style={{ width:"100%", background:"#060402", border:"1px solid #1c1c1c", color:"#e8dfc0", padding:"8px 10px", fontSize:"13px", outline:"none", fontFamily:"'Crimson Pro',serif", boxSizing:"border-box" }} />
            </div>
            </div>

            {/* Bouton toujours visible, hors de la zone défilante */}
            <div style={{ flexShrink:0, paddingTop:"12px" }}>
              <PrimaryBtn color="#b8922a" onClick={handleAdd} disabled={!form.photo}>
                AJOUTER
              </PrimaryBtn>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
