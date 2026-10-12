import { useCallback, useEffect, useState } from "react";
import { expressAdoptionInterest, listAdoptionInterests, respondAdoptionInterest } from "../../../lib/api";
import { timeAgo } from "../../../lib/format";
import "./AdoptionPanel.css";

const STATUS_LABEL = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", withdrawn: "Retirado" };

/**
 * Adopción dentro de la ficha de una mascota en adopción (pets.status = 'for_adoption').
 * - Otra persona: deja un mensaje "Quiero adoptarlo" (express_adoption_interest).
 * - Dueño: ve a los interesados y aprueba o rechaza (respond_adoption_interest; al aprobar la
 *   mascota pasa a "adoptada").
 */
function AdoptionPanel({ pet, isOwner, onChanged }) {
  const [message, setMessage] = useState("");
  const [interests, setInterests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setInterests(await listAdoptionInterests(pet.id));
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar a los interesados.");
    }
  }, [pet.id]);

  useEffect(() => {
    if (isOwner) void load();
  }, [isOwner, load]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      console.error(e);
      setError(e?.message || "No se pudo completar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (isOwner) {
    return (
      <div className="adoption">
        <h3 className="pet-detail__section">Interesados en adoptar</h3>
        {interests.length === 0 && <p className="adoption__muted">Todavía nadie ha pedido adoptarla.</p>}
        {interests.map((i) => (
          <div key={i.id} className="adoption__item">
            <div className="adoption__item-head">
              <strong>{i.interested?.name ?? "Usuario"}</strong>
              <span className={`adoption__status adoption__status--${i.status}`}>{STATUS_LABEL[i.status]}</span>
            </div>
            {i.message && <p className="adoption__message">{i.message}</p>}
            <span className="adoption__muted">{timeAgo(i.created_at)}</span>
            {i.status === "pending" && (
              <div className="adoption__actions">
                <button
                  type="button"
                  className="adoption__reject"
                  disabled={busy}
                  onClick={() => void run(async () => {
                    await respondAdoptionInterest(i.id, "rejected");
                    await load();
                  })}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="adoption__accept"
                  disabled={busy}
                  onClick={() => void run(async () => {
                    await respondAdoptionInterest(i.id, "approved");
                    await load();
                    onChanged?.();
                  })}
                >
                  Aprobar adopción
                </button>
              </div>
            )}
          </div>
        ))}
        {error && <p className="auth-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="adoption">
      <h3 className="pet-detail__section">¿Quieres adoptarla?</h3>
      {sent ? (
        <p className="adoption__sent" role="status">
          ¡Listo! Le avisamos a quien la publicó. Te contactará si aprueba tu solicitud.
        </p>
      ) : (
        <>
          <textarea
            className="adoption__textarea"
            rows={3}
            placeholder="Cuéntale por qué quieres adoptarla y cómo contactarte."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button
            type="button"
            className="pet-detail__contact"
            disabled={busy || message.trim().length < 5}
            onClick={() => void run(async () => {
              await expressAdoptionInterest(pet.id, message.trim());
              setSent(true);
            })}
          >
            {busy ? "Enviando..." : "Quiero adoptarla"}
          </button>
        </>
      )}
    </div>
  );
}

export default AdoptionPanel;
