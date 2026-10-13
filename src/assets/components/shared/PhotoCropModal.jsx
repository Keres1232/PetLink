import { useEffect, useMemo, useRef, useState } from "react";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import PawBackground from "./PawBackground.jsx";
import "./PhotoCropModal.css";

// Forma de la foto en la ficha expandida (PetDetailModal: 393 × 215). Las tarjetas usan casi la misma.
const CARD_PHOTO_ASPECT = 393 / 215;
const OUTPUT_WIDTH = 1080; // ancho de la foto que se sube
const MAX_ZOOM = 3;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Flecha circular (girar a la derecha; `flip` = a la izquierda)
const RotateIcon = ({ flip = false }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * "Ajusta la foto": antes de subirla, el usuario mueve (arrastrando), acerca (barra) y gira (90°) la imagen
 * dentro de un marco con la forma de la foto de la ficha. Se sube YA recortada, así que en las
 * tarjetas y en la ficha expandida se ve exactamente esa parte (sin guardar nada extra en la BD).
 *
 * `file`: la foto elegida (null = cerrado). `onDone(fileRecortado)` / `onCancel()`.
 */
/**
 * Foto de perfil: `round` = marco circular 1:1 (así se ve el avatar) y salida de 600 px.
 */
function PhotoCropModal({
  file,
  aspect: aspectProp,
  round = false,
  subtitle = "Arrastra para elegir qué parte se verá en la ficha de la mascota.",
  onDone,
  onCancel,
}) {
  const aspect = aspectProp ?? (round ? 1 : CARD_PHOTO_ASPECT);
  const outputWidth = round ? 600 : OUTPUT_WIDTH;
  useLockBodyScroll(Boolean(file));
  const fileSrc = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  // Foto girada (se genera con un canvas); va ligada a su archivo para no mezclarla con la siguiente
  const [rotated, setRotated] = useState(null); // { file, url }
  const src = rotated?.file === file ? rotated.url : fileSrc;
  const [natural, setNatural] = useState(null); // { w, h }
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // esquina de la imagen dentro del marco (px)
  const [busy, setBusy] = useState(false);
  const imgRef = useRef(null);
  const drag = useRef(null);

  // Marco: el ancho de la pantalla (con márgenes), hasta 360 px
  const frameW = Math.min((typeof window !== "undefined" ? window.innerWidth : 393) - 48, round ? 280 : 360);
  const frameH = Math.round(frameW / aspect);

  useEffect(() => () => fileSrc && URL.revokeObjectURL(fileSrc), [fileSrc]);
  useEffect(() => () => rotated && URL.revokeObjectURL(rotated.url), [rotated]);

  if (!file) return null;

  const cover = natural ? Math.max(frameW / natural.w, frameH / natural.h) : 1;
  const scale = cover * zoom;
  const imgW = natural ? natural.w * scale : frameW;
  const imgH = natural ? natural.h * scale : frameH;

  // La imagen siempre cubre el marco: no se puede dejar un borde vacío
  const fit = (p, w = imgW, h = imgH) => ({ x: clamp(p.x, frameW - w, 0), y: clamp(p.y, frameH - h, 0) });

  const onLoad = (e) => {
    const n = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
    const s = Math.max(frameW / n.w, frameH / n.h);
    setNatural(n);
    setZoom(1);
    setPos({ x: (frameW - n.w * s) / 2, y: (frameH - n.h * s) / 2 }); // centrada
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, from: pos };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const { startX, startY, from } = drag.current;
    setPos(fit({ x: from.x + e.clientX - startX, y: from.y + e.clientY - startY }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Acercar manteniendo el centro del marco en el mismo punto de la foto
  const changeZoom = (next) => {
    if (!natural) return;
    const z = clamp(next, 1, MAX_ZOOM);
    const cx = (frameW / 2 - pos.x) / scale;
    const cy = (frameH / 2 - pos.y) / scale;
    const s = cover * z;
    setZoom(z);
    setPos(fit({ x: frameW / 2 - cx * s, y: frameH / 2 - cy * s }, natural.w * s, natural.h * s));
  };

  // Girar 90° (dir = 1 derecha, -1 izquierda): se dibuja la foto rotada y se vuelve a encuadrar centrada
  const rotate = async (dir) => {
    const img = imgRef.current;
    if (!natural || busy || !img) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = natural.h;
      canvas.height = natural.w;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((dir * Math.PI) / 2);
      ctx.drawImage(img, -natural.w / 2, -natural.h / 2);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (blob) setRotated({ file, url: URL.createObjectURL(blob) });
    } catch (e) {
      console.error("No se pudo girar la foto", e);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!natural || busy) return;
    setBusy(true);
    try {
      // Parte de la foto original que se ve en el marco
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const sw = frameW / scale;
      const sh = frameH / scale;
      const outW = Math.min(outputWidth, Math.round(sw));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      canvas.getContext("2d").drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
      if (!blob) throw new Error("No se pudo recortar la foto.");
      const name = (file.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
      onDone?.(new File([blob], name, { type: "image/jpeg" }));
    } catch (e) {
      console.error(e);
      onDone?.(file); // si algo falla se usa la foto completa
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="photo-crop__overlay">
      <div className="photo-crop__sheet">
        <PawBackground contained />

        <h2 className="photo-crop__title">Ajusta la foto</h2>
        <p className="photo-crop__subtitle">{subtitle}</p>

        <div
          className={`photo-crop__frame ${round ? "photo-crop__frame--round" : ""}`}
          style={{ width: frameW, height: frameH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => changeZoom(zoom - e.deltaY * 0.002)}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={onLoad}
              className="photo-crop__img"
              style={{ width: imgW, height: imgH, transform: `translate(${pos.x}px, ${pos.y}px)` }}
            />
          )}
        </div>

        <label className="photo-crop__zoom">
          <span aria-hidden="true">−</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="Acercar foto"
          />
          <span aria-hidden="true">+</span>
        </label>

        <div className="photo-crop__rotate">
          <button type="button" disabled={!natural || busy} onClick={() => void rotate(-1)} aria-label="Girar a la izquierda">
            <RotateIcon flip />
            Girar
          </button>
          <button type="button" disabled={!natural || busy} onClick={() => void rotate(1)} aria-label="Girar a la derecha">
            Girar
            <RotateIcon />
          </button>
        </div>

        <button type="button" className="photo-crop__done" disabled={!natural || busy} onClick={() => void confirm()}>
          {busy ? "Preparando..." : "Usar foto"}
        </button>
        <button type="button" className="photo-crop__cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default PhotoCropModal;
