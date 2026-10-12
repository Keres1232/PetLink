import { useEffect, useMemo, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import MapFilterTabs from "./MapFilterTabs.jsx";
import MapView from "./MapView.jsx";
import VetCard from "../pets/VetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import { placesNear, reportsNear } from "../../../lib/api";
import { useUserLocation } from "../../../hooks/useUserLocation";
import { dayLabel, distanceLabel } from "../../../lib/format";
import { reportToPet } from "../../../lib/reportPet";
import { DEFAULT_CENTER } from "../../../lib/types";
import "./MapPage.css";

const PLACES_MIN_RADIUS_M = 20000;

function MapPage({ onBack, onNotifications, onCall, onReportClick }) {
  // Punto: GPS del dispositivo si dio permiso (si no, centro de Bogotá). Radio: el guardado en private_profiles
  const { point, radius, loading, enableDeviceLocation } = useUserLocation();
  const [filter, setFilter] = useState("Todo");
  const [places, setPlaces] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    let alive = true;
    (async () => {
      try {
        setError("");
        // Veterinarias y refugios sirven para toda la ciudad: se buscan al menos a 20 km aunque el radio de alertas sea menor
        const [pl, rp] = await Promise.all([
          placesNear(point, Math.max(radius, PLACES_MIN_RADIUS_M)),
          reportsNear(point, radius, 30),
        ]);
        if (!alive) return;
        setPlaces(pl);
        setReports(rp);
      } catch (e) {
        if (alive) setError("No se pudieron cargar los datos del mapa.");
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [loading, point, radius]);

  const shown = useMemo(() => {
    const showReports = (t) => reports.filter((r) => r.type === t);
    switch (filter) {
      case "Perdidas": return { places: [], reports: showReports("lost") };
      case "Encontradas": return { places: [], reports: showReports("found") };
      case "Veterinarias": return { places: places.filter((p) => p.kind === "clinic"), reports: [] };
      case "Refugios": return { places: places.filter((p) => p.kind === "shelter"), reports: [] };
      default: return { places, reports };
    }
  }, [filter, places, reports]);

  return (
    <>
      <AppHeader title="Mapa" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="map-page__filters">
        <MapFilterTabs onChange={setFilter} />
      </div>

      <MapView center={point} places={shown.places} reports={shown.reports} />

      <section className="map-page__nearby">
        <h2 className="map-page__title">Cerca de ti</h2>
        {!loading && point === DEFAULT_CENTER && (
          <button type="button" className="map-page__consent" onClick={() => void enableDeviceLocation()}>
            Activa tu ubicación para ver los reportes cerca de ti
          </button>
        )}
        {error && <p className="auth-error">{error}</p>}

        <div className="map-page__list">
          {shown.reports.map((r) => (
            <VetCard
              key={`r-${r.id}`}
              name={`${r.pet_name ?? (r.type === "lost" ? "Mascota perdida" : "Mascota encontrada")}`}
              info={distanceLabel(r.distance_m)}
              badge={dayLabel(r.created_at)}
              photoUrl={r.photos?.[0] ?? r.pet_photo_url ?? undefined}
              onClick={() => onReportClick?.(reportToPet(r))}
            />
          ))}
          {shown.places.map((p) => (
            <VetCard
              key={`p-${p.id}`}
              name={p.name}
              info={`${p.address ?? ""} · ${distanceLabel(p.distance_m)}`}
              onCall={p.phone ? () => onCall?.(p.phone) : undefined}
            />
          ))}
          {!error && shown.reports.length + shown.places.length === 0 && (
            <p className="map-page__empty">No hay resultados cerca de ti.</p>
          )}
        </div>
      </section>
    </>
  );
}

export default MapPage;