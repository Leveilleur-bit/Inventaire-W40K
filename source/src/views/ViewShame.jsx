import React, { useState } from 'react';
import { CURSE_COLOR, CURSE_LEVELS, activeCurse, curseFilter } from '../lib/curse.jsx';
import { FactionIcon, NavIcon } from '../components/heraldry.jsx';
import { EmptyState, Thumb, pageFond, pageStyle } from '../components/ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { getModelCount } from '../data/points.jsx';
import { PAINT_STATUS, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { localDay } from '../lib/utils.jsx';
import { enrolDaysLeft } from '../lib/trophies.jsx';
import { playSfx, vibrate } from '../lib/sfx.jsx';
import { colossusCount } from '../lib/colossus.jsx';

// ══════════════════════════════════════════════════════════
export function ViewShame({ onSwearOathOn, inventory, appState, onSetFate, onUpdatePaint, onUpdatePurchased, confirm, paintPct, paintHistory, onOpenInInventory, onSetFateRollDay }) {
  const [factionFilter, setFactionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("statut");
  const [dateItem, setDateItem] = useState(null);
  const [dateVal, setDateVal] = useState("");
  useBackButton(!!dateItem, React.useCallback(() => setDateItem(null), []));
  const [fate, setFate] = useState(null);
  const [fateAccepted, setFateAccepted] = useState(null);
  const [rolling, setRolling] = useState(false);
  useBackButton(!!fate, React.useCallback(() => setFate(null), []));
  useBackButton(!!fateAccepted, React.useCallback(() => setFateAccepted(null), []));
  const worstIds = React.useMemo(() => {
    const dated = inventory.filter(i => i.paintStatus !== "painted" && i.purchasedAt);
    dated.sort((a,b) => a.purchasedAt.localeCompare(b.purchasedAt));
    return new Set(dated.slice(0,3).map(i => i.id));
  }, [inventory]);
  const monthsSince = (ym) => {
    if (!ym) return null;
    const [y,m] = ym.split("-").map(Number);
    const now = new Date();
    return Math.max(0, (now.getFullYear()-y)*12 + (now.getMonth()+1-m));
  };

  const STATUS_ORDER = { sprue: 0, unpainted: 1, primed: 2, wip: 3 };
  const STATUS_LABEL = { sprue: "Sur grappe", unpainted: "Monté", primed: "Apprêté", wip: "En cours" };

  const unpainted = inventory
    .filter(i => i.paintStatus !== "painted")
    .map(i => {
      const f = FACTIONS[i.faction];
      const unit = findUnit(i.faction, i.unitId);
      const figs = getModelCount(unit?.name, i.qty||1, i.modelCount);
      return { ...i, f, unit, figs };
    })
    .filter(i => i.unit)
    .filter(i => factionFilter === "all" || i.faction === factionFilter)
    .sort((a, b) => {
      if (sortBy === "statut") return (STATUS_ORDER[a.paintStatus]||0) - (STATUS_ORDER[b.paintStatus]||0);
      if (sortBy === "faction") return a.faction.localeCompare(b.faction);
      if (sortBy === "age") {
        if (a.purchasedAt && b.purchasedAt) return a.purchasedAt.localeCompare(b.purchasedAt);
        if (a.purchasedAt) return -1;
        if (b.purchasedAt) return 1;
        return 0;
      }
      return 0;
    });

  // Compteurs par statut
  const countByStatus = inventory.filter(i=>i.paintStatus!=="painted").reduce((s,i) => {
    const k = i.paintStatus || "unpainted";
    const u = findUnit(i.faction, i.unitId);
    s[k] = (s[k]||0) + getModelCount(u?.name, i.qty||1, i.modelCount);
    return s;
  }, {});
  const totalFigs = inventory.filter(i=>i.paintStatus!=="painted").reduce((s,i) => {
    const unit = findUnit(i.faction, i.unitId);
    return s + getModelCount(unit?.name, i.qty||1, i.modelCount);
  }, 0);

  const factions = ["all", ...Array.from(new Set(inventory.filter(i=>i.paintStatus!=="painted").map(i=>i.faction)))];

  return (
    <div style={{...pageStyle, ...pageFond("shame")}} className="bg-shame">
      {/* Header */}
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"14px 16px 12px", flexShrink:0 }}>   {/* voile léger : le fond de SHAME transparaît (avant : noir opaque) */}
        <div style={{ color:"#c22525", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", marginBottom:"3px" }}>À PEINDRE</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
            <span style={{ color:"#bd2828", flexShrink:0 }}><NavIcon id="tarotdeath" size={26} color="currentColor" /></span>
            <div style={{ color:"#e8dfc0", fontSize:"18px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700" }}>PILE OF SHAME</div>
          </div>
          {(() => {
            const pool = inventory.filter(i => i.paintStatus !== "painted");
            if (!pool.length) return null;
            const today = localDay();
            const alreadyRolledToday = appState.lastFateRollDay === today;
            // Un ordre encore à peindre est en cours : on ne relance pas le dé par-dessus
            // (il suffit de le peindre, ou d'y renoncer depuis la carte de l'ordre).
            const fcItem = appState.fateChoice && inventory.find(i => i.id === appState.fateChoice.id);
            if (fcItem && fcItem.paintStatus !== "painted") {
              return (
                <div style={{ background:"#0a08065a", border:"1px solid #3a3020", color:"#9a8a6a", padding:"9px 14px", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"1px", display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"14px", opacity:0.7 }}>⚄</span> ORDRE EN COURS
                </div>
              );
            }
            if (alreadyRolledToday) {
              return (
                <div style={{ background:"#0a08065a", border:"1px solid #2a2215", color:"#7a6a58", padding:"9px 14px", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"1px", display:"flex", alignItems:"center", gap:"7px", whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:"14px", opacity:0.6 }}>⚄</span> DÉ CONSULTÉ — REVIENS DEMAIN
                </div>
              );
            }
            return (
              <button onClick={() => {
                setRolling(true); setFate(null); playSfx("de");
                onSetFateRollDay && onSetFateRollDay(today);
                setTimeout(() => {
                  const pick = pool[Math.floor(Math.random()*pool.length)];
                  const u = findUnit(pick.faction, pick.unitId);
                  setFate({ ...pick, unitName: u?.name || pick.unitId });
                  setRolling(false);
                  vibrate("destin");
                }, 700);
              }}
                style={{ background:"linear-gradient(135deg,#1a1408,#0e0a04)", border:"1px solid #b8922a", color:"#e0c060", padding:"9px 14px", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer", display:"flex", alignItems:"center", gap:"7px", touchAction:"manipulation", whiteSpace:"nowrap", boxShadow:"0 0 14px #b8922a33", fontWeight:"700" }}>
                <span style={{ fontSize:"15px" }}>⚄</span> LE DÉ DU DESTIN
              </button>
            );
          })()}
        </div>
        {/* Relique maudite (lib/curse.jsx) */}
        {(() => {
          if (enrolDaysLeft(appState) > 0) return null;
          const c = activeCurse(appState);
          if (!c) return null;
          const it = c.item, u = findUnit(it.faction, it.unitId);
          return (
            <div onClick={() => onOpenInInventory && onOpenInInventory(it.faction, it.id)}
              style={{ background:"linear-gradient(135deg,#1a0a22,#0a0508)", border:`1px solid ${CURSE_COLOR}55`, borderLeft:`3px solid ${CURSE_COLOR}`, padding:"10px 12px", margin:"0 0 12px", display:"flex", gap:"11px", alignItems:"center", cursor:"pointer", touchAction:"manipulation", boxShadow:`0 0 18px ${CURSE_COLOR}22` }}>
              <div style={{ width:"52px", height:"52px", flexShrink:0, border:`1px solid ${CURSE_COLOR}88`, overflow:"hidden", background:"#0a0508", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {it.photo ? <img src={it.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:curseFilter(c.level) }} /> : <span style={{ fontSize:"24px", color:CURSE_COLOR }}>☠</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"6px" }}>
                  <span style={{ color:CURSE_COLOR, fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>☠ RELIQUE MAUDITE</span>
                  <span style={{ display:"flex", gap:"3px" }}>{CURSE_LEVELS.map((_, k) => <span key={k} style={{ width:"7px", height:"7px", transform:"rotate(45deg)", background: k <= c.level ? CURSE_COLOR : "transparent", border:`1px solid ${CURSE_COLOR}88` }} />)}</span>
                </div>
                <div className={c.level >= 3 ? "curse-glitch" : ""} style={{ color:"#ecd8f4", fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700", lineHeight:1.2, marginTop:"2px" }}>{it.nickname || u?.name}</div>
                <div style={{ color:"#c8a8d8", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.35, marginTop:"2px" }}>
                  <b style={{ fontStyle:"normal", fontFamily:"'Cinzel',serif", fontSize:"11px", fontWeight:"400" }}>{c.name}</b> · {c.frozen ? "corruption figée, l'ouvrage a commencé" : `${c.days} jour${c.days > 1 ? "s" : ""}`}. {c.text}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Rappel du dernier ordre du Dé */}
        {appState?.fateChoice && (() => {
          const fc = appState.fateChoice;
          const item = inventory.find(i => i.id === fc.id);
          if (!item) return null;
          const stillTodo = item.paintStatus !== "painted";
          // Données live (voir même correctif sur l'Accueil) : évite d'afficher un
          // surnom périmé si la figurine a été rebaptisée depuis via une autre mission.
          const liveUnitName = findUnit(item.faction, item.unitId)?.name || fc.unitName;
          const liveNickname = item.nickname ?? fc.nickname;
          const livePhoto = item.photo || fc.photo;
          return (
            <div style={{ background:"linear-gradient(135deg,#14100acc,#0a0806cc)", border:"1px solid #8a7a2a55", borderLeft:"3px solid #b8922a", padding:"10px 12px", margin:"0 0 12px", display:"flex", alignItems:"center", gap:"10px" }}>
              {livePhoto
                ? <img src={livePhoto} alt="" style={{ width:"38px", height:"38px", objectFit:"cover", border:"1px solid #b8922a55", flexShrink:0 }} />
                : <span style={{ fontSize:"22px", flexShrink:0 }}>⚄</span>}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ color:"#8a7a58", fontSize:"10px", letterSpacing:"2px", fontFamily:"'Cinzel',serif" }}>ORDRE DU DESTIN</div>
                  {stillTodo && onSetFate && (
                    <button onClick={() => confirm
                        ? confirm("Renoncer à cet ordre du Destin ? Le dé pourra de nouveau être lancé (une fois par jour).", () => onSetFate(null), "#b8922a", "RENONCER", false)
                        : onSetFate(null)}
                      style={{ background:"none", border:"none", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"1px", cursor:"pointer", padding:"0 0 0 8px" }}>RENONCER</button>
                  )}
                </div>
                <div style={{ color:"#e0c060", fontSize:"13px", fontFamily:"'Cinzel',serif", fontWeight:"700", lineHeight:1.2 }}>{liveUnitName}{liveNickname?<span style={{ color:"#d8c8ac", fontStyle:"italic", fontWeight:"400" }}> · « {liveNickname} »</span>:null}</div>
                <div style={{ color: stillTodo?"#8a5a2a":"#5a8a3a", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"0.5px", marginTop:"2px" }}>{stillTodo ? "⧗ Toujours sur l'établi" : "✓ Consacrée — mission remplie"}</div>
                {/* Pont avec les Serments : faire de cet ordre un serment (s'il n'y en a pas déjà un) */}
                {stillTodo && onSwearOathOn && !appState.oath && (
                  <button onClick={(e) => { e.stopPropagation(); onSwearOathOn(item.id); playSfx("celebration", 0.6, "sceau"); }}
                    style={{ marginTop:"8px", padding:"6px 10px", background:"#b8922a1a", border:"1px solid #b8922a88", color:"#e8c860", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"1.5px", cursor:"pointer" }}>☩ EN FAIRE UN SERMENT</button>
                )}
                {stillTodo && appState.oath?.unitId === item.id && (
                  <div style={{ marginTop:"6px", color:"#d4b060", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>☩ Cet ordre est aussi ton serment</div>
                )}
              </div>
            </div>
          );
        })()}
        {(() => {
          const enrol = enrolDaysLeft(appState);
          const shameTitle = enrol > 0 ? `⧗ Enrôlement en cours — le Chapelain jugera dans ${enrol} jour${enrol > 1 ? "s" : ""}`
            : paintPct >= 95 ? "⚔ Croisé Exemplaire — L'Empereur est fier"
            : paintPct >= 80 ? "✠ Serviteur Loyal — Continue ainsi"
            : paintPct >= 60 ? "⚠ Sous Surveillance — Le Chapelain s'impatiente"
            : paintPct >= 40 ? "⸸ Honte Croissante — La pile menace"
            : paintPct >= 20 ? "● Hérétique du Pot de Peinture — Repentance immédiate"
            : "☠ Renégat Confirmé — Excommunication Majeure";
          const shameColor = enrol > 0 ? "#b8922a" : paintPct >= 80 ? "#3ea23e" : paintPct >= 60 ? "#c2a83e" : paintPct >= 40 ? "#d68a3e" : "#d64545";
          return (
            <div style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                <span style={{ color:shameColor, fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>{shameTitle}</span>
                <span style={{ color:shameColor, fontSize:"13px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{paintPct}%</span>
              </div>
              <div style={{ height:"6px", background:"#0a0806", borderRadius:"3px" }}>
                <div style={{ width:`${paintPct}%`, height:"100%", background:shameColor, borderRadius:"3px", transition:"width 0.6s ease" }} />
              </div>
            </div>
          );
        })()}
        {/* Résumé de la pile */}
        {(() => {
          const unp = inventory.filter(i => i.paintStatus !== "painted");
          const modelsOf = (i) => { const u = findUnit(i.faction, i.unitId); return getModelCount(u?.name, i.qty||1, i.modelCount); };
          const total = unp.reduce((s,i) => s + modelsOf(i), 0);
          const sprue = unp.filter(i => i.paintStatus === "sprue").reduce((s,i) => s + modelsOf(i), 0);
          const dated = unp.filter(i => i.purchasedAt).sort((a,b) => a.purchasedAt.localeCompare(b.purchasedAt));
          let oldest = null;
          if (dated.length) { const [y,m] = dated[0].purchasedAt.split("-").map(Number); const mo = Math.max(0,(new Date().getFullYear()-y)*12+(new Date().getMonth()+1-m)); oldest = mo; }
          if (total === 0) return null;
          return (
            <div style={{ color:"#8a7a5a", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"8px", lineHeight:1.4 }}>
              {total} à peindre{(() => { const c = colossusCount(unp, appState.ptsMap || {}); return c.total ? ` (dont ${c.total} colosse${c.total>1?"s":""})` : ""; })()}{sprue > 0 ? ` · ${sprue} encore sur grappe` : ""}{oldest !== null && oldest >= 1 ? ` · la plus ancienne attend depuis ${oldest} mois` : ""}.
            </div>
          );
        })()}

        {/* Alerte < 80% */}
        {paintPct < 80 && (
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", background:"#1a0808", border:"1px solid #7a1515", padding:"6px 10px" }}>
            <span style={{ fontSize:"15px" }}>⚠️</span>
            <span style={{ color:"#c04040", fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>
              {paintPct}% PEINT — OBJECTIF 80% NON ATTEINT
            </span>
          </div>
        )}
        {/* Compteurs */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[
            { key:"sprue",     label:"Sur grappe", color:PAINT_STATUS.sprue.color },
            { key:"unpainted", label:"Monté",      color:PAINT_STATUS.unpainted.color },
            { key:"primed",    label:"Apprêté",    color:PAINT_STATUS.primed.color },
            { key:"wip",       label:"En cours",   color:PAINT_STATUS.wip.color },
          ].map(s => countByStatus[s.key] ? (
            <div key={s.key} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.color }} />
              <span style={{ color:"#d8c8ac", fontSize:"12px" }}>{s.label}</span>
              <span style={{ color:s.color, fontSize:"12px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{countByStatus[s.key]}</span>
            </div>
          ) : null)}
          {totalFigs > 0 && <span style={{ color:"#c8b9a0", fontSize:"12px", marginLeft:"auto", fontFamily:"'Cinzel',serif" }}>{totalFigs} fig</span>}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:"flex", gap:"4px", overflowX:"auto", padding:"6px 12px", background:"rgba(2,2,2,0.5)", borderBottom:"1px solid #0a0a0a", scrollbarWidth:"none" }}>
        {/* Tri */}
        {[{k:"statut",label:"STATUT"},{k:"faction",label:"FACTION"},{k:"age",label:"ANCIENNETÉ"}].map(t => (
          <button key={t.k} onClick={() => setSortBy(t.k)}
            style={{ flexShrink:0, padding:"3px 8px", background:sortBy===t.k?"#1a1816":"transparent", border:`1px solid ${sortBy===t.k?"#6a5a4a":"#1a1816"}`, color:sortBy===t.k?"#9a8a78":"#6a5a4a", fontFamily:"'Cinzel',serif", fontSize:"11px", cursor:"pointer", touchAction:"manipulation" }}>
            {t.label}
          </button>
        ))}
        <div style={{ width:"1px", background:"#1a1816", margin:"0 4px" }} />
        {/* Faction */}
        {factions.map(k => {
          const f = FACTIONS[k];
          const active = factionFilter === k;
          return (
            <button key={k} onClick={() => setFactionFilter(k)}
              style={{ flexShrink:0, padding:"3px 8px", background:active?(f?`${f.accent}22`:"#1a1a1a"):"transparent", border:`1px solid ${active?(f?f.accent:"#6a5a4a"):"#1a1816"}`, color:active?(f?f.accent:"#e8dfc0"):"#6a5a4a", fontFamily:"'Cinzel',serif", fontSize:"11px", cursor:"pointer", touchAction:"manipulation" }}>
              {k === "all" ? "TOUS" : (f?.short || k)}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
        {unpainted.length === 0
          ? <EmptyState icon="✠" accent="#2a7a2a" title="Pile purgée" sub="Toute figurine a reçu sa consécration. Le Chapelain est fier de toi." />
          : unpainted.map((item, idx) => {
              const ps = PAINT_STATUS[item.paintStatus] || PAINT_STATUS.unpainted;
              const cz = appState?.curse?.id === item.id && enrolDaysLeft(appState) <= 0 ? activeCurse(appState) : null;
              return (
                <div key={item.id} onClick={() => onOpenInInventory && onOpenInInventory(item.faction, item.id)}
                  style={{ display:"flex", gap:"12px", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #0d0d0d", animation:`slideLeft 0.2s ${idx*20}ms ease both`, cursor:onOpenInInventory?"pointer":"default", touchAction:"manipulation" }}>
                  {/* Photo */}
                  <div style={{ width:"48px", height:"48px", flexShrink:0, background:"#040404", border:`1px solid ${item.f?.accent||"#1c1c1c"}22`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {item.photo
                      ? <Thumb src={item.photo} px={240} style={{ width:"100%", height:"100%", objectFit:"cover", ...(cz ? { filter: curseFilter(cz.level) } : {}) }} />
                      : <span style={{ opacity:0.3 }}><FactionIcon faction={item.faction} factionDef={item.f} size={20} /></span>
                    }
                  </div>
                  {/* Infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#e8dfc0", fontSize:"13px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textShadow:"0 1px 3px #000, 0 0 7px #000" }}>
                      {cz && <span className={cz.level >= 3 ? "curse-glitch" : ""} style={{ color:CURSE_COLOR, marginRight:"5px" }}>☠</span>}{item.unit.name}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"3px" }}>
                      <span><FactionIcon faction={item.faction} factionDef={item.f} size={13} /></span>
                      <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                        <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:ps.color }} />
                        <span style={{ color:"#b0a290", fontSize:"11px", textShadow:"0 1px 3px #000, 0 0 7px #000" }}>{STATUS_LABEL[item.paintStatus] || "Non peint"}</span>
                      </div>
                      <span style={{ color:"#b0a290", fontSize:"11px", fontFamily:"'Cinzel',serif", textShadow:"0 1px 3px #000, 0 0 7px #000" }}>{item.figs} fig</span>
                    </div>
                    {(() => {
                      const ms = monthsSince(item.purchasedAt);
                      const isWorst = worstIds.has(item.id);
                      let txt, col;
                      if (ms == null) { txt = "▦ Date d'achat ?"; col = "#8a7a60"; }
                      else if (isWorst) {
                        txt = ms>=24 ? `☠ ${ms} mois d'attente — hérésie pure` : ms>=12 ? `⸸ En attente depuis ${ms} mois` : ms>=6 ? `⧗ ${ms} mois dans la pile` : ms>=1 ? `⧗ ${ms} mois d'attente` : "Acquis ce mois-ci";
                        col = ms>=24 ? "#e05a5a" : ms>=12 ? "#c87048" : ms>=6 ? "#b8a23a" : "#8aa070";
                      } else {
                        txt = `Acquis ${item.purchasedAt.split("-")[1]}/${item.purchasedAt.split("-")[0]}`;
                        col = "#98876a";
                      }
                      return (
                        <button onClick={e => { e.stopPropagation(); setDateItem(item); setDateVal(item.purchasedAt||""); }}
                          style={{ background:"none", border:"none", padding:"3px 0 0", cursor:"pointer", color:col, fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", display:"block", textAlign:"left", textShadow:"0 1px 3px #000, 0 0 7px #000" }}>
                          {txt}
                        </button>
                      );
                    })()}
                  </div>
                  {/* Bouton peint */}
                  <button onClick={e => { e.stopPropagation(); confirm(`Marquer "${item.unit.name}" comme peint ?`, () => onUpdatePaint(item.id, "painted"), "#2a7a2a", "PEINT ✓", false); }}
                    style={{ flexShrink:0, width:"32px", height:"32px", background:"#0a1208", border:"1px solid #2a7a2a44", color:"#2a7a2a", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}
                    title="Marquer comme peint"><NavIcon id="paintbrush" size={16} color="currentColor" /></button>
                </div>
              );
            })
        }

      {/* Le Dé du Destin */}
      {(rolling || fate) && (
        <div onClick={() => !rolling && setFate(null)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"340px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#14100a 0%,#080604 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"22px 18px", textAlign:"center" }}>
            {rolling ? (
              <>
                <div style={{ fontSize:"46px", animation:"breathe 0.35s ease-in-out infinite" }}>⚄</div>
                <div style={{ color:"#c8b49a", fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", marginTop:"12px" }}>CONSULTATION DE L'EMPEREUR…</div>
              </>
            ) : (
              <>
                <div style={{ color:"#b3a48c", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>ORDRE DU CHAPITRE</div>
                <div style={{ color:"#b8922a", fontSize:"22px", margin:"10px 0 4px", textShadow:"0 0 24px #b8922a66" }}>✠</div>
                <div style={{ color:"#d8c8ac", fontSize:"12.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"10px" }}>L'Empereur a choisi :</div>
                {fate.photo && <img src={fate.photo} style={{ width:"100%", height:"120px", objectFit:"cover", marginBottom:"10px", filter:"grayscale(45%)" }} />}
                <div style={{ color:"#e8dfc0", fontSize:"17px", fontFamily:"'Cinzel',serif", fontWeight:"700", lineHeight:1.3 }}>{fate.unitName}</div>
                <div style={{ color:FACTIONS[fate.faction]?.accent, fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"4px" }}><FactionIcon faction={fate.faction} size={13} /> {FACTIONS[fate.faction]?.label}</div>
                <div style={{ color:"#c22525", fontSize:"13px", fontFamily:"'Cinzel',serif", letterSpacing:"3px", margin:"14px 0 16px" }}>EXÉCUTION.</div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => setFate(null)}
                    style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>✕ REFUSER</button>
                  <button onClick={() => { onUpdatePaint(fate.id, "wip"); setFateAccepted(fate); onSetFate && onSetFate({ id:fate.id, unitName:fate.unitName, faction:fate.faction, nickname:fate.nickname||null, photo:fate.photo||null, day:localDay() }); setFate(null); }}
                    style={{ flex:1.4, padding:"10px", background:"#8a5a0022", border:"1px solid #8a7a2a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>⚔ J'ACCEPTE</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dé du Destin accepté */}
      {fateAccepted && (
        <div onClick={() => setFateAccepted(null)} style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:401, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"320px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#0d1408 0%,#080604 100%)", border:"1px solid #5a8a3a66", borderTop:"2px solid #5a8a3a", padding:"22px 18px", textAlign:"center" }}>
            <div style={{ fontSize:"30px", marginBottom:"6px" }}>⚔</div>
            <div style={{ color:"#5a8a3a", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>ORDRE ACCEPTÉ</div>
            <div style={{ color:"#e8dfc0", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700", margin:"8px 0 6px", lineHeight:1.3 }}>{fateAccepted.unitName}</div>
            <div style={{ color:"#d8c8ac", fontSize:"13px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginBottom:"6px" }}>est désormais sur l'établi.</div>
            <div style={{ color:"#6a8a4a", fontSize:"11.5px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginBottom:"16px" }}>Statut : ⧗ EN COURS</div>
            <div style={{ color:"#546940", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginBottom:"16px" }}>Tu la retrouveras dans sa faction, filtre « En cours ».</div>
            <button onClick={() => setFateAccepted(null)}
              style={{ width:"100%", padding:"11px", background:"#5a8a3a22", border:"1px solid #5a8a3a", color:"#7aaa5a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ POUR L'EMPEREUR</button>
          </div>
        </div>
      )}

      {/* Modal date d'achat */}
      {dateItem && (
        <div onClick={() => setDateItem(null)} style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"340px", animation:"splashIn 0.28s ease both", background:"linear-gradient(180deg,#14100a 0%,#0a0806 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", padding:"16px" }}>
            <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"4px" }}>REGISTRE D'ACQUISITION</div>
            <div style={{ color:"#e8dfc0", fontSize:"14px", fontFamily:"'Cinzel',serif", fontWeight:"700", marginBottom:"10px" }}>{dateItem.unit?.name}</div>
            <input type="month" value={dateVal} onChange={e => setDateVal(e.target.value)}
              style={{ width:"100%", background:"#060402", border:"1px solid #2a2215", color:"#e8dfc0", padding:"10px", fontSize:"15px", fontFamily:"'Crimson Pro',serif", outline:"none", boxSizing:"border-box", colorScheme:"dark" }} />
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              <button onClick={() => { onUpdatePurchased(dateItem.id, null); setDateItem(null); }}
                style={{ padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", cursor:"pointer" }}>EFFACER</button>
              <button onClick={() => setDateItem(null)}
                style={{ flex:1, padding:"10px", background:"none", border:"1px solid #1c1c1c", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>ANNULER</button>
              <button onClick={() => { if(dateVal) onUpdatePurchased(dateItem.id, dateVal); setDateItem(null); }}
                style={{ flex:1, padding:"10px", background:"#b8922a22", border:"1px solid #b8922a", color:"#b8922a", fontFamily:"'Cinzel',serif", fontSize:"11.5px", letterSpacing:"2px", cursor:"pointer" }}>✠ SCELLER</button>
            </div>
          </div>
        </div>
      )}

      {/* Graphique historique */}
      {paintHistory && paintHistory.length > 0 && (() => {
        const counts = {};
        paintHistory.forEach(({ date, id }) => {
          const it = inventory.find(i => i.id === id);
          const u  = it ? findUnit(it.faction, it.unitId) : null;
          const figs = it ? getModelCount(u?.name, it.qty||1, it.modelCount) : 1;
          counts[date] = (counts[date]||0) + figs;
        });
        const months = Object.keys(counts).sort().slice(-6);
        const max = Math.max(...months.map(m => counts[m]));
        const lbls = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        const mLabel = m => { const [y,mo] = m.split('-'); return `${lbls[parseInt(mo)-1]} ${y.slice(2)}`; };
        return (
          <div style={{ padding:"12px 14px", borderTop:"1px solid #0d0d0d" }}>
            <div style={{ color:"#d8c8ac", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"10px" }}>PROGRESSION MENSUELLE <span style={{ color:"#9a8a6a", fontSize:"10px", letterSpacing:"1px" }}>· FIGURINES</span></div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"80px" }}>
              {months.map(m => (
                <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <span style={{ color:"#b8922a", fontSize:"12px", fontFamily:"'Cinzel',serif" }}>{counts[m]}</span>
                  <div style={{ width:"100%", background:"#b8922a", height:`${Math.round(counts[m]/max*55)+5}px`, transition:"height 0.4s" }} />
                  <span style={{ color:"#c8b9a0", fontSize:"10px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>{mLabel(m)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}
