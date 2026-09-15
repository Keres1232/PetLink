import type { ReactNode } from "react";
import "./States.css";

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="pc-state" role="status" aria-live="polite">
      <span className="pc-spinner" aria-hidden="true" />
      <p className="pc-muted">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pc-state">
      {icon && <div className="pc-state__icon">{icon}</div>}
      <h3>{title}</h3>
      {body && <p className="pc-muted">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message = "Algo salió mal. Intenta de nuevo.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="pc-state">
      <h3>No pudimos cargar esto</h3>
      <p className="pc-muted">{message}</p>
      {onRetry && (
        <button type="button" className="pc-outline-btn" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
