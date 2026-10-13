import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import MapFilterTabs from "./MapFilterTabs.jsx";
import MapView from "./MapView.jsx";
import VetCard from "../pets/VetCard.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import { getReportById, placesNear, reportsNear } from "../../../lib/api";
import { useUserLocation } from "../../../hooks/useUserLocation";
import { dayLabel, distanceLabel } from "../../../lib/format";
import { reportToPet } from "../../../lib/reportPet";
import { DEFAULT_CENTER } from "../../../lib/types";
import "./MapPage.css";

const MAP_MIN_RADIUS_M = 20000;

function MapPage({ onBack, onNotifications, onCall, onReportClick, focusReportId, onFocusDone }) {
  // Punto: GPS del dispositivo si dio permiso (si no, centro de Bogotá). Radio: el guardado en private_profiles
  const { point, radius, loading, enableDeviceLocation } = useUserLocation();
  const [filter, setFilter] = useState("Todo");
  const [places, setPlaces] = useState([]);
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false); // ya terminó la primera carga de reportes y lugares
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    let alive = true;
    (async () => {
      try {
        setError("");
        // El radio de alertas decide de qué se le AVISA al usuario, no lo que puede VER en el mapa:
        // reportes, veterinarias y refugios se buscan al menos a 20 km (antes los reportes usaban
        // el radio de alertas y uno a 8 km no aparecía aunque en la web sí)
        const mapRadius = Math.max(radius, MAP_MIN_RADIUS_M);
        const [pl, rp] = await Promise.all([placesNear(point, mapRadius), reportsNear(point, mapRadius, 60)]);
        if (!alive) return;
        setPlaces(pl);
        setReports(rp);
        setLoaded(true);
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

  // Lugar tocado en la lista (el mapa va hasta él)
  const [focus, setFocus] = useState(null);

  // "Ver en el mapa" desde una alerta de Comunidad: centrar en ese reporte y abrir su globo.
  // Si está fuera del área cargada, se trae aparte con report_by_id.
  const focusDone = useRef(null);
  useEffect(() => {
    if (!focusReportId || !loaded || focusDone.current === focusReportId) return;
    focusDone.current = focusReportId;
    (async () => {
      let r = reports.find((x) => x.id === focusReportId);
      if (!r) {
        r = await getReportById(focusReportId).catch(() => null);
        if (r) setReports((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
      }
      if (r) setFocus({ id: `r-${r.id}`, lat: r.latitude, lon: r.longitude, at: Date.now() });
      else setError("Esa alerta ya no está activa en el mapa.");
      onFocusDone?.();
    })();
  }, [focusReportId, loaded, reports, onFocusDone]);

  // Con Veterinarias o Refugios, el mapa se aleja lo necesario para mostrar todos los lugares y al usuario
  const fitTo = useMemo(
    () =>
      filter === "Veterinarias" || filter === "Refugios"
        ? [point, ...shown.places.map((p) => ({ lat: p.latitude, lon: p.longitude }))]
        : [],
    [filter, point, shown.places]
  );

  return (
    <>
      <AppHeader compact title="Mapa" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="map-page__filters">
        <MapFilterTabs onChange={setFilter} />
      </div>

      <MapView
        center={point}
        places={shown.places}
        reports={shown.reports}
        fitTo={fitTo}
        focus={focus}
        onLocate={() => point === DEFAULT_CENTER && void enableDeviceLocation()}
        onSelect={({ type, data }) => {
          if (type === "report") onReportClick?.(reportToPet(data));
          else if (data.phone) onCall?.(data.phone);
        }}
      />

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
              onClick={() => {
                // Llevar el mapa hasta este lugar (y subir a verlo)
                setFocus({ id: `p-${p.id}`, lat: p.latitude, lon: p.longitude, at: Date.now() });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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