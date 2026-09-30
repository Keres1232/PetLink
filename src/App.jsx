import { useState } from "react";
import LoginScreen from "./assets/components/LoginScreen.jsx";
import RegisterScreen from "./assets/components/RegisterScreen.jsx";
import NavBar from "./assets/components/NavBar.jsx";
import PetCard from "./assets/components/PetCard.jsx";
import VetCard from "./assets/components/VetCard.jsx";
import AlertNotification from "./assets/components/AlertNotification.jsx";
import ForumPost from "./assets/components/ForumPost.jsx";
import CircleIconButton from "./assets/components/CircleIconButton.jsx";
import PillButton from "./assets/components/PillButton.jsx";
import NotificationsPage from "./assets/components/NotificationsPage.jsx";
import MapFilterTabs from "./assets/components/MapFilterTabs.jsx";
import MapView from "./assets/components/MapView.jsx";
import ProfileCard from "./assets/components/ProfileCard.jsx";
import ProfileStats from "./assets/components/ProfileStats.jsx";
import MyPetsSection from "./assets/components/MyPetsSection.jsx";
import AccountSection from "./assets/components/AccountSection.jsx";
import ReportModal from "./assets/components/ReportModal.jsx";
import SettingsPage from "./assets/components/SettingsPage.jsx";
import backIcon from "./assets/svg/Back.svg";
import bellIcon from "./assets/svg/bell.svg";
import verTodoIcon from "./assets/svg/Ver_todo.svg";
import "./App.css";

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="#000000" strokeWidth="2" />
    <path
      d="M19.4 15C19.13 15.64 19.13 16.36 19.4 17L20.4 18.73C20.6 19.08 20.54 19.52 20.25 19.81L19.03 21.03C18.74 21.32 18.3 21.38 17.95 21.18L16.22 20.18C15.58 19.91 14.86 19.91 14.22 20.18C13.6 20.44 13.13 20.94 12.92 21.58L12.5 23H10.5L10.08 21.58C9.87 20.94 9.4 20.44 8.78 20.18C8.14 19.91 7.42 19.91 6.78 20.18L5.05 21.18C4.7 21.38 4.26 21.32 3.97 21.03L2.75 19.81C2.46 19.52 2.4 19.08 2.6 18.73L3.6 17C3.87 16.36 3.87 15.64 3.6 15C3.34 14.38 2.84 13.9 2.2 13.7L0.78 13.27V11.27L2.2 10.84C2.84 10.64 3.34 10.17 3.6 9.55C3.87 8.91 3.87 8.19 3.6 7.55L2.6 5.82C2.4 5.47 2.46 5.03 2.75 4.74L3.97 3.52C4.26 3.23 4.7 3.17 5.05 3.37L6.78 4.37C7.42 4.64 8.14 4.64 8.78 4.37C9.4 4.11 9.87 3.61 10.08 2.97L10.5 1.55H12.5L12.92 2.97C13.13 3.61 13.6 4.11 14.22 4.37C14.86 4.64 15.58 4.64 16.22 4.37L17.95 3.37C18.3 3.17 18.74 3.23 19.03 3.52L20.25 4.74C20.54 5.03 20.6 5.47 20.4 5.82L19.4 7.55C19.13 8.19 19.13 8.91 19.4 9.55C19.66 10.17 20.16 10.64 20.8 10.84L22.22 11.27V13.27L20.8 13.7C20.16 13.9 19.66 14.38 19.4 15Z"
      stroke="#000000"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function App() {
  const [view, setView] = useState("login");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLoginSuccess = (email) => {
    setUserEmail(email);
    setView("app");
  };

  const handleCall = (name) => {
    console.log(`Llamando a: ${name}`);
  };

  const goHome = () => setActiveTab("home");
  const openNotifications = () => setShowNotifications(true);

  const userName = userEmail.split("@")[0] || "usuario";

  /* ============================
     LOGIN / REGISTRO
  ============================ */
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

  /* ============================
     NOTIFICACIONES
  ============================ */
  if (showNotifications) {
    return (
      <div className="phone-frame">
        <main className="app">
          <NotificationsPage onBack={() => setShowNotifications(false)} />

          <NavBar
            active={activeTab}
            onNavigate={(id) => {
              if (id === "report") {
                setShowNotifications(false);
                setShowReportModal(true);
              } else {
                setActiveTab(id);
                setShowNotifications(false);
              }
            }}
          />
        </main>
      </div>
    );
  }

  /* ============================
     AJUSTES
  ============================ */
  if (showSettings) {
    return (
      <div className="phone-frame">
        <main className="app">
          <SettingsPage
            onBack={() => setShowSettings(false)}
            onNotifications={() => {
              setShowSettings(false);
              setShowNotifications(true);
            }}
          />

          <NavBar
            active={activeTab}
            onNavigate={(id) => {
              setShowSettings(false);
              if (id === "report") {
                setShowReportModal(true);
              } else {
                setActiveTab(id);
              }
            }}
          />
        </main>
      </div>
    );
  }

  /* ============================
     APP PRINCIPAL
  ============================ */
  return (
    <div className="phone-frame">
      <main className="app">

        {/* ============================
            INICIO
        ============================ */}
        {activeTab === "home" && (
          <>
            <header className="home-header">
              <div>
                <p className="home-greeting">Hola, {userName}</p>
                <h1 className="home-title">Tu comunidad</h1>
              </div>

              <CircleIconButton
                icon={bellIcon}
                iconAlt="Notificaciones"
                ariaLabel="Notificaciones"
                onClick={openNotifications}
              />
            </header>

            <section className="home-section">
              <AlertNotification
                title="Alerta cerca de ti"
                description="Se reportó un perrito perdido a 800 m de tu ubicación, en el Parque de Usaquén"
                onViewDetail={() => console.log("Ver detalle")}
                onNotMyArea={() => console.log("No es mi zona")}
              />
            </section>

            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">Cerca de ti</h2>
                <PillButton
                  icon={verTodoIcon}
                  iconAlt="Ver todo"
                  label="Ver todo"
                  onClick={() => console.log("Ver todo: Cerca de ti")}
                />
              </div>

              <div className="cards-container">
                <PetCard status="Perdido" name="Nombre" location="Parque Usaquén · hoy" />
                <PetCard status="Perdido" name="Nombre" location="Parque Usaquén · hoy" />
              </div>
            </section>

            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">De la comunidad</h2>
                <PillButton
                  icon={verTodoIcon}
                  iconAlt="Ver todo"
                  label="Ver todo"
                  onClick={() => console.log("Ver todo: De la comunidad")}
                />
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

            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">En adopción</h2>
                <PillButton
                  icon={verTodoIcon}
                  iconAlt="Ver todo"
                  label="Ver todo"
                  onClick={() => console.log("Ver todo: En adopción")}
                />
              </div>

              <div className="cards-container">
                <PetCard status="Adopción" name="Nombre" location="Parque Usaquén · hoy" />
                <PetCard status="Adopción" name="Nombre" location="Parque Usaquén · hoy" />
              </div>
            </section>
          </>
        )}

        {/* ============================
            MAPA
        ============================ */}
        {activeTab === "map" && (
          <>
            <header className="page-header">
              <CircleIconButton
                icon={backIcon}
                iconAlt="Volver"
                ariaLabel="Volver"
                onClick={goHome}
              />
              <h1 className="page-header__title">Mapa</h1>
              <CircleIconButton
                icon={bellIcon}
                iconAlt="Notificaciones"
                ariaLabel="Notificaciones"
                onClick={openNotifications}
              />
            </header>

            <MapFilterTabs
              onChange={(filter) => console.log("Filtro seleccionado:", filter)}
            />

            <MapView />

            <section className="home-section">
              <div className="home-section__header">
                <h2 className="home-section__title">Cerca de ti</h2>
              </div>

              <div className="vets-container">
                <VetCard name="Toby · Perdido" info="Parque de Usaquén · 1.2 km" badge="HOY" />
                <VetCard name="Lola · Perdido" info="Parque de Usaquén · 1.2 km" badge="HOY" />
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
              </div>
            </section>
          </>
        )}

        {/* ============================
            COMUNIDAD
        ============================ */}
        {activeTab === "community" && (
          <>
            <header className="page-header">
              <CircleIconButton
                icon={backIcon}
                iconAlt="Volver"
                ariaLabel="Volver"
                onClick={goHome}
              />
              <h1 className="page-header__title">Comunidad</h1>
              <CircleIconButton
                icon={bellIcon}
                iconAlt="Notificaciones"
                ariaLabel="Notificaciones"
                onClick={openNotifications}
              />
            </header>

            <section className="placeholder-section">
              <p>Sección de comunidad próximamente 🚧</p>
            </section>
          </>
        )}

        {/* ============================
            PERFIL
        ============================ */}
        {activeTab === "profile" && (
          <>
            <header className="page-header">
              <CircleIconButton
                icon={backIcon}
                iconAlt="Volver"
                ariaLabel="Volver"
                onClick={goHome}
              />
              <h1 className="page-header__title">Mi perfil</h1>

              <button
                type="button"
                className="circle-icon-button"
                onClick={() => setShowSettings(true)}
                aria-label="Ajustes"
              >
                <span className="circle-icon-button__shadow" aria-hidden="true" />
                <span className="circle-icon-button__circle">
                  <SettingsIcon />
                </span>
              </button>
            </header>

            <section className="home-section">
              <ProfileCard
                name="Angely Parra"
                location="Engativá, Bogotá"
                memberLabel="Miembro"
                onEditPhoto={() => console.log("Editar foto")}
              />
            </section>

            <section className="home-section">
              <ProfileStats pets={2} posts={14} activeReports={0} />
            </section>

            <section className="home-section">
              <MyPetsSection
                pets={[
                  { id: 1, name: "Nombre", species: "Gato", location: "Parque Usaquén · hoy" },
                  { id: 2, name: "Nombre", species: "Perro", location: "Parque Usaquén · hoy" },
                ]}
                onEnroll={() => console.log("Inscribir mascota")}
                onPetClick={(pet) => console.log("Ver mascota:", pet)}
              />
            </section>

            <AccountSection
              onOptionClick={(id) => {
                if (id === "logout") {
                  setView("login");
                } else {
                  console.log("Opción seleccionada:", id);
                }
              }}
            />
          </>
        )}

        {/* ============================
            MODAL DE REPORTAR
        ============================ */}
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSelectOption={(optionId) => {
            console.log("Opción elegida:", optionId);
            setShowReportModal(false);
          }}
          onCommunityPost={() => {
            setShowReportModal(false);
            setActiveTab("community");
          }}
        />

        <NavBar
          active={activeTab}
          onNavigate={(id) => {
            if (id === "report") {
              setShowReportModal(true);
            } else {
              setActiveTab(id);
            }
          }}
        />

      </main>
    </div>
  );
}

export default App;