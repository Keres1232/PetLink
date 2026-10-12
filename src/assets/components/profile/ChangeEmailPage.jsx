import { useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import backIcon from "../../svg/Back.svg";
import mailIcon from "../../svg/Ajustes/correo electronico.svg";
import lockIcon from "../../svg/Ajustes/Privacidad.svg";
import "./ChangeEmailPage.css";

function ChangeEmailPage({ currentEmail = "", verified = true, onBack, onSubmit }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const canSubmit = validEmail && password !== "" && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError("Ese ya es tu correo actual.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit?.({ newEmail: newEmail.trim(), password });
      setSentTo(newEmail.trim());
      setPassword("");
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el correo. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Correo electrónico"
        leftIcon={backIcon}
        onLeft={onBack}
      />

      <form className="change-email" onSubmit={submit}>
        {/* Correo actual */}
        <div className="change-email__current">
          <span className="change-email__current-label">CORREO ACTUAL</span>

          <div className="change-email__current-row">
            <span className="change-email__current-value">{currentEmail}</span>
            {verified && <span className="change-email__badge">Verificado</span>}
          </div>
        </div>

        <IconInputField
          label="Nuevo correo electrónico"
          icon={<img src={mailIcon} alt="" className="change-email__field-icon" />}
          type="email"
          placeholder="nombre@correo.com"
          autoComplete="email"
          value={newEmail}
          onChange={setNewEmail}
        />

        <IconInputField
          label="Confirma tu contraseña"
          icon={<img src={lockIcon} alt="" className="change-email__field-icon" />}
          type="password"
          placeholder="tu contraseña actual"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <InfoNotice>
          Te enviaremos un enlace de confirmación al nuevo correo. El cambio no
          se aplica hasta que lo confirmes.
        </InfoNotice>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {sentTo && (
          <p className="change-email__sent" role="status">
            Te enviamos un enlace a <strong>{sentTo}</strong>. Ábrelo para confirmar el cambio; mientras tanto
            sigues entrando con tu correo actual. Revisa también la carpeta de spam.
          </p>
        )}

        <button type="submit" className="change-email__submit" disabled={!canSubmit}>
          {busy ? "Enviando..." : "Enviar confirmación"}
        </button>
      </form>
    </>
  );
}

export default ChangeEmailPage;