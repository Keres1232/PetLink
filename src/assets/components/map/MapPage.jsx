import { useEffect, useMemo, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import MapFilterTabs from "./MapFilterTabs.jsx";
import MapView from "./MapView.jsx";
import VetCard from "../pets/VetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import { placesNear, reportsNear } from "../../../lib/api";
import { getUserPoint } from "../../../lib/geo";
import { DEFAULT_CENTER } from "../../../lib/types";
import { dayLabel, distanceLabel } from "../../../lib/format";
import "./MapPage.css";

const RADIUS_M = 5000;

function MapPage({ onBack, onNotifications, onCall }) {
  const [point, setPoint] = useState(DEFAULT_CENTER);
  const [filter, setFilter] = useState("Todo");
  const [places, setPlaces] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getUserPoint();
        if (!alive) return;
        setPoint(p);
        const [pl, rp] = await Promise.all([placesNear(p, RADIUS_M), reportsNear(p, RADIUS_M, 30)]);
        if (!alive) return;
        setPlaces(pl);
        setReports(rp);
      } catch (e) {
        if (alive) setError("No se pudieron cargar los datos del mapa.");
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, []);

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
        {error && <p className="auth-error">{error}</p>}

        <div className="map-page__list">
          {shown.reports.map((r) => (
            <VetCard
              key={`r-${r.id}`}
              name={`${r.pet_name ?? (r.type === "lost" ? "Mascota perdida" : "Mascota encontrada")}`}
              info={distanceLabel(r.distance_m)}
              badge={dayLabel(r.created_at)}
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