import { useRef, useState } from "react";

const ZONE_PX = 80; // el gesto debe empezar en la parte de arriba de la hoja (barrita + encabezado)
const CLOSE_PX = 100; // distancia arrastrada para cerrar

/**
 * Cerrar una hoja inferior deslizándola hacia abajo.
 * Uso: const swipe = useSwipeToClose(onClose); <div className="x__sheet" {...swipe}>
 */
export default function useSwipeToClose(onClose) {
  const startY = useRef(null);
  const [dy, setDy] = useState(0);

  const onTouchStart = (e) => {
    const touchY = e.touches[0].clientY;
    const sheetTop = e.currentTarget.getBoundingClientRect().top;
    startY.current = touchY - sheetTop <= ZONE_PX ? touchY : null;
  };

  const onTouchMove = (e) => {
    if (startY.current === null) return;
    setDy(Math.max(0, e.touches[0].clientY - startY.current));
  };

  const onTouchEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (dy > CLOSE_PX) onClose?.();
    setDy(0);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
    style: dy > 0 ? { transform: `translateY(${dy}px)`, transition: "none" } : { transition: "transform 0.2s ease-out" },
  };
}
