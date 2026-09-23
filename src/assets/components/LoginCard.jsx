import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import FormField from "./FormField.jsx";
import RememberForgotRow from "./RememberForgotRow.jsx";
import PrimaryButton from "./PrimaryButton.jsx";
import "./LoginCard.css";

function LoginCard({ onSwitchToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) {
      alert("Ingresa tu correo y contraseña.");
      return;
    }
    console.log("Sesión iniciada:", { email, password, remember });
    onLoginSuccess(email);
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
              onForgotPassword={() => console.log("Ir a recuperar contraseña")}
            />
          </div>

          <PrimaryButton onClick={handleSubmit}>Iniciar sesión</PrimaryButton>
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