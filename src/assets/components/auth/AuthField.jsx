import { useState } from "react";
import PasswordToggle from "../shared/PasswordToggle.jsx";
import "./AuthPages.css";

function AuthField({ label, icon, type = "text", value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>

      <span className="auth-field__box">
        <span className="auth-field__icon">{icon}</span>
        <input
          className="auth-field__input"
          type={isPassword && visible ? "text" : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {isPassword && <PasswordToggle visible={visible} onToggle={() => setVisible((v) => !v)} />}
      </span>
    </label>
  );
}

export default AuthField;
