import { useState, useMemo } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import PhotoPickerModal from "../shared/PhotoPickerModal.jsx";
import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import editIcon from "../../svg/edit_icono.svg";
import dogIcon from "../../svg/Inscribir/perro.svg";
import catIcon from "../../svg/Inscribir/gato.svg";
import { setGeoConsent } from "../../../lib/geo";
import "./ReportLostPage.css";
import "./ReportFoundPage.css";

// Especies que no se deben mostrar
const HIDDEN_SPECIES = ["ferret", "rabbit"];

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20.5C12 20.5 3 15.5 3 9C3 6 5.5 4 8 4C10 4 11.3 5.2 12 6.3C12.7 5.2 14 4 16 4C18.5 4 21 6 21 9C21 15.5 12 20.5 12 20.5Z"
      stroke="#7519FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);
const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M12 21C12 21 19 14.5 19 8.5C19 4.91 15.87 2 12 2C8.13 2 5 4.91 5 8.5C5 14.5 12 21 12 21Z" {...stroke} />
    <circle cx="12" cy="8.5" r="2.5" {...stroke} />
  </svg>
);
const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" fill="#7519FF" />
    <circle cx="12" cy="12" r="8" stroke="#7519FF" strokeWidth="2" fill="none" />
    <path d="M12 1V4M12 20V23M1 12H4M20 12H23" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const PlusIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#ffffff" />
    <path d="M12 7V17M7 12H17" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const kindOf = (name) => {
  const n = name.toLowerCase();
  if (n.includes("perr") || n.includes("dog") || n.includes("canin")) return "dog";
  if (n.includes("gat") || n.includes("cat") || n.includes("felin")) return "cat";
  return "other";
};

// Siempre se muestran en este orden: Perro, Gato, Otro
const CHIPS = [
  { kind: "dog", label: "Perro", icon: dogIcon },
  { kind: "cat", label: "Gato", icon: catIcon },
  { kind: "other", label: "Otro", icon: <HeartIcon /> },
];

const SEX = ["Macho", "Hembra", "No sé"];
const SIZES = ["Pequeño", "Mediano", "Grande"];
const MAX_PHOTOS = 3;

function ReportFoundPage({ species = [], onBack, onNotifications, onSubmit }) {
  const [mainPhoto, setMainPhoto] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [speciesId, setSpeciesId] = useState("");
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState(null);
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("Macho");
  const [size, setSize] = useState("Pequeño");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const options = useMemo(() => {
    const visible = species.filter((s) => !HIDDEN_SPECIES.includes(s.name.toLowerCase()));
    return CHIPS.map((chip) => {
      const matches = visible.filter((s) => kindOf(s.name) === chip.kind);
      const match =
        chip.kind === "other"
          ? matches.find((s) => ["other", "otro"].includes(s.name.toLowerCase())) ?? matches[0]
          : matches[0];
      return match && { id: match.id, label: chip.label, icon: chip.icon };
    }).filter(Boolean);
  }, [species]);
  const currentSpecies = speciesId || options[0]?.id || "";
  const canSubmit = place.trim() !== "" && !busy;

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file && photos.length < MAX_PHOTOS) {
      setPhotos((p) => [...p, URL.createObjectURL(file)]);
      setPhotoFiles((f) => [...f, file]);
    }
    e.target.value = "";
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setGeoConsent(true);
        setCoords({ lat: c.latitude, lon: c.longitude });
        setPlace(`Mi ubicación actual (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`);
      },
      () => setError("No se pudo obtener tu ubicación. Escribe el lugar a mano.")
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit?.({
        speciesId: currentSpecies || null,
        place,
        point: coords,
        breed,
        sex,
        size,
        age,
        description,
        photoFiles: mainFile ? [mainFile, ...photoFiles] : photoFiles,
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo publicar la alerta. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="Encontré mascota" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <form className="report-lost" onSubmit={submit}>
        <div className="found__photo-block">
          <div className="found__photo">
            <div className="found__photo-circle">
              {mainPhoto ? <img src={mainPhoto} alt="" /> : <AvatarPlaceholder />}
            </div>
            <button type="button" className="found__photo-edit" aria-label="Agregar foto" onClick={() => setPickerOpen(true)}>
              <img src={editIcon} alt="" />
            </button>
          </div>
          <p className="found__photo-hint">Agrega una foto clara de la mascota</p>
        </div>

        <div className="found__group">
          <span className="report-lost__label">Especie</span>
          {options.length > 0 ? (
            <ChipGroup options={options} value={currentSpecies} onChange={setSpeciesId} />
          ) : (
            <p className="auth-error">No hay especies disponibles.</p>
          )}
        </div>

        <div className="report-lost__place">
          <IconInputField
            label="Lugar dónde lo encontraste"
            icon={<PinIcon />}
            placeholder="Ej: Parque de Usaquén"
            value={place}
            onChange={(v) => {
              setPlace(v);
              setCoords(null);
            }}
          />
          <button type="button" className="report-lost__locate" onClick={useMyLocation}>
            <TargetIcon />
            Usar mi ubicación actual
          </button>
        </div>

        <TextInputField label="Raza" value={breed} onChange={setBreed} />

        <div className="found__group">
          <span className="report-lost__label">Sexo</span>
          <ChipGroup options={SEX} value={sex} onChange={setSex} />
        </div>

        <div className="found__group">
          <span className="report-lost__label">Tamaño</span>
          <ChipGroup options={SIZES} value={size} onChange={setSize} variant="plain" />
        </div>

        <TextInputField label="Edad aproximada" value={age} onChange={setAge} />

        <label className="report-lost__field">
          <span className="report-lost__label">Características / Descripción</span>
          <textarea className="report-lost__textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="report-lost__field">
          <span className="report-lost__label">Fotos adicionales</span>
          <div className="report-lost__photos">
            {photos.map((src) => (
              <div key={src} className="report-lost__photo">
                <img src={src} alt="" />
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="report-lost__photo report-lost__photo--add">
                <PlusIcon />
                <input type="file" accept="image/*" onChange={addPhoto} hidden />
              </label>
            )}
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" className="report-lost__submit report-found__submit" disabled={!canSubmit}>
          {busy ? "Publicando..." : "Publicar alerta"}
        </button>

        <button type="button" className="report-lost__cancel" onClick={onBack}>
          Cancelar
        </button>
      </form>

      <PhotoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onFile={(file) => {
          setMainFile(file);
          setMainPhoto(URL.createObjectURL(file));
        }}
      />
    </>
  );
}

export default ReportFoundPage;