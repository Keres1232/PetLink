import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ShareBar from "./ShareBar.jsx";
import MapFilterTabs from "../map/MapFilterTabs.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import ForumPost from "./ForumPost.jsx";
import { addComment, createPost, getFeed, getPostById, listComments, uploadPhoto } from "../../../lib/api";
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

const TYPE_LABEL = {
  question: "Pregunta",
  tip: "Consejo",
  story: "Historia",
  alert: "Alerta",
  found: "Encontrada",
  post: "Post",
  experience: "Experiencia",
  meme: "Meme",
};

const DRAFT_TYPES = [
  { id: "question", label: "Pregunta" },
  { id: "tip", label: "Consejo" },
  { id: "story", label: "Historia" },
];

function CommunityPage({ avatarUrl, openPostId, onBack, onNotifications }) {
  const [filter, setFilter] = useState("Todo");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState("question");
  const [draftImage, setDraftImage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");

  const [openPost, setOpenPost] = useState(openPostId ?? null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getFeed({ type: TYPE_BY_FILTER[filter], limit: 30 });
      // Si venimos de "Contactar al dueño", aseguramos que esa publicación esté en la lista
      if (openPostId && !rows.some((r) => r.id === openPostId)) {
        const extra = await getPostById(openPostId).catch(() => null);
        if (extra) rows.unshift(extra);
      }
      setFeed(rows);
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar la comunidad.");
    } finally {
      setLoading(false);
    }
  }, [filter, openPostId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!openPost) return;
    listComments(openPost)
      .then(setComments)
      .catch(() => setComments([]));
  }, [openPost]);

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
      await load();
    } catch (e) {
      console.error(e);
      setError("No pudimos publicar. Intenta de nuevo.");
    } finally {
      setPublishing(false);
    }
  };

  const sendComment = async (postId) => {
    if (!commentDraft.trim()) return;
    try {
      await addComment(postId, commentDraft.trim());
      setCommentDraft("");
      setComments(await listComments(postId));
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
        {error && <p className="auth-error" role="alert">{error}</p>}

        <MapFilterTabs filters={FILTERS} onChange={setFilter} />

        <div className="community__list">
          {loading && <p className="community__empty">Cargando…</p>}
          {!loading && feed.length === 0 && <p className="community__empty">Aún no hay publicaciones aquí.</p>}

          {feed.map((post) => (
            <div key={post.id} className="community__item">
              <ForumPost
                userName={post.author_name}
                timeAgo={timeAgo(post.created_at)}
                category={TYPE_LABEL[post.type] ?? post.type}
                question={post.content}
                likes={post.like_count}
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
                      <strong>{c.author?.name ?? "Usuario"}</strong> {c.text}
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
