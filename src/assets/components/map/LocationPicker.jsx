import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
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

/** Mini mapa para marcar dónde está la veterinaria o el refugio (igual idea que LocationField de web-development). */
function LocationPicker({ center, point, onPick }) {
  const start = point ?? center;
  return (
    <div className="location-picker">
      <MapContainer center={[start.lat, start.lon]} zoom={15} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPick onPick={onPick} />
        <FollowPoint point={point} />
        {point && (
          <CircleMarker
            center={[point.lat, point.lon]}
            radius={10}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#7519ff", fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default LocationPicker;
