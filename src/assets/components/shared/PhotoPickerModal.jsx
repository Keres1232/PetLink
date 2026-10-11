import cameraIcon from "../../svg/AgregarPhoto/Camara.svg";
import galleryIcon from "../../svg/AgregarPhoto/Photo.svg";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll.js";
import useSwipeToClose from "../../../hooks/useSwipeToClose.js";
import "./PhotoPickerModal.css";

function PhotoPickerModal({ open, onClose, onFile }) {
    useLockBodyScroll(open);
    const swipe = useSwipeToClose(onClose);  
  
    if (!open) return null;

  const handle = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile?.(file);
    e.target.value = "";
    onClose?.();
  };

  return (
    <div className="photo-picker__overlay" onClick={onClose}>
      <div className="photo-picker__sheet" {...swipe} onClick={(e) => e.stopPropagation()}>
        <span className="photo-picker__handle" />

        <h2 className="photo-picker__title">Agregar foto</h2>

        {/* capture abre la cámara en el celular */}
        <label className="photo-picker__option">
          <span className="photo-picker__icon">
            <img src={cameraIcon} alt="" />
          </span>
          <span className="photo-picker__text">
            <span className="photo-picker__option-title">Tomar foto</span>
            <span className="photo-picker__option-desc">Usa la cámara en este momento</span>
          </span>
          <input type="file" accept="image/*" capture="environment" onChange={handle} hidden />
        </label>

        <label className="photo-picker__option">
          <span className="photo-picker__icon">
            <img src={galleryIcon} alt="" />
          </span>
          <span className="photo-picker__text">
            <span className="photo-picker__option-title">Elegir de galería</span>
            <span className="photo-picker__option-desc">Selecciona una foto que ya tengas</span>
          </span>
          <input type="file" accept="image/*" onChange={handle} hidden />
        </label>

        <button type="button" className="photo-picker__cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default PhotoPickerModal;