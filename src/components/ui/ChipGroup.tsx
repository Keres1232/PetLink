import "./ChipGroup.css";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  wrap?: boolean;
}

export default function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  wrap = true,
}: Props<T>) {
  return (
    <div className={`chip-group ${wrap ? "chip-group--wrap" : ""}`} role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip ${value === opt.value ? "chip--active" : ""}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
