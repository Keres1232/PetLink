import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useAuth } from "./context/AuthContext";
import { useNotifications } from "./context/NotificationsContext.jsx";
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
  newestFirst,
  myReports,
  createVerifiedPlace,
  placeKindsOfUsers,
  setApplicationRole,
  setUserRole,
  roleForKind,
  updatePlaceKind,
  myClinic,
  updatePet,
  deletePet,
  changePassword,
  changeEmail,
  updateProfileName,
  updateCity,
  myPostsCount,
  publishMyAvatar,
  listAdoptionPets,
  getCommentById,
  getPostByReportId,
  getPetForNotification,
  markNotificationRead,
  getReportDetails,
  publisherKinds,
  repairMyLostReports,
  getReportById,
  putPetUpForAdoption,
  removePetFromAdoption,
} from "./lib/api";
import ForgotPasswordScreen from "./assets/components/auth/ForgotPasswordScreen.jsx";
import ResetPasswordScreen from "./assets/components/auth/ResetPasswordScreen.jsx";
import { ageFromBirthDate } from "./lib/format";
import { useUserLocation } from "./hooks/useUserLocation";
import { reportToPet, withReportDetails } from "./lib/reportPet";
import { DEFAULT_CENTER } from "./lib/types";
import { searchPlace } from "./lib/geocode";
import { supabase } from "./lib/supabase";
import LoginScreen from "./assets/components/auth/LoginScreen.jsx";
import RegisterScreen from "./assets/components/auth/RegisterScreen.jsx";
import NavBar from "./assets/components/shared/NavBar.jsx";
import CircleIconButton from "./assets/components/shared/CircleIconButton.jsx";
import PawBackground from "./assets/components/shared/PawBackground.jsx";
import ConfirmModal from "./assets/components/shared/ConfirmModal.jsx";
import PhotoPickerModal from "./assets/components/shared/PhotoPickerModal.jsx";
import PhotoCropModal from "./assets/components/shared/PhotoCropModal.jsx";
import SuccessToast from "./assets/components/shared/SuccessToast.jsx";
import HomePage from "./assets/components/home/HomePage.jsx";
import MapPage from "./assets/components/map/MapPage.jsx";
import CommunityPage from "./assets/components/community/CommunityPage.jsx";
import NotificationsPage from "./assets/components/notifications/NotificationsPage.jsx";
import HelpPage from "./assets/components/help/HelpPage.jsx";
import PetListPage from "./assets/components/pets/PetListPage.jsx";
import ReportPetsPage from "./assets/components/pets/ReportPetsPage.jsx";
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
import MatchSheet from "./assets/components/reports/MatchSheet.jsx";
import MyReportsPage from "./assets/components/reports/MyReportsPage.jsx";
import MyClinicPage from "./assets/components/profile/MyClinicPage.jsx";
import EditProfilePage from "./assets/components/profile/EditProfilePage.jsx";
import backIcon from "./assets/svg/Back.svg";
import "./App.css";
import PawLoader from "./assets/components/shared/PawLoader.jsx";
import PullToRefresh from "./assets/components/shared/PullToRefresh.jsx";

// "Mascotas encontradas" en Inicio busca al menos en 20 km, igual que el mapa
const FOUND_MIN_RADIUS_M = 20000;

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

// Fila de pets -> ficha que usan PetCard / PetDetailModal. `myId` marca las mascotas propias.
const petToCard = (p, myId) => {
  return {
    id: p.id,
    name: p.name,
    speciesId: p.species_id,
    species: speciesLabel(p.species?.name),
    status: p.status === "for_adoption" ? "Adopción" : p.status === "adopted" ? "Adoptado" : speciesLabel(p.species?.name),
    location: "",
    breed: p.breed ?? "",
    age: ageFromBirthDate(p.birth_date) ?? "",
    birthDate: p.birth_date,
    color: p.color ?? "",
    sex: SEX_LABEL[p.sex] ?? "",
    size: SIZE_LABEL[p.size] ?? "",
    marks: p.description ?? "",
    photoUrl: p.photo_url,
    isAdoption: p.status === "for_adoption",
    isAdopted: p.status === "adopted",
    isMine: Boolean(myId) && p.user_id === myId,
    ownerId: p.user_id, // "Publicado por" en la ficha
  };
};

// support_document_url guarda una ruta; las solicitudes viejas pueden traer dos separadas por coma
// Fila de vet_applications -> forma que usan RequestsPage / ReviewRequestPage
/*
 * Tipos de solicitud:
 *  - doctor:        médico veterinario (persona)
 *  - establishment: refugio o veterinaria que el admin aún no clasifica ("POR CLASIFICAR")
 *  - vet / refuge:  establecimiento ya clasificado por el admin como Veterinaria o Refugio (según su lugar en el mapa)
 * `placeKind` es el tipo de lugar del solicitante en vet_clinics, si ya tiene uno.
 */
