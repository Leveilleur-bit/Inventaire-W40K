import React from 'react';

// ══════════════════════════════════════════════════════════
// CADRE DORÉ de la photo dans les cérémonies (colosse et cérémonie courte)
// ══════════════════════════════════════════════════════════
// Posé par-dessus la photo (pointer-events: none) : baguette dorée en trois filets,
// équerres ornées aux quatre coins et un fleuron au milieu du haut et du bas.

const GOLD = "linear-gradient(135deg, #f4dc94 0%, #b8922a 28%, #6a5420 50%, #d4a838 72%, #8a6d1e 100%)";

// Équerre d'angle : un L doré terminé par une perle, avec un losange dans l'angle
const Corner = ({ style }) => (
  <svg width="30" height="30" viewBox="0 0 30 30" style={{ position:"absolute", ...style }} aria-hidden="true">
    <defs>
      <linearGradient id="rfGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f4dc94" /><stop offset="0.45" stopColor="#b8922a" /><stop offset="1" stopColor="#6a5420" />
      </linearGradient>
    </defs>
    <path d="M2 28 V6 Q2 2 6 2 H28" fill="none" stroke="url(#rfGold)" strokeWidth="3" />
    <path d="M8 24 V10 Q8 8 10 8 H24" fill="none" stroke="#b8922a" strokeWidth="1" opacity="0.8" />
    <circle cx="28" cy="2" r="2" fill="#e0c060" /><circle cx="2" cy="28" r="2" fill="#e0c060" />
    <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="url(#rfGold)" stroke="#2a2010" strokeWidth="0.6" />
  </svg>
);

const Fleuron = ({ style }) => (
  <svg width="26" height="12" viewBox="0 0 26 12" style={{ position:"absolute", left:"50%", marginLeft:"-13px", ...style }} aria-hidden="true">
    <path d="M13 0 L17 6 L13 12 L9 6 Z" fill="#d4a838" stroke="#2a2010" strokeWidth="0.6" />
    <path d="M0 6 H8 M18 6 H26" stroke="#b8922a" strokeWidth="1.2" />
    <circle cx="13" cy="6" r="1.4" fill="#2a2010" />
  </svg>
);

export function RelicFrame() {
  return (
    <div aria-hidden="true" style={{ position:"absolute", inset:"-12px", pointerEvents:"none", zIndex:2 }}>
      {/* Baguette dorée : une bande pleine, évidée au centre */}
      <div style={{ position:"absolute", inset:0, padding:"6px", background:GOLD, boxShadow:"0 6px 22px #000, 0 0 0 1px #1a1408",
        WebkitMask:"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite:"xor",
        mask:"linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)" }} />
      {/* Filet sombre puis filet clair contre la photo */}
      <div style={{ position:"absolute", inset:"6px", border:"3px solid #140f08" }} />
      <div style={{ position:"absolute", inset:"9px", border:"1px solid #e0c06099", boxShadow:"inset 0 0 18px #000c" }} />
      <Corner style={{ left:"-6px", top:"-6px" }} />
      <Corner style={{ right:"-6px", top:"-6px", transform:"scaleX(-1)" }} />
      <Corner style={{ left:"-6px", bottom:"-6px", transform:"scaleY(-1)" }} />
      <Corner style={{ right:"-6px", bottom:"-6px", transform:"scale(-1,-1)" }} />
      <Fleuron style={{ top:"-3px" }} />
      <Fleuron style={{ bottom:"-3px" }} />
    </div>
  );
}
