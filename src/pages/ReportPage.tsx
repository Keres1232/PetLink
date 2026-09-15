import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { LoadingState } from "../components/ui/States";
import { createAlert, myPets } from "../lib/api";
import { getUserPoint } from "../lib/geo";
import type { GeoPoint, Pet } from "../lib/types";
import "../styles/pages.css";

function PointPicker({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

export default function ReportPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<"lost" | "found">("lost");
  const [petId, setPetId] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [description, setDescription] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void getUserPoint().then(setPoint);
    void myPets().then(setPets).catch(() => setPets([]));
  }, []);

  const submit = useCallback(async () => {
    if (!point) {
      setError("Marca en el mapa el lugar del avistamiento.");
      return;
    }
    if (description.trim().length < 5) {
      setError("Cuéntanos un poco más (mínimo 5 caracteres).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAlert({
        petId: petId || null,
        type,
        description: description.trim(),
        point,
      });
      setSuccess(true);
      setTimeout(() => navigate("/mapa"), 900);
    } catch {
      setError("No pudimos crear la alerta. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [point, description, petId, type, navigate]);

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Reportar</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <div className="pc-toggle-row" role="group" aria-label="Tipo de reporte">
          <button
            type="button"
            className={`pc-toggle ${type === "lost" ? "active" : ""}`}
            onClick={() => setType("lost")}
          >
            Mascota perdida
          </button>
          <button
            type="button"
            className={`pc-toggle ${type === "found" ? "active" : ""}`}
            onClick={() => setType("found")}
          >
            Mascota encontrada
          </button>
        </div>

        {pets.length > 0 && (
          <div className="pc-field">
            <label className="pc-field-label" htmlFor="report-pet">
              ¿Es una de tus mascotas? (opcional)
            </label>
            <select
              id="report-pet"
              className="pc-select"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
            >
              <option value="">Ninguna / no lo sé</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="report-desc">
            Descripción y lugar
          </label>
          <textarea
            id="report-desc"
            className="pc-textarea"
            placeholder="Ej: Parque de Usaquén, perrito café con collar rojo…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Ubicación del avistamiento</span>
          <div className="map-canvas" style={{ height: 220 }}>
            {point && (
              <MapContainer center={[point.lat, point.lon]} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PointPicker onPick={setPoint} />
                <CircleMarker
                  center={[point.lat, point.lon]}
                  radius={9}
                  pathOptions={{ color: "#7519ff", fillColor: "#ae77ff", fillOpacity: 0.9 }}
                />
              </MapContainer>
            )}
          </div>
          <button
            type="button"
            className="pc-pill-btn"
            style={{ marginTop: 10 }}
            onClick={() => void getUserPoint().then(setPoint)}
          >
            <Crosshair size={15} /> Usar mi ubicación
          </button>
        </div>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}
        {success && <p className="pc-muted">¡Alerta creada! Redirigiendo al mapa…</p>}

        <div className="pc-form-actions">
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Enviando…" : "Publicar alerta"}
          </PrimaryButton>
        </div>
      </div>

      {!point && <LoadingState label="Obteniendo tu ubicación…" />}
    </div>
  );
}
