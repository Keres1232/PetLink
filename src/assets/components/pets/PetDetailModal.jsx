import StatusTag from "./StatusTag.jsx";
import PawBackground from "../shared/PawBackground.jsx";
import pawIcon from "../../svg/ExpCard/huella_card.svg";
import starIcon from "../../svg/ExpCard/stard_card.svg";
import clockIcon from "../../svg/ExpCard/relog_card.svg";
import genderIcon from "../../svg/ExpCard/genero_card.svg";
import sizeIcon from "../../svg/ExpCard/tamaño_card.svg";
import colorIcon from "../../svg/ExpCard/Color_card.svg";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import "./PetDetailModal.css";

function InfoItem({ icon, label, value }) {
  return (
    <div className="pet-detail__item">
      <span className="pet-detail__item-icon">
        <img src={icon} alt="" />
      </span>
      <span className="pet-detail__item-text">
        <span className="pet-detail__item-label">{label}</span>
        <span className="pet-detail__item-value">{value || "—"}</span>
      </span>
    </div>
  );
}

function PetDetailModal({ pet, onClose, onContact }) {
  useLockBodyScroll(Boolean(pet));
  const swipe = useSwipeToClose(onClose);
  
    if (!pet) return null;

  return (
    <div className="pet-detail__overlay" onClick={onClose}>
      <div className="pet-detail__sheet" {...swipe} onClick={(e) => e.stopPropagation()}>
        <PawBackground contained />
        <span className="pet-detail__handle" />

        <div className="pet-detail__scroll">
          <div className="pet-detail__photo">
            {pet.photoUrl && <img src={pet.photoUrl} alt={pet.name} />}
          </div>

          <div className="pet-detail__body">
            <div className="pet-detail__head">
              <div>
                <h2 className="pet-detail__name">{pet.name}</h2>
                <p className="pet-detail__location">{pet.location}</p>
              </div>
              <StatusTag status={pet.status ?? pet.species} />
            </div>

            <h3 className="pet-detail__section">Información</h3>

            <div className="pet-detail__grid">
              <InfoItem icon={pawIcon} label="Especie" value={pet.species} />
              <InfoItem icon={starIcon} label="Raza" value={pet.breed} />
              <InfoItem icon={clockIcon} label="Edad" value={pet.age} />
              <InfoItem icon={genderIcon} label="Sexo" value={pet.sex} />
              <InfoItem icon={sizeIcon} label="Tamaño" value={pet.size} />
              <InfoItem icon={colorIcon} label="Color" value={pet.color} />
            </div>

            <h3 className="pet-detail__section">Señas particulares</h3>
            <p className="pet-detail__marks">{pet.marks || "Sin señas registradas."}</p>

            {/* Solo los reportes tienen dueño a quien escribir (vía su publicación en Comunidad) */}
            {pet.postId && onContact && (
              <button type="button" className="pet-detail__contact" onClick={() => onContact(pet)}>
                {pet.status === "Encontrado" ? "Contactar a quien la encontró" : "Contactar al dueño"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PetDetailModal;