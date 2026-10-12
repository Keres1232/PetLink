import { useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import { myVetApplication } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import InfoNotice from "../shared/InfoNotice.jsx";
import ChipGroup from "../shared/ChipGroup.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import FileDrop from "../shared/FileDrop.jsx";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import vetIcon from "../../svg/Adopcion/Vet.svg";
import refugeIcon from "../../svg/Adopcion/Ref.svg";
import mailIcon from "../../svg/Verificacion/Correo.svg";
import idIcon from "../../svg/Verificacion/id.svg";
import degreeIcon from "../../svg/Verificacion/Titulo.svg";
import locationIcon from "../../svg/Location icon.svg";
import "../reports/ReportLostPage.css";
import "../reports/ReportFoundPage.css";
import "./VerificationPage.css";

// El solicitante dice si es persona o establecimiento; si es establecimiento, el admin decide si es Refugio o Veterinaria
const TYPES = [
  { id: "vet", label: "Médico veterinario", icon: vetIcon },
  { id: "establishment", label: "Establecimiento", icon: refugeIcon },
];

const icon = (src) => <img src={src} alt="" className="verification__field-icon" />;

function VerificationPage({ onBack, onNotifications, onSubmit }) {
  const [type, setType] = useState("vet");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [degree, setDegree] = useState("");
  const [address, setAddress] = useState("");
  const [specialty, setSpecialty] = useState("");
  // Establecimiento: se pide la dirección en vez del título (el médico veterinario no la necesita)
  const refuge = type === "establishment";
  // Documento de soporte (support_document_url) + documento de identidad (id_document_url)
  const [docFile, setDocFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Última solicitud del usuario: si hay una pendiente o aprobada no se muestra el formulario
  const [current, setCurrent] = useState(undefined);

  useEffect(() => {
    myVetApplication()
      .then(setCurrent)
      .catch(() => setCurrent(null));
  }, []);

  // Una solicitud aprobada solo bloquea si la cuenta SIGUE siendo profesional: si el admin
  // le devolvió el rol de miembro, puede volver a solicitar
  const { profile } = useAuth();
  const isProfessional = profile?.role === "vet" || profile?.role === "foundation";
  const blocked = current?.status === "pending" || (current?.status === "approved" && isProfessional);

  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    license.trim() !== "" &&
    (!refuge || address.trim() !== "") &&
    docFile &&
    idFile &&
    !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      if ([docFile, idFile].some((f) => f.size > 10 * 1024 * 1024))
        throw new Error("Cada documento puede pesar máximo 10 MB.");
      // vet_applications no tiene columna de dirección: igual que en web-development,
      // para refugios se guarda en `degree` y el admin la ve como "Dirección"
      await onSubmit?.({ type, name, email, license, degree: refuge ? address : degree, specialty, docFile, idFile });
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo enviar la solicitud. Intenta de nuevo.");
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Solicitar verificación"
        leftIcon={backIcon}
        onLeft={onBack}
        rightIcon={bellIcon}
        onRight={onNotifications}
      />

      {blocked && (
        <div className="report-lost">
          <InfoNotice>
            {current.status === "pending"
              ? `Tu solicitud está en revisión desde el ${new Date(current.created_at).toLocaleDateString("es-CO")}. Te avisaremos cuando un administrador la revise.`
              : "Tu solicitud fue aprobada: tu cuenta ya está verificada."}
          </InfoNotice>
          <button type="button" className="report-lost__cancel" onClick={onBack}>
            Volver
          </button>
        </div>
      )}

      {current !== undefined && !blocked && (
      <form className="report-lost" onSubmit={submit}>
        <InfoNotice>
          {current?.status === "rejected"
            ? "Tu solicitud anterior fue rechazada. Puedes enviar una nueva con otro documento."
            : refuge
              ? "Un administrador revisará tu solicitud y definirá si tu establecimiento es un refugio o una veterinaria. Al aprobarla aparecerás en el mapa."
              : "Verificamos cada solicitud. Una vez aprobada, tu cuenta mostrará la etiqueta correspondiente y la comunidad podrá identificarte."}
        </InfoNotice>

        <div className="found__group">
          <span className="report-lost__label">Tipo de solicitud</span>
          <ChipGroup options={TYPES} value={type} onChange={setType} variant="tray solid" />
        </div>

        <TextInputField label="Nombre" placeholder="Ej: Angel Gabriel Quintero" value={name} onChange={setName} />

        <IconInputField
          label="Correo de contacto"
          icon={icon(mailIcon)}
          type="email"
          placeholder="nombre@correo.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />

        <IconInputField
          label="Número de tarjeta profesional"
          icon={icon(idIcon)}
          placeholder="Ej: 0000"
          value={license}
          onChange={setLicense}
        />

        {refuge ? (
          <IconInputField
            label="Dirección"
            icon={icon(locationIcon)}
            placeholder="Ej: Cll 1 #2-3, Usaquén, Bogotá"
            autoComplete="street-address"
            value={address}
            onChange={setAddress}
          />
        ) : (
          <IconInputField
            label="Título y universidad"
            icon={icon(degreeIcon)}
            placeholder="Médico veterinario · Universidad"
            value={degree}
            onChange={setDegree}
          />
        )}

        <TextInputField
          label="Especialidad"
          optional
          placeholder="Ej: Cardiología"
          value={specialty}
          onChange={setSpecialty}
        />

        <FileDrop
          label={refuge ? "Registro del establecimiento" : "Tarjeta profesional"}
          file={docFile}
          onChange={setDocFile}
        />
        <FileDrop label="Documento de identidad" file={idFile} onChange={setIdFile} />

        <div className="verification__submit-card">
          <p className="verification__submit-text">Te avisaremos cuando revisemos tu solicitud</p>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="verification__submit" disabled={!canSubmit}>
            {busy ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>

        <button type="button" className="report-lost__cancel" onClick={onBack}>
          Cancelar
        </button>
      </form>
      )}
    </>
  );
}

export default VerificationPage;