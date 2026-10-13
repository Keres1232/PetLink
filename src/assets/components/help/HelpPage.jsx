import { useRef, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import SearchBar from "../shared/SearchBar.jsx";
import FaqItem from "./FaqItem.jsx";
import FileDrop from "../shared/FileDrop.jsx";
import backIcon from "../../svg/Back.svg";
import { SUPPORT_EMAIL, sendSupportMessage, uploadPhoto } from "../../../lib/api";
import "./HelpPage.css";

const FAQS = [
  {
    id: 1,
    q: "¿Cómo reporto una mascota perdida?",
    a: 'Toca el botón Reportar en la barra inferior y elige "Se perdió mi mascota". Selecciona a tu mascota, indica dónde y cuándo se perdió y publica la alerta.',
  },
  {
    id: 2,
    q: "¿Quién puede ver la ubicación de mi reporte?",
    a: "La ubicación de tu reporte puede ser visible para otros usuarios de PetClue, con el fin de facilitar la búsqueda de tu mascota. Te recomendamos compartir únicamente la información necesaria para ayudar a encontrarla.",
  },
  {
    id: 3,
    q: "No me llegan las alertas de mi zona",
    a: "Verifica que las notificaciones de PetClue estén activadas en los ajustes de tu dispositivo. También comprueba que tu zona de interés esté configurada correctamente. Si el problema continúa, contacta con nuestro equipo de soporte.",
  },
  {
    id: 4,
    q: "¿Cómo solicito la etiqueta de veterinario?",
    a: "Si eres médico veterinario, solicita la verificación de tu perfil desde la sección de perfil profesional, según las opciones disponibles. Una vez aprobada, la etiqueta permitirá que otros usuarios identifiquen tu perfil profesional en la comunidad.",
  },
];

const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * "¿No encontraste tu respuesta?": envía el mensaje a soporte@petclue.co (sendSupportMessage, como la web).
 * La captura opcional se sube a Storage y su enlace va dentro del mensaje (la función no recibe archivos).
 */
function HelpPage({ onBack, defaultEmail = "" }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [problem, setProblem] = useState("");
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // un segundo toque rápido no envía dos veces
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null); // null | { emailed, noScreenshot }

  const q = normalize(query);
  const visible = FAQS.filter((f) => normalize(f.q + " " + f.a).includes(q));
  const canSubmit = problem.trim() !== "" && email.trim() !== "" && !busy;

  const clearStatus = () => {
    setSent(null);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busyRef.current) return;
    const message = problem.trim();
    const replyTo = email.trim();
    if (message.length < 10) return setError("Cuéntanos un poco más (mínimo 10 caracteres).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) return setError("Escribe un correo válido para responderte.");

    busyRef.current = true;
    setBusy(true);
    clearStatus();
    try {
      // Si la captura no sube, el mensaje se envía igual
      let screenshotUrl = null;
      if (file) {
        try {
          screenshotUrl = await uploadPhoto(file, "post-images");
        } catch (err) {
          console.warn("[soporte] no se pudo subir la captura", err);
        }
      }
      const body = [message, screenshotUrl && `Captura de pantalla: ${screenshotUrl}`, "— Enviado desde la app de Android"]
        .filter(Boolean)
        .join("\n\n");
      const { emailed } = await sendSupportMessage({ message: body, email: replyTo, subject: "Soporte desde la app" });
      setSent({ emailed, noScreenshot: Boolean(file) && !screenshotUrl });
      setProblem("");
      setFile(null);
    } catch (err) {
      console.error("[soporte] no se pudo enviar", err);
      setError(`No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos a ${SUPPORT_EMAIL}.`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="Ayuda y soporte" leftIcon={backIcon} onLeft={onBack} />

      <div className="help">
        <SearchBar value={query} onChange={setQuery} placeholder="Busca tu duda..." />

        <h2 className="help__title">Preguntas frecuentes</h2>

        <div className="help__card">
          {visible.length === 0 && <p className="help__empty">No encontramos resultados.</p>}
          {visible.map((f) => (
            <FaqItem
              key={f.id}
              question={f.q}
              answer={f.a}
              open={openId === f.id}
              onToggle={() => setOpenId(openId === f.id ? null : f.id)}
            />
          ))}
        </div>

        <h2 className="help__title help__title--second">¿No encontraste tu respuesta?</h2>
        <p className="help__sub">Cuéntanos qué pasó y lo revisamos</p>

        <form className="help__form" onSubmit={submit}>
          <div className="help__card help__card--form">
            <label className="help__field">
              <span className="help__label">Describe el problema</span>
              <textarea
                className="help__textarea"
                rows={3}
                placeholder="Ej: No puedo actualizar la foto de mi mascota…"
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  clearStatus();
                }}
              />
            </label>

            <FileDrop label="Captura de pantalla (opcional)" file={file} onChange={setFile} />

            <label className="help__field">
              <span className="help__label">Correo para responderte</span>
              <input
                className="help__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearStatus();
                }}
              />
            </label>
          </div>

          {error && (
            <p className="help__error" role="alert">
              {error}
            </p>
          )}

          {sent && (
            <p className="help__sent" role="status">
              ¡Gracias! Revisaremos tu reporte pronto y te responderemos a tu correo.
              {sent.noScreenshot && " (No pudimos adjuntar la captura.)"}
              {!sent.emailed && (
                <>
                  {" "}
                  Si es urgente, escríbenos a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </>
              )}
            </p>
          )}

          <button type="submit" className="help__submit" disabled={!canSubmit}>
            {busy ? "Enviando..." : "Enviar reporte"}
          </button>
        </form>
      </div>
    </>
  );
}

export default HelpPage;