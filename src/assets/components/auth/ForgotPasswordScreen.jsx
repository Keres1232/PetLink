import { useState } from "react";
import AuthField from "./AuthField.jsx";
import AuthLogo from "./AuthLogo.jsx";
import CircleIconButton from "../shared/CircleIconButton.jsx";
import backIcon from "../../svg/Back.svg";
import { requestPasswordReset } from "../../../lib/api";
import "./AuthPages.css";

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66557E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7L12 13L21 7" />
  </svg>
);

/**
 * "¿Olvidaste tu contraseña?": Supabase envía un correo con un enlace. Al abrirlo, Supabase
 * emite PASSWORD_RECOVERY y la app muestra directamente la pantalla "Nueva contraseña".
 */
function ForgotPasswordScreen({ initialEmail = "", linkError, onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ?? "");
  const [sent, setSent] = useState(false);

  const validEmail = email.includes("@") && email.trim().length >= 5;

  const send = async (e) => {
    e?.preventDefault();
    if (!validEmail || busy) return;
    setBusy(true);
    setError("");
    const err = await requestPasswordReset(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__back-row">
        <CircleIconButton icon={backIcon} iconAlt="Volver" ariaLabel="Volver" onClick={onBack} />
      </div>
      <AuthLogo />
      <h1 className="auth-title">Recupera tu cuenta</h1>
      <p className="auth-subtitle">{sent ? "Revisa tu correo" : "Te enviaremos un correo para recuperarla"}</p>

      {!sent ? (
        <form className="auth-card" onSubmit={send}>
          <AuthField
            label="Correo electrónico"
            icon={<MailIcon />}
            type="email"
            placeholder="nombre@correo.com"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="auth-submit" disabled={!validEmail || busy}>
            {busy ? "Enviando..." : "Enviar correo"}
          </button>

        </form>
      ) : (
        <div className="auth-card">
          {/* Sin código: el enlace del correo abre directamente la pantalla "Nueva contraseña" */}
          <p className="auth-notice" role="status">
            Enviamos un correo a <strong>{email.trim()}</strong>. Abre el enlace <strong>«Restablecer contraseña»</strong>{" "}
            y te llevará a la pantalla para elegir tu nueva contraseña. Revisa también la carpeta de spam.
          </p>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <p className="auth-switch">
            ¿No te llegó?{" "}
            <button type="button" className="auth-link" onClick={() => void send()} disabled={busy}>
              Reenviar correo
            </button>
          </p>
        </div>
      )}

      <p className="auth-switch">
        <button type="button" className="auth-link" onClick={onBack}>
          Volver a iniciar sesión
        </button>
      </p>
    </div>
  );
}

export default ForgotPasswordScreen;
