import { useEffect, useState } from "react";
import { placeOfUser, updatePlaceKind } from "../../../lib/api";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import backIcon from "../../svg/Back.svg";
import vetIcon from "../../svg/Adopcion/Vet.svg";
import refugeIcon from "../../svg/Adopcion/Ref.svg";
import mailIcon from "../../svg/Verificacion/Correo.svg";
import idIcon from "../../svg/Verificacion/id.svg";
import degreeIcon from "../../svg/Verificacion/Titulo.svg";
import locationIcon from "../../svg/Location icon.svg";
import "./RequestCard.css";
import "./ReviewRequestPage.css";

const TYPE_LABEL = { vet: "VETERINARIA", doctor: "MÉDICO VET.", refuge: "REFUGIO" };
const STATUS_LABEL = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

const s = { stroke: "var(--titulos, #7519FF)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" {...s} /><path d="M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21" {...s} /></svg>
);
const img = (src) => <img src={src} alt="" className="review__field-icon" />;
const Chevron = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none"><path d="M1 1L6 5.03L1 10" stroke="#66557E" strokeWidth="2" strokeLinecap="round" /></svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 12.5L9.5 18L20 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);
const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 5L19 19M19 5L5 19" stroke="#a0403c" strokeWidth="2.2" strokeLinecap="round" /></svg>
);

// Etiqueta que el admin asigna a un refugio / veterinaria (tipo de lugar en el mapa)
const PLACE_KINDS = [
  { id: "shelter", label: "Refugio", icon: refugeIcon },
  { id: "clinic", label: "Veterinaria", icon: vetIcon },
];

