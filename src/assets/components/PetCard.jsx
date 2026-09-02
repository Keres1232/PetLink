import StatusTag from "./StatusTag.jsx";
import "./PetCard.css";

function PetCard({
  status = "Perdido",
  name = "Nombre",
  location = "Ubicación · hoy",
}) {
  return (
    <article className="pet-card">

      {/* Placeholder de la fotografía */}
      <div className="pet-card__photo">
        <span>Foto</span>
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