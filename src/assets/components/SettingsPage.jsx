import { useState } from "react";
import CircleIconButton from "./CircleIconButton.jsx";
import ToggleSwitch from "./ToggleSwitch.jsx";
import backIcon from "../svg/Back.svg";
import bellIcon from "../svg/bell.svg";

import correoIcon from "../svg/Ajustes/correo electronico.svg";
import ayudaIcon from "../svg/Ajustes/Ayuda y soporte.svg";
import notificacionIcon from "../svg/Ajustes/notificacion.svg";
import respuestaIcon from "../svg/Ajustes/respuesta en mi publicacion.svg";
import ajusReportIcon from "../svg/Ajustes/Ajus_Report.svg";
import privacidadIcon from "../svg/Ajustes/Privacidad.svg";
import ciudadIcon from "../svg/Ajustes/ciudad por defecto.svg";
import ubicacionExtraIcon from "../svg/Ajustes/ubicacion extra.svg";
import reportProblemIcon from "../svg/Ajustes/Report_ploblem.svg";
import termsPrivIcon from "../svg/Ajustes/Terms_Priv.svg";
import desCuentaIcon from "../svg/Ajustes/Des_cuenta.svg";
import eliminarIcon from "../svg/Ajustes/Eliminar.svg";

import "./SettingsPage.css";

/* ===== Íconos que aún no tienen SVG exportado ===== */

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--titulos, #7519FF)" strokeWidth="2" />
    <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="var(--titulos, #7519FF)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const InfoCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="var(--titulos, #7519FF)" strokeWidth="2" />
    <path d="M12 11V16" stroke="var(--titulos, #7519FF)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1" fill="var(--titulos, #7519FF)" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="8" height="14" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 5.03448L1 10" stroke="#66557E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ===== Fila reutilizable ===== */

function SettingsRow({ icon, label, sublabel, value, danger, right, onClick }) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      className={`settings-row ${danger ? "settings-row--danger" : ""}`}
      onClick={onClick}
    >
      <span className="settings-row__left">
        <span className={`settings-row__icon ${danger ? "settings-row__icon--danger" : ""}`}>
          {typeof icon === "string" ? (
            <img src={icon} alt="" className="settings-row__icon-img" />
          ) : (
            icon
          )}
        </span>

        <span className="settings-row__text">
          <span className="settings-row__label">{label}</span>
          {sublabel && <span className="settings-row__sublabel">{sublabel}</span>}
        </span>
      </span>

      <span className="settings-row__right">
        {value && <span className="settings-row__value">{value}</span>}
        {right ?? (onClick && <ChevronIcon />)}
      </span>
    </Wrapper>
  );
}

const DISTANCES = ["500 m", "1 Km", "3 Km", "5 Km"];

function SettingsPage({ onBack, onNotifications }) {
  const [petAlerts, setPetAlerts] = useState(true);
  const [distance, setDistance] = useState("1 Km");
  const [postReplies, setPostReplies] = useState(true);
  const [reportUpdates, setReportUpdates] = useState(true);
  const [exactLocation, setExactLocation] = useState(true);

  return (
    <>
      <header className="page-header">
        <CircleIconButton icon={backIcon} iconAlt="Volver" ariaLabel="Volver" onClick={onBack} />
        <h1 className="page-header__title">Ajustes</h1>
        <CircleIconButton icon={bellIcon} iconAlt="Notificaciones" ariaLabel="Notificaciones" onClick={onNotifications} />
      </header>

      {/* ===== Cuenta ===== */}
      <section className="settings-section">
        <h2 className="settings-section__title">Cuenta</h2>
        <div className="settings-card">
          <SettingsRow icon={correoIcon} label="Correo electrónico" onClick={() => console.log("Correo")} />
          <SettingsRow icon={<LockIcon />} label="Cambiar contraseña" onClick={() => console.log("Contraseña")} />
          <SettingsRow icon={ayudaIcon} label="Ayuda y soporte" onClick={() => console.log("Ayuda")} />
        </div>
      </section>

      {/* ===== Notificaciones ===== */}
      <section className="settings-section">
        <h2 className="settings-section__title">Notificaciones</h2>
        <div className="settings-card">
          <SettingsRow
            icon={notificacionIcon}
            label="Alerta de mascotas cerca"
            right={<ToggleSwitch checked={petAlerts} onChange={setPetAlerts} ariaLabel="Alerta de mascotas cerca" />}
          />

          {petAlerts && (
            <div className="settings-row settings-row--chips">
              <div className="distance-chips">
                {DISTANCES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`distance-chips__chip ${distance === d ? "is-active" : ""}`}
                    onClick={() => setDistance(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SettingsRow
            icon={respuestaIcon}
            label="Respuestas en mis publicaciones"
            right={<ToggleSwitch checked={postReplies} onChange={setPostReplies} ariaLabel="Respuestas en mis publicaciones" />}
          />

          <SettingsRow
            icon={ajusReportIcon}
            label="Actualizaciones de mis reportes"
            right={<ToggleSwitch checked={reportUpdates} onChange={setReportUpdates} ariaLabel="Actualizaciones de mis reportes" />}
          />
        </div>
      </section>

      {/* ===== Privacidad ===== */}
      <section className="settings-section">
        <h2 className="settings-section__title">Privacidad</h2>
        <div className="settings-card">
          <SettingsRow
            icon={privacidadIcon}
            label="Quién ve mi perfil"
            value="Comunidad"
            onClick={() => console.log("Quién ve mi perfil")}
          />
          <SettingsRow
            icon={ciudadIcon}
            label="Ciudad por defecto"
            value="Bogotá"
            onClick={() => console.log("Ciudad por defecto")}
          />
          <SettingsRow
            icon={ubicacionExtraIcon}
            label="Ubicación exacta"
            sublabel="Si no, se muestra la zona aproximada"
            right={<ToggleSwitch checked={exactLocation} onChange={setExactLocation} ariaLabel="Ubicación exacta" />}
          />
        </div>
      </section>

      {/* ===== Soporte y legal ===== */}
      <section className="settings-section">
        <h2 className="settings-section__title">Soporte y legal</h2>
        <div className="settings-card">
          <SettingsRow icon={reportProblemIcon} label="Reportar un problema" onClick={() => console.log("Reportar problema")} />
          <SettingsRow icon={termsPrivIcon} label="Términos y privacidad" onClick={() => console.log("Términos")} />
          <SettingsRow icon={<InfoCircleIcon />} label="Acerca de PetClue" value="v1.0.0" />
        </div>
      </section>

      {/* ===== Zona de riesgo ===== */}
      <section className="settings-section">
        <h2 className="settings-section__title">Zona de riesgo</h2>
        <div className="settings-card">
          <SettingsRow
            icon={desCuentaIcon}
            label="Desactivar cuenta temporalmente"
            danger
            onClick={() => console.log("Desactivar cuenta")}
          />
          <SettingsRow
            icon={eliminarIcon}
            label="Eliminar cuenta"
            danger
            onClick={() => console.log("Eliminar cuenta")}
          />
        </div>
      </section>
    </>
  );
}

export default SettingsPage;