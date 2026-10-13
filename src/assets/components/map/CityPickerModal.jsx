import ListPickerModal from "../shared/ListPickerModal.jsx";

const CITIES = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Manizales",
  "Villavicencio",
  "Pasto",
  "Neiva",
  "Armenia",
  "Montería",
  "Valledupar",
  "Popayán",
  "Sincelejo",
  "Tunja",
  "Riohacha",
  "Florencia",
  "Quibdó",
  "Yopal",
];

const CITY_ITEMS = CITIES.map((city) => ({ id: city, label: city }));

/** Ciudad por defecto (Ajustes / Editar perfil). */
function CityPickerModal({ open, value, onClose, onSelect }) {
  return (
    <ListPickerModal
      open={open}
      title="Ciudad por defecto"
      subtitle="Elige la ciudad donde quieres ver publicaciones."
      searchPlaceholder="Busca tu ciudad..."
      emptyText="No encontramos esa ciudad."
      items={CITY_ITEMS}
      value={value}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}

export default CityPickerModal;
