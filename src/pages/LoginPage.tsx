import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/LoginCard.jsx";
import PawHeartLogo from "../components/PawHeartLogo.jsx";
import { useAuth } from "../contexts/AuthContext";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="auth-page">
      <div className="auth-page__hero">
        <PawHeartLogo />
        <h1 className="auth-page__title">Bienvenido a PetClue</h1>
        <p className="auth-page__subtitle">Inicia sesión</p>
      </div>

      {error && (
        <p className="pc-error-text auth-page__error" role="alert">
          {error}
        </p>
      )}

      <LoginCard
        onSwitchToRegister={() => navigate("/registro")}
        onSubmit={(data: { email: string; password: string }) => void handleSubmit(data)}
      />

      {busy && <p className="pc-muted auth-page__busy">Verificando…</p>}
    </div>
  );
}
