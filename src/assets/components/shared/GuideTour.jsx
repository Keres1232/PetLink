import { useRef, useState } from "react";
import PawBackground from "./PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import logoIcon from "../../svg/PetClue_Logo.svg";
import pawIcon from "../../svg/Huella.svg";
import addIcon from "../../svg/agregar.svg";
import mapIcon from "../../svg/Location icon.svg";
import communityIcon from "../../svg/Comunidad.svg";
import heartIcon from "../../svg/Report/corazon.svg";
import userIcon from "../../svg/user-outline.svg";
import bellIcon from "../../svg/bell.svg";
import "./GuideTour.css";

// Pantallas de la guía: qué se puede hacer en PetClue y dónde está
const STEPS = [
  {
    icon: logoIcon,
    logo: true,
    title: "Bienvenido a PetClue",
    text: "La comunidad que ayuda a que las mascotas perdidas vuelvan a casa. Te mostramos en un minuto lo que puedes hacer.",
  },
  {
    icon: pawIcon,
    title: "Inscribe a tus mascotas",
    text: "Ve a Perfil → «Mis mascotas» → «Inscribir mascota» y agrega su foto, especie, raza, sexo, tamaño, edad y señas particulares.",
    tips: [
      "Si se pierde, la eliges en «Se perdió mi mascota» y la alerta sale con sus datos",
      "Edítala con el lápiz o dala en adopción desde su ficha",
    ],
    action: "enroll",
    actionLabel: "Inscribir ahora",
  },
  {
    icon: addIcon,
    title: "Reporta en segundos",
    text: "Con el botón Reportar de la barra de abajo publicas una mascota perdida, una que encontraste o una para dar en adopción.",
    tips: ["Agrega una foto y ajústala", "Escribe la dirección o tócala en el mapa"],
  },
  {
    icon: mapIcon,
    title: "Mira qué pasa cerca",
    text: "En Mapa ves las alertas cercanas, las veterinarias y los refugios verificados. Usa los filtros y el botón de la mira para centrarte.",
    tips: ["Toca un punto para ver la ficha", "«Ver en el mapa» te lleva a cada publicación"],
  },
  {
    icon: communityIcon,
    title: "Habla con la comunidad",
    text: "En Comunidad haces preguntas, compartes consejos y sigues las alertas. Las etiquetas te muestran quién es veterinario o refugio.",
    tips: ["Dale me gusta y responde", "Busca con la lupa"],
  },
  {
    icon: heartIcon,
    title: "Contacta en privado",
    text: "Si reconoces una mascota, toca «¡La encontré!» o «Contactar al dueño». Tu mensaje solo lo ve quien la publicó.",
    tips: ["Puedes marcar dónde la viste", "En adopción, el dueño decide a quién aprobar"],
  },
  {
    icon: userIcon,
    title: "Tu perfil",
    text: "Ahí están tus mascotas, tus reportes (para marcarlos como resueltos), tu foto y tus datos, y los ajustes de notificaciones y privacidad.",
    tips: ["¿Eres veterinario o refugio? Solicita tu verificación"],
  },
  {
    icon: bellIcon,
    title: "Entérate a tiempo",
    text: "Activa la ubicación y las notificaciones para recibir alertas de mascotas perdidas cerca de ti y las respuestas a tus publicaciones.",
    tips: ["Desliza hacia abajo para recargar cualquier pantalla"],
  },
];

/**
 * Guía de la app: pantallas cortas que se pasan con los botones o deslizando de lado.
 * Se muestra una vez al entrar (App) y se puede volver a ver desde Ayuda y soporte.
 */
function GuideTour({ open, onClose, onEnroll }) {
  useLockBodyScroll(open);
  const [step, setStep] = useState(0);
  const touchX = useRef(null);

  if (!open) return null;

  const last = step === STEPS.length - 1;
  const s = STEPS[step];
  const go = (i) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
  const finish = () => {
    setStep(0);
    onClose?.();
  };

  return (
    <div className="guide__overlay" role="dialog" aria-modal="true" aria-label="Guía de PetClue">
      <div
        className="guide__card"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -50) go(step + 1);
          else if (dx > 50) go(step - 1);
        }}
      >
        <PawBackground contained />

        {!last && (
          <button type="button" className="guide__skip" onClick={finish}>
            Saltar
          </button>
        )}

        <div className="guide__body" key={step}>
          <span className={`guide__icon ${s.logo ? "guide__icon--logo" : ""}`}>
            {s.logo ? (
              <img src={s.icon} alt="" />
            ) : (
              <span className="guide__mask" style={{ WebkitMaskImage: `url("${s.icon}")`, maskImage: `url("${s.icon}")` }} />
            )}
          </span>
          <p className="guide__count">
            {step + 1} de {STEPS.length}
          </p>
          <h2 className="guide__title">{s.title}</h2>
          <p className="guide__text">{s.text}</p>
          {s.tips && (
            <ul className="guide__tips">
              {s.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
          {/* Atajo: cierra la guía y abre el formulario de inscribir mascota */}
          {s.action === "enroll" && onEnroll && (
            <button
              type="button"
              className="guide__shortcut"
              onClick={() => {
                finish();
                onEnroll();
              }}
            >
              {s.actionLabel} ›
            </button>
          )}
        </div>

        <div className="guide__dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={`guide__dot ${i === step ? "is-active" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <div className="guide__actions">
          {step > 0 && (
            <button type="button" className="guide__back" onClick={() => go(step - 1)}>
              Atrás
            </button>
          )}
          <button type="button" className="guide__next" onClick={last ? finish : () => go(step + 1)}>
            {last ? "¡Empezar!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuideTour;
