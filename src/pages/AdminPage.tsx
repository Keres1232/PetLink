import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquareWarning,
  RefreshCw,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import ChipGroup from "../components/ui/ChipGroup";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import {
  getModerationQueue,
  getVetDocumentUrl,
  listCommentReports,
  listPendingClinics,
  listPendingVetApplications,
  moderateComment,
  moderatePost,
  resolveCommentReports,
  reviewVetApplication,
  verifyClinic,
} from "../lib/api";
import { timeAgo } from "../lib/format";
import type {
  CommentReport,
  ModerationPost,
  PendingClinic,
  VetApplication,
} from "../lib/types";
import "../styles/admin.css";

type Tab = "posts" | "vets" | "clinics" | "comments";

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

const ROLE_LABELS: Record<string, string> = {
  vet: "Veterinario",
  foundation: "Refugio / Fundación",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [vets, setVets] = useState<VetApplication[]>([]);
  const [clinics, setClinics] = useState<PendingClinic[]>([]);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [docBusy, setDocBusy] = useState<string | null>(null);

  async function openDocument(pathOrUrl: string) {
    setDocBusy(pathOrUrl);
    setActionError(null);
    try {
      const url = await getVetDocumentUrl(pathOrUrl);
      if (url) {
        window.open(url, "_blank", "noopener");
      } else {
        setActionError("No pudimos abrir el documento.");
      }
    } finally {
      setDocBusy(null);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, v, c, r] = await Promise.all([
        getModerationQueue(),
        listPendingVetApplications(),
        listPendingClinics(),
        listCommentReports(),
      ]);
      setPosts(p);
      setVets(v);
      setClinics(c);
      setReports(r);
    } catch {
      setError("No pudimos cargar la cola de moderación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(
    id: string,
    action: () => Promise<void>,
    onSuccess: () => void,
    failMessage: string
  ) {
    setBusyId(id);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      onSuccess();
    } catch (err) {
      console.error("Acción de admin falló:", err);
      setActionError(failMessage);
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: "posts", label: `Publicaciones (${posts.length})` },
    { value: "vets", label: `Veterinarios (${vets.length})` },
    { value: "clinics", label: `Clínicas (${clinics.length})` },
    { value: "comments", label: `Comentarios (${reports.length})` },
  ];

  return (
    <div>
      <div className="pc-page-header">
        <h1 className="pc-title">Administración</h1>
        <button
          type="button"
          className="pc-pill-btn"
          onClick={() => void load()}
          aria-label="Actualizar"
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>
      <p className="pc-muted admin-subtitle">
        Revisa el contenido y las solicitudes para mantener segura a la comunidad.
      </p>

      <div className="admin-stats">
        <button
          type="button"
          className={`admin-stat ${tab === "posts" ? "admin-stat--active" : ""}`}
          onClick={() => setTab("posts")}
        >
          <FileText size={18} />
          <strong>{posts.length}</strong>
          <span>Publicaciones por revisar</span>
        </button>
        <button
          type="button"
          className={`admin-stat ${tab === "vets" ? "admin-stat--active" : ""}`}
          onClick={() => setTab("vets")}
        >
          <ShieldCheck size={18} />
          <strong>{vets.length}</strong>
          <span>Solicitudes de veterinarios</span>
        </button>
        <button
          type="button"
          className={`admin-stat ${tab === "clinics" ? "admin-stat--active" : ""}`}
          onClick={() => setTab("clinics")}
        >
          <Store size={18} />
          <strong>{clinics.length}</strong>
          <span>Clínicas por verificar</span>
        </button>
        <button
          type="button"
          className={`admin-stat ${tab === "comments" ? "admin-stat--active" : ""}`}
          onClick={() => setTab("comments")}
        >
          <MessageSquareWarning size={18} />
          <strong>{reports.length}</strong>
          <span>Comentarios reportados</span>
        </button>
      </div>

      <div className="admin-tabs">
        <ChipGroup options={tabs} value={tab} onChange={(v) => setTab(v)} label="Secciones de administración" />
      </div>

      {actionError && (
        <p className="pc-error-text" role="alert">
          {actionError}
        </p>
      )}
      {notice && (
        <p className="auth-page__notice" role="status">
          {notice}
        </p>
      )}

      {loading && <LoadingState label="Cargando la cola de moderación…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && tab === "posts" && (
        <section className="admin-list">
          {posts.length === 0 && (
            <EmptyState
              title="No hay publicaciones pendientes"
              body="Cuando alguien publique algo que necesite revisión, aparecerá aquí."
            />
          )}
          {posts.map((p) => (
            <article key={p.id} className="admin-item">
              <div className="admin-item__head">
                <div>
                  <p className="admin-item__title">{p.author_name}</p>
                  <p className="admin-item__meta">
                    {timeAgo(p.created_at)} ·{" "}
                    <span className="pc-badge pc-badge--question">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </span>
                  </p>
                </div>
              </div>
              <p className="admin-item__body">{p.content}</p>
              {p.image_url && (
                <img className="admin-item__image" src={p.image_url} alt="Adjunto de la publicación" />
              )}
              <div className="admin-item__actions">
                <button
                  type="button"
                  className="pc-pill-btn admin-approve"
                  disabled={busyId === p.id}
                  onClick={() =>
                    void run(
                      p.id,
                      () => moderatePost(p.id, "published"),
                      () => setPosts((prev) => prev.filter((x) => x.id !== p.id)),
                      "No pudimos aprobar la publicación."
                    )
                  }
                >
                  <CheckCircle2 size={15} /> Aprobar
                </button>
                <button
                  type="button"
                  className="pc-outline-btn"
                  disabled={busyId === p.id}
                  onClick={() =>
                    void run(
                      p.id,
                      () => moderatePost(p.id, "rejected"),
                      () => setPosts((prev) => prev.filter((x) => x.id !== p.id)),
                      "No pudimos rechazar la publicación."
                    )
                  }
                >
                  <XCircle size={15} /> Rechazar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && tab === "vets" && (
        <section className="admin-list">
          {vets.length === 0 && (
            <EmptyState
              title="No hay solicitudes pendientes"
              body="Las solicitudes de veterinarios y fundaciones aparecerán aquí."
            />
          )}
          {vets.map((v) => (
            <article key={v.id} className="admin-item">
              <div className="admin-item__head">
                <div>
                  <p className="admin-item__title">{v.applicant?.name ?? "Usuario"}</p>
                  <p className="admin-item__meta">
                    {timeAgo(v.created_at)} ·{" "}
                    <span className="pc-badge pc-badge--vet">
                      {ROLE_LABELS[v.target_role ?? "vet"] ?? "Veterinario"}
                    </span>
                  </p>
                </div>
              </div>
              {v.support_document_url ? (
                <button
                  type="button"
                  className="admin-item__doc"
                  disabled={docBusy === v.support_document_url}
                  onClick={() => void openDocument(v.support_document_url as string)}
                >
                  <ExternalLink size={14} />{" "}
                  {docBusy === v.support_document_url ? "Abriendo…" : "Ver documento de soporte"}
                </button>
              ) : (
                <p className="pc-muted admin-item__meta">Sin documento adjunto</p>
              )}
              <div className="admin-item__actions">
                <button
                  type="button"
                  className="pc-pill-btn admin-approve"
                  disabled={busyId === v.id}
                  onClick={() =>
                    void run(
                      v.id,
                      () => reviewVetApplication(v.id, true),
                      () => setVets((prev) => prev.filter((x) => x.id !== v.id)),
                      "No pudimos aprobar la solicitud."
                    )
                  }
                >
                  <CheckCircle2 size={15} /> Aprobar
                </button>
                <button
                  type="button"
                  className="pc-outline-btn"
                  disabled={busyId === v.id}
                  onClick={() =>
                    void run(
                      v.id,
                      () => reviewVetApplication(v.id, false),
                      () => setVets((prev) => prev.filter((x) => x.id !== v.id)),
                      "No pudimos rechazar la solicitud."
                    )
                  }
                >
                  <XCircle size={15} /> Rechazar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && tab === "clinics" && (
        <section className="admin-list">
          {clinics.length === 0 && (
            <EmptyState
              title="No hay clínicas por verificar"
              body="Las veterinarias y refugios creados por profesionales verificados aparecerán aquí."
            />
          )}
          {clinics.map((c) => (
            <article key={c.id} className="admin-item">
              <div className="admin-item__head">
                <div>
                  <p className="admin-item__title">{c.name}</p>
                  <p className="admin-item__meta">
                    {c.kind === "shelter" ? "Refugio" : "Veterinaria"} ·{" "}
                    {c.address ?? "Sin dirección"} · {timeAgo(c.created_at)}
                  </p>
                </div>
              </div>
              <p className="pc-muted admin-item__meta">
                Creada por {c.creator?.name ?? "usuario"}
              </p>
              <div className="admin-item__actions">
                <button
                  type="button"
                  className="pc-pill-btn admin-approve"
                  disabled={busyId === c.id}
                  onClick={() =>
                    void run(
                      c.id,
                      () => verifyClinic(c.id, true),
                      () => setClinics((prev) => prev.filter((x) => x.id !== c.id)),
                      "No pudimos verificar la clínica."
                    )
                  }
                >
                  <CheckCircle2 size={15} /> Verificar
                </button>
                <button
                  type="button"
                  className="pc-outline-btn"
                  disabled={busyId === c.id}
                  onClick={() =>
                    void run(
                      c.id,
                      async () => {
                        await verifyClinic(c.id, false);
                        setNotice(
                          "Clínica rechazada: permanecerá sin verificar y no aparecerá en el mapa público."
                        );
                      },
                      () => setClinics((prev) => prev.filter((x) => x.id !== c.id)),
                      "No pudimos rechazar la clínica."
                    )
                  }
                >
                  <XCircle size={15} /> Rechazar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && tab === "comments" && (
        <section className="admin-list">
          {reports.length === 0 && (
            <EmptyState
              title="No hay comentarios reportados"
              body="Cuando alguien reporte un comentario, podrás revisarlo aquí."
            />
          )}
          {reports.map((r) => (
            <article key={r.id} className="admin-item">
              <div className="admin-item__head">
                <div>
                  <p className="admin-item__title">Comentario reportado</p>
                  <p className="admin-item__meta">
                    {timeAgo(r.created_at)} · reportado por {r.reporter?.name ?? "usuario"}
                  </p>
                </div>
                <span className="pc-badge pc-badge--lost">Reporte</span>
              </div>
              <p className="admin-item__body admin-item__body--quote">
                “{r.comment?.text ?? "Comentario no disponible"}”
              </p>
              {r.reason && <p className="pc-muted admin-item__meta">Motivo: {r.reason}</p>}
              <div className="admin-item__actions">
                <button
                  type="button"
                  className="pc-pill-btn admin-approve"
                  disabled={busyId === r.id}
                  onClick={() =>
                    void run(
                      r.id,
                      async () => {
                        await moderateComment(r.comment_id, true);
                        await resolveCommentReports(r.comment_id, "resolved");
                      },
                      () => setReports((prev) => prev.filter((x) => x.id !== r.id)),
                      "No pudimos ocultar el comentario."
                    )
                  }
                >
                  <CheckCircle2 size={15} /> Ocultar comentario
                </button>
                <button
                  type="button"
                  className="pc-outline-btn"
                  disabled={busyId === r.id}
                  onClick={() =>
                    void run(
                      r.id,
                      () => resolveCommentReports(r.comment_id, "dismissed"),
                      () => setReports((prev) => prev.filter((x) => x.id !== r.id)),
                      "No pudimos descartar el reporte."
                    )
                  }
                >
                  Descartar reporte
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
