import type { GeoPoint } from "./types";

const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Nominatim permite 1 req/s: espaciamos las llamadas para cumplir su política.
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;

interface NominatimResponse {
  name?: string;
  display_name?: string;
}

interface NominatimSearchItem {
  lat: string;
  lon: string;
}

async function throttle(): Promise<void> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Busca un lugar por texto (ej. "Parque de Usaquén") y devuelve su punto.
 *
 * `city`: ciudad del usuario (por defecto Bogotá). Una dirección sin ciudad es ambigua: "Avenida
 * Carrera 30 #19" caía en Soacha (Ciudad Verde) en vez de Bogotá. Si el texto no nombra la ciudad,
 * primero se busca "<texto>, <ciudad>"; si así no aparece, se busca el texto tal cual.
 */
export async function searchPlace(query: string, city: string | null = "Bogotá"): Promise<GeoPoint | null> {
  const text = query.trim();
  if (!text) return null;
  const place = city?.trim();
  if (place && !normalize(text).includes(normalize(place))) {
    const inCity = await searchOnce(`${text}, ${place}`);
    if (inCity) return inCity;
  }
  return searchOnce(text);
}

async function searchOnce(query: string): Promise<GeoPoint | null> {
  await throttle();
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "1",
    countrycodes: "co",
    "accept-language": "es",
  });
  try {
    const res = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimSearchItem[];
    const first = data[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
  } catch {
    return null;
  }
}

/**
 * Convierte coordenadas en un nombre de lugar legible (OSM/Nominatim).
 * Devuelve null si no hay red o la respuesta no sirve; nunca lanza.
 */
export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  await throttle();

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
