import { useState, useMemo } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import PhotoPickerModal from "../shared/PhotoPickerModal.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import editIcon from "../../svg/edit_icono.svg";
import dogIcon from "../../svg/Inscribir/perro.svg";
import catIcon from "../../svg/Inscribir/gato.svg";
import "./AddPetPage.css";

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 20.5C12 20.5 3 15.5 3 9C3 6 5.5 4 8 4C10 4 11.3 5.2 12 6.3C12.7 5.2 14 4 16 4C18.5 4 21 6 21 9C21 15.5 12 20.5 12 20.5Z"
      stroke="#7519FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SEX = ["Macho", "Hembra"];
const SIZES = ["Pequeño", "Mediano", "Grande"];
const SPECIES_OPTIONS = [
  { names: ["dog", "perro"], label: "Perro", icon: dogIcon },
  { names: ["cat", "gato"], label: "Gato", icon: catIcon },
  { names: ["bird", "otro"], label: "Otro", icon: <HeartIcon /> },
];
const normalizeSpeciesName = (name) => name.trim().toLowerCase();

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

// La base de datos guarda la fecha de nacimiento: la edad en años se convierte en una fecha aproximada
const yearsToBirthDate = (years) => {
  const n = parseFloat(String(years).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return new Date(Date.now() - n * YEAR_MS).toISOString().slice(0, 10);
};
const birthDateToYears = (birthDate) =>
  birthDate ? String(Math.round(((Date.now() - new Date(birthDate).getTime()) / YEAR_MS) * 10) / 10) : "";

function AddPetPage({ species = [], pet = null, onBack, onNotifications, onSave, onDelete }) {
  const editing = Boolean(pet);
  const [photo, setPhoto] = useState(pet?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    speciesId: pet?.speciesId ?? "",
    name: pet?.name ?? "",
    breed: pet?.breed ?? "",
    age: birthDateToYears(pet?.birthDate),
    sex: pet?.sex === "Hembra" ? "Hembra" : "Macho",
    size: pet?.size || "Pequeño",
    color: pet?.color ?? "",
    marks: pet?.marks ?? "",
  });

  const options = useMemo(
    () =>
      SPECIES_OPTIONS.flatMap(({ names, label, icon }) => {
        const speciesEntry = species.find((item) =>
          names.includes(normalizeSpeciesName(item.name))
        );
        return speciesEntry ? [{ id: speciesEntry.id, label, icon }] : [];
      }),
    [species]
  );

  const speciesId = form.speciesId || options[0]?.id || "";

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.name.trim().length >= 2 && Boolean(speciesId) && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await onSave?.({
        ...form,
        id: pet?.id,
        speciesId,
        birthDate: yearsToBirthDate(form.age),
        photoUrl: photo,
        photoFile,
      });
    } catch (err) {
      setError(err?.message || "No pudimos guardar a tu mascota. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError("");
    try {
      await onDelete?.(pet.id);
    } catch (err) {
      setError(err?.message || "No pudimos eliminar a tu mascota. Intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader
        title={editing ? "Editar mascota" : "Inscribir mascota"}
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={bellIcon}
        onRight={onNotifications}
      />

      <form className="add-pet" onSubmit={submit}>
        <div className="add-pet__photo-block">
          <div className="add-pet__photo">
            <div className="add-pet__photo-circle">
              {photo ? <img src={photo} alt="" /> : <AvatarPlaceholder />}
            </div>
            <button
              type="button"
              className="add-pet__photo-edit"
              aria-label="Agregar foto"
              onClick={() => setPickerOpen(true)}
            >
              <img src={editIcon} alt="" />
            </button>
          </div>
          <p className="add-pet__photo-hint">Agrega una foto clara de tu mascota</p>
        </div>

        <div className="add-pet__group">
          <span className="add-pet__label">Especie</span>
          {options.length > 0 ? (
            <ChipGroup options={options} value={speciesId} onChange={update("speciesId")} />
          ) : (
            <p className="add-pet__error">
              No hay especies disponibles. Revisa la tabla species en la base de datos.
            </p>
          )}
        </div>

        <TextInputField label="Nombre" value={form.name} onChange={update("name")} />
        <TextInputField label="Raza" optional value={form.breed} onChange={update("breed")} />
        <TextInputField
          label="Edad (años)"
          type="number"
          placeholder="Ej: 2 o 0.5 para 6 meses"
          value={form.age}
          onChange={update("age")}
        />

        <div className="add-pet__group">
          <span className="add-pet__label">Sexo</span>
          <ChipGroup options={SEX} value={form.sex} onChange={update("sex")} />
        </div>

        <div className="add-pet__group">
          <span className="add-pet__label">Tamaño</span>
          <ChipGroup options={SIZES} value={form.size} onChange={update("size")} variant="plain" />
        </div>

        <TextInputField label="Color" value={form.color} onChange={update("color")} />
        <TextInputField label="Señas particulares" optional value={form.marks} onChange={update("marks")} />

        <div className="add-pet__notice">
          <span className="add-pet__notice-icon" aria-hidden="true">!</span>
          <p>
            Esta información se usará para generar la alerta automática si algún
            día reportas a tu mascota como perdida.
          </p>
        </div>

        {error && <p className="add-pet__error" role="alert">{error}</p>}

        <button type="submit" className="add-pet__save" disabled={!canSave}>
          {saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar mascota"}
        </button>

        <button type="button" className="add-pet__cancel" onClick={onBack}>
          Cancelar
        </button>

        {/* Eliminar: pide confirmación en la misma página */}
        {editing &&
          (confirmDelete ? (
            <div className="add-pet__delete-confirm">
              <p>¿Seguro que quieres eliminar a {pet.name}? Ya no aparecerá en tu perfil.</p>
              <div className="add-pet__delete-actions">
                <button type="button" className="add-pet__cancel" onClick={() => setConfirmDelete(false)}>
                  No, volver
                </button>
                <button type="button" className="add-pet__delete" disabled={saving} onClick={() => void remove()}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="add-pet__delete" onClick={() => setConfirmDelete(true)}>
              Eliminar mascota
            </button>
          ))}
      </form>

      <PhotoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onFile={(file) => {
          setPhotoFile(file);
          setPhoto(URL.createObjectURL(file));
        }}
      />
    </>
  );
}

export default AddPetPage;