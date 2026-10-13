import "./PawLoader.css";

// Huella de src/assets/svg/Animacion/Carga.svg: ese SVG trae 4 cuadros de la animación y en cada uno
// se rellena un dedo distinto. Aquí se usa una sola huella y los dedos se rellenan por turnos con CSS.
const PAD = "M45.1603 32.3081C41.9452 33.2193 37.3722 36.5529 35.6256 39.4305C33.8789 42.3082 33.5015 47.1464 34.6799 49.575C35.8588 52.0032 40.1219 53.9872 42.6976 54C45.2733 54.0127 47.3443 50.4255 50.1348 49.6519C53.2542 48.7877 59.178 50.3433 61.4157 48.8126C63.6528 47.2825 64.6425 42.9447 63.5597 40.4696C62.4764 37.9944 57.9848 35.3214 54.9185 33.9612C51.9214 32.6318 48.3278 31.4101 45.1603 32.3081Z";
const TOES = [
  "M16.5328 39.0177C15.9988 37.7854 15.8525 35.8936 16.1561 34.6248C16.4592 33.3594 17.2156 32.0234 18.3546 31.4065C19.5753 30.745 22.3601 30.9128 24.0824 31.75C26.0087 32.6869 29.4612 35.1345 29.9131 37.0268C30.3684 38.9336 28.9706 41.8233 27.212 42.6556C25.4528 43.4878 21.1394 42.6265 19.3598 42.0206C18.062 41.5785 17.0668 40.2505 16.5328 39.0177Z", // abajo a la izquierda
  "M25.9674 20.4101C26.3801 19.1338 27.5477 17.6092 28.6495 16.8459C29.7486 16.085 31.2551 15.5633 32.5772 15.8322C33.9944 16.1201 36.0894 18.0446 36.8875 19.7893C37.7797 21.7411 38.8575 25.8202 37.9319 27.5424C36.9992 29.2778 33.9295 30.5601 31.9698 30.054C30.0097 29.5476 27.1726 26.112 26.1722 24.5052C25.4428 23.3332 25.5544 21.6868 25.9674 20.4101Z", // arriba a la izquierda
  "M49.2424 25C47.3276 25 44.2992 24.3392 43.1428 22.6309C41.806 20.6552 40.4605 15.5855 41.22 13.1475C41.9795 10.7099 45.3233 8.11422 47.6987 8.00408C50.0741 7.89346 54.3178 10.0481 55.4736 12.4862C56.6289 14.9237 55.6702 20.5451 54.6316 22.6309C53.8106 24.2795 51.1572 25 49.2424 25Z", // arriba
  "M67.4361 19.6813C68.969 19.7862 70.9889 21.287 72.0636 22.294C73.018 23.1879 73.8937 24.4283 73.8823 25.7211C73.8703 27.1067 72.4473 29.9468 70.69 31.1812C68.8728 32.4573 64.9245 33.8482 62.9798 33.3787C61.0201 32.9057 59.244 30.3506 59.2247 28.3983C59.2054 26.4461 61.4945 23.118 62.863 21.6652C63.9875 20.4719 65.9025 19.5766 67.4361 19.6813Z", // a la derecha
];

/**
 * Animación de carga de PetClue: la huella con los dedos encendiéndose en orden.
 * - `label`: texto debajo (opcional).
 * - `size`: ancho en px de la huella.
 * - `fullScreen`: ocupa la pantalla (arranque de la app).
 */
function PawLoader({ label = "Cargando…", size = 56, fullScreen = false }) {
  return (
    <div className={`paw-loader ${fullScreen ? "paw-loader--full" : ""}`} role="status" aria-live="polite">
      <svg className="paw-loader__paw" width={size} height={(size * 54) / 66} viewBox="12 4 66 54" fill="none" aria-hidden="true">
        <path className="paw-loader__pad" d={PAD} />
        {TOES.map((toe, i) => (
          <path key={i} className="paw-loader__toe" style={{ animationDelay: `${i * 0.15}s` }} d={toe} />
        ))}
      </svg>
      {label && <p className="paw-loader__label">{label}</p>}
    </div>
  );
}

export default PawLoader;
