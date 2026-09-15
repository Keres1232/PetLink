import { useCallback, useEffect, useState } from "react";
import { getPrivateProfile, setMyLocation, updateSettings } from "../lib/api";
import { setGeoConsent, getUserPoint, requestGeoConsent } from "../lib/geo";
import { DEFAULT_CENTER, type GeoPoint } from "../lib/types";

const DEFAULT_RADIUS_M = 5000;

interface UseUserLocation {
  point: GeoPoint;
  radius: number;
  consent: boolean;
  loading: boolean;
  requestConsent: () => Promise<boolean>;
  saveRadius: (meters: number) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Ubicación del usuario + preferencias de alerta.
 * El consentimiento y el radio viven en `private_profiles` (Ley 1581:
 * trazabilidad del permiso), con localStorage solo como caché del navegador.
 */
export function useUserLocation(): UseUserLocation {
  const [point, setPoint] = useState<GeoPoint>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_M);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const priv = await getPrivateProfile().catch(() => null);
      const granted = Boolean(priv?.geolocation_consent);
      setRadius(priv?.alert_radius_m ?? DEFAULT_RADIUS_M);
      setConsent(granted);
      if (granted) setGeoConsent(true);
      setPoint(await getUserPoint());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestConsent = useCallback(async () => {
    const granted = await requestGeoConsent();
    setConsent(granted);
    try {
      await updateSettings({ geolocationConsent: granted });
    } catch {
      /* el permiso del navegador ya quedó; persistir es best-effort */
    }
    if (granted) {
      const next = await getUserPoint();
      setPoint(next);
      try {
        await setMyLocation(next, radius);
      } catch {
        /* opcional */
      }
    }
    return granted;
  }, [radius]);

  const saveRadius = useCallback(
    async (meters: number) => {
      setRadius(meters);
      await updateSettings({ alertRadiusM: meters });
      if (consent) {
        try {
          await setMyLocation(point, meters);
        } catch {
          /* opcional */
        }
      }
    },
    [consent, point]
  );

  return { point, radius, consent, loading, requestConsent, saveRadius, reload: load };
}