function ReviewRequestPage({ request, onBack, onAccept, onReject, onPlace, onOpenDocument }) {
  const [kind, setKind] = useState("shelter");
  const [address, setAddress] = useState(request?.address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Lugar en el mapa de quien envió la solicitud (undefined = consultando)
  const [place, setPlace] = useState(undefined);

  const approvedRefuge = request?.type === "refuge" && request?.status === "approved";
  useEffect(() => {
    if (!approvedRefuge) return;
    placeOfUser(request.userId)
      .then(setPlace)
      .catch(() => setPlace(null));
  }, [approvedRefuge, request?.userId]);

  if (!request) return null;

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      console.error("No se pudo guardar la decisión", e);
      setError(e?.message || "No se pudo guardar la decisión. Intenta de nuevo.");
      setBusy(false);
    }
  };

  const { type, status, name, location, fields = {}, documents = [], photoUrl } = request;
  const decided = status !== "pending";
  const refuge = type === "refuge";
  const legacy = !Object.values(fields).some(Boolean);
  // TYPE_LABEL: vet = VETERINARIA, refuge = REFUGIO, doctor = MÉDICO VET.
  const badgeType = place?.kind === "clinic" ? "vet" : place?.kind === "shelter" ? "refuge" : type;

  const rows = [
    { label: "Tipo de solicitud", value: refuge ? "Refugio / Veterinaria" : "Médico veterinario", icon: img(refuge ? refugeIcon : vetIcon) },
    { label: "Nombre", value: fields.fullName, icon: <UserIcon /> },
    { label: "Correo de contacto", value: fields.email, icon: img(mailIcon) },
    { label: "Número de tarjeta profesional", value: fields.license, icon: img(idIcon) },
    // Para refugios este campo guarda la dirección (mismo criterio que web-development)
    refuge
      ? { label: "Dirección", value: fields.degree, icon: img(locationIcon) }
      : { label: "Título y universidad", value: fields.degree, icon: img(degreeIcon) },
    { label: "Especialidad", value: fields.specialty, icon: img(degreeIcon) },
  ];

  return (
    <>
      <AppHeader title="Revisar solicitud" leftIcon={backIcon} onLeft={onBack} />

      <div className="review">
        {/* Resumen */}
        <article className="review__summary">
          <div className="request-card__photo review__photo">{photoUrl && <img src={photoUrl} alt="" />}</div>

          <div className="request-card__info">
            <div className="request-card__row">
              {/* Si ya está en el mapa, se muestra la etiqueta que eligió el admin */}
              <span className={`request-card__type request-card__type--${badgeType}`}>{TYPE_LABEL[badgeType]}</span>
              <span className={`request-card__status request-card__status--${status}`}>{STATUS_LABEL[status]}</span>
            </div>
            <h2 className="review__name">{name}</h2>
            <p className="request-card__location">{location}</p>
          </div>
        </article>

        {/* Datos del formulario: mismos campos e íconos que "Solicitar verificación" */}
        <h3 className="review__title">Datos de la solicitud</h3>
        {legacy && (
          <InfoNotice>
            Esta solicitud se envió con una versión anterior de la app y solo trae el documento adjunto.
          </InfoNotice>
        )}
        <div className="review__card">
          {rows.map((row) => (
            <div key={row.label} className="review__contact">
              <span className="review__circle">{row.icon}</span>
              <span className="review__contact-text">
                <span className="review__small">{row.label}</span>
                <span className="review__value">{row.value || "—"}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Documentos */}
        <h3 className="review__title">Documentos adjuntos</h3>
        <div className="review__card">
          {documents.length === 0 && <p className="review__empty">Sin documentos.</p>}
          {documents.map((d) => (
            <button key={d.id} type="button" className="review__doc" onClick={() => onOpenDocument?.(d)}>
              <span className="review__pdf">PDF</span>
              <span className="review__doc-name">{d.name}</span>
              <Chevron />
            </button>
          ))}
        </div>

        {/* Refugio / veterinaria: el admin elige la etiqueta y confirma la dirección para el mapa */}
        {approvedRefuge && place && (
          <>
            <h3 className="review__title">Etiqueta y ubicación en el mapa</h3>
            <div className="review__card review__place">
              {/* El admin puede cambiar la etiqueta también después de aprobar */}
              <span className="review__small">Etiqueta asignada</span>
              <ChipGroup
                options={PLACE_KINDS}
                value={place.kind}
                onChange={(next) =>
                  next !== place.kind &&
                  void run(async () => {
                    await updatePlaceKind(place.id, next);
                    setPlace({ ...place, kind: next });
                    setBusy(false);
                  })
                }
                variant="tray solid"
              />
              <p className="review__place-hint">
                Aparece en el mapa como <strong>{place.kind === "clinic" ? "Veterinaria" : "Refugio"}</strong>
                {place.address ? ` en ${place.address}` : ""}
                {place.verified ? "." : " (pendiente de verificar en «Clínicas y refugios por verificar»)."}
              </p>
              {error && <p className="auth-error" role="alert">{error}</p>}
            </div>
          </>
        )}

        {/* Pendiente: se elige al aprobar. Aprobada sin lugar (p. ej. aprobada con una versión anterior): se puede ubicar ahora */}
        {refuge && (!decided || (approvedRefuge && place === null)) && (
          <>
            <h3 className="review__title">Etiqueta y ubicación en el mapa</h3>
            {decided && (
              <InfoNotice>Esta solicitud ya fue aprobada pero todavía no está en el mapa.</InfoNotice>
            )}
            <div className="review__card review__place">
              <span className="review__small">¿Qué etiqueta se le asigna?</span>
              <ChipGroup options={PLACE_KINDS} value={kind} onChange={setKind} variant="tray solid" />
              <IconInputField
                label="Dirección en el mapa"
                icon={img(locationIcon)}
                placeholder="Ej: Cll 1 #2-3, Usaquén, Bogotá"
                value={address}
                onChange={setAddress}
              />
              <p className="review__place-hint">
                {decided ? "Al ubicarla" : "Al aceptar"}, aparecerá en el mapa como{" "}
                {kind === "clinic" ? "veterinaria" : "refugio"} en esta dirección.
              </p>
              {decided && (
                <>
                  {error && <p className="auth-error" role="alert">{error}</p>}
                  <button
                    type="button"
                    className="review__accept"
                    disabled={busy || address.trim().length < 5}
                    onClick={() => void run(() => onPlace?.(request, { kind, address }))}
                  >
                    <CheckIcon /> {busy ? "Guardando..." : "Ubicar en el mapa"}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Decisión */}
        <div className="review__decision">
          <p className="review__decision-text">
            {decided ? "Esta solicitud ya fue revisada" : "Se le notificará al solicitante tu decisión"}
          </p>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="review__buttons">
            <button
              type="button"
              className="review__reject"
              disabled={decided || busy}
              onClick={() => void run(() => onReject?.(request))}
            >
              <CrossIcon /> Rechazar
            </button>
            <button
              type="button"
              className="review__accept"
              disabled={decided || busy || (refuge && address.trim().length < 5)}
              onClick={() => void run(() => onAccept?.(request, refuge ? { kind, address } : null))}
            >
              <CheckIcon /> {busy ? "Guardando..." : "Aceptar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReviewRequestPage;