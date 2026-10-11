import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// Íconos de color (evita el problema de los íconos rotos de Leaflet con Vite)
const pin = (color) =>
  L.divIcon({
    className: "map-pin",
    html: `<span style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });

const ICONS = {
  lost: pin("#e0554f"),
  found: pin("#2e9e6b"),
  clinic: pin("#7519ff"),
  shelter: pin("#e08a2f"),
};

function Recenter({ point }) {
  const map = useMap();
  map.setView([point.lat, point.lon]);
  return null;
}

function MapView({ center, places = [], reports = [], onSelect }) {
  return (
    <div className="map-view">
      <div className="map-view__canvas">
        <MapContainer
          center={[center.lat, center.lon]}
          zoom={14}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter point={center} />

          <CircleMarker
            center={[center.lat, center.lon]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f6bff", fillOpacity: 1 }}
          />

          {places.map((p) => (
            <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={ICONS[p.kind] ?? ICONS.clinic}
              eventHandlers={{ click: () => onSelect?.({ type: "place", data: p }) }}>
              <Popup><b>{p.name}</b><br />{p.address}</Popup>
            </Marker>
          ))}

          {reports.map((r) => (
            <Marker key={`r-${r.id}`} position={[r.latitude, r.longitude]} icon={ICONS[r.type]}
              eventHandlers={{ click: () => onSelect?.({ type: "report", data: r }) }}>
              <Popup><b>{r.pet_name ?? (r.type === "lost" ? "Mascota perdida" : "Mascota encontrada")}</b><br />{r.description}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;