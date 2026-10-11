import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import FormField from "./FormField.jsx";
import RememberForgotRow from "./RememberForgotRow.jsx";
import PrimaryButton from "./PrimaryButton.jsx";
import TermsConsent from "./ui/TermsConsent";
import "./LoginCard.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function LoginCard({ onSwitchToRegister, onForgotPassword, onSubmit, onGoogleSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleSubmit = () => {
    onSubmit?.({ email: email.trim(), password, remember });
  };

  const handleGoogle = async () => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    setGoogleBusy(true);
    const err = await onGoogleSignIn?.();
    if (err) setGoogleBusy(false);
  };

  return (
    <div className="login-card">
      <div className="login-card__completa">
        <div className="login-card__btn-group">
          <div className="login-card__superior">
            <div className="login-card__inputs">
              <FormField
                label="Correo electrónico"
                icon={<Mail size={16} />}
                type="email"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormField
                label="Contraseña"
                icon={<Lock size={16} />}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <RememberForgotRow
              remember={remember}
              onToggleRemember={() => setRemember(!remember)}
              onForgotPassword={() => onForgotPassword?.()}
            />
          </div>

          <PrimaryButton onClick={handleSubmit}>Iniciar sesión</PrimaryButton>

          <div className="login-card__google-group">
            <div className="login-card__divider">
              <span>o</span>
            </div>

            <button
              type="button"
              className="login-card__google"
              disabled={googleBusy}
              onClick={() => void handleGoogle()}
            >
              <GoogleIcon />
              {googleBusy ? "Redirigiendo…" : "Continuar con Google"}
            </button>

            <TermsConsent
              checked={acceptedTerms}
              onChange={(v) => {
                setAcceptedTerms(v);
                setTermsError(false);
              }}
              error={termsError}
              errorMessage="Debes aceptar los Términos de uso y la Política de privacidad para continuar con Google."
            />
          </div>
        </div>

        <p className="login-card__signup">
          ¿No tienes cuenta?{" "}
          <button type="button" className="login-card__signup-link" onClick={onSwitchToRegister}>
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginCard;
