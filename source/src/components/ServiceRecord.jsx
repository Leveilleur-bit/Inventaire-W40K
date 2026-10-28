// ══════════════════════════════════════════════════════════
// L'ÉTAT DE SERVICE d'une relique : sa vie racontée sur un parchemin
// ══════════════════════════════════════════════════════════
// Ouvert depuis la fiche d'une figurine. Tout est tiré de ce que l'app sait déjà : achat, entrée
// au registre, baptême, Dé du Destin, serment, temps passé dans la pile, consécration, titres.
// Exportable en image (canvas), comme les cartes de STATS.
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FACTIONS } from '../data/factions.jsx';
import { PAINT_STATUS } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { localDay } from '../lib/utils.jsx';

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const longDate = (d) => {
  if (!d) return null;
  const [y, m, j] = d.split("-").map(Number);
  if (!j) return `${MOIS[m - 1]} ${y}`;
  return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${y}`;
};
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
const dayOf = (d) => !d ? null : d.length === 7 ? d + "-15" : d;   // mois seul : milieu du mois pour les durées
// Jour d'entrée au registre : l'identifiant contient l'instant de création
const addedDay = (it) => {
  const n = Number(it.id);
  if (Number.isFinite(n) && n > 1.5e15) { const d = new Date(n / 1000); if (d.getFullYear() > 2015) return localDay(d); }
  return null;
};

export function buildServiceRecord({ item, unitName, paintHistory = [], honors = [], colossus, ctx = {} }) {
  const f = FACTIONS[item.faction] || {};
  const army = ctx.listNames?.[item.faction] || f.label || "";
  const name = item.nickname || unitName;
  const entries = [];
  const bought = item.purchasedAt || null;
  const added = addedDay(item);
  if (bought) entries.push({ when: longDate(bought), label: "Acquisition", text: `Entre en possession du Chapitre${bought.length === 7 ? " au mois de " + MOIS[Number(bought.slice(5, 7)) - 1] : ""}.` });
  if (added && (!bought || added.slice(0, 7) > bought.slice(0, 7)))   // inscrite après l'achat (jamais avant : données importées)
    entries.push({ when: longDate(added), label: "Registre", text: "Inscrite au registre du Reliquaire." });
  if (item.nickname) entries.push({ label: "Baptême", text: `Reçoit le nom de « ${item.nickname} ».` });
  if (item.fateChosen) entries.push({ label: "Dé du Destin", text: "Désignée par le Dé du Destin. L'ordre fut accompli." });
  else if (ctx.fateChoice?.id === item.id) entries.push({ label: "Dé du Destin", text: "Désignée par le Dé du Destin. L'ordre est en cours." });
  const kept = (ctx.oathsKept || []).find(o => o.itemId === item.id);
  if (kept) entries.push({ when: longDate(kept.day), label: "Serment", text: kept.text ? `Serment tenu : « ${kept.text} »` : "Objet d'un serment, tenu." });
  else if (item.oathKept) entries.push({ label: "Serment", text: "Objet d'un serment, tenu." });
  else if (ctx.oath?.unitId === item.id) entries.push({ label: "Serment", text: `Objet du serment en cours${ctx.oath.label ? ` : « ${ctx.oath.label} »` : "."}` });
  const lifted = (ctx.cursesLifted || []).filter(c => c.id === item.id).slice(-1)[0];
  if (lifted) entries.push({ when: longDate(lifted.since), label: "Malédiction", text: `Frappée de malédiction, puis purifiée par le pinceau ${lifted.days > 0 ? `après ${lifted.days} jour${lifted.days > 1 ? "s" : ""}` : "le jour même"}.` });
  else if (ctx.curse?.id === item.id) entries.push({ when: longDate(ctx.curse.since), label: "Malédiction", text: `Frappée de malédiction. Degré actuel : ${ctx.curse.name}.` });
  const start = dayOf(bought) || added;
  // (la date d'achat prime : c'est elle qui dit depuis quand la relique attend)
  const hIdx = paintHistory.findIndex(h => h.id === item.id);
  const h = hIdx >= 0 ? paintHistory[hIdx] : null;
  const consecDay = h?.day || (h?.date ? h.date + "-15" : null);
  if (item.paintStatus === "painted") {
    if (start && consecDay && consecDay >= start) {
      const n = daysBetween(start, consecDay);
      entries.push({ label: "La pile", text: n <= 1 ? "Consacrée sans même passer par la pile." : `${n} jours dans la pile avant sa consécration.` });
    }
    entries.push({ when: h?.day ? longDate(h.day) : (item.paintedAt ? longDate(item.paintedAt) : null), label: "Consécration",
      text: hIdx >= 0 ? `${hIdx === 0 ? "Première" : (hIdx + 1) + "ᵉ"} consécration du registre.` : "Consacrée." });
  } else {
    const st = PAINT_STATUS[item.paintStatus] || PAINT_STATUS.unpainted;
    const n = start ? daysBetween(start, localDay()) : null;
    entries.push({ label: "La pile", text: `${st.label}${n != null && n > 0 ? `, en attente depuis ${n} jours` : ""}. Sa consécration reste à venir.` });
  }
  if (colossus) entries.push({ label: "Colosse", text: "Classée parmi les colosses de la collection." });
  if (honors.length) entries.push({ label: "Titres", text: honors.map(x => x.label).join(" · ") + "." });
  const footer = item.paintStatus === "painted" ? `En service actif dans l'armée ${army}.` : `Attend son heure dans l'armée ${army}.`;
  return { name, unitName, nickname: item.nickname || null, army, faction: item.faction, accent: f.accent || "#b8922a", entries, footer };
}

// ── Image partageable ──
async function renderImage(rec, photo) {
  const FT = "'Cinzel', Georgia, serif", FB = "'Crimson Pro', Georgia, serif";
  try { await Promise.all(["bold 54px Cinzel", "24px Cinzel", "italic 30px 'Crimson Pro'"].map(f => document.fonts.load(f))); } catch {}
  const load = (src) => new Promise(res => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const [parch, ph] = await Promise.all([load(`${import.meta.env.BASE_URL}fonds/parchemin.jpg`), load(photo)]);
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  const spaced = (px) => { try { x.letterSpacing = px; } catch {} };
  x.fillStyle = "#0a0806"; x.fillRect(0, 0, W, H);
  if (parch) { const r = Math.max(W / parch.width, H / parch.height); const sw = W / r, sh = H / r; x.drawImage(parch, (parch.width - sw) / 2, (parch.height - sh) / 2, sw, sh, 0, 0, W, H); }
  const veil = x.createLinearGradient(0, 0, 0, H); veil.addColorStop(0, "rgba(8,6,4,0.62)"); veil.addColorStop(1, "rgba(4,3,2,0.82)");
  x.fillStyle = veil; x.fillRect(0, 0, W, H);
  let y = 60;
  if (ph) {
    const bh = 380, r = Math.max((W - 120) / ph.width, bh / ph.height), sw = (W - 120) / r, sh = bh / r;
    x.drawImage(ph, (ph.width - sw) / 2, (ph.height - sh) / 2, sw, sh, 60, 60, W - 120, bh);
    x.strokeStyle = rec.accent; x.lineWidth = 2; x.strokeRect(60, 60, W - 120, bh);
    y = 60 + bh + 50;
  } else y = 110;
  x.strokeStyle = "#b8922a"; x.lineWidth = 3; x.strokeRect(30, 30, W - 60, H - 60);
  x.textAlign = "center";
  x.fillStyle = "#b8922a"; x.font = `24px ${FT}`; spaced("8px"); x.fillText("ÉTAT DE SERVICE", W / 2, y); spaced("0px");
  y += 62; x.fillStyle = "#f0e4c0"; x.font = `bold 50px ${FT}`;
  const title = rec.nickname ? `« ${rec.nickname} »` : rec.unitName;
  x.fillText(title.length > 30 ? title.slice(0, 29) + "…" : title, W / 2, y);
  y += 44; x.fillStyle = rec.accent; x.font = `italic 30px ${FB}`;
  x.fillText(`${rec.nickname ? rec.unitName + " · " : ""}${rec.army}`, W / 2, y);
  y += 30; x.strokeStyle = "#b8922a77"; x.lineWidth = 1; x.beginPath(); x.moveTo(W / 2 - 160, y); x.lineTo(W / 2 + 160, y); x.stroke();
  y += 50;
  // Lignes de la vie de la relique
  x.textAlign = "left";
  const wrap = (txt, maxW) => { const out = []; let line = ""; txt.split(" ").forEach(w => { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; };
  for (const e of rec.entries) {
    if (y > H - 170) break;
    x.fillStyle = "#b8922a"; x.font = `22px ${FT}`; spaced("3px");
    x.fillText((e.label + (e.when ? " · " + e.when : "")).toUpperCase(), 100, y); spaced("0px");
    y += 38; x.fillStyle = "#e0d4b4"; x.font = `italic 30px ${FB}`;
    for (const l of wrap(e.text, W - 200)) { x.fillText(l, 100, y); y += 38; }
    y += 18;
  }
  x.textAlign = "center"; x.fillStyle = "#c8b48a"; x.font = `italic 30px ${FB}`;
  x.fillText(rec.footer, W / 2, H - 92);
  x.fillStyle = "#8a7a58"; x.font = `18px ${FT}`; spaced("6px"); x.fillText("RELIQUAIRE", W / 2, H - 54); spaced("0px");
  return cv.toDataURL("image/png");
}

export function ServiceRecordModal({ rec, photo, onClose }) {
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false);
  useBackButton(true, onClose);
  useBackButton(!!img, React.useCallback(() => setImg(null), []));
  const fileName = `etat-de-service-${(rec.nickname || rec.unitName).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;
  return createPortal(
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:520, background:"#000000e0", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", overflowY:"auto" }}>
      {img ? (
        <div onClick={e => e.stopPropagation()} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px", maxWidth:"430px", width:"100%" }}>
          <img src={img} alt="État de service" style={{ maxWidth:"100%", maxHeight:"70dvh", border:"1px solid #b8922a55", boxShadow:"0 8px 40px #000" }} />
          <div style={{ display:"flex", gap:"10px" }}>
            <a href={img} download={fileName} style={{ padding:"11px 20px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", textDecoration:"none" }}>⬇ ENREGISTRER</a>
            <button onClick={() => setImg(null)} style={{ padding:"11px 20px", background:"none", border:"1px solid #2a2215", color:"#8a7a58", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>RETOUR</button>
          </div>
        </div>
      ) : (
        <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"430px", maxHeight:"88dvh", overflowY:"auto", animation:"splashIn 0.28s ease both",
          backgroundColor:"#0a0806", backgroundImage:`linear-gradient(180deg, rgba(10,8,6,0.72) 0%, rgba(8,6,4,0.86) 100%), url(${import.meta.env.BASE_URL}fonds/parchemin.jpg)`, backgroundSize:"cover", backgroundPosition:"center",
          border:"1px solid #b8922a66", borderTop:`3px solid ${rec.accent}`, padding:"18px 18px 16px", boxShadow:"inset 0 0 30px #000c" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif" }}>ÉTAT DE SERVICE</div>
            <div style={{ color:"#f0e4c0", fontSize:"20px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginTop:"6px", lineHeight:1.2 }}>{rec.nickname ? `« ${rec.nickname} »` : rec.unitName}</div>
            <div style={{ color:rec.accent, fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"3px" }}>{rec.nickname ? rec.unitName + " · " : ""}{rec.army}</div>
            <div style={{ width:"120px", height:"1px", background:"#b8922a66", margin:"12px auto 14px" }} />
          </div>
          {rec.entries.map((e, k) => (
            <div key={k} style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
              <div style={{ width:"10px", display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, paddingTop:"4px" }}>
                <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#b8922a", boxShadow:"0 0 6px #b8922a88" }} />
                {k < rec.entries.length - 1 && <span style={{ flex:1, width:"1px", background:"#b8922a44", marginTop:"4px" }} />}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#b8922a", fontSize:"10.5px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>{e.label.toUpperCase()}{e.when ? <span style={{ color:"#9a8a6a" }}> · {e.when}</span> : null}</div>
                <div style={{ color:"#e0d4b4", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.45, marginTop:"2px" }}>{e.text}</div>
              </div>
            </div>
          ))}
          <div style={{ color:"#c8b48a", fontSize:"13.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", textAlign:"center", margin:"6px 0 14px" }}>{rec.footer}</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={onClose} style={{ flex:1, padding:"11px", background:"none", border:"1px solid #2a2215", color:"#9a8a6a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>FERMER</button>
            <button disabled={busy} onClick={async () => { setBusy(true); try { setImg(await renderImage(rec, photo)); } finally { setBusy(false); } }}
              style={{ flex:1, padding:"11px", background:"#b8922a22", border:"1px solid #b8922a", color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>{busy ? "…" : "▣ EN IMAGE"}</button>
          </div>
        </div>
      )}
    </div>, document.body);
}
