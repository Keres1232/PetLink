import { useState } from "react";
import LoginScreen from "./assets/components/LoginScreen.jsx";
import RegisterScreen from "./assets/components/RegisterScreen.jsx";

function App() {
  const [authView, setAuthView] = useState("login"); // "login" | "register"

  return (
    <div
  style={{
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#1a1a1a",
  }}
>
      {authView === "login" ? (
        <LoginScreen
          onBack={() => console.log("Volver")}
          onSwitchToRegister={() => setAuthView("register")}
        />
      ) : (
        <RegisterScreen
          onBack={() => setAuthView("login")}
          onSwitchToLogin={() => setAuthView("login")}
        />
      )}
    </div>
  );
}

export default App;