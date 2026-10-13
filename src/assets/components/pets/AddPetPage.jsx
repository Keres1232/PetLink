import { useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import PhotoPickerModal from "../shared/PhotoPickerModal.jsx";
import PhotoCropModal from "../shared/PhotoCropModal.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import editIcon from "../../svg/edit_icono.svg";
import SpeciesPicker from "../shared/SpeciesPicker.jsx";
import { defaultSpeciesId } from "../../../lib/species";
import "./AddPetPage.css";

const SEX = ["Macho", "Hembra"];
const SIZES = ["Pequeño", "Mediano", "Grande"];

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
  const [cropFile, setCropFile] = useState(null); // foto elegida, esperando que el usuario la ajuste
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

  const speciesId = form.speciesId || defaultSpeciesId(species);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.name.trim().length >= 2 && Boolean(speciesId) && !saving;

  // Candado síncrono: un segundo toque rápido no vuelve a enviar (useState tarda un render)
  const savingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
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
      savingRef.current = false; // solo se libera si falló; si se guardó, la pantalla se cierra
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
          {species.length > 0 ? (
            <SpeciesPicker species={species} value={speciesId} onChange={update("speciesId")} />
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
        onFile={setCropFile}
      />

      {/* Elegir qué parte de la foto se ve en la tarjeta y en la ficha expandida */}
      <PhotoCropModal
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={(file) => {
          setCropFile(null);
          setPhotoFile(file);
          setPhoto(URL.createObjectURL(file));
        }}
      />
    </>
  );
}

export default AddPetPage;