import { useCallback, useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { MapPin, Phone } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useUserLocation } from "../hooks/useUserLocation";
import { placesNear, reportsNear } from "../lib/api";
import { distanceLabel, dayLabel } from "../lib/format";
import { DEFAULT_CENTER, type GeoPoint, type PlaceNear, type ReportNear } from "../lib/types";
import "../styles/pages.css";

type Filter = "todo" | "lost" | "found" | "clinic" | "shelter";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "lost", label: "Perdidas" },
  { id: "found", label: "Encontradas" },
  { id: "clinic", label: "Veterinarias" },
  { id: "shelter", label: "Refugios" },
];

const REPORT_COLORS: Record<string, string> = { lost: "#e05252", found: "#4a7dd6" };
const PLACE_COLORS: Record<string, string> = { clinic: "#e0a52e", shelter: "#2e9e63" };

function FlyTo({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lon], 15, { duration: 0.6 });
  }, [point, map]);
  return null;
}

export default function MapPage() {
  const [filter, setFilter] = useState<Filter>("todo");
  const [center, setCenter] = useState<GeoPoint>(DEFAULT_CENTER);
  const [reports, setReports] = useState<ReportNear[]>([]);
  const [places, setPlaces] = useState<PlaceNear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<GeoPoint | null>(null);
  const { point, radius, loading: locLoading } = useUserLocation();

  const load = useCallback(
    async (origin: GeoPoint, radiusM: number) => {
      setLoading(true);
      setError(null);
      try {
        setCenter(origin);
        const [r, p] = await Promise.all([
          reportsNear(origin, radiusM, 30),
          placesNear(origin, radiusM),
        ]);
        setReports(r);
        setPlaces(p);
      } catch {
        setError("No pudimos cargar el mapa.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!locLoading) void load(point, radius);
  }, [locLoading, point, radius, load]);

  const visibleReports = reports.filter((r) =>
    filter === "todo" ? true : filter === "lost" ? r.type === "lost" : filter === "found" ? r.type === "found" : false
  );
  const visiblePlaces = places.filter((p) =>
    filter === "todo" ? true : filter === "clinic" ? p.kind === "clinic" : filter === "shelter" ? p.kind === "shelter" : false
  );
  const showReports = filter === "todo" || filter === "lost" || filter === "found";
  const showPlaces = filter === "todo" || filter === "clinic" || filter === "shelter";

  return (
    <div>
      <div className="pc-page-header">
        <h1 className="pc-title">Mapa</h1>
      </div>

      <div className="map-filters" role="tablist" aria-label="Filtros del mapa">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`map-filter-chip ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Buscando cerca de ti…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load(point, radius)} />}

      {!loading && !error && (
        <div className="map-layout">
          <div className="map-canvas">
            <MapContainer
              center={[center.lat, center.lon]}
              zoom={13}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo point={focus} />
              {showReports &&
                visibleReports.map((r) => (
                  <CircleMarker
                    key={r.id}
                    center={[r.latitude, r.longitude]}
                    radius={9}
                    pathOptions={{ color: REPORT_COLORS[r.type], fillColor: REPORT_COLORS[r.type], fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <strong>{r.pet_name ?? "Mascota"}</strong>
                      <br />
                      {r.type === "lost" ? "Perdido" : "Encontrado"} · {distanceLabel(r.distance_m)}
                    </Popup>
                  </CircleMarker>
                ))}
              {showPlaces &&
                visiblePlaces.map((p) => (
                  <CircleMarker
                    key={p.id}
                    center={[p.latitude, p.longitude]}
                    radius={9}
                    pathOptions={{ color: PLACE_COLORS[p.kind], fillColor: PLACE_COLORS[p.kind], fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <strong>{p.name}</strong>
                      <br />
                      {p.kind === "clinic" ? "Veterinaria" : "Refugio"} · {distanceLabel(p.distance_m)}
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>
          </div>

          <div>
            <h2 className="pc-section-title" style={{ marginBottom: 12 }}>Cerca de ti</h2>
            {visibleReports.length === 0 && visiblePlaces.length === 0 ? (
              <EmptyState
                title="Nada cerca por ahora"
                body="Amplía el radio de búsqueda en tu perfil o vuelve más tarde."
              />
            ) : (
              <div className="map-list">
                {showReports &&
                  visibleReports.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="map-row"
                      onClick={() => setFocus({ lat: r.latitude, lon: r.longitude })}
                    >
                      {r.pet_photo_url ? (
                        <img className="map-row__thumb" src={r.pet_photo_url} alt="" />
                      ) : (
                        <span className="map-row__thumb" aria-hidden="true" />
                      )}
                      <span className="map-row__info">
                        <span className="map-row__title">
                          {r.pet_name ?? "Mascota"} · {r.type === "lost" ? "Perdido" : "Encontrado"}
                        </span>
                        <span className="map-row__meta">
                          <MapPin size={13} /> {r.description || "Cerca de ti"} · {distanceLabel(r.distance_m)}
                        </span>
                      </span>
                      <span className="pc-badge pc-badge--lost">{dayLabel(r.created_at)}</span>
                    </button>
                  ))}
                {showPlaces &&
                  visiblePlaces.map((p) => (
                    <div key={p.id} className="map-row" style={{ cursor: "default" }}>
                      <span className="map-row__thumb" aria-hidden="true" />
                      <span className="map-row__info">
                        <span className="map-row__title">{p.name}</span>
                        <span className="map-row__meta">
                          {p.address ?? (p.kind === "clinic" ? "Veterinaria" : "Refugio")} · {distanceLabel(p.distance_m)}
                        </span>
                      </span>
                      {p.phone && (
                        <a
                          className="pc-pill-btn"
                          style={{ background: "var(--pc-primary)", color: "#fff" }}
                          href={`tel:${p.phone}`}
                          aria-label={`Llamar a ${p.name}`}
                        >
                          <Phone size={15} />
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
