import PetCard from "./PetCard.jsx";
import PillButton from "./PillButton.jsx";
import masIcon from "../svg/Mas.svg";
import "./MyPetsSection.css";

function MyPetsSection({ pets = [], onEnroll, onPetClick }) {
  return (
    <section className="my-pets">
      <div className="my-pets__header">
        <h2 className="my-pets__title">Mis mascotas</h2>

        <PillButton
          icon={masIcon}
          iconAlt="Agregar"
          label="Inscribir"
          onClick={onEnroll}
        />
      </div>

      <div className="my-pets__grid">
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            status={pet.species}
            name={pet.name}
            location={pet.location}
            photoUrl={pet.photoUrl}
            onClick={() => onPetClick?.(pet)}
          />
        ))}
      </div>
    </section>
  );
}

export default MyPetsSection;