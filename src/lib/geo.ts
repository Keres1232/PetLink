import { DEFAULT_CENTER, type GeoPoint } from "./types";

const CONSENT_KEY = "pc-geo-consent";
const LAST_POINT_KEY = "pc-geo-last-point";

// En un celular real el primer GPS puede tardar varios segundos (arranque en frío):
// se espera más y se acepta una posición reciente ya conocida por el sistema.
const GPS_OPTIONS: PositionOptions = { timeout: 15000, maximumAge: 10 * 60 * 1000 };

const PERMISSION_DENIED = 1;

export function hasGeoConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === "yes";
}

/** true si el usuario ya decidió (aceptó o rechazó) en este navegador. */
export function hasGeoDecision(): boolean {
  return localStorage.getItem(CONSENT_KEY) !== null;
}

export function setGeoConsent(consent: boolean): void {
  localStorage.setItem(CONSENT_KEY, consent ? "yes" : "no");
}

/** Última ubicación real conocida en este dispositivo (para no caer al centro de Bogotá si el GPS tarda). */
export function getLastPoint(): GeoPoint | null {
  try {
    const raw = localStorage.getItem(LAST_POINT_KEY);
    return raw ? (JSON.parse(raw) as GeoPoint) : null;
  } catch {
    return null;
  }
}

function saveLastPoint(point: GeoPoint): void {
  try {
    localStorage.setItem(LAST_POINT_KEY, JSON.stringify(point));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function getUserPoint(): Promise<GeoPoint> {
  if (!hasGeoConsent() || !("geolocation" in navigator)) {
    return Promise.resolve(DEFAULT_CENTER);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        saveLastPoint(point);
        resolve(point);
      },
      // Si el GPS no responde a tiempo se usa la última ubicación conocida antes que el centro de Bogotá
      () => resolve(getLastPoint() ?? DEFAULT_CENTER),
      GPS_OPTIONS
    );
  });
}

export function requestGeoConsent(): Promise<boolean> {
  if (!("geolocation" in navigator)) return Promise.resolve(false);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLastPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoConsent(true);
        resolve(true);
      },
      (err) => {
        // Solo cuenta como "no" si el usuario negó el permiso. Si el GPS tardó o no tenía
        // señal, el permiso SÍ se dio: antes esto quedaba guardado como negado.
        const denied = err.code === PERMISSION_DENIED;
        setGeoConsent(!denied);
        resolve(!denied);
      },
      GPS_OPTIONS
    );
  });
}
