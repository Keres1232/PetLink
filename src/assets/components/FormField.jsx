import "./FormField.css";

function FormField({ label, icon, type = "text", placeholder, value, onChange }) {
  return (
    <div className="form-field">
      <div className="form-field__label-row">
        <span className="form-field__label">{label}</span>
      </div>
      <div className="form-field__input">
        <span className="form-field__icon">{icon}</span>
        <input
          className="form-field__input-el"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default FormField;