import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FACTIONS } from '../data/factions.jsx';
import { findUnit } from '../data/units.jsx';
import { ADVENT_STORY, ADVENT_TITLE, adventText } from '../data/advent.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { localDay } from '../lib/utils.jsx';
import { playSfx } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// CALENDRIER DE L'AVENT (Accueil, mois de décembre)
// ══════════════════════════════════════════════════════════
// 24 portes, une par jour du 1er au 24 décembre. Une porte du jour ou d'un jour passé s'ouvre
// d'un toucher (rattrapage permis tout le mois) ; une porte ouverte se relit à volonté.
// Derrière chaque porte, un épisode du feuilleton « La Veille du Reliquaire » (data/advent.jsx),
// avec l'armée principale en héros. Les noms sont figés à la première porte ouverte.
// État : appState.advent = { year, army, hero, opened: { "1": "2026-12-01", ... } }.
// Les 24 portes ouvertes ajoutent l'année à appState.adventDone (trophée « Veilleur de l'Avent »).

const gold = "#b8922a";

// Armée principale (le plus de figurines) et son héros (surnom d'un personnage peint, sinon son nom)
export function adventCast(inventory, listNames) {
  const count = {};
  (inventory || []).forEach(i => { count[i.faction] = (count[i.faction] || 0) + (i.qty || 1); });
  const f = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  if (!f) return { army: "l'Imperium", hero: "le chef de guerre", faction: null };
  const army = (listNames || {})[f] || FACTIONS[f]?.label || "l'Imperium";
  const chars = (inventory || []).filter(i => i.faction === f && i.paintStatus === "painted").map(i => ({ i, u: findUnit(f, i.unitId) }))
    .filter(x => x.u && (x.u.role === "QG" || x.u.role === "Seigneur de guerre"));
  const named = chars.find(x => x.i.nickname);
  const hero = named ? named.i.nickname : chars[0] ? chars[0].u.name : "le chef de guerre";
  return { army, hero, faction: f };
}

