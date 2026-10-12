import "./RequestCard.css";

const TYPE_LABEL = { vet: "VETERINARIA", doctor: "MÉDICO VET.", refuge: "REFUGIO", establishment: "POR CLASIFICAR" };
const STATUS_LABEL = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="#66557E" strokeWidth="2" />
    <path d="M3 10H21M8 3V7M16 3V7" stroke="#66557E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function RequestCard({ request, onReview }) {
  const { type, status, name, location, sentLabel = "Enviada hoy", photoUrl } = request;

  return (
    <article className="request-card">
      <div className="request-card__top">
        <div className="request-card__photo">{photoUrl && <img src={photoUrl} alt="" />}</div>

        <div className="request-card__info">
          <div className="request-card__row">
            <span className={`request-card__type request-card__type--${type}`}>{TYPE_LABEL[type]}</span>
            <span className={`request-card__status request-card__status--${status}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          <h3 className="request-card__name">{name}</h3>
          <p className="request-card__location">{location}</p>
        </div>
      </div>

      <div className="request-card__bottom">
        <span className="request-card__sent">
          <CalendarIcon />
          {sentLabel}
        </span>

        <button type="button" className="request-card__review" onClick={() => onReview?.(request)}>
          Revisar
        </button>
      </div>
    </article>
  );
}

export default RequestCard;