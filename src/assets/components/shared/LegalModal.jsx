import PawBackground from "./PawBackground.jsx";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import { LEGAL_DOCS } from "./legalDocs.js";
import "./LegalModal.css";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6L18 18" stroke="var(--titulos, #7519FF)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function LegalModal({ type, onClose }) {
  useLockBodyScroll(Boolean(type));
  const swipe = useSwipeToClose(onClose);

  const doc = LEGAL_DOCS[type];
  if (!doc) return null;

  return (
    <div className="legal__overlay" onClick={onClose}>
      <div className="legal__sheet" {...swipe} role="dialog" aria-modal="true" aria-label={doc.title} onClick={(e) => e.stopPropagation()}>
        <PawBackground contained />

        <span className="legal__handle" />

        <div className="legal__header">
          <div>
            <h2 className="legal__title">{doc.title}</h2>
            <p className="legal__updated">Última actualización: {doc.updated}</p>
          </div>

          <button type="button" className="legal__close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div className="legal__body">
          {doc.blocks.map((b, i) => {
            if (b.h) return <h3 key={i} className="legal__heading">{b.h}</h3>;
            if (b.ul)
              return (
                <ul key={i} className="legal__list">
                  {b.ul.map((li, j) => <li key={j}>{li}</li>)}
                </ul>
              );
            return <p key={i} className="legal__text">{b.p}</p>;
          })}
        </div>

        <button type="button" className="legal__ok" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default LegalModal;