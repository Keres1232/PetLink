import { useEffect } from "react";

// Cuántos modales tienen bloqueado el scroll (p. ej. la ficha se cierra y se abre el aviso)
let locks = 0;
let saved = null;

function lock() {
  if (locks++ > 0) return;

  const { body, documentElement: html } = document;
  const scrollY = window.scrollY;
  const scrollbar = window.innerWidth - html.clientWidth;

  saved = {
    scrollY,
    html: { overflow: html.style.overflow, overscroll: html.style.overscrollBehavior },
    body: {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    },
  };

  // overflow:hidden solo no basta en el WebView de Android ni en móviles:
  // se fija el body en su posición actual para que el fondo no se deslice
  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  // Evita el salto de ancho cuando desaparece la barra de scroll
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlock() {
  if (locks === 0 || --locks > 0 || !saved) return;

  const { body, documentElement: html } = document;
  html.style.overflow = saved.html.overflow;
  html.style.overscrollBehavior = saved.html.overscroll;
  Object.assign(body.style, saved.body);
  window.scrollTo(0, saved.scrollY); // vuelve a donde estaba
  saved = null;
}

// Bloquea el scroll de la página mientras `locked` sea true
export default function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return;
    lock();
    return unlock;
  }, [locked]);
}
