import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GuideTour from "../components/ui/GuideTour";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useAuth } from "./AuthContext";
import { myPets } from "../lib/api";

type GuideContextValue = {
  openGuide: () => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

const WELCOME_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Guía de bienvenida de PetClue.
 * - Se abre sola la primera vez que la cuenta entra a Inicio (una vez por usuario/dispositivo).
 * - Se puede volver a abrir desde Ayuda y soporte.
 * - Después de la guía, a las cuentas sin mascotas se les recuerda dónde registrarlas.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userId = user?.id ?? null;
  const guideKey = userId ? `petclue:guide:${userId}` : null;
  const welcomeKey = userId ? `petclue:welcome-pets:${userId}` : null;

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [hasPets, setHasPets] = useState(true);
  const [welcomeClosed, setWelcomeClosed] = useState(false);

  // Al cambiar de cuenta se reinicia el estado de la sesión (el "visto" queda en localStorage)
  useEffect(() => {
    setOpen(false);
    setDone(false);
    setPetsLoaded(false);
    setHasPets(true);
    setWelcomeClosed(false);
  }, [userId]);

  // Primera visita a Inicio: abrir la guía si esta cuenta no la ha visto
  useEffect(() => {
    if (!guideKey || location.pathname !== "/" || done) return;
    try {
      if (localStorage.getItem(guideKey) === "vista") return;
    } catch {
      /* sin almacenamiento: se muestra igual */
    }
    setOpen(true);
  }, [guideKey, location.pathname, done]);

  // Saber si la cuenta ya tiene mascotas para el recordatorio de bienvenida
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void myPets()
      .then((pets) => {
        if (!alive) return;
        setHasPets(pets.length > 0);
        setPetsLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        // Si falla la consulta, no mostramos el recordatorio para no molestar
        setHasPets(true);
        setPetsLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const closeGuide = useCallback(() => {
    setOpen(false);
    setDone(true);
    if (guideKey) {
      try {
        localStorage.setItem(guideKey, "vista");
      } catch {
        /* sin almacenamiento: solo se cierra en esta sesión */
      }
    }
  }, [guideKey]);

  const openGuide = useCallback(() => setOpen(true), []);

  const snoozeWelcome = useCallback(() => {
    setWelcomeClosed(true);
    if (welcomeKey) {
      try {
        localStorage.setItem(welcomeKey, String(Date.now()));
      } catch {
        /* sin almacenamiento: solo se cierra en esta sesión */
      }
    }
  }, [welcomeKey]);

  const snoozed = () => {
    if (!welcomeKey) return false;
    try {
      const at = Number(localStorage.getItem(welcomeKey) ?? 0);
      return Date.now() - at < WELCOME_SNOOZE_MS;
    } catch {
      return false;
    }
  };

  const welcomeOpen =
    Boolean(userId) &&
    Boolean(profile) &&
    profile?.role !== "admin" &&
    location.pathname === "/" &&
    petsLoaded &&
    !hasPets &&
    !welcomeClosed &&
    !snoozed() &&
    !open;

  const value = useMemo<GuideContextValue>(() => ({ openGuide }), [openGuide]);

  return (
    <GuideContext.Provider value={value}>
      {children}

      <GuideTour
        open={open}
        onClose={closeGuide}
        onEnroll={() => {
          closeGuide();
          navigate("/mascotas/nueva");
        }}
      />

      {welcomeOpen && (
        <ConfirmModal
          title="¡Bienvenido a PetClue!"
          confirmLabel="Ir a mi perfil"
          cancelLabel="Más tarde"
          onConfirm={() => {
            snoozeWelcome();
            navigate("/perfil#mis-mascotas");
          }}
          onClose={snoozeWelcome}
        >
          <p>
            Registra a tus mascotas en tu perfil, en «Mis mascotas». Así, si alguna se pierde,
            podrás publicar su alerta en segundos con su foto y sus datos.
          </p>
        </ConfirmModal>
      )}
    </GuideContext.Provider>
  );
}

export function useGuide(): GuideContextValue {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide debe usarse dentro de <GuideProvider>");
  return ctx;
}
