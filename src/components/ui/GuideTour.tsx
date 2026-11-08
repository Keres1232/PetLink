import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { Bell, Heart, Map, MessageCircle, PawPrint, Plus, UserRound } from "lucide-react";
import PawBackground from "./PawBackground";
import PawHeartLogo from "../PawHeartLogo.jsx";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./GuideTour.css";

type Step = {
  title: string;
  text: string;
  tips?: string[];
  logo?: boolean;
  icon?: ReactNode;
  action?: "enroll";
  actionLabel?: string;
};

// Pantallas de la guía: qué se puede hacer en PetClue y dónde está
const STEPS: Step[] = [
  {
    logo: true,
    title: "Bienvenido a PetClue",
    text: "La comunidad que ayuda a que las mascotas perdidas vuelvan a casa. Esta guía te muestra, en un minuto, cómo usar la web y la app.",
    tips: ["La misma cuenta y las mismas secciones están disponibles en la app móvil."],
  },
  {
    icon: <PawPrint size={44} strokeWidth={1.8} />,
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
    icon: <Plus size={44} strokeWidth={1.8} />,
    title: "Reporta en segundos",
    text: "Con el botón Reportar del menú lateral (o de la barra inferior en el celular) publicas una mascota perdida, una que encontraste o una para dar en adopción.",
    tips: ["Agrega una foto y ajústala", "Escribe la dirección o tócala en el mapa"],
  },
  {
    icon: <Map size={44} strokeWidth={1.8} />,
    title: "Mira qué pasa cerca",
    text: "En Mapa ves las alertas cercanas, las veterinarias y los refugios verificados. Usa los filtros y el botón de la mira para centrarte.",
    tips: ["Haz clic en un punto para ver la ficha", "«Ver en el mapa» te lleva a cada publicación"],
  },
  {
    icon: <MessageCircle size={44} strokeWidth={1.8} />,
    title: "Habla con la comunidad",
    text: "En Comunidad haces preguntas, compartes consejos y sigues las alertas. Las etiquetas te muestran quién es veterinario o refugio.",
    tips: ["Dale me gusta y responde", "Busca con la lupa"],
  },
  {
    icon: <Heart size={44} strokeWidth={1.8} />,
    title: "Contacta en privado",
    text: "Si reconoces una mascota, haz clic en «¡La encontré!» o «Contactar al dueño». Tu mensaje solo lo ve quien la publicó.",
    tips: ["Puedes marcar dónde la viste", "En adopción, el dueño decide a quién aprobar"],
  },
  {
    icon: <UserRound size={44} strokeWidth={1.8} />,
    title: "Tu perfil",
    text: "Ahí están tus mascotas, tus reportes (para marcarlos como resueltos), tu foto y tus datos, y los ajustes de notificaciones y privacidad.",
    tips: ["¿Eres veterinario o refugio? Solicita tu verificación"],
  },
  {
    icon: <Bell size={44} strokeWidth={1.8} />,
    title: "Entérate a tiempo",
    text: "Activa las notificaciones para recibir alertas de mascotas perdidas cerca de ti y las respuestas a tus publicaciones.",
    tips: ["Recarga la página para actualizar cualquier pantalla"],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onEnroll?: () => void;
};

/**
 * Guía de PetClue: pantallas cortas que se pasan con los botones o deslizando de lado.
 * Se muestra una vez al entrar a Inicio y se puede volver a ver desde Ayuda y soporte.
 */
export default function GuideTour({ open, onClose, onEnroll }: Props) {
  useLockBodyScroll(open);
  const [step, setStep] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const last = step === STEPS.length - 1;
  const current = STEPS[step];
  const go = (next: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  const finish = () => {
    setStep(0);
    onClose();
  };

  return (
    <div className="guide-tour__overlay">
      <div
        className="guide-tour__card"
        role="dialog"
        aria-modal="true"
        aria-label="Guía de PetClue"
        onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
          touchX.current = event.touches.item(0)?.clientX ?? null;
        }}
        onTouchEnd={(event: TouchEvent<HTMLDivElement>) => {
          if (touchX.current === null) return;
          const start = touchX.current;
          const end = event.changedTouches.item(0)?.clientX ?? start;
          touchX.current = null;
          if (end - start < -50) go(step + 1);
          else if (end - start > 50) go(step - 1);
        }}
      >
        <PawBackground contained />

        {!last && (
          <button type="button" className="guide-tour__skip" onClick={finish}>
            Saltar
          </button>
        )}

        <div className="guide-tour__body" key={step}>
          <span className={`guide-tour__icon ${current.logo ? "guide-tour__icon--logo" : ""}`}>
            {current.logo ? <PawHeartLogo /> : current.icon}
          </span>
          <p className="guide-tour__count">
            {step + 1} de {STEPS.length}
          </p>
          <h2 className="guide-tour__title">{current.title}</h2>
          <p className="guide-tour__text">{current.text}</p>
          {current.tips && (
            <ul className="guide-tour__tips">
              {current.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
          {current.action === "enroll" && onEnroll && (
            <button
              type="button"
              className="guide-tour__shortcut"
              onClick={() => {
                finish();
                onEnroll();
              }}
            >
              {current.actionLabel} ›
            </button>
          )}
        </div>

        <div className="guide-tour__dots" aria-hidden="true">
          {STEPS.map((_, index) => (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              className={`guide-tour__dot ${index === step ? "is-active" : ""}`}
              onClick={() => go(index)}
            />
          ))}
        </div>

        <div className="guide-tour__actions">
          {step > 0 && (
            <button type="button" className="guide-tour__back" onClick={() => go(step - 1)}>
              Atrás
            </button>
          )}
          <button
            type="button"
            className="guide-tour__next"
            onClick={last ? finish : () => go(step + 1)}
          >
            {last ? "¡Empezar!" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
