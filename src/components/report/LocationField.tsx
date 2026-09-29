import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { Crosshair, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "../../lib/geocode";
import { getUserPoint } from "../../lib/geo";
import { requestGeoConsent } from "../../lib/geo";
import { DEFAULT_CENTER, type GeoPoint } from "../../lib/types";

function PointPicker({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

interface Props {
  label: string;
  placeholder: string;
  text: string;
  onTextChange: (text: string) => void;
  point: GeoPoint | null;
  onPointChange: (point: GeoPoint) => void;
  help?: string;
}

export default function LocationField({
  label,
  placeholder,
  text,
  onTextChange,
  point,
  onPointChange,
  help,
}: Props) {
  const [place, setPlace] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!point) return;
    let active = true;
    setBusy(true);
    void reverseGeocode(point).then((name) => {
      if (!active) return;
      setPlace(name);
      setBusy(false);
      if (name && !text.trim()) onTextChange(name);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point]);

  async function useCurrentLocation() {
    const granted = await requestGeoConsent();
    if (granted) {
      onPointChange(await getUserPoint());
    }
  }

  return (
    <div className="pc-field">
      <label className="pc-field-label" htmlFor="location-text">
        {label}
      </label>
      <input
        id="location-text"
        className="pc-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />

      <div className="location-actions">
        <button type="button" className="pc-pill-btn" onClick={() => void useCurrentLocation()}>
          <Crosshair size={15} /> Usar mi ubicación actual
        </button>
        {point && (
          <span className="place-hint">
            <MapPin size={13} />
            {busy ? "Buscando el lugar…" : place ?? "Punto marcado en el mapa"}
          </span>
        )}
      </div>

      <div className="location-map">
        <MapContainer
          center={[point?.lat ?? DEFAULT_CENTER.lat, point?.lon ?? DEFAULT_CENTER.lon]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PointPicker onPick={onPointChange} />
          {point && (
            <CircleMarker
              center={[point.lat, point.lon]}
              radius={9}
              pathOptions={{ color: "#7519ff", fillColor: "#ae77ff", fillOpacity: 0.9 }}
            />
          )}
        </MapContainer>
      </div>

      {help && <p className="pc-muted location-help">{help}</p>}
    </div>
  );
}
