import { useState } from "react";

/**
 * En la ficha de TU mascota: "Dar en adopción" (abre el formulario con ella elegida) o, si ya está
 * publicada, "Quitar de adopción" (vuelve a ser solo tuya; pide confirmar con un segundo toque).
 */
function AdoptionToggle({ pet, onGive, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!pet.isAdoption) {
    return (
      onGive && (
        <button type="button" className="pet-detail__contact pet-detail__adopt-btn" onClick={() => onGive(pet)}>
          Dar en adopción
        </button>
      )
    );
  }

  if (!onRemove) return null;

  const remove = async () => {
    if (!confirming) return setConfirming(true);
    setBusy(true);
    setError("");
    try {
      await onRemove(pet);
    } catch (e) {
      console.error(e);
      setError("No pudimos quitarla de adopción. Intenta de nuevo.");
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <>
      {confirming && !busy && (
        <p className="pet-detail__adopt-hint">Dejará de verse en "En adopción". Toca otra vez para confirmar.</p>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="button" className="pet-detail__remove-adoption" disabled={busy} onClick={() => void remove()}>
        {busy ? "Quitando..." : confirming ? "Sí, quitar de adopción" : "Quitar de adopción"}
      </button>
    </>
  );
}

export default AdoptionToggle;
