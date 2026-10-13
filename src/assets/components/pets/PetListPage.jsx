import AppHeader from "../shared/AppHeader.jsx";
import PetCard from "./PetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import "./PetListPage.css";

function PetListPage({ title, pets = [], onBack, onNotifications, onPetClick }) {
  return (
    <>
      <AppHeader
        title={title}
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={bellIcon}
        onRight={onNotifications}
      />

      {pets.length === 0 ? (
        <p className="pet-list__empty">Aún no hay publicaciones aquí.</p>
      ) : (
        <div className="pet-list__grid">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              status={pet.species}
              name={pet.name}
              location={pet.location}
              photoUrl={pet.photoUrl}
              publisherKind={pet.publisherKind}
              onClick={() => onPetClick?.(pet)}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default PetListPage;