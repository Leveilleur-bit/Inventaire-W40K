import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// ══════════════════════════════════════════════════════════
// EFFETS VISUELS : saisons de l'Accueil et gerbes de célébration
// ══════════════════════════════════════════════════════════
// Dessinés sur un canvas, sans bloquer les touchers. Mis en pause quand l'app est en
// arrière-plan, et désactivés si le téléphone demande de réduire les animations.

const reduceMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

// ── Saisons ──
// Chaque ambiance : nombre de particules, couleurs, taille, vitesse verticale (négative = monte),
// dérive horizontale, opacité, scintillement.
const SEASONS = {
  snow:   { n: 42, colors: ["#ffffff", "#e8eef5", "#dfe7f0"], size: [1.2, 3.2], vy: [0.25, 0.7],  vx: 0.25, alpha: [0.35, 0.8] },
  ash:    { n: 34, colors: ["#9a948c", "#7a746c", "#b8b0a4"], size: [0.8, 2.2], vy: [0.15, 0.45], vx: 0.35, alpha: [0.2, 0.5] },
  embers: { n: 30, colors: ["#ff9a3c", "#ffc060", "#ff6a2a"], size: [0.8, 2.0], vy: [-0.8, -0.3], vx: 0.3,  alpha: [0.35, 0.85], twinkle: true },
  pollen: { n: 26, colors: ["#e8e0a0", "#c8d890", "#f0e8c0"], size: [0.8, 1.8], vy: [-0.12, 0.12], vx: 0.18, alpha: [0.2, 0.55], twinkle: true },
  warp:   { n: 38, colors: ["#b070f0", "#60e0a0", "#d060d0"], size: [0.9, 2.4], vy: [-0.7, -0.2], vx: 0.45, alpha: [0.3, 0.85], twinkle: true },
  gold:   { n: 36, colors: ["#f4dc94", "#d4b060", "#fff0c0"], size: [0.8, 2.2], vy: [-0.25, 0.25], vx: 0.2,  alpha: [0.3, 0.9], twinkle: true },
  petals: { n: 22, colors: ["#c04060", "#e07090", "#a02848"], size: [2.0, 3.6], vy: [0.2, 0.55],  vx: 0.4,  alpha: [0.4, 0.8], petal: true },
};

// L'ambiance du jour : la fête en cours d'abord, sinon la saison.
export function seasonFor(date, festival) {
  const id = festival?.id || "";
  if (id === "warp") return "warp";
  if (id === "nouvelan" || id === "ascension" || id.startsWith("anniv")) return "gold";
  if (id === "devotion") return "petals";
  if (id === "vendredi13") return "ash";
  const m = date.getMonth();
  if (m === 11 || m <= 1) return "snow";      // décembre à février
  if (m <= 4) return "pollen";                // mars à mai
  if (m <= 7) return "embers";                // juin à août
  return "ash";                               // septembre à novembre
}

const rand = (a, b) => a + Math.random() * (b - a);

export function SeasonFX({ kind }) {
  const ref = useRef(null);
  useEffect(() => {
    const cfg = SEASONS[kind];
    const cv = ref.current;
    if (!cfg || !cv || reduceMotion()) return;
    const x = cv.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0;
    const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const spawn = (anywhere) => ({
      x: rand(0, W), y: anywhere ? rand(0, H) : (cfg.vy[0] < 0 ? H + 10 : -10),
      r: rand(...cfg.size), vy: rand(...cfg.vy), vx: rand(-cfg.vx, cfg.vx), a: rand(...cfg.alpha),
      c: cfg.colors[Math.floor(Math.random() * cfg.colors.length)], ph: rand(0, Math.PI * 2), rot: rand(0, Math.PI),
    });
    const ps = Array.from({ length: cfg.n }, () => spawn(true));
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(3, (now - last) / 16.7); last = now;
      x.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.ph += 0.02 * dt;
        p.x += (p.vx + Math.sin(p.ph) * 0.25) * dt; p.y += p.vy * dt; p.rot += 0.01 * dt;
        if (p.y > H + 12 || p.y < -12 || p.x < -12 || p.x > W + 12) Object.assign(p, spawn(false));
        const a = cfg.twinkle ? p.a * (0.6 + 0.4 * Math.sin(p.ph * 3)) : p.a;
        x.globalAlpha = a; x.fillStyle = p.c;
        if (cfg.petal) { x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.beginPath(); x.ellipse(0, 0, p.r * 1.6, p.r, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
        else {
          if (cfg.twinkle) { x.shadowColor = p.c; x.shadowBlur = 6; }
          x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
          x.shadowBlur = 0;
        }
      }
      x.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, [kind]);
  if (!SEASONS[kind]) return null;
  return <canvas ref={ref} aria-hidden="true" style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} />;
}

// ── Gerbe de poussière d'or (figurine peinte, promotion) ──
// big : pour les grosses pièces et les promotions, plus de particules et un halo.
export function GoldBurst({ big = false, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || reduceMotion()) { onDone && onDone(); return; }
    const x = cv.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = W / 2, cy = H * 0.42;
    const colors = ["#f4dc94", "#d4b060", "#fff4d0", "#b8922a"];
    const n = big ? 170 : 80;
    const ps = Array.from({ length: n }, () => {
      const ang = rand(0, Math.PI * 2), sp = rand(1.5, big ? 7.5 : 5.2);
      return { x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rand(0.5, 2.5), r: rand(0.9, big ? 3 : 2.4), c: colors[Math.floor(Math.random() * colors.length)], life: rand(0.75, 1) };
    });
    const dur = big ? 2600 : 2000; const t0 = performance.now(); let raf = 0;
    const tick = (now) => {
      const t = (now - t0) / dur;
      x.clearRect(0, 0, W, H);
      if (big && t < 0.6) { // halo qui s'ouvre puis s'éteint
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, 60 + t * 320);
        g.addColorStop(0, `rgba(244,220,148,${0.35 * (1 - t / 0.6)})`); g.addColorStop(1, "rgba(244,220,148,0)");
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      }
      for (const p of ps) {
        p.vy += 0.09; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy;
        const a = Math.max(0, p.life - t) / p.life;
        if (a <= 0) continue;
        x.globalAlpha = a; x.fillStyle = p.c; x.shadowColor = p.c; x.shadowBlur = 8;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1; x.shadowBlur = 0;
      if (t < 1) raf = requestAnimationFrame(tick); else onDone && onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(<canvas ref={ref} aria-hidden="true" style={{ position:"fixed", inset:0, width:"100vw", height:"100vh", pointerEvents:"none", zIndex:4600 }} />, document.body);
}
