import "./PrimaryButton.css";

function PrimaryButton({ children, onClick, type = "button" }) {
  return (
    <button className="primary-button" onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export default PrimaryButton;