import { useEffect, useRef, useState } from "react";
import PawLoader from "./PawLoader.jsx";
import "./PullToRefresh.css";

const TRIGGER = 70; // px (ya amortiguados) para que al soltar recargue
const MAX_PULL = 110;
const MIN_SPIN_MS = 600; // que la huella se vea aunque la recarga sea instantánea

/**
 * "Desliza hacia abajo para recargar": estando arriba del todo, arrastrar hacia abajo muestra la
 * huella y al soltar llama `onRefresh` (async). No se activa con una ventana abierta (scroll
 * bloqueado), ni al arrastrar el mapa o un carrusel (`[data-no-pull]`, movimiento horizontal).
 */
function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false); // mientras el dedo arrastra no hay transición
  const gesture = useRef(null); // { startX, startY, active }
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    const blocked = (target) =>
      document.body.style.position === "fixed" || // useLockBodyScroll: hay una ventana abierta
      target?.closest?.(".leaflet-container, [data-no-pull], input, textarea, select");

    const setPullBoth = (v) => {
      pullRef.current = v;
      setPull(v);
    };

    const onStart = (e) => {
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length !== 1 || blocked(e.target)) {
        gesture.current = null;
        return;
      }
      gesture.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, active: false };
    };

    const onMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      if (!g.active) {
        // Solo si el gesto es claramente hacia abajo (no un carrusel ni subir la página)
        if (Math.abs(dx) > Math.abs(dy) || dy < 8 || window.scrollY > 0) {
          if (Math.abs(dx) > 10 || dy < -4) gesture.current = null;
          return;
        }
        g.active = true;
        setDragging(true);
      }
      setPullBoth(Math.min(MAX_PULL, Math.max(0, dy * 0.5)));
    };

    const onEnd = async () => {
      const g = gesture.current;
      gesture.current = null;
      if (!g?.active) return;
      setDragging(false);
      if (pullRef.current < TRIGGER) return setPullBoth(0);

      refreshingRef.current = true;
      setRefreshing(true);
      setPullBoth(TRIGGER);
      const started = Date.now();
      try {
        await onRefreshRef.current?.();
      } catch (err) {
        console.error("No se pudo recargar", err);
      } finally {
        const wait = MIN_SPIN_MS - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        refreshingRef.current = false;
        setRefreshing(false);
        setPullBoth(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const ready = pull >= TRIGGER;
  const label = refreshing ? "Actualizando…" : ready ? "Suelta para recargar" : "Desliza para recargar";

  return (
    <>
      <div
        className={`ptr__indicator ${pull > 0 || refreshing ? "is-visible" : ""} ${dragging ? "" : "is-settling"}`}
        style={{ transform: `translate(-50%, ${pull - 60}px)`, opacity: Math.min(1, pull / TRIGGER) }}
        aria-hidden={!refreshing}
      >
        <div className={`ptr__bubble ${refreshing ? "is-spinning" : ""}`} style={{ "--ptr-turn": `${(pull / TRIGGER) * 180}deg` }}>
          <PawLoader size={30} label="" />
        </div>
        <span className="ptr__label">{label}</span>
      </div>
      {children}
    </>
  );
}

export default PullToRefresh;
