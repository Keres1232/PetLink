import { useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import CityPickerModal from "../map/CityPickerModal.jsx";
import backIcon from "../../svg/Back.svg";
import correoIcon from "../../svg/Ajustes/correo electronico.svg";
import privacidadIcon from "../../svg/Ajustes/Privacidad.svg";
import ciudadIcon from "../../svg/Ajustes/ciudad por defecto.svg";
import "../reports/ReportLostPage.css";
import "./AccountSection.css";
import "./EditProfilePage.css";

const ChevronIcon = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" aria-hidden="true">
    <path d="M1 1L6 5.03448L1 10" stroke="#66557E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Editar información personal: nombre (profiles.name), ciudad y accesos a correo y contraseña. */
function EditProfilePage({ name: initialName = "", city, email, onBack, onSaveName, onSaveCity, onChangeEmail, onChangePassword }) {
  const [name, setName] = useState(initialName);
  const [cityOpen, setCityOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const changed = name.trim() !== initialName.trim();

  const saveName = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Escribe tu nombre (mínimo 2 letras).");
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await onSaveName?.(name.trim());
      setSaved("Nombre actualizado.");
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo guardar el nombre.");
    } finally {
      setBusy(false);
    }
  };

  const row = (icon, label, value, onClick) => (
    <button type="button" className="account__row" onClick={onClick}>
      <span className="account__row-left">
        <span className="account__icon-circle">
          <img src={icon} alt="" className="account__icon" />
        </span>
        <span className="account__text">
          <span className="account__label">{label}</span>
          {value && <span className="account__sublabel">{value}</span>}
        </span>
      </span>
      <span className="account__chevron">
        <ChevronIcon />
      </span>
    </button>
  );

  return (
    <>
      <AppHeader title="Información personal" leftIcon={backIcon} onLeft={onBack} />

      <form className="report-lost edit-profile" onSubmit={saveName}>
        <TextInputField label="Nombre" placeholder="Tu nombre" value={name} onChange={setName} />

        {error && <p className="auth-error" role="alert">{error}</p>}
        {saved && <p className="edit-profile__saved" role="status">{saved}</p>}

        <button type="submit" className="report-lost__submit" disabled={!changed || busy}>
          {busy ? "Guardando..." : "Guardar nombre"}
        </button>

        <div className="account__card edit-profile__card">
          {row(ciudadIcon, "Ciudad", city ?? "Sin definir", () => setCityOpen(true))}
          {row(correoIcon, "Correo electrónico", email, onChangeEmail)}
          {row(privacidadIcon, "Cambiar contraseña", null, onChangePassword)}
        </div>
      </form>

      <CityPickerModal
        open={cityOpen}
        value={city ?? ""}
        onClose={() => setCityOpen(false)}
        onSelect={(c) => {
          void onSaveCity?.(c);
          setSaved("Ciudad actualizada.");
        }}
      />
    </>
  );
}

export default EditProfilePage;
