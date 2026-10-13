import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { translateAuthError } from "../lib/authErrors";
import { authLinkErrorMessage, listenAuthLinks } from "../lib/authLinks";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** true mientras el usuario debe elegir una contraseña nueva (enlace de recuperación). */
  recovering: boolean;
  endRecovery: () => void;
  /** Error que trae la URL al abrir un enlace del correo (vencido, ya usado…). */
  authLinkError: string | null;
  clearAuthLinkError: () => void;
}

/** Lee el error que Supabase deja en la URL cuando un enlace del correo no sirve, y lo quita de la barra. */
function readAuthLinkError(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  new URLSearchParams(window.location.search).forEach((v, k) => params.set(k, v));
  const message = authLinkErrorMessage(params.get("error_code"), params.get("error_description"));
  if (message) window.history.replaceState(null, "", window.location.pathname);
  return message;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  // Si se abrió la app desde el enlace de recuperación, se sabe por la URL antes de que Supabase la procese
  const [recovering, setRecovering] = useState(() => /type=recovery/.test(window.location.hash + window.location.search));
  const [authLinkError, setAuthLinkError] = useState<string | null>(readAuthLinkError);
  const loadedUserId = useRef<string | null | undefined>(undefined);

  const loadProfile = useCallback(async (userId: string | null) => {
    // Solo se muestra "Cargando…" cuando cambia de usuario. Si es el mismo (renovar sesión,
    // volver a verificar la contraseña, cambiar la foto…) se recarga en silencio, sin
    // desmontar la pantalla en la que está el usuario.
    const sameUser = loadedUserId.current === userId;
    loadedUserId.current = userId;
    if (!sameUser) setProfileLoading(true);
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      // avatar_url es la foto de perfil oficial (la misma en la web y en la app)
      let { data, error } = await supabase
        .from("profiles")
        .select("id, name, role, vet_status, created_at, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (error?.code === "42703") {
        // Aún no existe la columna avatar_url (falta el SQL): se carga el perfil sin foto
        ({ data, error } = await supabase
          .from("profiles")
          .select("id, name, role, vet_status, created_at")
          .eq("id", userId)
          .maybeSingle());
      }
      setProfile((data as Profile | null) ?? null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionLoading(false);
      void loadProfile(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Llegó desde el enlace de "Olvidé mi contraseña": hay que pedir la contraseña nueva
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
      void loadProfile(next?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // APK: el enlace del correo (com.petlink.app://restablecer#...) abre la app y aquí se crea
  // la sesión de recuperación; luego se muestra "Nueva contraseña"
  useEffect(
    () =>
      listenAuthLinks((result) => {
        if (result.kind === "recovery") {
          setAuthLinkError(null);
          setRecovering(true);
        } else if (result.kind === "error") {
          setRecovering(false);
          setAuthLinkError(result.message);
        }
      }),
    []
  );

  const loading = sessionLoading || profileLoading;

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile: () => loadProfile(session?.user.id ?? null),
      recovering,
      endRecovery: () => setRecovering(false),
      authLinkError,
      clearAuthLinkError: () => setAuthLinkError(null),
    }),
    [session, profile, loading, signIn, signUp, signOut, loadProfile, recovering, authLinkError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}