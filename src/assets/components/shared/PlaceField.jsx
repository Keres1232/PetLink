import { useEffect, useRef, useState } from "react";
import IconInputField from "./IconInputField.jsx";
import LocationPicker from "../map/LocationPicker.jsx";
import { getLastPoint, setGeoConsent } from "../../../lib/geo";
import { reverseGeocode, searchPlace } from "../../../lib/geocode";
import { DEFAULT_CENTER } from "../../../lib/types";
import "../reports/ReportLostPage.css";
import "./PlaceField.css";

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21C12 21 19 14.5 19 8.5C19 4.91 15.87 2 12 2C8.13 2 5 4.91 5 8.5C5 14.5 12 21 12 21Z" {...stroke} />
    <circle cx="12" cy="8.5" r="2.5" {...stroke} />
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" fill="#7519FF" />
    <circle cx="12" cy="12" r="8" stroke="#7519FF" strokeWidth="2" fill="none" />
    <path d="M12 1V4M12 20V23M1 12H4M20 12H23" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Ubicación de un reporte (perdida, encontrada, adopción): dirección + "Usar mi ubicación actual"
 * + mini mapa, y uno completa al otro:
 * - escribir la dirección → al dejar de escribir se ubica sola en el mapa (en la ciudad del usuario);
 * - tocar el mapa o usar el GPS → se marca el punto y se escribe su dirección.
 * El mapa tiene un botón para centrarlo en donde está el usuario.
 *
 * `value` / `onChange(texto)`: la dirección. `point` / `onPointChange(punto | null)`: el punto.
 */
function PlaceField({ label, placeholder, value, onChange, point, onPointChange, city = "Bogotá", center }) {
  const [syncing, setSyncing] = useState(""); // "map" | "address" | ""
  const [note, setNote] = useState("");
  const fromMap = useRef(null); // texto que puso el mapa: no se vuelve a buscar
  const typed = useRef(false); // el usuario escribió (no viene del mapa)

  // Escribir la dirección: el punto anterior deja de valer hasta ubicar la nueva
  const changeText = (text) => {
    typed.current = true;
    onChange?.(text);
    onPointChange?.(null);
  };

  useEffect(() => {
    const text = (value ?? "").trim();
    if (!typed.current || text.length < 6 || text === fromMap.current) return undefined;
    let alive = true;
    const timer = setTimeout(async () => {
      setSyncing("map");
      const p = await searchPlace(text, city).catch(() => null);
      if (!alive) return;
      setSyncing("");
      if (p) {
        onPointChange?.(p);
        setNote("Ubicamos la dirección en el mapa. Si no es exacto, toca el punto correcto.");
      } else {
        setNote("No encontramos esa dirección en el mapa: escríbela más completa o toca el mapa.");
      }
    }, 900);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // onPointChange cambia en cada render del padre: solo importa el texto y la ciudad
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, city]);

  // Tocar el mapa o usar el GPS: se marca el punto y se escribe su dirección
  const pick = async (p) => {
    onPointChange?.(p);
    setSyncing("address");
    setNote("");
    const text = await reverseGeocode(p).catch(() => null);
    setSyncing("");
    const finalText = text ?? "Punto marcado en el mapa (" + p.lat.toFixed(4) + ", " + p.lon.toFixed(4) + ")";
    fromMap.current = finalText;
    typed.current = false;
    onChange?.(finalText);
    setNote(text ? "Escribimos la dirección del punto que marcaste. Puedes corregirla." : "Marcamos el punto en el mapa.");
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return setNote("Tu dispositivo no tiene GPS: toca el lugar en el mapa.");
    setSyncing("address");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoConsent(true); // para que el mapa se centre en tu ubicación real
        void pick({ lat: coords.latitude, lon: coords.longitude });
      },
      () => {
        setSyncing("");
        setNote("No se pudo obtener tu ubicación. Escribe el lugar o tócalo en el mapa.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div className="report-lost__place place-field">
      <IconInputField label={label} icon={<PinIcon />} placeholder={placeholder} value={value} onChange={changeText} />
      <button type="button" className="report-lost__locate" onClick={useMyLocation}>
        <TargetIcon />
        Usar mi ubicación actual
      </button>

      <span className="place-field__hint">Escribe la dirección o toca el mapa: uno completa al otro</span>
      <LocationPicker center={point ?? center ?? getLastPoint() ?? DEFAULT_CENTER} point={point} onPick={(p) => void pick(p)} />

      {(syncing || note) && (
        <p className="place-field__note" role="status">
          {syncing === "map"
            ? "Buscando la dirección en el mapa…"
            : syncing === "address"
              ? "Buscando la dirección de ese punto…"
              : note}
        </p>
      )}
    </div>
  );
}

export default PlaceField;
