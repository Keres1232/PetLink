import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import PetSelectCard from "../components/PetSelectCard";
import LocationField from "../components/report/LocationField";
import PhotoGridField from "../components/report/PhotoGridField";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import SpeciesPicker from "../components/ui/SpeciesPicker";
import { LoadingState } from "../components/ui/States";
import { useUserLocation } from "../hooks/useUserLocation";
import { createAlert, createPet, getPostByReportId, listSpecies, myPets, uploadPhotos } from "../lib/api";
import { approximatePoint } from "../lib/geo";
import { searchPlace } from "../lib/geocode";
import { yearsToBirthDate } from "../lib/format";
import { COLOR_OPTIONS, SEX_OPTIONS, SIZE_OPTIONS } from "../lib/petOptions";
import { usePrefs } from "../hooks/usePrefs";
import type { GeoPoint, Pet, PetSex, PetSize, Species } from "../lib/types";
import "../components/report/report.css";

const MAX_EXTRA_PHOTOS = 3;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function ageEstimateToBirthDate(value: string): string | null {
  const match = value.replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? yearsToBirthDate(match[0]) : null;
}

export default function MiPetReportPage() {
  const navigate = useNavigate();
  const { point: userPoint, loading: locLoading } = useUserLocation();
  const { prefs } = usePrefs();

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petId, setPetId] = useState<string | null>(null);
  const [notListed, setNotListed] = useState(false);
  const [newPetName, setNewPetName] = useState("");

  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [size, setSize] = useState<PetSize | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [breed, setBreed] = useState("");
  const [ageEstimate, setAgeEstimate] = useState("");

  const [placeText, setPlaceText] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [characteristics, setCharacteristics] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(nowTime());

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void myPets()
      .then((rows) => {
        const active = rows.filter((p) => p.status === "active");
        setPets(active);
        if (active.length > 0) setPetId(active[0].id);
      })
      .catch(() => setPets([]))
      .finally(() => setPetsLoading(false));
  }, []);

  // Sin mascotas activas: el reporte se llena con los datos de la mascota nueva
  useEffect(() => {
    if (!petsLoading && pets.length === 0) setNotListed(true);
  }, [petsLoading, pets.length]);

  useEffect(() => {
    void listSpecies()
      .then(setSpecies)
      .catch(() => setSpecies([]));
  }, []);

  useEffect(() => {
    if (!locLoading && !point && userPoint) setPoint(userPoint);
  }, [locLoading, point, userPoint]);

  const selectedPet = pets.find((p) => p.id === petId) ?? null;

  // Prellena los detalles con los datos de la mascota registrada (si los tiene).
  useEffect(() => {
    if (!selectedPet) return;
    setSpeciesId(selectedPet.species_id ?? selectedPet.species?.id ?? null);
    setSex(selectedPet.sex ?? null);
    setSize(selectedPet.size ?? null);
    setColor(
      selectedPet.color && COLOR_OPTIONS.some((o) => o.value === selectedPet.color)
        ? selectedPet.color
        : null
    );
    setBreed(selectedPet.breed ?? "");
  }, [selectedPet]);

  function clearDetails() {
    setSpeciesId(null);
    setSex(null);
    setSize(null);
    setColor(null);
    setBreed("");
    setAgeEstimate("");
    setNewPetName("");
  }

  async function submit() {
    if (busyRef.current) return;
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
    if (!notListed && !selectedPet) {
      setError("Elige una mascota o toca «No está en la lista».");
      return;
    }
    if (notListed) {
      if (newPetName.trim().length < 2) {
        setError("Escribe el nombre de tu mascota.");
        return;
      }
      if (!speciesId) {
        setError("Selecciona la especie de tu mascota.");
        return;
      }
    }

    busyRef.current = true;
    setBusy(true);
    try {
      const photoUrls = photos.length ? await uploadPhotos(photos, "pet-photos") : [];
      const description = [placeText.trim(), characteristics.trim()]
        .filter(Boolean)
        .join(" · ");
      const lostAt = new Date(`${date}T${time}:00`).toISOString();

      let effectivePetId = selectedPet?.id ?? petId;
      if (notListed) {
        effectivePetId = await createPet({
          name: newPetName.trim(),
          speciesId,
          description: characteristics.trim() || null,
          birthDate: ageEstimateToBirthDate(ageEstimate),
          photoUrl: photoUrls[0] ?? null,
          sex,
          breed: breed.trim() || null,
          color,
          size,
        });
      }

      const reportId = await createAlert({
        petId: effectivePetId,
        type: "lost",
        description: description || "Mascota perdida",
        point: prefs.exactLocation ? finalPoint : approximatePoint(finalPoint),
        photos: photoUrls,
        lostAt,
        speciesId,
        sex,
        breed: breed.trim() || null,
        size,
        color,
        ageEstimate: ageEstimate.trim() || null,
      });
      const post = await getPostByReportId(reportId).catch(() => null);
      navigate(post ? `/comunidad?post=${post.id}` : "/mapa");
    } catch (err) {
      console.error("createAlert (lost) falló:", err);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      if (
        message.includes("Ya registraste") ||
        message.includes("ya fue registrada") ||
        message.toLowerCase().includes("duplicate")
      ) {
        setError("Esta mascota ya fue registrada hace un momento. Revisa tu perfil.");
      } else if (message.includes("alerta activa")) {
        setError(
          "Ya hay un anuncio de mascota perdida para esta mascota. No puedes crear otro mientras siga activo; puedes verlo en el mapa."
        );
      } else {
        setError("No pudimos publicar la alerta. Intenta de nuevo.");
      }
      busyRef.current = false;
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
                clearDetails();
              }}
            >
              <HelpCircle size={16} style={{ marginRight: 8 }} />
              No está en la lista
            </button>
          </div>
        </div>

        <div className="pc-field">
          <span className="pc-field-label">
            {notListed ? "Datos de tu mascota" : "Detalles de tu mascota (opcional)"}
          </span>
          <p className="pc-muted location-help">
            {notListed
              ? "Al publicar la guardaremos en «Mis mascotas» y la alerta saldrá con su información."
              : `Completarlos hace tu alerta más descriptiva para quien la vea en el mapa.${
                  selectedPet ? " Ya tomamos los datos de tu mascota registrada." : ""
                }`}
          </p>
          {notListed && (
            <div className="pc-field">
              <label className="pc-field-label" htmlFor="lost-pet-name">
                Nombre de tu mascota
              </label>
              <input
                id="lost-pet-name"
                className="pc-input"
                placeholder="Ej: Luna"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
              />
            </div>
          )}
          <div className="pc-field">
            <span className="pc-field-label">Especie</span>
            <SpeciesPicker species={species} value={speciesId} onChange={setSpeciesId} />
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
            <span className="pc-field-label">Color</span>
            <ChipGroup options={COLOR_OPTIONS} value={color} onChange={setColor} label="Color" />
          </div>
          <div className="pc-field">
            <label className="pc-field-label" htmlFor="lost-breed">
              Raza (opcional)
            </label>
            <input
              id="lost-breed"
              className="pc-input"
              placeholder="Ej: Criollo"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>
          <div className="pc-field">
            <label className="pc-field-label" htmlFor="lost-age">
              Edad aproximada (opcional)
            </label>
            <input
              id="lost-age"
              className="pc-input"
              placeholder="Ej: 2 años"
              value={ageEstimate}
              onChange={(e) => setAgeEstimate(e.target.value)}
            />
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
            notListed
              ? `La primera foto será también la foto de ${
                  newPetName.trim() || "tu mascota"
                } en «Mis mascotas». Puedes agregar hasta 3.`
              : selectedPet
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
          <PrimaryButton onClick={() => void submit()} type="button" disabled={busy}>
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
