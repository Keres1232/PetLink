function AvatarPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <rect width="100" height="100" fill="#E6E7E8" />
      <circle cx="50" cy="38" r="17" fill="#B0B3B5" />
      <path d="M12 100C12 76 28 63 50 63C72 63 88 76 88 100Z" fill="#B0B3B5" />
    </svg>
  );
}

export default AvatarPlaceholder;
