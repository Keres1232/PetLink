import { useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import PetPicker from "../pets/PetPicker.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import PlaceField from "../shared/PlaceField.jsx";
import PhotoCropModal from "../shared/PhotoCropModal.jsx";
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

function ReportLostPage({ city = "Bogotá", pets = [], onBack, onNotifications, onNotListed, onSubmit }) {
  const [petId, setPetId] = useState(pets[0]?.id ?? null);
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState(null);
  const [traits, setTraits] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedPet = pets.find((p) => p.id === petId);
  const canSubmit = Boolean(selectedPet) && place.trim() !== "" && !busy;

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
      await onSubmit?.({ petId, date, time, place, point: coords, traits, photoFiles });
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
        <PetPicker pets={pets} value={petId} onChange={setPetId} onNotListed={onNotListed} />

        {/* Sin mascota elegida no se publica: la alerta saldría sin foto ni datos */}
        {!selectedPet && (
          <div className="report-lost__enroll">
            <p>
              {pets.length
                ? "Elige cuál de tus mascotas se perdió. Si no está en la lista, inscríbela primero: así la alerta sale con su foto y sus datos."
                : "Para publicar la alerta, primero inscribe a tu mascota con su foto y sus datos. Luego volverás aquí para terminar el reporte."}
            </p>
            <button type="button" className="report-lost__enroll-btn" onClick={onNotListed}>
              Inscribir mi mascota ›
            </button>
          </div>
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
            {selectedPet?.photoUrl
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