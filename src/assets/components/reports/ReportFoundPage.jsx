import { useEffect, useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import PhotoPickerModal from "../shared/PhotoPickerModal.jsx";
import PhotoCropModal from "../shared/PhotoCropModal.jsx";
import AvatarPlaceholder from "../pets/AvatarPlaceholder.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import editIcon from "../../svg/edit_icono.svg";
import SpeciesPicker from "../shared/SpeciesPicker.jsx";
import { defaultSpeciesId } from "../../../lib/species";
import PlaceField from "../shared/PlaceField.jsx";
import { myReports, newestFirst, reportsNear } from "../../../lib/api";
import { reportToPet } from "../../../lib/reportPet";
import { useUserLocation } from "../../../hooks/useUserLocation";
import InfoNotice from "../shared/InfoNotice.jsx";
import PetCard from "../pets/PetCard.jsx";
import MatchSheet from "./MatchSheet.jsx";
import "./ReportLostPage.css";
import "./ReportFoundPage.css";
import PawLoader from "../shared/PawLoader.jsx";


const PlusIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#ffffff" />
    <path d="M12 7V17M7 12H17" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SEX = ["Macho", "Hembra", "No sé"];
const SIZES = ["Pequeño", "Mediano", "Grande"];
const MAX_PHOTOS = 3;

function ReportFoundPage({ city = "Bogotá", species = [], onBack, onNotifications, onSubmit }) {
  // Mascotas perdidas cerca (hasta 20 km, igual que el mapa) para el paso previo
  const { point: userPoint, radius, loading: locLoading } = useUserLocation();
  const [step, setStep] = useState("select");
  const [lostNearby, setLostNearby] = useState(null); // null = cargando
  const [matchTarget, setMatchTarget] = useState(null);
  const matchSent = useRef(false);

  useEffect(() => {
    if (locLoading) return;
    let alive = true;
    // Sin tus propias alertas: no te puedes avisar a ti mismo
    Promise.all([reportsNear(userPoint, Math.max(radius, 20000), 40), myReports().catch(() => [])])
      .then(([rows, mine]) => {
        if (!alive) return;
        const mineIds = new Set(mine.map((r) => r.id));
        setLostNearby(newestFirst(rows.filter((r) => r.type === "lost" && !mineIds.has(r.id))).map(reportToPet));
      })
      .catch(() => alive && setLostNearby([]));
    return () => {
      alive = false;
    };
  }, [locLoading, userPoint, radius]);

  const [mainPhoto, setMainPhoto] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null); // foto elegida, esperando que el usuario la ajuste
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

  const currentSpecies = speciesId || defaultSpeciesId(species);
  const canSubmit = place.trim() !== "" && !busy;

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file && photos.length < MAX_PHOTOS) {
      setPhotos((p) => [...p, URL.createObjectURL(file)]);
      setPhotoFiles((f) => [...f, file]);
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
      busyRef.current = false; // solo se libera si falló
      setError(err?.message || "No se pudo publicar la alerta. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  // Paso previo: ¿es alguna de las mascotas perdidas cerca? (como web-development).
  // Si la reconoce, le avisa al dueño en privado sin crear una alerta nueva.
  const showSelect = step === "select" && (lostNearby === null || lostNearby.length > 0);

  // Al pasar de la lista de perdidas al formulario (el botón está al final de la lista), empezar arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showSelect]);

  if (showSelect) {
    return (
      <>
        <AppHeader title="Encontré mascota" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

        <div className="report-lost found-match">
          <InfoNotice>
            ¿Es alguna de estas mascotas perdidas? Si la reconoces, avísale a su dueño en privado. Si no, publica una
            alerta de mascota encontrada.
          </InfoNotice>

          {lostNearby === null && <PawLoader label="Buscando mascotas perdidas cerca…" />}

          {lostNearby?.length > 0 && (
            <div className="found-match__grid">
              {lostNearby.map((p) => (
                <PetCard
                  key={p.id}
                  status="Perdido"
                  name={p.name}
                  location={p.location}
                  photoUrl={p.photoUrl}
                  onClick={() => setMatchTarget({ id: p.id, name: p.name, photoUrl: p.photoUrl, lost: true })}
                />
              ))}
            </div>
          )}

          <button type="button" className="report-lost__submit report-found__submit" onClick={() => setStep("form")}>
            No es ninguna — publicar mascota encontrada
          </button>
          <button type="button" className="report-lost__cancel" onClick={onBack}>
            Cancelar
          </button>
        </div>

        <MatchSheet
          city={city}
          key={matchTarget?.id ?? "none"}
          report={matchTarget}
          onSent={() => (matchSent.current = true)}
          onClose={() => {
            setMatchTarget(null);
            if (matchSent.current) onBack?.(); // aviso enviado: no hace falta publicar otra alerta
          }}
        />
      </>
    );
  }

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
          {species.length > 0 ? (
            <SpeciesPicker species={species} value={currentSpecies} onChange={setSpeciesId} />
          ) : (
            <p className="auth-error">No hay especies disponibles.</p>
          )}
        </div>

        {/* Dirección ⇄ mini mapa (con botón para centrar en donde estás) */}
        <PlaceField
          label="Lugar dónde lo encontraste"
          placeholder="Ej: Parque de Usaquén"
          value={place}
          onChange={setPlace}
          point={coords}
          onPointChange={setCoords}
          city={city}
        />

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
        onFile={setCropFile}
      />

      {/* Elegir qué parte de la foto se ve en la tarjeta y en la ficha expandida */}
      <PhotoCropModal
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={(file) => {
          setCropFile(null);
          setMainFile(file);
          setMainPhoto(URL.createObjectURL(file));
        }}
      />
    </>
  );
}

export default ReportFoundPage;