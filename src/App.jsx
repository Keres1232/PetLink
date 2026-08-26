import { useState } from "react";
import NavBar from "./assets/components/NavBar.jsx";
import PetCard from "./assets/components/PetCard.jsx";
import "./App.css";
import VetCard from "./assets/components/VetCard.jsx";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const handleCall = (name) => {
    console.log(`Llamando a: ${name}`);
    // Aquí luego puedes integrar window.location.href = `tel:${numero}`
  };

  return (
    <main className="app">

      <h1 className="app-title">
        PetLink
      </h1>

      <p className="app-description">
        Tarjetas de publicaciones
      </p>

      {/* ============================
          SECCIÓN: MASCOTAS
      ============================ */}
      {activeTab === "home" && (
        <section className="cards-container">

          <PetCard
            status="Perdido"
            name="Max"
            location="Parque Usaquén · hoy"
          />

          <PetCard
            status="Encontrado"
            name="Luna"
            location="Suba · ayer"
          />

          <PetCard
            status="Adopción"
            name="Milo"
            location="Bogotá · hoy"
          />

          <PetCard
            status="Rescatado"
            name="Rocky"
            location="Engativá · ayer"
          />

        </section>
      )}

      {/* ============================
          SECCIÓN: VETERINARIAS
      ============================ */}
      {activeTab === "map" && (
        <section className="vets-container">

          <VetCard
            name="Veterinaria Laika"
            info="Abierto 24 horas · 1.2 km"
            onCall={() => handleCall("Veterinaria Laika")}
          />

          <VetCard
            name="Clínica Veterinaria San Roque"
            info="Cierra a las 8pm · 2.4 km"
            onCall={() => handleCall("Clínica Veterinaria San Roque")}
          />

          <VetCard
            name="Pet Center Bogotá"
            info="Abierto ahora · 3.1 km"
            onCall={() => handleCall("Pet Center Bogotá")}
          />

        </section>
      )}

      {/* ============================
          SECCIÓN: REPORTAR (placeholder)
      ============================ */}
      {activeTab === "report" && (
        <section className="placeholder-section">
          <p>Formulario de reporte próximamente 🚧</p>
        </section>
      )}

      {/* ============================
          SECCIÓN: COMUNIDAD (placeholder)
      ============================ */}
      {activeTab === "community" && (
        <section className="placeholder-section">
          <p>Sección de comunidad próximamente 🚧</p>
        </section>
      )}

      {/* ============================
          SECCIÓN: PERFIL (placeholder)
      ============================ */}
      {activeTab === "profile" && (
        <section className="placeholder-section">
          <p>Perfil de usuario próximamente 🚧</p>
        </section>
      )}

      {/* ============================
          BARRA DE NAVEGACIÓN
      ============================ */}
      <NavBar active={activeTab} onNavigate={setActiveTab} />

    </main>
  );
}

export default App;