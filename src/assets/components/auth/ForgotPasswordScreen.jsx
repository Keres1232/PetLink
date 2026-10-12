import { useState } from "react";
import AuthField from "./AuthField.jsx";
import AuthLogo from "./AuthLogo.jsx";
import CircleIconButton from "../shared/CircleIconButton.jsx";
import backIcon from "../../svg/Back.svg";
import { requestPasswordReset, verifyRecoveryCode } from "../../../lib/api";
import "./AuthPages.css";

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66557E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7L12 13L21 7" />
  </svg>
);

const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66557E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="15" r="4" />
    <path d="M10.85 12.15L19 4M17 6L20 9M15 8L17 10" />
  </svg>
);

/**
 * "¿Olvidaste tu contraseña?": Supabase envía un correo con un enlace y un código de 6 dígitos.
 * El código funciona también en el APK (el enlace abre el navegador, no la app).
 * Al verificarlo, la app muestra la pantalla "Nueva contraseña".
 */
function ForgotPasswordScreen({ initialEmail = "", linkError, onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ?? "");
  const [sent, setSent] = useState(false);

  const validEmail = email.includes("@") && email.trim().length >= 5;
  const validCode = /^\d{6}$/.test(code.trim());

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

  const verify = async (e) => {
    e.preventDefault();
    if (!validCode || busy) return;
    setBusy(true);
    setError("");
    const err = await verifyRecoveryCode(email.trim(), code);
    setBusy(false);
    if (err) setError(err);
    // Si sale bien, Supabase emite PASSWORD_RECOVERY y la app cambia sola a "Nueva contraseña"
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

          <p className="auth-switch">
            <button type="button" className="auth-link" onClick={() => setSent(true)} disabled={!validEmail}>
              Ya tengo un código
            </button>
          </p>
        </form>
      ) : (
        <form className="auth-card" onSubmit={verify}>
          <p className="auth-notice" role="status">
            Enviamos un correo a <strong>{email.trim()}</strong>. Escribe aquí el <strong>código de 6 dígitos</strong>{" "}
            que trae, o abre el enlace del correo en este mismo dispositivo. Revisa también la carpeta de spam.
          </p>

          <AuthField
            label="Código de 6 dígitos"
            icon={<KeyIcon />}
            type="text"
            placeholder="123456"
            autoComplete="one-time-code"
            value={code}
            onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="auth-submit" disabled={!validCode || busy}>
            {busy ? "Verificando..." : "Verificar código"}
          </button>

          <p className="auth-switch">
            ¿No te llegó?{" "}
            <button type="button" className="auth-link" onClick={() => void send()} disabled={busy}>
              Reenviar correo
            </button>
          </p>
        </form>
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
