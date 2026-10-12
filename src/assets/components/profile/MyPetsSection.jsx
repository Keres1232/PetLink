import PetCard from "../pets/PetCard.jsx";
import PillButton from "../shared/PillButton.jsx";
import masIcon from "../../svg/Mas.svg";
import "./MyPetsSection.css";

function MyPetsSection({ pets = [], onEnroll, onPetClick, onEdit }) {
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
            status={pet.status}
            name={pet.name}
            location={pet.breed || "Raza sin registrar"}
            photoUrl={pet.photoUrl}
            onClick={() => onPetClick?.(pet)}
            onEdit={onEdit ? () => onEdit(pet) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default MyPetsSection;