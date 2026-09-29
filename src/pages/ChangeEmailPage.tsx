import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useAuth } from "../contexts/AuthContext";
import { changeEmail } from "../lib/api";
import "../styles/pages.css";

export default function ChangeEmailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const currentEmail = user?.email ?? "";
  const verified = Boolean(user?.email_confirmed_at);

  async function submit() {
    if (!newEmail.includes("@") || newEmail.trim().length < 5) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!password) {
      setError("Confirma tu contraseña actual.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await changeEmail({
      currentEmail,
      currentPassword: password,
      newEmail: newEmail.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Correo electrónico</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <p className="pc-muted location-help" style={{ marginTop: 0 }}>
          Te enviaremos un enlace de confirmación al nuevo correo. El cambio no se aplica hasta
          que lo confirmes.
        </p>

        <div className="pc-field">
          <span className="pc-field-label">Correo actual</span>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {currentEmail}{" "}
            {verified && (
              <span className="pc-badge pc-badge--shelter">
                <BadgeCheck size={11} style={{ verticalAlign: "-1px" }} /> Verificado
              </span>
            )}
          </p>
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="new-email">
            Nuevo correo electrónico
          </label>
          <input
            id="new-email"
            className="pc-input"
            type="email"
            placeholder="nombre@correo.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="confirm-pass">
            Confirma tu contraseña
          </label>
          <input
            id="confirm-pass"
            className="pc-input"
            type="password"
            placeholder="Tu contraseña actual"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}
        {sent && (
          <p className="auth-page__notice" role="status">
            Te enviamos un enlace de confirmación a <strong>{newEmail}</strong>. El cambio se
            aplicará cuando lo confirmes.
          </p>
        )}

        <div className="pc-form-actions">
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Enviando…" : "Enviar confirmación"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
