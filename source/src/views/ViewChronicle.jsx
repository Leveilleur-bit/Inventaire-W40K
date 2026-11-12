import React, { useState } from 'react';
import { ScrollGlyph } from '../components/ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { findUnit } from '../data/units.jsx';
import { POINTS_DB, getModelCount } from '../data/points.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { isColossus } from '../lib/colossus.jsx';

// ══════════════════════════════════════════════════════════
// LE LIVRE DE LA CROISADE (Chroniques)
// ══════════════════════════════════════════════════════════
// Chaque mois devient un chapitre raconté à partir de ce qui s'est réellement passé.
// La liste détaillée des événements reste disponible sous chaque chapitre.

const ROMAN = (n) => { const t=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let r=""; for (const [v,s] of t) while (n>=v) { r+=s; n-=v; } return r; };
const NUM = ["zéro","une","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze"];
const nb = (n, fem=true) => n <= 12 ? (fem ? NUM[n] : (n===1 ? "un" : NUM[n])) : String(n);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// « de » devant un nom : du Dévoreur, de la Ruche, des Lames, de l'Ost, d'Ignis, de Sire Gaston
const deName = (n) => /^Le /.test(n) ? "du " + n.slice(3) : /^La /.test(n) ? "de la " + n.slice(3) : /^Les /.test(n) ? "des " + n.slice(4) : /^L['’]/.test(n) ? "de l'" + n.slice(2) : /^[AEIOUYÉÈÊH]/i.test(n) ? "d'" + n : "de " + n;
const list = (arr) => arr.length <= 1 ? (arr[0]||"") : arr.slice(0,-1).join(", ") + " et " + arr[arr.length-1];

export function ViewChronicle({ inventory, paintHistory, ptsMap, promotions = [], oathsKept = [], listNames = {}, onClose }) {
  const [openDetail, setOpenDetail] = useState({});
  useBackButton(true, onClose);
  const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

  // Construire les événements
  const events = [];
  // 1. Figurines peintes
  (paintHistory||[]).forEach((h, idx) => {
    const it = inventory.find(i => i.id === h.id);
    if (!it) return;
    const u = findUnit(it.faction, it.unitId);
    events.push({
      when: h.day || (h.date + "-15"),
      precise: !!h.day,
      type: "paint",
      faction: it.faction,
      title: u?.name || it.unitId,
      sub: it.nickname ? `« ${it.nickname} »` : null,
      rank: idx + 1,
      photo: it.photo,
    });
  });
  // 2. Fondations d'armée (1ère peinture de chaque faction)
  const seen = new Set();
  events.slice().sort((a,b) => a.when.localeCompare(b.when)).forEach(e => {
    if (e.type === "paint" && !seen.has(e.faction)) {
      seen.add(e.faction);
      events.push({ when: e.when, precise: e.precise, type: "founding", faction: e.faction, title: `Croisade ${FACTIONS[e.faction]?.label} inaugurée` });
    }
  });
  // 3. Acquisitions datées
  inventory.filter(i => i.purchasedAt).forEach(i => {
    const u = findUnit(i.faction, i.unitId);
    events.push({ when: i.purchasedAt + "-01", precise: false, type: "buy", faction: i.faction, title: u?.name || i.unitId });
  });

  events.sort((a,b) => b.when.localeCompare(a.when));

  // Grouper par mois
  const groups = {};
  events.forEach(e => {
    const k = e.when.slice(0,7);
    (groups[k] = groups[k] || []).push(e);
  });
  const keys = Object.keys(groups).sort((a,b) => b.localeCompare(a));

  // ── Chapitres ──
  const armyName = (f) => listNames[f] || FACTIONS[f]?.label || f;
  const figsOf = (it) => getModelCount(findUnit(it.faction, it.unitId)?.name, it.qty||1, it.modelCount);
  const unitPts = (it) => (ptsMap?.[`${it.faction}:${it.unitId}`] || POINTS_DB[findUnit(it.faction, it.unitId)?.name] || 0);
  const byId = new Map(inventory.map(i => [i.id, i]));
  const chapterOf = {};
  let prevTitle = null;
  [...keys].sort().forEach((k, idx) => {
    const ev = groups[k];
    const paintedItems = []; const seenIds = new Set();
    (paintHistory||[]).forEach(h => { const d = h.day || (h.date ? h.date + "-15" : ""); if (d.slice(0,7) === k && !seenIds.has(h.id) && byId.get(h.id)) { seenIds.add(h.id); paintedItems.push(byId.get(h.id)); } });
    const models = paintedItems.reduce((acc, it) => acc + figsOf(it), 0);
    const perFaction = {}; paintedItems.forEach(it => { perFaction[it.faction] = (perFaction[it.faction]||0) + figsOf(it); });
    const facs = Object.entries(perFaction).sort((a,b) => b[1]-a[1]);
    const foundings = ev.filter(e => e.type === "founding").map(e => e.faction);
    const buys = ev.filter(e => e.type === "buy").length;
    const big = paintedItems.filter(it => isColossus(it, ptsMap || {})).sort((a,b) => unitPts(b)-unitPts(a)).slice(0,2);
    const named = paintedItems.filter(it => it.nickname).slice(0,2);
    const promos = promotions.filter(p => (p.day||"").slice(0,7) === k);

    const nameOf = (it) => it.nickname || findUnit(it.faction, it.unitId)?.name || "une relique";
    const r = paintedItems.length;
    // Promotions et serments : une seule fois chacun (l'historique peut contenir des doublons)
    const promoBy = {}; promos.forEach(p => { promoBy[p.faction] = p; });
    const promoList = Object.values(promoBy);
    const oathSeen = new Set();
    const oaths = oathsKept.filter(o => (o.day||"").slice(0,7) === k && !oathSeen.has(o.itemId ?? o.text) && oathSeen.add(o.itemId ?? o.text));

    // Titre : l'événement le plus marquant, sans répéter le titre du chapitre précédent
    const candidates = [];
    if (foundings.length && idx === 0) candidates.push("La fondation");
    if (big[0]) candidates.push(`Le réveil ${deName(nameOf(big[0]))}`);
    if (promoList[0]) candidates.push(`L'élévation ${deName(armyName(promoList[0].faction))}`);
    if (oaths.length) candidates.push("Le serment tenu");
    if (models >= 10) candidates.push("La grande consécration");
    if (facs[0]) candidates.push(`Sous la bannière ${deName(armyName(facs[0][0]))}`);
    if (buys) candidates.push("Le mois des acquisitions");
    candidates.push("Un mois de veille");
    const title = candidates.find(t => t !== prevTitle) || candidates[0];
    prevTitle = title;

    // Récit
    const S = [];
    const bigSet = new Set(big.map(it => it.id));
    const ptsTxt = (it) => `${unitPts(it).toLocaleString("fr")} points`;
    if (r === 0) {
      S.push(buys ? `Aucune relique ne fut consacrée ce mois-là, mais ${buys > 1 ? nb(buys) + " nouvelles reliques rejoignirent" : "une nouvelle relique rejoignit"} l'arsenal.` : "Aucune relique ne fut consacrée ce mois-là. Les pinceaux attendirent leur heure.");
    } else if (r === 1) {
      const it = paintedItems[0];
      S.push(bigSet.has(it.id)
        ? `Une seule relique fut consacrée ce mois-là, mais quelle relique : ${nameOf(it)}, colosse de ${ptsTxt(it)}.`
        : `Une seule relique fut consacrée ce mois-là : ${nameOf(it)}${models > 1 ? `, soit ${nb(models)} figurines` : ""}.`);
    } else if (r <= 3) {
      S.push(`${cap(nb(r))} reliques furent consacrées ce mois-là${models > r ? `, soit ${nb(models)} figurines` : ""}.`);
      const others = paintedItems.filter(it => it.id !== big[0]?.id).map(nameOf);
      S.push(big[0] ? `En tête, ${nameOf(big[0])}, colosse de ${ptsTxt(big[0])}, accompagné de ${list(others)}.` : `Au registre : ${list(others)}.`);
    } else {
      S.push(`${cap(nb(models))} figurines furent consacrées ce mois-là.`);
      if (facs.length === 1) S.push(`Toutes portaient les couleurs de ${armyName(facs[0][0])}.`);
      else {
        const [lead, ...rest] = facs;
        const others = rest.map(([f, n], j) => `${armyName(f)} ${j === 0 ? "en ajouta " : ""}${nb(n)}`);
        S.push(`${armyName(lead[0])} porta l'essentiel de l'effort avec ${nb(lead[1])} d'entre elles ; ${list(others)}.`);
      }
    }
    // Colosses (déjà nommés si c'était la seule relique)
    big.forEach((it, j) => {
      if (r <= 3 && j === 0) return;   // déjà nommé dans la phrase d'ouverture
      S.push(j === 0 ? `La plus imposante fut ${nameOf(it)}, colosse de ${ptsTxt(it)}.` : `${nameOf(it)} suivit de près, colosse de ${ptsTxt(it)}.`);
    });
    // Serments tenus (dits juste après le colosse quand c'est lui)
    oaths.forEach(o => {
      const it = byId.get(o.itemId);
      if (it && bigSet.has(it.id)) S.push(`Le serment prêté sur ce colosse fut ainsi tenu.`);
      else S.push(it ? `Le serment prêté sur ${nameOf(it)} fut tenu.` : "Un serment de Croisade fut tenu.");
    });
    foundings.forEach(f => S.push(`${armyName(f)} ouvrit sa croisade : première relique consacrée sous sa bannière.`));
    promoList.forEach(p => S.push(`${armyName(p.faction)} s'éleva au rang de ${p.to}.`));
    named.filter(it => !bigSet.has(it.id) && r > 3).forEach(it => S.push(`${findUnit(it.faction, it.unitId)?.name} y reçut le nom de « ${it.nickname} ».`));
    if (buys && r) S.push(`${buys > 1 ? cap(nb(buys)) + " nouvelles reliques rejoignirent" : "Une nouvelle relique rejoignit"} l'arsenal.`);
    chapterOf[k] = { num: ROMAN(idx + 1), title, text: S.join(" ") };
  });

  const ICONS = { paint:"◈", founding:"⚔", buy:"▢" };
  const LABELS = { paint:"Consacré", founding:"Fondation", buy:"Acquis" };

  return (
    <div style={{ position:"fixed", inset:0, background:"#020202", zIndex:350, display:"flex", flexDirection:"column", maxWidth:"430px", margin:"0 auto" }}>
      <div style={{ background:"linear-gradient(180deg,#0a0808 0%,#050505 100%)", borderBottom:"1px solid #0d0b08", padding:"14px 16px 12px", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#c8b9a0", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", marginBottom:"6px", padding:0 }}>← RETOUR</button>
        <div style={{ color:"#b3a48c", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>ARCHIVES DU CODEX</div>
        <div style={{ color:"#e8dfc0", fontSize:"22px", fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:"900", letterSpacing:"2px" }}>LE LIVRE DE LA CROISADE</div>
        <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginTop:"3px" }}>{keys.length} CHAPITRE{keys.length>1?"S":""} · {events.length} ÉVÉNEMENTS</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 14px 30px" }}>
        {!events.length && (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"#9a8a6a" }}>
            <div style={{ marginBottom:"10px" }}><ScrollGlyph size={30} /></div>
            <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:"13px", fontStyle:"italic" }}>Les archives sont vierges. Peins ta première relique pour ouvrir les chroniques.</div>
          </div>
        )}
        {keys.map(k => {
          const [y,m] = k.split("-");
          return (
            <div key={k} style={{ marginBottom:"16px" }}>
              <div className="enlum" style={{ color:"#9a7a4a", marginBottom:"8px" }}>
                <span className="enlum-mark">✦</span>
                <span style={{ fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap", textTransform:"uppercase" }}>{MONTHS[parseInt(m)-1]} {y}</span>
                <span className="enlum-mark">✦</span>
              </div>
              {chapterOf[k] && (
                <div style={{ background:"linear-gradient(180deg,#0e0b07 0%,#080604 100%)", border:"1px solid #2a2418", borderLeft:"2px solid #b8922a", padding:"12px 14px", marginBottom:"6px" }}>
                  <div style={{ color:"#d4b060", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px" }}>CHAPITRE {chapterOf[k].num} — {chapterOf[k].title.toUpperCase()}</div>
                  <div style={{ color:"#e0d4b4", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.55, marginTop:"6px" }}>{chapterOf[k].text}</div>
                  <button onClick={() => setOpenDetail(o => ({ ...o, [k]: !o[k] }))}
                    style={{ background:"none", border:"none", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"2px", padding:"8px 0 0", cursor:"pointer" }}>
                    {openDetail[k] ? "▾" : "▸"} DÉTAIL · {groups[k].length} ÉVÉNEMENT{groups[k].length>1?"S":""}
                  </button>
                </div>
              )}
              {openDetail[k] && groups[k].map((e, i) => {
                const f = FACTIONS[e.faction];
                return (
                  <div key={i} style={{ display:"flex", gap:"10px", padding:"7px 10px", background:"#080604", border:"1px solid #0d0b08", borderLeft:`2px solid ${f?.accent||"#333"}`, marginBottom:"4px", alignItems:"center" }}>
                    {e.photo
                      ? <img src={e.photo} style={{ width:"30px", height:"30px", objectFit:"cover", flexShrink:0 }} />
                      : <div style={{ width:"30px", height:"30px", background:"#050302", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>{ICONS[e.type]}</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#e8dfc0", fontSize:"12.5px", fontFamily:"'Cinzel',serif", lineHeight:1.3 }}>{e.title}</div>
                      <div style={{ display:"flex", gap:"6px", alignItems:"baseline", marginTop:"1px" }}>
                        <span style={{ color:f?.accent, fontSize:"11px", fontFamily:"'Cinzel',serif" }}>{LABELS[e.type]}</span>
                        {e.sub && <span style={{ color:"#c8b9a0", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>{e.sub}</span>}
                        {e.rank && <span style={{ color:"#8a7a5e", fontSize:"11px", fontFamily:"'Cinzel',serif" }}>#{e.rank}</span>}
                      </div>
                    </div>
                    <div style={{ color:"#8a7a5e", fontSize:"11px", fontFamily:"'Cinzel',serif", flexShrink:0 }}>{e.precise ? e.when.slice(8,10) : "—"}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
