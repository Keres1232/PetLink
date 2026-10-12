import StatusTag from "./StatusTag.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import "./PetCard.css";

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20H20M14.5 5.5L18.5 9.5M16.5 3.5C17.05 2.95 17.95 2.95 18.5 3.5L20.5 5.5C21.05 6.05 21.05 6.95 20.5 7.5L9 19H5V15L16.5 3.5Z"
      stroke="#AE77FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function PetCard({
  status = "Perdido",
  name = "Nombre",
  location = "Ubicación · hoy",
  photoUrl,
  onClick,
  onEdit,
}) {
  return (
    <article className="pet-card" onClick={onClick}>
      <div className="pet-card__body">

        {/* Foto (Foto1 / Rectangle 3) */}
        <div className="pet-card__photo">
          {photoUrl ? <img src={photoUrl} alt={name} /> : <AvatarPlaceholder />}
        </div>

        {/* Info (Info_Mascotas) */}
        <div className="pet-card__info">
          <StatusTag status={status} />

          <div className="pet-card__name-row">
            <h2 className="pet-card__name">{name}</h2>

            {/* Lápiz: solo en las mascotas propias (perfil) */}
            {onEdit && (
              <button
                type="button"
                className="pet-card__edit"
                aria-label={`Editar ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <PencilIcon />
              </button>
            )}
          </div>

          <p className="pet-card__location">{location}</p>
        </div>

      </div>
    </article>
  );
}

export default PetCard;
