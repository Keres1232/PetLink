import "./ToggleSwitch.css";

function ToggleSwitch({ checked, onChange, ariaLabel = "Activar" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`toggle-switch ${checked ? "is-on" : ""}`}
      onClick={() => onChange?.(!checked)}
    >
      <span className="toggle-switch__thumb" />
    </button>
  );
}

export default ToggleSwitch;