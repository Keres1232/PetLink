import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ShareBar from "./ShareBar.jsx";
import MapFilterTabs from "../map/MapFilterTabs.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import ForumPost from "./ForumPost.jsx";
import {
  addComment,
  createPost,
  getPostById,
  listComments,
  reportComment,
  uploadPhoto,
} from "../../../lib/api";
import useLiveFeed from "../../../hooks/useLiveFeed.js";
import { POST_TYPE_LABEL } from "../../../lib/postTypes";
import { timeAgo } from "../../../lib/format";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import "./CommunityPage.css";

// Filtro de la franja -> tipo de post en la base de datos
const TYPE_BY_FILTER = {
  Preguntas: "question",
  Consejos: "tip",
  Historias: "story",
  Alertas: "alert",
};
const FILTERS = ["Todo", ...Object.keys(TYPE_BY_FILTER)];


const DRAFT_TYPES = [
  { id: "question", label: "Pregunta" },
  { id: "tip", label: "Consejo" },
  { id: "story", label: "Historia" },
];

function CommunityPage({ avatarUrl, openPostId, onBack, onNotifications }) {
  const [filter, setFilter] = useState("Todo");
  const [error, setError] = useState("");

  // Si venimos de "Contactar al dueño" o de Inicio, aseguramos que esa publicación esté en la lista
  const withOpenPost = useCallback(
    async (rows) => {
      if (!openPostId || rows.some((r) => r.id === openPostId)) return rows;
      const extra = await getPostById(openPostId).catch(() => null);
      return extra ? [extra, ...rows] : rows;
    },
    [openPostId]
  );

  const { feed, loading, error: feedError, version, refresh, toggleLike } = useLiveFeed({
    type: TYPE_BY_FILTER[filter],
    extra: withOpenPost,
  });

  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState("question");
  const [draftImage, setDraftImage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");

  const [openPost, setOpenPost] = useState(openPostId ?? null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");

  // Comentarios de la publicación abierta; se recargan cuando llega un comentario nuevo (version)
  useEffect(() => {
    if (!openPost) return;
    listComments(openPost)
      .then(setComments)
      .catch(() => setComments([]));
  }, [openPost, version]);

  const publish = async () => {
    if (draft.trim().length < 3 || publishing) return;
    setPublishing(true);
    setError("");
    try {
      const imageUrl = draftImage ? await uploadPhoto(draftImage, "post-images") : null;
      await createPost({ type: draftType, content: draft.trim(), imageUrl });
      setDraft("");
      setDraftImage(null);
      setComposing(false);
      // Las publicaciones de usuarios pasan por moderación antes de aparecer
      setNotice("¡Listo! Tu publicación quedó en revisión y aparecerá cuando un administrador la apruebe.");
      refresh();
    } catch (e) {
      console.error(e);
      setError("No pudimos publicar. Intenta de nuevo.");
    } finally {
      setPublishing(false);
    }
  };

  const [reported, setReported] = useState([]);

  const denounce = async (commentId) => {
    try {
      await reportComment(commentId, "Contenido inapropiado");
      setReported((list) => [...list, commentId]);
    } catch (e) {
      console.error(e);
      setError("No pudimos enviar la denuncia.");
    }
  };

  const sendComment = async (postId) => {
    if (!commentDraft.trim()) return;
    try {
      await addComment(postId, commentDraft.trim());
      setCommentDraft("");
      setComments(await listComments(postId));
      refresh(); // actualiza el número de respuestas
    } catch (e) {
      console.error(e);
      setError("No pudimos enviar tu respuesta.");
    }
  };

  return (
    <>
      <AppHeader title="Comunidad" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="community">
        <ShareBar avatarUrl={avatarUrl} onClick={() => setComposing((v) => !v)} />

        {composing && (
          <div className="community__composer">
            <ChipGroup options={DRAFT_TYPES} value={draftType} onChange={setDraftType} />
            <textarea
              className="community__textarea"
              rows={4}
              placeholder="Escribe tu pregunta, consejo o historia…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="community__composer-row">
              <label className="community__attach">
                {draftImage ? `📷 ${draftImage.name}` : "Agregar foto"}
                <input type="file" accept="image/*" hidden onChange={(e) => setDraftImage(e.target.files?.[0] ?? null)} />
              </label>
              <button
                type="button"
                className="community__publish"
                disabled={draft.trim().length < 3 || publishing}
                onClick={() => void publish()}
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        )}

        {notice && <p className="community__notice">{notice}</p>}
        {(error || feedError) && <p className="auth-error" role="alert">{error || feedError}</p>}

        <MapFilterTabs filters={FILTERS} onChange={setFilter} />

        <div className="community__list">
          {loading && <p className="community__empty">Cargando…</p>}
          {!loading && feed.length === 0 && <p className="community__empty">Aún no hay publicaciones aquí.</p>}

          {feed.map((post) => (
            <div key={post.id} className="community__item">
              <ForumPost
                userName={post.author_name}
                timeAgo={timeAgo(post.created_at)}
                category={POST_TYPE_LABEL[post.type] ?? post.type}
                question={post.content}
                likes={post.like_count}
                liked={post.liked_by_me}
                onLike={() => void toggleLike(post.id)}
                replies={post.comment_count}
                onClick={() => setOpenPost((id) => (id === post.id ? null : post.id))}
              />

              {post.image_url && openPost === post.id && (
                <img className="community__image" src={post.image_url} alt="" />
              )}

              {openPost === post.id && (
                <div className="community__thread">
                  {comments.length === 0 && <p className="community__empty">Sé el primero en responder.</p>}
                  {comments.map((c) => (
                    <p key={c.id} className="community__comment">
                      <strong>{c.author?.name ?? "Usuario"}</strong> {c.text}{" "}
                      {reported.includes(c.id) ? (
                        <span className="community__reported">Denunciado</span>
                      ) : (
                        <button type="button" className="community__report" onClick={() => void denounce(c.id)}>
                          Denunciar
                        </button>
                      )}
                    </p>
                  ))}
                  <div className="community__composer-row">
                    <input
                      className="community__input"
                      placeholder="Escribe una respuesta…"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <button type="button" className="community__publish" onClick={() => void sendComment(post.id)}>
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CommunityPage;
