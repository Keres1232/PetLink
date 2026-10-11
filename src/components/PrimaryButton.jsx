import "./PrimaryButton.css";

/**
 * @param {{
 *   children?: import("react").ReactNode;
 *   onClick?: () => void;
 *   type?: "button" | "submit";
 *   disabled?: boolean;
 * }} props
 */
function PrimaryButton({ children, onClick, type = "button", disabled = false }) {
  return (
    <button className="primary-button" onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

export default PrimaryButton;
