import AuthScreen from "./AuthScreen.jsx";
import AuthHeader from "./AuthHeader.jsx";
import LoginCard from "./LoginCard.jsx";

function LoginScreen({ onBack, onSwitchToRegister }) {
  return (
    <AuthScreen>
      <AuthHeader title="Bienvenido de vuelta" subtitle="Inicia sesión" onBack={onBack} />
      <LoginCard onSwitchToRegister={onSwitchToRegister} />
    </AuthScreen>
  );
}

export default LoginScreen;