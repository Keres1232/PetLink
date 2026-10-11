import { dayLabel, distanceLabel } from "./format";

/** Reporte de reports_near -> ficha que usan PetCard / PetDetailModal. */
export function reportToPet(r) {
  const lost = r.type === "lost";
  return {
    id: r.id,
    name: r.pet_name ?? (lost ? "Mascota perdida" : "Mascota encontrada"),
    species: r.species_name ?? "",
    status: lost ? "Perdido" : "Encontrado",
    location: `${distanceLabel(r.distance_m)} · ${dayLabel(r.created_at)}`,
    breed: "",
    age: "",
    sex: "",
    size: "",
    color: "",
    marks: r.description,
    photoUrl: r.photos?.[0] ?? r.pet_photo_url ?? null,
    postId: r.post_id,
  };
}
