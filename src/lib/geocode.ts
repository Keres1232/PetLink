import type { GeoPoint } from "./types";

const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

// Nominatim permite 1 req/s: espaciamos las llamadas para cumplir su política.
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;

interface NominatimResponse {
  name?: string;
  display_name?: string;
}

/**
 * Convierte coordenadas en un nombre de lugar legible (OSM/Nominatim).
 * Devuelve null si no hay red o la respuesta no sirve; nunca lanza.
 */
export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(point.lat),
    lon: String(point.lon),
    zoom: "18",
    "accept-language": "es",
  });

  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    if (data.name && data.name.trim()) return data.name.trim();
    if (data.display_name) {
      return data.display_name.split(",").slice(0, 2).join(",").trim();
    }
    return null;
  } catch {
    return null;
  }
}
