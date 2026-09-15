export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-CO");
}

export function dayLabel(iso: string): string {
  const sameDay = new Date(iso).toDateString() === new Date().toDateString();
  if (sameDay) return "HOY";
  const yesterday = new Date(Date.now() - 86400000);
  if (new Date(iso).toDateString() === yesterday.toDateString()) return "AYER";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export function distanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function ageFromBirthDate(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (months < 1) return "menos de 1 mes";
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} años` : `${years} años y ${rest} meses`;
}
