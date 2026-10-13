import React from 'react';

// ══════════════════════════════════════════════════════════
// SCEAU DE PURETÉ des cérémonies (colosse et cérémonie courte)
// ══════════════════════════════════════════════════════════
// Armées impériales (et Chevaliers) : le sceau de cire à l'aquila (public/sceau-imperial.png,
// détouré depuis l'image fournie le 13 octobre 2026). Chaos, Tyranides et xénos : l'ancien
// disque de cire rouge, car l'aquila n'a rien à y faire.
const XENOS_OR_CHAOS = ["TY", "GC", "CSM", "CK", "LD", "NC", "AE", "DR", "TA", "OR", "LV"];
export const hasImperialSeal = (faction) => !XENOS_OR_CHAOS.includes(faction);

export function PuritySeal({ faction, size, acc, glyph = "✠" }) {
  const anim = "sealStamp 0.6s cubic-bezier(.3,1.4,.6,1) both";
  if (hasImperialSeal(faction)) {
    return (
      <div style={{ position:"absolute", right:`${-size * 0.3}px`, bottom:`${-size * 0.3}px`, width:`${size}px`, height:`${size}px` }}>
        <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 1s 0.3s ease-out both" }} />
        <img src={`${import.meta.env.BASE_URL}sceau-imperial.png`} alt="" width={size} height={size}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", filter:"drop-shadow(0 5px 10px #000) drop-shadow(0 0 3px #000)", animation:anim }} />
      </div>
    );
  }
  const s = size * 0.68;
  return (
    <div style={{ position:"absolute", right:`${-s * 0.24}px`, bottom:`${-s * 0.24}px`, width:`${s}px`, height:`${s}px` }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 1s 0.3s ease-out both" }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)", boxShadow:"0 4px 14px #000", display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:`${s * 0.4}px`, animation:anim }}>{glyph}</div>
    </div>
  );
}
