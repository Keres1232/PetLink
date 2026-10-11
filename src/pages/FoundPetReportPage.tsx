import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import LocationField from "../components/report/LocationField";
import PhotoGridField from "../components/report/PhotoGridField";
import PetCard from "../components/PetCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import ConfirmModal from "../components/ui/ConfirmModal";
import PhotoPickerModal from "../components/ui/PhotoPickerModal";
import { LoadingState } from "../components/ui/States";
import { useUserLocation } from "../hooks/useUserLocation";
import {
  createAlert,
  createReportMatch,
  getPostByReportId,
  listSpecies,
  reportsNear,
  uploadPhotos,
} from "../lib/api";
import { approximatePoint } from "../lib/geo";
import { dayLabel } from "../lib/format";
import { searchPlace } from "../lib/geocode";
import { usePrefs } from "../hooks/usePrefs";
import type { GeoPoint, PetSex, PetSize, ReportNear, Species } from "../lib/types";
import "../components/report/report.css";

const MAX_EXTRA_PHOTOS = 3;

const SEX_OPTIONS: { value: PetSex; label: string }[] = [
  { value: "male", label: "Macho" },
  { value: "female", label: "Hembra" },
  { value: "unknown", label: "No sé" },
];

const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: "small", label: "Pequeño" },
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
];

