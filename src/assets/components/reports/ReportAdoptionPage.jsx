import { useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import SpeciesPicker from "../shared/SpeciesPicker.jsx";
import PetPicker from "../pets/PetPicker.jsx";
import { defaultSpeciesId } from "../../../lib/species";
import { reverseGeocode } from "../../../lib/geocode";
import "./ReportLostPage.css";
import "./ReportFoundPage.css";

const stroke = { stroke: "#66557E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21C12 21 19 14.5 19 8.5C19 4.91 15.87 2 12 2C8.13 2 5 4.91 5 8.5C5 14.5 12 21 12 21Z" {...stroke} />
    <circle cx="12" cy="8.5" r="2.5" {...stroke} />
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="#7519FF" />
    <circle cx="12" cy="12" r="8" stroke="#7519FF" strokeWidth="2" fill="none" />
    <path d="M12 1V4M12 20V23M1 12H4M20 12H23" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#ffffff" />
    <path d="M12 7V17M7 12H17" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SEX = ["Macho", "Hembra", "No sé"];
const SIZES = ["Pequeño", "Mediano", "Grande"];
const MAX_PHOTOS = 3;

/**
 * Dar en adopción: una de tus mascotas registradas (`myPets`, se publica esa misma con sus datos y su
 * foto) u otra mascota nueva. `initialPetId` llega desde la ficha de tu mascota ("Dar en adopción").
 */
function ReportAdoptionPage({ species = [], myPets = [], initialPetId = null, onBack, onNotifications, onSubmit }) {
  const [petId, setPetId] = useState(initialPetId);
  const selectedPet = myPets.find((p) => p.id === petId) ?? null;
  const [speciesId, setSpeciesId] = useState("");
  const currentSpecies = speciesId || defaultSpeciesId(species);
  const [place, setPlace] = useState("");
  const [name, setName] = useState("");
  const [sex, setSex] = useState("Macho");
  const [size, setSize] = useState("Pequeño");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState(() => myPets.find((p) => p.id === initialPetId)?.marks ?? "");
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]); // los archivos reales para subirlos
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    place.trim() !== "" && (selectedPet ? true : name.trim() !== "" && Boolean(currentSpecies)) && !busy;

  // Al elegir una mascota registrada se trae su descripción para que el dueño la complete
  const choosePet = (id) => {
    setPetId(id);
    const pet = myPets.find((p) => p.id === id);
    if (pet && !description.trim()) setDescription(pet.marks ?? "");
  };

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file && photos.length < MAX_PHOTOS) {
      setPhotos((p) => [...p, URL.createObjectURL(file)]);
      setPhotoFiles((f) => [...f, file]);
    }
    e.target.value = "";
  };

  // Con el GPS se escribe el nombre del lugar (no las coordenadas)
  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const text = await reverseGeocode({ lat: coords.latitude, lon: coords.longitude });
        setPlace(text ?? `Mi ubicación actual (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
      },
      () => setError("No se pudo obtener tu ubicación. Escribe el lugar a mano.")
    );
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
      await onSubmit?.(
        selectedPet
          ? { petId: selectedPet.id, place, description }
          : { speciesId: currentSpecies, place, name, sex, size, age, description, photoFiles }
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo publicar. Intenta de nuevo.");
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Dar en adopción"
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={bellIcon}
        onRight={onNotifications}
      />

      <form className="report-lost" onSubmit={submit}>
        <InfoNotice>
          Publica una mascota para que alguien de la comunidad la adopte. Las personas interesadas te
          escribirán en privado y tú decides a quién aprobar.
        </InfoNotice>

        {myPets.length > 0 && (
          <div className="found__group">
            <span className="report-lost__label">¿Es una de tus mascotas?</span>
            <PetPicker
              pets={myPets}
              value={petId}
              onChange={choosePet}
              onNotListed={() => setPetId(null)}
              notListedLabel="Otra mascota"
              notListedActive={petId === null}
            />
          </div>
        )}

        {selectedPet && (
          <p className="adoption-form__note">
            Publicaremos a <strong>{selectedPet.name}</strong> con los datos y la foto de su perfil. Solo indica
            dónde está y cuéntale a la comunidad cómo es.
          </p>
        )}

        {!selectedPet && (
          <div className="found__group">
            <span className="report-lost__label">Especie</span>
            {species.length > 0 ? (
              <SpeciesPicker species={species} value={currentSpecies} onChange={setSpeciesId} />
            ) : (
              <p className="auth-error">No hay especies disponibles.</p>
            )}
          </div>
        )}

        <div className="report-lost__place">
          <IconInputField
            label="Lugar dónde se encuentra"
            icon={<PinIcon />}
            placeholder="Ej: Parque de Usaquén"
            value={place}
            onChange={setPlace}
          />
          <button type="button" className="report-lost__locate" onClick={locateMe}>
            <TargetIcon />
            Usar mi ubicación actual
          </button>
        </div>

        {!selectedPet && (
          <>
            <TextInputField label="Nombre" value={name} onChange={setName} />

            <div className="found__group">
              <span className="report-lost__label">Sexo</span>
              <ChipGroup options={SEX} value={sex} onChange={setSex} />
            </div>

            <div className="found__group">
              <span className="report-lost__label">Tamaño</span>
              <ChipGroup options={SIZES} value={size} onChange={setSize} variant="plain" />
            </div>

            <TextInputField label="Edad aproximada" value={age} onChange={setAge} />
          </>
        )}

        <label className="report-lost__field">
          <span className="report-lost__label">Características / Descripción</span>
          <textarea
            className="report-lost__textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {!selectedPet && (
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
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" className="report-lost__submit report-found__submit" disabled={!canSubmit}>
          {busy ? "Publicando..." : "Publicar mascota"}
        </button>

        <button type="button" className="report-lost__cancel" onClick={onBack}>
          Cancelar
        </button>
      </form>
    </>
  );
}

export default ReportAdoptionPage;