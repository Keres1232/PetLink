import { useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import PetPicker from "../pets/PetPicker.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import PlaceField from "../shared/PlaceField.jsx";
import PhotoCropModal from "../shared/PhotoCropModal.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import SpeciesPicker from "../shared/SpeciesPicker.jsx";
import { defaultSpeciesId } from "../../../lib/species";
import "./ReportLostPage.css";

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
    <path d="M3 10H21M8 3V7M16 3V7" {...stroke} />
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" {...stroke} />
    <path d="M12 7V12L15 14" {...stroke} />
  </svg>
);
const PlusIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#ffffff" />
    <path d="M12 7V17M7 12H17" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MAX_EXTRA_PHOTOS = 3;
const SEX = ["Macho", "Hembra", "No sé"];
const SIZES = ["Pequeño", "Mediano", "Grande"];

/**
 * "Se perdió mi mascota". Si la mascota no está inscrita (o la cuenta no tiene ninguna), sus datos se
 * llenan aquí mismo: al publicar se guarda en "Mis mascotas" y la alerta sale con su foto y sus datos.
 */
function ReportLostPage({ city = "Bogotá", pets = [], species = [], onBack, onNotifications, onSubmit }) {
  const [petId, setPetId] = useState(pets[0]?.id ?? null);
  // Mascota nueva (no inscrita): se llena aquí y se guarda al publicar
  const [newPetMode, setNewPetMode] = useState(pets.length === 0);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petSex, setPetSex] = useState("Macho");
  const [petSize, setPetSize] = useState("Pequeño");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petColor, setPetColor] = useState("");
  const currentSpecies = petSpecies || defaultSpeciesId(species);
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState(null);
  const [traits, setTraits] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedPet = newPetMode ? null : pets.find((p) => p.id === petId);
  const newPetReady = newPetMode && petName.trim().length >= 2 && Boolean(currentSpecies);
  const canSubmit = (Boolean(selectedPet) || newPetReady) && place.trim() !== "" && !busy;

  const choosePet = (id) => {
    setNewPetMode(false);
    setPetId(id);
  };
  const startNewPet = () => {
    setNewPetMode(true);
    setPetId(null);
  };

  const [cropFile, setCropFile] = useState(null); // primera foto, esperando que el usuario la ajuste

  const pushPhoto = (file) => {
    setPhotos((p) => [...p, URL.createObjectURL(file)]);
    setPhotoFiles((f) => [...f, file]);
  };

  // La primera foto es la que se ve en la tarjeta de la alerta y en su ficha: se ajusta
  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file && photos.length < MAX_EXTRA_PHOTOS) {
      if (photos.length === 0) setCropFile(file);
      else pushPhoto(file);
    }
    e.target.value = "";
  };

  // Candado síncrono: un segundo toque rápido no vuelve a enviar (useState tarda un render)
  const busyRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit?.({
        petId: selectedPet?.id ?? null,
        // Mascota no inscrita: App la guarda en "Mis mascotas" antes de publicar la alerta
        newPet: newPetMode
          ? {
              name: petName.trim(),
              speciesId: currentSpecies,
              sex: petSex,
              size: petSize,
              breed: petBreed.trim(),
              age: petAge.trim(),
              color: petColor.trim(),
            }
          : null,
        date,
        time,
        place,
        point: coords,
        traits,
        photoFiles,
      });
    } catch (err) {
      console.error(err);
      busyRef.current = false; // solo se libera si falló
      setError(err?.message || "No se pudo publicar la alerta. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="Reportar mascota" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <form className="report-lost" onSubmit={submit}>
        <InfoNotice>Publicaremos una alerta a los usuarios cerca de la ubicación que indiques.</InfoNotice>

        <h2 className="report-lost__label">¿Cuál de tus mascotas se perdió?</h2>
        {pets.length > 0 && (
          <PetPicker
            pets={pets}
            value={newPetMode ? null : petId}
            onChange={choosePet}
            onNotListed={startNewPet}
            notListedActive={newPetMode}
          />
        )}

        {/* Mascota no inscrita: sus datos aquí mismo (se guarda en "Mis mascotas" al publicar) */}
        {newPetMode && (
          <div className="report-lost__new-pet">
            <p className="report-lost__new-pet-note">
              {pets.length
                ? "Llena los datos de tu mascota. Al publicar la guardaremos en «Mis mascotas» y la alerta saldrá con su información."
                : "Aún no tienes mascotas inscritas. Llena sus datos aquí: al publicar la guardaremos en «Mis mascotas» y la alerta saldrá con su información."}
            </p>

            <TextInputField label="Nombre" value={petName} onChange={setPetName} />

            <div className="report-lost__field">
              <span className="report-lost__label">Especie</span>
              {species.length > 0 ? (
                <SpeciesPicker species={species} value={currentSpecies} onChange={setPetSpecies} />
              ) : (
                <p className="auth-error">No hay especies disponibles.</p>
              )}
            </div>

            <div className="report-lost__field">
              <span className="report-lost__label">Sexo</span>
              <ChipGroup options={SEX} value={petSex} onChange={setPetSex} />
            </div>

            <div className="report-lost__field">
              <span className="report-lost__label">Tamaño</span>
              <ChipGroup options={SIZES} value={petSize} onChange={setPetSize} variant="plain" />
            </div>

            <div className="report-lost__row">
              <TextInputField label="Raza" value={petBreed} onChange={setPetBreed} />
              <TextInputField label="Edad (años)" value={petAge} onChange={setPetAge} />
            </div>
            <TextInputField label="Color" value={petColor} onChange={setPetColor} />
          </div>
        )}

        {!newPetMode && !selectedPet && (
          <p className="report-lost__hint">Elige cuál de tus mascotas se perdió, o toca «No está en lista» para llenar sus datos aquí.</p>
        )}

        <div className="report-lost__row">
          <IconInputField label="Fecha" icon={<CalendarIcon />} type="date" value={date} onChange={setDate} />
          <IconInputField label="Hora aprox" icon={<ClockIcon />} type="time" value={time} onChange={setTime} />
        </div>

        {/* Dirección ⇄ mini mapa (con botón para centrar en donde estás) */}
        <PlaceField
          label="Lugar dónde se perdió"
          placeholder="Ej: Parque de Usaquén"
          value={place}
          onChange={setPlace}
          point={coords}
          onPointChange={setCoords}
          city={city}
        />

        <label className="report-lost__field">
          <span className="report-lost__label">Características al momento de perderse</span>
          <textarea className="report-lost__textarea" rows={4} value={traits} onChange={(e) => setTraits(e.target.value)} />
        </label>

        <div className="report-lost__field">
          <span className="report-lost__label">Fotos adicionales</span>

          <div className="report-lost__photos">
            {/* La foto registrada solo aparece si la mascota tiene una (sin cuadro vacío) */}
            {selectedPet?.photoUrl && (
              <div className="report-lost__photo">
                <img src={selectedPet.photoUrl} alt={selectedPet.name} />
              </div>
            )}

            {photos.map((src) => (
              <div key={src} className="report-lost__photo">
                <img src={src} alt="" />
              </div>
            ))}

            {photos.length < MAX_EXTRA_PHOTOS && (
              <label className="report-lost__photo report-lost__photo--add">
                <PlusIcon />
                <input type="file" accept="image/*" onChange={addPhoto} hidden />
              </label>
            )}
          </div>

          <p className="report-lost__hint">
            {newPetMode
              ? `La primera foto será también la foto de ${petName.trim() || "tu mascota"} en «Mis mascotas». Puedes agregar hasta ${MAX_EXTRA_PHOTOS}.`
              : selectedPet?.photoUrl
                ? `La primera foto ya es la de ${selectedPet.name} registrada. Puedes agregar hasta ${MAX_EXTRA_PHOTOS} más recientes.`
                : `${selectedPet?.name ?? "Tu mascota"} no tiene foto registrada. Agrega hasta ${MAX_EXTRA_PHOTOS} fotos recientes para que sea más fácil reconocerla.`}
          </p>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" className="report-lost__submit" disabled={!canSubmit}>
          {busy ? "Publicando..." : "Publicar alerta"}
        </button>

        <button type="button" className="report-lost__cancel" onClick={onBack}>
          Cancelar
        </button>
      </form>

      <PhotoCropModal
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={(file) => {
          setCropFile(null);
          pushPhoto(file);
        }}
      />
    </>
  );
}

export default ReportLostPage;