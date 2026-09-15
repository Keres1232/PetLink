import StatusTag from "./StatusTag.jsx";
import "./PetCard.css";

function PetCard({
  status = "Perdido",
  name = "Nombre",
  location = "Ubicación · hoy",
  photoUrl = "",
  onClick = () => {},
}) {
  return (
    <article className="pet-card" onClick={onClick}>

      {/* Placeholder de la fotografía */}
      <div className="pet-card__photo">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
          />
        ) : (
          <span>Foto</span>
        )}
      </div>

      {/* Información de la mascota */}
      <div className="pet-card__info">

        {/* Estado de la publicación */}
        <StatusTag status={status} />

        {/* Nombre */}
        <h2 className="pet-card__name">
          {name}
        </h2>

        {/* Ubicación */}
        <p className="pet-card__location">
          {location}
        </p>

      </div>

    </article>
  );
}

export default PetCard;