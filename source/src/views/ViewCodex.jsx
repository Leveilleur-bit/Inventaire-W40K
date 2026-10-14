import React, { useState, useRef } from 'react';
import { pageFond, pageStyle } from '../components/ui.jsx';
import { FACTIONS } from '../data/factions.jsx';
import { POINTS_DB, POINTS_SOURCE, getModelCount } from '../data/points.jsx';
import { PRICES_SOURCE } from '../data/prices.jsx';
import { PAINT_STATUS, findUnit } from '../data/units.jsx';
import { useBackButton } from '../hooks/useBackButton.jsx';
import { APP_VERSION, crusadeStartOf, orderedFactionEntries } from '../lib/utils.jsx';
import { DECK_CHOICES, deckKeyFor } from '../data/tarot.jsx';
import { FactionIcon } from '../components/heraldry.jsx';
import { OrphanRelics } from '../components/OrphanRelics.jsx';

export function ViewCodex({ onSetTarotDeck, lastExport, onExport, onImport, inventory, lists, parade, driveStatus, onDriveConnect, onDriveDisconnect, appState, onSetCrusadeStart, onReassignOrphan, onDeleteOrphan }) {
  const [, setOrderBump] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useBackButton(helpOpen, React.useCallback(() => setHelpOpen(false), []));
  useBackButton(orderOpen, React.useCallback(() => setOrderOpen(false), []));
  const [printView, setPrintView] = useState(false);
  useBackButton(printView, React.useCallback(() => setPrintView(false), []));
  const importRef = useRef(null);
  const totalModels = inventory.reduce((s,i) => { const u=findUnit(i.faction, i.unitId); return s+getModelCount(u?.name, i.qty||1, i.modelCount); }, 0);
  // Idem STATS : RÉFÉRENCES = types d'unités différents possédés, pas le nombre
  // brut de lignes d'inventaire (deux achats séparés de la même escouade
  // comptent pour 1 référence, mais bien 2 dans UNITÉS ci-dessous).
  const totalReferences = new Set(inventory.map(i => `${i.faction}:${i.unitId}`)).size;

  return (
    <div style={{...pageStyle, ...pageFond("codex")}} className={`bg-codex`}>
      {/* Header */}
      <div style={{ background:"rgba(3,2,2,0.42)", borderBottom:"1px solid #0f0f0f", padding:"18px 16px 14px", position:"relative", overflow:"hidden" }}>
        
        <div style={{ color:"#b8922a", fontSize:"11px", letterSpacing:"5px", fontFamily:"'Cinzel',serif", opacity:0.6, marginBottom:"4px" }}>ADMINISTRATION</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:"12px" }}>
          <div style={{ color:"#e8dfc0", fontSize:"18px", fontFamily:"'Cinzel Decorative','Cinzel',serif", letterSpacing:"3px", fontWeight:"700" }}>CODEX</div>
          <div style={{ color:"#b8922a", fontSize:"12.5px", fontFamily:"'Cinzel',serif", opacity:0.7, background:"#0f0c06", border:"1px solid #b8922a33", padding:"2px 8px", letterSpacing:"1px" }}>v{APP_VERSION}</div>
        </div>
        <div style={{ color:"#8a7a5a", fontSize:"11px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"4px" }}>Points : {POINTS_SOURCE} · Prix : {PRICES_SOURCE}</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>

        {/* ── RELIQUES MISES DE CÔTÉ (affiché seulement s'il y en a) ── */}
        <OrphanRelics orphans={appState?.orphanInventory} onReassign={onReassignOrphan} onDelete={onDeleteOrphan} />

        {/* ── SAUVEGARDE ───────────────── */}
        {/* Deux choses seulement : la sauvegarde AUTOMATIQUE (téléphone + Google Drive)
            et une COPIE DE SÉCURITÉ en un seul fichier qui contient tout. */}
        <div className="enlum" style={{ color:"#d8c8ac", marginBottom:"10px" }}><span className="enlum-mark">✠</span><span style={{ fontSize:"12px", letterSpacing:"4px", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>SAUVEGARDE DES DONNÉES</span><span className="enlum-mark">✠</span></div>
        {(() => {
          const synced = driveStatus === "synced";
          const days = lastExport ? Math.floor((Date.now() - lastExport) / 86400000) : null;
          const lbl = { fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif", marginBottom:"8px" };
          const note = { color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5 };
          const row = (ok, text) => (
            <div style={{ display:"flex", gap:"8px", alignItems:"baseline", color: ok ? "#d8c8ac" : "#9a8a6a", fontSize:"13px", fontFamily:"'Crimson Pro',serif", marginBottom:"4px" }}>
              <span style={{ color: ok ? "#5aaa4a" : "#8a7a5a", width:"14px", flexShrink:0 }}>{ok ? "✓" : "○"}</span><span>{text}</span>
            </div>
          );
          return (<>
            {/* Automatique */}
            <div className="hc-bare orn" style={{ background:"rgba(8,6,4,0.6)", border:"1px solid #1c1a16", borderLeft:`3px solid ${synced ? "#3a8a3a" : "#4285f4"}`, padding:"12px 14px", marginBottom:"12px" }}>
              <div style={{ ...lbl, color:"#d8c8ac" }}>SAUVEGARDE AUTOMATIQUE</div>
              {row(true, "Sur ce téléphone, à chaque modification")}
              {row(synced, synced ? "Sur Google Drive, photos comprises" : "Google Drive : " + (
                driveStatus==="connecting" ? "connexion…" : driveStatus==="syncing" ? "synchronisation…" : driveStatus==="pending" ? "envoi imminent…" : driveStatus==="error" ? "erreur, réessaie" : "non connecté"))}
              {!synced && <div style={{ ...note, margin:"6px 0 10px" }}>Connecte Google Drive : ta collection et tes photos y seront copiées automatiquement, et tu pourras tout retrouver sur un autre téléphone.</div>}
              {synced && onDriveDisconnect && (
                <button onClick={onDriveDisconnect}
                  style={{ background:"none", border:"none", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10.5px", letterSpacing:"2px", cursor:"pointer", padding:"8px 0 0" }}>
                  SE DÉCONNECTER DE GOOGLE DRIVE
                </button>
              )}
              {!synced && (
                <button onClick={onDriveConnect}
                  style={{ width:"100%", padding:"11px", marginTop:"4px", background:"#0a0f1a", border:"1px solid #4285f4", color:"#6a9af4", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", touchAction:"manipulation" }}>
                  {driveStatus==="connecting"||driveStatus==="syncing" ? "EN COURS…" : "CONNECTER GOOGLE DRIVE"}
                </button>
              )}
            </div>

            {/* Copie de sécurité */}
            <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", border:"1px solid #b8922a55", borderTop:"2px solid #b8922a", padding:"14px", marginBottom:"20px" }}>
              <div style={{ ...lbl, color:"#d4b060" }}>COPIE DE SÉCURITÉ</div>
              <div style={{ ...note, marginBottom:"12px" }}>
                Un seul fichier contient tout : collection, réglages, Parade et photos. Garde-le hors du téléphone (ordinateur, clé USB, e-mail).
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"12px" }}>
                {[
                  { val: totalReferences, label:"RÉFÉRENCES" },
                  { val: totalModels,     label:"FIGURINES" },
                  { val: inventory.filter(i=>i.photo).length + (parade||[]).filter(p=>p.photo).length, label:"PHOTOS" },
                ].map(c => (
                  <div key={c.label} className="hc-bare" style={{ background:"rgba(8,6,4,0.55)", border:"1px solid #1a1714", padding:"8px", textAlign:"center" }}>
                    <div style={{ color:"#b8922a", fontSize:"16px", fontFamily:"'Cinzel',serif", fontWeight:"700" }}>{c.val}</div>
                    <div style={{ color:"#c8b49a", fontSize:"10px", letterSpacing:"2px", marginTop:"2px" }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...note, color: (!synced && (days === null || days >= 30)) ? "#d8a060" : "#9a8a6a", marginBottom:"10px", textAlign:"center" }}>
                {days === null ? "Aucune copie téléchargée pour l'instant." : days === 0 ? "Dernière copie : aujourd'hui." : `Dernière copie : il y a ${days} jour${days>1?"s":""}.`}
              </div>
              <button onClick={onExport}
                style={{ width:"100%", padding:"14px", background:"linear-gradient(180deg,#1a1200 0%,#120d00 100%)", border:"1px solid #b8922a66", borderTop:"2px solid #b8922a", color:"#d4b060", fontFamily:"'Cinzel',serif", fontSize:"12.5px", letterSpacing:"2px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", marginBottom:"8px", touchAction:"manipulation" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                TÉLÉCHARGER UNE SAUVEGARDE
              </button>
              <input ref={importRef} type="file" accept=".zip,.json,application/zip,application/json" style={{ display:"none" }}
                onChange={e => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ""; } }} />
              <button onClick={() => importRef.current?.click()}
                style={{ width:"100%", padding:"12px", background:"#080604", border:"1px solid #2a2418", color:"#b8a882", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", touchAction:"manipulation" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                RESTAURER UNE SAUVEGARDE
              </button>
              <div style={{ ...note, fontSize:"11px", marginTop:"8px", textAlign:"center" }}>Les anciens fichiers de l'app (.json, photos par faction, Parade) sont aussi acceptés.</div>
              <button onClick={() => setPrintView(true)}
                style={{ width:"100%", padding:"10px", marginTop:"14px", background:"none", border:"1px solid #1c1a16", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                <span>⎙</span> REGISTRE PDF IMPRIMABLE
              </button>
            </div>
          </>);
        })()}

        {/* ── Vue imprimable (PDF) ── */}
        {printView && (
          <div className="print-zone" style={{ position:"fixed", inset:0, zIndex:700, background:"#fff", color:"#111", overflowY:"auto", fontFamily:"Georgia, serif" }}>
            <div className="no-print" style={{ position:"sticky", top:0, background:"#f2f2f2", borderBottom:"1px solid #ccc", padding:"10px 14px", display:"flex", gap:"10px", justifyContent:"flex-end", flexWrap:"wrap" }}>
              <button onClick={() => window.print()} style={{ padding:"9px 18px", background:"#b8922a", border:"none", color:"#fff", fontFamily:"Georgia", fontSize:"14px", cursor:"pointer", fontWeight:"bold" }}>⎙ Imprimer / PDF</button>
              <button onClick={() => {
                  const subject = encodeURIComponent("Registre de Croisade — Reliquaire");
                  const body = encodeURIComponent("Bonjour,\n\nCi-joint mon registre de croisade Warhammer 40.000.\n\n(Pense à joindre le PDF juste enregistré via \"Imprimer / PDF\" avant d'envoyer.)");
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                }}
                style={{ padding:"9px 18px", background:"none", border:"1px solid #b8922a", color:"#8a6a1a", fontFamily:"Georgia", fontSize:"14px", cursor:"pointer" }}>✉︎ Envoyer par mail</button>
              <button onClick={() => setPrintView(false)} style={{ padding:"9px 18px", background:"none", border:"1px solid #999", color:"#555", fontFamily:"Georgia", fontSize:"14px", cursor:"pointer" }}>Fermer</button>
            </div>
            <div style={{ maxWidth:"720px", margin:"0 auto", padding:"30px 24px" }}>
              <div style={{ textAlign:"center", borderBottom:"3px double #b8922a", paddingBottom:"16px", marginBottom:"20px" }}>
                <div style={{ fontSize:"12.5px", letterSpacing:"4px", color:"#8a7a58" }}>✠ RELIQUAIRE ✠</div>
                <div style={{ fontSize:"26px", fontWeight:"bold", letterSpacing:"2px", margin:"6px 0" }}>REGISTRE DE COLLECTION</div>
                <div style={{ fontSize:"13px", color:"#777" }}>Édité le {new Date().toLocaleDateString('fr-FR')} · {inventory.reduce((s,i)=>{const u=findUnit(i.faction, i.unitId);return s+getModelCount(u?.name,i.qty||1,i.modelCount);},0)} figurines · {Object.keys(FACTIONS).filter(k=>inventory.some(i=>i.faction===k)).length} armées</div>
              </div>
              {orderedFactionEntries().filter(([k]) => inventory.some(i=>i.faction===k)).map(([k, f]) => {
                const items = inventory.filter(i => i.faction === k);
                const pts = items.reduce((s,i)=>{const u=findUnit(k, i.unitId);return s+((POINTS_DB[u?.name]||0)*(i.qty||1));},0);
                return (
                  <div key={k} style={{ marginBottom:"22px", breakInside:"avoid" }}>
                    <div style={{ borderBottom:"1.5px solid #b8922a", paddingBottom:"4px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                      <span style={{ fontSize:"16px", fontWeight:"bold" }}>{f.icon} {f.label}</span>
                      <span style={{ fontSize:"12.5px", color:"#8a7a58" }}>{pts.toLocaleString('fr')} pts</span>
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12.5px" }}>
                      <thead><tr style={{ borderBottom:"1px solid #ddd", textAlign:"left", color:"#999" }}>
                        <th style={{ padding:"3px 4px", fontWeight:"normal" }}>Unité</th>
                        <th style={{ padding:"3px 4px", fontWeight:"normal", width:"40px" }}>Qté</th>
                        <th style={{ padding:"3px 4px", fontWeight:"normal", width:"60px" }}>Pts</th>
                        <th style={{ padding:"3px 4px", fontWeight:"normal", width:"80px" }}>Statut</th>
                      </tr></thead>
                      <tbody>
                        {items.map(i => {
                          const u = findUnit(k, i.unitId);
                          return (
                            <tr key={i.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                              <td style={{ padding:"3px 4px" }}>{u?.name||"?"}{i.nickname?` « ${i.nickname} »`:""}</td>
                              <td style={{ padding:"3px 4px" }}>{i.qty||1}</td>
                              <td style={{ padding:"3px 4px" }}>{(POINTS_DB[u?.name]||0)*(i.qty||1)}</td>
                              <td style={{ padding:"3px 4px", color: i.paintStatus==="painted"?"#2a7a2a":"#a05030" }}>{(PAINT_STATUS[i.paintStatus]||PAINT_STATUS.unpainted).label}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              <div style={{ textAlign:"center", marginTop:"26px", paddingTop:"12px", borderTop:"1px solid #ddd", fontSize:"11.5px", color:"#999" }}>✠ L'Empereur protège ✠</div>
            </div>
          </div>
        )}

        {/* ── DÉBUT DE CROISADE ──────── */}
        <div style={{ padding:"12px 14px", borderTop:"1px solid #0d0d0d" }}>
          <div className="hc-bare orn" style={{ background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderTop:"2px solid #b8922a44", padding:"11px 13px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"7px" }}>
              <span style={{ color:"#d8c8ac", fontSize:"14px" }}>⧗</span>
              <div style={{ color:"#c8b890", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>DÉBUT DE CROISADE</div>
            </div>
            <div style={{ color:"#8a7a60", fontSize:"11.5px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, marginBottom:"8px" }}>
              Les trophées d'effort et le rythme du Chapelain ne comptent que ce qui est consacré à partir de cette date. Ta collection déjà peinte reste visible partout ailleurs.
            </div>
            <input type="date" value={crusadeStartOf(appState, appState.paintHistory||[])}
              onChange={e => onSetCrusadeStart(e.target.value || null)}
              style={{ width:"100%", background:"#060402", border:"1px solid #2a2215", color:"#e8dfc0", padding:"9px 10px", fontSize:"14px", fontFamily:"'Crimson Pro',serif", outline:"none", boxSizing:"border-box", colorScheme:"dark" }} />
            {appState.crusadeStart && (
              <button onClick={() => onSetCrusadeStart(null)}
                style={{ marginTop:"7px", background:"none", border:"1px solid #1c1a16", color:"#c8b9a0", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"1px", padding:"6px 10px", cursor:"pointer" }}>
                RÉINITIALISER (1ʳᵉ UTILISATION)
              </button>
            )}
          </div>
        </div>

        {/* ── JEU DU TAROT : impérial, ou celui d'une armée (automatique = armée la plus peinte) ── */}

        {onSetTarotDeck && (() => {

          const cur = appState?.tarotDeck || "auto";

          const autoKey = deckKeyFor({ ...(appState||{}), tarotDeck:"auto" });

          const autoLbl = (DECK_CHOICES.find(([k]) => k === autoKey) || ["","Impérial"])[1];

          return (

            <div className="hc-bare orn" style={{ background:"rgba(10,8,6,0.62)", border:"1px solid #2a2418", padding:"12px 14px", marginBottom:"16px" }}>

              <div style={{ color:"#d8c8ac", fontSize:"11px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>◈ JEU DU TAROT</div>

              <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", margin:"4px 0 10px" }}>Les mêmes 22 lames, dans la voix de ton armée. Automatique : {autoLbl}, ton armée la plus peinte.</div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>

                {DECK_CHOICES.map(([k, lbl]) => (

                  <button key={k} onClick={() => onSetTarotDeck(k)}

                    style={{ padding:"5px 10px", background: cur===k ? "#b8922a22" : "none", border:`1px solid ${cur===k ? "#b8922a" : "#3a3020"}`, color: cur===k ? "#d4b060" : "#9a8a6a", fontFamily:"'Cinzel',serif", fontSize:"11px", cursor:"pointer" }}>{lbl}</button>

                ))}

              </div>

            </div>

          );

        })()}


        {/* ── ORDRE DES ARMÉES ──────── */}
        {(() => {
          const owned = orderedFactionEntries().filter(([k]) => inventory.some(i => i.faction === k));
          if (owned.length < 2) return null;
          const move = (k, dir) => {
            const cur = owned.map(([key]) => key);
            const idx = cur.indexOf(k);
            const tgt = idx + dir;
            if (tgt < 0 || tgt >= cur.length) return;
            [cur[idx], cur[tgt]] = [cur[tgt], cur[idx]];
            try { localStorage.setItem("factionOrder", JSON.stringify(cur)); } catch {}
            setOrderBump(b => b + 1);
          };
          return (
            <div style={{ padding:"12px 14px", borderTop:"1px solid #0d0d0d" }}>
              {/* Cartouche cliquable : replié par défaut, on l'ouvre pour réordonner */}
              <button className="hc-bare" onClick={() => setOrderOpen(o => !o)}
                style={{ width:"100%", textAlign:"left", background:"linear-gradient(180deg,rgba(19,17,16,0.6) 0%,rgba(13,11,10,0.72) 100%)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderTop:"2px solid #b8922a44", padding:"11px 13px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", touchAction:"manipulation" }}>
                <span style={{ color:"#d8c8ac", fontSize:"14px", flexShrink:0 }}>⇅</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#c8b890", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>ORDRE DES ARMÉES</div>
                  {!orderOpen && (
                    <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"4px", overflow:"hidden" }}>
                      {owned.map(([k, f]) => (
                        <span key={k} title={f.label} style={{ opacity:0.85, color:f.accent, display:"inline-flex" }}><FactionIcon faction={k} size={15} /></span>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ color:"#8a7a58", fontSize:"12.5px", flexShrink:0, transform: orderOpen?"rotate(180deg)":"none", transition:"transform 0.25s ease" }}>▾</span>
              </button>
              {orderOpen && (
                <div style={{ marginTop:"8px", animation:"slideLeft 0.22s ease both" }}>
                  {owned.map(([k, f], idx) => (
                    <div key={k} className="hc-bare" style={{ display:"flex", alignItems:"center", gap:"10px", background:"rgba(13,11,10,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1a1816", borderLeft:`2px solid ${f.accent}55`, padding:"7px 10px", marginBottom:"4px" }}>
                      <span><FactionIcon faction={k} factionDef={f} size={16} /></span>
                      <span style={{ flex:1, color:"#c8b890", fontSize:"12.5px", fontFamily:"'Cinzel',serif" }}>{f.label}</span>
                      <button onClick={() => move(k, -1)} disabled={idx===0} style={{ background:"none", border:"1px solid #2a2215", color: idx===0?"#2a2620":"#8a7a58", width:"28px", height:"26px", cursor: idx===0?"default":"pointer", fontSize:"13px" }}>↑</button>
                      <button onClick={() => move(k, 1)} disabled={idx===owned.length-1} style={{ background:"none", border:"1px solid #2a2215", color: idx===owned.length-1?"#2a2620":"#8a7a58", width:"28px", height:"26px", cursor: idx===owned.length-1?"default":"pointer", fontSize:"13px" }}>↓</button>
                    </div>
                  ))}
                  <div style={{ color:"#9a8a6a", fontSize:"12px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"4px" }}>Cet ordre s'applique à la Croisade et aux Reliques.</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── AIDE RAPIDE ─────────────────────── */}
        <button className="hc-bare" onClick={() => setHelpOpen(o => !o)}
          style={{ width:"100%", textAlign:"left", background:"rgba(8,6,4,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #1c1a18", borderTop:"2px solid #b8922a44", padding:"11px 13px", marginTop:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", touchAction:"manipulation" }}>
          <span style={{ color:"#9a8a78", fontSize:"14px", flexShrink:0 }}>?</span>
          <span style={{ flex:1, color:"#c8b890", fontSize:"12px", letterSpacing:"3px", fontFamily:"'Cinzel',serif" }}>AIDE RAPIDE — COMMENT ÇA MARCHE</span>
          <span style={{ color:"#8a7a58", fontSize:"12.5px", flexShrink:0, transform: helpOpen?"rotate(180deg)":"none", transition:"transform 0.25s ease" }}>▾</span>
        </button>
        {helpOpen && (
          <div className="hc-bare" style={{ background:"rgba(8,6,4,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #141210", borderLeft:"2px solid #35281a", padding:"12px 14px", marginTop:"6px", animation:"slideLeft 0.22s ease both" }}>
            {[
              ["⚄ Dé du Destin (SHAME)", "Tire une figurine au hasard dans ta pile. Le choix n'est gardé que si tu tapes « J'ACCEPTE ». Tant que l'ordre n'est pas peint, le dé attend ; « Renoncer » sur la carte de l'ordre le libère. Un lancer par jour."],
              ["⚖ Loi de l'Achat Interdit", "Bloque l'ajout de nouvelles figurines (Reliques et Wishlist) si moins de 80% de ce qui a été acheté depuis le Début de Croisade est peint. Réglable ou désactivable dans la fenêtre qui s'affiche au blocage."],
              ["⧗ Début de Croisade", "Juste au-dessus : la date à partir de laquelle tes trophées d'effort, le rythme du Chapelain et la Loi de l'Achat Interdit commencent à compter. Ta collection déjà peinte reste visible partout ailleurs."],
              ["✠ Serment de Croisade (Accueil)", "Un vœu facultatif avec échéance. Des vœux sont suggérés si tu as des Chevaliers, Titans ou QG non peints ; sinon choisis toi-même un nombre de figurines et une date."],
              ["✦ Titres honorifiques", "Certaines figurines gagnent seules un titre (Le Premier, Vétéran, Le Revenant, Le Colosse, Élu du Destin…). Un ✦ les signale dans les Reliques ; le détail est dans leur fiche."],
              ["◎ Visites et fêtes", "Environ un jour sur trente, un visiteur inattendu passe à l'Accueil. Certaines dates (Nuit du Warp, Ascension, anniversaire de ta Croisade…) changent l'ambiance quelques jours."],
              ["❦ Livre de la Croisade", "Les Chroniques racontent chaque mois de ta Croisade comme un chapitre. Le détail des événements se déplie sous chaque chapitre."],
              ["☾ Mode Serviteur", "Après 2 minutes sans toucher l'écran, les fonds d'écran défilent ; dès 10 photos dans la Parade, ce sont tes figurines peintes et ta Parade. Touche l'écran pour reprendre."],
              ["★ Fond d'Accueil (Parade)", "Sur une photo Parade, tape l'étoile pour la définir comme fond de l'Accueil. Sans photo choisie, un fond différent tourne chaque jour."],
              ["⎙ Registre PDF", "« Imprimer/PDF » ouvre la boîte de dialogue d'impression (choisis « Enregistrer en PDF »). « Envoyer par mail » ouvre ta messagerie : le PDF doit être joint à la main."],
              ["⟳ Google Drive", "Copie automatique de toute la collection, photos comprises, à chaque modification. Déconnexion possible à tout moment, sans rien effacer."],
            ].map(([title, text], i) => (
              <div key={title} style={{ marginBottom:"10px" }}>
                <div style={{ color:"#c8b49a", fontSize:"11.5px", fontFamily:"'Cinzel',serif", marginBottom:"3px" }}>{title}</div>
                <div style={{ color:"#a89880", fontSize:"11px", fontFamily:"'Crimson Pro','Crimson Text',serif", fontStyle:"italic", lineHeight:1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── NOTE ─────────────────────── */}
        <div className="hc-bare" style={{ background:"rgba(8,6,4,0.6)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", border:"1px solid #141210", borderLeft:"2px solid #35281a", padding:"12px 14px", marginTop:"8px" }}>
          <div style={{ color:"#c8b49a", fontSize:"12px", fontFamily:"'Cinzel',serif", letterSpacing:"2px", marginBottom:"6px" }}>NOTE</div>
          <div style={{ color:"#d8c8ac", fontSize:"11.5px", fontFamily:"'Crimson Pro','Crimson Text',serif", fontStyle:"italic", lineHeight:1.7 }}>
            La copie de sécurité (.zip) contient toute ta collection : données, réglages, Parade et photos.
            <br/><br/>
            Pour passer à un autre téléphone, ouvre le site dessus et touche « J'ai déjà une collection » : connecte Google Drive, ou restaure ton fichier .zip.
          </div>
        </div>

      </div>
    </div>
  );
}
