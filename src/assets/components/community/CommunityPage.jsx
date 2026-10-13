import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ShareBar from "./ShareBar.jsx";
import MapFilterTabs from "../map/MapFilterTabs.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import ForumPost from "./ForumPost.jsx";
import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import RoleBadge from "../shared/RoleBadge.jsx";
import {
  addComment,
  alertSummaries,
  roleBadges,
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
import searchIcon from "../../svg/Buscar.svg";
import locationIcon from "../../svg/Location icon.svg";
import MatchesPanel from "../reports/MatchesPanel.jsx";
import SearchBar from "../shared/SearchBar.jsx";
import "./CommunityPage.css";
import PawLoader from "../shared/PawLoader.jsx";

const SEX_LABEL = { male: "Macho", female: "Hembra" };
const SIZE_LABEL = { small: "Pequeño", medium: "Mediano", large: "Grande" };

/** Contexto de una alerta (alertSummaries) -> lo que muestra la tarjeta del foro. */
function alertInfo(post, summary) {
  const lost = summary ? summary.type === "lost" : post.type !== "found";
  const species = summary?.species ?? null;
  return {
    lost,
    title: summary?.petName || species || (lost ? "Mascota perdida" : "Mascota encontrada"),
    details: [summary?.petName ? species : null, SEX_LABEL[summary?.sex], SIZE_LABEL[summary?.size], summary?.color]
      .filter(Boolean)
      .join(" · "),
  };
}

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

function CommunityPage({ avatarUrl, openPostId, openCommentId, onBack, onViewOnMap, onContactOwner, onOpenReport, myUserId }) {
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

  // Búsqueda (lupa del header): filtra por texto, autor o tipo; mientras se busca se cargan más publicaciones
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const { feed, loading, error: feedError, version, refresh, toggleLike } = useLiveFeed({
    type: TYPE_BY_FILTER[filter],
    limit: searching ? 100 : 30,
    extra: withOpenPost,
  });

  const normalize = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = normalize(query.trim());
  const visible = searching
    ? feed.filter((p) =>
        [p.content, p.author_name, POST_TYPE_LABEL[p.type]].some((field) => normalize(field).includes(q))
      )
    : feed;

  // Contexto de las alertas del feed (perdida/encontrada, nombre, especie…), se pide una sola vez por reporte
  const [summaries, setSummaries] = useState({});
  const missingIds = feed
    .map((p) => p.report_id)
    .filter((id) => id && !(id in summaries))
    .join(",");
  useEffect(() => {
    if (!missingIds) return;
    let alive = true;
    const ids = missingIds.split(",");
    alertSummaries(ids)
      .then((rows) =>
        alive && setSummaries((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, rows[id] ?? null])) }))
      )
      .catch((e) => console.error("No se pudo cargar el contexto de las alertas", e));
    return () => {
      alive = false;
    };
  }, [missingIds]);

  // Etiqueta de rol especial de los autores (publicaciones y comentarios); se pide una vez por cuenta
  const [badges, setBadges] = useState({});

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

  // Llegó desde una notificación: bajar hasta la publicación (y luego hasta el comentario), una sola vez
  const postRefs = useRef({});
  const scrolledToPost = useRef(false);
  const scrolledToComment = useRef(false);
  const targetLoaded = Boolean(openPostId) && feed.some((p) => p.id === openPostId);
  useEffect(() => {
    if (!targetLoaded || scrolledToPost.current) return;
    scrolledToPost.current = true;
    postRefs.current[openPostId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [targetLoaded, openPostId]);
  const commentLoaded = Boolean(openCommentId) && comments.some((c) => c.id === openCommentId);
  useEffect(() => {
    if (!commentLoaded || scrolledToComment.current) return;
    scrolledToComment.current = true;
    // Después de llegar a la publicación
    const t = setTimeout(
      () => document.getElementById(`comment-${openCommentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      450
    );
    return () => clearTimeout(t);
  }, [commentLoaded, openCommentId]);

  const missingAuthors = [...feed.map((p) => p.user_id), ...comments.map((c) => c.user_id)]
    .filter((id) => id && !(id in badges))
    .filter((id, i, all) => all.indexOf(id) === i)
    .join(",");
  useEffect(() => {
    if (!missingAuthors) return;
    let alive = true;
    const ids = missingAuthors.split(",");
    roleBadges(ids)
      .then((rows) => alive && setBadges((cur) => ({ ...cur, ...Object.fromEntries(ids.map((id) => [id, rows[id] ?? null])) })))
      .catch((e) => console.error("No se pudieron cargar los roles de los autores", e));
    return () => {
      alive = false;
    };
  }, [missingAuthors]);

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
      {/* En Comunidad el botón de la derecha es la lupa (en vez de las notificaciones) */}
      <AppHeader
        title="Comunidad"
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={searchIcon}
        rightLabel="Buscar publicaciones"
        onRight={() => {
          setSearchOpen((open) => !open);
          setQuery("");
        }}
      />

      <div className="community">
        {searchOpen && (
          <div className="community__search">
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar por texto, autor o tipo" autoFocus />
          </div>
        )}

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
          {loading && <PawLoader />}
          {!loading && visible.length === 0 && (
            <p className="community__empty">
              {searching ? `No encontramos publicaciones con «${query.trim()}».` : "Aún no hay publicaciones aquí."}
            </p>
          )}

          {visible.map((post) => (
            <div
              key={post.id}
              className="community__item"
              ref={(el) => {
                if (el) postRefs.current[post.id] = el;
              }}
            >
              <ForumPost
                userName={post.author_name}
                roleBadge={badges[post.user_id]}
                avatarUrl={post.avatar_url}
                imageUrl={post.image_url}
                timeAgo={timeAgo(post.created_at)}
                category={
                  post.report_id
                    ? alertInfo(post, summaries[post.report_id]).lost
                      ? "Perdida"
                      : "Encontrada"
                    : POST_TYPE_LABEL[post.type] ?? post.type
                }
                alert={
                  post.report_id
                    ? { ...alertInfo(post, summaries[post.report_id]), onOpen: onOpenReport && (() => onOpenReport(post.report_id)) }
                    : undefined
                }
                question={post.content}
                likes={post.like_count}
                liked={post.liked_by_me}
                onLike={() => void toggleLike(post.id)}
                replies={post.comment_count}
                onClick={() => setOpenPost((id) => (id === post.id ? null : post.id))}
              />

              {openPost === post.id && (
                <div className="community__thread">
                  {/* Alertas de mascota perdida/encontrada: ir al reporte en el mapa */}
                  {post.report_id && (
                    <div className="community__alert-actions">
                      <button type="button" className="community__map-btn" onClick={() => onViewOnMap?.(post.report_id)}>
                        <img src={locationIcon} alt="" />
                        Ver en el mapa
                      </button>
                      {/* Respuesta privada a la alerta: solo la ve quien la publicó */}
                      {post.user_id !== myUserId && (
                        <button type="button" className="community__match-btn" onClick={() => onContactOwner?.(post)}>
                          {post.type === "found" ? "Es mi mascota" : "¡La encontré!"}
                        </button>
                      )}
                    </div>
                  )}
                  {/* El dueño de la alerta ve aquí los avisos privados que le enviaron */}
                  {post.report_id && post.user_id === myUserId && <MatchesPanel reportId={post.report_id} />}
                  {comments.length === 0 && <p className="community__empty">Sé el primero en responder.</p>}
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      id={`comment-${c.id}`}
                      className={`community__comment-row ${c.id === openCommentId ? "is-highlight" : ""}`}
                    >
                      {/* Foto de perfil del autor del comentario (o el dibujo gris si no tiene) */}
                      <span className="community__comment-avatar">
                        {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <AvatarPlaceholder />}
                      </span>
                      <p className="community__comment">
                        <strong>{c.author?.name ?? "Usuario"}</strong> <RoleBadge kind={badges[c.user_id]} /> {c.text}{" "}
                        {reported.includes(c.id) ? (
                          <span className="community__reported">Denunciado</span>
                        ) : (
                          <button type="button" className="community__report" onClick={() => void denounce(c.id)}>
                            Denunciar
                          </button>
                        )}
                      </p>
                    </div>
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
