import { useState } from "react";
import SearchBar from "./SearchBar.jsx";
import PawBackground from "./PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import "./ListPickerModal.css";

// Quita tildes para que "bogota" encuentre "Bogotá" y "huron" encuentre "Hurón"
const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Hoja inferior con buscador y lista para elegir una opción (ciudad por defecto, especie…),
 * con el fondo lila y las huellas de la app. Se cierra deslizando hacia abajo.
 *
 * `items`: [{ id, label }] — `value` es el id elegido.
 */
function ListPickerModal({ open, title, subtitle, searchPlaceholder = "Buscar...", emptyText = "Sin resultados.", items = [], value, onClose, onSelect }) {
  const [query, setQuery] = useState("");

  useLockBodyScroll(open);

  const swipe = useSwipeToClose(onClose);

  if (!open) return null;

  const visible = items.filter((item) => normalize(item.label).includes(normalize(query)));

  const choose = (item) => {
    onSelect?.(item.id);
    setQuery("");
    onClose?.();
  };

  const close = () => {
    setQuery("");
    onClose?.();
  };

  return (
    <div className="city-picker__overlay" onClick={close}>
      <div className="city-picker__sheet" {...swipe} onClick={(e) => e.stopPropagation()}>
        <PawBackground contained />

        <span className="city-picker__handle" />

        <h2 className="city-picker__title">{title}</h2>
        {subtitle && <p className="city-picker__subtitle">{subtitle}</p>}

        <SearchBar value={query} onChange={setQuery} placeholder={searchPlaceholder} />

        <ul className="city-picker__list">
          {visible.length === 0 && <li className="city-picker__empty">{emptyText}</li>}

          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`city-picker__item ${value === item.id ? "is-active" : ""}`}
                onClick={() => choose(item)}
              >
                <span>{item.label}</span>
                {value === item.id && <span className="city-picker__check">✓</span>}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="city-picker__cancel" onClick={close}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default ListPickerModal;
