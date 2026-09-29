import { useCallback, useEffect, useState } from "react";
import ForumPost from "../components/ForumPost.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { addComment, createPost, getFeed, listComments, togglePostLike, uploadPhoto } from "../lib/api";
import { timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { CommentRow, FeedItem } from "../lib/types";
import "../styles/pages.css";

type FilterValue = "all" | "question" | "tip" | "story" | "found";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "question", label: "Preguntas" },
  { value: "tip", label: "Consejos" },
  { value: "story", label: "Historias" },
  { value: "found", label: "Encontradas" },
];

const TYPE_LABELS: Record<string, string> = {
  question: "Pregunta",
  tip: "Consejo",
  story: "Historia",
  found: "Encontrada",
  post: "Post",
  experience: "Experiencia",
  meme: "Meme",
};

export default function CommunityPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState("question");
  const [draftImage, setDraftImage] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [openPost, setOpenPost] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

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
          <div key={item.id}>
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
              <img className="forum-post__image" src={item.image_url} alt="" style={{ marginTop: 8 }} />
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
                    <div key={c.id} className="comment-row">
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
