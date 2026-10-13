import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import "./PetPicker.css";

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#ffffff" />
    <path d="M12 7V17M7 12H17" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function PetPicker({ pets = [], value, onChange, onNotListed, notListedLabel = "No está en lista", notListedActive = false }) {
  return (
    <div className="pet-picker">
      {pets.map((pet) => (
        <button
          key={pet.id}
          type="button"
          className={`pet-picker__item ${value === pet.id ? "is-active" : ""}`}
          onClick={() => onChange?.(pet.id)}
        >
          <span className="pet-picker__avatar">
            {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <AvatarPlaceholder />}
          </span>
          <span className="pet-picker__name">{pet.name}</span>
        </button>
      ))}

      <button type="button" className={`pet-picker__item pet-picker__item--add ${notListedActive ? "is-active" : ""}`} onClick={onNotListed}>
        <PlusIcon />
        <span className="pet-picker__not-listed">{notListedLabel}</span>
      </button>
    </div>
  );
}

export default PetPicker;