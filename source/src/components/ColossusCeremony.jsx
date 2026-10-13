import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PuritySeal } from './Seal.jsx';
import { GoldBurst } from './effects.jsx';
import { IMG, SkullSVG, SIZE } from './ServoSkull.jsx';
import { playSfx, playLong, vibrate } from '../lib/sfx.jsx';

// ══════════════════════════════════════════════════════════
// CONSÉCRATION D'UN COLOSSE — cérémonie d'environ une minute et demie
// ══════════════════════════════════════════════════════════
// Glas (la croix de la faction bat à chaque coup de cloche), décret, arrivée du servo-crâne qui scanne la relique, révélation de la
// photo, nom gravé, litanie de la faction, sceau de pureté et gerbe d'or, puis le servo-crâne
// consigne tout au Livre de la Croisade et se retire (vers 85 s). « Passer » apparaît après 8 secondes.

const flavorOf = (f) => f === "IK" ? "knight" : (f === "TY" || f === "GC") ? "TY" : (f === "CSM" || f === "CK" || f === "LD") ? "chaos" : ["NC","AE","DR","TA","OR","LV"].includes(f) ? "xenos" : "imperial";
// Trois litanies par famille d'armées, et trois formules pour chaque réplique du servo-crâne :
// le tirage « pick » est fait une fois à l'ouverture de la cérémonie.
function litany(faction, name, pick = 0) {
  const all = {
    knight: [
      ["Que le Trône Méca garde mémoire de ce jour.", `Que les pas de ${name} fassent trembler les mondes.`, "Que ses armes ne connaissent ni repos ni pitié.", "Et que nul ennemi n'oublie le nom de sa Maison."],
      ["Les cloches de la Maison sonnent pour un nouveau seigneur de guerre.", `${name} s'éveille, et ses ancêtres murmurent dans le Trône.`, "Que son ombre couvre le champ de bataille.", "Et que l'honneur soit sa seule cuirasse."],
      ["Par l'acier, par le serment, par le sang de la Maison,", `${name} prend place dans la lance de bataille.`, "Que ses pas soient lents et sa colère certaine.", "Car nul ne se relève de la charge d'un Chevalier."],
    ],
    imperial: [
      ["Par le Trône d'Or et la volonté de l'Empereur,", `${name} est consacré au service de l'Imperium.`, "Que l'esprit qui l'habite ne connaisse jamais le doute.", "Qu'il marche en avant, et que les ennemis de l'humanité reculent."],
      ["Les litanies ont été chantées, les huiles ont été versées.", `${name} s'éveille au service de l'Empereur.`, "Que son esprit-machine soit farouche et fidèle.", "Et que l'ennemi apprenne son nom par le feu."],
      ["Devant l'autel de la guerre, une relique se dresse.", `${name} portera la colère de l'Imperium.`, "Qu'il ne recule ni ne faiblisse.", "Jusqu'à la dernière munition, jusqu'au dernier ennemi."],
    ],
    TY: [
      ["L'Esprit de la Ruche a façonné une arme vivante.", `${name} s'éveille, et la synapse frémit.`, "Que les mondes-proies entendent venir son ombre.", "Rien ne sera épargné. Rien ne sera oublié."],
      ["Les bassins de ponte ont longuement mûri leur œuvre.", `${name} se déploie, immense et affamé.`, "Que les mondes se taisent à son approche.", "La Ruche ne célèbre pas. Elle dévore."],
      ["Une volonté plus vaste que les étoiles a voulu cette forme.", `${name} marche, et l'essaim marche avec lui.`, "Toute chair lui est promise.", "Il n'y aura ni trêve ni lendemain."],
    ],
    chaos: [
      ["Les Puissances de la Ruine ont posé leur regard sur ce jour.", `${name} a reçu leur marque, et leur faveur.`, "Que les cathédrales de l'Imperium tremblent à son approche.", "Car ce qui a été consacré ici ne connaîtra jamais la paix."],
      ["Le voile s'est déchiré le temps d'un souffle.", `${name} en est sorti, couvert de présages.`, "Que les fidèles du Faux Empereur comptent leurs heures.", "Les Dieux ont parié sur lui. Ils parient rarement à perte."],
      ["Par la haine, par la gloire, par dix mille ans de guerre,", `${name} reçoit le baptême des ténèbres.`, "Que ses chaînes chantent et que ses canons hurlent.", "Ce qui se dresse devant lui ne se relèvera pas."],
    ],
    xenos: [
      ["Les anciens registres s'ouvrent pour accueillir un nom de plus.", `${name} rejoint les légendes de sa race.`, "Que les champs de bataille gardent la mémoire de son passage.", "Et que ses ennemis apprennent, trop tard, à le craindre."],
      ["Les étoiles sont vieilles, et elles se souviennent.", `${name} s'avance, et les jeunes races s'écartent.`, "Que sa puissance rappelle à qui appartenait la galaxie.", "Et à qui elle reviendra."],
      ["Ni prière ni encens : seulement l'œuvre accomplie.", `${name} est prêt, et cela suffit.`, "Que ses ennemis mesurent trop tard leur erreur.", "L'histoire retiendra ce jour, dans une langue qu'ils ne liront pas."],
    ],
  }[flavorOf(faction)];
  return all[pick % all.length];
}
const SKULL_LINES = {
  detect:  ["Relique majeure détectée. Analyse en cours…", "Masse anormale détectée. Ce n'est pas une escouade.", "Alerte : objet de grande taille sur l'établi. Scan engagé."],
  measure: ["Mesure de la puissance… hors norme.", "Estimation de la menace… réjouissante.", "Calcul du tonnage… capacité dépassée."],
  archive: ["Recherche dans les archives… concordance trouvée.", "Consultation des registres… entrée confirmée.", "Vérification des sceaux… authentiques."],
  ident:   [(n) => `Identification : ${n}. Conformité : totale.`, (n) => `Identification : ${n}. Aucune trace de gris.`, (n) => `Identification : ${n}. Je recommande la vitrine.`],
  consign: ["Consignation au Livre de la Croisade… effectuée.", "Inscription au Livre de la Croisade… gravée.", "Entrée ajoutée au Livre de la Croisade. En lettres d'or."],
  retire:  ["Servo-crâne 7-Alpha se retire. Gloire à l'Empereur.", "Servo-crâne 7-Alpha se retire. C'était beau.", "Mission accomplie. Servo-crâne 7-Alpha retourne à l'ombre."],
};
const END = 85;   // à partir de là, un toucher clôt la cérémonie
const ORD = (n) => n === 1 ? "Premier" : n === 2 ? "Deuxième" : n === 3 ? "Troisième" : `${n}ᵉ`;

