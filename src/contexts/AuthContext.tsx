import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { LEGAL_VERSION } from "../lib/legalDocs";
import { consumePendingConsent } from "../lib/legalConsent";
import { acceptLegalTerms } from "../lib/api";
import type { Profile } from "../lib/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | null) => {
    setProfileLoading(true);
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, vet_status, created_at")
        .eq("id", userId)
        .maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch {
      setProfile(null);
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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadProfile(next?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const loading = sessionLoading || profileLoading;

  // Registra la aceptación legal pendiente tras el ingreso con Google (OAuth).
  useEffect(() => {
    if (sessionLoading || !session) return;
    const version = consumePendingConsent();
    if (!version) return;
    void acceptLegalTerms(version).catch(() => {
      /* best-effort: la evidencia no debe bloquear el ingreso */
    });
  }, [session, sessionLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          terms_accepted: true,
          terms_version: LEGAL_VERSION,
        },
      },
    });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
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
      signInWithGoogle,
      signOut,
      refreshProfile: () => loadProfile(session?.user.id ?? null),
    }),
    [session, profile, loading, signIn, signUp, signInWithGoogle, signOut, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (message.includes("Email not confirmed"))
    return "Confirma tu correo antes de iniciar sesión.";
  if (message.includes("already registered"))
    return "No pudimos completar el registro. Revisa tu correo o intenta iniciar sesión.";
  if (message.includes("Password should be"))
    return "La contraseña debe tener al menos 6 caracteres.";
  return message;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
