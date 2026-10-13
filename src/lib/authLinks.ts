import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "./supabase";

/**
 * Enlace directo de la APK para los correos de Supabase (restablecer contraseña).
 * Está registrado en AndroidManifest.xml (scheme com.petlink.app, host restablecer) y debe
 * estar en Supabase → Authentication → URL Configuration → Redirect URLs. Si no está ahí,
 * Supabase usa la Site URL y el enlace se abre en la web, que también lo maneja.
 */
export const APP_RESET_URL = "com.petlink.app://restablecer";

export type AuthLinkResult = { kind: "recovery" } | { kind: "signed_in" } | { kind: "error"; message: string };

/** Mensaje para el error que Supabase deja en el enlace (vencido, ya usado…). */
export function authLinkErrorMessage(code: string | null, description: string | null): string | null {
  if (!code && !description) return null;
  if (code === "otp_expired") return "El enlace del correo expiró o ya se usó. Solicita uno nuevo.";
  return `No pudimos usar el enlace del correo (${description ?? code}). Solicita uno nuevo.`;
}

/** Parámetros del enlace: Supabase los pone en el #hash (implicit) o en ?query (code / errores). */
function linkParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const hashAt = url.indexOf("#");
  const queryAt = url.indexOf("?");
  if (queryAt >= 0) {
    const query = url.slice(queryAt + 1, hashAt > queryAt ? hashAt : undefined);
    new URLSearchParams(query).forEach((v, k) => params.set(k, v));
  }
  if (hashAt >= 0) new URLSearchParams(url.slice(hashAt + 1)).forEach((v, k) => params.set(k, v));
  return params;
}

/** Crea la sesión con los datos del enlace del correo abierto en la app. */
async function handleAuthLink(url: string): Promise<AuthLinkResult | null> {
  const params = linkParams(url);

  const error = authLinkErrorMessage(params.get("error_code"), params.get("error_description"));
  if (error) return { kind: "error", message: error };

  const recovery = params.get("type") === "recovery";
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const code = params.get("code");

  if (accessToken && refreshToken) {
    const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (e) return { kind: "error", message: "El enlace del correo expiró o ya se usó. Solicita uno nuevo." };
  } else if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) return { kind: "error", message: "El enlace del correo expiró o ya se usó. Solicita uno nuevo." };
  } else {
    return null; // no es un enlace de autenticación
  }
  return recovery || /restablecer/.test(url) ? { kind: "recovery" } : { kind: "signed_in" };
}

/**
 * Escucha los enlaces del correo que abren la APK (con la app cerrada o abierta).
 * Devuelve la función para dejar de escuchar. En la web no hace nada: ahí Supabase
 * lee el enlace de la barra de direcciones.
 */
export function listenAuthLinks(onResult: (result: AuthLinkResult) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  const seen = new Set<string>();
  const handle = (url: string | undefined) => {
    if (!url || seen.has(url) || !url.startsWith("com.petlink.app://")) return;
    seen.add(url);
    void handleAuthLink(url).then((result) => result && onResult(result));
  };

  // App cerrada: se abrió con el enlace
  void CapacitorApp.getLaunchUrl().then((launch) => handle(launch?.url));
  // App abierta o en segundo plano
  const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => handle(url));

  return () => void listener.then((l) => l.remove());
}
