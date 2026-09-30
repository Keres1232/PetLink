import "./PillButton.css";

function PillButton({
  icon,
  iconAlt = "",
  label = "Ver todo",
  onClick,
}) {
  return (
    <button
      type="button"
      className="pill-button"
      onClick={onClick}
    >
      {icon && (
        <img
          src={icon}
          alt={iconAlt}
          className="pill-button__icon"
        />
      )}
      <span className="pill-button__label">{label}</span>
    </button>
  );
}

export default PillButton;