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
import {
  isWeakPasswordError,
  translateAuthError,
  WEAK_PASSWORD_SIGNIN_HINT,
} from "../lib/authErrors";
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
    if (!error) return null;
    // Si la contraseña no cumple la política vigente, guía al restablecimiento
    if (isWeakPasswordError(error)) return WEAK_PASSWORD_SIGNIN_HINT;
    return translateAuthError(error);
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
    return error ? translateAuthError(error) : null;
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
