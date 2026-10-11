import { useState } from "react";
import PasswordToggle from "./PasswordToggle.jsx";
import "./IconInputField.css";

function IconInputField({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="icon-input-field">
      <span className="icon-input-field__label">{label}</span>

      <span className="icon-input-field__box">
        {icon && <span className="icon-input-field__icon">{icon}</span>}

        <input
          className="icon-input-field__input"
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

export default IconInputField;