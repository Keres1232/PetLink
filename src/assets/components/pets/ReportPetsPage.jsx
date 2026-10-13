import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import PetCard from "./PetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import "./PetListPage.css";

const TEXT = {
  lost: {
    title: "Mascotas perdidas",
    status: "Perdido",
    notice: "¿Viste a alguna? Ábrela y toca «Contactar al dueño»: solo su familia verá tu mensaje.",
    one: "1 mascota perdida",
    many: (n) => `${n} mascotas perdidas`,
    empty: "No hay mascotas perdidas",
  },
  found: {
    title: "Mascotas encontradas",
    status: "Encontrado",
    notice: "¿Reconoces a alguna? Ábrela y toca «Contactar a quien la encontró»: solo esa persona verá tu mensaje.",
    one: "1 mascota encontrada",
    many: (n) => `${n} mascotas encontradas`,
    empty: "No hay mascotas encontradas",
  },
};

/**
 * "Ver más" de Mascotas perdidas / encontradas (Inicio): todas las alertas activas de ese tipo
 * a menos de `radiusKm`, la más nueva primero. Al tocar una se abre su ficha, donde está el
 * botón para contactar en privado a quien la publicó.
 */
function ReportPetsPage({ kind = "found", pets = [], radiusKm = 20, onBack, onNotifications, onPetClick, onViewMap }) {
  const t = TEXT[kind] ?? TEXT.found;

  return (
    <>
      <AppHeader title={t.title} leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <InfoNotice>{t.notice}</InfoNotice>

      {pets.length === 0 ? (
        <div className="pet-list__empty">
          <p>
            {t.empty} a menos de {radiusKm} km por ahora.
          </p>
          {onViewMap && (
            <button type="button" className="pet-list__map-btn" onClick={onViewMap}>
              Ver el mapa
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="pet-list__count">
            {pets.length === 1 ? t.one : t.many(pets.length)} a menos de {radiusKm} km
          </p>
          <div className="pet-list__grid">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                status={t.status}
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

export default ReportPetsPage;
