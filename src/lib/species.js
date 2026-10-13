// Catálogo de especies (en español desde la migración 0051 de Supabase)

const normalize = (name = "") =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

// El catálogo está en español (migración 0051), pero se aceptan también los nombres viejos en inglés
const isDog = (name) => ["perro", "dog"].includes(normalize(name));
const isCat = (name) => ["gato", "cat"].includes(normalize(name));
export const isOtherEntry = (name) => ["otro", "other"].includes(normalize(name));

/** Separa el catálogo: Perro y Gato van en botones; el resto, en la lista de "Otro" (A-Z, "Otro" al final). */
export function splitSpecies(species = []) {
  const dog = species.find((s) => isDog(s.name)) ?? null;
  const cat = species.find((s) => isCat(s.name)) ?? null;
  const others = species
    .filter((s) => s !== dog && s !== cat)
    .sort((a, b) => {
      if (isOtherEntry(a.name) !== isOtherEntry(b.name)) return isOtherEntry(a.name) ? 1 : -1;
      return a.name.localeCompare(b.name, "es");
    });
  return { dog, cat, others };
}

/** Especie por defecto de un formulario nuevo: Perro (o la primera que haya). */
export function defaultSpeciesId(species = []) {
  return splitSpecies(species).dog?.id ?? species[0]?.id ?? "";
}
