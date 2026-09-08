import logo from "../svg/Logo.svg";

function PawHeartLogo({ size = 120 }) {
  return <img src={logo} alt="PetLink" width={size} style={{ height: "auto" }} />;
}

export default PawHeartLogo;