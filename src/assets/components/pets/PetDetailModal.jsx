import { useState } from "react";
import StatusTag from "./StatusTag.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import AdoptionPanel from "./AdoptionPanel.jsx";
import PawBackground from "../shared/PawBackground.jsx";
import PublishedBy from "./PublishedBy.jsx";
import AdoptionToggle from "./AdoptionToggle.jsx";
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

function PetDetailModal({ pet, myUserId, onClose, onContact, onAdoptionChanged, onGiveForAdoption, onRemoveFromAdoption }) {
  useLockBodyScroll(Boolean(pet));
  const swipe = useSwipeToClose(onClose);
  // Quién publicó (lo carga "Publicado por"): con eso se sabe si la ficha es tuya
  const [publisher, setPublisher] = useState({ petId: null, userId: null });
  
    if (!pet) return null;

  // Es tuya si lo dice la tarjeta (mascotas/adopciones) o si "Publicado por" resultó ser tu cuenta
  // El dueño ya viene en la tarjeta (ownerId, de reports_near / report_by_id); si no, lo averigua "Publicado por"
  const ownerId = pet.ownerId ?? (publisher.petId === pet.id ? publisher.userId : undefined);
  const publisherKnown = ownerId !== undefined;
  const isMine = Boolean(pet.isMine) || (Boolean(myUserId) && ownerId === myUserId);

  return (
    <div className="pet-detail__overlay" onClick={onClose}>
      <div className="pet-detail__sheet" {...swipe} onClick={(e) => e.stopPropagation()}>
        <PawBackground contained />
        <span className="pet-detail__handle" />

        <div className="pet-detail__scroll">
          <div className="pet-detail__photo">
            {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <AvatarPlaceholder />}
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

            <PublishedBy
              key={`publisher-${pet.id}`}
              pet={pet}
              myUserId={myUserId}
              onLoaded={(p) => setPublisher({ petId: pet.id, userId: p?.id ?? null })}
            />

            {/* Tu mascota registrada: darla en adopción, o quitarla si ya está publicada */}
            {pet.isMine && !pet.isReport && !pet.isAdopted && (
              <AdoptionToggle key={`adopt-${pet.id}`} pet={pet} onGive={onGiveForAdoption} onRemove={onRemoveFromAdoption} />
            )}

            {/* Mascota en adopción: pedir adoptarla, o (si es tuya) ver y responder a los interesados */}
            {pet.isAdoption && <AdoptionPanel key={`adoption-${pet.id}`} pet={pet} isOwner={pet.isMine} onChanged={onAdoptionChanged} />}

            {/* Contactar al dueño de una mascota en adopción: mensaje privado (le llega como interesado) */}
            {pet.isAdoption && !isMine && onContact && (
              <button type="button" className="pet-detail__contact" onClick={() => onContact(pet)}>
                Contactar al dueño
              </button>
            )}

            {/* Solo los reportes tienen dueño a quien escribir (vía su publicación en Comunidad).
                No se puede contactar a uno mismo: el botón sale cuando ya se sabe que la alerta es de otra persona */}
            {pet.postId && onContact && publisherKnown && !isMine && (
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