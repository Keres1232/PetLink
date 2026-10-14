import { useEffect, useState } from "react";
import { placeOfUser } from "../../../lib/api";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import backIcon from "../../svg/Back.svg";
import vetIcon from "../../svg/Adopcion/Vet.svg";
import refugeIcon from "../../svg/Adopcion/Ref.svg";
import mailIcon from "../../svg/Verificacion/Correo.svg";
import idIcon from "../../svg/Verificacion/id.svg";
import degreeIcon from "../../svg/Verificacion/Titulo.svg";
import locationIcon from "../../svg/Location icon.svg";
import "./RequestCard.css";
import "./ReviewRequestPage.css";

const TYPE_LABEL = { vet: "VETERINARIA", doctor: "MÉDICO VET.", refuge: "REFUGIO", establishment: "POR CLASIFICAR" };
const TYPE_TEXT = {
  doctor: "Médico veterinario",
  vet: "Veterinaria",
  refuge: "Refugio",
  establishment: "Establecimiento (elige abajo si es refugio o veterinaria)",
};
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

function ReviewRequestPage({ request, onBack, onAccept, onReject, onChangeKind, onOpenDocument }) {
  // El admin elige UNA etiqueta: Refugio o Veterinaria (sin preselección, para que decida a conciencia)
  const [kind, setKind] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Lugar en el mapa de quien envió la solicitud (undefined = consultando)
  const [place, setPlace] = useState(undefined);

  const approvedEstablishment = Boolean(request?.establishment) && request?.status === "approved";
  useEffect(() => {
    if (!approvedEstablishment) return;
    placeOfUser(request.userId)
      .then(setPlace)
      .catch(() => setPlace(null));
  }, [approvedEstablishment, request?.userId]);

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
  const establishment = Boolean(request.establishment);
  const legacy = !Object.values(fields).some(Boolean);
  // Si ya está en el mapa, manda la etiqueta que eligió el admin
  const badgeType = place?.kind === "clinic" ? "vet" : place?.kind === "shelter" ? "refuge" : type;

  const rows = [
    {
      label: "Tipo de solicitud",
      value: TYPE_TEXT[badgeType],
      icon: img(badgeType === "refuge" || badgeType === "establishment" ? refugeIcon : vetIcon),
    },
    { label: "Nombre", value: fields.fullName, icon: <UserIcon /> },
    { label: "Correo de contacto", value: fields.email, icon: img(mailIcon) },
    { label: "Número de tarjeta profesional", value: fields.license, icon: img(idIcon) },
    // En los establecimientos este campo guarda la dirección (mismo criterio que web-development)
    establishment
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

        {/* Establecimiento aprobado y en el mapa: el admin puede cambiar Refugio ↔ Veterinaria */}
        {approvedEstablishment && place && (
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
                    // Cambia el lugar del mapa, el rol de la cuenta y la solicitud (una etiqueta u otra)
                    await onChangeKind?.(request, place, next);
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

        {/* Pendiente: el admin elige Veterinaria o Refugio (define el rol). El lugar lo crea el
            establecimiento después, como en web-development */}
        {establishment && !decided && (
          <>
            <h3 className="review__title">Etiqueta de la cuenta</h3>
            <div className="review__card review__place">
              <span className="review__small">¿Es un refugio o una veterinaria? Elige una</span>
              <ChipGroup options={PLACE_KINDS} value={kind} onChange={setKind} variant="tray solid" />
              <p className="review__place-hint">
                {kind
                  ? `Al aceptar, la cuenta quedará como ${kind === "clinic" ? "veterinaria" : "refugio"}. Luego marcará su lugar en «Mi ${
                      kind === "clinic" ? "veterinaria" : "refugio"
                    }» y lo verificarás en Moderación → Clínicas para que salga en el mapa.`
                  : "Elige la etiqueta para poder aceptar."}
              </p>
            </div>
          </>
        )}

        {/* Aprobada pero todavía sin lugar: lo crea el propio establecimiento */}
        {approvedEstablishment && place === null && (
          <InfoNotice>
            Esta cuenta ya está aprobada pero todavía no ha marcado su lugar. Lo hará desde Perfil → «Mi veterinaria» o
            «Mi refugio», y te aparecerá en Moderación → Clínicas para verificarlo.
          </InfoNotice>
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
              disabled={decided || busy || (establishment && !kind)}
              onClick={() => void run(() => onAccept?.(request, establishment ? { kind } : null))}
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