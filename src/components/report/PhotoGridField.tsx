import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import PhotoPickerModal from "../ui/PhotoPickerModal";

interface Props {
  label: string;
  help?: string;
  max: number;
  photos: File[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}

export default function PhotoGridField({ label, help, max, photos, onAdd, onRemove }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  return (
    <div className="pc-field">
      <span className="pc-field-label">{label}</span>

      <div className="photo-grid">
        {photos.map((file, i) => (
          <div key={`${file.name}-${i}`} className="photo-grid__item">
            <img src={previews[i]} alt={`Foto ${i + 1}`} />
            <button
              type="button"
              className="photo-grid__remove"
              onClick={() => onRemove(i)}
              aria-label={`Quitar foto ${i + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            className="photo-grid__add"
            onClick={() => setPickerOpen(true)}
            aria-label="Agregar foto"
          >
            <Plus size={22} />
            <span>Agregar foto</span>
          </button>
        )}
      </div>

      {help && <p className="pc-muted location-help">{help}</p>}

      <PhotoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onAdd}
      />
    </div>
  );
}
