import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { getLastPoint, setGeoConsent } from "../../../lib/geo";
import "leaflet/dist/leaflet.css";
import "./LocationPicker.css";

// Toca el mapa para marcar el punto
function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// Centra el mapa cuando el punto cambia desde fuera (buscar dirección / usar mi ubicación)
function FollowPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lon], Math.max(map.getZoom(), 16));
  }, [map, point]);
  return null;
}

// Mira (mismo ícono que el botón de centrar del Mapa)
const LocateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" fill="#7519FF" />
    <circle cx="12" cy="12" r="7.5" stroke="#7519FF" strokeWidth="2" />
    <path d="M12 1.5V4.5M12 19.5V22.5M1.5 12H4.5M19.5 12H22.5" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Mini mapa para marcar un lugar (reportes, adopción, sedes). Tocar el mapa llama `onPick`.
 * El botón redondo centra el mapa en donde está el usuario (punto azul) sin cambiar el punto
 * marcado. Sin `onPick` el mapa solo muestra el punto (p. ej. "Ubicación guardada").
 */
function LocationPicker({ center, point, onPick, showLocate = true }) {
  const start = point ?? center;
  const [map, setMap] = useState(null);
  const [me, setMe] = useState(null); // dónde está el usuario (punto azul)
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!map) return;
    const go = (p) => {
      setMe(p);
      map.setView([p.lat, p.lon], Math.max(map.getZoom(), 16));
    };
    if (!("geolocation" in navigator)) {
      const last = getLastPoint();
      if (last) go(last);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setGeoConsent(true);
        go({ lat: coords.latitude, lon: coords.longitude });
      },
      () => {
        setLocating(false);
        const last = getLastPoint(); // sin GPS: la última ubicación conocida
        if (last) go(last);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div className="location-picker">
      <MapContainer
        ref={setMap}
        center={[start.lat, start.lon]}
        zoom={15}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && <ClickToPick onPick={onPick} />}
        <FollowPoint point={point} />
        {me && (
          <CircleMarker
            center={[me.lat, me.lon]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2f80ed", fillOpacity: 1 }}
          />
        )}
        {point && (
          <CircleMarker
            center={[point.lat, point.lon]}
            radius={10}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#7519ff", fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      {/* Fuera del MapContainer: así tocarlo no marca un punto en el mapa */}
      {showLocate && (
        <button
          type="button"
          className={`location-picker__locate ${locating ? "is-locating" : ""}`}
          onClick={locate}
          aria-label="Centrar el mapa en mi ubicación"
        >
          <LocateIcon />
        </button>
      )}
    </div>
  );
}

export default LocationPicker;
