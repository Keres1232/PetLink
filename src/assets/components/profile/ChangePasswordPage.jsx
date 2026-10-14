import { useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import backIcon from "../../svg/Back.svg";
import lockIcon from "../../svg/Ajustes/Privacidad.svg";
import { PASSWORD_POLICY_HINT, meetsPasswordPolicy } from "../../../lib/authErrors";
import "./ChangePasswordPage.css";

function ChangePasswordPage({ onBack, onSubmit, onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Misma política que el registro y la recuperación de contraseña
  const weak = next !== "" && !meetsPasswordPolicy(next);
  const mismatch = confirm !== "" && next !== confirm;
  const canSubmit =
    current !== "" && meetsPasswordPolicy(next) && next === confirm && !busy && !done;

  const icon = <img src={lockIcon} alt="" className="change-password__icon" />;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit?.({ current, next });
      setDone(true);
      // Muestra la confirmación y luego cierra la sesión para entrar con la contraseña nueva
      setTimeout(() => onDone?.(), 1800);
    } catch (err) {
      setError(err?.message || "No se pudo cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="Cambiar contraseña" leftIcon={backIcon} onLeft={onBack} />

      <form className="change-password" onSubmit={submit}>
        <IconInputField
          label="Contraseña actual"
          icon={icon}
          type="password"
          placeholder="Ingresa tu contraseña actual"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />

        <div className="change-password__group">
          <IconInputField
            label="Nueva contraseña"
            icon={icon}
            type="password"
            placeholder="Ingresa tu nueva contraseña"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
          />
          {weak && (
            <p className="change-password__error">
              Debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo.
            </p>
          )}
        </div>

        <div className="change-password__group">
          <IconInputField
            label="Confirma la nueva contraseña"
            icon={icon}
            type="password"
            placeholder="Ingresa tu nueva contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
          />
          {mismatch && (
            <p className="change-password__error">Las contraseñas no coinciden.</p>
          )}
        </div>

        <InfoNotice>
          Después de cambiar tu contraseña, cerraremos tu sesión en todos tus
          dispositivos por seguridad y volverás a entrar con la nueva.
        </InfoNotice>

        <p className="change-password__hint">{PASSWORD_POLICY_HINT}</p>

        {error && (
          <p className="change-password__error change-password__error--center" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="change-password__success" role="status">
            ¡Contraseña actualizada! Vuelve a iniciar sesión con tu nueva contraseña.
          </p>
        )}

        <button type="submit" className="change-password__submit" disabled={!canSubmit}>
          {busy ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </>
  );
}

export default ChangePasswordPage;