export function AdventCard({ appState, inventory, listNames, onSetAdvent }) {
  const [reading, setReading] = useState(null);   // numéro de la nuit affichée
  useBackButton(reading != null, React.useCallback(() => setReading(null), []));
  const today = localDay();
  const [y, m, d] = today.split("-").map(Number);
  if (m !== 12) return null;

  const adv = appState.advent?.year === y ? appState.advent : null;
  const opened = adv?.opened || {};
  const cast = adv ? { army: adv.army, hero: adv.hero } : adventCast(inventory, listNames);
  const nOpened = Object.keys(opened).length;
  const accent = FACTIONS[adventCast(inventory, listNames).faction]?.accent || gold;

  const open = (n) => {
    if (opened[n]) { playSfx("carte", 0.35, null); setReading(n); return; }
    if (n > d) return;                                  // porte d'un jour à venir : scellée
    const nextOpened = { ...opened, [n]: today };
    const done = Object.keys(nextOpened).length >= 24;
    onSetAdvent(s => ({
      ...s,
      advent: { year: y, army: cast.army, hero: cast.hero, opened: nextOpened },
      adventDone: done && !(s.adventDone || []).includes(y) ? [...(s.adventDone || []), y] : (s.adventDone || []),
    }));
    playSfx(n === 24 ? "celebration" : "sceau", 0.5, null);
    setReading(n);
  };

  const ep = reading != null ? adventText(reading - 1, cast) : null;
  const openedList = Object.keys(opened).map(Number).sort((a, b) => a - b);
  const prev = reading != null ? [...openedList].reverse().find(n => n < reading) : null;
  const next = reading != null ? openedList.find(n => n > reading) : null;

  return (
    <>
      <style>{`@keyframes adventGlow { 0%,100% { box-shadow:0 0 0 0 ${accent}00, inset 0 0 6px ${accent}55; } 50% { box-shadow:0 0 10px 1px ${accent}88, inset 0 0 10px ${accent}88; } }`}</style>
      <div className="hc-bare orn" style={{ background:"#08060488", border:"1px solid #1c1a1699", borderLeft:`3px solid ${accent}`, padding:"12px 14px", marginBottom:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
          <span style={{ color:gold, fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>CALENDRIER DE L'AVENT</span>
          <span style={{ color:"#c8a23a", fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{nOpened}/24</span>
        </div>
        <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Crimson Pro',Georgia,serif", fontStyle:"italic", margin:"3px 0 10px" }}>
          {ADVENT_TITLE}, un épisode par nuit jusqu'à l'Ascension.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"5px" }}>
          {ADVENT_STORY.map((_, k) => {
            const n = k + 1, isOpen = !!opened[n], avail = !isOpen && n <= d, last = n === 24;
            return (
              <button key={n} onClick={() => open(n)} disabled={!isOpen && !avail} aria-label={`Porte ${n}`}
                style={{ aspectRatio:"3 / 4", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1px",
                  background: isOpen ? "rgba(184,146,42,0.10)" : avail ? "rgba(20,14,8,0.85)" : "rgba(6,5,4,0.6)",
                  border:`1px solid ${isOpen ? gold + "88" : avail ? accent : "#221c14"}`, borderRadius: last ? "10px 10px 2px 2px" : "8px 8px 2px 2px",
                  color: isOpen ? "#8a7a58" : avail ? "#f0dca0" : "#3a3226", fontFamily:"'Cinzel',serif", fontSize: last ? "16px" : "14px", fontWeight: last ? 700 : 400,
                  cursor: isOpen || avail ? "pointer" : "default", touchAction:"manipulation", padding:0,
                  animation: avail ? "adventGlow 2.4s ease-in-out infinite" : "none" }}>
                <span>{n}</span>
                <span style={{ fontSize:"9px", opacity: isOpen ? 0.9 : 0.6 }}>{isOpen ? "✠" : avail ? "◆" : "·"}</span>
              </button>
            );
          })}
        </div>
        {d > 24 && nOpened < 24 && <div style={{ color:"#9a8a6a", fontStyle:"italic", fontSize:"12.5px", marginTop:"8px", fontFamily:"'Crimson Pro',serif" }}>Les portes oubliées restent ouvertes jusqu'au 31 décembre.</div>}
      </div>

      {ep && createPortal(
        <div onClick={() => setReading(null)} style={{ position:"fixed", inset:0, zIndex:460, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:"18px", animation:"viewFade 0.3s ease both" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"420px", maxHeight:"88dvh", overflowY:"auto", background:"linear-gradient(180deg,#140f09 0%,#080605 100%)",
            border:`1px solid ${reading === 24 ? "#e0c060" : gold + "99"}`, boxShadow: reading === 24 ? "0 0 40px #b8922a55" : "0 10px 40px #000", padding:"20px 18px 16px", boxSizing:"border-box" }}>
            <div style={{ textAlign:"center", fontSize: reading === 24 ? "34px" : "26px", color:"#e0c060", animation:"sealStamp 0.7s ease both" }}>{reading === 24 ? "✵" : "✠"}</div>
            <div style={{ textAlign:"center", color:gold, fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"3px", marginTop:"6px" }}>
              {reading === 24 ? "NUIT DE L'ASCENSION" : `NUIT ${reading} SUR 24`}
            </div>
            <div style={{ textAlign:"center", color:"#f4e4b0", fontFamily:"'Cinzel',serif", fontSize:"18px", margin:"4px 0 12px" }}>{ep.title}</div>
            <div className="lettrine" style={{ color:"#e0d4b4", fontFamily:"'Crimson Pro',Georgia,serif", fontSize:"16px", lineHeight:1.6 }}>{ep.text}</div>
            {reading === 24 && (
              <div style={{ textAlign:"center", color:"#c8a23a", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", marginTop:"14px" }}>
                ✦ FIN DE {ADVENT_TITLE.toUpperCase()} ✦
                {nOpened >= 24 && <div style={{ color:"#9a8a6a", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", fontSize:"13px", letterSpacing:0, marginTop:"4px" }}>Les vingt-quatre portes sont ouvertes : le trophée « Veilleur de l'Avent » est à toi.</div>}
                {nOpened < 24 && <div style={{ color:"#9a8a6a", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", fontSize:"13px", letterSpacing:0, marginTop:"4px" }}>Ouvre les portes oubliées avant le 31 décembre pour gagner le trophée.</div>}
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"16px", gap:"8px" }}>
              <button onClick={() => prev && setReading(prev)} disabled={!prev} style={{ visibility: prev ? "visible" : "hidden", background:"none", border:"none", color: prev ? "#c8a23a" : "#3a3226", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor: prev ? "pointer" : "default" }}>‹ NUIT {prev || ""}</button>
              <button onClick={() => setReading(null)} style={{ background:"none", border:`1px solid ${gold}88`, color:"#e0c060", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", padding:"7px 14px", cursor:"pointer" }}>REFERMER</button>
              <button onClick={() => next && setReading(next)} disabled={!next} style={{ visibility: next ? "visible" : "hidden", background:"none", border:"none", color: next ? "#c8a23a" : "#3a3226", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", cursor: next ? "pointer" : "default" }}>NUIT {next || ""} ›</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