export default function FoundPetReportPage() {
  const navigate = useNavigate();
  const { point: userPoint, radius, loading: locLoading } = useUserLocation();
  const { prefs } = usePrefs();

  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [size, setSize] = useState<PetSize | null>(null);
  const [ageEstimate, setAgeEstimate] = useState("");
  const [breed, setBreed] = useState("");
  const [characteristics, setCharacteristics] = useState("");

  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [mainPickerOpen, setMainPickerOpen] = useState(false);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);

  const [placeText, setPlaceText] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Paso previo: alertas de mascotas perdidas cerca para hacer match directo
  const [step, setStep] = useState<"select" | "form">("select");
  const [nearLost, setNearLost] = useState<ReportNear[]>([]);
  const [loadingNear, setLoadingNear] = useState(true);
  const [selected, setSelected] = useState<ReportNear | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [matchContact, setMatchContact] = useState("");
  const [matchBusy, setMatchBusy] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchSent, setMatchSent] = useState(false);

  useEffect(() => {
    void listSpecies()
      .then(setSpecies)
      .catch(() => setSpecies([]));
  }, []);

  useEffect(() => {
    if (locLoading) return;
    let active = true;
    void (async () => {
      try {
        const near = await reportsNear(userPoint, radius, 30);
        if (active) setNearLost(near.filter((r) => r.type === "lost"));
      } catch {
        if (active) setNearLost([]);
      } finally {
        if (active) setLoadingNear(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [locLoading, userPoint, radius]);

  useEffect(() => {
    if (!loadingNear && nearLost.length === 0) setStep("form");
  }, [loadingNear, nearLost]);

  useEffect(() => {
    if (!locLoading && !point && userPoint) setPoint(userPoint);
  }, [locLoading, point, userPoint]);

  const speciesOptions = species.map((s) => ({ value: s.id, label: s.name }));

  async function sendMatch() {
    if (!selected || matchBusy) return;
    setMatchBusy(true);
    setMatchError(null);
    try {
      await createReportMatch({
        reportId: selected.id,
        message: matchMessage,
        contact: matchContact,
      });
      setMatchSent(true);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      if (message.includes("duplicate")) {
        setMatchError("Ya avisaste al dueño sobre esta mascota.");
      } else if (message.includes("muchas coincidencias")) {
        setMatchError("Este reporte ya tiene muchas coincidencias recientes.");
      } else {
        setMatchError("No pudimos enviar tu aviso. Intenta de nuevo.");
      }
    } finally {
      setMatchBusy(false);
    }
  }

  async function submit() {
    if (busyRef.current) return;
    setError(null);
    let finalPoint = point;
    if (!finalPoint && placeText.trim()) {
      finalPoint = await searchPlace(placeText);
    }
    if (!finalPoint) {
      setError("Indica el lugar dónde lo encontraste (o usa tu ubicación actual).");
      return;
    }
    if (characteristics.trim().length < 5) {
      setError("Describe cómo es la mascota que encontraste.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    try {
      const files = mainPhoto ? [mainPhoto, ...extraPhotos] : extraPhotos;
      const photoUrls = files.length ? await uploadPhotos(files, "pet-photos") : [];
      const description = [placeText.trim(), characteristics.trim()]
        .filter(Boolean)
        .join(" · ");

      const reportId = await createAlert({
        petId: null,
        type: "found",
        description,
        point: prefs.exactLocation ? finalPoint : approximatePoint(finalPoint),
        speciesId,
        sex,
        breed: breed.trim() || null,
        size,
        ageEstimate: ageEstimate.trim() || null,
        photos: photoUrls,
      });
      const post = await getPostByReportId(reportId).catch(() => null);
      navigate(post ? `/comunidad?post=${post.id}` : "/mapa");
    } catch (err) {
      console.error("createAlert (found) falló:", err);
      setError("No pudimos publicar la alerta. Intenta de nuevo.");
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
        <h1 className="pc-title">Encontré mascota</h1>
        <span style={{ width: 42 }} />
      </div>

      {step === "select" && (
        <div className="match-select">
          <h2 className="pc-section-title">¿Es alguna de estas mascotas perdidas?</h2>
          <p className="pc-muted match-select__hint">
            Revisa las alertas activas cerca de ti. Si reconoces a la mascota que
            encontraste, avisa al dueño sin crear una publicación nueva.
          </p>

          {loadingNear && <LoadingState label="Buscando alertas cerca…" />}

          {!loadingNear && (
            <>
              <div className="pc-cards-grid">
                {nearLost.map((r) => (
                  <PetCard
                    key={r.id}
                    status="Perdido"
                    name={r.pet_name ?? r.species_name ?? "Mascota"}
                    location={`${r.description || "Cerca de ti"} · ${dayLabel(r.created_at).toLowerCase()}`}
                    photoUrl={r.pet_photo_url ?? undefined}
                    onClick={() => {
                      setSelected(r);
                      setMatchMessage("");
                      setMatchContact("");
                      setMatchSent(false);
                      setMatchError(null);
                    }}
                  />
                ))}
              </div>

              <div className="match-select__actions">
                <button type="button" className="pc-outline-btn" onClick={() => setStep("form")}>
                  No es ninguna — publicar alerta de mascota encontrada
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "form" && (
      <div className="pc-form-card">
        <div className="pc-field">
          <span className="pc-field-label">Agrega una foto clara de la mascota</span>
          <div className="found-main-photo">
            {mainPhoto ? (
              <button
                type="button"
                className="found-main-photo__preview"
                onClick={() => setMainPickerOpen(true)}
              >
                <img src={URL.createObjectURL(mainPhoto)} alt="Foto principal" />
              </button>
            ) : (
              <button
                type="button"
                className="found-main-photo__empty"
                onClick={() => setMainPickerOpen(true)}
              >
                <Camera size={26} />
                <span>Agregar foto</span>
              </button>
            )}
          </div>
          <PhotoPickerModal
            open={mainPickerOpen}
            onClose={() => setMainPickerOpen(false)}
            onPick={setMainPhoto}
          />
        </div>

        <LocationField
          label="Lugar dónde lo encontraste"
          placeholder="Ej: Parque de Usaquén"
          text={placeText}
          onTextChange={setPlaceText}
          point={point}
          onPointChange={setPoint}
        />

        <div className="pc-field">
          <span className="pc-field-label">Especie</span>
          <ChipGroup
            options={speciesOptions}
            value={speciesId}
            onChange={setSpeciesId}
            label="Especie"
          />
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
          <label className="pc-field-label" htmlFor="found-age">
            Edad aproximada
          </label>
          <input
            id="found-age"
            className="pc-input"
            placeholder="Ej: 2 años"
            value={ageEstimate}
            onChange={(e) => setAgeEstimate(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="found-breed">
            Raza
          </label>
          <input
            id="found-breed"
            className="pc-input"
            placeholder="Ej: Criollo"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="found-desc">
            Características / Descripción
          </label>
          <textarea
            id="found-desc"
            className="pc-textarea"
            placeholder="Color, collar, señas particulares, comportamiento…"
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
          />
        </div>

        <PhotoGridField
          label="Fotos adicionales"
          max={MAX_EXTRA_PHOTOS}
          photos={extraPhotos}
          onAdd={(file) => setExtraPhotos((prev) => [...prev, file].slice(0, MAX_EXTRA_PHOTOS))}
          onRemove={(i) => setExtraPhotos((prev) => prev.filter((_, idx) => idx !== i))}
        />

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

        <div className="pc-form-actions" style={{ display: "flex", gap: 10 }}>
          <PrimaryButton onClick={() => void submit()} type="button" disabled={busy}>
            {busy ? "Publicando…" : "Publicar alerta"}
          </PrimaryButton>
          <button type="button" className="pc-outline-btn" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </div>
      )}

      {selected && (
        <ConfirmModal
          title={
            matchSent
              ? "Aviso enviado"
              : `¿Encontraste a ${selected.pet_name ?? "esta mascota"}?`
          }
          confirmLabel={matchSent ? "Entendido" : matchBusy ? "Enviando…" : "Avisar al dueño"}
          onClose={() => {
            setSelected(null);
            if (matchSent) navigate("/");
          }}
          onConfirm={() => {
            if (matchSent) {
              setSelected(null);
              navigate("/");
              return;
            }
            void sendMatch();
          }}
        >
          {matchSent ? (
            <>
              <p>
                Avisamos al dueño de la alerta. La alerta sigue activa hasta que el dueño
                confirme que la recuperó.
              </p>
              <p>Si dejaste un contacto, el dueño podrá usarlo para comunicarse contigo.</p>
            </>
          ) : (
            <>
              <div className="pc-field">
                <label className="pc-field-label" htmlFor="match-message">
                  ¿Dónde y cómo la encontraste? (opcional)
                </label>
                <textarea
                  id="match-message"
                  className="pc-textarea"
                  placeholder="Ej: La encontré en el parque, lleva collar rojo…"
                  value={matchMessage}
                  onChange={(e) => setMatchMessage(e.target.value)}
                />
              </div>
              <div className="pc-field">
                <label className="pc-field-label" htmlFor="match-contact">
                  Tu contacto (opcional, solo lo ve el dueño)
                </label>
                <input
                  id="match-contact"
                  className="pc-input"
                  placeholder="Teléfono o correo"
                  value={matchContact}
                  onChange={(e) => setMatchContact(e.target.value)}
                />
              </div>
              {matchError && (
                <p className="pc-error-text" role="alert">
                  {matchError}
                </p>
              )}
            </>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
