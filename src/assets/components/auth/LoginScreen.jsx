import { useState } from "react";
import AuthField from "./AuthField.jsx";
import AuthLogo from "./AuthLogo.jsx";
import { useAuth } from "../../../context/AuthContext";
import "./AuthPages.css";

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" {...stroke} />
    <path d="M3 7L12 13L21 7" {...stroke} />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="9" rx="2" {...stroke} />
    <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" {...stroke} />
  </svg>
);

function LoginScreen({ onSwitchToRegister, onForgotPassword, initialEmail = "" }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim() !== "" && password !== "";

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__back-spacer" />
      <AuthLogo />
      <h1 className="auth-title">Bienvenido de vuelta</h1>
      <p className="auth-subtitle">Inicia sesión</p>

      <form className="auth-card" onSubmit={submit}>
        <AuthField label="Correo electrónico" icon={<MailIcon />} type="email"
          placeholder="nombre@correo.com" autoComplete="email" value={email} onChange={setEmail} />
        <AuthField label="Contraseña" icon={<LockIcon />} type="password"
          placeholder="Password" autoComplete="current-password" value={password} onChange={setPassword} />

        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Recordarme
          </label>
          <button type="button" className="auth-link" onClick={() => onForgotPassword?.(email.trim())}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" className="auth-submit" disabled={!canSubmit || loading}>
          {loading ? "Entrando..." : "Iniciar sesión"}
        </button>

        <p className="auth-switch">
          ¿No tienes cuenta?{" "}
          <button type="button" className="auth-link" onClick={onSwitchToRegister}>Regístrate</button>
        </p>
      </form>
    </div>
  );
}

export default LoginScreen;