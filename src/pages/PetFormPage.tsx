import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import PhotoPickerModal from "../components/ui/PhotoPickerModal";
import { createPet, listSpecies, uploadPhoto } from "../lib/api";
import { ageFromBirthDate } from "../lib/format";
import type { PetSex, PetSize, Species } from "../lib/types";
import "../components/report/report.css";
import "../styles/pages.css";

const PET_SEX_OPTIONS: { value: PetSex; label: string }[] = [
  { value: "male", label: "Macho" },
  { value: "female", label: "Hembra" },
];

const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: "small", label: "Pequeño" },
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
];

export default function PetFormPage() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState<Species[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState<PetSize | null>(null);
  const [markings, setMarkings] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSpecies()
      .then(setSpecies)
      .catch(() => setSpecies([]));
  }, []);

  async function submit() {
    if (name.trim().length < 2) {
      setError("Escribe el nombre de tu mascota.");
      return;
    }
    if (!speciesId) {
      setError("Selecciona la especie de tu mascota.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadPhoto(photo, "pet-photos");
      await createPet({
        name: name.trim(),
        speciesId,
        description: markings.trim() || null,
        birthDate: birthDate || null,
        photoUrl,
        sex,
        breed: breed.trim() || null,
        color: color.trim() || null,
        size,
      });
      navigate("/perfil");
    } catch (err) {
      console.error("createPet falló:", err);
      setError("No pudimos inscribir a tu mascota. Intenta de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Inscribir mascota</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        <div className="pc-field">
          <span className="pc-field-label">Agrega una foto clara de tu mascota</span>
          <button
            type="button"
            className={photo ? "found-main-photo__preview" : "found-main-photo__empty"}
            onClick={() => setPickerOpen(true)}
          >
            {photo ? (
              <img src={URL.createObjectURL(photo)} alt="Vista previa de tu mascota" />
            ) : (
              <>
                <Camera size={26} />
                <span>Agregar foto</span>
              </>
            )}
          </button>
          <PhotoPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={setPhoto}
          />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Especie</span>
          <ChipGroup
            options={species.map((s) => ({ value: s.id, label: s.name }))}
            value={speciesId}
            onChange={setSpeciesId}
            label="Especie"
          />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Sexo</span>
          <ChipGroup options={PET_SEX_OPTIONS} value={sex} onChange={setSex} label="Sexo" />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-name">
            Nombre
          </label>
          <input
            id="pet-name"
            className="pc-input"
            placeholder="Ej: Mati"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-breed">
            Raza (opcional)
          </label>
          <input
            id="pet-breed"
            className="pc-input"
            placeholder="Ej: Criollo"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-birth">
            Edad
          </label>
          <input
            id="pet-birth"
            className="pc-input"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          {birthDate && (
            <p className="pc-muted location-help">
              Edad aproximada: {ageFromBirthDate(birthDate)}
            </p>
          )}
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-color">
            Color
          </label>
          <input
            id="pet-color"
            className="pc-input"
            placeholder="Ej: Café con blanco"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <span className="pc-field-label">Tamaño</span>
          <ChipGroup options={SIZE_OPTIONS} value={size} onChange={setSize} label="Tamaño" />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-markings">
            Señas particulares (opcional)
          </label>
          <textarea
            id="pet-markings"
            className="pc-textarea"
            placeholder="Manchas, cicatrices, collar, comportamiento…"
            value={markings}
            onChange={(e) => setMarkings(e.target.value)}
          />
        </div>

        <p className="pc-muted location-help">
          Esta información se usará para generar la alerta automática si algún día reportas a
          tu mascota como perdida.
        </p>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

        <div className="pc-form-actions" style={{ display: "flex", gap: 10 }}>
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Guardando…" : "Guardar mascota"}
          </PrimaryButton>
          <button type="button" className="pc-outline-btn" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
