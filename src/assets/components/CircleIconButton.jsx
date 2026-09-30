import "./CircleIconButton.css";

function CircleIconButton({
  icon,
  iconAlt = "",
  onClick,
  ariaLabel = "Botón",
}) {
  return (
    <button
      type="button"
      className="circle-icon-button"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="circle-icon-button__shadow" aria-hidden="true" />
      <span className="circle-icon-button__circle">
        <img
          src={icon}
          alt={iconAlt}
          className="circle-icon-button__icon"
        />
      </span>
    </button>
  );
}

export default CircleIconButton;