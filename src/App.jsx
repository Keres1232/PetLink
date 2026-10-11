import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { myPets, createPet, listSpecies, uploadPhoto } from "./lib/api";
import LoginScreen from "./assets/components/auth/LoginScreen.jsx";
import RegisterScreen from "./assets/components/auth/RegisterScreen.jsx";
import NavBar from "./assets/components/shared/NavBar.jsx";
import CircleIconButton from "./assets/components/shared/CircleIconButton.jsx";
import PawBackground from "./assets/components/shared/PawBackground.jsx";
import ConfirmModal from "./assets/components/shared/ConfirmModal.jsx";
import PhotoPickerModal from "./assets/components/shared/PhotoPickerModal.jsx";
import HomePage from "./assets/components/home/HomePage.jsx";
import MapPage from "./assets/components/map/MapPage.jsx";
import CommunityPage from "./assets/components/community/CommunityPage.jsx";
import NotificationsPage from "./assets/components/notifications/NotificationsPage.jsx";
import HelpPage from "./assets/components/help/HelpPage.jsx";
import PetListPage from "./assets/components/pets/PetListPage.jsx";
import PetDetailModal from "./assets/components/pets/PetDetailModal.jsx";
import AddPetPage from "./assets/components/pets/AddPetPage.jsx";
import MyPetsSection from "./assets/components/profile/MyPetsSection.jsx";
import ProfileCard from "./assets/components/profile/ProfileCard.jsx";
import ProfileStats from "./assets/components/profile/ProfileStats.jsx";
import AccountSection from "./assets/components/profile/AccountSection.jsx";
import ManagementSection from "./assets/components/profile/ManagementSection.jsx";
import SettingsPage from "./assets/components/profile/SettingsPage.jsx";
import ChangeEmailPage from "./assets/components/profile/ChangeEmailPage.jsx";
import ChangePasswordPage from "./assets/components/profile/ChangePasswordPage.jsx";
import CityPickerModal from "./assets/components/map/CityPickerModal.jsx";
import VerificationPage from "./assets/components/auth/VerificationPage.jsx";
import ReportModal from "./assets/components/reports/ReportModal.jsx";
import ReportLostPage from "./assets/components/reports/ReportLostPage.jsx";
import ReportFoundPage from "./assets/components/reports/ReportFoundPage.jsx";
import ReportAdoptionPage from "./assets/components/reports/ReportAdoptionPage.jsx";
import RequestsPage from "./assets/components/requests/RequestsPage.jsx";
import ReviewRequestPage from "./assets/components/requests/ReviewRequestPage.jsx";
import backIcon from "./assets/svg/Back.svg";
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

const sample = (id, species, status) => ({
  id,
  name: "Nombre",
  species,
  status,
  location: "Parque Usaquén · hoy",
  breed: "Mestizo",
  age: "2 años",
  sex: "Macho",
  size: "Mediano",
  color: "Gris",
  marks:
    "Pecho y patas blancas, ojos verdes. Tiene una pequeña mancha oscura en la nariz y una marca en la oreja izquierda.",
});

const SPECIES_CYCLE = ["Perro", "Gato"];

const makeList = (n, status) =>
  Array.from({ length: n }, (_, i) => {
    const species = SPECIES_CYCLE[i % 2];
    return sample(i + 1, species, status ?? species);
  });

const ADOPTION_PETS = makeList(6);
const FOUND_PETS = makeList(6);
const NEAR_PETS = makeList(6, "Perdido");

const INITIAL_REQUESTS = [
  { id: 1, type: "vet", status: "pending", name: "Nombre", location: "Engativá, Bogotá" },
  { id: 2, type: "doctor", status: "pending", name: "Nombre", location: "Engativá, Bogotá" },
  { id: 3, type: "refuge", status: "approved", name: "Nombre", location: "Engativá, Bogotá" },
  { id: 4, type: "vet", status: "approved", name: "Nombre", location: "Engativá, Bogotá" },
  { id: 5, type: "doctor", status: "rejected", name: "Nombre", location: "Engativá, Bogotá" },
].map((r) => ({
  ...r,
  email: "contacto@correo.com",
  address: "Cll 1 #2-3, Usaquén",
  description:
    "Texto con la descripción que la veterinaria escribió al enviar su solicitud: servicios, horarios y por qué quiere unirse a PetClue.",
  documents: [
    { id: 1, name: "Documento de registro" },
    { id: 2, name: "Identificación del responsable" },
  ],
}));

