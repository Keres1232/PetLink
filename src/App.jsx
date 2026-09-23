import { useState } from "react";
import LoginScreen from "./assets/components/LoginScreen.jsx";
import RegisterScreen from "./assets/components/RegisterScreen.jsx";
import NavBar from "./assets/components/NavBar.jsx";
import PetCard from "./assets/components/PetCard.jsx";
import VetCard from "./assets/components/VetCard.jsx";
import AlertNotification from "./assets/components/AlertNotification.jsx";
import ForumPost from "./assets/components/ForumPost.jsx";
import "./App.css";

function App() {
  const [view, setView] = useState("login"); // "login" | "register" | "app"
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  const handleLoginSuccess = (email) => {
    setUserEmail(email);
    setView("app");
  };

  const handleCall = (name) => {
    console.log(`Llamando a: ${name}`);
  };

  const userName = userEmail.split("@")[0] || "usuario";

  if (view === "login") {
    return (
      <LoginScreen
        onBack={() => console.log("Volver")}
        onSwitchToRegister={() => setView("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterScreen
        onBack={() => setView("login")}
        onSwitchToLogin={() => setView("login")}
      />
    );
  }

  return (
    <div className="phone-frame">
      <main className="app">

        {activeTab === "home" && (
          <>
            {/* ============================
                HEADER
            ============================ */}
            <header className="home-header">
              <div>
                <p className="home-greeting">Hola, {userName}</p>
                <h1 className="home-title">Tu comunidad</h1>
              </div>

              <button className="home-bell" type="button" aria-label="Notificaciones">
                🔔
              </button>
            </header>

            {/* ============================
                ALERTA
            ============================ */}
            <section className="home-section">
              <AlertNotification
                title="Alerta cerca de ti"
                description="Se reportó un perrito perdido a 800 m de tu ubicación, en el Parque de Usaquén"
                onViewDetail={() => console.log("Ver detalle")}
                onNotMyArea={() => console.log("No es mi zona")}
              />
            </section>

            {/* ============================
                CERCA DE TI
            ============================ */}
            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">Cerca de ti</h2>
                <button className="home-section__link" type="button">
                  Ver todo
                </button>
              </div>

              <div className="cards-container">
                <PetCard
                  status="Perdido"
                  name="Nombre"
                  location="Parque Usaquén · hoy"
                />
                <PetCard
                  status="Perdido"
                  name="Nombre"
                  location="Parque Usaquén · hoy"
                />
              </div>
            </section>

            {/* ============================
                DE LA COMUNIDAD
            ============================ */}
            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">De la comunidad</h2>
                <button className="home-section__link" type="button">
                  Ver todo
                </button>
              </div>

              <ForumPost
                userName="Usuario"
                timeAgo="hace 2 horas"
                category="Pregunta"
                question="¿Alguien sabe qué puedo darle a mi perrita, tiene mucha comezón?"
                likes={12}
                replies={8}
              />
            </section>

            {/* ============================
                EN ADOPCIÓN
            ============================ */}
            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">En adopción</h2>
                <button className="home-section__link" type="button">
                  Ver todo
                </button>
              </div>

              <div className="cards-container">
                <PetCard
                  status="Adopción"
                  name="Nombre"
                  location="Parque Usaquén · hoy"
                />
                <PetCard
                  status="Adopción"
                  name="Nombre"
                  location="Parque Usaquén · hoy"
                />
              </div>
            </section>
          </>
        )}

        {/* ============================
            MAPA / VETERINARIAS
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

        {activeTab === "report" && (
          <section className="placeholder-section">
            <p>Formulario de reporte próximamente 🚧</p>
          </section>
        )}

        {activeTab === "community" && (
          <section className="placeholder-section">
            <p>Sección de comunidad próximamente 🚧</p>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="placeholder-section">
            <p>Perfil de usuario próximamente 🚧</p>
          </section>
        )}

        <NavBar active={activeTab} onNavigate={setActiveTab} />

      </main>
    </div>
  );
}

export default App;