import { useState } from "react";
import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import PawBackground from "../shared/PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import { createReportMatch, expressAdoptionInterest } from "../../../lib/api";
import "./MatchSheet.css";

/**
 * Mensaje privado a quien publicó (no es un chat: solo lo ve el dueño de la publicación).
 * - Alertas ("¡La encontré!" / "Contactar al dueño"): tabla report_matches.
 * - Adopción (`report.adoption`): adoption_interests; el dueño lo ve como interesado en la ficha de su mascota.
 *
 * `report`: { id, name, photoUrl, lost, adoption } — id es el del reporte o el de la mascota en adopción.
 */
function MatchSheet({ report, onClose, onSent }) {
  const open = Boolean(report);
  useLockBodyScroll(open);
  const swipe = useSwipeToClose(onClose);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!report) return null;

  const adoption = Boolean(report.adoption);
  const lost = !adoption && report.lost !== false;

  const title = sent
    ? "Mensaje enviado"
    : adoption
      ? `Contactar al dueño de ${report.name}`
      : lost
        ? `¿Encontraste a ${report.name}?`
        : "Contactar a quien la encontró";

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (adoption) {
        // adoption_interests solo guarda el mensaje: el contacto va dentro del mismo texto
        const text = [message.trim(), contact.trim() && `Contacto: ${contact.trim()}`].filter(Boolean).join("\n");
        await expressAdoptionInterest(report.id, text);
      } else {
        await createReportMatch({ reportId: report.id, message, contact });
      }
      setSent(true);
      onSent?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || "No pudimos enviar tu mensaje. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="match-sheet__overlay" onClick={onClose}>
      <div className="match-sheet__sheet" {...swipe} onClick={(e) => e.stopPropagation()}>
        {/* Fondo lila de la app con huellas */}
        <PawBackground contained />

        <div className="match-sheet__content">
          <span className="match-sheet__handle" />

          <div className="match-sheet__head">
            <span className="match-sheet__photo">
              {report.photoUrl ? <img src={report.photoUrl} alt="" /> : <AvatarPlaceholder />}
            </span>
            <div>
              <h2 className="match-sheet__title">{title}</h2>
              <p className="match-sheet__privacy">
                {adoption ? "Solo lo verá el dueño de la mascota." : "Solo lo verá quien publicó la alerta."}
              </p>
            </div>
          </div>

          {sent ? (
            <>
              <p className="match-sheet__text">
                {adoption
                  ? "Le enviamos tu mensaje al dueño. Lo verá en la ficha de su mascota y, si dejaste un contacto, podrá comunicarse contigo."
                  : "Le avisamos a quien publicó la alerta. Lo verá en su publicación de la comunidad y, si dejaste un contacto, podrá comunicarse contigo."}
              </p>
              <button type="button" className="match-sheet__send" onClick={onClose}>
                Entendido
              </button>
            </>
          ) : (
            <>
              <label className="match-sheet__field">
                <span>
                  {adoption
                    ? "¿Por qué quieres adoptarla?"
                    : lost
                      ? "¿Dónde y cómo la encontraste?"
                      : "¿Por qué crees que es tu mascota?"}
                </span>
                <textarea
                  rows={3}
                  placeholder={
                    adoption
                      ? "Ej: Tengo patio, experiencia con perros y tiempo para cuidarla…"
                      : lost
                        ? "Ej: La vi en el parque, lleva collar rojo…"
                        : "Ej: Es mi perro, tiene una mancha en la oreja izquierda…"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <label className="match-sheet__field">
                <span>Tu contacto (opcional)</span>
                <input placeholder="Teléfono o correo" value={contact} onChange={(e) => setContact(e.target.value)} />
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button
                type="button"
                className="match-sheet__send"
                disabled={busy || (adoption ? message.trim().length < 5 : !message.trim() && !contact.trim())}
                onClick={() => void send()}
              >
                {busy ? "Enviando..." : lost ? "Avisar al dueño" : "Enviar mensaje"}
              </button>
              <button type="button" className="match-sheet__cancel" onClick={onClose}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchSheet;
