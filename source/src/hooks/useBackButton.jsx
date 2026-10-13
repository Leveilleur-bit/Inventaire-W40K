import { useEffect, useRef } from 'react';

// ══════════════════════════════════════════════════════════
// MODAL CREATE LIST
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// MODAL ADD UNIT
// ══════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════
// HOOK: Bouton retour Android (history API)
// ══════════════════════════════════════════════════════════
// Pile centralisée des overlays ouverts. Le bouton retour Android ferme
// le plus récent, sans jamais manipuler l'historique de façon désynchronisée.
const __overlayStack = [];

let __overlayHistoryArmed = false;

function __armOverlayHistory() {
  if (__overlayHistoryArmed) return;
  __overlayHistoryArmed = true;
  window.history.pushState({ overlayGuard: true }, "");
}

function __onOverlayPop() {
  if (__overlayStack.length > 0) {
    // Fermer le plus récent overlay
    const top = __overlayStack[__overlayStack.length - 1];
    top.close && top.close();
    // Re-armer une entrée tant qu'il reste des overlays
    if (__overlayStack.length > 0) {
      window.history.pushState({ overlayGuard: true }, "");
    } else {
      __overlayHistoryArmed = false;
    }
  } else {
    __overlayHistoryArmed = false;
  }
}

if (typeof window !== "undefined" && !window.__overlayPopBound) {
  window.__overlayPopBound = true;
  window.addEventListener("popstate", () => __onOverlayPop());
}

export function useBackButton(isOpen, onClose) {
  const cbRef = useRef(onClose);
  cbRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const entry = { close: () => cbRef.current && cbRef.current() };
    __overlayStack.push(entry);
    __armOverlayHistory();
    return () => {
      const idx = __overlayStack.indexOf(entry);
      if (idx !== -1) __overlayStack.splice(idx, 1);
      if (__overlayStack.length === 0) __overlayHistoryArmed = false;
    };
  }, [isOpen]);
}
