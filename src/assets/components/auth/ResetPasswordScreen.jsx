import { useState } from "react";
import AuthField from "./AuthField.jsx";
import AuthLogo from "./AuthLogo.jsx";
import { setNewPassword } from "../../../lib/api";
import { PASSWORD_POLICY_HINT, meetsPasswordPolicy } from "../../../lib/authErrors";
import "./AuthPages.css";

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66557E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" />
  </svg>
);

/** Se muestra al abrir el enlace del correo de recuperación (evento PASSWORD_RECOVERY). */
function ResetPasswordScreen({ hasSession, onDone, onRequestNew }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!meetsPasswordPolicy(password)) return setError(PASSWORD_POLICY_HINT);
    if (password !== confirm) return setError("La nueva contraseña y su confirmación no coinciden.");
    setBusy(true);
    setError("");
    const err = await setNewPassword(password);
    setBusy(false);
    if (err) setError(err);
    else setDone(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__back-spacer" />
      <AuthLogo />
      <h1 className="auth-title">Nueva contraseña</h1>
      <p className="auth-subtitle">Elige una contraseña segura</p>

      <form className="auth-card" onSubmit={submit}>
        {!hasSession && !done ? (
          <>
            <p className="auth-error" role="alert">
              El enlace expiró o ya se usó. Pide un correo nuevo para restablecer tu contraseña.
            </p>
            <button type="button" className="auth-submit" onClick={onRequestNew}>
              Recuperar contraseña
            </button>
          </>
        ) : done ? (
          <>
            <p className="auth-notice" role="status">¡Listo! Tu contraseña fue actualizada.</p>
            <button type="button" className="auth-submit" onClick={onDone}>
              Continuar
            </button>
          </>
        ) : (
          <>
            <AuthField label="Nueva contraseña" icon={<LockIcon />} type="password"
              autoComplete="new-password" value={password} onChange={setPassword} />
            <AuthField label="Confirma la contraseña" icon={<LockIcon />} type="password"
              autoComplete="new-password" value={confirm} onChange={setConfirm} />

            <p className="auth-hint">{PASSWORD_POLICY_HINT}</p>
            {error && <p className="auth-error" role="alert">{error}</p>}

            <button type="submit" className="auth-submit" disabled={busy || !password || !confirm}>
              {busy ? "Guardando..." : "Guardar contraseña"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default ResetPasswordScreen;
