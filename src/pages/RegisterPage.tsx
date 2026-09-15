import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import RegisterCard from "../components/RegisterCard.jsx";
import PawHeartLogo from "../components/PawHeartLogo.jsx";
import { useAuth } from "../contexts/AuthContext";
import "../styles/auth.css";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit({ name, email, password }: RegisterPayload) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const err = await signUp(name, email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNotice("¡Cuenta creada exitosamente! Revisa tu correo para confirmarla.");
  }

  return (
    <div className="auth-page">
      <button
        type="button"
        className="auth-page__back"
        onClick={() => navigate("/login")}
        aria-label="Volver"
      >
        ‹
      </button>

      <div className="auth-page__hero">
        <PawHeartLogo />
        <h1 className="auth-page__title">Crea tu cuenta</h1>
        <p className="auth-page__subtitle">¡Únete a nuestra comunidad!</p>
      </div>

      {notice && (
        <p className="auth-page__notice" role="status">
          <CheckCircle2 size={16} /> {notice}
        </p>
      )}
      {error && (
        <p className="pc-error-text auth-page__error" role="alert">
          {error}
        </p>
      )}

      <RegisterCard
        onSwitchToLogin={() => navigate("/login")}
        onSubmit={(data: RegisterPayload) => void handleSubmit(data)}
      />

      {busy && <p className="pc-muted auth-page__busy">Creando cuenta…</p>}
    </div>
  );
}
