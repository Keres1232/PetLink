import "./MapView.css";

function MapView({ children }) {
  return (
    <div className="map-view">
      <div className="map-view__canvas">
        {children}
      </div>
    </div>
  );
}

export default MapView;