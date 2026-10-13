import { useMemo, useState } from "react";
import ChipGroup from "./ChipGroup.jsx";
import ListPickerModal from "./ListPickerModal.jsx";
import { isOtherEntry, splitSpecies } from "../../../lib/species";
import dogIcon from "../../svg/Inscribir/perro.svg";
import catIcon from "../../svg/Inscribir/gato.svg";
import "./SpeciesPicker.css";

const OTHER = "__otro__";

const heartIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20.5C12 20.5 3 15.5 3 9C3 6 5.5 4 8 4C10 4 11.3 5.2 12 6.3C12.7 5.2 14 4 16 4C18.5 4 21 6 21 9C21 15.5 12 20.5 12 20.5Z"
      stroke="#7519FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Especie: botones Perro / Gato / Otro (en ese orden). "Otro" despliega una lista con el resto
 * del catálogo (Ave, Conejo, Hámster, Tortuga…) en una hoja con buscador, igual que la de ciudades.
 */
function SpeciesPicker({ species = [], value, onChange }) {
  const { dog, cat, others } = useMemo(() => splitSpecies(species), [species]);
  const valueIsOther = Boolean(value) && value !== dog?.id && value !== cat?.id;
  const [otherChosen, setOtherChosen] = useState(valueIsOther);
  const [listOpen, setListOpen] = useState(false);
  const showField = (otherChosen || valueIsOther) && others.length > 0;
  const selectedOther = others.find((s) => s.id === value);

  const chips = [
    dog && { id: dog.id, label: "Perro", icon: dogIcon },
    cat && { id: cat.id, label: "Gato", icon: catIcon },
    others.length > 0 && { id: OTHER, label: "Otro", icon: heartIcon },
  ].filter(Boolean);

  const pick = (id) => {
    if (id !== OTHER) {
      setOtherChosen(false);
      onChange?.(id);
      return;
    }
    setOtherChosen(true);
    // Para que el formulario siga siendo válido se elige "Otro" hasta que escoja una de la lista
    if (!valueIsOther) onChange?.((others.find((s) => isOtherEntry(s.name)) ?? others[0]).id);
    setListOpen(true);
  };

  return (
    <div className="species-picker">
      <ChipGroup options={chips} value={showField ? OTHER : value} onChange={pick} />

      {showField && (
        <button type="button" className="species-picker__field" onClick={() => setListOpen(true)}>
          <span className="species-picker__hint">¿Qué animal es?</span>
          <span className="species-picker__value">{selectedOther?.name ?? "Elige la especie"}</span>
          <span className="species-picker__chevron" aria-hidden="true">›</span>
        </button>
      )}

      <ListPickerModal
        open={listOpen}
        title="¿Qué animal es?"
        subtitle="Elige la especie de la mascota."
        searchPlaceholder="Busca la especie..."
        emptyText="No encontramos esa especie. Elige «Otro»."
        items={others.map((s) => ({ id: s.id, label: s.name }))}
        value={value}
        onClose={() => setListOpen(false)}
        onSelect={(id) => onChange?.(id)}
      />
    </div>
  );
}

export default SpeciesPicker;
