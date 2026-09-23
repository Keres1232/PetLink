import "./AlertNotification.css";

const AlertIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" stroke="#7519FF" strokeWidth="2" />
    <path d="M12 7V13" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1" fill="#7519FF" />
  </svg>
);

function AlertNotification({
  title = "Alerta cerca de ti",
  description = "Se reportó un perrito perdido cerca de tu ubicación.",
  onViewDetail,
  onNotMyArea,
}) {
  return (
    <article className="alert-card">
      <div className="alert-card__header">
        <div className="alert-card__icon">
          <AlertIcon />
        </div>

        <div className="alert-card__text">
          <p className="alert-card__title">{title}</p>
          <p className="alert-card__description">{description}</p>
        </div>
      </div>

      <div className="alert-card__actions">
        <button
          type="button"
          className="alert-card__btn alert-card__btn--detail"
          onClick={onViewDetail}
        >
          Ver detalle
        </button>

        <button
          type="button"
          className="alert-card__btn alert-card__btn--not-my-area"
          onClick={onNotMyArea}
        >
          No es mi zona
        </button>
      </div>
    </article>
  );
}

export default AlertNotification;