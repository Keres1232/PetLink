import "./VetCard.css";

const PhoneIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
      fill="white"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    width="10"
    height="11"
    viewBox="0 0 10 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 0C2.79 0 1 1.77 1 3.95C1 6.99 5 11 5 11C5 11 9 6.99 9 3.95C9 1.77 7.21 0 5 0ZM5 5.4C4.2 5.4 3.55 4.75 3.55 3.95C3.55 3.15 4.2 2.5 5 2.5C5.8 2.5 6.45 3.15 6.45 3.95C6.45 4.75 5.8 5.4 5 5.4Z"
      fill="#A8A8A8"
    />
  </svg>
);

function VetCard({
  name = "Nombre del negocio",
  info = "Información · distancia",
  photoUrl,
  badge,
  onCall,
}) {
  return (
    <article className="vet-card">
      <div className="vet-card__content">

        {/* Foto + Información */}
        <div className="vet-card__main">

          {/* Foto / placeholder */}
          <div className="vet-card__photo">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                width="58"
                height="50"
                style={{ borderRadius: "8px", objectFit: "cover" }}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="58"
                height="50"
                viewBox="0 0 58 50"
                fill="none"
              >
                <rect x="3" y="2" width="50" height="45" rx="8" fill="#D9D9D9" />
              </svg>
            )}
          </div>

          {/* Nombre + Ubicación */}
          <div className="vet-card__info">
            <h3 className="vet-card__name">{name}</h3>
            <p className="vet-card__location">
              <LocationIcon />
              <span>{info}</span>
            </p>
          </div>

        </div>

        {/* Badge (ej: "HOY") o botón llamar */}
        {badge ? (
          <span className="vet-card__badge">{badge}</span>
        ) : (
          <button
            type="button"
            className="vet-card__call"
            onClick={onCall}
            aria-label={`Llamar a ${name}`}
          >
            <span className="vet-card__call-icon">
              <PhoneIcon />
            </span>
          </button>
        )}

      </div>
    </article>
  );
}

export default VetCard;