import "./AccountSection.css";

const s = {
  stroke: "var(--titulos, #7519FF)",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" {...s} />
    <path d="M12 7V12L15 14" {...s} />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M18 16V11C18 8 16.4 5.6 13.5 5V4.5C13.5 3.7 12.8 3 12 3C11.2 3 10.5 3.7 10.5 4.5V5C7.6 5.6 6 8 6 11V16L4.5 18H19.5L18 16Z"
      {...s}
    />
    <path d="M10 20.5C10.3 21.2 11.1 21.5 12 21.5C12.9 21.5 13.7 21.2 14 20.5" {...s} />
  </svg>
);

const DocIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <rect x="5" y="3" width="14" height="18" rx="2" {...s} />
    <path d="M9 8H15M9 12H15M9 16H12" {...s} />
  </svg>
);

const Chevron = () => (
  <svg width="8" height="11" viewBox="0 0 8 11" fill="none">
    <path d="M1 1L6 5.03L1 10" stroke="#66557E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const OPTIONS = [
  { id: "pending", icon: <ClockIcon />, label: "Solicitudes de verificación" },
  { id: "posts", icon: <BellIcon />, label: "Publicaciones por revisar" },
  { id: "clinics", icon: <DocIcon />, label: "Clínicas y refugios por verificar" },
  { id: "comments", icon: <BellIcon />, label: "Denuncias de comentarios" },
  { id: "content", icon: <DocIcon />, label: "Borrar alertas y publicaciones" },
  { id: "history", icon: <DocIcon />, label: "Historial de solicitudes" },
];

function ManagementSection({ onOptionClick }) {
  return (
    <section className="account">
      <h2 className="account__title">Gestión</h2>

      <div className="account__card">
        {OPTIONS.map((o) => (
          <button key={o.id} type="button" className="account__row" onClick={() => onOptionClick?.(o.id)}>
            <span className="account__row-left">
              <span className="account__icon-circle">{o.icon}</span>
              <span className="account__label">{o.label}</span>
            </span>
            <span className="account__chevron">
              <Chevron />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ManagementSection;