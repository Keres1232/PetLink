import { CheckCircle2, PawPrint } from "lucide-react";
import type { Pet } from "../lib/types";
import "./PetSelectCard.css";

interface Props {
  pet: Pet;
  selected: boolean;
  onSelect: () => void;
}

export default function PetSelectCard({ pet, selected, onSelect }: Props) {
  const subtitle = [pet.species?.name, pet.breed].filter(Boolean).join(" · ") || "Mascota";

  return (
    <button
      type="button"
      className={`pet-select ${selected ? "pet-select--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="pet-select__photo" aria-hidden="true">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt="" />
        ) : (
          <PawPrint size={22} />
        )}
      </span>
      <span className="pet-select__info">
        <strong>{pet.name}</strong>
        <small>{subtitle}</small>
      </span>
      {selected && <CheckCircle2 size={20} className="pet-select__check" aria-hidden="true" />}
    </button>
  );
}
