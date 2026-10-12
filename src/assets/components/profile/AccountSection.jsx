import infoPersonalIcon from "../../svg/Ajustes/info_personal.svg";
import escudoIcon from "../../svg/Ajustes/Escudo.svg";
import reportsIcon from "../../svg/Ajustes/Ajus_Report.svg";
import locationIcon from "../../svg/Location icon.svg";
import notificacionIcon from "../../svg/Ajustes/notificacion.svg";
import privacidadIcon from "../../svg/Ajustes/Privacidad.svg";
import ayudaIcon from "../../svg/Ajustes/Ayuda y soporte.svg";
import cerrarSesionIcon from "../../svg/Ajustes/cerrar sesión.svg";
import ToggleSwitch from "./ToggleSwitch.jsx";
import { useNotifications } from "../../../context/NotificationsContext.jsx";
import "./AccountSection.css";

const ChevronIcon = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 5.03448L1 10" stroke="#66557E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const OPTIONS = [
  { id: "edit", icon: infoPersonalIcon, label: "Editar información personal" },
  {
    id: "reports",
    icon: reportsIcon,
    label: "Mis reportes",
    sublabel: "Cambia el estado de tus alertas",
  },
  {
    id: "verification",
    icon: escudoIcon,
    label: "Solicitar verificación",
    sublabel: "Para veterinarios y refugios",
  },
  { id: "notifications", icon: notificacionIcon, label: "Notificaciones" },
  { id: "privacy", icon: privacidadIcon, label: "Privacidad" },
  { id: "help", icon: ayudaIcon, label: "Ayuda y soporte" },
  { id: "logout", icon: cerrarSesionIcon, label: "Cerrar sesión", danger: true },
];

// Solo para cuentas verificadas (veterinaria / refugio): su lugar en el mapa
const CLINIC_OPTION = {
  id: "clinic",
  icon: locationIcon,
  label: "Mi clínica",
  sublabel: "Tu lugar en el mapa",
};

function AccountSection({ onOptionClick, professional = false }) {
  const { enabled: notifEnabled, setEnabled: setNotifEnabled } = useNotifications();
  const options = professional ? [OPTIONS[0], CLINIC_OPTION, ...OPTIONS.slice(1)] : OPTIONS;

  return (
    <section className="account">
      <h2 className="account__title">Cuenta</h2>

      <div className="account__card">
        {options.map((option) =>
          option.id === "notifications" ? (
            // Notificaciones: interruptor para activarlas o desactivarlas (ya no abre la bandeja)
            <div key={option.id} className="account__row">
              <span className="account__row-left">
                <span className="account__icon-circle">
                  <img src={option.icon} alt="" className="account__icon" />
                </span>
                <span className="account__text">
                  <span className="account__label">{option.label}</span>
                  <span className="account__sublabel">{notifEnabled ? "Activadas" : "Desactivadas"}</span>
                </span>
              </span>
              <ToggleSwitch checked={notifEnabled} onChange={(on) => void setNotifEnabled(on)} ariaLabel="Notificaciones" />
            </div>
          ) : (
          <button
            key={option.id}
            type="button"
            className={`account__row ${option.danger ? "account__row--danger" : ""}`}
            onClick={() => onOptionClick?.(option.id)}
          >
            <span className="account__row-left">
              <span className={`account__icon-circle ${option.danger ? "account__icon-circle--danger" : ""}`}>
                <img src={option.icon} alt="" className="account__icon" />
              </span>

              <span className="account__text">
                <span className="account__label">{option.label}</span>
                {option.sublabel && <span className="account__sublabel">{option.sublabel}</span>}
              </span>
            </span>

            <span className="account__chevron">
              <ChevronIcon />
            </span>
          </button>
          )
        )}
      </div>
    </section>
  );
}

export default AccountSection;