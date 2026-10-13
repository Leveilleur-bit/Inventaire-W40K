import React, { useState, useMemo } from 'react';
import { FACTIONS } from '../data/factions.jsx';
import { PAINT_STATUS, UNITS_DB } from '../data/units.jsx';

// ══════════════════════════════════════════════════════════
// RELIQUES MISES DE CÔTÉ (Codex)
// ══════════════════════════════════════════════════════════
// Une relique dont l'unité n'existe plus dans cette version de l'app (unité renommée ou
// retirée) n'est pas supprimée : elle est rangée dans « orphanInventory » (voir App.jsx).
// Ce bloc, affiché seulement s'il y en a, permet de la voir, de la rattacher à une unité
// existante (elle retourne alors dans la collection, avec sa photo, son statut, son nom
// et ses dates) ou de la supprimer pour de bon.

const ALL_UNITS = Object.entries(UNITS_DB).flatMap(([faction, list]) => list.map(u => ({ faction, id: u.id, name: u.name, low: u.name.toLowerCase() })));
const cinzel = { fontFamily: "'Cinzel',serif" };

function UnitPicker({ faction, onPick, onCancel }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const words = s.split(/\s+/);
    return ALL_UNITS
      .filter(u => words.every(w => u.low.includes(w)))
      // d'abord l'armée d'origine de la relique, puis les noms qui commencent par la recherche
      .sort((a, b) => ((b.faction === faction) - (a.faction === faction)) || (b.low.startsWith(s) - a.low.startsWith(s)) || a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [q, faction]);
  return (
    <div style={{ marginTop: "10px", padding: "10px", background: "#070503", border: "1px solid #2a2418" }}>
      <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Nom de l'unité (ex : inceptor)" aria-label="Rechercher une unité"
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#030202", border: "1px solid #3a3020", color: "#e8dfc0", fontFamily: "'Crimson Pro',serif", fontSize: "16px", outline: "none" }} />
      {q.trim().length >= 2 && !results.length && <div style={{ color: "#9a8a6a", fontSize: "13px", fontFamily: "'Crimson Pro',serif", fontStyle: "italic", marginTop: "8px" }}>Aucune unité à ce nom.</div>}
      {results.map(u => (
        <button key={`${u.faction}:${u.id}`} type="button" onClick={() => onPick(u)}
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "10px", minHeight: "44px", padding: "8px 10px", marginTop: "6px", background: "#0a0806", border: "1px solid #1c1a16", color: "#e8dfc0", textAlign: "left", cursor: "pointer", touchAction: "manipulation", fontFamily: "'Crimson Pro',serif", fontSize: "15px" }}>
          <span>{u.name}</span>
          <span style={{ ...cinzel, color: FACTIONS[u.faction]?.accent || "#9a8a6a", fontSize: "10px", letterSpacing: "1px", whiteSpace: "nowrap" }}>{(FACTIONS[u.faction]?.label || u.faction).toUpperCase()}</span>
        </button>
      ))}
      <button type="button" onClick={onCancel} style={{ ...cinzel, width: "100%", minHeight: "40px", marginTop: "8px", background: "none", border: "1px solid #1c1a16", color: "#b8a882", fontSize: "11px", letterSpacing: "2px", cursor: "pointer" }}>ANNULER</button>
    </div>
  );
}

export function OrphanRelics({ orphans, onReassign, onDelete }) {
  const [pickFor, setPickFor] = useState(null); // id de la relique en cours de rattachement
  if (!orphans?.length) return null;
  const n = orphans.length;
  return (
    <div style={{ marginBottom: "22px" }}>
      <div className="enlum" style={{ color: "#d8c8ac", marginBottom: "10px" }}><span className="enlum-mark">✠</span><span style={{ ...cinzel, fontSize: "12px", letterSpacing: "4px", whiteSpace: "nowrap" }}>RELIQUES MISES DE CÔTÉ</span><span className="enlum-mark">✠</span></div>
      <div style={{ background: "#080604", border: "1px solid #b8922a55", borderTop: "2px solid #b8922a", padding: "14px" }}>
        <div style={{ color: "#c8b9a0", fontSize: "13.5px", fontFamily: "'Crimson Pro',serif", lineHeight: 1.5, marginBottom: "12px" }}>
          {n} relique{n > 1 ? "s" : ""} dont l'unité n'existe plus dans cette version de l'app. Rien n'est perdu : rattache{n > 1 ? "-les" : "-la"} à une unité pour {n > 1 ? "les" : "la"} retrouver dans ta collection, avec photo, statut et dates.
        </div>
        {orphans.map(it => {
          const f = FACTIONS[it.faction];
          const st = PAINT_STATUS[it.paintStatus] || PAINT_STATUS.unpainted;
          const open = pickFor === it.id;
          return (
            <div key={it.id} style={{ borderTop: "1px solid #1c1a16", padding: "12px 0" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "56px", height: "56px", flexShrink: 0, background: "#040404", border: "1px solid #1c1a16", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#6d6253" }}>
                  {it.photo ? <img src={it.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "20px" }}>◉</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...cinzel, color: "#e8dfc0", fontSize: "14px", fontWeight: "700", overflowWrap: "anywhere" }}>{it.nickname || "Unité inconnue"}</div>
                  <div style={{ color: "#9a8a6a", fontSize: "12.5px", fontFamily: "'Crimson Pro',serif", lineHeight: 1.4 }}>
                    {f?.label || it.faction || "Armée inconnue"} · réf. {String(it.unitId || "?")}{(it.qty || 1) > 1 ? ` · ×${it.qty}` : ""}
                    <br /><span style={{ color: st.color }}>{st.label}</span>
                    {it.purchasedAt ? ` · acquis en ${it.purchasedAt.split("-")[1]}/${it.purchasedAt.split("-")[0]}` : ""}
                  </div>
                </div>
              </div>
              {!open && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setPickFor(it.id)}
                    style={{ ...cinzel, flex: 1, minHeight: "44px", background: "linear-gradient(180deg,#1a1200 0%,#120d00 100%)", border: "1px solid #b8922a66", color: "#d4b060", fontSize: "11.5px", letterSpacing: "2px", cursor: "pointer", touchAction: "manipulation" }}>RATTACHER À UNE UNITÉ</button>
                  <button type="button" onClick={() => onDelete(it.id)} aria-label="Supprimer cette relique"
                    style={{ ...cinzel, minWidth: "44px", minHeight: "44px", padding: "0 12px", background: "none", border: "1px solid #5a1a1a", color: "#c06a5a", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", touchAction: "manipulation" }}>SUPPRIMER</button>
                </div>
              )}
              {open && <UnitPicker faction={it.faction} onCancel={() => setPickFor(null)} onPick={(u) => { setPickFor(null); onReassign(it.id, u.faction, u.id); }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
