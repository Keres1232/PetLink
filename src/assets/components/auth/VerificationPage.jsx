import { useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import { myVetApplication } from "../../../lib/api";
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
import "../reports/ReportLostPage.css";
import "../reports/ReportFoundPage.css";
import "./VerificationPage.css";

const TYPES = [
  { id: "vet", label: "Médico veterinario", icon: vetIcon },
  { id: "refuge", label: "Refugio/ Veterinaria", icon: refugeIcon },
];

const icon = (src) => <img src={src} alt="" className="verification__field-icon" />;

function VerificationPage({ onBack, onNotifications, onSubmit }) {
  const [type, setType] = useState("vet");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState("");
  const [degree, setDegree] = useState("");
  const [specialty, setSpecialty] = useState("");
  // La base de datos guarda un solo documento de soporte por solicitud
  const [docFile, setDocFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Última solicitud del usuario: si hay una pendiente o aprobada no se muestra el formulario
  const [current, setCurrent] = useState(undefined);

  useEffect(() => {
    myVetApplication()
      .then(setCurrent)
      .catch(() => setCurrent(null));
  }, []);

  const blocked = current?.status === "pending" || current?.status === "approved";

  const canSubmit =
    name.trim() !== "" && email.trim() !== "" && license.trim() !== "" && docFile && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      if (docFile.size > 10 * 1024 * 1024) throw new Error("El documento no puede superar los 10 MB.");
      await onSubmit?.({ type, name, email, license, degree, specialty, docFile });
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

        <IconInputField
          label="Título y universidad"
          icon={icon(degreeIcon)}
          placeholder="Médico veterinario · Universidad"
          value={degree}
          onChange={setDegree}
        />

        <TextInputField
          label="Especialidad"
          optional
          placeholder="Ej: Cardiología"
          value={specialty}
          onChange={setSpecialty}
        />

        <FileDrop
          label={type === "refuge" ? "Registro del refugio o veterinaria" : "Tarjeta profesional"}
          file={docFile}
          onChange={setDocFile}
        />

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