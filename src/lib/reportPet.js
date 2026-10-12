import { ageFromBirthDate, dayLabel, distanceLabel } from "./format";

const SEX_LABEL = { male: "Macho", female: "Hembra", unknown: "No sé" };
const SIZE_LABEL = { small: "Pequeño", medium: "Mediano", large: "Grande" };
const SPECIES_ES = { dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo", ferret: "Hurón", other: "Otro" };
const speciesLabel = (name) => (name ? SPECIES_ES[name.toLowerCase()] ?? name : "");

/** Reporte de reports_near -> ficha que usan PetCard / PetDetailModal (resumen). */
export function reportToPet(r) {
  const lost = r.type === "lost";
  return {
    id: r.id,
    isReport: true,
    name: r.pet_name ?? (lost ? "Mascota perdida" : "Mascota encontrada"),
    species: speciesLabel(r.species_name),
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

/**
 * Completa la ficha con el reporte completo (getReportDetails).
 * Mascota perdida: los datos vienen de la mascota registrada.
 * Mascota encontrada: vienen del propio reporte (especie, sexo, raza, tamaño, edad aprox.).
 */
export function withReportDetails(pet, d) {
  if (!d) return pet;
  const p = d.pet ?? {};
  const pick = (...values) => values.find((v) => v !== null && v !== undefined && v !== "") ?? "";
  return {
    ...pet,
    name: pick(p.name, pet.name),
    species: speciesLabel(pick(p.species?.name, d.species?.name)) || pet.species,
    breed: pick(p.breed, d.breed),
    sex: SEX_LABEL[pick(p.sex, d.sex)] ?? "",
    size: SIZE_LABEL[pick(p.size, d.size)] ?? "",
    color: pick(p.color, d.color),
    age: pick(ageFromBirthDate(p.birth_date ?? null), d.age_estimate),
    marks: pick(d.description, p.description, pet.marks),
    photoUrl: pick(d.photos?.[0], p.photo_url, pet.photoUrl) || null,
  };
}
