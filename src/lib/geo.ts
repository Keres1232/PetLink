import { DEFAULT_CENTER, type GeoPoint } from "./types";

const CONSENT_KEY = "pc-geo-consent";

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

export function getUserPoint(): Promise<GeoPoint> {
  if (!hasGeoConsent() || !("geolocation" in navigator)) {
    return Promise.resolve(DEFAULT_CENTER);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(DEFAULT_CENTER),
      { timeout: 5000 }
    );
  });
}

export function requestGeoConsent(): Promise<boolean> {
  if (!("geolocation" in navigator)) return Promise.resolve(false);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoConsent(true);
        resolve(true);
      },
      () => {
        setGeoConsent(false);
        resolve(false);
      },
      { timeout: 8000 }
    );
  });
}
