import { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Si una pantalla falla al dibujarse, muestra un aviso con "Recargar" en vez de dejar
 * toda la app en blanco (como hace web-development con su ErrorBoundary).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[PetClue] la pantalla falló:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-boundary" role="alert">
        <h1 className="error-boundary__title">Algo salió mal</h1>
        <p className="error-boundary__text">
          Ocurrió un error al mostrar esta pantalla. Recarga la app para seguir usándola.
        </p>
        <button type="button" className="error-boundary__button" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
