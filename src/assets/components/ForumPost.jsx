import likesIcon from "../svg/Likes.svg";
import commentsIcon from "../svg/uil_comments.svg";
import "./ForumPost.css";

function ForumPost({
  userName = "Usuario",
  timeAgo = "hace 2 horas",
  category = "Pregunta",
  question = "¿Alguien sabe qué puedo darle a mi perrita, tiene mucha comezón?",
  likes = 0,
  replies = 0,
  avatarUrl,
  onClick,
}) {
  return (
    <article className="forum-post" onClick={onClick}>

      {/* Perfil */}
      <div className="forum-post__profile">

        <div className="forum-post__avatar">
          {avatarUrl && (
            <img src={avatarUrl} alt={userName} />
          )}
        </div>

        <div className="forum-post__name-time">
          <p className="forum-post__name">{userName}</p>
          <p className="forum-post__time">{timeAgo}</p>
        </div>

      </div>

      {/* Etiqueta de categoría */}
      <span className="forum-post__tag">
        {category}
      </span>

      {/* Pregunta */}
      <p className="forum-post__question">
        {question}
      </p>

      {/* Interacciones */}
      <div className="forum-post__interactions">

        <div className="forum-post__likes">
          <img
            src={likesIcon}
            alt="Me gusta"
            className="forum-post__icon"
          />
          <span className="forum-post__count">{likes}</span>
        </div>

        <div className="forum-post__comments">
          <img
            src={commentsIcon}
            alt="Respuestas"
            className="forum-post__icon"
          />
          <span className="forum-post__count">
            {replies} respuestas
          </span>
        </div>

      </div>

    </article>
  );
}

export default ForumPost;