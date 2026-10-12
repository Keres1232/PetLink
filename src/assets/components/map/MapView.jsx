import { useEffect, useRef } from "react";
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

// Centra en el usuario solo cuando cambia su ubicación (antes lo hacía en cada render y
// devolvía el mapa a su punto aunque el usuario lo moviera)
function Recenter({ point }) {
  const map = useMap();
  useEffect(() => {
    map.setView([point.lat, point.lon]);
  }, [map, point.lat, point.lon]);
  return null;
}

// Ajusta el zoom para que se vean todos los puntos (p. ej. al filtrar Veterinarias o Refugios)
function FitPoints({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lon}`).join("|");
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), { padding: [30, 30], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume `points`
  }, [map, key]);
  return null;
}

// Lleva el mapa a un lugar tocado en la lista y abre su globo
function FocusPlace({ focus, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.setView([focus.lat, focus.lon], 16);
    markers.current[focus.id]?.openPopup();
  }, [map, focus, markers]);
  return null;
}

function MapView({ center, places = [], reports = [], onSelect, fitTo = [], focus = null }) {
  const markers = useRef({});
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
          <FitPoints points={fitTo} />
          <FocusPlace focus={focus} markers={markers} />

          <CircleMarker
            center={[center.lat, center.lon]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f6bff", fillOpacity: 1 }}
          />

          {places.map((p) => (
            <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={ICONS[p.kind] ?? ICONS.clinic}
              ref={(m) => { markers.current[p.id] = m; }}
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