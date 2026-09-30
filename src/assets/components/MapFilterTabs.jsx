import { useState } from "react";
import "./MapFilterTabs.css";

const FILTERS = ["Todo", "Perdidas", "Encontradas", "Veterinarias", "Refugios"];

function MapFilterTabs({ onChange }) {
  const [active, setActive] = useState("Todo");

  const handleSelect = (filter) => {
    setActive(filter);
    onChange?.(filter);
  };

  return (
    <div className="map-filters">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`map-filters__chip ${active === filter ? "is-active" : ""}`}
          onClick={() => handleSelect(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

export default MapFilterTabs;