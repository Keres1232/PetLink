import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import { LoadingState } from "./components/ui/States";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import MiPetReportPage from "./pages/MiPetReportPage";
import FoundPetReportPage from "./pages/FoundPetReportPage";
import CommunityPage from "./pages/CommunityPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import PetFormPage from "./pages/PetFormPage";
import ChangeEmailPage from "./pages/ChangeEmailPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AyudaPage from "./pages/AyudaPage";

function FullLoading() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <LoadingState label="Iniciando PetClue…" />
    </div>
  );
}

function ProtectedArea({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicArea({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicArea>
                <LoginPage />
              </PublicArea>
            }
          />
          <Route
            path="/registro"
            element={
              <PublicArea>
                <RegisterPage />
              </PublicArea>
            }
          />
          <Route
            element={
              <ProtectedArea>
                <AppLayout />
              </ProtectedArea>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/mapa" element={<MapPage />} />
            <Route path="/reportar" element={<ReportPage />} />
            <Route path="/reportar/mi-mascota" element={<MiPetReportPage />} />
            <Route path="/reportar/encontrada" element={<FoundPetReportPage />} />
            <Route path="/comunidad" element={<CommunityPage />} />
            <Route path="/notificaciones" element={<NotificationsPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/mascotas/nueva" element={<PetFormPage />} />
            <Route path="/configuracion/correo" element={<ChangeEmailPage />} />
            <Route path="/configuracion/contrasena" element={<ChangePasswordPage />} />
            <Route path="/ayuda" element={<AyudaPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
