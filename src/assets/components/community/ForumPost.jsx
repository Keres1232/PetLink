import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import RoleBadge from "../shared/RoleBadge.jsx";
import likesIcon from "../../svg/Likes.svg";
import commentsIcon from "../../svg/uil_comments.svg";
import "./ForumPost.css";

// Mismo corazón que Likes.svg; relleno morado cuando el usuario ya dio me gusta
const HeartIcon = ({ filled }) => (
  <svg className="forum-post__icon" viewBox="0 0 14 13" fill="none" aria-hidden="true">
    <path
      d="M6.99989 2.13655C4.53855 -0.49478 0.923887 1.81789 1.00122 5.24722C1.04655 7.28722 2.64433 9.24278 5.79455 11.1139C5.97722 11.2226 6.26522 11.3872 6.51455 11.5272C6.66271 11.611 6.83002 11.655 7.00022 11.655C7.17042 11.655 7.33773 11.611 7.48589 11.5272C7.73455 11.3872 8.02255 11.2226 8.20589 11.1139C11.3548 9.24278 12.9526 7.28722 12.9992 5.24722C13.0759 1.81789 9.46122 -0.49478 6.99989 2.13655Z"
      stroke={filled ? "#AE77FF" : "#66557E"}
      fill={filled ? "#AE77FF" : "none"}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

function ForumPost({
  userName = "Usuario",
  timeAgo = "hace 2 horas",
  category = "Pregunta",
  question = "",
  likes = 0,
  replies = 0,
  avatarUrl,
  imageUrl,
  liked = false,
  onLike,
  onClick,
  alert, // alerta de mascota: { lost, title, details, onOpen } (contexto + botón a la ficha)
  roleBadge, // rol especial del autor: "clinic" | "shelter" | "vet" | "admin"
}) {
  return (
    <article className="forum-post" onClick={onClick}>
      <div className="forum-post__profile">
        <div className="forum-post__avatar">
          {avatarUrl ? <img src={avatarUrl} alt={userName} /> : <AvatarPlaceholder />}
        </div>

        <div className="forum-post__name-time">
          <p className="forum-post__name">
            {userName} <RoleBadge kind={roleBadge} />
          </p>
          <p className="forum-post__time">{timeAgo}</p>
        </div>
      </div>

      <span className={`forum-post__tag ${alert ? `forum-post__tag--${alert.lost ? "lost" : "found"}` : ""}`}>{category}</span>

      {/* Alerta de mascota perdida / encontrada: qué pasó y con qué mascota */}
      {alert && (
        <div className={`forum-post__alert forum-post__alert--${alert.lost ? "lost" : "found"}`}>
          <span className="forum-post__alert-kind">{alert.lost ? "Mascota perdida" : "Mascota encontrada"}</span>
          <p className="forum-post__alert-title">{alert.title}</p>
          {alert.details && <p className="forum-post__alert-details">{alert.details}</p>}
        </div>
      )}

      {alert && question ? (
        <p className="forum-post__question">
          <strong>{alert.lost ? "Se perdió en: " : "La encontraron en: "}</strong>
          {question}
        </p>
      ) : (
        <p className="forum-post__question">{question}</p>
      )}

      {/* Imagen de la publicación: siempre visible dentro de la tarjeta */}
      {imageUrl && <img className="forum-post__image" src={imageUrl} alt="" loading="lazy" />}

      {alert?.onOpen && (
        <button
          type="button"
          className="forum-post__alert-open"
          onClick={(e) => {
            e.stopPropagation();
            alert.onOpen();
          }}
        >
          Ver ficha completa ›
        </button>
      )}

      <div className="forum-post__interactions">
        {onLike ? (
          <button
            type="button"
            className={`forum-post__likes forum-post__like-btn ${liked ? "is-liked" : ""}`}
            aria-label={liked ? "Quitar me gusta" : "Me gusta"}
            aria-pressed={liked}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
          >
            <HeartIcon filled={liked} />
            <span className="forum-post__count">{likes}</span>
          </button>
        ) : (
          <div className="forum-post__likes">
            <img src={likesIcon} alt="Me gusta" className="forum-post__icon" />
            <span className="forum-post__count">{likes}</span>
          </div>
        )}

        <div className="forum-post__comments">
          <img src={commentsIcon} alt="Respuestas" className="forum-post__icon" />
          <span className="forum-post__count">{replies} respuestas</span>
        </div>
      </div>
    </article>
  );
}

export default ForumPost;