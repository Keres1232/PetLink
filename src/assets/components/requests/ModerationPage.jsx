import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import {
  adminDeletePost,
  adminDeleteReport,
  getModerationQueue,
  listRecentContent,
  listCommentReports,
  listPendingClinics,
  moderateComment,
  moderatePost,
  resolveCommentReports,
  roleForKind,
  setUserRole,
  updatePlaceKind,
  verifyClinic,
} from "../../../lib/api";
import { timeAgo } from "../../../lib/format";
import ChipGroup from "../shared/ChipGroup.jsx";
import backIcon from "../../svg/Back.svg";
import vetIcon from "../../svg/Adopcion/Vet.svg";
import refugeIcon from "../../svg/Adopcion/Ref.svg";
import "./RequestsPage.css";
import "./ModerationPage.css";
import PawLoader from "../shared/PawLoader.jsx";

const PLACE_KINDS = [
  { id: "shelter", label: "Refugio", icon: refugeIcon },
  { id: "clinic", label: "Veterinaria", icon: vetIcon },
];

const TABS = [
  { id: "posts", label: "Publicaciones" },
  { id: "clinics", label: "Clínicas" },
  { id: "comments", label: "Denuncias" },
  { id: "content", label: "Contenido" },
];

// Etiqueta de cada fila de "Contenido"
const REPORT_LABEL = { lost: "Alerta · Perdido", found: "Alerta · Encontrado", danger: "Alerta · Riesgo" };
const contentLabel = (item) =>
  item.kind === "report" ? REPORT_LABEL[item.type] ?? "Alerta" : TYPE_LABEL[item.type] ?? "Publicación";

const TYPE_LABEL = { question: "Pregunta", tip: "Consejo", story: "Historia", post: "Post" };

/** Colas que el admin debe revisar. Cada acción es un RPC que revalida el rol en Supabase. */
function ModerationPage({ initialTab = "posts", onBack }) {
  const [tab, setTab] = useState(initialTab);
  const [posts, setPosts] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicKinds, setClinicKinds] = useState({}); // id del lugar → "clinic" | "shelter" elegido por el admin
  const [reports, setReports] = useState([]);
  // Contenido reciente (alertas y publicaciones) que el admin puede borrar
  const [content, setContent] = useState([]);
  const [confirmId, setConfirmId] = useState(null); // doble toque para borrar
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c, r, recent] = await Promise.all([
        getModerationQueue(),
        listPendingClinics(),
        listCommentReports(),
        listRecentContent().catch((e) => {
          console.error("No se pudo cargar el contenido reciente", e);
          return [];
        }),
      ]);
      setPosts(p);
      setClinics(c);
      setReports(r);
      setContent(recent);
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

  const counts = { posts: posts.length, clinics: clinics.length, comments: reports.length, content: content.length };

  // Borrar una alerta o publicación de otro usuario: primer toque pide confirmar, el segundo borra
  const removeContent = (item) => {
    const key = `${item.kind}-${item.id}`;
    if (confirmId !== key) {
      setConfirmId(key);
      setNotice("");
      return;
    }
    setConfirmId(null);
    void run(key, async () => {
      await (item.kind === "report" ? adminDeleteReport(item.id) : adminDeletePost(item.id));
      setNotice(
        item.kind === "report"
          ? "Alerta eliminada: ya no aparece en la comunidad ni en el mapa."
          : "Publicación eliminada."
      );
    });
  };

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
        {notice && <p className="moderation__notice" role="status">{notice}</p>}

        <div className="requests__list">
          {loading && <PawLoader />}
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
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="moderation__text">
                  {c.address || "Sin dirección"}
                  <br />
                  Creada por: {c.creator?.name ?? "Usuario"}
                </p>
                {/* El admin decide: Refugio o Veterinaria (una u otra) */}
                <span className="moderation__label">¿Es un refugio o una veterinaria?</span>
                <ChipGroup
                  options={PLACE_KINDS}
                  value={clinicKinds[c.id] ?? null}
                  onChange={(k) => setClinicKinds((prev) => ({ ...prev, [c.id]: k }))}
                  variant="tray solid"
                />
                {clinicKinds[c.id]
                  ? actions(
                      c.id,
                      () => verifyClinic(c.id, false),
                      async () => {
                        const kind = clinicKinds[c.id];
                        await updatePlaceKind(c.id, kind);
                        await verifyClinic(c.id, true);
                        // El rol de la cuenta sigue a la etiqueta elegida
                        if (c.created_by) {
                          await setUserRole(c.created_by, roleForKind(kind)).catch((e) =>
                            console.warn("[etiqueta] no se pudo cambiar el rol de la cuenta", e)
                          );
                        }
                      },
                      "Rechazar",
                      "Verificar"
                    )
                  : <p className="moderation__hint">Elige la etiqueta para poder verificarla.</p>}
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

          {!loading &&
            tab === "content" &&
            content.map((item) => {
              const key = `${item.kind}-${item.id}`;
              const confirming = confirmId === key;
              return (
                <article key={key} className="moderation__card">
                  <div className="moderation__head">
                    <strong>{item.author_name}</strong>
                    <span>{timeAgo(item.created_at)}</span>
                  </div>
                  <span className={`moderation__kind moderation__kind--${item.kind === "report" ? item.type : "post"}`}>
                    {contentLabel(item)}
                  </span>
                  {item.text && <p className="moderation__text">{item.text}</p>}
                  {item.image && <img className="moderation__image" src={item.image} alt="" />}
                  {item.kind === "report" && <p className="moderation__hint">Visible en el mapa y en la comunidad.</p>}
                  {confirming && <p className="moderation__hint">Toca otra vez para confirmar: no se puede deshacer.</p>}
                  <div className="moderation__actions">
                    {confirming && (
                      <button type="button" className="moderation__accept" onClick={() => setConfirmId(null)}>
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      className="moderation__reject"
                      disabled={busyId === key}
                      onClick={() => removeContent(item)}
                    >
                      {busyId === key ? "Eliminando..." : confirming ? "Confirmar borrado" : "Eliminar"}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default ModerationPage;
