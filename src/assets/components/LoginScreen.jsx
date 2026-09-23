import AuthScreen from "./AuthScreen.jsx";
import AuthHeader from "./AuthHeader.jsx";
import LoginCard from "./LoginCard.jsx";

function LoginScreen({ onBack, onSwitchToRegister, onLoginSuccess }) {
  return (
    <AuthScreen>
      <AuthHeader title="Bienvenido de vuelta" subtitle="Inicia sesión" onBack={onBack} />
      <LoginCard onSwitchToRegister={onSwitchToRegister} onLoginSuccess={onLoginSuccess} />
    </AuthScreen>
  );
}

export default LoginScreen;