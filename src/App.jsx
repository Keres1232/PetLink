import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import {
  myPets,
  createPet,
  listSpecies,
  uploadPhoto,
  uploadPhotos,
  createAlert,
  updateAvatar,
  listVetApplications,
  reviewVetApplication,
  getVetDocumentUrl,
  uploadVetDocument,
  submitVetApplication,
  myVetApplication,
  reportsNear,
  updatePet,
  deletePet,
  changePassword,
  getCommentById,
  getPostByReportId,
} from "./lib/api";
import ForgotPasswordScreen from "./assets/components/auth/ForgotPasswordScreen.jsx";
import ResetPasswordScreen from "./assets/components/auth/ResetPasswordScreen.jsx";
import { ageFromBirthDate } from "./lib/format";
import { useUserLocation } from "./hooks/useUserLocation";
import { reportToPet } from "./lib/reportPet";
import { searchPlace } from "./lib/geocode";
import { supabase } from "./lib/supabase";
import { showNotification } from "./lib/notify";
import LoginScreen from "./assets/components/auth/LoginScreen.jsx";
import RegisterScreen from "./assets/components/auth/RegisterScreen.jsx";
import NavBar from "./assets/components/shared/NavBar.jsx";
import CircleIconButton from "./assets/components/shared/CircleIconButton.jsx";
import PawBackground from "./assets/components/shared/PawBackground.jsx";
import ConfirmModal from "./assets/components/shared/ConfirmModal.jsx";
import PhotoPickerModal from "./assets/components/shared/PhotoPickerModal.jsx";
import SuccessToast from "./assets/components/shared/SuccessToast.jsx";
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
import ModerationPage from "./assets/components/requests/ModerationPage.jsx";
import backIcon from "./assets/svg/Back.svg";
import "./App.css";

const HIDDEN_SPECIES = ["ferret", "rabbit"];

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

// Adopción todavía no tiene datos en la base: se muestran ejemplos
const ADOPTION_PETS = makeList(6);

// support_document_url guarda una ruta; las solicitudes viejas pueden traer dos separadas por coma
const DOC_NAMES = ["Documento de soporte", "Documento de identidad"];

// Fila de vet_applications -> forma que usan RequestsPage / ReviewRequestPage
const toRequest = (a) => ({
  id: a.id,
  type: a.target_role === "foundation" ? "refuge" : "doctor",
  status: a.status,
  name: a.applicant?.name ?? "Usuario",
  location: "",
  sentLabel: `Enviada ${new Date(a.created_at).toLocaleDateString("es-CO")}`,
  description: "",
  documents: (a.support_document_url ?? "")
    .split(",")
    .filter(Boolean)
    .map((path, i) => ({ id: i, name: DOC_NAMES[i] ?? `Documento ${i + 1}`, path })),
});

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
const SEX_DB = { Macho: "male", Hembra: "female", "No sé": "unknown" };

