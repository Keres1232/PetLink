import { ageFromBirthDate, dayLabel, distanceLabel } from "./format";

const SEX_LABEL = { male: "Macho", female: "Hembra", unknown: "No sé" };
const SIZE_LABEL = { small: "Pequeño", medium: "Mediano", large: "Grande" };
const SPECIES_ES = { dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo", ferret: "Hurón", other: "Otro" };
const speciesLabel = (name) => (name ? SPECIES_ES[name.toLowerCase()] ?? name : "");

/**
 * Reporte de reports_near / report_by_id -> ficha que usan PetCard / PetDetailModal.
 * Desde la migración 0042 (web-development) esas RPC ya traen raza, sexo, tamaño, color, edad y
 * dueño, mezclados por la BD con los de la mascota: llegan completos para CUALQUIER usuario
 * (como reportToDetailData de la web). Antes se ignoraban y la ficha salía vacía en otras cuentas.
 */
export function reportToPet(r) {
  const lost = r.type === "lost";
  return {
    id: r.id,
    isReport: true,
    name: r.pet_name ?? (lost ? "Mascota perdida" : "Mascota encontrada"),
    species: speciesLabel(r.species_name),
    status: lost ? "Perdido" : "Encontrado",
    // Desde Comunidad (report_by_id) puede no venir la distancia
    location: r.distance_m == null ? dayLabel(r.created_at) : `${distanceLabel(r.distance_m)} · ${dayLabel(r.created_at)}`,
    breed: r.breed ?? "",
    age: (r.pet_birth_date ? ageFromBirthDate(r.pet_birth_date) : null) ?? r.age_estimate ?? "",
    sex: SEX_LABEL[r.sex] ?? "",
    size: SIZE_LABEL[r.size] ?? "",
    color: r.color ?? "",
    marks: r.description,
    ownerId: r.user_id ?? null, // "Publicado por" y no contactarse a uno mismo
    ownerName: r.owner_name ?? null,
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
    breed: pick(p.breed, d.breed, pet.breed),
    sex: SEX_LABEL[pick(p.sex, d.sex)] ?? pet.sex ?? "",
    size: SIZE_LABEL[pick(p.size, d.size)] ?? pet.size ?? "",
    color: pick(p.color, d.color, pet.color),
    age: pick(ageFromBirthDate(p.birth_date ?? null), d.age_estimate, pet.age),
    marks: pick(d.description, p.description, pet.marks),
    photoUrl: pick(d.photos?.[0], p.photo_url, pet.photoUrl) || null,
  };
}
