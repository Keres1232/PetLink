import { useNavigate } from "react-router-dom";
import { MessageCircle, PawPrint, Search } from "lucide-react";
import "../components/report/report.css";

export default function ReportPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="pc-page-header">
        <h1 className="pc-title">¿Qué quieres reportar?</h1>
      </div>
      <p className="report-subtitle">Elige la opción que corresponde a tu situación.</p>

      <div className="report-options">
        <button
          type="button"
          className="report-option"
          onClick={() => navigate("/reportar/mi-mascota")}
        >
          <span className="report-option__icon">
            <PawPrint size={22} />
          </span>
          <span className="report-option__text">
            <strong>Se perdió mi mascota</strong>
            <small>Publica una alerta para que la comunidad te ayude a buscarla</small>
          </span>
        </button>

        <button
          type="button"
          className="report-option"
          onClick={() => navigate("/reportar/encontrada")}
        >
          <span className="report-option__icon">
            <Search size={22} />
          </span>
          <span className="report-option__text">
            <strong>Encontré una mascota</strong>
            <small>Reporta una mascota perdida que encontraste en tu zona</small>
          </span>
        </button>

        <button
          type="button"
          className="report-option report-option--link"
          onClick={() => navigate("/comunidad")}
        >
          <MessageCircle size={16} style={{ marginRight: 8 }} />
          Prefiero solo publicar en la comunidad
        </button>
      </div>
    </div>
  );
}