const toRequest = (a, placeKind) => {
  const foundation = a.target_role === "foundation";
  const establishment = foundation || Boolean(placeKind);
  const type = placeKind === "clinic" ? "vet" : placeKind === "shelter" ? "refuge" : foundation ? "establishment" : "doctor";
  // Las solicitudes viejas de esta rama guardaban dos rutas separadas por coma en support_document_url
  const [supportPath, legacyIdPath] = (a.support_document_url ?? "").split(",");
  // Supabase puede guardar el mismo archivo en support_document_url y license_document_url: se muestra una vez
  const seen = new Set();
  const docs = [
    [supportPath, establishment ? "Registro del establecimiento" : "Tarjeta profesional"],
    [a.license_document_url, establishment ? "Registro del establecimiento" : "Tarjeta profesional"],
    [a.id_document_url ?? legacyIdPath, "Documento de identidad"],
  ].filter(([path]) => path && !seen.has(path) && seen.add(path));

  return {
    id: a.id,
    userId: a.user_id,
    // Establecimiento: la dirección viene en `degree` (ver VerificationPage)
    address: establishment ? a.degree ?? "" : "",
    establishment,
    type,
    status: a.status,
    name: a.full_name || a.applicant?.name || "Usuario",
    location: `Cuenta: ${a.applicant?.name ?? "—"}`,
    sentLabel: `Enviada ${new Date(a.created_at).toLocaleDateString("es-CO")}`,
    // Mismos campos que el formulario de "Solicitar verificación"
    fields: {
      fullName: a.full_name,
      email: a.contact_email,
      license: a.professional_license,
      degree: a.degree,
      specialty: a.specialty,
    },
    documents: docs.map(([path, name], i) => ({ id: i, name, path })),
  };
};

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

// Etiqueta del perfil según el rol (review_vet_application cambia el rol al aprobar la verificación)
const ROLE_LABEL = {
  owner: "Miembro",
  admin: "Administrador",
  vet: "Médico veterinario",
  foundation: "Refugio",
};
// Establecimiento: la etiqueta es la que eligió el admin (una u otra, nunca las dos)
const PLACE_LABEL = { clinic: "Veterinaria", shelter: "Refugio" };

