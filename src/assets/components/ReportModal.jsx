import pawIcon from "../svg/Report/huella.svg";
import heartIcon from "../svg/Report/corazon.svg";
import commentIcon from "../svg/Report/coment.svg";
import "./ReportModal.css";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="var(--titulos, #7519FF)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg width="8" height="14" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 1L6 5.03448L1 10"
      stroke="#66557E"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const OPTIONS = [
  {
    id: "lost",
    icon: pawIcon,
    title: "Se perdió mi mascota",
    description: "Publica una alerta para que la comunidad te ayude a buscarla",
    theme: "lost",
  },
  {
    id: "found",
    icon: heartIcon,
    title: "Encontré una mascota",
    description: "Reporta una mascota perdida que encontraste en tu zona",
    theme: "found",
  },
];

function ReportModal({ open, onClose, onSelectOption, onCommunityPost }) {
  if (!open) return null;

  return (
    <div className="report-modal__overlay" onClick={onClose}>
      <div
        className="report-modal__sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="report-modal__handle" />

        <div className="report-modal__header">
          <div className="report-modal__titles">
            <h2 className="report-modal__title">¿Qué quieres reportar?</h2>
            <p className="report-modal__subtitle">
              Elige la opción que corresponde a tu situación.
            </p>
          </div>

          <button
            type="button"
            className="report-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="report-modal__options">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`report-modal__option report-modal__option--${option.theme}`}
              onClick={() => onSelectOption?.(option.id)}
            >
              <span className={`report-modal__icon report-modal__icon--${option.theme}`}>
                <img src={option.icon} alt="" className="report-modal__icon-img" />
              </span>

              <span className="report-modal__option-text">
                <span className={`report-modal__option-title report-modal__option-title--${option.theme}`}>
                  {option.title}
                </span>
                <span className="report-modal__option-description">
                  {option.description}
                </span>
              </span>

              <span className="report-modal__chevron">
                <ChevronIcon />
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="report-modal__community"
          onClick={onCommunityPost}
        >
          <img src={commentIcon} alt="" className="report-modal__community-icon" />
          Prefiero solo publicar en la comunidad
        </button>

      </div>
    </div>
  );
}

export default ReportModal;