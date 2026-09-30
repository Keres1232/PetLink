import StatusTag from "./StatusTag.jsx";
import "./PetCard.css";

function PetCard({
  status = "Perdido",
  name = "Nombre",
  location = "Ubicación · hoy",
  photoUrl,
  onClick,
}) {
  return (
    <article className="pet-card" onClick={onClick}>
      <div className="pet-card__body">

        {/* Foto (Foto1 / Rectangle 3) */}
        <div className="pet-card__photo">
          {photoUrl ? (
            <img src={photoUrl} alt={name} />
          ) : (
            <span>Foto</span>
          )}
        </div>

        {/* Info (Info_Mascotas) */}
        <div className="pet-card__info">
          <StatusTag status={status} />

          <h2 className="pet-card__name">{name}</h2>

          <p className="pet-card__location">{location}</p>
        </div>

      </div>
    </article>
  );
}

export default PetCard;