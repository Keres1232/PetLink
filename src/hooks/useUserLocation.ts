import { useCallback, useEffect, useState } from "react";
import { getPrivateProfile, setMyLocation, updateSettings } from "../lib/api";
import { setGeoConsent, getUserPoint, hasGeoDecision, requestGeoConsent } from "../lib/geo";
import { DEFAULT_CENTER, type GeoPoint } from "../lib/types";
import { supabase } from "../lib/supabase";

const DEFAULT_RADIUS_M = 5000;

// Última vez que se guardó la ubicación en Supabase (compartido por todas las pantallas)
let lastLocationSync = 0;
// Una sola petición de permiso aunque varias pantallas usen el hook a la vez
let devicePermission: Promise<boolean> | null = null;

interface UseUserLocation {
  point: GeoPoint;
  radius: number;
  consent: boolean;
  loading: boolean;
  requestConsent: () => Promise<boolean>;
  enableDeviceLocation: () => Promise<boolean>;
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
      const r = priv?.alert_radius_m ?? DEFAULT_RADIUS_M;
      setRadius(r);
      setConsent(granted);
      if (granted) setGeoConsent(true);
      // Ver lo que hay cerca NO depende de las alertas: con sesión iniciada se pide el permiso
      // de ubicación del dispositivo una sola vez (queda solo en este dispositivo, no en Supabase).
      if (!granted && !hasGeoDecision() && (await supabase.auth.getSession()).data.session) {
        devicePermission ??= requestGeoConsent();
        await devicePermission;
      }
      const p = await getUserPoint();
      setPoint(p);
      // Las alertas cercanas (trigger notify_on_report) usan la ubicación GUARDADA en Supabase:
      // se actualiza al abrir la app (máximo cada 10 min) para que siga siendo la real.
      if (granted && p !== DEFAULT_CENTER && Date.now() - lastLocationSync > 10 * 60 * 1000) {
        lastLocationSync = Date.now();
        setMyLocation(p, r).catch(() => {
          lastLocationSync = 0;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Al iniciar o cerrar sesión cambian el consentimiento y el radio guardados: volver a leerlos
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load();
    });
    return () => sub.subscription.unsubscribe();
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

  /** Solo para ver lo cercano: usa el GPS del dispositivo sin activar alertas ni guardar nada en Supabase. */
  const enableDeviceLocation = useCallback(async () => {
    const granted = await requestGeoConsent();
    if (granted) setPoint(await getUserPoint());
    return granted;
  }, []);

  return { point, radius, consent, loading, requestConsent, enableDeviceLocation, saveRadius, reload: load };
}
