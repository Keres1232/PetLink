import { useEffect, useRef, type ChangeEvent } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import "./PhotoPickerModal.css";

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onPick: (file: File) => void;
}

export default function PhotoPickerModal({
  open,
  title = "Agregar foto",
  onClose,
  onPick,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      onPick(file);
      onClose();
    }
  }

  return (
    <div className="photo-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="photo-modal__backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="photo-modal__sheet">
        <h2 className="photo-modal__title">{title}</h2>

        <button
          type="button"
          className="photo-modal__option"
          onClick={() => cameraRef.current?.click()}
        >
          <span className="photo-modal__icon">
            <Camera size={20} />
          </span>
          <span className="photo-modal__text">
            <strong>Tomar foto</strong>
            <small>Usa la cámara en este momento</small>
          </span>
        </button>

        <button
          type="button"
          className="photo-modal__option"
          onClick={() => galleryRef.current?.click()}
        >
          <span className="photo-modal__icon">
            <ImageIcon size={20} />
          </span>
          <span className="photo-modal__text">
            <strong>Elegir de galería</strong>
            <small>Selecciona una foto que ya tengas</small>
          </span>
        </button>

        <button type="button" className="photo-modal__cancel" onClick={onClose}>
          Cancelar
        </button>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleChange}
        />
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleChange} />
      </div>
    </div>
  );
}
