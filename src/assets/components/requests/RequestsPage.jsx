import { useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import SearchBar from "../shared/SearchBar.jsx";
import MapFilterTabs from "../map/MapFilterTabs.jsx";
import RequestCard from "./RequestCard.jsx";
import backIcon from "../../svg/Back.svg";
import "./RequestsPage.css";

const TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
];

const FILTERS = ["Todo", "Por clasificar", "Médicos veterinarios", "Veterinarias", "Refugios"];
const TYPE_BY_FILTER = {
  "Por clasificar": "establishment",
  "Médicos veterinarios": "doctor",
  Veterinarias: "vet",
  Refugios: "refuge",
};

const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function RequestsPage({ requests = [], initialTab = "pending", onBack, onReview }) {
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState("Todo");
  const [query, setQuery] = useState("");

  const count = (status) => requests.filter((r) => r.status === status).length;

  const visible = requests.filter(
    (r) =>
      r.status === tab &&
      (filter === "Todo" || r.type === TYPE_BY_FILTER[filter]) &&
      normalize(r.name).includes(normalize(query))
  );

  return (
    <>
      <AppHeader title="Solicitudes" leftIcon={backIcon} onLeft={onBack} />

      <div className="requests">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por nombre" />

        <div className="requests__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`requests__tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="requests__tab-count">{count(t.id)}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="requests__filters">
          <MapFilterTabs filters={FILTERS} onChange={setFilter} />
        </div>

        <div className="requests__list">
          {visible.length === 0 && <p className="requests__empty">No hay solicitudes aquí.</p>}
          {visible.map((r) => (
            <RequestCard key={r.id} request={r} onReview={onReview} />
          ))}
        </div>
      </div>
    </>
  );
}

export default RequestsPage;