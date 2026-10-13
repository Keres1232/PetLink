import "./SearchBar.css";

function SearchBar({ value, onChange, placeholder = "Busca...", autoFocus = false }) {
  return (
    <label className="search-bar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" stroke="#66557E" strokeWidth="2.5" />
        <path d="M15.5 15.5L21 21" stroke="#66557E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <input
        className="search-bar__input"
        autoFocus={autoFocus}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

export default SearchBar;