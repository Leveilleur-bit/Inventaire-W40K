import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoldBurst } from './effects.jsx';
import { playSfx } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// CONSÉCRATION D'UNE RELIQUE — cérémonie courte (30 secondes)
// ══════════════════════════════════════════════════════════
// Pour toutes les figurines qui ne sont pas des colosses : un coup de cloche, la photo se révèle,
// le nom se grave, le sceau de pureté est apposé dans une gerbe d'or (avec le son de célébration),
// puis viennent les points, une phrase de la faction et le rang de la relique dans son armée.
// Un toucher la referme à tout moment ; elle se referme seule au bout de 30 secondes.

const SEAL_AT = 10, END_AT = 30;
const ORD = (n) => n === 1 ? "Première" : n === 2 ? "Deuxième" : n === 3 ? "Troisième" : `${n}ᵉ`;

export function LightCeremony({ data, onClose }) {
  const [t, setT] = useState(0);
  const [burst, setBurst] = useState(false);
  const fired = useRef(new Set());
  const closed = useRef(false);
  const close = () => { if (closed.current) return; closed.current = true; onClose && onClose(); };

  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setT((performance.now() - t0) / 1000), 80);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const once = (k, at, fn) => { if (t >= at && !fired.current.has(k)) { fired.current.add(k); fn(); } };
    once("bell", 0.4, () => playSfx("cloche", 0.7));
    once("seal", SEAL_AT, () => { playSfx("celebration"); setBurst(true); });
    if (t >= END_AT) close();
  }, [t]);

  const acc = data.accent || "#b8922a";
  const revealed = t >= 1.8, sealed = t >= SEAL_AT;
  const leaving = t >= END_AT - 1;
  const fade = (at, d = 0.9) => ({ opacity: t >= at ? 1 : 0, transform: t >= at ? "none" : "translateY(8px)", transition:`opacity ${d}s ease, transform ${d}s ease` });

  return createPortal(
    <div onClick={() => { if (t >= 0.6) close(); }}
      style={{ position:"fixed", inset:0, zIndex:4750, background:"rgba(0,0,0,0.93)", overflow:"hidden", color:"#e8dfc0", textAlign:"center", cursor:"pointer",
        fontFamily:"'Crimson Pro',serif", opacity: leaving ? 0 : Math.min(1, t / 0.8), transition: leaving ? "opacity 1s ease" : "none" }}>

      {/* Rayons de lumière derrière la relique */}
      <div style={{ position:"absolute", left:"50%", top:"38%", width:"760px", height:"760px", marginLeft:"-380px", marginTop:"-380px", pointerEvents:"none",
        background:`repeating-conic-gradient(from 0deg, ${acc}1c 0deg 6deg, transparent 6deg 18deg)`, borderRadius:"50%",
        maskImage:"radial-gradient(circle, #000 0%, transparent 60%)", WebkitMaskImage:"radial-gradient(circle, #000 0%, transparent 60%)",
        opacity: sealed ? 1 : 0, transition:"opacity 2s ease", animation:"raysSpin 60s linear infinite" }} />

      <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"calc(24px + env(safe-area-inset-top, 0px)) 22px calc(30px + env(safe-area-inset-bottom, 0px))", boxSizing:"border-box" }}>
        <div style={{ ...fade(0.6, 1.2), color:acc, fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"5px" }}>RELIQUE CONSACRÉE</div>

        {/* La relique */}
        <div style={{ position:"relative", width:"min(56vw, 220px)", aspectRatio:"1", marginTop:"20px", flexShrink:0, border:`1px solid ${acc}88`, background:"#050403",
          opacity: revealed ? 1 : 0, boxShadow: sealed ? `0 0 34px ${acc}55` : "none", transition:"opacity 1.2s ease, box-shadow 1.5s", animation: sealed ? "stampShake 0.4s ease-out both" : "none" }}>
          <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, opacity: revealed ? 1 : 0, transform: revealed ? "scale(1)" : "scale(1.08)", filter: revealed ? "brightness(1)" : "brightness(0)", transition:"opacity 3s ease, transform 4s ease, filter 3s ease", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {data.photo
                ? <img src={data.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ color:acc, fontSize:"96px", textShadow:`0 0 30px ${acc}` }}>{data.icon || "✠"}</div>}
            </div>
          </div>
          {/* Sceau de pureté */}
          {sealed && (
            <div style={{ position:"absolute", right:"-16px", bottom:"-16px", width:"62px", height:"62px" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${acc}`, animation:"sealRing 1s 0.3s ease-out both" }} />
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)", boxShadow:"0 4px 14px #000", display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:"25px", animation:"sealStamp 0.6s cubic-bezier(.3,1.4,.6,1) both" }}>✠</div>
            </div>
          )}
        </div>

        {/* Nom, armée et points */}
        <div style={{ marginTop:"24px", maxWidth:"340px" }}>
          <div style={{ fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900, fontSize:"20px", letterSpacing:"2px", lineHeight:1.25, color:"#f4e4b0", textShadow:`0 2px 0 #000, 0 0 20px ${acc}88`,
            opacity: t >= 6 ? 1 : 0, transform: t >= 6 ? "scale(1)" : "scale(1.4)", filter: t >= 6 ? "blur(0)" : "blur(5px)", transition:"all 1.5s cubic-bezier(.2,.8,.3,1)" }}>{data.name.toUpperCase()}</div>
          <div style={{ ...fade(8), color:"#b8a882", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", marginTop:"7px" }}>
            {data.unitName !== data.name ? data.unitName.toUpperCase() + " · " : ""}{(data.armyLabel || "").toUpperCase()}
          </div>
          <div style={{ ...fade(12.5), color:"#6fa44a", fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"1px", marginTop:"6px" }}>+{data.pts.toLocaleString("fr")} pts pour la croisade</div>
        </div>

        {/* Phrase de la faction */}
        {data.lore && <div style={{ ...fade(15.5, 1.6), fontStyle:"italic", fontSize:"15px", lineHeight:1.5, color:"#e0d4b4", marginTop:"16px", maxWidth:"320px" }}>{data.lore}</div>}

        {data.rank > 0 && <div style={{ ...fade(20), color:"#8a7a5a", fontStyle:"italic", fontSize:"13px", marginTop:"14px" }}>{ORD(data.rank)} relique consacrée de cette armée</div>}

        <div style={{ ...fade(24), color:"#7a6c52", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"3px", marginTop:"26px" }}>TOUCHER POUR CLORE</div>
      </div>

      {burst && <GoldBurst big={!!data.big} onDone={() => setBurst(false)} />}
    </div>,
    document.body
  );
}
