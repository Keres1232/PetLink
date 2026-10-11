import { useState } from "react";
import PawBackground from "./PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import "./PermissionsModal.css";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6L18 18" stroke="var(--titulos, #7519FF)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function PermissionsModal({ open, onClose, onConfirm }) {
  const [data, setData] = useState(false);
  const [location, setLocation] = useState(false);

  useLockBodyScroll(open);

  const swipe = useSwipeToClose(onClose);

  if (!open) return null;

  return (
    <div className="perm__overlay" onClick={onClose}>
      <div className="perm__sheet" {...swipe} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <PawBackground contained />

        <span className="perm__handle" />

        <div className="perm__header">
          <div>
            <h2 className="perm__title">Permisos y preferencias</h2>
            <p className="perm__subtitle">Antes de crear tu cuenta, revisa y acepta lo siguiente.</p>
          </div>

          <button type="button" className="perm__close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div className="perm__card">
          <label className="perm__item">
            <input type="checkbox" checked={data} onChange={(e) => setData(e.target.checked)} />
            <span>
              Autorizo el tratamiento de mis datos personales para las finalidades descritas en la
              política. <b className="perm__tag">Obligatorio</b>
              <small>Cuando corresponda, con una autorización informada y verificable.</small>
            </span>
          </label>

          <label className="perm__item">
            <input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} />
            <span>
              Permitir el acceso a mi ubicación para las funciones que lo requieran.{" "}
              <b className="perm__tag">Opcional</b>
              <small>
                También puedes seleccionar manualmente la ubicación cuando esa alternativa esté
                disponible.
              </small>
            </span>
          </label>
        </div>

        <button
          type="button"
          className="perm__confirm"
          disabled={!data}
          onClick={() => onConfirm?.({ data, location })}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  );
}

export default PermissionsModal;