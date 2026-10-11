import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import {
  getModerationQueue,
  listCommentReports,
  listPendingClinics,
  moderateComment,
  moderatePost,
  resolveCommentReports,
  verifyClinic,
} from "../../../lib/api";
import { timeAgo } from "../../../lib/format";
import backIcon from "../../svg/Back.svg";
import "./RequestsPage.css";
import "./ModerationPage.css";

const TABS = [
  { id: "posts", label: "Publicaciones" },
  { id: "clinics", label: "Clínicas" },
  { id: "comments", label: "Denuncias" },
];

const TYPE_LABEL = { question: "Pregunta", tip: "Consejo", story: "Historia", post: "Post" };

/** Colas que el admin debe revisar. Cada acción es un RPC que revalida el rol en Supabase. */
function ModerationPage({ initialTab = "posts", onBack }) {
  const [tab, setTab] = useState(initialTab);
  const [posts, setPosts] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c, r] = await Promise.all([getModerationQueue(), listPendingClinics(), listCommentReports()]);
      setPosts(p);
      setClinics(c);
      setReports(r);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la cola de revisión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      console.error("Acción de admin falló:", e);
      setError("No se pudo guardar la decisión. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const counts = { posts: posts.length, clinics: clinics.length, comments: reports.length };

  const actions = (id, onReject, onAccept, rejectLabel = "Rechazar", acceptLabel = "Aprobar") => (
    <div className="moderation__actions">
      <button type="button" className="moderation__reject" disabled={busyId === id} onClick={() => void run(id, onReject)}>
        {rejectLabel}
      </button>
      <button type="button" className="moderation__accept" disabled={busyId === id} onClick={() => void run(id, onAccept)}>
        {busyId === id ? "Guardando..." : acceptLabel}
      </button>
    </div>
  );

  return (
    <>
      <AppHeader title="Por revisar" leftIcon={backIcon} onLeft={onBack} />

      <div className="requests">
        <div className="requests__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`requests__tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="requests__tab-count">{counts[t.id]}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="requests__list">
          {loading && <p className="requests__empty">Cargando…</p>}
          {!loading && counts[tab] === 0 && <p className="requests__empty">No hay nada por revisar aquí.</p>}

          {!loading &&
            tab === "posts" &&
            posts.map((p) => (
              <article key={p.id} className="moderation__card">
                <div className="moderation__head">
                  <strong>{p.author_name}</strong>
                  <span>{TYPE_LABEL[p.type] ?? p.type} · {timeAgo(p.created_at)}</span>
                </div>
                <p className="moderation__text">{p.content}</p>
                {p.image_url && <img className="moderation__image" src={p.image_url} alt="" />}
                {actions(
                  p.id,
                  () => moderatePost(p.id, "rejected"),
                  () => moderatePost(p.id, "published"),
                  "Rechazar",
                  "Publicar"
                )}
              </article>
            ))}

          {!loading &&
            tab === "clinics" &&
            clinics.map((c) => (
              <article key={c.id} className="moderation__card">
                <div className="moderation__head">
                  <strong>{c.name}</strong>
                  <span>{c.kind === "shelter" ? "Refugio" : "Veterinaria"} · {timeAgo(c.created_at)}</span>
                </div>
                <p className="moderation__text">
                  {c.address || "Sin dirección"}
                  <br />
                  Creada por: {c.creator?.name ?? "Usuario"}
                </p>
                {actions(
                  c.id,
                  () => verifyClinic(c.id, false),
                  () => verifyClinic(c.id, true),
                  "Rechazar",
                  "Verificar"
                )}
              </article>
            ))}

          {!loading &&
            tab === "comments" &&
            reports.map((r) => (
              <article key={r.id} className="moderation__card">
                <div className="moderation__head">
                  <strong>Denunciado por {r.reporter?.name ?? "Usuario"}</strong>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
                <p className="moderation__text">“{r.comment?.text ?? "Comentario eliminado"}”</p>
                {r.reason && <p className="moderation__reason">Motivo: {r.reason}</p>}
                {actions(
                  r.id,
                  () => resolveCommentReports(r.comment_id, "dismissed"),
                  async () => {
                    await moderateComment(r.comment_id, true);
                    await resolveCommentReports(r.comment_id, "resolved");
                  },
                  "Descartar",
                  "Ocultar comentario"
                )}
              </article>
            ))}
        </div>
      </div>
    </>
  );
}

export default ModerationPage;
