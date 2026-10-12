import "./CircleIconButton.css";

function CircleIconButton({
  icon,
  iconAlt = "",
  onClick,
  ariaLabel = "Botón",
  badge = 0,
}) {
  return (
    <button
      type="button"
      className="circle-icon-button"
      onClick={onClick}
      aria-label={badge > 0 ? `${ariaLabel} (${badge} sin leer)` : ariaLabel}
    >
      <span className="circle-icon-button__shadow" aria-hidden="true" />
      <span className="circle-icon-button__circle">
        <img
          src={icon}
          alt={iconAlt}
          className="circle-icon-button__icon"
        />
      </span>

      {/* Globito con el número de notificaciones sin leer */}
      {badge > 0 && (
        <span className="circle-icon-button__badge" aria-hidden="true">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export default CircleIconButton;
