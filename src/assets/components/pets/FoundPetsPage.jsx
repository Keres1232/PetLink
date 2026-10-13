import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import PetCard from "./PetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import "./PetListPage.css";

/**
 * "Ver más" de Mascotas encontradas (Inicio): todas las alertas de mascotas encontradas
 * activas a menos de `radiusKm`, la más nueva primero. Al tocar una se abre su ficha,
 * donde está "Contactar a quien la encontró".
 */
function FoundPetsPage({ pets = [], radiusKm = 20, onBack, onNotifications, onPetClick, onViewMap }) {
  return (
    <>
      <AppHeader
        title="Mascotas encontradas"
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={bellIcon}
        onRight={onNotifications}
      />

      <InfoNotice>
        ¿Reconoces a alguna? Ábrela y toca «Contactar a quien la encontró»: solo esa persona verá tu mensaje.
      </InfoNotice>

      {pets.length === 0 ? (
        <div className="pet-list__empty">
          <p>No hay mascotas encontradas a menos de {radiusKm} km por ahora.</p>
          {onViewMap && (
            <button type="button" className="pet-list__map-btn" onClick={onViewMap}>
              Ver el mapa
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="pet-list__count">
            {pets.length === 1 ? "1 mascota encontrada" : `${pets.length} mascotas encontradas`} a menos de {radiusKm} km
          </p>
          <div className="pet-list__grid">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                status="Encontrado"
                name={pet.name}
                location={pet.location}
                photoUrl={pet.photoUrl}
                onClick={() => onPetClick?.(pet)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default FoundPetsPage;
