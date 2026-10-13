import React, { useState } from 'react';

// ══════════════════════════════════════════════════════════
// DATE IMPÉRIALE
// ══════════════════════════════════════════════════════════
// Système de datation de l'Imperium : « 0 736 026.M42 »
//   0   → chiffre de contrôle (0 = daté sur Terra même)
//   736 → fraction de l'année écoulée, en millièmes
//   026 → année dans le millénaire
//   M42 → 42ᵉ millénaire
export function imperialDate(d = new Date()) {
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime(), end = new Date(y + 1, 0, 1).getTime();
  const frac = Math.min(999, Math.floor((d.getTime() - start) / (end - start) * 1000));
  const mill = Math.floor(y / 1000) + 40;           // 2026 → M42
  const inMill = y % 1000;
  return `0 ${String(frac).padStart(3, "0")} ${String(inMill).padStart(3, "0")}.M${mill}`;
}
export function classicDate(d = new Date()) {
  const s = d.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Date impériale ; un toucher affiche la date classique (et inversement).
export function ImperialDate({ style }) {
  const [classic, setClassic] = useState(false);
  const now = new Date();
  return (
    <div onClick={(e) => { e.stopPropagation(); setClassic(c => !c); }}
      title={classic ? "Date impériale" : "Date classique"}
      style={{ cursor:"pointer", touchAction:"manipulation", fontFamily:"'Cinzel',serif", letterSpacing: classic ? "1.5px" : "3px", fontSize:"11px", color:"#9a8a6a", userSelect:"none", ...style }}>
      {classic ? classicDate(now) : imperialDate(now)}
    </div>
  );
}
