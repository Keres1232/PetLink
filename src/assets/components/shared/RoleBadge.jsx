import { ROLE_BADGE_LABEL } from "../../../lib/publisher";
import "./RoleBadge.css";

/** "✓ Veterinaria" / "✓ Refugio" / "✓ Médico veterinario" / "✓ Administrador" junto al nombre. */
function RoleBadge({ kind }) {
  const label = ROLE_BADGE_LABEL[kind];
  if (!label) return null;
  return <span className={`role-badge role-badge--${kind}`}>✓ {label}</span>;
}

export default RoleBadge;
