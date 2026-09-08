import AuthScreen from "./AuthScreen.jsx";
import AuthHeader from "./AuthHeader.jsx";
import RegisterCard from "./RegisterCard.jsx";

function RegisterScreen({ onBack, onSwitchToLogin }) {
  return (
    <AuthScreen>
      <AuthHeader title="Crea tu cuenta" subtitle="¡Únete a nuestra comunidad!" onBack={onBack} />
      <RegisterCard onSwitchToLogin={onSwitchToLogin} />
    </AuthScreen>
  );
}

export default RegisterScreen;