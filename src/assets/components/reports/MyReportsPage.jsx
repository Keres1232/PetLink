import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import MapFilterTabs from "../map/MapFilterTabs.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import StatusTag from "../pets/StatusTag.jsx";
import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import { myReports, updateMyReport } from "../../../lib/api";
import { dayLabel } from "../../../lib/format";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import "./ReportLostPage.css";
import "./MyReportsPage.css";
import PawLoader from "../shared/PawLoader.jsx";

// Estados de la tabla reports
const STATUS = [
  { id: "open", label: "Abierta" },
  { id: "searching", label: "Buscando" },
  { id: "resolved", label: "Resuelta" },
  { id: "closed", label: "Cerrada" },
];
const STATUS_LABEL = Object.fromEntries(STATUS.map((s) => [s.id, s.label]));
const FINISHED = ["resolved", "closed"];

const FILTERS = ["Todas", "Activas", "Finalizadas"];
const MIN_RESOLUTION = 5;

function ReportCard({ report, onSaved }) {
  const [status, setStatus] = useState(report.status);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const lost = report.type === "lost";
  const name = report.pet?.name ?? (lost ? "Mascota perdida" : "Mascota encontrada");
  const photo = report.photos?.[0] ?? report.pet?.photo_url ?? null;
  const finishing = FINISHED.includes(status);
  const changed = status !== report.status || resolution.trim() !== "";
  // Al resolver o cerrar se pide contar brevemente qué pasó
  const needsResolution = finishing && !report.resolution && resolution.trim().length < MIN_RESOLUTION;

  const save = async () => {
    if (!changed || needsResolution || busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await updateMyReport(report.id, { status, resolution, postId: report.post_id });
      setResolution("");
      setSaved(true);
      await onSaved?.();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="my-report">
      <div className="my-report__top">
        <div className="my-report__photo">{photo ? <img src={photo} alt={name} /> : <AvatarPlaceholder />}</div>
        <div className="my-report__info">
          <StatusTag status={lost ? "Perdido" : "Encontrado"} />
          <h3 className="my-report__name">{name}</h3>
          <p className="my-report__meta">
            Publicada {dayLabel(report.created_at).toLowerCase()} · <strong>{STATUS_LABEL[report.status] ?? report.status}</strong>
          </p>
        </div>
      </div>

      {report.description && <p className="my-report__description">{report.description}</p>}

      {report.resolution && (
        <p className="my-report__resolution">
          <strong>Resolución:</strong> {report.resolution}
        </p>
      )}

      <span className="report-lost__label">Estado de la alerta</span>
      <ChipGroup options={STATUS} value={status} onChange={setStatus} variant="plain" />

      <label className="report-lost__field">
        <span className="report-lost__label">
          {finishing ? "¿Qué pasó? Cuéntalo en pocas palabras" : "Actualización (opcional)"}
        </span>
        <textarea
          className="report-lost__textarea"
          rows={3}
          placeholder={
            lost
              ? "Ej: La encontré en el parque gracias a un vecino que vio la alerta."
              : "Ej: Ya la entregué a su dueño, que la reconoció por la foto."
          }
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </label>

      {finishing && needsResolution && (
        <p className="my-report__hint">Escribe una resolución de al menos {MIN_RESOLUTION} caracteres.</p>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {saved && <p className="my-report__saved" role="status">Cambios guardados.</p>}

      <button
        type="button"
        className="report-lost__submit"
        disabled={!changed || needsResolution || busy}
        onClick={() => void save()}
      >
        {busy ? "Guardando..." : "Guardar cambios"}
      </button>
    </article>
  );
}

/** Alertas que publicó el usuario: cambiar su estado y escribir cómo se resolvió. */
function MyReportsPage({ onBack, onNotifications }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Todas");

  const load = useCallback(async () => {
    try {
      setReports(await myReports());
      setError("");
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar tus reportes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = reports.filter((r) =>
    filter === "Activas" ? !FINISHED.includes(r.status) : filter === "Finalizadas" ? FINISHED.includes(r.status) : true
  );

  return (
    <>
      <AppHeader title="Mis reportes" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="report-lost my-reports">
        <InfoNotice>
          Al marcar una alerta como resuelta o cerrada deja de aparecer en el mapa. Tu resolución se publica en la
          alerta para que la comunidad sepa cómo terminó.
        </InfoNotice>

        <MapFilterTabs filters={FILTERS} onChange={setFilter} />

        {loading && <PawLoader />}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="my-reports__empty">No tienes reportes {filter === "Todas" ? "publicados" : filter.toLowerCase()}.</p>
        )}

        {visible.map((r) => (
          <ReportCard key={`${r.id}-${r.status}-${r.resolution}`} report={r} onSaved={load} />
        ))}
      </div>
    </>
  );
}

export default MyReportsPage;
