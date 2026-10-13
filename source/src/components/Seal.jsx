import React from 'react';

// ══════════════════════════════════════════════════════════
// SCEAU DE PURETÉ des cérémonies (colosse et cérémonie courte)
// ══════════════════════════════════════════════════════════
// Trois sceaux de cire (images fournies le 13 octobre 2026, détourées par Claude) :
// impérial (aquila) pour l'Imperium et les Chevaliers, chaos (étoile à huit branches) pour
// les armées du Chaos, xénos (étoile et œil, cire verte) pour Tyranides et autres xénos.
// L'ancien disque de cire rouge reste en secours si une image manque.
const CHAOS = ["CSM", "CK", "LD"];
const XENOS = ["TY", "GC", "NC", "AE", "DR", "TA", "OR", "LV"];
export const sealImageFor = (faction) =>
  CHAOS.includes(faction) ? "sceau-chaos.png" : XENOS.includes(faction) ? "sceau-xenos.png" : "sceau-imperial.png";

export function PuritySeal({ faction, size, acc, glyph = "✠" }) {
  const [failed, setFailed] = React.useState(false);
  const anim = "sealStamp 0.6s cubic-bezier(.3,1.4,.6,1) both";
  if (!failed) {
    return (
      <div style={{ position:"absolute", zIndex:3, right:`${-size * 0.3}px`, bottom:`${-size * 0.3}px`, width:`${size}px`, height:`${size}px` }}>
        <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 1s 0.3s ease-out both" }} />
        <img src={`${import.meta.env.BASE_URL}${sealImageFor(faction)}`} alt="" onError={() => setFailed(true)} width={size} height={size}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", filter:"drop-shadow(0 5px 10px #000) drop-shadow(0 0 3px #000)", animation:anim }} />
      </div>
    );
  }
  const s = size * 0.68;
  return (
    <div style={{ position:"absolute", zIndex:3, right:`${-s * 0.24}px`, bottom:`${-s * 0.24}px`, width:`${s}px`, height:`${s}px` }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 1s 0.3s ease-out both" }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)", boxShadow:"0 4px 14px #000", display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:`${s * 0.4}px`, animation:anim }}>{glyph}</div>
    </div>
  );
}
