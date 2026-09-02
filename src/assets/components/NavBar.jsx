import React from "react";
import "./NavBar.css";

const HomeIcon = ({ active }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
      stroke={active ? "#AE77FF" : "#66557E"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MapIcon = ({ active }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 21C12 21 19 14.5 19 8.5C19 4.91 15.87 2 12 2C8.13 2 5 4.91 5 8.5C5 14.5 12 21 12 21Z"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <circle
      cx="12"
      cy="8.5"
      r="2.5"
      fill="white"
    />
  </svg>
);

const ReportIcon = ({ active }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <path
      d="M12 7V17"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />

    <path
      d="M7 12H17"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CommunityIcon = ({ active }) => (
  <svg
    width="30"
    height="26"
    viewBox="0 0 30 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="15"
      cy="8"
      r="5"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <circle
      cx="6"
      cy="10"
      r="4"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <circle
      cx="24"
      cy="10"
      r="4"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <path
      d="M8 24C8 18.5 11 15 15 15C19 15 22 18.5 22 24"
      fill={active ? "#AE77FF" : "#66557E"}
    />

    <path
      d="M0 24C0 19.5 2.5 17 6 17C8 17 9.5 18 10.5 19.5"
      stroke={active ? "#AE77FF" : "#66557E"}
      strokeWidth="3"
      strokeLinecap="round"
    />

    <path
      d="M30 24C30 19.5 27.5 17 24 17C22 17 20.5 18 19.5 19.5"
      stroke={active ? "#AE77FF" : "#66557E"}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg
    width="24"
    height="26"
    viewBox="0 0 24 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="7"
      r="5"
      stroke={active ? "#AE77FF" : "#66557E"}
      strokeWidth="2"
    />

    <path
      d="M3 24C3 18.5 6.5 15 12 15C17.5 15 21 18.5 21 24"
      stroke={active ? "#AE77FF" : "#66557E"}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function NavBar({ active = "home", onNavigate }) {
  const items = [
    {
      id: "home",
      label: "Inicio",
      icon: HomeIcon,
    },
    {
      id: "map",
      label: "Mapa",
      icon: MapIcon,
    },
    {
      id: "report",
      label: "Reportar",
      icon: ReportIcon,
    },
    {
      id: "community",
      label: "Comunidad",
      icon: CommunityIcon,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: ProfileIcon,
    },
  ];

  return (
    <nav className="navbar">
      {items.map((item) => {
        const isActive = active === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => onNavigate?.(item.id)}
            type="button"
          >
            <div className="nav-icon">
              <Icon active={isActive} />
            </div>

            <span className="nav-label">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default NavBar;