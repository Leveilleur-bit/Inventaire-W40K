import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoldBurst } from './effects.jsx';
import { NavIcon } from './heraldry.jsx';
import { playSfx } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// TROPHÉE DÉBLOQUÉ — courte cérémonie (une douzaine de secondes)
// ══════════════════════════════════════════════════════════
// Un médaillon vide apparaît, l'emblème du trophée y est frappé dans une gerbe d'or, puis
// viennent son nom, ce qu'il récompense et le compte de la Salle des trophées.
// Un toucher la referme ; elle se referme seule au bout de 14 secondes.
// App ne l'affiche que lorsque les autres cérémonies (consécration, serment, promotion) sont closes.

const STRIKE_AT = 2.2, END_AT = 14;

export function TrophyCeremony({ data, onClose }) {
  const [t, setT] = useState(0);
  const [burst, setBurst] = useState(false);
  const fired = useRef(false);
  const closed = useRef(false);
  const close = () => { if (closed.current) return; closed.current = true; onClose && onClose(); };

  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setT((performance.now() - t0) / 1000), 80);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (t >= STRIKE_AT && !fired.current) { fired.current = true; playSfx("celebration", 0.8, "promotion"); setBurst(true); }
    if (t >= END_AT) close();
  }, [t]);

  const gold = "#b8922a";
  const struck = t >= STRIKE_AT, leaving = t >= END_AT - 1;
  const fade = (at, d = 0.9) => ({ opacity: t >= at ? 1 : 0, transform: t >= at ? "none" : "translateY(8px)", transition:`opacity ${d}s ease, transform ${d}s ease` });
  const icon = data.icon || "✠";

  return createPortal(
    <div onClick={() => { if (t >= 1) close(); }}
      style={{ position:"fixed", inset:0, zIndex:4600, background:"rgba(0,0,0,0.96)", overflow:"hidden", color:"#e8dfc0", textAlign:"center", cursor:"pointer",
        fontFamily:"'Crimson Pro',serif", opacity: leaving ? 0 : Math.min(1, t / 0.6), transition: leaving ? "opacity 1s ease" : "none" }}>

      {/* Rayons de lumière derrière le médaillon */}
      <div style={{ position:"absolute", left:"50%", top:"38%", width:"700px", height:"700px", marginLeft:"-350px", marginTop:"-350px", pointerEvents:"none",
        background:`repeating-conic-gradient(from 0deg, ${gold}20 0deg 6deg, transparent 6deg 18deg)`, borderRadius:"50%",
        maskImage:"radial-gradient(circle, #000 0%, transparent 60%)", WebkitMaskImage:"radial-gradient(circle, #000 0%, transparent 60%)",
        opacity: struck ? 1 : 0, transition:"opacity 2s ease", animation:"raysSpin 60s linear infinite" }} />

      <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"calc(24px + env(safe-area-inset-top, 0px)) 24px calc(30px + env(safe-area-inset-bottom, 0px))", boxSizing:"border-box" }}>
        <div style={{ ...fade(0.4, 1), color:gold, fontFamily:"'Cinzel',serif", fontSize:"12px", letterSpacing:"5px" }}>SALLE DES TROPHÉES</div>

        {/* Médaillon : vide d'abord, puis frappé de l'emblème */}
        <div style={{ position:"relative", width:"132px", height:"132px", marginTop:"26px", flexShrink:0, opacity: t >= 0.9 ? 1 : 0, transition:"opacity 1s ease", animation: struck ? "stampShake 0.4s ease-out both" : "none" }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${struck ? gold : "#3a3020"}`, background: struck ? "radial-gradient(circle at 40% 32%, #3a2c10 0%, #14100a 62%, #080604 100%)" : "#060504",
            boxShadow: struck ? `0 0 44px ${gold}66, inset 0 0 22px #000` : "inset 0 0 22px #000", transition:"border-color 0.4s, box-shadow 1.2s, background 0.6s" }} />
          <div style={{ position:"absolute", inset:"9px", borderRadius:"50%", border:`1px solid ${struck ? gold + "88" : "#2a2418"}`, transition:"border-color 0.4s" }} />
          {struck && <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${gold}`, animation:"sealRing 1s 0.2s ease-out both" }} />}
          {struck && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:"54px", lineHeight:1, textShadow:`0 0 24px ${gold}`, animation:"sealStamp 0.6s cubic-bezier(.3,1.4,.6,1) both" }}>
              {icon.startsWith("svg:") ? <NavIcon id={icon.slice(4)} size={56} color="currentColor" /> : icon + "︎"}
            </div>
          )}
        </div>

        {/* Nom du trophée et ce qu'il récompense */}
        <div style={{ marginTop:"26px", maxWidth:"330px" }}>
          <div style={{ fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900, fontSize:"22px", letterSpacing:"2px", lineHeight:1.25, color:"#f4e4b0", textShadow:`0 2px 0 #000, 0 0 20px ${gold}88`,
            opacity: t >= 3.2 ? 1 : 0, transform: t >= 3.2 ? "scale(1)" : "scale(1.4)", filter: t >= 3.2 ? "blur(0)" : "blur(5px)", transition:"all 1.2s cubic-bezier(.2,.8,.3,1)" }}>{data.name.toUpperCase()}</div>
          <div style={{ ...fade(4.4, 1.2), fontStyle:"italic", fontSize:"15px", lineHeight:1.5, color:"#e0d4b4", marginTop:"10px" }}>{data.desc}</div>
        </div>

        <div style={{ ...fade(5.6), color:"#7a9a4a", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"3px", marginTop:"22px" }}>
          ✓ TROPHÉE DÉBLOQUÉ{data.total ? ` · ${data.count} / ${data.total}` : ""}
        </div>
        {data.more > 0 && <div style={{ ...fade(6.4), color:"#8a7a5a", fontStyle:"italic", fontSize:"13px", marginTop:"6px" }}>{data.more === 1 ? "Un autre trophée t'attend." : `${data.more} autres trophées t'attendent.`}</div>}

        <div style={{ ...fade(7.5), color:"#7a6c52", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"3px", marginTop:"26px" }}>TOUCHER POUR CLORE</div>
      </div>

      {burst && <GoldBurst big onDone={() => setBurst(false)} />}
    </div>,
    document.body
  );
}
