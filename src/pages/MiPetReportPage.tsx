import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import PetSelectCard from "../components/PetSelectCard";
import LocationField from "../components/report/LocationField";
import PhotoGridField from "../components/report/PhotoGridField";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { LoadingState } from "../components/ui/States";
import { useUserLocation } from "../hooks/useUserLocation";
import { createAlert, myPets, uploadPhotos } from "../lib/api";
import { searchPlace } from "../lib/geocode";
import type { GeoPoint, Pet } from "../lib/types";
import "../components/report/report.css";

const MAX_EXTRA_PHOTOS = 3;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function MiPetReportPage() {
  const navigate = useNavigate();
  const { point: userPoint, loading: locLoading } = useUserLocation();

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petId, setPetId] = useState<string | null>(null);
  const [notListed, setNotListed] = useState(false);

  const [placeText, setPlaceText] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [characteristics, setCharacteristics] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void myPets()
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setPetsLoading(false));
  }, []);

  useEffect(() => {
    if (!locLoading && !point && userPoint) setPoint(userPoint);
  }, [locLoading, point, userPoint]);

  const selectedPet = pets.find((p) => p.id === petId) ?? null;

  async function submit() {
    setError(null);
    let finalPoint = point;
    if (!finalPoint && placeText.trim()) {
      finalPoint = await searchPlace(placeText);
    }
    if (!finalPoint) {
      setError("Indica el lugar dónde se perdió (o usa tu ubicación actual).");
      return;
    }
    if (characteristics.trim().length < 5 && !placeText.trim()) {
      setError("Cuéntanos cómo iba tu mascota al momento de perderse.");
      return;
    }

    setBusy(true);
    try {
      const photoUrls = photos.length ? await uploadPhotos(photos, "pet-photos") : [];
      const description = [placeText.trim(), characteristics.trim()]
        .filter(Boolean)
        .join(" · ");
      const lostAt = new Date(`${date}T${time}:00`).toISOString();

      await createAlert({
        petId: petId || null,
        type: "lost",
        description: description || "Mascota perdida",
        point: finalPoint,
        photos: photoUrls,
        lostAt,
      });
      navigate("/mapa");
    } catch (err) {
      console.error("createAlert (lost) falló:", err);
      setError("No pudimos publicar la alerta. Intenta de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Reportar mascota</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <div className="pc-field">
          <span className="pc-field-label">¿Cuál de tus mascotas se perdió?</span>
          {petsLoading && <LoadingState label="Cargando tus mascotas…" />}
          <div className="report-options">
            {pets.map((pet) => (
              <PetSelectCard
                key={pet.id}
                pet={pet}
                selected={petId === pet.id}
                onSelect={() => {
                  setPetId(pet.id);
                  setNotListed(false);
                }}
              />
            ))}
            <button
              type="button"
              className={`report-option report-option--link ${notListed ? "report-option--active" : ""}`}
              onClick={() => {
                setPetId(null);
                setNotListed(true);
              }}
            >
              <HelpCircle size={16} style={{ marginRight: 8 }} />
              No está en la lista
            </button>
          </div>
        </div>

        <LocationField
          label="Lugar dónde se perdió"
          placeholder="Ej: Parque de Usaquén"
          text={placeText}
          onTextChange={setPlaceText}
          point={point}
          onPointChange={setPoint}
        />

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="lost-traits">
            Características al momento de perderse
          </label>
          <textarea
            id="lost-traits"
            className="pc-textarea"
            placeholder="Ej: Llevaba collar rojo, asustadiza, se esconde con ruidos…"
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
          />
        </div>

        <PhotoGridField
          label="Fotos adicionales"
          help={
            selectedPet
              ? `La primera foto ya es la de ${selectedPet.name} registrada. Puedes agregar hasta 3 más recientes.`
              : "Puedes agregar hasta 3 fotos recientes."
          }
          max={MAX_EXTRA_PHOTOS}
          photos={photos}
          onAdd={(file) => setPhotos((prev) => [...prev, file].slice(0, MAX_EXTRA_PHOTOS))}
          onRemove={(i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
        />

        <div className="pc-field">
          <span className="pc-field-label">¿Cuándo se perdió?</span>
          <div className="datetime-row">
            <input
              className="pc-input"
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Fecha"
            />
            <input
              className="pc-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Hora aproximada"
            />
          </div>
          {date === todayIso() && <p className="pc-muted location-help">Hoy</p>}
        </div>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

        <p className="pc-muted location-help">
          Publicaremos una alerta a los usuarios cerca de la ubicación que indiques.
        </p>

        <div className="pc-form-actions" style={{ display: "flex", gap: 10 }}>
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Publicando…" : "Publicar alerta"}
          </PrimaryButton>
          <button type="button" className="pc-outline-btn" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
