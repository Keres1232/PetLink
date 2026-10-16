import { useState } from "react";
import { adminDeletePet, adminDeleteReport } from "../../../lib/api";

const TEXT = {
  report: {
    button: "Eliminar alerta (admin)",
    confirm: "Sí, eliminar alerta",
    warning: "Dejará de verse en el mapa y en la comunidad. No se puede deshacer.",
    error: "No pudimos eliminar la alerta. Intenta de nuevo.",
  },
  pet: {
    button: "Quitar publicación (admin)",
    confirm: "Sí, quitarla",
    warning: "Dejará de verse en «En adopción» y en los perfiles.",
    error: "No pudimos quitar esta mascota. Intenta de nuevo.",
  },
};

/**
 * Admin, en la ficha de otra persona: eliminar una alerta (admin_delete_report: también su
 * publicación) o quitar una mascota, p. ej. en adopción (admin_delete_pet: borrado lógico).
 * Pide un segundo toque.
 */
function AdminDeleteReport({ kind = "report", targetId, onDeleted }) {
  const t = TEXT[kind] ?? TEXT.report;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (!confirming) return setConfirming(true);
    setBusy(true);
    setError("");
    try {
      await (kind === "pet" ? adminDeletePet(targetId) : adminDeleteReport(targetId));
      onDeleted?.();
    } catch (e) {
      console.error(e);
      setError(e?.message?.includes("supabase/sql") ? e.message : t.error);
      setConfirming(false);
      setBusy(false);
    }
  };

  return (
    <div className="pet-detail__admin">
      {confirming && !busy && <p className="pet-detail__adopt-hint">{t.warning}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="pet-detail__admin-row">
        {confirming && !busy && (
          <button type="button" className="pet-detail__admin-cancel" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        )}
        <button type="button" className="pet-detail__remove-adoption pet-detail__admin-delete" disabled={busy} onClick={() => void remove()}>
          {busy ? "Eliminando..." : confirming ? t.confirm : t.button}
        </button>
      </div>
    </div>
  );
}

export default AdminDeleteReport;
