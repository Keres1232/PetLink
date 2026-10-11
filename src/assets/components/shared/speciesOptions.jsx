import dogIcon from "../../svg/Inscribir/perro.svg";
import catIcon from "../../svg/Inscribir/gato.svg";

// Especies que no se deben mostrar
const HIDDEN_SPECIES = ["ferret", "rabbit"];

const heartIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20.5C12 20.5 3 15.5 3 9C3 6 5.5 4 8 4C10 4 11.3 5.2 12 6.3C12.7 5.2 14 4 16 4C18.5 4 21 6 21 9C21 15.5 12 20.5 12 20.5Z"
      stroke="#7519FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const kindOf = (name) => {
  const n = name.toLowerCase();
  if (n.includes("perr") || n.includes("dog") || n.includes("canin")) return "dog";
  if (n.includes("gat") || n.includes("cat") || n.includes("felin")) return "cat";
  return "other";
};

// Siempre se muestran en este orden: Perro, Gato, Otro
const CHIPS = [
  { kind: "dog", label: "Perro", icon: dogIcon },
  { kind: "cat", label: "Gato", icon: catIcon },
  { kind: "other", label: "Otro", icon: heartIcon },
];

/** Especies de la base de datos -> botones Perro / Gato / Otro para ChipGroup. */
export function speciesChipOptions(species = []) {
  const visible = species.filter((s) => !HIDDEN_SPECIES.includes(s.name.toLowerCase()));
  return CHIPS.map((chip) => {
    const matches = visible.filter((s) => kindOf(s.name) === chip.kind);
    const match =
      chip.kind === "other"
        ? matches.find((s) => ["other", "otro"].includes(s.name.toLowerCase())) ?? matches[0]
        : matches[0];
    return match && { id: match.id, label: chip.label, icon: chip.icon };
  }).filter(Boolean);
}
