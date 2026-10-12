import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext.jsx";
import ErrorBoundary from "./assets/components/shared/ErrorBoundary.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Si una pantalla falla, se muestra "Algo salió mal · Recargar" en vez de la app en blanco */}
    <ErrorBoundary>
      <AuthProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
