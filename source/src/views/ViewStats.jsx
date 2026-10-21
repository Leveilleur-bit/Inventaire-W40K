import React, { useState } from 'react';
import { BLAZON_SHAPES, EMBLEMES, FactionIcon, NavIcon } from '../components/heraldry.jsx';
import { Crescent, ScrollGlyph, pageFond, pageStyle } from '../components/ui.jsx';
import { FACTIONS, factionTitle, generateArmyLore } from '../data/factions.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { SHOP_PRICES } from '../data/prices.jsx';
import { PAINT_STATUS, ROLE_ORDER, UNITS_DB, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { crusadeStartOf } from '../lib/utils.jsx';
import { playSfx } from '../lib/sfx.jsx';
import { colossusCount } from '../lib/colossus.jsx';
import { computeTrophies, enrolDaysLeft } from '../lib/trophies.jsx';

// ── Section repliable (fermée par défaut ; l'état est retenu sur ce téléphone) ──
function Fold({ id, mark, title, summary, children }) {
  const key = "stats-fold-" + id;
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(key) === "1"; } catch { return false; } });
  const toggle = () => { const n = !open; setOpen(n); try { localStorage.setItem(key, n ? "1" : "0"); } catch {} };
  return (
    <>
      <button onClick={toggle} aria-expanded={open}
        style={{ width:"100%", background:"rgba(10,8,6,0.55)", border:"1px solid #2a2418", borderLeft:"2px solid #b8922a88", padding:"11px 14px", marginBottom: open ? "10px" : "0", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", touchAction:"manipulation", textAlign:"left" }}>
        <span style={{ color:"#b8922a", fontSize:"13px" }}>{mark}</span>
        <span style={{ flex:1, color:"#d8c8ac", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>{title}</span>
        {summary != null && <span style={{ color:"#e0c060", fontSize:"12.5px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>{summary}</span>}
        <span style={{ color:"#8a7a58", fontSize:"12px", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
      </button>
      {open && <div style={{ animation:"viewFade 0.25s ease both" }}>{children}</div>}
    </>
  );
}

export function ViewStats({ oath, appState, inventory, lists, ptsMap, wishlist, paintHistory, openChronicle, confirm, onSealJudgment }) {
  const [showRetro, setShowRetro] = useState(false);
  const [retroYear, setRetroYear] = useState(null);
  const [showMirror, setShowMirror] = useState(false);
  const [mirrorMonths, setMirrorMonths] = useState(6);
  const [velSel, setVelSel] = useState(null);   // mois touché dans le graphique de vélocité (bulle de détail)
  const [cardUrl, setCardUrl] = useState(null);
  const [cardKind, setCardKind] = useState("recruteur"); // "recruteur" | "roster"
  const [cardPhoto, setCardPhoto] = useState(null);
  const [cardPhotoPicker, setCardPhotoPicker] = useState(false);
  const [cardFaction, setCardFaction] = useState(null); // null = carte globale
  useBackButton(!!cardUrl, React.useCallback(() => setCardUrl(null), []));
  useBackButton(cardPhotoPicker, React.useCallback(() => setCardPhotoPicker(false), []));

  const genCard = async (photoOverride, factionKey) => {
    setCardKind("recruteur");
    // Polices de l'app (Cinzel / Crimson Pro) : le canvas ne les utilise que si elles sont chargées
    const FT = "'Cinzel', Georgia, serif", FB = "'Crimson Pro', Georgia, serif";
    try { await Promise.all(["bold 60px Cinzel","24px Cinzel","italic 30px 'Crimson Pro'"].map(f => document.fonts.load(f))); } catch {}
    const parch = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `${import.meta.env.BASE_URL}fonds/parchemin.jpg`; });
    // factionKey non nul => carte limitée à une seule armée.
    const inv = factionKey ? inventory.filter(i => i.faction === factionKey) : inventory;
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    x.textAlign = "center";
    // Fond
    x.fillStyle = "#0a0806"; x.fillRect(0,0,W,H);
    if (parch) { const r = Math.max(W/parch.width, H/parch.height); const sw = W/r, sh = H/r; x.drawImage(parch, (parch.width-sw)/2, (parch.height-sh)/2, sw, sh, 0, 0, W, H); }
    const veil = x.createLinearGradient(0,0,0,H);
    veil.addColorStop(0,"rgba(8,6,4,0.55)"); veil.addColorStop(0.55,"rgba(8,6,4,0.45)"); veil.addColorStop(1,"rgba(4,3,2,0.78)");
    x.fillStyle = veil; x.fillRect(0,0,W,H);
    const vig = x.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75);
    vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.6)");
    x.fillStyle = vig; x.fillRect(0,0,W,H);
    const spaced = (px) => { try { x.letterSpacing = px; } catch {} };
    // Cadre
    x.strokeStyle = "#b8922a"; x.lineWidth = 3; x.strokeRect(30,30,W-60,H-60);
    x.strokeStyle = "#b8922a55"; x.lineWidth = 1; x.strokeRect(44,44,W-88,H-88);
    // Faction dominante (ou la faction demandée)
    const tally = {};
    inv.filter(i=>i.paintStatus==="painted").forEach(i => { const u=findUnit(i.faction, i.unitId); tally[i.faction]=(tally[i.faction]||0)+getModelCount(u?.name,i.qty||1,i.modelCount); });
    const topEntry = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
    const topKey = factionKey || (topEntry ? topEntry[0] : null);
    const domF = topKey ? FACTIONS[topKey] : null;
    const accent = domF?.accent || "#b8922a";
    const cru = appState.crusade;
    // ── Calculs (cohérents avec l'accueil) ──
    const totMod = inv.reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
    const totPnt = inv.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
    const pct = totMod ? Math.round(totPnt/totMod*100) : 0;
    const ptsOf = (i) => { const k=`${i.faction}:${i.unitId}`; return (ptsMap[k] != null ? ptsMap[k] : (POINTS_DB[findUnit(i.faction, i.unitId)?.name]||0)) * (i.qty||1); };
    const ptsTotal = inv.reduce((s,i)=>s+ptsOf(i),0);
    const ptsPainted = inv.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+ptsOf(i),0);
    const armies = Object.keys(FACTIONS).filter(k=>inventory.some(i=>i.faction===k)).length;
    // ── Titre ──
    spaced("6px"); x.fillStyle = "#a08a64"; x.font = `22px ${FT}`; x.fillText(factionKey ? "· REGISTRE D'ARMÉE ·" : "· REGISTRE DE CROISADE ·", W/2, 118); spaced("0px");
    x.fillStyle = "#efe4c4";
    // Carte d'armée : le nom donné à l'armée (ex. « Black Templars ») s'il existe, la faction sinon
    const armyName = factionKey ? (appState.listNames?.[factionKey] || "").trim() : "";
    let title = (factionKey ? (armyName || domF?.label || factionKey) : (cru?.name || "MA CROISADE")).toUpperCase();
    if (title.length > 34) title = title.slice(0,33) + "…";
    let tSize = 64; x.font = `bold ${tSize}px ${FT}`;
    while (x.measureText(title).width > W - 180 && tSize > 34) { tSize -= 2; x.font = `bold ${tSize}px ${FT}`; }
    x.shadowColor = "rgba(0,0,0,0.8)"; x.shadowBlur = 12; x.fillText(title, W/2, 186); x.shadowBlur = 0;

    // ── Fonction de dessin du reste (après le blason) ──
    // Points peints de l'armée dominante seulement : le rang affiché doit être celui de
    // la CROISADE (et pas celui calculé sur toute la collection, qui donnait un rang trop haut).
    const ptsPaintedTop = topKey ? inv.filter(i=>i.faction===topKey && i.paintStatus==="painted").reduce((s,i)=>s+ptsOf(i),0) : 0;
    let photoDrawn = false;

    const wrap = (text, maxW) => {
      const words = text.split(" "); const lines = []; let line = "";
      words.forEach(w => { const t = line ? line+" "+w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line); return lines;
    };

    const drawRest = () => {
      x.textAlign = "center";
      // Grande jauge
      x.shadowColor = "rgba(0,0,0,0.85)"; x.shadowBlur = 18;
      x.fillStyle = accent; x.font = `bold 128px ${FT}`; x.fillText(pct+"%", W/2, 668);
      x.shadowBlur = 0;
      spaced("6px"); x.fillStyle = "#a08a64"; x.font = `22px ${FT}`; x.fillText("CONSACRÉ", W/2, 708); spaced("0px");
      x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(200, 730, W-400, 10);
      x.fillStyle = accent; x.fillRect(200, 730, (W-400)*pct/100, 10);
      if (domF && topKey) { x.fillStyle = "#dccfae"; x.font = `italic 32px ${FB}`; x.fillText(factionTitle(topKey, ptsPaintedTop)+" · "+domF.label, W/2, 790); }

      // Zone centrale : la photo si elle a été choisie, sinon un contenu utile
      if (!photoDrawn) {
        if (!factionKey) {
          // Carte de croisade : chaque armée avec sa jauge
          const rows = Object.keys(FACTIONS).map(k => {
            const its = inventory.filter(i => i.faction === k);
            if (!its.length) return null;
            const mc = (i) => getModelCount(findUnit(k, i.unitId)?.name, i.qty||1, i.modelCount);
            const tot = its.reduce((s,i)=>s+mc(i),0), pnt = its.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+mc(i),0);
            return { k, f:FACTIONS[k], tot, p: tot ? Math.round(pnt/tot*100) : 0 };
          }).filter(Boolean).sort((a,b)=>b.tot-a.tot).slice(0,5);
          const top = 850 + (5 - rows.length) * 29;
          rows.forEach((r,i) => {
            const y = top + i*58;
            x.textAlign = "center"; x.fillStyle = r.f.accent; x.font = `30px ${FB}`; x.fillText(r.f.icon||"✠", 200, y);
            x.textAlign = "left"; x.fillStyle = "#e0d4b4"; x.font = `26px ${FT}`; x.fillText(r.f.label, 240, y);
            x.fillStyle = "#8a7a5a"; x.font = `22px ${FB}`; x.fillText(`${r.tot} fig.`, 240, y+26);
            x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(600, y-12, 200, 8);
            x.fillStyle = r.f.accent; x.fillRect(600, y-12, 200*r.p/100, 8);
            x.textAlign = "right"; x.fillStyle = r.p>=100 ? "#8aca6a" : "#e0d4b4"; x.font = `bold 26px ${FT}`; x.fillText(r.p+"%", 880, y);
          });
          x.textAlign = "center";
        } else {
          // Carte d'armée : le Codex Vivant, texte de lore tiré de la composition réelle
          const grouped = {}; ROLE_ORDER.forEach(r => { grouped[r] = []; });
          const paintedItems = inv.filter(i => i.paintStatus === "painted");
          paintedItems.forEach(i => { const u = findUnit(factionKey, i.unitId); const role = u?.role || "Autre"; (grouped[role] = grouped[role] || []).push(i); });
          const lore = generateArmyLore(grouped, paintedItems.length, factionKey) || "Aucune relique consacrée pour l'instant. Le Codex attend sa première page.";
          x.font = `italic 31px ${FB}`;
          const lines = wrap(lore, 780).slice(0, 6);
          const lh = 44, y0 = 990 - (lines.length-1)*lh/2;
          spaced("5px"); x.fillStyle = "#8a7a5a"; x.font = `18px ${FT}`; x.fillText("· CODEX VIVANT ·", W/2, y0 - 52); spaced("0px");
          x.fillStyle = "#e0d4b4"; x.font = `italic 31px ${FB}`;
          lines.forEach((l,i) => x.fillText(l, W/2, y0 + i*lh));
        }
      }

      // ── 3 chiffres ── (en mode faction, "ARMÉES" n'a pas de sens : on montre les références)
      const stats = [
        [totPnt+" / "+totMod, "FIGURINES"],
        [ptsPainted.toLocaleString('fr')+" / "+ptsTotal.toLocaleString('fr'), "POINTS"],
        factionKey ? [String(inv.length), "RÉFÉRENCES"] : [String(armies), "ARMÉES"],
      ];
      x.strokeStyle = accent+"55"; x.lineWidth = 1; x.beginPath(); x.moveTo(120, 1150); x.lineTo(W-120, 1150); x.stroke();
      stats.forEach(([v,l],i) => {
        const cx = W/2 + (i-1)*310;
        x.fillStyle = accent; x.font = `bold 40px ${FT}`; x.fillText(v, cx, 1205);
        spaced("4px"); x.fillStyle = "#a08a64"; x.font = `19px ${FT}`; x.fillText(l, cx, 1240); spaced("0px");
      });
      // Pied : ✠ entre deux filets, puis la signature, bien à l'intérieur du cadre
      x.strokeStyle = accent+"77"; x.beginPath(); x.moveTo(W/2-160, 1268); x.lineTo(W/2-28, 1268); x.moveTo(W/2+28, 1268); x.lineTo(W/2+160, 1268); x.stroke();
      x.fillStyle = accent; x.font = `26px ${FB}`; x.fillText("✠", W/2, 1277);
      spaced("4px"); x.fillStyle = "#7a6a4c"; x.font = `16px ${FT}`; x.fillText("RELIQUAIRE · WARHAMMER 40,000", W/2, 1296); spaced("0px");
      setCardUrl(cv.toDataURL("image/png"));
    };

    // ── Photo choisie (zone 890-1130) ──
    const drawPhotoThen = (next) => {
      const photo = photoOverride || cardPhoto;
      if (!photo) { next(); return; }
      const pimg = new Image();
      pimg.onload = () => {
        photoDrawn = true;
        const bw = 400, bh = 260, bx = W/2 - bw/2, by = 832;
        // recadrage cover
        const r = Math.max(bw/pimg.width, bh/pimg.height);
        const sw = bw/r, sh = bh/r, sx = (pimg.width-sw)/2, sy = (pimg.height-sh)/2;
        x.save(); x.beginPath(); x.rect(bx,by,bw,bh); x.clip();
        x.drawImage(pimg, sx, sy, sw, sh, bx, by, bw, bh); x.restore();
        x.strokeStyle = accent; x.lineWidth = 2; x.strokeRect(bx,by,bw,bh);
        spaced("5px"); x.fillStyle = "#8a7a5a"; x.font = `18px ${FT}`; x.textAlign="center"; x.fillText("· ARMY ON PARADE ·", W/2, by+bh+36); spaced("0px");
        next();
      };
      pimg.onerror = () => next();
      pimg.src = photo;
    };

    // ── Blason complet (SVG → image) ──
    const drawBlazonThen = (next) => {
      // Carte d'armée : on affiche l'emblème de la faction plutôt que le blason
      // de croisade, qui représente l'ensemble de la collection.
      if (factionKey || !cru) {
        if (domF) {
          x.strokeStyle = accent; x.lineWidth = 2; x.beginPath(); x.arc(W/2, 350, 118, 0, Math.PI*2); x.stroke();
          x.strokeStyle = accent+"55"; x.lineWidth = 1; x.beginPath(); x.arc(W/2, 350, 132, 0, Math.PI*2); x.stroke();
          x.fillStyle = "rgba(0,0,0,0.35)"; x.beginPath(); x.arc(W/2, 350, 117, 0, Math.PI*2); x.fill();
          x.fillStyle = accent; x.font = `130px ${FB}`; x.textBaseline = "middle"; x.fillText(domF.icon||"✠", W/2, 356); x.textBaseline = "alphabetic";
        }
        next(); return;
      }
      const path = BLAZON_SHAPES[cru.shape] || BLAZON_SHAPES.heater;
      const mg = cru.metal==="argent" ? ["#f0f0f4","#b8bcc4","#8a8e96"] : ["#f0d878","#c9a84c","#8a6d1e"];
      const embCol = cru.metal==="argent" ? "#d8dce2" : "#e8c860";
      const c1 = cru.c1, c2 = cru.c2;
      let field;
      if (cru.division==="parti") field = `<rect width="50" height="116" fill="${c1}"/><rect x="50" width="50" height="116" fill="${c2}"/>`;
      else if (cru.division==="coupe") field = `<rect width="100" height="58" fill="${c1}"/><rect y="58" width="100" height="58" fill="${c2}"/>`;
      else if (cru.division==="ecartele") field = `<rect width="50" height="58" fill="${c1}"/><rect x="50" width="50" height="58" fill="${c2}"/><rect y="58" width="50" height="58" fill="${c2}"/><rect x="50" y="58" width="50" height="58" fill="${c1}"/>`;
      else field = `<rect width="100" height="116" fill="url(#gf)"/>`;
      const emb = (EMBLEMES[cru.symbol]||EMBLEMES.croix).svg;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 116" width="230" height="267"><defs><clipPath id="gc"><path d="${path}"/></clipPath><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${mg[0]}"/><stop offset="45%" stop-color="${mg[1]}"/><stop offset="100%" stop-color="${mg[2]}"/></linearGradient><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><radialGradient id="gs" cx="0.5" cy="0.2" r="0.9"><stop offset="0%" stop-color="rgba(255,255,255,0.22)"/><stop offset="55%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><g clip-path="url(#gc)">${field}<rect width="100" height="116" fill="url(#gs)"/></g><path d="${path}" fill="none" stroke="url(#gm)" stroke-width="3.5"/><g transform="translate(24,26)"><svg viewBox="0 0 512 512" width="52" height="52" style="color:${embCol}">${emb}</svg></g></svg>`;
      const bimg = new Image();
      bimg.onload = () => {
        x.drawImage(bimg, W/2 - 115, 218, 230, 267);
        if (cru.motto) { x.fillStyle = "#e0c070"; x.font = `italic 32px ${FB}`; x.textAlign="center"; x.fillText("« "+cru.motto+" »", W/2, 530); }
        next();
      };
      bimg.onerror = () => next();
      bimg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    };

    // Enchaînement : blason → photo → reste
    drawBlazonThen(() => drawPhotoThen(() => drawRest()));
  };

  // ── Feuille de roster détaillée : toutes les figurines d'une armée,
  // regroupées par rôle sur le terrain, avec vignette et distinction peint/non peint. ──
  const genRoster = async (factionKey) => {
    setCardKind("roster");
    setCardFaction(factionKey);
    const f = FACTIONS[factionKey];
    // Même habillage que la carte à partager : polices de l'app et parchemin
    const FT = "'Cinzel', Georgia, serif", FB = "'Crimson Pro', Georgia, serif";
    try { await Promise.all(["bold 54px Cinzel","22px Cinzel","italic 16px 'Crimson Pro'"].map(ft => document.fonts.load(ft))); } catch {}
    const acc = f?.accent || "#b8922a";
    const armyName = (appState.listNames?.[factionKey] || "").trim();
    const inv = inventory.filter(i => i.faction === factionKey);
    if (!inv.length) return;
    const ptsOf = (i) => { const k=`${i.faction}:${i.unitId}`; const u=findUnit(i.faction, i.unitId); return (ptsMap[k] != null ? ptsMap[k] : (POINTS_DB[u?.name]||0)) * (i.qty||1); };
    // Regroupement par rôle sur le terrain, dans l'ordre d'une feuille de match classique.
    const CATS = [
      { key:"QG",     label:"PERSONNAGES" },
      { key:"Troupes",label:"LIGNE" },
      { key:"Transport",label:"TRANSPORTS" },
      { key:"__other",label:"AUTRES UNITÉS" },
    ];
    const grouped = CATS.map(c => ({ ...c, items: [] }));
    inv.forEach(i => {
      const u = findUnit(factionKey, i.unitId);
      const role = u?.role || "__other";
      const cat = grouped.find(g => g.key === role) || grouped.find(g => g.key === "__other");
      cat.items.push({ item:i, unit:u, pts:ptsOf(i), painted: i.paintStatus==="painted" });
    });
    const nonEmpty = grouped.filter(g => g.items.length);
    if (!nonEmpty.length) return;
    // Trie chaque catégorie, grosses pièces en tête — plus logique à parcourir et ça
    // met en avant ce qu'il y a de plus impressionnant dans la collection.
    nonEmpty.forEach(g => g.items.sort((a,b) => b.pts - a.pts));

    const totalPts = inv.reduce((s,i)=>s+ptsOf(i),0);
    const paintedPts = inv.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+ptsOf(i),0);
    const totalModels = inv.reduce((s,i)=>{const u=findUnit(factionKey, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
    const paintedModels = inv.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{const u=findUnit(factionKey, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);

    const W = 1200, pad = 44, gap = 16;
    const cellW = 158, cellH = 208, catHeaderH = 46; // +16 de hauteur pour un 2e ligne de nom
    const cols = Math.max(1, Math.floor((W - pad*2) / (cellW+gap)));
    const headerH = armyName ? 214 : 190, statsH = 70, footerH = 92;
    let bodyH = 0;
    nonEmpty.forEach(g => { const rows = Math.ceil(g.items.length/cols); bodyH += catHeaderH + rows*(cellH+gap); });
    const H = headerH + statsH + bodyH + footerH + pad;

    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const spaced = (px) => { try { x.letterSpacing = px; } catch {} };

    // Coupe un nom sur 2 lignes maximum au lieu de le tronquer platement avec "…" —
    // beaucoup plus lisible pour les noms longs ("High Marshal Helbrecht" tenait mal
    // sur une seule ligne à cette largeur de vignette).
    const wrapName = (name, maxW) => {
      const words = name.split(" ");
      const lines = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? cur+" "+w : w;
        if (x.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
        else cur = test;
        if (lines.length === 1 && x.measureText(cur).width > maxW) {
          // 2e ligne encore trop longue : on tronque proprement avec ellipse
          while (x.measureText(cur+"…").width > maxW && cur.length > 1) cur = cur.slice(0,-1);
          lines.push(cur+"…"); return lines;
        }
      }
      if (cur) lines.push(cur);
      return lines.slice(0,2);
    };

    const drawFrameAndHeader = () => {
      x.strokeStyle = f?.accent||"#b8922a"; x.lineWidth = 3; x.strokeRect(18,18,W-36,H-36);
      x.strokeStyle = (f?.accent||"#b8922a")+"55"; x.lineWidth = 1; x.strokeRect(30,30,W-60,H-60);
      x.textAlign = "center";
      spaced("6px"); x.fillStyle = "#a08a64"; x.font = `20px ${FT}`; x.fillText("· FEUILLE DE ROSTER ·", W/2, 76); spaced("0px");
      x.fillStyle = "#efe4c4"; x.shadowColor = "rgba(0,0,0,0.85)"; x.shadowBlur = 12;
      let tSize = 54; const ttl = (armyName || f?.label || factionKey).toUpperCase();
      x.font = `bold ${tSize}px ${FT}`; while (x.measureText(ttl).width > W - 160 && tSize > 32) { tSize -= 2; x.font = `bold ${tSize}px ${FT}`; }
      x.fillText(ttl, W/2, 132);
      x.shadowBlur = 0;
      let lineY = 170;
      if (armyName) { x.fillStyle = "#b8a882"; x.font = `italic 24px ${FB}`; x.fillText(f?.label || factionKey, W/2, 166); lineY = 196; }
      spaced("2px"); x.fillStyle = acc; x.font = `22px ${FT}`; x.fillText(`${paintedPts.toLocaleString('fr')} / ${totalPts.toLocaleString('fr')} PTS  ·  ${paintedModels} / ${totalModels} FIGURINES`, W/2, lineY); spaced("0px");

      // Bandeau stats
      let sy = headerH;
      x.fillStyle = "#00000055"; x.fillRect(pad-10, sy-8, W-(pad-10)*2, statsH-6);
      nonEmpty.forEach((g,gi) => {
        const ccx = pad + (gi+0.5)*((W-pad*2)/nonEmpty.length);
        spaced("3px"); x.fillStyle = "#a08a64"; x.font = `16px ${FT}`; x.textAlign="center";
        x.fillText(g.label, ccx, sy+24); spaced("0px");
        x.fillStyle = acc; x.font = `bold 28px ${FT}`;
        x.fillText(String(g.items.length), ccx, sy+54);
      });
      return sy + statsH;
    };

    // Dessine une catégorie (async car les vignettes doivent charger)
    const drawCategory = (g, top, next) => {
      x.textAlign = "left"; spaced("3px"); x.fillStyle = acc; x.font = `bold 20px ${FT}`;
      x.fillText(g.label + " (" + g.items.length + ")", pad, top+30); spaced("0px");
      x.strokeStyle = (f?.accent||"#b8922a")+"55"; x.lineWidth=1; x.beginPath(); x.moveTo(pad, top+40); x.lineTo(W-pad, top+40); x.stroke();
      const gridTop = top + catHeaderH;
      Promise.all(g.items.map(e => new Promise(res => {
        if (!e.item.photo) return res(null);
        const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = e.item.photo;
      }))).then(imgs => {
        g.items.forEach((e, idx) => {
          const col = idx % cols, row = Math.floor(idx/cols);
          const gx0 = (W - (cols*cellW + (cols-1)*gap)) / 2; // grille centrée
          const cx = gx0 + col*(cellW+gap), cy = gridTop + row*(cellH+gap);
          const img = imgs[idx];
          const dim = !e.painted;
          const isBig = e.pts >= 400; // Titans, Chevaliers lourds... les pièces qui méritent un peu de lumière
          // Halo doré derrière les grosses pièces peintes
          if (isBig && !dim) {
            const glow = x.createRadialGradient(cx+cellW/2, cy+55, 5, cx+cellW/2, cy+55, cellW*0.85);
            glow.addColorStop(0, (f?.accent||"#b8922a")+"aa"); glow.addColorStop(0.6, (f?.accent||"#b8922a")+"40"); glow.addColorStop(1, (f?.accent||"#b8922a")+"00");
            x.fillStyle = glow; x.fillRect(cx-30, cy-30, cellW+60, 170);
          }
          // Vignette
          x.save();
          if (dim) x.filter = "grayscale(0.85) brightness(0.6)";
          if (img) {
            const s = Math.min(img.width, img.height); const sx=(img.width-s)/2, sy2=(img.height-s)/2;
            x.beginPath(); x.rect(cx, cy, cellW, 110); x.clip();
            x.drawImage(img, sx, sy2, s, s, cx, cy, cellW, 110);
          } else {
            x.fillStyle = dim ? "#12100c" : "#1a1510";
            x.fillRect(cx, cy, cellW, 110);
            x.textAlign="center"; x.fillStyle = dim ? "#5a5040" : acc+"99"; x.font=`42px ${FB}`;
            x.fillText(f?.icon||"✠", cx+cellW/2, cy+68);
          }
          x.restore();
          x.strokeStyle = dim ? "#3a3428" : isBig ? (f?.accent||"#b8922a") : (f?.accent||"#b8922a")+"66";
          x.lineWidth = isBig && !dim ? 2.5 : 1.5;
          x.strokeRect(cx, cy, cellW, 110);
          if (isBig && !dim) { x.textAlign="left"; x.font=`18px ${FB}`; x.fillStyle=acc; x.fillText("✦", cx+7, cy+22); }
          // Nom (jusqu'à 2 lignes) + points
          x.textAlign = "center"; x.font = `17px ${FB}`;
          const name = (e.unit?.name || e.item.unitId);
          const lines = wrapName(name, cellW-8);
          x.fillStyle = dim ? "#8a7a62" : "#f0e6c8";
          lines.forEach((ln,li) => x.fillText(ln, cx+cellW/2, cy + 130 + li*20));
          const textBase = cy + 130 + lines.length*20 + (lines.length===1?4:0);
          x.fillStyle = dim ? "#7a6848" : acc; x.font = `bold 17px ${FT}`;
          x.fillText(e.pts.toLocaleString('fr') + " pts", cx+cellW/2, textBase+4);
          x.fillStyle = dim ? "#8a7a60" : "#8aba6a"; x.font = `italic 15px ${FB}`;
          x.fillText(dim ? "non peinte" : "peinte", cx+cellW/2, textBase+24);
        });
        next();
      });
    };

    // Enchaîne toutes les catégories dans l'ordre, puis le pied de page
    const drawBody = () => {
      let sy = drawFrameAndHeader();
      let cy2 = sy;
      const chain = nonEmpty.map(g => ({ g, top: (() => { const t = cy2; cy2 += catHeaderH + Math.ceil(g.items.length/cols)*(cellH+gap); return t; })() }));
      const drawAll = (idx) => {
        if (idx >= chain.length) {
          x.textAlign = "center";
          const fy = H - 66;
          x.strokeStyle = acc+"77"; x.lineWidth = 1; x.beginPath(); x.moveTo(W/2-170, fy); x.lineTo(W/2-28, fy); x.moveTo(W/2+28, fy); x.lineTo(W/2+170, fy); x.stroke();
          x.fillStyle = acc; x.font = `26px ${FB}`; x.fillText("✠", W/2, fy+9);
          spaced("4px"); x.fillStyle = "#7a6a4c"; x.font = `16px ${FT}`; x.fillText("RELIQUAIRE · WARHAMMER 40,000", W/2, fy+34); spaced("0px");
          setCardUrl(cv.toDataURL("image/png"));
          return;
        }
        drawCategory(chain[idx].g, chain[idx].top, () => drawAll(idx+1));
      };
      drawAll(0);
    };

    // Fond : le parchemin, comme la carte à partager. La feuille est très haute : on empile
    // des bandes de parchemin, retournées une sur deux pour que les raccords ne se voient pas.
    const parch = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `${import.meta.env.BASE_URL}fonds/parchemin.jpg`; });
    x.fillStyle = "#0a0806"; x.fillRect(0,0,W,H);
    if (parch) {
      const th = Math.round(parch.height * W / parch.width);
      for (let y = 0, k = 0; y < H; y += th, k++) {
        x.save();
        if (k % 2) { x.translate(0, y + th); x.scale(1, -1); x.drawImage(parch, 0, 0, W, th); }
        else x.drawImage(parch, 0, y, W, th);
        x.restore();
      }
    }
    const veil = x.createLinearGradient(0,0,0,H); veil.addColorStop(0,"rgba(8,6,4,0.6)"); veil.addColorStop(1,"rgba(4,3,2,0.72)");
    x.fillStyle = veil; x.fillRect(0,0,W,H);
    const vig = x.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.7);
    vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.55)");
    x.fillStyle = vig; x.fillRect(0,0,W,H);
    drawBody();
  };

  useBackButton(showRetro, React.useCallback(() => setShowRetro(false), []));
  useBackButton(showMirror, React.useCallback(() => setShowMirror(false), []));
  const totalUnits    = inventory.reduce((s,i) => s+(i.qty||1), 0);
  const totalModels   = inventory.reduce((s,i) => { const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
  // RÉFÉRENCES = types d'unités DIFFÉRENTS possédés (dédupliqué par faction+unitId) ;
  // deux achats séparés de la même escouade comptent pour 1 référence mais 2 unités.
  const totalUnique   = new Set(inventory.map(i => `${i.faction}:${i.unitId}`)).size;
  const totalPainted  = inventory.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name,i.qty||1,i.modelCount); },0);
  const totalPrimed   = inventory.filter(i=>i.paintStatus==="primed").reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
  const totalWip      = inventory.filter(i=>i.paintStatus==="wip").reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
  const totalUnpainted= inventory.filter(i=>i.paintStatus==="unpainted"||i.paintStatus==="sprue"||!i.paintStatus).reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0);
  const paintPct      = totalModels ? Math.round(totalPainted/totalModels*100) : 0;
  // CROISADE (ViewLists) ne se base pas sur appState.lists (une structure indépendante,
  // jamais affichée nulle part) : elle génère une "armée" auto par faction ayant au moins
  // une figurine peinte. Le compte de "listes" ici doit refléter ÇA, pas appState.lists.
  const paintedFactionsCount = Object.keys(FACTIONS).filter(fKey =>
    inventory.some(i => i.faction===fKey && i.paintStatus==="painted" && UNITS_DB[fKey]?.some(u=>u.id===i.unitId))
  ).length;

  // Points investis par faction
  const factionStats = Object.entries(FACTIONS).map(([k,f]) => {
    const items = inventory.filter(i=>i.faction===k);
    const models = items.reduce((s,i)=>{ const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
    const units = items.reduce((s,i)=>s+(i.qty||1),0);
    const painted = items.filter(i=>i.paintStatus==="painted").reduce((s,i)=>s+(i.qty||1),0);
    const paintedModels = items.filter(i=>i.paintStatus==="painted").reduce((s,i)=>{ const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
    const pts = items.reduce((s,i)=>{
      const manual = ptsMap[`${k}:${i.unitId}`];
      const unit = findUnit(k, i.unitId);
      const p = manual || (unit ? POINTS_DB[unit.name] : 0) || 0;
      return s + p * i.qty;
    }, 0);
    // Répartition par rôle
    const byRole = {};
    items.forEach(i => {
      const unit = findUnit(k, i.unitId);
      if (!unit) return;
      byRole[unit.role] = (byRole[unit.role]||0) + i.qty;
    });
    return { key:k, f, models, units, painted, paintedModels, pts, byRole, uniqueUnits:items.length };
  }).filter(s=>s.models>0);

  const totalValue = inventory.reduce((s,i) => {
    const unit = findUnit(i.faction, i.unitId);
    return s + (unit ? (SHOP_PRICES[unit.name]||0) * (i.qty||1) : 0);
  }, 0);

  const accent = "#b8922a";

  return (
    <div style={{...pageStyle, ...pageFond("stats")}} className={`bg-stats`}>
      {/* Header */}
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"18px 16px 14px", position:"relative", overflow:"hidden" }}>
        
        <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", opacity:0.6, marginBottom:"4px" }}>ÉTAT DES FORCES</div>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between" }}>
          <div style={{ color:"#e8dfc0", fontSize:"18px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700" }}>STATISTIQUES</div>
        </div>
        {totalValue > 0 && <div style={{ marginTop:"4px", display:"flex", alignItems:"baseline", gap:"6px" }}>
          <div style={{ color:"#8aba5a", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{Math.round(totalValue).toLocaleString('fr')} €*</div>
          <div style={{ color:"#d8c8ac", fontSize:"10px", letterSpacing:"2px" }}>VALEUR COLLECTION</div>
        </div>}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>

        {/* ── GLOBAL ─────────────────────── */}
        <div style={{ marginBottom:"20px" }}>
          <div className="enlum" style={{ color:"#d8c8ac", marginBottom:"10px" }}><span className="enlum-mark">✦</span><span style={{ fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>COLLECTION GLOBALE</span><span className="enlum-mark">✦</span></div>

          {/* Big paint ring simulation via stacked bars */}
          <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderTop:`2px solid ${accent}`, padding:"16px", marginBottom:"8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"12px" }}>
              <div>
                <div style={{ color:"#e8dfc0", fontSize:"32px", fontFamily:"'Cinzel',serif", fontWeight:"900", lineHeight:1 }}>{paintPct}<span style={{ fontSize:"16px", color:accent }}>%</span></div>
                <div style={{ color:"#d8c8ac", fontSize:"12px", letterSpacing:"2px", marginTop:"2px" }}>PEINT</div>
                {/* Shame-o-meter */}
                {(() => {
                  const enrol = enrolDaysLeft(appState);
                  if (enrol > 0) return <div style={{ color:"#b8922a", fontSize:"11px", fontFamily:"'Cinzel',serif", marginTop:"4px", letterSpacing:"1px" }}>⧗ Enrôlement · J-{enrol}</div>;
                  const sc = paintPct>=80?"#3ea23e":paintPct>=60?"#c2a83e":paintPct>=40?"#d68a3e":"#d64545";
                  const st = paintPct>=95?"⚔ Croisé Exemplaire":paintPct>=80?"✠ Serviteur Loyal":paintPct>=60?"⚠ Sous Surveillance":paintPct>=40?"⸸ Honte Croissante":paintPct>=20?"● Hérétique":"☠ Renégat Confirmé";
                  return <div style={{ color:sc, fontSize:"11px", fontFamily:"'Cinzel',serif", marginTop:"4px", letterSpacing:"1px" }}>{st}</div>;
                })()}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:"#e8dfc0", fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{totalModels}</div>
                <div style={{ color:"#d8c8ac", fontSize:"12px", letterSpacing:"2px" }}>FIGURINES</div>
                <div style={{ color:"#c8b49a", fontSize:"11px", marginTop:"1px" }}>{totalUnits} unités</div>
              </div>
            </div>
            {/* Stacked bar */}
            <div style={{ display:"flex", height:"6px", gap:"1px", marginBottom:"10px" }}>
              {totalPainted>0  && <div style={{ flex:totalPainted,  background:PAINT_STATUS.painted.color }} />}
              {totalWip>0      && <div style={{ flex:totalWip,      background:PAINT_STATUS.wip.color }} />}
              {totalPrimed>0   && <div style={{ flex:totalPrimed,   background:PAINT_STATUS.primed.color }} />}
              {totalUnpainted>0&& <div style={{ flex:totalUnpainted,background:"#1c1a16" }} />}
            </div>
            {/* Legend */}
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              {[
                {key:"painted",   label:"Peint",    val:totalPainted},
                {key:"wip",       label:"En cours", val:totalWip},
                {key:"primed",    label:"Apprêté",  val:totalPrimed},
                {key:"unpainted", label:"Nu",       val:totalUnpainted},
              ].map(s => s.val>0 && (
                <div key={s.key} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:PAINT_STATUS[s.key].color }} />
                  <span style={{ color:"#c8b9a0", fontSize:"12px" }}>{s.label} <span style={{ color:"#d6c39a" }}>{s.val}</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Colosses : comptés à part, sans changer le pourcentage */}
          {(() => { const c = colossusCount(inventory, ptsMap); return c.total > 0 && (
            <div className="hc-bare" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(8,6,4,0.55)", border:"1px solid #2a2418", padding:"8px 12px", margin:"-2px 0 8px" }}>
              <span style={{ color:"#c8b9a0", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>◈ COLOSSES</span>
              <span style={{ color:"#d6c39a", fontSize:"13px", fontFamily:"'Cinzel',serif" }}>{c.painted} / {c.total} consacrés</span>
            </div>
          ); })()}
          {/* Summary chips */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px" }}>
            {[
              { label:"RÉFÉRENCES", val:totalUnique },
              { label:"ARMÉES", val:paintedFactionsCount },
              { label:"PTS TOTAL", val:(()=>{ const t=factionStats.reduce((s,f)=>s+f.pts,0); return t>0?t.toLocaleString("fr-FR"):"—"; })() },
            ].map(c => (
              <div key={c.label} className="hc-bare" style={{ background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1a1816", padding:"10px 8px", textAlign:"center" }}>
                <div style={{ color:"#e8dfc0", fontSize:"18px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{c.val}</div>
                <div style={{ color:"#c8b49a", fontSize:"10px", letterSpacing:"2px", marginTop:"3px" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VÉLOCITÉ DE PEINTURE ─────────── */}
        {(() => {
          const now = new Date();
          // On ne remonte pas plus loin que la première trace d'activité (peinture ou achat) :
          // sinon les mois "vides" d'avant le début réel de l'usage de l'appli diluent la moyenne.
          const allDates = [
            ...(paintHistory||[]).map(h=>h.date).filter(Boolean),
            ...(inventory||[]).map(i=>i.purchasedAt).filter(Boolean),
          ].map(d => d.slice(0,7)).sort();
          const nowKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
          const crusadeKey = crusadeStartOf(appState, paintHistory).slice(0,7);
          const rawEarliest = allDates.length ? allDates[0] : nowKey;
          // On ne remonte jamais avant le Début de Croisade, sinon un historique
          // d'achats antérieur à l'usage de l'app dilue la moyenne mensuelle.
          const earliestKey = rawEarliest < crusadeKey ? crusadeKey : rawEarliest;
          const [ey, em] = earliestKey.split('-').map(Number);
          const monthsSinceStart = (now.getFullYear()-ey)*12 + (now.getMonth()+1-em) + 1;
          const span = Math.min(12, Math.max(1, monthsSinceStart));
          const months = [];
          for (let i = span-1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','') });
          }
          // Deux séries en parallèle : figurines (barres, comme avant) ET points
          // (courbe superposée) — les gros morceaux (Chevaliers/Titans) ressortent
          // ainsi même les mois où peu de figurines sont peintes.
          const byMonth = {}, byMonthPts = {};
          (paintHistory||[]).forEach(h => {
            if (!h.date) return;
            const it = inventory.find(i=>i.id===h.id);
            const u = it ? findUnit(it.faction, it.unitId) : null;
            const figs = it ? getModelCount(u?.name, it.qty||1, it.modelCount) : 1;
            const k = it ? `${it.faction}:${it.unitId}` : null;
            const pts = it ? (ptsMap[k]!=null ? ptsMap[k] : (POINTS_DB[u?.name]||0)) * (it.qty||1) : 0;
            byMonth[h.date] = (byMonth[h.date]||0) + figs;
            byMonthPts[h.date] = (byMonthPts[h.date]||0) + pts;
          });
          const data = months.map(m => ({ ...m, count: byMonth[m.key]||0, pts: byMonthPts[m.key]||0 }));
          const max = Math.max(1, ...data.map(m=>m.count));
          const maxPts = Math.max(1, ...data.map(m=>m.pts));
          const total = data.reduce((s,m)=>s+m.count,0);
          const totalPts = data.reduce((s,m)=>s+m.pts,0);
          if (total === 0) return null;
          // Le mois en cours n'est pas terminé : l'inclure dans la moyenne la tire
          // artificiellement vers le bas (pire cas : juste après minuit le 1er du
          // mois). Il reste affiché dans le graphique (barre + courbe), mais sort
          // du calcul de la moyenne — sauf si c'est le SEUL mois qu'on a (span=1),
          // auquel cas il n'y a rien d'autre à moyenner.
          const completed = data.filter(m => m.key !== nowKey);
          const avgSpan = completed.length || span;
          const avgSource = completed.length ? completed : data;
          const avg = (avgSource.reduce((s,m)=>s+m.count,0)/avgSpan).toFixed(1);
          const avgPts = Math.round(avgSource.reduce((s,m)=>s+m.pts,0)/avgSpan);
          return (
            <div style={{ marginBottom:"20px" }}>
              <div className="enlum" style={{ color:"#d8c8ac", marginBottom:"10px" }}><span className="enlum-mark">▲</span><span style={{ fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>VÉLOCITÉ DE PEINTURE</span><span className="enlum-mark">▲</span></div>
              <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderTop:`2px solid ${accent}`, padding:"14px 12px 10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"10px", flexWrap:"wrap", gap:"4px" }}>
                  <span style={{ color:"#d8c8ac", fontSize:"12px", letterSpacing:"1px" }}>{span<12 ? `DEPUIS TES DÉBUTS (${span} MOIS)` : "12 DERNIERS MOIS"}</span>
                  <span style={{ fontSize:"12px", fontWeight:"700" }}><span style={{ color:accent }}>{Number(avg).toLocaleString('fr', { minimumFractionDigits:1, maximumFractionDigits:1 })} fig</span><span style={{ color:"#8a7a5a" }}> · </span><span style={{ color:"#5ac8e8" }}>{avgPts.toLocaleString('fr')} pts</span><span style={{ color:"#8a7a5a" }}> /mois</span></span>
                </div>
                {/* ── Graphique : barres dorées (figurines), courbe bleue (points), moyenne, meilleur mois ── */}
                {(() => {
                  const H = 96;                 // hauteur de la zone des barres
                  const top = 18;               // réserve pour les chiffres au-dessus des barres
                  const usable = H - top;
                  const best = data.reduce((b, m) => m.count > (b?.count || 0) ? m : b, null);
                  const avgN = Number(avg);
                  const avgY = avgN > 0 ? H - Math.round(avgN / max * usable) : null;
                  // Courbe des points, lissée (Catmull-Rom → Bézier)
                  const P = data.map((m, idx) => [((idx + 0.5) / span) * 100, 100 - Math.max(4, Math.round(m.pts / maxPts * 80))]);
                  let path = P.length ? `M${P[0][0]},${P[0][1]}` : "";
                  for (let k = 0; k < P.length - 1; k++) {
                    const p0 = P[k - 1] || P[k], p1 = P[k], p2 = P[k + 1], p3 = P[k + 2] || p2;
                    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
                    path += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
                  }
                  const sel = data.find(m => m.key === velSel);
                  const moisLong = (k) => { const [y, mo] = k.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month:'long', year:'numeric' }); };
                  return (
                    <div style={{ position:"relative" }}>
                      {/* Bulle de détail du mois touché */}
                      {sel && (
                        <div onClick={() => setVelSel(null)} style={{ position:"absolute", top:"-6px", left:"50%", transform:"translateX(-50%)", zIndex:3, background:"rgba(10,8,6,0.96)", border:`1px solid ${accent}88`, padding:"6px 10px", whiteSpace:"nowrap", boxShadow:"0 4px 14px #000c", animation:"viewFade 0.2s ease both" }}>
                          <span style={{ color:"#efe4c4", fontFamily:"'Cinzel',serif", fontSize:"12px" }}>{moisLong(sel.key).replace(/^./, c => c.toUpperCase())}</span>
                          <span style={{ color:"#8a7a5a" }}> · </span>
                          <span style={{ color:accent, fontSize:"12.5px", fontWeight:700 }}>{sel.count} fig</span>
                          <span style={{ color:"#8a7a5a" }}> · </span>
                          <span style={{ color:"#5ac8e8", fontSize:"12.5px" }}>{sel.pts.toLocaleString('fr')} pts</span>
                          {sel.key === nowKey && <span style={{ color:"#9a8a6a", fontStyle:"italic", fontSize:"11.5px" }}> (en cours)</span>}
                        </div>
                      )}
                      <div style={{ position:"relative", height:`${H}px`, marginTop: sel ? "26px" : "6px", transition:"margin 0.2s" }}>
                        {/* Lignes de repère discrètes */}
                        {[0.5, 1].map(f => <div key={f} style={{ position:"absolute", left:0, right:0, bottom:`${f * usable}px`, borderTop:"1px solid #ffffff0d" }} />)}
                        {/* Moyenne mensuelle */}
                        {avgY != null && (
                          <div style={{ position:"absolute", left:0, right:0, top:`${avgY}px`, borderTop:`1px dashed ${accent}88`, zIndex:1, pointerEvents:"none" }}>
                            <span style={{ position:"absolute", right:0, top:"-14px", color:accent, fontSize:"9.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", background:"rgba(13,11,10,0.8)", padding:"0 3px" }}>MOY. {avgN.toLocaleString('fr', { maximumFractionDigits:1 })}</span>
                          </div>
                        )}
                        <div style={{ display:"flex", alignItems:"flex-end", gap:"5px", height:"100%", position:"relative", zIndex:2 }}>
                          {data.map(m => {
                            const h = m.count ? Math.max(6, Math.round(m.count / max * usable)) : 2;
                            const current = m.key === nowKey, isBest = best && m.key === best.key && m.count > 0 && data.length > 1, on = velSel === m.key;
                            return (
                              <div key={m.key} onClick={() => setVelSel(on ? null : m.key)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%", cursor:"pointer" }}>
                                {m.count > 0 && <div style={{ color: isBest ? "#f4dc94" : "#c8b890", fontSize:"10.5px", fontFamily:"'Cinzel',serif", marginBottom:"2px", lineHeight:1 }}>{isBest ? "★ " : ""}{m.count}</div>}
                                <div style={{ width:"100%", maxWidth:"22px", height:`${h}px`, borderRadius:"4px 4px 1px 1px",
                                  background: current
                                    ? `repeating-linear-gradient(135deg, ${accent}cc 0 4px, ${accent}55 4px 8px)`
                                    : `linear-gradient(180deg, #fff2c0 0%, ${accent} 18%, ${accent}aa 100%)`,
                                  boxShadow: on ? `0 0 12px ${accent}` : isBest ? `0 0 10px ${accent}88` : `0 0 4px ${accent}33`,
                                  outline: on ? `1px solid #fff4cc` : "none", transition:"height 0.5s ease" }} />
                              </div>
                            );
                          })}
                        </div>
                        {totalPts > 0 && (
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:"absolute", left:0, right:0, bottom:0, height:`${usable}px`, width:"100%", overflow:"visible", pointerEvents:"none", zIndex:2 }}>
                            <path d={path} fill="none" stroke="#5ac8e8" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.95" style={{ filter:"drop-shadow(0 0 3px #5ac8e888)" }} />
                          </svg>
                        )}
                        {totalPts > 0 && P.map(([x, y], idx) => (
                          <div key={idx} style={{ position:"absolute", left:`calc(${x}% - 3px)`, bottom:`${(100 - y) / 100 * usable - 3}px`, width:"6px", height:"6px", borderRadius:"50%", background:"#5ac8e8", border:"1px solid #0a0806", zIndex:2, pointerEvents:"none" }} />
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:"5px", marginTop:"6px", borderTop:"1px solid #ffffff14", paddingTop:"4px" }}>
                        {data.map(m => (
                          <div key={m.key} style={{ flex:1, textAlign:"center", color: velSel === m.key ? "#f4dc94" : m.key === nowKey ? "#9a8a6a" : "#c4b59a", fontSize:"10px", fontFamily:"'Cinzel',serif", textTransform:"uppercase", fontStyle: m.key === nowKey ? "italic" : "normal" }}>{m.label}</div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginTop:"9px" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:"4px", color:"#8a7a5a", fontSize:"10px", fontFamily:"'Cinzel',serif" }}><span style={{ width:"9px", height:"9px", background:accent, display:"inline-block", borderRadius:"1px" }} />FIGURINES</span>
                  <span style={{ display:"flex", alignItems:"center", gap:"4px", color:"#8a7a5a", fontSize:"10px", fontFamily:"'Cinzel',serif" }}><span style={{ width:"9px", height:"2px", background:"#5ac8e8", display:"inline-block" }} />POINTS</span>
                  <span style={{ display:"flex", alignItems:"center", gap:"4px", color:"#8a7a5a", fontSize:"10px", fontFamily:"'Cinzel',serif" }}><span style={{ width:"9px", height:"9px", background:`repeating-linear-gradient(135deg, ${accent}cc 0 2px, ${accent}44 2px 4px)`, display:"inline-block" }} />EN COURS</span>
                </div>
                <div style={{ color:"#7a6c52", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", marginTop:"4px" }}>Touche une barre pour le détail du mois.</div>
              </div>
            </div>
          );
        })()}

        {/* ── PAR FACTION ────────────────── */}
        {factionStats.length>0 && (
          <div style={{ marginBottom:"20px" }}>
            <Fold id="factions" mark="❖" title="PAR FACTION" summary={`${factionStats.length} armée${factionStats.length>1?"s":""}`}>
            {factionStats.map(({ key, f, models, units, painted, paintedModels, pts, byRole, uniqueUnits }) => {
              const pct = models ? Math.round(paintedModels/models*100) : 0;
              const topRoles = Object.entries(byRole).sort((a,b)=>b[1]-a[1]); // toutes : avec 4 max, 4 Chevaliers sur 21 n'apparaissaient nulle part
              return (
                <div key={key} className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderLeft:`3px solid ${f.accent}`, padding:"12px 14px", marginBottom:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span><FactionIcon faction={key} factionDef={f} size={22} /></span>
                      <div>
                        <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{f.label}</div>
                        <div style={{ color:"#d8c8ac", fontSize:"12px", marginTop:"1px" }}>{uniqueUnits} unités · {models} figurines</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ color: pct===100?"#2a7a2a":f.accent, fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"900" }}>{pct}%</div>
                      {pts>0 && <div style={{ color:"#d8c8ac", fontSize:"12px" }}>{pts.toLocaleString('fr')} pts</div>}
                    </div>
                  </div>
                  {/* Jauge par statut : peint · en cours · apprêté · à faire (monté ou sur grappe) */}
                  {(() => {
                    const st = { painted:0, wip:0, primed:0, todo:0 };
                    inventory.forEach(i => { if (i.faction !== key) return; const n = getModelCount(findUnit(i.faction, i.unitId)?.name, i.qty||1, i.modelCount);
                      const k = i.paintStatus === "painted" ? "painted" : i.paintStatus === "wip" ? "wip" : i.paintStatus === "primed" ? "primed" : "todo"; st[k] += n; });
                    const seg = [
                      { k:"painted", n:st.painted, c:"#3a9a3a", hi:"#7ad07a", lbl:"peintes" },
                      { k:"wip",     n:st.wip,     c:"#c07a10", hi:"#f0b050", lbl:"en cours" },
                      { k:"primed",  n:st.primed,  c:"#a08a20", hi:"#d8c060", lbl:"apprêtées" },
                      { k:"todo",    n:st.todo,    c:"#4a4436", hi:"#7a7058", lbl:"à faire" },
                    ].filter(x => x.n > 0);
                    return (
                      <>
                        <div style={{ display:"flex", height:"8px", borderRadius:"4px", overflow:"hidden", background:"#0a0806", boxShadow:"inset 0 1px 2px #000", margin:"2px 0 6px", gap:"1px" }}>
                          {seg.map(x => <div key={x.k} style={{ flex:x.n, background:`linear-gradient(180deg, ${x.hi} 0%, ${x.c} 60%)` }} />)}
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px", marginBottom:"6px" }}>
                          {seg.map(x => (
                            <span key={x.k} style={{ display:"inline-flex", alignItems:"center", gap:"4px", color:"#c8b9a0", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif" }}>
                              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:x.hi, display:"inline-block" }} />{x.n} {x.lbl}
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                  <div style={{ color: pct===100?"#2a7a2a":pct>=90?"#6a8a3a":pct>=70?"#8a7a2a":pct>=30?"#8a5a2a":"#7a2a2a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"8px" }}>
                    {pct===100?"⚔ Armée terminée":pct>=90?"Dernière ligne droite":pct>=70?"Presque prêt":pct>=30?"Bon progrès":"Armée en construction"}
                  </div>
                  {/* Role breakdown */}
                  {topRoles.length>0 && (
                    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      {topRoles.map(([role,cnt]) => (
                        <div key={role} className="hc-bare" style={{ background:"rgba(8,6,4,0.55)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:`1px solid ${f.accent}22`, padding:"2px 8px", display:"flex", gap:"5px", alignItems:"center" }}>
                          <span style={{ color:f.accent, fontSize:"12.5px", fontWeight:"700" }}>{cnt}</span>
                          <span style={{ color:"#d8c8ac", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>
                            {{"Seigneur de guerre":"Seigneur","Attaque rapide":"Rapide","Soutien lourd":"Lourd","Chevalier Questoris":"Questoris","Chevalier Dominus":"Dominus","Chevalier Cerastus":"Cerastus","Chevalier Acastus":"Acastus"}[role]||role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            </Fold>
          </div>
        )}

        {/* ── PROPHÉTIE DU CHAPELAIN ─────────── */}
        {(() => {
          const now = Date.now();
          // La cadence se calcule sur TOUT l'historique depuis la toute première
          // figurine (achat ou peinture), sans plafond — sinon un plafond artificiel
          // (ex: 90 jours) ignore une partie de ton vrai historique et fausse le rythme.
          const allDates = [
            ...(paintHistory||[]).map(h=>h.day||h.date).filter(Boolean),
            ...(inventory||[]).map(i=>i.purchasedAt).filter(Boolean),
          ].map(d => new Date(d.length>7?d:d+"-01").getTime()).filter(t=>!isNaN(t));
          const crusadeTs = new Date(crusadeStartOf(appState, paintHistory)).getTime();
          const rawEarliestTs = allDates.length ? Math.min(...allDates) : now;
          // Idem : la cadence se mesure depuis le Début de Croisade, pas depuis
          // une date d'achat vieille de plusieurs années.
          const earliestTs = Math.max(rawEarliestTs, crusadeTs);
          // BUG corrigé : daysSinceStart était arrondi par Math.floor() puis
          // reconverti en "since" (now - windowDays*ms). Cet aller-retour perdait
          // jusqu'à ~24h, décalant "since" légèrement APRÈS earliestTs — assez pour
          // exclure toutes les entrées calées sur le 1er du mois (tout l'historique
          // sans h.day, donc la quasi-totalité des mois anciens), et faire retomber
          // le calcul sur les seules entrées très récentes. C'est ce qui causait
          // l'écart avec la Vélocité (ex: 2.0/mois affiché contre 8.0/mois réel).
          // On compare maintenant directement à earliestTs (aucun arrondi), et on
          // garde une durée fractionnaire pour le diviseur.
          const daysSinceStart = Math.max(1, (now-earliestTs)/86400000);
          const recent = (paintHistory||[]).filter(h => {
            const when = h.day || (h.date ? h.date + "-01" : null);
            return when && new Date(when).getTime() >= earliestTs;
          });
          // Le rythme et la pile se mesurent en POINTS, pas en nombre brut de
          // figurines : un Chevalier ou un Titan valent des centaines de points
          // et représentent des dizaines d'heures de peinture, contre ~20 pts et
          // quelques heures pour un Space Marine. Compter les figurines à parts
          // égales aurait annoncé la même échéance qu'on ait 40 gardes ou 4
          // Chevaliers à finir — les points, déjà présents pour chaque unité,
          // servent de proxy naturel à la complexité/taille sans rien inventer.
          const ptsOfItem = (it) => { const u = findUnit(it.faction, it.unitId); const k = `${it.faction}:${it.unitId}`; return (ptsMap[k]!=null ? ptsMap[k] : (POINTS_DB[u?.name]||0)) * (it.qty||1); };
          const figsOfItem = (it) => { const u = findUnit(it.faction, it.unitId); return getModelCount(u?.name, it.qty||1, it.modelCount); };
          let figsWindow = 0, ptsWindow = 0;
          recent.forEach(h => { const it = inventory.find(i => i.id === h.id); if (!it) { figsWindow += 1; return; } figsWindow += figsOfItem(it); ptsWindow += ptsOfItem(it); });
          const perMonth = figsWindow / (daysSinceStart/30);
          const perMonthPts = ptsWindow / (daysSinceStart/30);
          const unpainted = totalModels - totalPainted;
          const unpaintedItems = inventory.filter(i => i.paintStatus !== "painted");
          const unpaintedPts = unpaintedItems.reduce((s,i) => s + ptsOfItem(i), 0);
          // Repère les grosses pièces encore à peindre, pour le mentionner explicitement
          // Certaines pièces monstrueuses ne portent pas un rôle "Titanique"/"Chevalier"
          // dédié (ex: le Hierophant Bio-Titan Tyranide est classé "Lourd" comme un
          // simple Carnifex) — on les rattrape par le même seuil de points que le
          // badge Titanicus, plutôt que de ne se fier qu'à l'intitulé du rôle.
          const bigOnes = unpaintedItems.filter(i => {
            const u = findUnit(i.faction, i.unitId);
            if (!u) return false;
            const isBigRole = u.role==="Titanique" || (u.role||"").startsWith("Chevalier") || u.role==="Armiger" || u.role==="Seigneur de guerre";
            const isBigPts = (POINTS_DB[u.name]||0) >= 400;
            return isBigRole || isBigPts;
          });
          const bigFigs = bigOnes.reduce((s,i)=>s+figsOfItem(i),0);
          const bigPts  = bigOnes.reduce((s,i)=>s+ptsOfItem(i),0);
          return (
            <div style={{ padding:"0 14px", marginBottom:"14px" }}>
              <div className="enlum" style={{ color:"#d8c8ac", marginBottom:"10px" }}><span className="enlum-mark">☉</span><span style={{ fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>PROPHÉTIE DU CHAPELAIN</span><span className="enlum-mark">☉</span></div>
              <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(13,11,8,0.6) 0%,rgba(8,6,4,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #16130e", borderLeft:"2px solid #6a5a3a", padding:"12px 14px" }}>
                {perMonthPts < 5 ? (
                  <div style={{ color:"#8a7a5a", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.6 }}>Les augures sont muets. Peins quelques figurines et le Chapelain lira ton destin dans les runes.</div>
                ) : (<>
                  <div style={{ color:"#c8bfa8", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.6, marginBottom:"8px" }}>
                    « Tu consacres <span style={{ color:"#b8922a" }}>{Math.round(perMonthPts).toLocaleString('fr')} points par mois</span>, soit environ {perMonth.toLocaleString('fr', { maximumFractionDigits:1 })} figurines. {unpaintedPts > 0 ? <>Ta pile restante pèse <span style={{ color:"#b8922a" }}>{unpaintedPts.toLocaleString('fr')} points</span> pour {unpainted} figurines{bigFigs>0 ? <> — dont {bigFigs} Chevalier{bigFigs>1?"s":""}/Titan{bigFigs>1?"s":""} qui, à {bigPts.toLocaleString('fr')} pts, représentent à eux seuls {Math.round(bigPts/unpaintedPts*100)}% de ce qu'il te reste à peindre</> : ""}. À ce rythme, elle sera purgée {(() => { const months = unpaintedPts/perMonthPts; const d = new Date(now + months*30*86400000); return "vers " + d.toLocaleDateString('fr', {month:'long', year:'numeric'}); })()}. » </> : "Ta pile est vide — le Chapelain n'a plus rien à prédire. »"}
                  </div>
                  {oath && !oath.deadline && (
                    <div style={{ color:"#b8922a", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", borderTop:"1px solid #16130e", paddingTop:"8px" }}>☩ Serment en cours : « {oath.label} »</div>
                  )}
                  {oath && oath.deadline && (() => {
                    // Même règle que sur l'Accueil : un vœu qui cible une figurine précise
                    // (oath.unitId) n'est tenu que si CETTE figurine est peinte.
                    const prog = oath.unitId ? (() => {
                      const target = inventory.find(i => i.id === oath.unitId);
                      return (target && target.paintStatus === "painted") ? oath.target : 0;
                    })() : (paintHistory||[]).reduce((s,h) => {
                      const when = h.day || (h.date ? h.date+"-01" : null);
                      if (!when || when < oath.sworn) return s;
                      const it = inventory.find(i => i.id === h.id);
                      if (!it) return s;
                      const u = findUnit(it.faction, it.unitId);
                      return s + getModelCount(u?.name, it.qty||1, it.modelCount);
                    }, 0);
                    const remain = Math.max(0, oath.target - prog);
                    const daysLeft = Math.ceil((new Date(oath.deadline + "T23:59:59").getTime() - now)/86400000);
                    const needPerMonth = daysLeft > 0 ? remain / (daysLeft/30) : Infinity;
                    const verdict = remain === 0 ? "Ce serment est déjà accompli. Gloire à toi." : daysLeft < 0 ? "Ce serment dort : sa bougie s'est éteinte. Il n'est pas rompu." : needPerMonth <= perMonth ? "Ton serment sera tenu, si ta main ne faiblit pas." : "Ce serment est... optimiste. Les Dieux du Chaos ricanent.";
                    const vcol = remain === 0 ? "#5a8a3a" : (daysLeft < 0 || needPerMonth > perMonth) ? "#a05030" : "#b8922a";
                    return <div style={{ color:vcol, fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", borderTop:"1px solid #16130e", paddingTop:"8px" }}>⚔ {verdict}</div>;
                  })()}
                </>)}
              </div>
            </div>
          );
        })()}

        {/* ── SALLE DES TROPHÉES ─────────── */}
        {(() => {
          // La liste des trophées est calculée dans lib/trophies.jsx (App s'en sert aussi pour la cérémonie)
          const badges = computeTrophies({ inventory, paintHistory, ptsMap, appState });
          const unlocked = badges.filter(b => b.got).length;
          return (
            <div style={{ padding:"0 14px", marginBottom:"14px" }}>
              <Fold id="trophees" mark="⚑" title="TROPHÉES" summary={`${unlocked}/${badges.length}`}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                {badges.map(b => (
                  <div key={b.name} className="hc-bare" style={{ background: b.got ? "linear-gradient(135deg,rgba(20,16,10,0.6),rgba(10,8,6,0.72))" : "rgba(6,5,5,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:`1px solid ${b.got?"#b8922a44":"#1c1a18"}`, padding:"9px 10px", display:"flex", gap:"8px", alignItems:"center" }}>
                    <div style={{ fontSize:"18px", color:"#e8dfc0", display:"flex", filter: b.got ? "none" : "grayscale(1) brightness(0.75)" }}>
                      {b.icon.startsWith("svg:") ? <NavIcon id={b.icon.slice(4)} size={18} color="currentColor" /> : b.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color: b.got ? "#e8dfc0" : "#9a8a78", fontSize:"12px", fontFamily:"'Cinzel',serif", fontWeight:"700", lineHeight:1.2 }}>{b.name}</div>
                      <div style={{ color: b.got ? "#8a7a58" : "#8a8078", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.25, marginTop:"1px" }}>{b.desc}</div>
                      <div style={{ color: b.got ? "#7a9a4a" : "#9a8a5a", fontSize:"10.5px", fontFamily:"'Cinzel',serif", letterSpacing:"0.5px", marginTop:"3px" }}>{b.got ? "✓ DÉBLOQUÉ" : (b.prog ? `⧗ ${b.prog}` : "⊠ À débloquer")}</div>
                    </div>
                  </div>
                ))}
              </div>
              </Fold>
            </div>
          );
        })()}

        {/* ── JUGEMENT DE L'INQUISITION ─────────── */}
        {(() => {
          const now = new Date();
          const month = now.getMonth(); // 0=jan ... 11=dec
          const year = now.getFullYear();
          const judgments = appState.judgments || [];
          const sealed = judgments.find(j => j.year === year);
          // Scellable seulement en nov/déc, et une seule fois par an
          const canSeal = month >= 10 && !sealed && enrolDaysLeft(appState) === 0;   // pas de jugement pendant l'enrôlement
          const dPct = sealed ? sealed.pct : paintPct;
          const dPainted = sealed ? sealed.painted : totalPainted;
          const dTotal = sealed ? sealed.total : totalModels;
          // Figurines réellement nécessaires pour atteindre le palier supérieur (arrondi compris)
          const needFor = (target) => Math.max(1, Math.ceil((target - 0.5) / 100 * dTotal - dPainted));
          const figs = (n) => `${n} figurine${n > 1 ? "s" : ""}`;
          const deadlineTxt = (month === 11 && now.getDate() > 21) ? "avant la fin de l'année" : "avant le solstice";
          const verdict = dPct >= 90 ? { t:"EXEMPLAIRE", d:"Ta dévotion est un modèle pour l'Imperium. L'Inquisition te salue.", col:"#5a8a3a", sentence:"Aucune. Poursuis ton œuvre sacrée." }
            : dPct >= 70 ? { t:"SATISFAISANT", d:"Loyauté confirmée, quelques négligences tolérées.", col:"#b8922a", sentence:`${figs(needFor(90))} ${deadlineTxt} pour l'absolution complète.` }
            : dPct >= 50 ? { t:"SOUS SURVEILLANCE", d:"L'Inquisition note un relâchement inquiétant.", col:"#a05030", sentence:`${figs(needFor(70))} à consacrer sous peine d'audit.` }
            : { t:"HÉRÉSIE PASSIVE", d:"Négligence manifeste. Un océan de plastique gris crie vengeance.", col:"#c04040", sentence:`${figs(needFor(50))}. Immédiatement. C'est un ordre.` };
          const pastJudgments = judgments.filter(j => j.year !== year).sort((a,b)=>b.year-a.year);
          return (
            <div style={{ padding:"0 14px", marginBottom:"14px" }}>
              <div className="enlum" style={{ color:"#d8c8ac", marginBottom:"10px" }}><span className="enlum-mark">⚖</span><span style={{ fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>JUGEMENT ANNUEL · {year}</span><span className="enlum-mark">⚖</span></div>
              <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,#0f0a0a 0%,#080505 100%)", border:`1px solid ${verdict.col}44`, borderTop:`2px solid ${verdict.col}`, padding:"16px 14px", textAlign:"center" }}>
                <div style={{ fontSize:"22px", marginBottom:"4px" }}>⚖</div>
                <div style={{ color:"#b3a48c", fontSize:"10px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>{sealed ? "VERDICT OFFICIEL" : "APERÇU DU VERDICT"} · ORDO HERETICUS</div>
                <div style={{ color:verdict.col, fontSize:"17px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", margin:"4px 0 8px" }}>{verdict.t}</div>
                <div style={{ color:"#c8bfa8", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginBottom:"10px" }}>« {verdict.d} »</div>
                <div className="hc-bare" style={{ background:"#00000066", border:"1px solid #1c1a16", padding:"8px 10px" }}>
                  <div style={{ color:"#b3a48c", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"3px" }}>SENTENCE</div>
                  <div style={{ color:verdict.col, fontSize:"12.5px", fontFamily:"'Crimson Pro',serif" }}>{verdict.sentence}</div>
                </div>
                <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif", marginTop:"8px" }}>Ratio de consécration : {dPct}% · {dPainted}/{dTotal} figurines</div>
                {sealed && <div style={{ color:"#5a8a3a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"8px" }}>✓ Scellé le {new Date(sealed.sealedAt).toLocaleDateString('fr-FR')} — ce verdict ne changera plus</div>}
                {!sealed && !canSeal && <div style={{ color:"#8a7a5a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"8px" }}>Verdict provisoire : il pourra être scellé du 1er novembre au 31 décembre. Sans scellage, il le sera automatiquement au début de l'année suivante.</div>}
              </div>
              {canSeal && (
                <button onClick={() => confirm(
                    `Sceller le jugement ${year} à ${paintPct}% (${totalPainted}/${totalModels} figurines) ? Ce verdict sera figé et n'évoluera plus, même si tu continues de peindre.`,
                    () => { onSealJudgment(); playSfx("sceau"); },
                    "#b8922a", "⚖ SCELLER", false
                  )}
                  style={{ width:"100%", marginTop:"10px", padding:"11px", background:"#b8922a15", border:"1px solid #b8922a55", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
                  ⚖ SCELLER LE JUGEMENT {year}
                </button>
              )}
              {pastJudgments.length > 0 && (
                <div style={{ marginTop:"10px" }}>
                  <div style={{ color:"#c4b59a", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px" }}>JUGEMENTS PASSÉS</div>
                  {pastJudgments.map(j => {
                    const v = j.pct >= 90 ? "EXEMPLAIRE" : j.pct >= 70 ? "SATISFAISANT" : j.pct >= 50 ? "SOUS SURVEILLANCE" : "HÉRÉSIE PASSIVE";
                    const vc = j.pct >= 90 ? "#5a8a3a" : j.pct >= 70 ? "#b8922a" : j.pct >= 50 ? "#a05030" : "#c04040"; // même code couleur que le verdict en cours
                    return (
                      <div key={j.year} className="hc-bare" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(13,11,10,0.55)", border:"1px solid #1a1816", padding:"7px 10px", marginBottom:"4px" }}>
                        <span style={{ color:"#d8c8ac", fontSize:"11.5px", fontFamily:"'Cinzel',serif" }}>{j.year}</span>
                        <span style={{ color:"#c8b49a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{v}</span>
                        <span style={{ color:vc, fontSize:"11.5px", fontFamily:"'Cinzel',serif" }}>{j.pct}%{j.auto ? " · auto" : ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── RÉTROSPECTIVE ─────────── */}
        {(() => {
          // Années disponibles. En janvier-février, on ouvre par défaut l'année qui vient de
          // s'achever : avant, la Rétrospective 2026 disparaissait dès le 1er janvier 2027.
          const years = [...new Set((paintHistory||[]).map(h => h.date && Number(h.date.slice(0,4))).filter(Boolean))].sort((a,b)=>b-a);
          if (!years.length) return null;
          const nowY = new Date().getFullYear();
          const defaultYear = (new Date().getMonth() <= 1 && years.includes(nowY-1)) ? nowY-1 : (years.includes(nowY) ? nowY : years[0]);
          const year = years.includes(retroYear) ? retroYear : defaultYear;
          // Une figurine repeinte (statut changé puis remis à « peinte ») ne compte qu'une fois
          const seenIds = new Set();
          const thisYear = (paintHistory||[]).filter(h => h.date && h.date.startsWith(String(year)) && !seenIds.has(h.id) && seenIds.add(h.id));
          if (!thisYear.length) return null;
          // Stats de l'année
          const paintedPairs = thisYear.map(h => ({ item: inventory.find(i => i.id === h.id), date: h.date })).filter(p => p.item);
          const paintedItems = paintedPairs.map(p => p.item);
          const figsOfEntry = (i) => { const u=findUnit(i.faction, i.unitId); return getModelCount(u?.name, i.qty||1, i.modelCount); };
          const figsPainted = paintedItems.reduce((s,i) => s + figsOfEntry(i), 0);
          const ptsPainted = paintedItems.reduce((s,i) => { const u=findUnit(i.faction, i.unitId); const p=ptsMap[`${i.faction}:${i.unitId}`]||(u?POINTS_DB[u.name]:0)||0; return s+p*(i.qty||1); }, 0);
          // Faction dominante, meilleur mois, et rang annuel : tous basés sur le vrai
          // nombre de FIGURINES peintes (déjà calculé ci-dessus pour figsPainted), pas
          // sur le nombre brut d'entrées d'historique — sinon 10 escouades de 5
          // figurines (50 vraies figurines) comptent pour "10", faussant classement
          // et rang de la même manière qu'on l'a déjà corrigé ailleurs dans l'app.
          const byFaction = {};
          paintedItems.forEach(i => { byFaction[i.faction] = (byFaction[i.faction]||0)+figsOfEntry(i); });
          const topFaction = Object.entries(byFaction).sort((a,b)=>b[1]-a[1])[0];
          const byMonth = {};
          paintedPairs.forEach(p => { if (p.date) byMonth[p.date] = (byMonth[p.date]||0)+figsOfEntry(p.item); });
          const bestMonth = Object.entries(byMonth).sort((a,b)=>b[1]-a[1])[0];
          const lbls = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          const rank = figsPainted>=40?"⚔ Croisé Légendaire":figsPainted>=25?"✠ Maître Artisan":figsPainted>=12?"◈ Peintre Dévoué":figsPainted>=5?"◈ Apprenti Assidu":"⧗ Frère Hésitant";
          const tf = topFaction ? FACTIONS[topFaction[0]] : null;
          return (
            <div style={{ padding:"0 14px", marginBottom:"14px" }}>
              {!showRetro ? (
                <button onClick={() => setShowRetro(true)}
                  style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#14100a 0%,#0a0806 60%,#14100a 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"3px", cursor:"pointer", touchAction:"manipulation" }}>
                  ✦ RÉTROSPECTIVE {year} ✦
                </button>
              ) : (
                <div className="hc-bare" style={{ background:"linear-gradient(180deg,#14100a 0%,#080604 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"20px 16px", textAlign:"center" }}>
                  <div style={{ color:"#b3a48c", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>CHRONIQUES DE L'ANNÉE</div>
                  <div style={{ color:"#e8dfc0", fontSize:"26px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", margin:"4px 0 16px" }}>{year}</div>
                  {years.length > 1 && (
                    <div style={{ display:"flex", justifyContent:"center", gap:"6px", margin:"-8px 0 16px", flexWrap:"wrap" }}>
                      {years.map(y => (
                        <button key={y} onClick={() => setRetroYear(y)}
                          style={{ padding:"4px 10px", background: y===year ? "#b8922a22" : "none", border:`1px solid ${y===year ? "#b8922a" : "#3a3020"}`, color: y===year ? "#d4b060" : "#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"11px", cursor:"pointer" }}>{y}</button>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"center", gap:"22px", marginBottom:"16px" }}>
                    <div>
                      <div className="stat-hero" style={{ color:"#b8922a", fontSize:"30px", lineHeight:1 }}>{figsPainted}</div>
                      <div style={{ color:"#c8b9a0", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"3px" }}>FIGURINES PEINTES</div>
                    </div>
                    <div>
                      <div className="stat-hero" style={{ color:"#5a8a3a", fontSize:"30px", lineHeight:1 }}>{ptsPainted.toLocaleString('fr')}</div>
                      <div style={{ color:"#c8b9a0", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"3px" }}>PTS AJOUTÉS</div>
                    </div>
                  </div>
                  {tf && <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"5px" }}>Faction favorite : <span style={{ color:tf.accent }}><FactionIcon faction={topFaction[0]} size={14} /> {tf.label}</span> ({topFaction[1]} figurines)</div>}
                  {bestMonth && <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"14px" }}>Meilleur mois : <span style={{ color:"#b8922a" }}>{lbls[parseInt(bestMonth[0].split('-')[1])-1]}</span> ({bestMonth[1]} figurines)</div>}
                  <div style={{ display:"inline-block", padding:"8px 18px", border:"1px solid #b8922a", background:"#b8922a15", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"13px", letterSpacing:"2px", marginBottom:"12px" }}>{rank}</div>
                  <div>
                    <button onClick={() => setShowRetro(false)} style={{ background:"none", border:"none", color:"#9a8a6a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", padding:"6px" }}>FERMER</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── LE MIROIR : comparaison de la collection à deux moments ─────────── */}
        {(() => {
          const allDates = (paintHistory||[]).map(h => h.day || (h.date ? h.date+"-01" : null)).filter(Boolean).sort();
          if (allDates.length < 2) return null; // pas assez d'historique pour comparer
          const earliest = new Date(allDates[0]);
          const now = new Date();
          const monthsSpan = Math.max(1, (now.getFullYear()-earliest.getFullYear())*12 + (now.getMonth()-earliest.getMonth()));
          // La valeur du curseur ne doit jamais dépasser l'historique réellement
          // disponible — sinon le texte affiche "il y a 6 mois" alors que le curseur
          // lui-même est plafonné à 5, incohérence visible entre les deux.
          // monthsSpan + 1 = « Depuis le début » : juste avant le premier mois de l'historique
          const effMonths = Math.min(mirrorMonths, monthsSpan + 1);
          const figsOf = (i) => { const u=findUnit(i.faction, i.unitId); return getModelCount(u?.name, i.qty||1, i.modelCount); };
          const ptsOf  = (i) => { const u=findUnit(i.faction, i.unitId); const p=ptsMap[`${i.faction}:${i.unitId}`]||(u?POINTS_DB[u.name]:0)||0; return p*(i.qty||1); };
          // Totaux actuels (état réel de l'inventaire, pas dérivés de l'historique)
          const nowFigs = inventory.reduce((s,i) => s + (i.paintStatus==="painted" ? figsOf(i) : 0), 0);
          const nowPts  = inventory.reduce((s,i) => s + (i.paintStatus==="painted" ? ptsOf(i) : 0), 0);
          const nowTotalFigs = inventory.reduce((s,i) => s + figsOf(i), 0);
          // Première consécration connue de chaque relique (une seule fois, même si elle a été repeinte)
          const firstDay = {};
          (paintHistory||[]).forEach(h => { const w = h.day || (h.date ? h.date+"-01" : null); if (w && (!firstDay[h.id] || w < firstDay[h.id])) firstDay[h.id] = w; });
          const paintedNow = inventory.filter(i => i.paintStatus === "painted");
          return (
            <div style={{ padding:"0 14px", marginBottom:"14px" }}>
              {!showMirror ? (
                <button onClick={() => setShowMirror(true)}
                  style={{ width:"100%", padding:"14px", backgroundColor:"#0a0806", backgroundImage:`linear-gradient(rgba(8,6,4,0.5), rgba(8,6,4,0.68)), url(${import.meta.env.BASE_URL}fonds/parchemin.jpg)`, backgroundSize:"cover", backgroundPosition:"center", border:"1px solid #b8922a55", borderTop:"2px solid #b8922a", color:"#d4b060", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"3px", cursor:"pointer", touchAction:"manipulation", textShadow:"0 1px 3px #000" }}>
                  <Crescent /> &nbsp;LE MIROIR&nbsp; <Crescent flip />
                </button>
              ) : (() => {
                // Choisir un mois = regarder la collection à la FIN de ce mois (aujourd'hui pour le mois en cours),
                // pour que le « + » corresponde exactement aux mois dorés de la frise.
                const cutoff = effMonths === 0 ? new Date(now) : new Date(now.getFullYear(), now.getMonth() - effMonths + 1, 0);
                const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}`;
                // On part de l'état RÉEL d'aujourd'hui et on retire ce qui a été consacré APRÈS la date
                // choisie. Avant, « Alors » ne comptait que les peintures notées dans l'historique : toutes
                // les figurines déjà peintes avant l'app (ou passées « Peint » sans date) étaient
                // comptées comme peintes depuis, d'où un « +112 en un mois » impossible.
                // Chaque relique ne compte qu'une fois, à la date de sa première consécration.
                const afterCut = paintedNow.filter(i => firstDay[i.id] && firstDay[i.id] > cutoffKey);
                const deltaFigs = afterCut.reduce((s,i)=>s+figsOf(i),0);
                const deltaPts  = afterCut.reduce((s,i)=>s+ptsOf(i),0);
                const pastFigs = nowFigs - deltaFigs, pastPts = nowPts - deltaPts;
                const pastPct = nowTotalFigs ? Math.round(pastFigs/nowTotalFigs*100) : 0;
                const nowPct  = nowTotalFigs ? Math.round(nowFigs/nowTotalFigs*100) : 0;
                const moisLbl = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
                const cutoffDateTxt = `fin ${moisLbl[cutoff.getMonth()]} ${cutoff.getFullYear()}`;
                const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

                // Frise des mois (le curseur) : un cran par mois, du plus ancien à aujourd'hui.
                // Hauteur du cran = figurines peintes ce mois-là ; les crans entre le mois choisi
                // et aujourd'hui s'allument en or → le « chemin parcouru » se voit d'un coup d'œil.
                const nTicks = monthsSpan + 1;
                const perMonth = {};
                paintedNow.forEach(it => { const w = firstDay[it.id]; if (w) { const k = w.slice(0,7); perMonth[k] = (perMonth[k]||0) + figsOf(it); } });
                const ticks = Array.from({ length:nTicks }, (_,i) => {
                  const d = new Date(earliest.getFullYear(), earliest.getMonth()+i, 1);
                  const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                  return { d, ago: monthsSpan - i, n: perMonth[k] || 0 };
                });
                const maxN = Math.max(1, ...ticks.map(t => t.n));
                const pickAt = (e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const i = Math.min(nTicks-1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * nTicks)));
                  setMirrorMonths(monthsSpan - i);
                };

                // Un volet du diptyque. Le passé est terni (sépia, désaturé), le présent est net et doré.
                const volet = (past, label, sub, figs, pct, pts) => (
                  <div style={{ padding:"14px 6px 12px", filter: past ? "sepia(0.55) saturate(0.5) brightness(0.8)" : "none" }}>
                    <div style={{ color: past ? "#a8987a" : "#e0bc5c", fontSize:"10px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>{label}</div>
                    <div style={{ color: past ? "#8a7a5e" : "#b8a27a", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"1px 0 12px" }}>{sub}</div>
                    <div className="stat-hero" style={{ color: past ? "#bca98a" : "#f4dc94", fontSize:"36px", lineHeight:1, textShadow: past ? "0 1px 3px #000" : "0 1px 3px #000, 0 0 16px #b8922a99" }}>{figs}</div>
                    <div style={{ color: past ? "#8a7a5e" : "#c8b080", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginTop:"4px" }}>PEINTES</div>
                    <div style={{ height:"3px", background:"#0008", margin:"12px 10px 5px" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background: past ? "#8a7a5a" : "#d4b060", boxShadow: past ? "none" : "0 0 6px #d4b06099" }} />
                    </div>
                    <div style={{ color: past ? "#a8987a" : "#e8d098", fontSize:"11px", fontFamily:"'Cinzel',serif" }}>{pct}% · {pts.toLocaleString('fr')} pts</div>
                  </div>
                );

                return (
                  <div style={{ backgroundColor:"#0a0806", backgroundImage:`linear-gradient(180deg, rgba(8,7,5,0.2) 0%, rgba(8,7,5,0.35) 55%, rgba(4,4,3,0.55) 100%), url(${import.meta.env.BASE_URL}fonds/parchemin.jpg)`, backgroundSize:"cover", backgroundPosition:"center", border:"1px solid #b8922a55", borderTop:"2px solid #b8922a", padding:"18px 14px 12px", textAlign:"center", textShadow:"0 1px 3px #000, 0 0 10px #000a" }}>
                    <div style={{ color:"#d4b060", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif" }}><Crescent /> &nbsp;LE MIROIR&nbsp; <Crescent flip /></div>

                    {/* 4. Phrase-titre : à qui on se compare */}
                    <div style={{ color:"#efe4c4", fontSize:"15px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"8px 0 6px" }}>
                      {effMonths === 0 ? "Choisis un moment, et regarde-toi en face." : <>Toi <b style={{ fontStyle:"normal", fontFamily:"'Cinzel',serif", color:"#f4dc94" }}>{cutoffDateTxt}</b>, face à toi aujourd'hui</>}
                    </div>

                    {/* 7. Choix rapide du moment */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center", margin:"6px 0 10px" }}>
                      {[[1, "Il y a 1 mois"], [3, "3 mois"], [6, "6 mois"], [monthsSpan + 1, "Depuis le début"]]
                        .filter(([m, lbl]) => lbl === "Depuis le début" || m <= monthsSpan)
                        .map(([m, lbl]) => (
                          <button key={lbl} onClick={() => setMirrorMonths(m)}
                            style={{ padding:"6px 10px", background: effMonths === m ? "#d4b06033" : "rgba(8,6,4,0.55)", border:`1px solid ${effMonths === m ? "#f4dc94" : "#d4b06055"}`, color: effMonths === m ? "#fff0c0" : "#d8c8a0", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"0.5px", cursor:"pointer" }}>{lbl}</button>
                        ))}
                    </div>

                    {/* 5. La progression, en grand : la réponse que donne le Miroir */}
                    <div style={{ margin:"4px 0 6px", minHeight:"58px" }}>
                      {effMonths === 0 ? null : deltaFigs > 0 ? (<>
                        <div className="stat-hero" style={{ color:"#f4dc94", fontSize:"44px", lineHeight:1, textShadow:"0 1px 3px #000, 0 0 18px #d4b06099" }}>+{deltaFigs}</div>
                        <div style={{ color:"#e8d8b0", fontSize:"13px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"4px" }}>FIGURINES PEINTES DEPUIS</div>
                        <div style={{ color:"#c8b890", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{cutoffDateTxt} · +{deltaPts.toLocaleString('fr')} pts{pastFigs === 0 ? " · rien n'était encore peint" : ""}</div>
                      </>) : (
                        <div style={{ color:"#c8b890", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", paddingTop:"14px" }}>Aucune figurine consacrée depuis {cutoffDateTxt}. Le miroir attend.</div>
                      )}
                    </div>

                    {/* Le diptyque : deux volets séparés par la ligne du miroir */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1px 1fr", alignItems:"stretch", marginTop:"10px" }}>
                      {volet(true, "ALORS", effMonths===0 ? "aujourd'hui" : cap(cutoffDateTxt), pastFigs, pastPct, pastPts)}
                      <div style={{ position:"relative", background:"linear-gradient(180deg, transparent, #d4b060bb 22%, #fff4cc 50%, #d4b060bb 78%, transparent)", boxShadow:"0 0 8px #d4b06077" }}>
                        <div style={{ position:"absolute", top:"50%", left:"50%", width:"7px", height:"7px", transform:"translate(-50%,-50%) rotate(45deg)", background:"#f4dc94", boxShadow:"0 0 10px #d4b060" }} />
                      </div>
                      {volet(false, "AUJOURD'HUI", `${nowTotalFigs} figurines`, nowFigs, nowPct, nowPts)}
                    </div>

                    <div style={{ color:"#a8987a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"10px 0 6px" }}>ou touche un mois de la frise</div>
                    {/* La frise des mois : toucher ou glisser pour choisir le moment */}
                    <div onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} pickAt(e); }}
                      onPointerMove={e => { if (e.buttons) pickAt(e); }}
                      style={{ display:"flex", alignItems:"flex-end", gap:"2px", height:"40px", padding:"0 2px", touchAction:"none", cursor:"pointer", borderBottom:"1px solid #d4b06044" }}>
                      {ticks.map((t,i) => {
                        const sel = t.ago === effMonths;
                        const walked = t.ago < effMonths; // mois entre le passé choisi et aujourd'hui
                        return (
                          <div key={i} style={{ flex:1, height:"100%", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
                            <div style={{ width:"min(14px, 70%)", height:`${5 + Math.round(t.n / maxN * 28)}px`, borderRadius:"2px 2px 0 0",
                              background: sel ? "#f4dc94" : walked ? "#d4b060bb" : "#5a4a30aa",
                              boxShadow: sel ? "0 0 10px #d4b060" : walked ? "0 0 4px #d4b06044" : "none", transition:"background 0.15s" }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", gap:"2px", padding:"0 2px", marginTop:"4px" }}>
                      {ticks.map((t,i) => (
                        <div key={i} style={{ flex:1, textAlign:"center", fontSize:"10px", fontFamily:"'Cinzel',serif", color: t.ago === effMonths ? "#f4dc94" : "#7a6a4c", whiteSpace:"nowrap", overflow:"visible" }}>
                          {(nTicks <= 14 || t.ago === effMonths) ? "JFMAMJJASOND"[t.d.getMonth()] : ""}
                          <div style={{ fontSize:"10px", opacity:0.8, minHeight:"11px" }}>{(i === 0 || t.d.getMonth() === 0) ? String(t.d.getFullYear()) : ""}</div>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => setShowMirror(false)} style={{ background:"none", border:"none", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", padding:"14px 6px 2px" }}>FERMER</button>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ── CHRONIQUES ─────────── */}
        <div style={{ padding:"0 14px", marginBottom:"14px" }}>
          <button onClick={openChronicle}
            style={{ width:"100%", padding:"12px", background:"#080604", border:"1px solid #1c1a16", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"3px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", touchAction:"manipulation" }}>
            <ScrollGlyph size={15} /> CHRONIQUES DE LA CROISADE
          </button>
          <button onClick={() => { setCardFaction(null); genCard(cardPhoto, null); }}
            style={{ width:"100%", padding:"12px", marginTop:"8px", background:"linear-gradient(135deg,#14100a,#0a0806)", border:"1px solid #b8922a55", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"3px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", touchAction:"manipulation" }}>
            <span style={{ fontSize:"14px" }}>⚜</span> CARTE DE CROISADE À PARTAGER
          </button>
          {/* Variante par armée */}
          {(() => {
            const owned = Object.entries(FACTIONS).filter(([k]) => inventory.some(i => i.faction === k));
            if (owned.length === 0) return null;
            return (
              <div style={{ marginTop:"8px" }}>
                <div style={{ color:"#c4b59a", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px", textAlign:"center" }}>OU UNE CARTE PAR ARMÉE</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"6px" }}>
                  {owned.map(([k,f]) => (
                    <button key={k} onClick={() => { setCardFaction(k); genCard(cardPhoto, k); }}
                      style={{ padding:"8px 2px", background:`${f.accent}11`, border:`1px solid ${f.accent}44`, color:f.accent, cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"11px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", touchAction:"manipulation" }}>
                      <span><FactionIcon faction={k} factionDef={f} size={16} /></span>
                      {f.short}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* Variante feuille de roster détaillée, par armée */}
          {(() => {
            const owned = Object.entries(FACTIONS).filter(([k]) => inventory.some(i => i.faction === k));
            if (owned.length === 0) return null;
            return (
              <div style={{ marginTop:"14px" }}>
                <div style={{ color:"#c4b59a", fontSize:"11px", letterSpacing:"2px", fontFamily:"'Cinzel',serif", marginBottom:"5px", textAlign:"center" }}>OU UNE FEUILLE DE ROSTER DÉTAILLÉE</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"6px" }}>
                  {owned.map(([k,f]) => (
                    <button key={k} onClick={() => genRoster(k)}
                      style={{ padding:"8px 2px", background:`${f.accent}11`, border:`1px solid ${f.accent}44`, color:f.accent, cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"11px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", touchAction:"manipulation" }}>
                      <span><FactionIcon faction={k} factionDef={f} size={16} /></span>
                      {f.short}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Modal Carte de recruteur ── */}
        {cardUrl && (
          <div onClick={() => setCardUrl(null)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:600, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"20px", gap:"14px", overflowY:"auto" }}>
            <img src={cardUrl} alt="Carte de Croisade" style={{ maxWidth:"100%", maxHeight:"70dvh", border:"1px solid #b8922a55", boxShadow:"0 8px 40px #000", flexShrink:0, marginTop:"auto" }} onClick={e => e.stopPropagation()} />
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }} onClick={e => e.stopPropagation()}>
              {cardKind === "recruteur" && (appState.parade||[]).length > 0 && (
                <button onClick={() => setCardPhotoPicker(true)}
                  style={{ padding:"11px 18px", background:"#0a080688", border:"1px solid #2a2215", color:"#d8c8ac", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"1px", cursor:"pointer" }}>▣ {cardPhoto?"CHANGER LA PHOTO":"CHOISIR UNE PHOTO"}</button>
              )}
              <a href={cardUrl} download={cardKind === "roster" ? `roster-${(FACTIONS[cardFaction]?.short||cardFaction||"armee").toLowerCase()}.png` : cardFaction ? `armee-${(FACTIONS[cardFaction]?.short||cardFaction).toLowerCase()}.png` : "ma-croisade.png"}
                style={{ padding:"11px 20px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", textDecoration:"none" }}>⬇ ENREGISTRER</a>
              <button onClick={() => { setCardUrl(null); setCardPhoto(null); }}
                style={{ padding:"11px 20px", background:"none", border:"1px solid #2a2215", color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>FERMER</button>
            </div>
            <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", maxWidth:"280px", marginBottom:"auto" }}>Enregistre l'image puis partage-la sur tes réseaux ou forums.</div>
          </div>
        )}

        {/* ── Sélecteur de photo pour la carte (photos de Parade) ── */}
        {cardPhotoPicker && (
          <div onClick={() => setCardPhotoPicker(false)} style={{ position:"fixed", inset:0, background:"#000000ee", zIndex:601, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
            <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"420px", maxHeight:"80dvh", overflowY:"auto", background:"linear-gradient(180deg,#14100a,#0a0806)", border:"1px solid #b8922a55", borderTop:"2px solid #b8922a", padding:"18px" }}>
              <div style={{ color:"#b8922a", fontSize:"11.5px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", textAlign:"center", marginBottom:"14px" }}>PHOTO DE LA CARTE</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"6px" }}>
                <button onClick={() => { setCardPhoto(null); setCardPhotoPicker(false); genCard(null, cardFaction); }}
                  style={{ aspectRatio:"1", background:"#060402", border:`1px solid ${!cardPhoto?"#b8922a":"#2a2215"}`, color:"#c8b9a0", fontSize:"12px", fontFamily:"'Cinzel',serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"4px" }}>Sans photo</button>
                {(appState.parade||[]).slice().reverse().map((p, idx) => (
                  <button key={idx} onClick={() => { setCardPhoto(p.photo); setCardPhotoPicker(false); genCard(p.photo, cardFaction); }}
                    style={{ aspectRatio:"1", padding:0, border:`2px solid ${cardPhoto===p.photo?"#b8922a":"#2a2215"}`, cursor:"pointer", overflow:"hidden", background:"#060402" }}>
                    <img src={p.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  </button>
                ))}
              </div>
              <button onClick={() => setCardPhotoPicker(false)}
                style={{ width:"100%", marginTop:"14px", padding:"10px", background:"none", border:"1px solid #2a2215", color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
            </div>
          </div>
        )}

        {/* ── VALEUR COLLECTION ─────────── */}
        {(() => {
          const collectionValue = inventory.reduce((s,i) => {
            const unit = findUnit(i.faction, i.unitId);
            return s + (unit ? (SHOP_PRICES[unit.name]||0) : 0) * (i.qty||1);
          }, 0);
          const byFaction = Object.entries(FACTIONS).map(([k,v]) => {
            const val = inventory.filter(i=>i.faction===k).reduce((s,i) => {
              const unit = findUnit(i.faction, i.unitId);
              return s + (unit ? (SHOP_PRICES[unit.name]||0) : 0) * (i.qty||1);
            }, 0);
            const count = inventory.filter(i=>i.faction===k).reduce((s,i)=>{ const u=findUnit(k, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); },0);
            return { k, v, val, count };
          }).filter(x=>x.count>0);
          return collectionValue > 0 ? (
            <div style={{ marginBottom:"20px" }}>
              <Fold id="valeur" mark="✦" title="VALEUR" summary={`${Math.round(collectionValue).toLocaleString('fr')} €`}>
              <div className="hc-bare orn" style={{ background:"rgba(10,12,8,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #2a3a1a", borderLeft:"3px solid #5a8a3a", padding:"12px 16px", marginBottom:"8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>TOTAL COLLECTION</div>
                  <div style={{ color:"#e8dfc0", fontSize:"11.5px", marginTop:"2px" }}>{inventory.reduce((s,i)=>{ const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); },0)} figurines</div>
                </div>
                <div style={{ color:"#8aba5a", fontSize:"22px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{Math.round(collectionValue).toLocaleString('fr')} €*</div>
              </div>
              {byFaction.map(({k,v,val,count}) => (
                <div key={k} className="hc-bare" style={{ background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1a1816", borderLeft:`2px solid ${v.accent}44`, padding:"8px 12px", marginBottom:"4px", display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontSize:"16px" }}>{v.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#c8b890", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{v.label}</div>
                    <div style={{ color:"#d8c8ac", fontSize:"12px", marginTop:"1px" }}>{count} figurines</div>
                  </div>
                  <span style={{ color:v.accent, fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{Math.round(val).toLocaleString('fr')} €</span>
                </div>
              ))}
              <div style={{ color:"#6a5a48", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"6px", textAlign:"center" }}>* Prix boutique officiel de référence — pas ce que tu as réellement payé (soldes, occasion, box...)</div>
              </Fold>
            </div>
          ) : null;
        })()}

        {/* ── RÉCAP WISHLIST ─────────── */}
        {(() => {
          const wl = wishlist||[];
          if (wl.length === 0) return null;
          const wanted   = wl.filter(i=>i.status==="wanted");
          const ordered  = wl.filter(i=>i.status==="ordered");
          const received = wl.filter(i=>i.status==="received");
          const toSpend = wl.filter(i=>i.status!=="received").reduce((s,i) => {
            const unit = findUnit(i.faction, i.unitId);
            return s + (i.price||(unit?SHOP_PRICES[unit.name]:0)||0) * (i.qty||1);
          }, 0);
          return (
            <div style={{ marginBottom:"20px" }}>
              <Fold id="achats" mark="✧" title="ACHATS PRÉVUS" summary={`${Math.round(toSpend).toLocaleString('fr')} €`}>
              <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
                {[
                  { label:"SOUHAITÉ", count:wanted.length,   color:"#b8922a", icon:"✦" },
                  { label:"COMMANDÉ", count:ordered.length,  color:"#4a7a9a", icon:"⟳" },
                  { label:"REÇU",     count:received.length, color:"#4a8a4a", icon:"✓" },
                ].map(s => (
                  <div key={s.label} className="hc-bare" style={{ flex:1, background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:`1px solid ${s.color}33`, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ color:s.color, fontSize:"16px", marginBottom:"3px" }}>{s.icon}</div>
                    <div style={{ color:s.color, fontSize:"18px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{s.count}</div>
                    <div style={{ color:"#d8c8ac", fontSize:"10px", letterSpacing:"1px", fontFamily:"'Cinzel',serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="hc-bare orn" style={{ background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1a1816", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ color:"#d8c8ac", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>BUDGET RESTANT</div>
                  <div style={{ color:"#d8c8ac", fontSize:"12px", marginTop:"2px" }}>hors articles déjà reçus</div>
                </div>
                <div style={{ color:"#b8922a", fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{Math.round(toSpend).toLocaleString('fr')} €</div>
              </div>
              </Fold>
            </div>
          );
        })()}

        {inventory.length===0 && (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#c8b49a" }}>
            <div style={{ opacity:0.3, marginBottom:"12px", display:"flex", justifyContent:"center" }}><NavIcon id="ironcross" size={40} color="currentColor" /></div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"3px" }}>AUCUNE DONNÉE</div>
            <div style={{ fontSize:"11.5px", marginTop:"6px", fontStyle:"italic" }}>Ajoute des figurines à ton inventaire</div>
          </div>
        )}
      </div>
    </div>
  );
}
