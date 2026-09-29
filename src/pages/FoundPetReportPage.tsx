import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import LocationField from "../components/report/LocationField";
import PhotoGridField from "../components/report/PhotoGridField";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import PhotoPickerModal from "../components/ui/PhotoPickerModal";
import { useUserLocation } from "../hooks/useUserLocation";
import { createAlert, getPostByReportId, listSpecies, uploadPhotos } from "../lib/api";
import { searchPlace } from "../lib/geocode";
import type { GeoPoint, PetSex, PetSize, Species } from "../lib/types";
import "../components/report/report.css";

const MAX_EXTRA_PHOTOS = 3;

const SEX_OPTIONS: { value: PetSex; label: string }[] = [
  { value: "male", label: "Macho" },
  { value: "female", label: "Hembra" },
  { value: "unknown", label: "No sé" },
];

const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: "small", label: "Pequeño" },
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
];

export default function FoundPetReportPage() {
  const navigate = useNavigate();
  const { point: userPoint, loading: locLoading } = useUserLocation();

  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [size, setSize] = useState<PetSize | null>(null);
  const [ageEstimate, setAgeEstimate] = useState("");
  const [breed, setBreed] = useState("");
  const [characteristics, setCharacteristics] = useState("");

  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [mainPickerOpen, setMainPickerOpen] = useState(false);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);

  const [placeText, setPlaceText] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSpecies()
      .then(setSpecies)
      .catch(() => setSpecies([]));
  }, []);

  useEffect(() => {
    if (!locLoading && !point && userPoint) setPoint(userPoint);
  }, [locLoading, point, userPoint]);

  const speciesOptions = species.map((s) => ({ value: s.id, label: s.name }));

  async function submit() {
    setError(null);
    let finalPoint = point;
    if (!finalPoint && placeText.trim()) {
      finalPoint = await searchPlace(placeText);
    }
    if (!finalPoint) {
      setError("Indica el lugar dónde lo encontraste (o usa tu ubicación actual).");
      return;
    }
    if (characteristics.trim().length < 5) {
      setError("Describe cómo es la mascota que encontraste.");
      return;
    }

    setBusy(true);
    try {
      const files = mainPhoto ? [mainPhoto, ...extraPhotos] : extraPhotos;
      const photoUrls = files.length ? await uploadPhotos(files, "pet-photos") : [];
      const description = [placeText.trim(), characteristics.trim()]
        .filter(Boolean)
        .join(" · ");

      const reportId = await createAlert({
        petId: null,
        type: "found",
        description,
        point: finalPoint,
        speciesId,
        sex,
        breed: breed.trim() || null,
        size,
        ageEstimate: ageEstimate.trim() || null,
        photos: photoUrls,
      });
      const post = await getPostByReportId(reportId).catch(() => null);
      navigate(post ? `/comunidad?post=${post.id}` : "/mapa");
    } catch (err) {
      console.error("createAlert (found) falló:", err);
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
        <h1 className="pc-title">Encontré mascota</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <div className="pc-field">
          <span className="pc-field-label">Agrega una foto clara de la mascota</span>
          <div className="found-main-photo">
            {mainPhoto ? (
              <button
                type="button"
                className="found-main-photo__preview"
                onClick={() => setMainPickerOpen(true)}
              >
                <img src={URL.createObjectURL(mainPhoto)} alt="Foto principal" />
              </button>
            ) : (
              <button
                type="button"
                className="found-main-photo__empty"
                onClick={() => setMainPickerOpen(true)}
              >
                <Camera size={26} />
                <span>Agregar foto</span>
              </button>
            )}
          </div>
          <PhotoPickerModal
            open={mainPickerOpen}
            onClose={() => setMainPickerOpen(false)}
            onPick={setMainPhoto}
          />
        </div>

        <LocationField
          label="Lugar dónde lo encontraste"
          placeholder="Ej: Parque de Usaquén"
          text={placeText}
          onTextChange={setPlaceText}
          point={point}
          onPointChange={setPoint}
        />

        <div className="pc-field">
          <span className="pc-field-label">Especie</span>
          <ChipGroup
            options={speciesOptions}
            value={speciesId}
            onChange={setSpeciesId}
            label="Especie"
          />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Sexo</span>
          <ChipGroup options={SEX_OPTIONS} value={sex} onChange={setSex} label="Sexo" />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Tamaño</span>
          <ChipGroup options={SIZE_OPTIONS} value={size} onChange={setSize} label="Tamaño" />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="found-age">
            Edad aproximada
          </label>
          <input
            id="found-age"
            className="pc-input"
            placeholder="Ej: 2 años"
            value={ageEstimate}
            onChange={(e) => setAgeEstimate(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="found-breed">
            Raza
          </label>
          <input
            id="found-breed"
            className="pc-input"
            placeholder="Ej: Criollo"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="found-desc">
            Características / Descripción
          </label>
          <textarea
            id="found-desc"
            className="pc-textarea"
            placeholder="Color, collar, señas particulares, comportamiento…"
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
          />
        </div>

        <PhotoGridField
          label="Fotos adicionales"
          max={MAX_EXTRA_PHOTOS}
          photos={extraPhotos}
          onAdd={(file) => setExtraPhotos((prev) => [...prev, file].slice(0, MAX_EXTRA_PHOTOS))}
          onRemove={(i) => setExtraPhotos((prev) => prev.filter((_, idx) => idx !== i))}
        />

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

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