// Las especies vienen en inglés desde la base de datos
const SPECIES_ES = { dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo", ferret: "Hurón", other: "Otro" };
const speciesLabel = (name) => (name ? SPECIES_ES[name.toLowerCase()] ?? name : "Otro");
const SIZE_DB = { Pequeño: "small", Mediano: "medium", Grande: "large" };

function App() {
  const { user, profile, loading, signOut, recovering, endRecovery, authLinkError, clearAuthLinkError } = useAuth();

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

  const [requests, setRequests] = useState([]);
  const [requestsTab, setRequestsTab] = useState(null);
  const [moderationTab, setModerationTab] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const [selectedPet, setSelectedPet] = useState(null);
  const [profilePhotoOpen, setProfilePhotoOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null); // "saving" | "saved" | "error"
  const clearAvatarStatus = useCallback(() => setAvatarStatus(null), []);

  const [city, setCity] = useState("Bogotá");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  const [pets, setPets] = useState([]);
  const [species, setSpecies] = useState([]);
  const [contactPostId, setContactPostId] = useState(null);
  const [editingPet, setEditingPet] = useState(null);

  // Reportes reales cerca del usuario (Inicio: "Cerca de ti" y "Encontrados")
  const { point: userPoint, radius, loading: locLoading } = useUserLocation();
  const [nearReports, setNearReports] = useState([]);

  const loadNear = useCallback(async () => {
    try {
      setNearReports((await reportsNear(userPoint, radius, 20)).map(reportToPet));
    } catch (e) {
      console.error("No se pudieron cargar los reportes cercanos", e);
    }
  }, [userPoint, radius]);

  useEffect(() => {
    if (user && !locLoading) void loadNear();
  }, [user, locLoading, loadNear]);

  const nearLost = nearReports.filter((p) => p.status === "Perdido");
  const nearFound = nearReports.filter((p) => p.status === "Encontrado");

  const loadPets = useCallback(async () => {
    try {
      const rows = await myPets();
      setPets(
        rows.map((p) => ({
          id: p.id,
          name: p.name,
          speciesId: p.species_id,
          species: speciesLabel(p.species?.name),
          status: speciesLabel(p.species?.name),
          location: "",
          breed: p.breed ?? "",
          age: ageFromBirthDate(p.birth_date) ?? "",
          birthDate: p.birth_date,
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
      listSpecies()
        .then((s) => setSpecies(s.filter((x) => !HIDDEN_SPECIES.includes(x.name.toLowerCase()))))
        .catch((e) => console.error("No se pudo cargar species", e));
    } else {
      setPets([]);
    }
  }, [user, loadPets]);

  const loadRequests = useCallback(async () => {
    try {
      setRequests((await listVetApplications()).map(toRequest));
    } catch (e) {
      console.error("No se pudieron cargar las solicitudes", e);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") void loadRequests();
  }, [profile?.role, loadRequests]);

  // Cada notificación nueva (alerta cercana, respuesta, etc.) también sale como notificación del celular
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        ({ new: n }) => void showNotification(n.title, n.body)
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [user]);

  // Crea la mascota o, si viene con id, actualiza la existente
  const savePet = async (pet) => {
    const photoUrl = pet.photoFile
      ? await uploadPhoto(pet.photoFile, "pet-photos")
      : editingPet?.photoUrl ?? null;

    const data = {
      name: pet.name.trim(),
      speciesId: pet.speciesId,
      description: pet.marks?.trim() || null,
      birthDate: pet.birthDate,
      photoUrl,
      sex: SEX_DB[pet.sex] ?? "unknown",
      breed: pet.breed?.trim() || null,
      color: pet.color?.trim() || null,
      size: SIZE_DB[pet.size] ?? null,
    };
    if (pet.id) await updatePet(pet.id, data);
    else await createPet(data);

    await loadPets();
    setShowAddPet(false);
    setEditingPet(null);
  };

  // Foto de perfil: sube, guarda y comprueba contra Supabase antes de decir que quedó guardada
  const saveAvatar = async (file) => {
    setPhotoPreview(URL.createObjectURL(file));
    setAvatarStatus("saving");
    try {
      const url = await updateAvatar(file);
      const { data, error } = await supabase.auth.getUser(); // lee la cuenta desde el servidor
      if (error || data.user?.user_metadata?.avatar_url !== url) {
        throw new Error("La cuenta no quedó con la foto nueva.");
      }
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error("La foto se subió pero no se puede abrir."));
        img.src = url;
      });
      setPhotoPreview(null); // desde aquí se muestra la foto guardada en Supabase, no la local
      setAvatarStatus("saved");
    } catch (e) {
      console.error("No se pudo guardar la foto de perfil", e);
      setPhotoPreview(null);
      setAvatarStatus("error");
    }
  };

  // Al tocar una notificación: lleva a la publicación, al mapa o al perfil según su tipo
  const openNotification = async (n) => {
    const goPost = (postId) => {
      setContactPostId(postId);
      setActiveTab("community");
    };
    try {
      if (n.type === "post_like" && n.reference_id) return goPost(n.reference_id);
      if (n.type === "post_reply" && n.reference_id) {
        const comment = await getCommentById(n.reference_id).catch(() => null);
        return comment ? goPost(comment.post_id) : setActiveTab("community");
      }
      if (n.type === "geo_alert" || n.type === "report_match") {
        const post = n.reference_id ? await getPostByReportId(n.reference_id).catch(() => null) : null;
        return post ? goPost(post.id) : setActiveTab("map");
      }
      if (n.type === "pet_reminder") setActiveTab("profile");
    } finally {
      setShowNotifications(false);
    }
  };

  const removePet = async (id) => {
    await deletePet(id);
    await loadPets();
    setEditingPet(null);
  };

  const publishAlert = async (type, r) => {
    const details = ((type === "lost" ? r.traits : r.description) || "").trim();
    if (type === "found" && details.length < 5) {
      throw new Error("Describe cómo es la mascota que encontraste.");
    }
    // El lugar escrito se guarda en la descripción (la base de datos solo guarda coordenadas)
    const placeText = r.point ? "" : r.place.trim();
    const description =
      [placeText, details].filter(Boolean).join(" · ") ||
      (type === "lost" ? "Mascota perdida" : "Mascota encontrada");

    const point = r.point ?? (await searchPlace(r.place));
    if (!point) {
      throw new Error("No encontramos ese lugar. Escríbelo más específico o usa tu ubicación actual.");
    }
    const petPhoto = type === "lost" ? pets.find((p) => p.id === r.petId)?.photoUrl : null;
    const photos = [
      ...(petPhoto ? [petPhoto] : []),
      ...(r.photoFiles?.length ? await uploadPhotos(r.photoFiles, "pet-photos") : []),
    ];

    const payload = {
      petId: type === "lost" ? r.petId : null,
      type,
      description,
      point,
      photos,
      speciesId: type === "found" ? r.speciesId : null,
      sex: type === "found" ? SEX_DB[r.sex] ?? "unknown" : null,
      breed: type === "found" ? r.breed?.trim() || null : null,
      size: type === "found" ? SIZE_DB[r.size] ?? null : null,
      ageEstimate: type === "found" ? r.age?.trim() || null : null,
      lostAt:
        type === "lost" && r.date
          ? new Date(`${r.date}T${r.time || "00:00"}`).toISOString()
          : null,
    };
    console.log("create_alert payload:", payload);

    try {
      const id = await createAlert(payload);
      console.log("Alerta creada:", id);
    } catch (e) {
      console.error("create_alert falló:", e.message, e.details, e.hint, e.code);
      throw e;
    }

    setShowReportLost(false);
    setShowReportFound(false);
    setActiveTab("map");
    void loadNear();
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };
  const goHome = () => setActiveTab("home");
  const openNotifications = () => setShowNotifications(true);

  const decide = async (request, status) => {
    try {
      await reviewVetApplication(request.id, status === "approved");
      await loadRequests();
      setReviewing(null);
    } catch (e) {
      console.error("No se pudo guardar la decisión", e);
    }
  };

  const openDocument = async (doc) => {
    const url = await getVetDocumentUrl(doc.path);
    if (url) window.open(url, "_blank");
  };

  const sendVerification = async (r) => {
    // Revisar antes de subir, para no dejar documentos huérfanos en el bucket
    if ((await myVetApplication())?.status === "pending") {
      throw new Error("Ya tienes una solicitud en revisión.");
    }
    const path = await uploadVetDocument(r.docFile);
    try {
      await submitVetApplication(r.type === "refuge" ? "foundation" : "vet", path);
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.includes("pending application"))
        throw new Error("Ya tienes una solicitud en revisión.", { cause: e });
      if (msg.includes("professional role"))
        throw new Error("Tu cuenta ya tiene un rol profesional.", { cause: e });
      throw e;
    }
    setShowVerification(false);
    setActiveTab("profile");
  };

  const userEmail = user?.email ?? "";
  const userName = profile?.name ?? userEmail.split("@")[0] ?? "usuario";
  const isAdmin = profile?.role === "admin";
  const profilePhoto = photoPreview ?? user?.user_metadata?.avatar_url ?? null;
  const countBy = (status) => requests.filter((r) => r.status === status).length;

  const sharedModals = (
    <>
      <PetDetailModal
        pet={selectedPet}
        onClose={() => setSelectedPet(null)}
        onContact={(pet) => {
          // Se habla con el dueño en la publicación del reporte (comentarios)
          setSelectedPet(null);
          setListPage(null);
          setContactPostId(pet.postId);
          setActiveTab("community");
        }}
      />
      <PhotoPickerModal
        open={profilePhotoOpen}
        onClose={() => setProfilePhotoOpen(false)}
        onFile={(file) => void saveAvatar(file)}
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
    setContactPostId(null);
    if (id === "report") setShowReportModal(true);
    else setActiveTab(id);
  };

  /* CARGANDO */
  if (loading && (user || recovering) && authView !== "register") {
    return (
      <div className="phone-frame">
        <p style={{ padding: 24, fontFamily: "Kodchasan, sans-serif", color: "#66557e" }}>Cargando…</p>
      </div>
    );
  }

  /* NUEVA CONTRASEÑA (llegó desde el enlace de recuperación del correo) */
  if (recovering) {
    return (
      <ResetPasswordScreen
        hasSession={Boolean(user)}
        onDone={() => {
          endRecovery();
          setAuthView("login");
          setActiveTab("home");
        }}
        onRequestNew={() => {
          endRecovery();
          setAuthView("forgot");
        }}
      />
    );
  }

  /* OLVIDÉ MI CONTRASEÑA (o volvió de un enlace del correo que no sirvió) */
  if (!user && (authView === "forgot" || authLinkError)) {
    return (
      <ForgotPasswordScreen
        initialEmail={newAccountEmail}
        linkError={authLinkError}
        onBack={() => {
          clearAuthLinkError();
          setAuthView("login");
        }}
      />
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
      <LoginScreen
        initialEmail={newAccountEmail}
        onSwitchToRegister={() => setAuthView("register")}
        onForgotPassword={(email) => {
          if (email) setNewAccountEmail(email);
          setAuthView("forgot");
        }}
      />
    );
  }

  /* NOTIFICACIONES */
  if (showNotifications) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <NotificationsPage onBack={() => setShowNotifications(false)} onOpen={(n) => void openNotification(n)} />
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
            onOpenDocument={(d) => void openDocument(d)}
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

  /* POR REVISAR: PUBLICACIONES, CLÍNICAS Y DENUNCIAS (ADMIN) */
  if (moderationTab) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <ModerationPage initialTab={moderationTab} onBack={() => setModerationTab(null)} />
          <NavBar active={activeTab} onNavigate={goTab(() => setModerationTab(null))} />
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
            pets={isAdoption ? ADOPTION_PETS : nearFound}
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
            onSubmit={(report) => publishAlert("lost", report)}
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
            species={species}
            onBack={() => setShowReportFound(false)}
            onNotifications={() => {
              setShowReportFound(false);
              setShowNotifications(true);
            }}
            onSubmit={(report) => publishAlert("found", report)}
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
            species={species}
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
            onSubmit={sendVerification}
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
            onSubmit={async ({ current, next }) => {
              const err = await changePassword({ email: userEmail, currentPassword: current, newPassword: next });
              if (err) throw new Error(err);
            }}
            onDone={async () => {
              // Por seguridad se cierra sesión también aquí: hay que entrar con la contraseña nueva
              setShowChangePassword(false);
              setActiveTab("home");
              setAuthView("login");
              await signOut();
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

  /* INSCRIBIR / EDITAR MASCOTA */
  if (showAddPet || editingPet) {
    const closePetForm = () => {
      setShowAddPet(false);
      setEditingPet(null);
    };
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <AddPetPage
            key={editingPet?.id ?? "new"}
            species={species}
            pet={editingPet}
            onBack={closePetForm}
            onNotifications={() => {
              closePetForm();
              setShowNotifications(true);
            }}
            onSave={savePet}
            onDelete={removePet}
          />
          <NavBar active={activeTab} onNavigate={goTab(closePetForm)} />
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
            nearPets={nearLost}
            adoptionPets={ADOPTION_PETS}
            foundPets={nearFound}
            onNotifications={openNotifications}
            onLost={() => setShowReportLost(true)}
            onFound={() => setShowReportFound(true)}
            onPetClick={setSelectedPet}
            onSeeAllNear={() => setActiveTab("map")}
            onSeeAllCommunity={() => setActiveTab("community")}
            onSeeAllAdoption={() => setListPage("adoption")}
            onSeeAllFound={() => setListPage("found")}
            onOpenPost={(postId) => {
              setContactPostId(postId);
              setActiveTab("community");
            }}
          />
        )}

        {activeTab === "map" && (
          <MapPage
            onBack={goHome}
            onNotifications={openNotifications}
            onCall={handleCall}
            onReportClick={setSelectedPet}
          />
        )}

        {activeTab === "community" && (
          <CommunityPage
            key={contactPostId ?? "feed"}
            avatarUrl={profilePhoto}
            openPostId={contactPostId}
            onBack={goHome}
            onNotifications={openNotifications}
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
              {avatarStatus === "saving" && <p className="profile-photo-status">Guardando foto…</p>}
              {avatarStatus === "error" && (
                <p className="profile-photo-status profile-photo-status--error" role="alert">
                  No se pudo guardar la foto. Revisa tu conexión e intenta de nuevo.
                </p>
              )}
              <SuccessToast
                open={avatarStatus === "saved"}
                message="¡Foto de perfil guardada!"
                onDone={clearAvatarStatus}
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
                  else setModerationTab(id);
                }}
              />
            ) : (
              <section className="home-section">
                <MyPetsSection
                  pets={pets}
                  onEnroll={() => setShowAddPet(true)}
                  onPetClick={setSelectedPet}
                  onEdit={setEditingPet}
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
            setContactPostId(null);
            if (id === "report") setShowReportModal(true);
            else setActiveTab(id);
          }}
        />
      </main>
    </div>
  );
}

export default App;