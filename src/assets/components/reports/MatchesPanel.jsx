import { useCallback, useEffect, useState } from "react";
import { listReportMatches, resolveReportMatch } from "../../../lib/api";
import { timeAgo } from "../../../lib/format";
import "./MatchesPanel.css";

const STATUS_LABEL = { confirmed: "Confirmado", dismissed: "Descartado" };

/**
 * Avisos privados ("¡La encontré!") que recibió una alerta. Solo se muestra al dueño de la
 * publicación (y la RLS de report_matches solo se los devuelve a él).
 */
function MatchesPanel({ reportId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setMatches(await listReportMatches(reportId));
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar los avisos.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id, status) => {
    setBusyId(id);
    setError("");
    try {
      await resolveReportMatch(id, status);
      setMatches((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const pending = matches.filter((m) => m.status === "pending").length;

  return (
    <div className="matches-panel">
      <div className="matches-panel__head">
        <strong>Avisos privados {pending > 0 && <span className="matches-panel__count">{pending}</span>}</strong>
        <span>Solo tú los ves</span>
      </div>

      {loading && <p className="matches-panel__muted">Cargando…</p>}
      {!loading && matches.length === 0 && (
        <p className="matches-panel__muted">Todavía nadie te ha enviado un aviso sobre esta alerta.</p>
      )}

      {matches.map((m) => (
        <div key={m.id} className={`matches-panel__item ${m.status !== "pending" ? "is-resolved" : ""}`}>
          <div className="matches-panel__item-head">
            <strong>{m.finder?.name ?? "Usuario"}</strong>
            <span>{timeAgo(m.created_at)}</span>
            {m.status !== "pending" && (
              <span className={`matches-panel__badge is-${m.status}`}>{STATUS_LABEL[m.status]}</span>
            )}
          </div>
          {m.message && <p className="matches-panel__message">{m.message}</p>}
          {m.contact && (
            <p className="matches-panel__contact">
              Contacto: <strong>{m.contact}</strong>
            </p>
          )}
          {m.status === "pending" && (
            <div className="matches-panel__actions">
              <button
                type="button"
                className="matches-panel__dismiss"
                disabled={busyId === m.id}
                onClick={() => void resolve(m.id, "dismissed")}
              >
                No es mi mascota
              </button>
              <button
                type="button"
                className="matches-panel__confirm"
                disabled={busyId === m.id}
                onClick={() => void resolve(m.id, "confirmed")}
              >
                ¡Sí es!
              </button>
            </div>
          )}
        </div>
      ))}

      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}

export default MatchesPanel;
