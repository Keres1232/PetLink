import { Pencil } from "lucide-react";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import StatusTag from "./StatusTag.jsx";
import { PUBLISHER_LABEL } from "../lib/publisher";
import "./PetCard.css";

/**
 * @param {{
 *   status?: string;
 *   name?: string;
 *   location?: string;
 *   photoUrl?: string;
 *   onClick?: () => void;
 *   onEdit?: (() => void) | null;
 *   publisherKind?: "clinic" | "shelter" | "doctor" | null;
 * }} props
 */
function PetCard({
  status = "Perdido",
  name = "Nombre",
  location = "Ubicación · hoy",
  photoUrl = "",
  onClick = () => {},
  onEdit = null,
  publisherKind = null,
}) {
  const interactive = Boolean(onClick);
  const publisherLabel = publisherKind ? PUBLISHER_LABEL[publisherKind] : null;

  return (
    <article
      className="pet-card"
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="pet-card__photo">
        {photoUrl ? (
          <img src={photoUrl} alt={name} loading="lazy" decoding="async" />
        ) : (
          <AvatarPlaceholder />
        )}
        {publisherLabel && (
          <span className={`pet-card__publisher pet-card__publisher--${publisherKind}`}>
            ✓ {publisherLabel}
          </span>
        )}
      </div>

      <div className="pet-card__info">
        <StatusTag status={status} />

        <div className="pet-card__name-row">
          <h2 className="pet-card__name">{name}</h2>

          {onEdit && (
            <button
              type="button"
              className="pet-card__edit"
              aria-label={`Editar ${name}`}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            >
              <Pencil size={15} />
            </button>
          )}
        </div>

        <p className="pet-card__location">{location}</p>
      </div>
    </article>
  );
}

export default PetCard;
