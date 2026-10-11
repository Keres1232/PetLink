const KEY = "petclue:pending-legal";
const TTL_MS = 15 * 60 * 1000;

/**
 * Marca la aceptación legal justo antes de redirigir a Google (OAuth).
 * Al volver con sesión, AuthContext consume esta marca y registra la
 * evidencia en `private_profiles` (Ley 1581).
 */
export function markPendingConsent(version: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version, ts: Date.now() }));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Devuelve la versión pendiente (y la borra) si es reciente; si no, null. */
export function consumePendingConsent(): string | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    window.localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { version?: string; ts?: number };
    if (!parsed.version || !parsed.ts) return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.version;
  } catch {
    return null;
  }
}
