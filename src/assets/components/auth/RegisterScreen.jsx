import { useState } from "react";
import AuthField from "./AuthField.jsx";
import AuthLogo from "./AuthLogo.jsx";
import PermissionsModal from "../shared/PermissionsModal.jsx";
import LegalModal from "../shared/LegalModal.jsx";
import CircleIconButton from "../shared/CircleIconButton.jsx";
import SuccessToast from "../shared/SuccessToast.jsx";
import backIcon from "../../svg/Back.svg";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { updateSettings } from "../../../lib/api";
import { PASSWORD_POLICY_HINT, meetsPasswordPolicy } from "../../../lib/authErrors";
import "./AuthPages.css";

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" {...stroke} />
    <path d="M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21" {...stroke} />
  </svg>
);
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

function RegisterScreen({ onBack, onSwitchToLogin, onRegisterSuccess }) {
  const { signUp, signOut } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [legal, setLegal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Política de seguridad del proyecto (la misma de cambiar y recuperar la contraseña)
  const strongPassword = meetsPasswordPolicy(password);
  const canSubmit = name.trim() !== "" && email.trim() !== "" && strongPassword && accepted;

  const finish = async ({ location }) => {
    if (loading) return;
    setLoading(true);
    setError("");

    const err = await signUp(name.trim(), email.trim(), password);
    if (err) {
      setLoading(false);
      setPermOpen(false);
      setError(err);
      return;
    }

    // Solo guardamos el consentimiento si ya hay sesión.
    // Sin sesión (correo por confirmar) se evita la petición que daba 400.
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      try {
        await updateSettings({ geolocationConsent: Boolean(location) });
      } catch {
        /* se podrá guardar después del primer inicio de sesión */
      }
      setNeedsConfirm(false);
    } else {
      setNeedsConfirm(true);
    }

    setLoading(false);
    setPermOpen(false);
    setCreated(true);
  };

  const afterToast = async () => {
    setCreated(false);
    await signOut();
    if (onRegisterSuccess) onRegisterSuccess({ name: name.trim(), email: email.trim() });
    else onSwitchToLogin?.();
  };

  return (
    <div className="auth-page">
      <SuccessToast
        open={created}
        message={needsConfirm ? "¡Cuenta creada! Revisa tu correo para confirmarla" : "¡Cuenta creada exitosamente!"}
        duration={needsConfirm ? 3500 : 2200}
        onDone={afterToast}
      />

      <div className="auth-page__back">
        <CircleIconButton icon={backIcon} iconAlt="Volver" ariaLabel="Volver" onClick={onBack} />
      </div>

      <AuthLogo />
      <h1 className="auth-title">Crea tu cuenta</h1>
      <p className="auth-subtitle">¡Únete a nuestra comunidad!</p>

      <form className="auth-card" onSubmit={(e) => { e.preventDefault(); if (canSubmit) setPermOpen(true); }}>
        <AuthField label="Nombre" icon={<UserIcon />} placeholder="¿Cómo te llamas?"
          autoComplete="name" value={name} onChange={setName} />
        <AuthField label="Correo electrónico" icon={<MailIcon />} type="email"
          placeholder="nombre@correo.com" autoComplete="email" value={email} onChange={setEmail} />
        <AuthField label="Contraseña" icon={<LockIcon />} type="password"
          placeholder="Password" autoComplete="new-password" value={password} onChange={setPassword} />
        <p className={password && !strongPassword ? "auth-error" : "auth-hint"}>{PASSWORD_POLICY_HINT}</p>

        <div className="auth-check">
          <input id="accept-terms" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            Acepto los{" "}
            <button type="button" className="auth-link auth-link--soft" onClick={() => setLegal("terms")}>Términos de uso</button>{" "}
            y la{" "}
            <button type="button" className="auth-link auth-link--soft" onClick={() => setLegal("privacy")}>Política de privacidad</button>{" "}
            de PetClue.
          </span>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" className="auth-submit" disabled={!canSubmit || loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{" "}
          <button type="button" className="auth-link" onClick={onSwitchToLogin}>Inicia sesión</button>
        </p>
      </form>

      <PermissionsModal open={permOpen} onClose={() => setPermOpen(false)} onConfirm={finish} />
      <LegalModal type={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

export default RegisterScreen;