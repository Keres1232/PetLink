import editIcon from "../svg/edit_icono.svg";
import pawIcon from "../svg/Huella.svg";
import "./ProfileCard.css";

function ProfileCard({
  name = "Nombre Apellido",
  location = "Ciudad, País",
  memberLabel = "Miembro",
  photoUrl,
  onEditPhoto,
}) {
  return (
    <article className="profile-card">
      <div className="profile-card__inner">

        {/* Foto */}
        <div className="profile-card__photo">
          <div className="profile-card__avatar">
            {photoUrl && (
              <img src={photoUrl} alt={name} />
            )}
          </div>

          <button
            type="button"
            className="profile-card__edit"
            onClick={onEditPhoto}
            aria-label="Editar foto de perfil"
          >
            <img src={editIcon} alt="" className="profile-card__edit-icon" />
          </button>
        </div>

        {/* Info */}
        <div className="profile-card__info">
          <h2 className="profile-card__name">{name}</h2>
          <p className="profile-card__location">{location}</p>

          <span className="profile-card__badge">
            <img src={pawIcon} alt="" className="profile-card__badge-icon" />
            {memberLabel}
          </span>
        </div>

      </div>
    </article>
  );
}

export default ProfileCard;