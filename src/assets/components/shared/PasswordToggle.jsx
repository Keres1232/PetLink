import eyeOpenIcon from "../../svg/Ocult/Eye-open.svg";
import eyeClosedIcon from "../../svg/Ocult/Eye-Closed.svg";
import "./PasswordToggle.css";

/** Botón del ojo para mostrar u ocultar lo escrito en un campo de contraseña. */
function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="password-toggle"
      onClick={onToggle}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={visible}
    >
      <img src={visible ? eyeOpenIcon : eyeClosedIcon} alt="" />
    </button>
  );
}

export default PasswordToggle;
