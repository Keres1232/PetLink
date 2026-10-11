import { useState } from "react";
import SearchBar from "../shared/SearchBar.jsx";
import PawBackground from "../shared/PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import "./CityPickerModal.css";

const CITIES = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Manizales",
  "Villavicencio",
  "Pasto",
  "Neiva",
  "Armenia",
  "Montería",
  "Valledupar",
  "Popayán",
  "Sincelejo",
  "Tunja",
  "Riohacha",
  "Florencia",
  "Quibdó",
  "Yopal",
];

// Quita tildes para que "bogota" encuentre "Bogotá"
const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function CityPickerModal({ open, value, onClose, onSelect }) {
  const [query, setQuery] = useState("");

  useLockBodyScroll(open);

  const swipe = useSwipeToClose(onClose);

  if (!open) return null;

  const visible = CITIES.filter((c) => normalize(c).includes(normalize(query)));

  const choose = (city) => {
    onSelect?.(city);
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

        <h2 className="city-picker__title">Ciudad por defecto</h2>
        <p className="city-picker__subtitle">Elige la ciudad donde quieres ver publicaciones.</p>

        <SearchBar value={query} onChange={setQuery} placeholder="Busca tu ciudad..." />

        <ul className="city-picker__list">
          {visible.length === 0 && (
            <li className="city-picker__empty">No encontramos esa ciudad.</li>
          )}

          {visible.map((city) => (
            <li key={city}>
              <button
                type="button"
                className={`city-picker__item ${value === city ? "is-active" : ""}`}
                onClick={() => choose(city)}
              >
                <span>{city}</span>
                {value === city && <span className="city-picker__check">✓</span>}
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

export default CityPickerModal;