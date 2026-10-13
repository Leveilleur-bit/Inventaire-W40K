import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoldBurst } from './effects.jsx';
import { IMG, SkullSVG, SIZE } from './ServoSkull.jsx';
import { playSfx } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// SERMENT TENU — courte cérémonie (une dizaine de secondes)
// ══════════════════════════════════════════════════════════
// Le sceau de cire se rompt, le parchemin s'embrase en lettres d'or, le servo-crâne
// vient consigner la parole tenue. Un toucher ferme (après 3 s).
export function OathCeremony({ data, onClose }) {
  const [t, setT] = useState(0);
  const [burst, setBurst] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
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
    once("seal", 1.0, () => { playSfx("sceau", 0.8, "sceau"); });
    once("gold", 2.0, () => { playSfx("celebration", 0.8, "celebration"); setBurst(true); });
    once("end", 12, close);
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const fade = (at, d = 0.9) => ({ opacity: t >= at ? 1 : 0, transform: t >= at ? "none" : "translateY(6px)", transition:`opacity ${d}s ease, transform ${d}s ease` });
  const broken = t >= 1.0, golden = t >= 2.0;
  const skullIn = t >= 4 && t < 9.5;
  const say = t >= 4.6 && t < 9.5 ? `Serment n° ${data.n} vérifié. Parole tenue. Consigné.` : null;

  return createPortal(
    <div onClick={() => { if (t >= 3) close(); }} style={{ position:"fixed", inset:0, zIndex:4700, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", animation:"viewFade 0.5s ease both", cursor: t >= 3 ? "pointer" : "default" }}>
      <div style={{ position:"relative", width:"100%", maxWidth:"330px", textAlign:"center" }}>
        {/* Parchemin */}
        <div style={{ position:"relative", padding:"34px 22px 26px", background:"linear-gradient(180deg,#e8dcbc 0%,#d6c7a0 60%,#bfae84 100%)", borderRadius:"3px", boxShadow: golden ? "0 0 50px #e8c86088, 0 10px 30px #000" : "0 10px 30px #000", transition:"box-shadow 1.5s" }}>
          <div style={{ color:"#5a3a12", fontSize:"11px", letterSpacing:"4px", fontFamily:"'Cinzel',serif" }}>SERMENT DE CROISADE</div>
          <div style={{ color: golden ? "#9a6a10" : "#3a2a14", fontSize:"16px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", lineHeight:1.5, margin:"14px 0 8px",
            textShadow: golden ? "0 0 10px #f0d07099" : "none", transition:"all 1.5s" }}>« {data.formula} »</div>
          <div style={{ ...fade(2.4), fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900, fontSize:"24px", letterSpacing:"3px", color:"#b8860b", textShadow:"0 1px 0 #fff6, 0 0 18px #f0d070" }}>SERMENT TENU</div>
          {/* Sceau de cire qui se rompt */}
          <div style={{ position:"absolute", left:"50%", bottom:"-26px", width:"60px", height:"60px", marginLeft:"-30px" }}>
            {[0,1].map(k => (
              <div key={k} style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 40% 35%, #c83030, #7a1010 70%)", boxShadow:"0 4px 12px #000a",
                clipPath: k ? "polygon(52% 0,100% 0,100% 100%,46% 100%,56% 62%,44% 38%)" : "polygon(0 0,52% 0,44% 38%,56% 62%,46% 100%,0 100%)",
                transform: broken ? `translate(${k ? 16 : -16}px, 6px) rotate(${k ? 18 : -18}deg)` : "none", opacity: broken ? 0 : 1,
                transition:"transform 0.9s cubic-bezier(.3,.8,.4,1), opacity 1.2s ease 0.4s", display:"flex", alignItems:"center", justifyContent:"center", color:"#f4dc94", fontSize:"24px" }}>✠</div>
            ))}
          </div>
        </div>
        <div style={{ ...fade(3.2), color:"#e0d4b4", fontSize:"14px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", marginTop:"40px" }}>{data.name === "ta Croisade" ? "Ta parole est tenue." : `${data.name} a reçu le titre « Serment Tenu ».`}</div>
        {data.tier && <div style={{ ...fade(5.5), color:"#f0d070", fontSize:"13px", fontFamily:"'Cinzel',serif", letterSpacing:"1px", marginTop:"10px" }}>✦ Ton blason gagne : {data.tier}</div>}
        <div style={{ ...fade(7.5), color:"#b8922a", fontSize:"10.5px", fontFamily:"'Cinzel',serif", letterSpacing:"3px", marginTop:"16px" }}>CONSIGNÉ AU LIVRE DE LA CROISADE</div>
        <div style={{ ...fade(3), color:"#7a6c52", fontSize:"10px", fontFamily:"'Cinzel',serif", letterSpacing:"3px", marginTop:"10px" }}>TOUCHER POUR FERMER</div>
      </div>
      {/* Servo-crâne témoin */}
      <div style={{ position:"absolute", top:"9%", left: skullIn ? "calc(50% - 150px)" : (t >= 9.5 ? "110%" : "-90px"), transition: t >= 9.5 ? "left 2s ease-in" : "left 1.8s cubic-bezier(.2,.8,.3,1)", animation:"skullBob 2.6s ease-in-out infinite", width:`${SIZE}px` }}>
        {imgFailed ? <SkullSVG /> : <img src={IMG(t >= 4.6 && t < 6.5)} alt="" width={SIZE} height={SIZE} onError={() => setImgFailed(true)} style={{ display:"block" }} />}
        {say && <div style={{ position:"absolute", left:`${SIZE + 8}px`, top:"-2px", width:"190px", textAlign:"left", background:"rgba(10,8,6,0.95)", border:"1px solid #6a5a3a", padding:"7px 10px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic", fontSize:"13px", lineHeight:1.4, color:"#e0d4b4", animation:"viewFade 0.3s ease both" }}>{say}</div>}
      </div>
      {burst && <GoldBurst big onDone={() => setBurst(false)} />}
    </div>,
    document.body
  );
}