// Texte qui s'écrit lettre par lettre entre start et start+dur (en secondes)
const Typed = ({ t, start, dur, text, style }) => {
  if (t < start) return null;
  const n = Math.min(text.length, Math.ceil(((t - start) / dur) * text.length));
  return <div style={style}>{text.slice(0, n)}<span style={{ opacity: n < text.length ? 1 : 0 }}>▍</span></div>;
};

export function ColossusCeremony({ data, onClose }) {
  const [t, setT] = useState(0);
  const [burst, setBurst] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const fired = useRef(new Set());
  const stopMusic = useRef(() => {});
  const closed = useRef(false);
  // Tirage des formules, fait une fois à l'ouverture (un nombre par réplique)
  const draw = useRef(Array.from({ length: 7 }, () => Math.floor(Math.random() * 3))).current;
  const skull = (key, i) => SKULL_LINES[key][draw[i] % SKULL_LINES[key].length];

  const close = () => {
    if (closed.current) return; closed.current = true;
    stopMusic.current();
    window.dispatchEvent(new CustomEvent("reliquaire:duck", { detail: false }));
    onClose && onClose();
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("reliquaire:duck", { detail: true })); // la musique d'ambiance s'efface
    const t0 = performance.now();
    const id = setInterval(() => setT((performance.now() - t0) / 1000), 80);
    return () => { clearInterval(id); stopMusic.current(); window.dispatchEvent(new CustomEvent("reliquaire:duck", { detail: false })); };
  }, []);

  // Événements sonores et tactiles, une seule fois chacun
  useEffect(() => {
    const once = (k, at, fn) => { if (t >= at && !fired.current.has(k)) { fired.current.add(k); fn(); } };
    once("b1", 1.5, () => playSfx("cloche", 0.8));
    once("b2", 4.5, () => playSfx("cloche", 0.8));
    once("b3", 7.5, () => playSfx("cloche", 0.8));
    once("music", 9.5, () => { stopMusic.current = playLong("colosse", 0.65); });
    once("scan", 24, () => vibrate("de"));
    once("seal", 68, () => { playSfx("celebration", 0.9, "colosse"); setBurst(true); });
  }, [t]);

  const name = data.name;
  const lines = litany(data.faction, name, draw[0]);
  const acc = data.accent || "#b8922a";

  // Servo-crâne : arrive (20 s), scanne (24-36 s), parle, puis se retire (81 s)
  const skullIn = t >= 20, skullOut = t >= 81, scanning = t >= 24 && t < 36;
  const say = t >= 79 ? skull("retire", 6)
            : t >= 74 ? skull("consign", 5)
            : t >= 36 && t < 42 ? skull("ident", 4)(name)
            : t >= 31.5 && t < 36 ? skull("archive", 3)
            : t >= 27 && t < 31.5 ? skull("measure", 2)
            : t >= 22 && t < 27 ? skull("detect", 1)
            : null;
  const skullStyle = {
    position:"absolute", zIndex:5, width:`${SIZE}px`, height:`${SIZE}px`,
    left: skullOut ? "calc(100% + 80px)" : skullIn ? "calc(50% - 160px)" : "-130px",
    top: skullOut ? "-170px" : skullIn ? "14px" : "110px",
    transition: skullOut ? "left 2.5s ease-in, top 2.5s ease-in" : "left 2.6s cubic-bezier(.2,.8,.3,1), top 2.6s ease-out",
    animation: "skullBob 2.6s ease-in-out infinite", filter:"drop-shadow(0 4px 10px #000)",
  };
  const revealed = t >= 29, sealed = t >= 68;
  // Glas : la croix bat à chaque coup de cloche, puis s'efface quand le décret commence
  const toll = [1.5, 4.5, 7.5].reduce((m, b) => t >= b ? Math.max(m, Math.exp(-(t - b) / 0.9)) : m, 0);
  const frameIn = t >= 19.5;   // le cadre n'apparaît qu'à l'arrivée du servo-crâne (plus de cadre vide au début)
  const fade = (at, d = 1.2) => ({ opacity: t >= at ? 1 : 0, transform: t >= at ? "none" : "translateY(8px)", transition:`opacity ${d}s ease, transform ${d}s ease` });

  return createPortal(
    <div onClick={() => { if (t >= END) close(); }}
      style={{ position:"fixed", inset:0, zIndex:4800, background:"#000", overflow:"hidden", color:"#e8dfc0", textAlign:"center",
        opacity: t < 1.5 ? t / 1.5 : 1, fontFamily:"'Crimson Pro',serif", cursor: t >= END ? "pointer" : "default" }}>

      {/* Rayons de lumière derrière la relique */}
      <div style={{ position:"absolute", left:"50%", top:"40%", width:"900px", height:"900px", marginLeft:"-450px", marginTop:"-450px", pointerEvents:"none",
        background:`repeating-conic-gradient(from 0deg, ${acc}22 0deg 6deg, transparent 6deg 18deg)`, borderRadius:"50%",
        maskImage:"radial-gradient(circle, #000 0%, transparent 62%)", WebkitMaskImage:"radial-gradient(circle, #000 0%, transparent 62%)",
        opacity: revealed ? 1 : 0, transition:"opacity 4s ease", animation:"raysSpin 60s linear infinite" }} />

      {/* Passer (après 8 s) */}
      {t >= 8 && t < END && (
        <button onClick={(e) => { e.stopPropagation(); close(); }}
          style={{ position:"absolute", top:"calc(14px + env(safe-area-inset-top, 0px))", right:"14px", zIndex:6, background:"none", border:"1px solid #3a3020", color:"#8a7a5a", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"2px", padding:"6px 10px", cursor:"pointer" }}>PASSER ›</button>
      )}

      {/* Glas : la croix de la faction bat à chaque coup de cloche */}
      {t < 11.5 && (
        <div style={{ position:"absolute", left:0, right:0, top:"36%", pointerEvents:"none", opacity: t < 9.5 ? 1 : Math.max(0, 1 - (t - 9.5) / 1.5), transition:"opacity 0.3s linear" }}>
          <div style={{ color:acc, fontSize:"64px", lineHeight:1, opacity: 0.12 + 0.88 * toll, transform:`scale(${1 + 0.14 * toll})`, textShadow:`0 0 ${10 + 50 * toll}px ${acc}`, transition:"opacity 0.12s linear, transform 0.12s linear" }}>{data.icon || "✠"}</div>
        </div>
      )}

      <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", padding:"calc(40px + env(safe-area-inset-top, 0px)) 22px 30px", boxSizing:"border-box" }}>
        {/* Décret */}
        <Typed t={t} start={10} dur={3} text="PAR DÉCRET DU CHAPITRE" style={{ color:acc, fontFamily:"'Cinzel',serif", fontSize:"13px", letterSpacing:"5px", minHeight:"18px" }} />
        <Typed t={t} start={14} dur={4.5} text="Qu'il soit consigné que ce jour, une relique majeure a été consacrée." style={{ fontStyle:"italic", fontSize:"14px", color:"#c8b89a", marginTop:"8px", maxWidth:"320px", minHeight:"40px" }} />

        {/* Emplacement du servo-crâne et de sa bulle, au-dessus de la relique (la bulle ne recouvre plus la photo) */}
        <div style={{ position:"relative", zIndex:5, width:"100%", height:"86px", marginTop:"10px", flexShrink:0 }}>
          <div style={skullStyle}>
            {imgFailed ? <SkullSVG /> : <img src={IMG(scanning)} alt="" width={SIZE} height={SIZE} onError={() => setImgFailed(true)} style={{ display:"block" }} />}
            {/* Faisceau de scan qui balaie la relique */}
            {scanning && (
              <div style={{ position:"absolute", left:"39px", top:"27px", width:"160px", height:"300px", transformOrigin:"0 0", pointerEvents:"none",
                background:"linear-gradient(180deg, rgba(255,60,40,0.55), rgba(255,40,30,0))", clipPath:"polygon(0 0, 30% 100%, 90% 100%)",
                animation:"scanSweep 2.2s ease-in-out infinite alternate", filter:"blur(1px)" }} />
            )}
            {say && (
              <div key={say} style={{ position:"absolute", left:`${SIZE + 8}px`, top:"-6px", width:"200px", textAlign:"left", background:"rgba(10,8,6,0.94)", border:"1px solid #6a5a3a", padding:"7px 10px", fontStyle:"italic", fontSize:"13px", lineHeight:1.4, color:"#e0d4b4", animation:"viewFade 0.3s ease both", boxShadow:"0 4px 14px #000c" }}>{say}</div>
            )}
          </div>
        </div>

        {/* La relique */}
        <div style={{ position:"relative", width:"min(62vw, 250px, 30vh)", aspectRatio:"1", marginTop:"4px", flexShrink:0, border:`1px solid ${acc}88`, boxShadow: revealed ? `0 0 40px ${acc}55` : "none", background:"#050403",
          opacity: frameIn ? 1 : 0, transition:"opacity 1.5s ease, box-shadow 3s",
          animation: sealed ? "stampShake 0.4s ease-out both" : "none" }}>
          {/* La photo est rognée par le cadre pendant son apparition (elle ne déborde plus) */}
          <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, opacity: revealed ? 1 : 0, transform: revealed ? "scale(1)" : "scale(1.08)", filter: revealed ? "brightness(1)" : "brightness(0)", transition:"opacity 4s ease, transform 5s ease, filter 4s ease", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {data.photo
                ? <img src={data.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ color:acc, fontSize:"110px", textShadow:`0 0 30px ${acc}` }}>{data.icon || "✠"}</div>}
            </div>
          </div>
          {/* Sceau de pureté */}
          {sealed && <PuritySeal faction={data.faction} size={110} acc={acc} />}
        </div>

        {/* Nom gravé */}
        <div style={{ marginTop:"20px", minHeight:"72px" }}>
          <div style={{ fontFamily:"'Cinzel Decorative','Cinzel',serif", fontWeight:900, fontSize:"24px", letterSpacing:"3px", color:"#f4e4b0",
            textShadow:`0 2px 0 #000, 0 0 22px ${acc}88`, opacity: t >= 40 ? 1 : 0, transform: t >= 40 ? "scale(1)" : "scale(1.6)", filter: t >= 40 ? "blur(0)" : "blur(6px)", transition:"all 1.6s cubic-bezier(.2,.8,.3,1)" }}>{name.toUpperCase()}</div>
          <div style={{ ...fade(42.5), color:"#b8a882", fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"2px", marginTop:"6px" }}>
            {data.unitName !== name ? data.unitName.toUpperCase() + " · " : ""}{data.armyLabel.toUpperCase()} · {data.pts.toLocaleString("fr")} PTS
          </div>
          <div style={{ ...fade(44.5), color:"#8a7a5a", fontStyle:"italic", fontSize:"13px", marginTop:"4px" }}>{ORD(data.index)} colosse de ta collection</div>
        </div>

        {/* Litanie */}
        <div style={{ marginTop:"14px", maxWidth:"330px" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ ...fade(47 + i * 5, 2), fontStyle:"italic", fontSize:"15px", lineHeight:1.5, color:"#e0d4b4" }}>{l}</div>
          ))}
        </div>

        {/* Titres honorifiques */}
        {data.honors?.length > 0 && (
          <div style={{ ...fade(70.5), display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center", marginTop:"14px" }}>
            {data.honors.map(h => <span key={h} style={{ padding:"3px 9px", border:`1px solid ${acc}77`, background:`${acc}18`, color:"#e8d4a0", fontSize:"11px", fontFamily:"'Cinzel',serif", letterSpacing:"1px" }}>✦ {h}</span>)}
          </div>
        )}

        {/* Clôture */}
        <div style={{ marginTop:"auto", paddingTop:"12px" }}>
          <div style={{ ...fade(END), color:acc, fontFamily:"'Cinzel',serif", fontSize:"11px", letterSpacing:"3px" }}>CONSIGNÉ AU LIVRE DE LA CROISADE</div>
          <div style={{ ...fade(END + 2), color:"#7a6c52", fontFamily:"'Cinzel',serif", fontSize:"10px", letterSpacing:"3px", marginTop:"8px" }}>TOUCHER POUR CLORE LA CÉRÉMONIE</div>
        </div>
      </div>

      {burst && <GoldBurst big onDone={() => setBurst(false)} />}
    </div>,
    document.body
  );
}
