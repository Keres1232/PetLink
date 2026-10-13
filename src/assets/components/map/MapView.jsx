import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { dayLabel, distanceLabel } from "../../../lib/format";
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

// Contenido del globo de un marcador (foto, nombre, distancia · día, etiqueta y acción)
function PopupCard({ photo, title, meta, badge, badgeClass, action, onAction }) {
  return (
    <div className="map-popup__card">
      {photo && <img className="map-popup__photo" src={photo} alt="" />}
      <div className="map-popup__info">
        <strong className="map-popup__title">{title}</strong>
        {meta && <span className="map-popup__meta">{meta}</span>}
        {action && (
          <button type="button" className="map-popup__action" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      <span className={`map-popup__badge ${badgeClass}`}>{badge}</span>
    </div>
  );
}

function MapView({ center, places = [], reports = [], onSelect, onLocate, fitTo = [], focus = null }) {
  const markers = useRef({});
  const mapRef = useRef(null);
  return (
    <div className="map-view">
      <div className="map-view__canvas">
        <MapContainer
          ref={mapRef}
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

          {/* Tú: halo azul + punto */}
          <CircleMarker
            center={[center.lat, center.lon]}
            radius={16}
            pathOptions={{ stroke: false, fillColor: "#2f6bff", fillOpacity: 0.18 }}
          />
          <CircleMarker
            center={[center.lat, center.lon]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f6bff", fillOpacity: 1 }}
          />

          {places.map((p) => (
            <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={ICONS[p.kind] ?? ICONS.clinic}
              ref={(m) => { markers.current[`p-${p.id}`] = m; }}>
              <Popup className="map-popup" closeButton>
                <PopupCard
                  photo={null}
                  title={p.name}
                  meta={[distanceLabel(p.distance_m), p.address].filter(Boolean).join(" · ")}
                  badge={p.kind === "shelter" ? "Refugio" : "Veterinaria"}
                  badgeClass={p.kind === "shelter" ? "is-shelter" : "is-clinic"}
                  action={p.phone ? "Llamar ›" : null}
                  onAction={() => onSelect?.({ type: "place", data: p })}
                />
              </Popup>
            </Marker>
          ))}

          {reports.map((r) => (
            <Marker key={`r-${r.id}`} position={[r.latitude, r.longitude]} icon={ICONS[r.type]}
              ref={(m) => { markers.current[`r-${r.id}`] = m; }}>
              <Popup className="map-popup" closeButton>
                <PopupCard
                  photo={r.photos?.[0] ?? r.pet_photo_url}
                  title={r.pet_name ?? (r.type === "lost" ? "Mascota perdida" : "Mascota encontrada")}
                  meta={`${distanceLabel(r.distance_m)} · ${dayLabel(r.created_at).toLowerCase()}`}
                  badge={r.type === "lost" ? "Perdido" : "Encontrado"}
                  badgeClass={r.type === "lost" ? "is-lost" : "is-found"}
                  action="Ver detalles ›"
                  onAction={() => onSelect?.({ type: "report", data: r })}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Centrar en mi ubicación */}
        <button
          type="button"
          className="map-view__locate"
          aria-label="Centrar en mi ubicación"
          onClick={() => {
            mapRef.current?.setView([center.lat, center.lon], 15);
            onLocate?.();
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="#ae77ff" />
            <circle cx="12" cy="12" r="8" stroke="#ae77ff" strokeWidth="2" fill="none" />
            <path d="M12 1V4M12 20V23M1 12H4M20 12H23" stroke="#ae77ff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MapView;