// Las especies vienen en inglés desde la base de datos
const SPECIES_ES = { dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo", ferret: "Hurón", other: "Otro" };
const speciesLabel = (name) => (name ? SPECIES_ES[name.toLowerCase()] ?? name : "Otro");
const SIZE_DB = { Pequeño: "small", Mediano: "medium", Grande: "large" };

function App() {
  const { user, profile, loading, signOut, recovering, endRecovery, authLinkError, clearAuthLinkError, refreshProfile } =
    useAuth();

  // refreshProfile cambia en cada render del contexto: se guarda en una ref para no recargar en bucle
  const refreshProfileRef = useRef(refreshProfile);
  useEffect(() => {
    refreshProfileRef.current = refreshProfile;
  });

  const [authView, setAuthView] = useState("login");
  const [newAccountEmail, setNewAccountEmail] = useState("");

  const [activeTab, setActiveTab] = useState("home");

  // Al abrir Perfil se vuelve a leer el rol: si el admin aprobó la verificación, la etiqueta cambia sin cerrar sesión
  useEffect(() => {
    if (activeTab === "profile") void refreshProfileRef.current();
  }, [activeTab]);

  // Lugar en el mapa de la cuenta (si el admin la aprobó como veterinaria o refugio): define la etiqueta
  const [myPlaceKind, setMyPlaceKind] = useState(null);
  const isProfessional = profile?.role === "vet" || profile?.role === "foundation";
  useEffect(() => {
    if (!isProfessional || activeTab !== "profile") return;
    myClinic()
      .then((c) => setMyPlaceKind(c?.kind ?? null))
      .catch(() => setMyPlaceKind(null));
  }, [isProfessional, activeTab]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tocar una notificación push / del sistema: sin destino abre la bandeja; con destino, ver openNotification
  const { inboxRequests, pendingOpen, clearPendingOpen, refreshUnread } = useNotifications();
  useEffect(() => {
    if (inboxRequests > 0) setShowNotifications(true);
  }, [inboxRequests]);

  /*
   * Foto de perfil: la oficial es profiles.avatar_url (igual en la web y en la app).
   * Solo si profiles todavía NO tiene foto se copia la que quedó en los datos de la cuenta
   * (fotos subidas antes de existir la columna). Antes se copiaba siempre y un dispositivo con
   * la sesión vieja pisaba la foto nueva subida desde otro.
   */
  const savedAvatar = user?.user_metadata?.avatar_url;
  const avatarColumnReady = Boolean(profile) && "avatar_url" in profile;
  const needsAvatarBackfill = avatarColumnReady && !profile.avatar_url && Boolean(savedAvatar);
  useEffect(() => {
    if (!needsAvatarBackfill) return;
    void publishMyAvatar(user.id, savedAvatar).then(() => refreshProfileRef.current());
  }, [needsAvatarBackfill, user?.id, savedAvatar]);

  // Al volver a la app se relee el perfil: trae la foto o el nombre cambiados desde otro dispositivo
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && void refreshProfileRef.current();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showReportLost, setShowReportLost] = useState(false);
  const [showReportFound, setShowReportFound] = useState(false);
  const [showReportAdoption, setShowReportAdoption] = useState(false);
  const [adoptionPetId, setAdoptionPetId] = useState(null); // mascota registrada elegida desde su ficha
  const [showVerification, setShowVerification] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [showMyClinic, setShowMyClinic] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState(null); // "privacy" al abrir Ajustes desde el perfil
  const [activeReports, setActiveReports] = useState(0);
  const [myPosts, setMyPosts] = useState(0);
  const [listPage, setListPage] = useState(null);

  const [requests, setRequests] = useState([]);
  const [requestsTab, setRequestsTab] = useState(null);
  const [moderationTab, setModerationTab] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const [selectedPet, setSelectedPet] = useState(null);
  const [profilePhotoOpen, setProfilePhotoOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState(null); // foto de perfil elegida, esperando el ajuste
  const [photoPreview, setPhotoPreview] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null); // "saving" | "saved" | "error"
  const clearAvatarStatus = useCallback(() => setAvatarStatus(null), []);

  // Ciudad del perfil: guardada en los datos de la cuenta (antes era fija y se perdía al salir)
  const city = user?.user_metadata?.city ?? null;
  const setCity = (c) =>
    updateCity(c).catch((e) => console.error("No se pudo guardar la ciudad", e));
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);

  const [pets, setPets] = useState([]);
  const [species, setSpecies] = useState([]);
  const [contactPostId, setContactPostId] = useState(null);
  // Desde una notificación: comentario a resaltar y un contador para volver a abrir la misma publicación
  const [contactCommentId, setContactCommentId] = useState(null);
  const [contactNonce, setContactNonce] = useState(0);
  const [mapFocusReportId, setMapFocusReportId] = useState(null); // "Ver en el mapa" desde Comunidad
  const [matchTarget, setMatchTarget] = useState(null); // alerta a la que se le envía un aviso privado
  const [editingPet, setEditingPet] = useState(null);

  // Reportes reales cerca del usuario (Inicio: "Cerca de ti" y "Encontrados")
  const { point: userPoint, radius, loading: locLoading, enableDeviceLocation } = useUserLocation();
  // Sin permiso o sin GPS (p. ej. el emulador) se busca alrededor del centro de Bogotá
  const usingDefaultLocation = !locLoading && userPoint === DEFAULT_CENTER;
  const [nearReports, setNearReports] = useState([]);
  // Mascotas perdidas / encontradas: búsqueda propia (hasta 20 km, como el mapa) para que un tipo
  // no deje fuera al otro en los 20 reportes de "Cerca de ti"
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const foundRadiusM = Math.max(radius, FOUND_MIN_RADIUS_M);

  const loadNear = useCallback(async () => {
    try {
      const [near, wide] = await Promise.all([
        reportsNear(userPoint, radius, 20),
        reportsNear(userPoint, foundRadiusM, 100),
      ]);
      setNearReports(newestFirst(near).map(reportToPet));
      setLostPets(newestFirst(wide.filter((r) => r.type === "lost")).map(reportToPet));
      setFoundPets(newestFirst(wide.filter((r) => r.type === "found")).map(reportToPet));
    } catch (e) {
      console.error("No se pudieron cargar los reportes cercanos", e);
    }
  }, [userPoint, radius, foundRadiusM]);

  useEffect(() => {
    if (user && !locLoading) void loadNear();
  }, [user, locLoading, loadNear]);

  // Mantener las tarjetas al día: cuando alguien publica o cierra una alerta (Realtime en
  // `reports`), cada 30 s como respaldo y al volver a la app.
  useEffect(() => {
    if (!user || locLoading) return;
    let timer = null;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void loadNear(), 400); // junta varios cambios seguidos en una sola recarga
    };
    const channel = supabase
      .channel(`near-reports-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, refresh)
      .subscribe();
    const poll = setInterval(refresh, 30000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [user, locLoading, loadNear]);

  // Al volver a Inicio también se recargan
  useEffect(() => {
    if (user && !locLoading && activeTab === "home") void loadNear();
  }, [activeTab, user, locLoading, loadNear]);

  const nearLost = nearReports.filter((p) => p.status === "Perdido");

  // Al entrar: completa las alertas viejas de este usuario que solo tenían pet_id (las otras
  // cuentas las veían vacías). Una vez por sesión; si no hay nada que reparar no hace cambios.
  useEffect(() => {
    if (!user?.id) return;
    repairMyLostReports()
      .then((n) => n > 0 && console.info(`[alertas] se completaron ${n} alertas con los datos de la mascota`))
      .catch((e) => console.warn("[alertas] no se pudieron completar las alertas viejas", e));
  }, [user?.id]);

  const loadPets = useCallback(async () => {
    try {
      const rows = await myPets();
      setPets(rows.map((p) => petToCard(p, p.user_id)));
    } catch (e) {
      console.error("No se pudieron cargar las mascotas", e);
    }
  }, []);

  // "En adopción": mascotas reales con status for_adoption (antes eran ejemplos)
  const [adoptionPets, setAdoptionPets] = useState([]);
  const loadAdoption = useCallback(async () => {
    try {
      const rows = await listAdoptionPets();
      // Etiqueta extra si quien la publicó es una veterinaria o un refugio (cualquiera puede publicar)
      const kinds = await publisherKinds(rows.map((p) => p.user_id)).catch(() => ({}));
      setAdoptionPets(rows.map((p) => ({ ...petToCard(p, user?.id), publisherKind: kinds[p.user_id] ?? null })));
    } catch (e) {
      console.error("No se pudieron cargar las mascotas en adopción", e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && activeTab === "home") void loadAdoption();
  }, [user, activeTab, loadAdoption]);

  // Publicar "Dar en adopción": una mascota registrada pasa a for_adoption, o se crea una nueva así
  const publishAdoption = async (r) => {
    if (r.petId) {
      // pets no tiene ubicación: el lugar va en la descripción, junto con lo que cuente el dueño
      await putPetUpForAdoption(r.petId, [r.place.trim(), r.description?.trim()].filter(Boolean).join(" · ") || null);
      await Promise.all([loadPets(), loadAdoption()]);
      setShowReportAdoption(false);
      setAdoptionPetId(null);
      setActiveTab("home");
      return;
    }
    const photoUrl = r.photoFiles?.length ? await uploadPhoto(r.photoFiles[0], "pet-photos") : null;
    const years = parseFloat(String(r.age).replace(",", "."));
    const ageNote = r.age?.trim() && !Number.isFinite(years) ? `Edad aproximada: ${r.age.trim()}` : null;
    await createPet({
      name: r.name.trim(),
      speciesId: r.speciesId,
      // pets no tiene ubicación: el lugar va en la descripción
      description: [r.place.trim(), r.description?.trim(), ageNote].filter(Boolean).join(" · ") || null,
      birthDate: Number.isFinite(years) && years >= 0 ? new Date(Date.now() - years * 365.25 * 864e5).toISOString().slice(0, 10) : null,
      photoUrl,
      sex: SEX_DB[r.sex] ?? "unknown",
      size: SIZE_DB[r.size] ?? null,
      status: "for_adoption",
    });
    await Promise.all([loadPets(), loadAdoption()]);
    setShowReportAdoption(false);
    setActiveTab("home");
  };

  useEffect(() => {
    if (user) {
      loadPets();
      listSpecies()
        .then(setSpecies) // catálogo completo en español: Perro y Gato en botones, el resto en "Otro"
        .catch((e) => console.error("No se pudo cargar species", e));
    } else {
      setPets([]);
    }
  }, [user, loadPets]);

  // "Reportes activos" del perfil: alertas propias que siguen abiertas o en búsqueda
  const loadActiveReports = useCallback(async () => {
    try {
      const [rows, posts] = await Promise.all([myReports(), myPostsCount()]);
      setActiveReports(rows.filter((r) => r.status === "open" || r.status === "searching").length);
      setMyPosts(posts); // antes "Publicaciones" siempre mostraba 0
    } catch (e) {
      console.error("No se pudieron contar los reportes y publicaciones", e);
    }
  }, []);

  useEffect(() => {
    // Al iniciar sesión y cada vez que se abre Perfil (así cuenta las publicaciones nuevas)
    if (user && (activeTab === "profile" || activeTab === "home")) void loadActiveReports();
  }, [user, activeTab, loadActiveReports]);

  /*
   * Botón "Atrás" del celular (Android). Antes cerraba la app; ahora retrocede dentro de ella:
   * primero cierra la ventana emergente abierta, luego la pantalla actual (en el mismo orden en
   * que se muestran abajo), después vuelve a Inicio, y solo desde Inicio sale de la app.
   * Devuelve true si pudo retroceder.
   */
  const goBack = () => {
    const done = (...steps) => {
      steps.forEach((step) => step());
      return true;
    };

    // 1. Ventanas emergentes
    if (selectedPet) return done(() => setSelectedPet(null));
    if (showReportModal) return done(() => setShowReportModal(false));
    if (avatarCropFile) return done(() => setAvatarCropFile(null));
    if (profilePhotoOpen) return done(() => setProfilePhotoOpen(false));
    if (cityPickerOpen) return done(() => setCityPickerOpen(false));
    if (confirmAction) return done(() => setConfirmAction(null));

    // 2. Sin sesión: registro / recuperar contraseña → login
    if (!user) {
      return authView !== "login" ? done(() => setAuthView("login"), clearAuthLinkError) : false;
    }

    // 3. Pantallas abiertas
    if (showNotifications) return done(() => setShowNotifications(false));
    if (reviewing) return done(() => setReviewing(null));
    if (moderationTab) return done(() => setModerationTab(null));
    if (requestsTab) return done(() => setRequestsTab(null));
    if (listPage) return done(() => setListPage(null));
    if (showMyReports) return done(() => setShowMyReports(false), () => void loadActiveReports());
    if (showMyClinic) return done(() => setShowMyClinic(false));
    if (showEditProfile) return done(() => setShowEditProfile(false));
    if (showHelp) return done(() => setShowHelp(false));
    if (showReportLost) return done(() => setShowReportLost(false));
    if (showReportFound) return done(() => setShowReportFound(false));
    if (showReportAdoption) return done(() => setShowReportAdoption(false));
    if (showVerification) return done(() => setShowVerification(false));
    if (showChangePassword) return done(() => setShowChangePassword(false), () => setShowSettings(true));
    if (showChangeEmail) return done(() => setShowChangeEmail(false), () => setShowSettings(true));
    if (showSettings) return done(() => setShowSettings(false));
    if (showAddPet || editingPet) return done(() => setShowAddPet(false), () => setEditingPet(null));

    // 4. Otra pestaña → Inicio
    if (activeTab !== "home") return done(() => setActiveTab("home"), () => setContactPostId(null));
    return false;
  };

  // El listener se registra una vez; siempre llama a la versión más reciente de goBack
  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  });
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener("backButton", () => {
      if (!goBackRef.current()) void CapacitorApp.exitApp();
    });
    return () => void listener.then((l) => l.remove());
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const apps = await listVetApplications();
      // El tipo de lugar en el mapa dice cómo clasificó el admin cada establecimiento
      const kinds = await placeKindsOfUsers([...new Set(apps.map((a) => a.user_id))]).catch(() => ({}));
      setRequests(apps.map((a) => toRequest(a, kinds[a.user_id])));
    } catch (e) {
      console.error("No se pudieron cargar las solicitudes", e);
    }
  }, []);

  // Antes solo se cargaban al iniciar sesión: si llegaba una solicitud con la sesión abierta, el admin no la veía.
  // Ahora se recargan con cada solicitud nueva (Realtime), cada 30 s y al volver a la app.
  useEffect(() => {
    if (profile?.role !== "admin") return;
    void loadRequests();
    const channel = supabase
      .channel("admin-vet-applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "vet_applications" }, () => void loadRequests())
      .subscribe();
    const poll = setInterval(() => void loadRequests(), 30000);
    const onVisible = () => document.visibilityState === "visible" && void loadRequests();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [profile?.role, loadRequests]);

  // Y siempre al abrir "Solicitudes"
  useEffect(() => {
    if (requestsTab && profile?.role === "admin") void loadRequests();
  }, [requestsTab, profile?.role, loadRequests]);

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
      // Comprueba en el servidor que la foto oficial (profiles.avatar_url) quedó guardada
      if (avatarColumnReady) {
        const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
        if (error || data?.avatar_url !== url) throw new Error("El perfil no quedó con la foto nueva.");
        await refreshProfileRef.current();
      } else {
        const { data, error } = await supabase.auth.getUser();
        if (error || data.user?.user_metadata?.avatar_url !== url) throw new Error("La cuenta no quedó con la foto nueva.");
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

  // Abre la ficha. Si es un reporte, la muestra de una vez y luego la completa con el reporte completo
  const showPet = (pet) => {
    setSelectedPet(pet);
    if (!pet?.isReport) return;
    getReportDetails(pet.id)
      .then((d) => setSelectedPet((cur) => (cur?.id === pet.id ? withReportDetails(cur, d) : cur)))
      .catch((e) => console.error("No se pudo cargar el detalle del reporte", e));
  };

  // Al tocar una notificación: lleva a la publicación, al mapa o al perfil según su tipo
  // Cierra todo lo que esté encima (ventanas y pantallas) para que se vea el destino de la notificación
  const closeScreens = () => {
    [
      setSelectedPet, setConfirmAction, setMatchTarget, setReviewing, setModerationTab, setRequestsTab,
      setListPage, setEditingPet,
    ].forEach((set) => set(null));
    [
      setShowReportModal, setProfilePhotoOpen, setCityPickerOpen, setShowNotifications, setShowMyReports,
      setShowMyClinic, setShowEditProfile, setShowHelp, setShowReportLost, setShowReportFound,
      setShowReportAdoption, setShowVerification, setShowChangePassword, setShowChangeEmail, setShowSettings,
      setShowAddPet,
    ].forEach((set) => set(false));
  };

  /**
   * Deep link de una notificación: lleva a la publicación (o ficha) de donde salió.
   * - post_like → la publicación · post_reply → la publicación con el comentario resaltado
   * - geo_alert / report_match → la publicación de la alerta (si no tiene, el mapa centrado en ella)
   * - adoption_interest / adoption_response → la ficha de la mascota (con los interesados si es tuya)
   * - pet_reminder → Perfil
   */
  const openNotification = async (n) => {
    const ref = n.reference_id || null;
    const goPost = (postId, commentId = null) => {
      closeScreens();
      setContactPostId(postId);
      setContactCommentId(commentId);
      setContactNonce((x) => x + 1); // la misma notificación otra vez vuelve a abrirla y bajar hasta ella
      setActiveTab("community");
    };
    const goTabOnly = (tab) => {
      closeScreens();
      setContactPostId(null);
      setActiveTab(tab);
    };
    try {
      switch (n.type) {
        case "post_like":
          return ref ? goPost(ref) : goTabOnly("community");
        case "post_reply": {
          const comment = ref ? await getCommentById(ref).catch(() => null) : null;
          return comment ? goPost(comment.post_id, comment.id) : goTabOnly("community");
        }
        case "geo_alert":
        case "report_match": {
          const post = ref ? await getPostByReportId(ref).catch(() => null) : null;
          if (post) return goPost(post.id);
          goTabOnly("map");
          if (ref) setMapFocusReportId(ref); // sin publicación: el mapa centrado en la alerta
          return;
        }
        case "adoption_interest":
        case "adoption_response": {
          const row = ref ? await getPetForNotification(ref).catch(() => null) : null;
          if (!row) return goTabOnly(n.type === "adoption_interest" ? "profile" : "home");
          goTabOnly(n.type === "adoption_interest" ? "profile" : "home");
          return setSelectedPet(petToCard(row, user?.id)); // la ficha, con el panel de adopción
        }
        case "pet_reminder":
          return goTabOnly("profile");
        default:
          return setShowNotifications(false);
      }
    } catch (e) {
      console.error("No se pudo abrir la notificación", e);
      setShowNotifications(false);
    }
  };

  // Notificación tocada en la barra del celular (push o del sistema): se marca leída y se abre su destino
  const openNotificationRef = useRef(openNotification);
  useEffect(() => {
    openNotificationRef.current = openNotification;
  });
  useEffect(() => {
    if (!pendingOpen || !user) return;
    clearPendingOpen();
    if (pendingOpen.notification_id) {
      markNotificationRead(pendingOpen.notification_id).then(refreshUnread).catch(() => {});
    }
    void openNotificationRef.current({ type: pendingOpen.type, reference_id: pendingOpen.reference_id });
  }, [pendingOpen, user, clearPendingOpen, refreshUnread]);

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
    const lostPet = type === "lost" ? pets.find((p) => p.id === r.petId) : null;
    const petPhoto = lostPet?.photoUrl ?? null;
    const photos = [
      ...(petPhoto ? [petPhoto] : []),
      ...(r.photoFiles?.length ? await uploadPhotos(r.photoFiles, "pet-photos") : []),
    ];

    // Perdida: los datos de la mascota se COPIAN en la alerta (como la web). Si solo se guarda pet_id,
    // las demás cuentas ven la ficha vacía: la tabla pets solo la puede leer su dueño (RLS).
    const payload = {
      petId: type === "lost" ? r.petId : null,
      type,
      description,
      point,
      photos,
      speciesId: type === "found" ? r.speciesId : lostPet?.speciesId ?? null,
      sex: type === "found" ? SEX_DB[r.sex] ?? "unknown" : SEX_DB[lostPet?.sex] ?? null,
      breed: type === "found" ? r.breed?.trim() || null : lostPet?.breed?.trim() || null,
      size: type === "found" ? SIZE_DB[r.size] ?? null : SIZE_DB[lostPet?.size] ?? null,
      color: type === "found" ? null : lostPet?.color?.trim() || null,
      ageEstimate: type === "found" ? r.age?.trim() || null : lostPet?.age || null,
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
    void loadActiveReports();
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };
  const goHome = () => setActiveTab("home");
  const openNotifications = () => setShowNotifications(true);

  /**
   * Aprobar o rechazar. Si es un refugio / veterinaria aprobado, el admin eligió la etiqueta
   * (place.kind: "shelter" = Refugio, "clinic" = Veterinaria) y la dirección: se ubica en el
   * mapa ANTES de aprobar, para no dejar una cuenta aprobada sin su lugar.
   * Los errores se lanzan para que ReviewRequestPage los muestre.
   */
  const decide = async (request, status, place) => {
    let point = null;
    if (status === "approved" && place) {
      point = await searchPlace(place.address);
      if (!point) throw new Error("No encontramos esa dirección en el mapa. Escríbela más completa (calle, número, ciudad).");
      // La decisión del admin define el rol: Veterinaria → vet, Refugio → foundation (review_vet_application lo asigna)
      await setApplicationRole(request.id, roleForKind(place.kind));
    }
    await reviewVetApplication(request.id, status === "approved");
    if (point) {
      await createVerifiedPlace({
        ownerId: request.userId,
        name: request.name,
        address: place.address.trim(),
        point,
        kind: place.kind,
      });
    }
    await loadRequests();
    setReviewing(null);
  };

  // Solicitud ya aprobada que quedó sin lugar en el mapa: el admin la ubica ahora
  const placeApproved = async (request, place) => {
    const point = await searchPlace(place.address);
    if (!point) throw new Error("No encontramos esa dirección en el mapa. Escríbela más completa (calle, número, ciudad).");
    await createVerifiedPlace({
      ownerId: request.userId,
      name: request.name,
      address: place.address.trim(),
      point,
      kind: place.kind,
    });
    await applyKindToAccount(request, place.kind);
    await loadRequests();
    setReviewing(null);
  };

  // El rol de la cuenta y la solicitud siguen a la etiqueta elegida (Veterinaria → vet, Refugio → foundation)
  const applyKindToAccount = async (request, kind) => {
    const role = roleForKind(kind);
    await setApplicationRole(request.id, role).catch((e) => console.warn("[etiqueta] no se pudo actualizar la solicitud", e));
    await setUserRole(request.userId, role).catch((e) => console.warn("[etiqueta] no se pudo cambiar el rol de la cuenta", e));
  };

  // Cambiar Refugio ↔ Veterinaria en un establecimiento ya aprobado
  const changePlaceKind = async (request, place, kind) => {
    await updatePlaceKind(place.id, kind);
    await applyKindToAccount(request, kind);
    await loadRequests();
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
    const documentPath = await uploadVetDocument(r.docFile);
    const idDocumentPath = r.idFile ? await uploadVetDocument(r.idFile) : null;
    const clean = (v) => v?.trim() || null;
    try {
      // Establecimiento → apply_as_foundation; el admin decide después si es Refugio o Veterinaria
      await submitVetApplication(r.type === "establishment" ? "foundation" : "vet", {
        documentPath,
        idDocumentPath,
        fullName: clean(r.name),
        contactEmail: clean(r.email),
        professionalLicense: clean(r.license),
        degree: clean(r.degree),
        specialty: clean(r.specialty),
      });
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
  // Foto oficial: profiles.avatar_url. Solo si aún no existe la columna se usa la de la cuenta.
  const profilePhoto =
    photoPreview ?? (avatarColumnReady ? profile.avatar_url : user?.user_metadata?.avatar_url) ?? null;
  const countBy = (status) => requests.filter((r) => r.status === status).length;

  const sharedModals = (
    <>
      <PetDetailModal
        pet={selectedPet}
        myUserId={user?.id}
        onClose={() => setSelectedPet(null)}
        onGiveForAdoption={(pet) => {
          // Desde la ficha de tu mascota: abre "Dar en adopción" con ella ya elegida
          setSelectedPet(null);
          setAdoptionPetId(pet.id);
          setShowReportAdoption(true);
        }}
        onRemoveFromAdoption={async (pet) => {
          await removePetFromAdoption(pet.id);
          await Promise.all([loadPets(), loadAdoption()]);
          setSelectedPet(null);
        }}
        onAdoptionChanged={() => {
          // Al aprobar una adopción la mascota pasa a "adoptada": se recargan las listas
          void loadPets();
          void loadAdoption();
          setSelectedPet(null);
        }}
        onContact={(pet) => {
          // Mensaje PRIVADO a quien publicó (no comentario público): solo él lo ve.
          // Adopción → adoption_interests; alerta → report_matches
          setSelectedPet(null);
          setMatchTarget(
            pet.isAdoption
              ? { id: pet.id, name: pet.name, photoUrl: pet.photoUrl, adoption: true }
              : { id: pet.id, name: pet.name, photoUrl: pet.photoUrl, lost: pet.status !== "Encontrado" }
          );
        }}
      />
      <MatchSheet key={matchTarget?.id ?? "none"} report={matchTarget} onClose={() => setMatchTarget(null)} />
      <PhotoPickerModal
        open={profilePhotoOpen}
        onClose={() => setProfilePhotoOpen(false)}
        onFile={setAvatarCropFile}
      />
      {/* Foto de perfil: se ajusta en un marco redondo (mover, acercar, girar) antes de guardarla */}
      <PhotoCropModal
        file={avatarCropFile}
        round
        subtitle="Arrastra para elegir cómo se verá tu foto de perfil."
        onCancel={() => setAvatarCropFile(null)}
        onDone={(file) => {
          setAvatarCropFile(null);
          void saveAvatar(file);
        }}
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

  // "Desliza hacia abajo para recargar": vuelve a pedir los datos de App y remonta la pantalla
  // actual (refreshKey en su key) para que las que cargan sus propios datos también se actualicen
  const [refreshKey, setRefreshKey] = useState(0);
  const pullRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await Promise.allSettled([
      loadNear(),
      loadAdoption(),
      loadPets(),
      loadActiveReports(),
      refreshProfileRef.current?.(),
      refreshUnread?.(),
    ]);
  };

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
        <PawLoader fullScreen />
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
          <PullToRefresh onRefresh={pullRefresh} />
          <NotificationsPage
            key={`notifications-${refreshKey}`}
            onBack={() => setShowNotifications(false)} onOpen={(n) => void openNotification(n)} />
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
            key={reviewing.id}
            request={requests.find((r) => r.id === reviewing.id)}
            onBack={() => setReviewing(null)}
            onAccept={(r, place) => decide(r, "approved", place)}
            onReject={(r) => decide(r, "rejected")}
            onPlace={placeApproved}
            onChangeKind={changePlaceKind}
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

  /* MASCOTAS PERDIDAS / ENCONTRADAS ("Ver más" de Inicio) */
  if (listPage === "found" || listPage === "lost") {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <PullToRefresh onRefresh={pullRefresh} />
          <ReportPetsPage
            key={listPage}
            kind={listPage}
            pets={listPage === "lost" ? lostPets : foundPets}
            radiusKm={Math.round(foundRadiusM / 1000)}
            onBack={() => setListPage(null)}
            onNotifications={() => {
              setListPage(null);
              setShowNotifications(true);
            }}
            onPetClick={showPet}
            onViewMap={() => {
              setListPage(null);
              setActiveTab("map");
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setListPage(null))} />
          {sharedModals}
        </main>
      </div>
    );
  }

  /* EN ADOPCIÓN */
  if (listPage) {
    const isAdoption = listPage === "adoption";
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <PullToRefresh onRefresh={pullRefresh} />
          <PetListPage
            title={isAdoption ? "En adopción" : "Encontrados"}
            pets={isAdoption ? adoptionPets : foundPets}
            onBack={() => setListPage(null)}
            onNotifications={() => {
              setListPage(null);
              setShowNotifications(true);
            }}
            onPetClick={showPet}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setListPage(null))} />
          {sharedModals}
        </main>
      </div>
    );
  }

  /* EDITAR INFORMACIÓN PERSONAL */
  if (showEditProfile) {
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <EditProfilePage
            name={profile?.name ?? ""}
            city={city}
            email={userEmail}
            onBack={() => setShowEditProfile(false)}
            onSaveName={async (n) => {
              await updateProfileName(n);
              await refreshProfileRef.current(); // el nombre nuevo se ve de inmediato en el perfil
            }}
            onSaveCity={setCity}
            onChangeEmail={() => {
              setShowEditProfile(false);
              setShowChangeEmail(true);
            }}
            onChangePassword={() => {
              setShowEditProfile(false);
              setShowChangePassword(true);
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => setShowEditProfile(false))} />
        </main>
      </div>
    );
  }

  /* MI CLÍNICA (veterinaria / refugio verificado) */
  if (showMyClinic) {
    const closeMyClinic = () => {
      setShowMyClinic(false);
      setMyPlaceKind(null); // se vuelve a leer al abrir Perfil
    };
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <MyClinicPage
            role={profile?.role}
            onBack={closeMyClinic}
            onNotifications={() => {
              closeMyClinic();
              setShowNotifications(true);
            }}
            onGoMap={() => {
              closeMyClinic();
              setActiveTab("map");
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(closeMyClinic)} />
        </main>
      </div>
    );
  }

  /* MIS REPORTES */
  if (showMyReports) {
    const closeMyReports = () => {
      setShowMyReports(false);
      void loadActiveReports();
      void loadNear(); // las alertas cerradas dejan de salir en Inicio y en el mapa
    };
    return (
      <div className="phone-frame">
        <main className="app">
          <PawBackground />
          <MyReportsPage
            onBack={closeMyReports}
            onNotifications={() => {
              closeMyReports();
              setShowNotifications(true);
            }}
          />
          <NavBar active={activeTab} onNavigate={goTab(closeMyReports)} />
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
          <HelpPage onBack={() => setShowHelp(false)} defaultEmail={user?.email ?? ""} />
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
            key={adoptionPetId ?? "nueva"}
            species={species}
            myPets={pets.filter((p) => !p.isAdoption && !p.isAdopted)}
            initialPetId={adoptionPetId}
            onBack={() => setShowReportAdoption(false)}
            onNotifications={() => {
              setShowReportAdoption(false);
              setShowNotifications(true);
            }}
            onSubmit={publishAdoption}
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
            onSubmit={async ({ newEmail, password }) => {
              // Verifica la contraseña y pide el cambio; Supabase envía el enlace de confirmación
              const err = await changeEmail({ currentEmail: userEmail, currentPassword: password, newEmail });
              if (err) throw new Error(err);
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
            focusSection={settingsFocus}
            onBack={() => {
              setShowSettings(false);
              setSettingsFocus(null);
            }}
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
            city={city ?? "Sin definir"}
            onCityClick={() => setCityPickerOpen(true)}
            onDeactivate={() => setConfirmAction("deactivate")}
            onDelete={() => setConfirmAction("delete")}
          />
          <NavBar active={activeTab} onNavigate={goTab(() => {
            setShowSettings(false);
            setSettingsFocus(null);
          })} />
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
        <PullToRefresh onRefresh={pullRefresh} />

        {activeTab === "home" && (
          <HomePage
            key={`home-${refreshKey}`}
            userName={userName}
            usingDefaultLocation={usingDefaultLocation}
            onEnableLocation={() => void enableDeviceLocation()}
            nearPets={nearLost}
            adoptionPets={adoptionPets}
            lostPets={lostPets.slice(0, 10)}
            foundPets={foundPets.slice(0, 10)}
            onNotifications={openNotifications}
            onLost={() => setShowReportLost(true)}
            onFound={() => setShowReportFound(true)}
            onPetClick={showPet}
            onSeeAllNear={() => setActiveTab("map")}
            onSeeAllCommunity={() => setActiveTab("community")}
            onSeeAllAdoption={() => setListPage("adoption")}
            onSeeAllFound={() => setListPage("found")}
            onSeeAllLost={() => setListPage("lost")}
            onOpenPost={(postId) => {
              setContactPostId(postId);
              setActiveTab("community");
            }}
          />
        )}

        {activeTab === "map" && (
          <MapPage
            key={`map-${refreshKey}`}
            onBack={goHome}
            onNotifications={openNotifications}
            onCall={handleCall}
            onReportClick={showPet}
            focusReportId={mapFocusReportId}
            onFocusDone={() => setMapFocusReportId(null)}
          />
        )}

        {activeTab === "community" && (
          <CommunityPage
            key={`${contactPostId ? `${contactPostId}-${contactNonce}` : "feed"}-${refreshKey}`}
            avatarUrl={profilePhoto}
            openPostId={contactPostId}
            openCommentId={contactCommentId}
            onBack={goHome}
            myUserId={user?.id}
            onContactOwner={(post) =>
              setMatchTarget({
                id: post.report_id,
                name: "esta mascota",
                photoUrl: post.image_url,
                lost: post.type !== "found",
              })
            }
            onOpenReport={async (reportId) => {
              // "Ver ficha completa" de una alerta de Comunidad → la misma ficha que en Inicio y el mapa
              try {
                const r = await getReportById(reportId);
                if (r) showPet(reportToPet(r));
              } catch (e) {
                console.error("No se pudo abrir la ficha de la alerta", e);
              }
            }}
            onViewOnMap={(reportId) => {
              // Alerta de Comunidad → mapa centrado en ese reporte
              setMapFocusReportId(reportId);
              setActiveTab("map");
            }}
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
                onClick={() => {
                  setSettingsFocus(null);
                  setShowSettings(true);
                }}
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
                location={city ?? "Agrega tu ciudad en «Editar información personal»"}
                memberLabel={
                  (isProfessional && PLACE_LABEL[myPlaceKind]) || ROLE_LABEL[profile?.role] || "Miembro"
                }
                verified={profile?.role === "vet" || profile?.role === "foundation"}
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
                <ProfileStats pets={pets.length} posts={myPosts} activeReports={activeReports} />
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
              professional={isProfessional}
              onOptionClick={(id) => {
                if (id === "logout") setConfirmAction("logout");
                else if (id === "help") setShowHelp(true);
                else if (id === "edit") setShowEditProfile(true);
                else if (id === "verification") setShowVerification(true);
                else if (id === "reports") setShowMyReports(true);
                else if (id === "clinic") setShowMyClinic(true);
                else if (id === "privacy") {
                  setSettingsFocus("privacy");
                  setShowSettings(true);
                }
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
            else if (optionId === "adoption") {
              setAdoptionPetId(null);
              setShowReportAdoption(true);
            }
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