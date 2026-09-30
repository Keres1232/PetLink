import infoPersonalIcon from "../svg/Ajustes/info_personal.svg";
import notificacionIcon from "../svg/Ajustes/notificacion.svg";
import privacidadIcon from "../svg/Ajustes/Privacidad.svg";
import ayudaIcon from "../svg/Ajustes/Ayuda y soporte.svg";
import cerrarSesionIcon from "../svg/Ajustes/cerrar sesión.svg";
import "./AccountSection.css";

const ChevronIcon = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 1L6 5.03448L1 10"
      stroke="#66557E"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const OPTIONS = [
  {
    id: "edit",
    icon: infoPersonalIcon,
    label: "Editar información personal",
  },
  {
    id: "notifications",
    icon: notificacionIcon,
    label: "Notificaciones",
  },
  {
    id: "privacy",
    icon: privacidadIcon,
    label: "Privacidad",
  },
  {
    id: "help",
    icon: ayudaIcon,
    label: "Ayuda y soporte",
  },
  {
    id: "logout",
    icon: cerrarSesionIcon,
    label: "Cerrar sesión",
    danger: true,
  },
];

function AccountSection({ onOptionClick }) {
  return (
    <section className="account">
      <h2 className="account__title">Cuenta</h2>

      <div className="account__card">
        {OPTIONS.map((option) => (
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

              <span className="account__label">{option.label}</span>
            </span>

            <span className="account__chevron">
              <ChevronIcon />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default AccountSection;