const CONFIRMS = {
  logout: {
    title: "¿Estás seguro que quieres cerrar sesión?",
    description:
      "Tu cuenta quedará desconectada y tendrás que iniciar sesión nuevamente para volver a acceder a PetClue.",
    confirmLabel: "Sí, cerrar sesión",
  },
  deactivate: {
    title: "¿Estás seguro que quieres desactivar tu cuenta?",
    description:
      "Tu cuenta quedará desactivada temporalmente. Tu perfil y tu información permanecerán guardados, y podrás volver a activar tu cuenta cuando decidas regresar a PetClue.",
    confirmLabel: "Sí, desactivar cuenta",
  },
  delete: {
    title: "¿Estás seguro que quieres eliminar tu cuenta?",
    description:
      "Esta acción es permanente y no podrás recuperar tu cuenta una vez eliminada. Se eliminarán tu perfil y tus datos asociados según nuestra política de privacidad.",
    confirmLabel: "Sí, eliminar cuenta",
  },
};

const SEX_LABEL = { male: "Macho", female: "Hembra", unknown: "No sé" };
const SIZE_LABEL = { small: "Pequeño", medium: "Mediano", large: "Grande" };

const normalizeSpeciesName = (name) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function App() {
  const { user, profile, loading, signOut } = useAuth();

  const [authView, setAuthView] = useState("login");
  const [newAccountEmail, setNewAccountEmail] = useState("");

  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showReportLost, setShowReportLost] = useState(false);
  const [showReportFound, setShowReportFound] = useState(false);
  const [showReportAdoption, setShowReportAdoption] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [listPage, setListPage] = useState(null);

  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [requestsTab, setRequestsTab] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const [selectedPet, setSelectedPet] = useState(null);
  const [profilePhotoOpen, setProfilePhotoOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [city, setCity] = useState("Bogotá");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  // Mascotas reales
  const [pets, setPets] = useState([]);
  const [species, setSpecies] = useState([]);

  const loadPets = useCallback(async () => {
    try {
      const rows = await myPets();
      setPets(
        rows.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species?.name ?? "Otro",
          status: p.species?.name ?? "Otro",
          location: "",
          breed: p.breed ?? "",
          color: p.color ?? "",
          sex: SEX_LABEL[p.sex] ?? "",
          size: SIZE_LABEL[p.size] ?? "",
          marks: p.description ?? "",
          photoUrl: p.photo_url,
        }))
      );
    } catch (e) {
      console.error("No se pudieron cargar las mascotas", e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPets();
      listSpecies().then(setSpecies).catch(console.error);
    } else {
      setPets([]);
    }
  }, [user, loadPets]);

  const savePet = async (pet) => {
    try {
      let availableSpecies = species;
      let selectedSpecies = availableSpecies.find(
        (item) => normalizeSpeciesName(item.name) === normalizeSpeciesName(pet.species)
      );

      if (!selectedSpecies) {
        availableSpecies = await listSpecies();
        setSpecies(availableSpecies);
        selectedSpecies = availableSpecies.find(
          (item) => normalizeSpeciesName(item.name) === normalizeSpeciesName(pet.species)
        );
      }

      if (!selectedSpecies) {
        throw new Error(
          `La especie "${pet.species}" no está disponible. Verifica que exista y esté aprobada en el catálogo de especies.`
        );
      }

      const sex = { Macho: "male", Hembra: "female" }[pet.sex] ?? "unknown";
      const size = { Pequeño: "small", Mediano: "medium", Grande: "large" }[pet.size] ?? null;

      let photoUrl = null;
      if (pet.photoFile) photoUrl = await uploadPhoto(pet.photoFile, "pet-photos");

      await createPet({
        name: pet.name.trim(),
        speciesId: selectedSpecies.id,
        description: pet.marks || null,
        birthDate: null,
        photoUrl,
        sex,
        breed: pet.breed || null,
        color: pet.color || null,
        size,
      });
      await loadPets();
      setShowAddPet(false);
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? `No se pudo guardar la mascota: ${e.message}`
          : "No se pudo guardar la mascota. Revisa la consola (F12)."
      );
    }
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };
  const goHome = () => setActiveTab("home");
  const openNotifications = () => setShowNotifications(true);

  const decide = (request, status) => {
    setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, status } : r)));
    setReviewing(null);
  };

  const userEmail = user?.email ?? "";
  const userName = profile?.name ?? userEmail.split("@")[0] ?? "usuario";
  const isAdmin = profile?.role === "admin";
  const countBy = (status) => requests.filter((r) => r.status === status).length;

  const sharedModals = (
    <>
      <PetDetailModal
        pet={selectedPet}
        onClose={() => setSelectedPet(null)}
        onContact={(pet) => console.log("Contactar dueño de:", pet.name)}
      />
      <PhotoPickerModal
        open={profilePhotoOpen}
        onClose={() => setProfilePhotoOpen(false)}
        onFile={(file) => setProfilePhoto(URL.createObjectURL(file))}
      />
    </>
  );

  const confirmModal = (
    <ConfirmModal
      open={Boolean(confirmAction)}
      {...(CONFIRMS[confirmAction] ?? {})}
      onClose={() => setConfirmAction(null)}
      onConfirm={async () => {
        setConfirmAction(null);
        setShowSettings(false);
        setActiveTab("home");
        setAuthView("login");
        await signOut();
      }}
    />
  );

  const goTab = (close) => (id) => {
    close();
    if (id === "report") setShowReportModal(true);
    else setActiveTab(id);
  };

  /* CARGANDO */
  if (loading && user && authView !== "register") {
    return (
      <div className="phone-frame">
        <p style={{ padding: 24, fontFamily: "Kodchasan, sans-serif", color: "#66557e" }}>Cargando…</p>
      </div>
    );
  }

  /* SIN SESIÓN */
  if (!user || authView === "register") {
    return authView === "register" ? (
      <RegisterScreen
        onBack={() => setAuthView("login")}
        onSwitchToLogin={() => setAuthView("login")}
        onRegisterSuccess={({ email }) => {
          setNewAccountEmail(email);
          setAuthView("login");
        }}
      />
    ) : (
      <LoginScreen initialEmail={newAccountEmail} onSwitchToRegister={() => setAuthView("register")} />
    );
  }

  /* NOTIFICACIONES */
  if (showNotifications) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <NotificationsPage onBack={() => setShowNotifications(false)} />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowNotifications(false))} />
        </main>
      </div>
    );
  }

  /* REVISAR SOLICITUD (ADMIN) */
  if (reviewing) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ReviewRequestPage
            request={requests.find((r) => r.id === reviewing.id)}
            onBack={() => setReviewing(null)}
            onAccept={(r) => decide(r, "approved")}
            onReject={(r) => decide(r, "rejected")}
            onOpenDocument={(d) => console.log("Abrir documento:", d)}
          />
          <NavBar
            active={activeTab}
            onNavigate={goTab(() => {
              setReviewing(null);
              setRequestsTab(null);
            })}
          />
        </main>
      </div>
    );
  }

  /* SOLICITUDES (ADMIN) */
  if (requestsTab) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <RequestsPage
            requests={requests}
            initialTab={requestsTab}
            onBack={() => setRequestsTab(null)}
            onReview={setReviewing}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setRequestsTab(null))} />
        </main>
      </div>
    );
  }

  /* EN ADOPCIÓN / ENCONTRADOS */
  if (listPage) {
    const isAdoption = listPage === "adoption";
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <PetListPage
            title={isAdoption ? "En adopción" : "Encontrados"}
            pets={isAdoption ? ADOPTION_PETS : FOUND_PETS}
            onBack={() => setListPage(null)}
            onNotifications={() => {
              setListPage(null);
              setShowNotifications(true);
            }}
            onPetClick={setSelectedPet}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setListPage(null))} />
          {sharedModals}
        </main>
      </div>
    );
  }

  /* AYUDA */
  if (showHelp) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <HelpPage onBack={() => setShowHelp(false)} />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowHelp(false))} />
        </main>
      </div>
    );
  }

  /* REPORTAR PERDIDA */
  if (showReportLost) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ReportLostPage
            pets={pets}
            onBack={() => setShowReportLost(false)}
            onNotifications={() => {
              setShowReportLost(false);
              setShowNotifications(true);
            }}
            onNotListed={() => {
              setShowReportLost(false);
              setActiveTab("profile");
              setShowAddPet(true);
            }}
            onSubmit={(report) => {
              console.log("Alerta publicada:", report);
              setShowReportLost(false);
              setActiveTab("home");
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowReportLost(false))} />
        </main>
      </div>
    );
  }

  /* ENCONTRÉ MASCOTA */
  if (showReportFound) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ReportFoundPage
            onBack={() => setShowReportFound(false)}
            onNotifications={() => {
              setShowReportFound(false);
              setShowNotifications(true);
            }}
            onSubmit={(report) => {
              console.log("Alerta de mascota encontrada:", report);
              setShowReportFound(false);
              setActiveTab("home");
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowReportFound(false))} />
        </main>
      </div>
    );
  }

  /* DAR EN ADOPCIÓN */
  if (showReportAdoption) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ReportAdoptionPage
            onBack={() => setShowReportAdoption(false)}
            onNotifications={() => {
              setShowReportAdoption(false);
              setShowNotifications(true);
            }}
            onSubmit={(report) => {
              console.log("Mascota en adopción:", report);
              setShowReportAdoption(false);
              setShowVerification(true);
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowReportAdoption(false))} />
        </main>
      </div>
    );
  }

  /* SOLICITAR VERIFICACIÓN */
  if (showVerification) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <VerificationPage
            onBack={() => setShowVerification(false)}
            onNotifications={() => {
              setShowVerification(false);
              setShowNotifications(true);
            }}
            onSubmit={(request) => {
              console.log("Solicitud de verificación:", request);
              setShowVerification(false);
              setActiveTab("profile");
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowVerification(false))} />
        </main>
      </div>
    );
  }

  /* CAMBIAR CONTRASEÑA */
  if (showChangePassword) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ChangePasswordPage
            onBack={() => {
              setShowChangePassword(false);
              setShowSettings(true);
            }}
            onSubmit={() => {
              console.log("Contraseña actualizada");
              setShowChangePassword(false);
              setShowSettings(true);
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowChangePassword(false))} />
        </main>
      </div>
    );
  }

  /* CAMBIAR CORREO */
  if (showChangeEmail) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ChangeEmailPage
            currentEmail={userEmail}
            verified
            onBack={() => {
              setShowChangeEmail(false);
              setShowSettings(true);
            }}
            onSubmit={({ newEmail }) => {
              console.log("Enviar confirmación a:", newEmail);
              setShowChangeEmail(false);
              setShowSettings(true);
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowChangeEmail(false))} />
        </main>
      </div>
    );
  }

  /* AJUSTES */
  if (showSettings) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <SettingsPage
            onBack={() => setShowSettings(false)}
            onNotifications={() => {
              setShowSettings(false);
              setShowNotifications(true);
            }}
            onChangeEmail={() => {
              setShowSettings(false);
              setShowChangeEmail(true);
            }}
            onChangePassword={() => {
              setShowSettings(false);
              setShowChangePassword(true);
            }}
            onHelp={() => {
              setShowSettings(false);
              setShowHelp(true);
            }}
            city={city}
            onCityClick={() => setCityPickerOpen(true)}
            onDeactivate={() => setConfirmAction("deactivate")}
            onDelete={() => setConfirmAction("delete")}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowSettings(false))} />
          <CityPickerModal
            open={cityPickerOpen}
            value={city}
            onClose={() => setCityPickerOpen(false)}
            onSelect={setCity}
          />
          {confirmModal}
        </main>
      </div>
    );
  }

  /* INSCRIBIR MASCOTA */
  if (showAddPet) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <AddPetPage
            onBack={() => setShowAddPet(false)}
            onNotifications={() => {
              setShowAddPet(false);
              setShowNotifications(true);
            }}
            onSave={savePet}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowAddPet(false))} />
        </main>
      </div>
    );
  }

  /* APP PRINCIPAL */
  return (
    <div className="phone-frame">
      <main className="app">
        <PawBackground />

        {activeTab === "home" && (
          <HomePage
            userName={userName}
            nearPets={NEAR_PETS}
            adoptionPets={ADOPTION_PETS}
            foundPets={FOUND_PETS}
            onNotifications={openNotifications}
            onLost={() => setShowReportLost(true)}
            onFound={() => setShowReportFound(true)}
            onPetClick={setSelectedPet}
            onSeeAllNear={() => setActiveTab("map")}
            onSeeAllCommunity={() => setActiveTab("community")}
            onSeeAllAdoption={() => setListPage("adoption")}
            onSeeAllFound={() => setListPage("found")}
          />
        )}

        {activeTab === "map" && (
          <MapPage onBack={goHome} onNotifications={openNotifications} onCall={handleCall} />
        )}

        {activeTab === "community" && (
          <CommunityPage
            onBack={goHome}
            onNotifications={openNotifications}
            onShare={() => console.log("Crear publicación")}
            onPostClick={(post) => console.log("Ver publicación:", post)}
          />
        )}

        {activeTab === "profile" && (
          <>
            <header className="page-header">
              <CircleIconButton icon={backIcon} iconAlt="Volver" ariaLabel="Volver" onClick={goHome} />
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
                name={userName}
                location="Engativá, Bogotá"
                memberLabel={isAdmin ? "Administrador" : "Miembro"}
                photoUrl={profilePhoto}
                onEditPhoto={() => setProfilePhotoOpen(true)}
              />
            </section>

            <section className="home-section">
              {isAdmin ? (
                <ProfileStats
                  pets={countBy("pending")}
                  posts={countBy("approved")}
                  activeReports={countBy("rejected")}
                  labels={["Pendientes", "Aprobadas", "Rechazadas"]}
                />
              ) : (
                <ProfileStats pets={pets.length} posts={0} activeReports={0} />
              )}
            </section>

            {isAdmin ? (
              <ManagementSection
                onOptionClick={(id) => {
                  if (id === "pending") setRequestsTab("pending");
                  else if (id === "history") setRequestsTab("approved");
                  else console.log("Gestión:", id);
                }}
              />
            ) : (
              <section className="home-section">
                <MyPetsSection
                  pets={pets}
                  onEnroll={() => setShowAddPet(true)}
                  onPetClick={setSelectedPet}
                />
              </section>
            )}

            <AccountSection
              onOptionClick={(id) => {
                if (id === "logout") setConfirmAction("logout");
                else if (id === "help") setShowHelp(true);
                else if (id === "notifications") setShowNotifications(true);
                else if (id === "edit") setShowChangeEmail(true);
                else if (id === "verification") setShowVerification(true);
                else console.log("Opción seleccionada:", id);
              }}
            />
          </>
        )}

        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSelectOption={(optionId) => {
            setShowReportModal(false);
            if (optionId === "lost") setShowReportLost(true);
            else if (optionId === "found") setShowReportFound(true);
            else if (optionId === "adoption") setShowReportAdoption(true);
          }}
          onCommunityPost={() => {
            setShowReportModal(false);
            setActiveTab("community");
          }}
        />

        {sharedModals}
        {confirmModal}

        <NavBar
          active={activeTab}
          onNavigate={(id) => {
            if (id === "report") setShowReportModal(true);
            else setActiveTab(id);
          }}
        />
      </main>
    </div>
  );
}

export default App;