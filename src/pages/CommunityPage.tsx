import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import ForumPost from "../components/ForumPost.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import {
  addComment,
  createPost,
  getCommentById,
  getFeed,
  getPostById,
  listComments,
  listReportMatches,
  resolveMyReport,
  resolveReportMatch,
  togglePostLike,
  uploadPhoto,
} from "../lib/api";
import { timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { CommentRow, FeedItem, ReportMatch } from "../lib/types";
import "../styles/pages.css";

type FilterValue = "all" | "question" | "tip" | "story" | "found" | "alert";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "question", label: "Preguntas" },
  { value: "tip", label: "Consejos" },
  { value: "story", label: "Historias" },
  { value: "found", label: "Encontradas" },
  { value: "alert", label: "Alertas" },
];

const TYPE_LABELS: Record<string, string> = {
  question: "Pregunta",
  tip: "Consejo",
  story: "Historia",
  found: "Encontrada",
  alert: "Alerta",
  post: "Post",
  experience: "Experiencia",
  meme: "Meme",
};

export default function CommunityPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [highlightPost, setHighlightPost] = useState<string | null>(null);
  const [highlightComment, setHighlightComment] = useState<string | null>(null);
  const deepLinkHandled = useRef(false);

  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState("question");
  const [draftImage, setDraftImage] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [openPost, setOpenPost] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

  // Coincidencias "¡La encontré!" en mis propias alertas
  const [matchesByReport, setMatchesByReport] = useState<Record<string, ReportMatch[]>>({});
  const [resolvedReports, setResolvedReports] = useState<Record<string, boolean>>({});
  const [matchBusyId, setMatchBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFeed(
        await getFeed({ type: filter === "all" ? undefined : filter, limit: 30 })
      );
    } catch {
      setError("No pudimos cargar la comunidad.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Deep links desde notificaciones: /comunidad?post=<id>&comment=<id>
  useEffect(() => {
    if (loading || deepLinkHandled.current) return;
    const postParam = searchParams.get("post");
    const commentParam = searchParams.get("comment");
    if (!postParam && !commentParam) {
      deepLinkHandled.current = true;
      return;
    }
    deepLinkHandled.current = true;
    void (async () => {
      let targetId = postParam;
      if (!targetId && commentParam) {
        const c = await getCommentById(commentParam).catch(() => null);
        targetId = c?.post_id ?? null;
      }
      if (!targetId) return;
      const post = await getPostById(targetId).catch(() => null);
      if (post) {
        setFeed((prev) => (prev.some((f) => f.id === post.id) ? prev : [post, ...prev]));
      }
      setOpenPost(targetId);
      setCommentDraft("");
      setComments(await listComments(targetId).catch(() => []));
      setHighlightPost(targetId);
      setHighlightComment(commentParam);
    })();
  }, [loading, searchParams]);

  useEffect(() => {
    if (!openPost) return;
    const scroll = setTimeout(() => {
      document
        .querySelector(`[data-post-id="${CSS.escape(openPost)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(scroll);
  }, [openPost, comments.length]);

  useEffect(() => {
    if (!highlightPost) return;
    const clear = setTimeout(() => {
      setHighlightPost(null);
      setHighlightComment(null);
    }, 2400);
    return () => clearTimeout(clear);
  }, [highlightPost]);

  useEffect(() => {
    const channel = supabase
      .channel("community-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const row = payload.new as CommentRow;
          setComments((prev) =>
            prev.some((c) => c.id === row.id) ? prev : [...prev, row]
          );
          setFeed((prev) =>
            prev.map((f) =>
              f.id === row.post_id ? { ...f, comment_count: f.comment_count + 1 } : f
            )
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function openComments(postId: string) {
    if (openPost === postId) {
      setOpenPost(null);
      return;
    }
    setOpenPost(postId);
    setCommentDraft("");
    try {
      setComments(await listComments(postId));
    } catch {
      setComments([]);
    }
  }

  async function handleLike(postId: string) {
    try {
      const nowLiked = await togglePostLike(postId);
      setFeed((prev) =>
        prev.map((f) =>
          f.id === postId
            ? {
                ...f,
                liked_by_me: nowLiked,
                like_count: f.like_count + (nowLiked ? 1 : -1),
              }
            : f
        )
      );
    } catch {
      setError("No pudimos registrar tu me gusta.");
    }
  }

  async function handlePublish() {
    if (draft.trim().length < 3) return;
    setPublishing(true);
    try {
      let imageUrl: string | null = null;
      if (draftImage) imageUrl = await uploadPhoto(draftImage, "post-images");
      await createPost({ type: draftType, content: draft.trim(), imageUrl });
      setDraft("");
      setDraftImage(null);
      await load();
    } catch {
      setError("No pudimos publicar. Intenta de nuevo.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleComment(postId: string) {
    if (commentDraft.trim().length < 1) return;
    try {
      await addComment(postId, commentDraft.trim());
      setCommentDraft("");
      setComments(await listComments(postId));
    } catch {
      setError("No pudimos enviar tu respuesta.");
    }
  }

  // Carga las coincidencias de mis alertas (solo el dueño las ve por RLS)
  useEffect(() => {
    if (!user) return;
    const reportIds = [
      ...new Set(
        feed
          .filter((f) => f.type === "alert" && f.report_id && f.user_id === user.id)
          .map((f) => f.report_id as string)
      ),
    ];
    if (reportIds.length === 0) return;
    void (async () => {
      const entries = await Promise.all(
        reportIds.map(async (id) => {
          const list = await listReportMatches(id).catch(() => [] as ReportMatch[]);
          return [id, list] as const;
        })
      );
      setMatchesByReport((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
  }, [feed, user]);

  async function handleMatchAction(
    matchId: string,
    reportId: string,
    status: "confirmed" | "dismissed"
  ) {
    setMatchBusyId(matchId);
    try {
      await resolveReportMatch(matchId, status);
      setMatchesByReport((prev) => ({
        ...prev,
        [reportId]: (prev[reportId] ?? []).map((m) =>
          m.id === matchId ? { ...m, status } : m
        ),
      }));
    } catch {
      setError("No pudimos actualizar la coincidencia.");
    } finally {
      setMatchBusyId(null);
    }
  }

  async function handleResolveReport(reportId: string) {
    try {
      await resolveMyReport(reportId);
      setResolvedReports((prev) => ({ ...prev, [reportId]: true }));
    } catch {
      setError("No pudimos cerrar la alerta.");
    }
  }

  return (
    <div>
      <h1 className="community-title">¿Qué quieres compartir con la comunidad?</h1>

      <div className="community-filters">
        <ChipGroup
          options={FILTERS}
          value={filter}
          onChange={(value) => setFilter(value)}
          label="Filtrar publicaciones"
        />
      </div>

      <div className="composer">
        <textarea
          className="pc-textarea"
          placeholder="Pregunta o comparte algo con la comunidad…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Nueva publicación"
        />
        {draftImage && <p className="pc-muted" style={{ margin: 0 }}>Imagen: {draftImage.name}</p>}
        <div className="composer__row">
          <select
            className="pc-select"
            value={draftType}
            onChange={(e) => setDraftType(e.target.value)}
            aria-label="Tipo de publicación"
          >
            <option value="question">Pregunta</option>
            <option value="tip">Consejo</option>
            <option value="story">Historia</option>
            <option value="found">Encontrada</option>
            <option value="post">Post</option>
          </select>
          <label className="pc-pill-btn" style={{ cursor: "pointer" }}>
            Adjuntar imagen
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setDraftImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <PrimaryButton onClick={() => void handlePublish()} type="button">
            {publishing ? "Publicando…" : "Publicar"}
          </PrimaryButton>
        </div>
      </div>

      {loading && <LoadingState label="Cargando publicaciones…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && feed.length === 0 && !error && (
        <EmptyState
          title="Aún no hay publicaciones"
          body="Comparte la primera pregunta o experiencia con la comunidad."
        />
      )}

      <div className="home__feed">
        {feed.map((item) => (
          <div
            key={item.id}
            data-post-id={item.id}
            className={highlightPost === item.id ? "flash-highlight" : undefined}
          >
            <ForumPost
              userName={item.author_name}
              timeAgo={timeAgo(item.created_at)}
              category={TYPE_LABELS[item.type] ?? item.type}
              question={item.content}
              likes={item.like_count}
              replies={item.comment_count}
              liked={item.liked_by_me}
              onLike={() => void handleLike(item.id)}
              onClick={() => void openComments(item.id)}
            />
            {item.image_url && (
              <img
                className="forum-post__image"
                src={item.image_url}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ marginTop: 8 }}
              />
            )}
            {item.type === "alert" && item.report_id && (
              <Link className="feed-alert-link" to={`/mapa?report=${item.report_id}`}>
                <MapPin size={14} /> Ver en mapa
              </Link>
            )}
            {item.type === "alert" && item.report_id && user && item.user_id === user.id && (
              <div className="match-panel">
                <div className="match-panel__header">
                  <strong>
                    Coincidencias (
                    {
                      (matchesByReport[item.report_id] ?? []).filter(
                        (m) => m.status !== "dismissed"
                      ).length
                    }
                    )
                  </strong>
                  <button
                    type="button"
                    className="match-panel__resolve"
                    disabled={Boolean(resolvedReports[item.report_id])}
                    onClick={() => void handleResolveReport(item.report_id as string)}
                  >
                    {resolvedReports[item.report_id] ? "Alerta cerrada ✓" : "Ya la recuperé"}
                  </button>
                </div>
                {(matchesByReport[item.report_id] ?? []).length === 0 && (
                  <p className="pc-muted" style={{ margin: 0 }}>
                    Aún no hay avisos de que alguien la haya encontrado.
                  </p>
                )}
                {(matchesByReport[item.report_id] ?? []).map((m) => (
                  <div key={m.id} className="match-row">
                    <p className="match-row__head">
                      <strong>{m.finder?.name ?? "Alguien"}</strong>
                      <span className="match-row__time">{timeAgo(m.created_at)}</span>
                      {m.status === "confirmed" && (
                        <span className="match-row__badge match-row__badge--ok">
                          Confirmada
                        </span>
                      )}
                      {m.status === "dismissed" && (
                        <span className="match-row__badge">Descartada</span>
                      )}
                    </p>
                    {m.message && <p className="match-row__text">{m.message}</p>}
                    {m.contact && (
                      <p className="match-row__contact">Contacto: {m.contact}</p>
                    )}
                    {m.status === "pending" && (
                      <div className="match-row__actions">
                        <button
                          type="button"
                          className="pc-pill-btn"
                          disabled={matchBusyId === m.id}
                          onClick={() =>
                            void handleMatchAction(
                              m.id,
                              item.report_id as string,
                              "confirmed"
                            )
                          }
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="pc-outline-btn"
                          disabled={matchBusyId === m.id}
                          onClick={() =>
                            void handleMatchAction(
                              m.id,
                              item.report_id as string,
                              "dismissed"
                            )
                          }
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {openPost === item.id && (
              <div className="comments-panel">
                <div className="comments-panel__list">
                  {comments.length === 0 && (
                    <p className="pc-muted" style={{ margin: 0 }}>
                      Sé la primera persona en responder.
                    </p>
                  )}
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      data-comment-id={c.id}
                      className={`comment-row ${highlightComment === c.id ? "flash-highlight" : ""}`}
                    >
                      <p className="comment-row__author">
                        {c.author?.name ?? "Alguien"}{" "}
                        <span className="comment-row__time">{timeAgo(c.created_at)}</span>
                      </p>
                      <p className="comment-row__text">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="comments-panel__input">
                  <input
                    className="pc-input"
                    placeholder="Escribe una respuesta…"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleComment(item.id);
                    }}
                    aria-label="Escribir respuesta"
                  />
                  <PrimaryButton onClick={() => void handleComment(item.id)} type="button">
                    Enviar
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
