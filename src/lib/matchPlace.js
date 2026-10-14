// Lugar dentro del mensaje de un aviso privado (report_matches no tiene columna de ubicación).
// Formato de la última línea: "📍 <dirección> [lat, lon]".
const PLACE_LINE = /^📍\s*(.*?)\s*(?:\[(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\])?\s*$/;

/** Arma el mensaje con el lugar donde la vio (opcional). */
export function messageWithPlace(message, place, point) {
  const text = (message ?? "").trim();
  const where = (place ?? "").trim();
  if (!where && !point) return text;
  const coords = point ? ` [${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}]` : "";
  return [text, `📍 ${where || "Punto marcado en el mapa"}${coords}`].filter(Boolean).join("\n");
}

/** Separa el mensaje y el lugar: { text, place: { label, point } | null }. */
export function splitMessagePlace(message) {
  const lines = (message ?? "").split("\n");
  const last = lines[lines.length - 1] ?? "";
  const m = last.match(PLACE_LINE);
  if (!m) return { text: message ?? "", place: null };
  const point = m[2] && m[3] ? { lat: Number(m[2]), lon: Number(m[3]) } : null;
  return { text: lines.slice(0, -1).join("\n"), place: { label: m[1], point } };
}

/** Enlace para abrir el punto en el mapa del celular (Google Maps o el navegador). */
export const mapsUrl = (point) => `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lon}`;
