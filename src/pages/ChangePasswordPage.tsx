import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useAuth } from "../contexts/AuthContext";
import { changePassword } from "../lib/api";
import "../styles/pages.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!current) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    if (next.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await changePassword({
      email: user?.email ?? "",
      currentPassword: current,
      newPassword: next,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Cambiar contraseña</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <div className="pc-field">
          <label className="pc-field-label" htmlFor="current-pass">
            Contraseña actual
          </label>
          <input
            id="current-pass"
            className="pc-input"
            type="password"
            placeholder="Ingresa tu contraseña actual"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="new-pass">
            Nueva contraseña
          </label>
          <input
            id="new-pass"
            className="pc-input"
            type="password"
            placeholder="Ingresa tu nueva contraseña"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="confirm-new-pass">
            Confirma la nueva contraseña
          </label>
          <input
            id="confirm-new-pass"
            className="pc-input"
            type="password"
            placeholder="Repite la nueva contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="auth-page__notice" role="status">
            ¡Contraseña actualizada! Cerramos sesión en tus otros dispositivos por seguridad.
          </p>
        )}

        <p className="pc-muted location-help">
          Después de cambiar tu contraseña, cerraremos sesión en tus otros dispositivos por
          seguridad.
        </p>

        <div className="pc-form-actions">
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Guardando…" : "Guardar cambios"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
