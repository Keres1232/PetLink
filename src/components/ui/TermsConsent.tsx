import { useState } from "react";
import LegalModal from "./LegalModal";
import "./TermsConsent.css";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  errorMessage?: string;
};

export default function TermsConsent({
  checked,
  onChange,
  error = false,
  errorMessage,
}: Props) {
  const [legal, setLegal] = useState<null | "terms" | "privacy">(null);

  return (
    <>
      <label className={`terms-consent ${error ? "terms-consent--error" : ""}`}>
        <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} />
        <span>
          Acepto los{" "}
          <button
            type="button"
            className="terms-consent__link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLegal("terms");
            }}
          >
            Términos de uso
          </button>{" "}
          y la{" "}
          <button
            type="button"
            className="terms-consent__link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLegal("privacy");
            }}
          >
            Política de privacidad
          </button>{" "}
          de PetClue.
        </span>
      </label>

      {error && (
        <p className="terms-consent__error" role="alert">
          {errorMessage ?? "Debes aceptar los Términos de uso y la Política de privacidad."}
        </p>
      )}

      {legal && <LegalModal initial={legal} onClose={() => setLegal(null)} />}
    </>
  );
}
