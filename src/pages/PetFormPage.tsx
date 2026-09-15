import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { createPet, listSpecies, uploadPhoto } from "../lib/api";
import { ageFromBirthDate } from "../lib/format";
import type { Species } from "../lib/types";
import "../styles/pages.css";

export default function PetFormPage() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState<Species[]>([]);
  const [name, setName] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [description, setDescription] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSpecies().then(setSpecies).catch(() => setSpecies([]));
  }, []);

  async function submit() {
    if (name.trim().length < 2) {
      setError("Escribe el nombre de tu mascota.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadPhoto(photo, "pet-photos");
      await createPet({
        name: name.trim(),
        speciesId: speciesId || null,
        description: description.trim() || null,
        birthDate: birthDate || null,
        photoUrl,
      });
      navigate("/perfil");
    } catch {
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
        <h1 className="pc-title">Inscribe tu mascota</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        {photo && (
          <img
            src={URL.createObjectURL(photo)}
            alt="Vista previa de tu mascota"
            style={{ borderRadius: 12, marginBottom: 16, maxHeight: 220, width: "100%", objectFit: "cover" }}
          />
        )}

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-name">Nombre mascota</label>
          <input
            id="pet-name"
            className="pc-input"
            placeholder="Ej: Toby"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-species">Animal</label>
          <select
            id="pet-species"
            className="pc-select"
            value={speciesId}
            onChange={(e) => setSpeciesId(e.target.value)}
          >
            <option value="">Selecciona…</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-desc">Descripción</label>
          <textarea
            id="pet-desc"
            className="pc-textarea"
            placeholder="Rasgos, color, personalidad…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-birth">Edad (fecha de nacimiento)</label>
          <input
            id="pet-birth"
            className="pc-input"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          {birthDate && <p className="pc-muted" style={{ marginTop: 6 }}>Edad aproximada: {ageFromBirthDate(birthDate)}</p>}
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="pet-photo">Foto</label>
          <input
            id="pet-photo"
            className="pc-input"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="pc-error-text" role="alert">{error}</p>}

        <div className="pc-form-actions">
          <PrimaryButton onClick={() => void submit()} type="button">
            {busy ? "Guardando…" : "Inscribir mascota"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
