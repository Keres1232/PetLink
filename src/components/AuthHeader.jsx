import { ChevronLeft } from "lucide-react";
import PawHeartLogo from "./PawHeartLogo.jsx";
import "./AuthHeader.css";

function AuthHeader({ title, subtitle, onBack }) {
  return (
    <>
      <button className="auth-header__back" onClick={onBack} aria-label="Volver">
        <ChevronLeft size={20} color="#333" />
      </button>

      <div className="auth-header__hero">
        <PawHeartLogo />
        <h1 className="auth-header__title">{title}</h1>
        <p className="auth-header__subtitle">{subtitle}</p>
      </div>
    </>
  );
}

export default AuthHeader;