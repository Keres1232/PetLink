import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import FormField from "./FormField.jsx";
import PrimaryButton from "./PrimaryButton.jsx";
import TermsConsent from "./ui/TermsConsent";
import "./LoginCard.css";

function RegisterCard({ onSwitchToLogin, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const handleSubmit = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    onSubmit?.({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div className="login-card">
      <div className="login-card__completa">
        <div className="login-card__btn-group">
          <div className="login-card__superior">
            <div className="login-card__inputs">
              <FormField
                label="Nombre"
                icon={<User size={16} />}
                placeholder="¿Cómo te llamas?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
              <p className="register-card__password-hint">
                Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.
              </p>
            </div>

            <TermsConsent
              checked={acceptedTerms}
              onChange={(v) => {
                setAcceptedTerms(v);
                setTermsError(false);
              }}
              error={termsError}
              errorMessage="Debes aceptar los Términos de uso y la Política de privacidad para crear tu cuenta."
            />
          </div>

          <PrimaryButton onClick={handleSubmit}>Crear cuenta</PrimaryButton>
        </div>

        <p className="login-card__signup">
          ¿Ya tienes cuenta?{" "}
          <button type="button" className="login-card__signup-link" onClick={onSwitchToLogin}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterCard;
