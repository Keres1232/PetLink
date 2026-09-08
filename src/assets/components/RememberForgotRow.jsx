import "./RememberForgotRow.css";

function RememberForgotRow({ remember, onToggleRemember, onForgotPassword }) {
  return (
    <div className="remember-forgot">
      <label className="remember-forgot__check">
        <input type="checkbox" checked={remember} onChange={onToggleRemember} />
        <span>Recordarme</span>
      </label>
      <button className="remember-forgot__link" onClick={onForgotPassword}>
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );
}

export default RememberForgotRow;