import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";
import { translateAuthError } from "./authErrors";
import { APP_RESET_URL } from "./authLinks";
import type {
  CommentReport,
  CommentRow,
  FeedItem,
  GeoPoint,
  GuideRow,
  ModerationPost,
  MyClinic,
  NotificationRow,
  PendingClinic,
  Pet,
  PlaceNear,
  PrivateProfile,
  ReportMatch,
  ReportNear,
  Species,
  VetApplication,
} from "./types";

/** Orden de toda la app: la publicación más nueva primero. */
export const newestFirst = <T extends { created_at: string }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export async function getFeed(opts?: {
  type?: string;
  limit?: number;
}): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc("get_feed", {
    p_type: opts?.type ?? null,
    p_limit: opts?.limit ?? 20,
  });
  if (error) throw error;
  return newestFirst(data as FeedItem[]);
}

export async function reportsNear(
  point: GeoPoint,
  radiusM: number,
  limit = 10
): Promise<ReportNear[]> {
  const { data, error } = await supabase.rpc("reports_near", {
    p_lat: point.lat,
    p_lon: point.lon,
    p_radius_m: radiusM,
  });
  if (error) throw error;
  return (data as ReportNear[]).slice(0, limit);
}

export async function placesNear(
  point: GeoPoint,
  radiusM: number,
  kind?: "clinic" | "shelter"
): Promise<PlaceNear[]> {
  const { data, error } = await supabase.rpc("places_near", {
    p_lat: point.lat,
    p_lon: point.lon,
    p_radius_m: radiusM,
    p_kind: kind ?? null,
  });
  if (error) throw error;
  return data as PlaceNear[];
}

export async function togglePostLike(postId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_post_like", {
    p_post_id: postId,
  });
  if (error) throw error;
  return data as boolean;
}

export async function createAlert(input: {
  petId: string | null;
  type: "lost" | "found";
  description: string;
  point: GeoPoint;
  speciesId?: string | null;
  sex?: "male" | "female" | "unknown" | null;
  breed?: string | null;
  color?: string | null;
  size?: "small" | "medium" | "large" | null;
  ageEstimate?: string | null;
  photos?: string[];
  lostAt?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_alert", {
    p_pet_id: input.petId,
    p_type: input.type,
    p_description: input.description,
    p_lat: input.point.lat,
    p_lon: input.point.lon,
    p_species_id: input.speciesId ?? null,
    p_sex: input.sex ?? null,
    p_breed: input.breed ?? null,
    p_color: input.color ?? null,
    p_size: input.size ?? null,
    p_age_estimate: input.ageEstimate ?? null,
    p_photos: input.photos ?? [],
    p_lost_at: input.lostAt ?? null,
  });
  if (error) {
    // Trigger prevent_duplicate_lost_alert: una sola alerta activa por mascota
    if (/alerta activa/i.test(error.message ?? ""))
      throw new Error("Ya tienes una alerta activa para esta mascota. Revísala en el mapa o márcala como resuelta para crear otra.");
    throw error;
  }
  return data as string;
}

export async function createPost(input: {
  type: string;
  content: string;
  imageUrl?: string | null;
}): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    type: input.type,
    content: input.content,
    image_url: input.imageUrl ?? null,
  });
  if (error) throw error;
}

export async function listComments(postId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, text, created_at, is_hidden, author:profiles!comments_user_id_fkey(name)")
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data as unknown as CommentRow[];
  // Foto de perfil de cada autor (profiles.avatar_url)
  const avatars = await avatarsOf([...new Set(rows.map((c) => c.user_id))]);
  return rows.map((c) => ({ ...c, avatar_url: avatars[c.user_id] ?? null }));
}

export async function addComment(postId: string, text: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, text });
  if (error) throw error;
}

/** Denuncia un comentario: queda pendiente en comment_reports para que lo revise un admin. */
export async function reportComment(commentId: string, reason: string | null): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("comment_reports")
    .insert({ comment_id: commentId, reporter_id: userId, reason });
  if (error) throw error;
}

export async function listNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as NotificationRow[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function myPets(): Promise<Pet[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];
  // Solo las del usuario y sin las eliminadas (borrado suave con deleted_at)
  const { data, error } = await supabase
    .from("pets")
    .select("*, species:species(id, name)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Pet[];
}

/** Nombre comparable: sin mayúsculas, tildes ni espacios de más ("Firulais " = "firuláis"). */
function petNameKey(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Impide tener dos veces la misma mascota: mismo dueño + mismo nombre + misma especie, entre las
 * que no están eliminadas. Las de "Mis mascotas" y las publicadas en adopción se comparan por separado,
 * y las ya adoptadas no cuentan. (El trigger prevent_duplicate_pet de la BD solo mira los últimos 90 s.)
 */
async function assertNotDuplicatePet(
  userId: string,
  name: string,
  speciesId: string,
  status: string | null,
  excludeId?: string
): Promise<void> {
  const { data, error } = await supabase
    .from("pets")
    .select("id, name, status")
    .eq("user_id", userId)
    .eq("species_id", speciesId)
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; name: string; status: string | null }[];
  const ownStatus = excludeId ? rows.find((r) => r.id === excludeId)?.status ?? status : status;
  const adoption = ownStatus === "for_adoption";
  const key = petNameKey(name);
  const twin = rows.find(
    (r) =>
      r.id !== excludeId &&
      r.status !== "adopted" &&
      (r.status === "for_adoption") === adoption &&
      petNameKey(r.name) === key
  );
  if (twin) {
    throw new Error(
      adoption
        ? `Ya publicaste en adopción una mascota llamada «${twin.name}» de la misma especie.`
        : `Ya tienes una mascota llamada «${twin.name}» de la misma especie. Revisa tu perfil.`
    );
  }
}

export async function updatePet(
  id: string,
  input: {
    name: string;
    speciesId: string;
    description: string | null;
    birthDate: string | null;
    photoUrl: string | null;
    sex?: "male" | "female" | "unknown" | null;
    breed?: string | null;
    color?: string | null;
    size?: "small" | "medium" | "large" | null;
  }
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  await assertNotDuplicatePet(userId, input.name, input.speciesId, null, id);
  const { error } = await supabase
    .from("pets")
    .update({
      name: input.name,
      species_id: input.speciesId,
      description: input.description,
      birth_date: input.birthDate,
      photo_url: input.photoUrl,
      sex: input.sex ?? null,
      breed: input.breed ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Borrado suave: la mascota deja de mostrarse pero se conserva en la base de datos. */
export async function deletePet(id: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("pets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listSpecies(): Promise<Species[]> {
  const { data, error } = await supabase
    .from("species")
    .select("id, name")
    .eq("approved", true)
    .order("name");
  if (error) throw error;
  return data as Species[];
}

export async function createPet(input: {
  name: string;
  speciesId: string;
  description: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  sex?: "male" | "female" | "unknown" | null;
  breed?: string | null;
  color?: string | null;
  size?: "small" | "medium" | "large" | null;
  status?: "active" | "for_adoption";
}): Promise<void> {
  if (!input.speciesId.trim()) {
    throw new Error("Debes seleccionar una especie válida para la mascota.");
  }
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  await assertNotDuplicatePet(userId, input.name, input.speciesId, input.status ?? "active");
  const { error } = await supabase.from("pets").insert({
    user_id: userId,
    name: input.name,
    species_id: input.speciesId,
    description: input.description,
    birth_date: input.birthDate,
    photo_url: input.photoUrl,
    sex: input.sex ?? null,
    breed: input.breed ?? null,
    color: input.color ?? null,
    size: input.size ?? null,
    status: input.status ?? "active",
  });
  if (error) {
    if (input.status === "for_adoption") throw adoptionError(error);
    // Trigger prevent_duplicate_pet: mismo nombre y especie en los últimos 90 s (doble envío)
    if (/ya registraste/i.test(error.message ?? ""))
      throw new Error("Esta mascota ya fue registrada hace un momento. Revisa tu perfil.");
    throw error;
  }
}

export async function getPrivateProfile(): Promise<PrivateProfile | null> {
  // Sin sesión no hay perfil privado que leer (evita el 401 al abrir la app sin sesión)
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return null;
  const { data, error } = await supabase
    .from("private_profiles")
    .select("profile_id, geolocation_consent, alert_radius_m, birth_date")
    .maybeSingle();
  if (error) throw error;
  return data as PrivateProfile | null;
}

export async function updateSettings(input: {
  alertRadiusM?: number;
  geolocationConsent?: boolean;
}): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.alertRadiusM !== undefined) patch.alert_radius_m = input.alertRadiusM;
  if (input.geolocationConsent !== undefined)
    patch.geolocation_consent = input.geolocationConsent;
  const { error } = await supabase.from("private_profiles").update(patch).eq(
    "profile_id",
    (await supabase.auth.getUser()).data.user?.id ?? ""
  );
  if (error) throw error;
}

export async function setMyLocation(
  point: GeoPoint,
  radiusM: number
): Promise<void> {
  const { error } = await supabase.rpc("set_my_location", {
    p_lat: point.lat,
    p_lon: point.lon,
    p_radius_m: radiusM,
  });
  if (error) throw error;
}

export async function uploadPhoto(
  file: File,
  bucket: "pet-photos" | "post-images"
): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? "anon";
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Foto de perfil: `profiles` no tiene columna de avatar, así que el enlace
 * se guarda en los metadatos de la cuenta (auth.users.user_metadata.avatar_url).
 */
export async function updateAvatar(file: File): Promise<string> {
  const url = await uploadPhoto(file, "pet-photos");
  const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
  if (error) throw error;
  // Copia pública en profiles.avatar_url para que los demás la vean (columna creada por
  // supabase/sql/2026-10-12_completar_app.sql; si aún no existe, solo la ve el dueño)
  const userId = data.user?.id;
  if (userId) {
    const { error: pubError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    if (pubError) console.warn("[foto] no se pudo publicar en profiles (¿falta correr el SQL?)", pubError);
  }
  return url;
}

/**
 * Las fotos subidas antes de existir profiles.avatar_url solo estaban en los datos de la cuenta:
 * al iniciar sesión se copian a profiles para que los demás también las vean.
 */
export async function publishMyAvatar(userId: string, url: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error && error.code !== "42703") console.warn("[foto] no se pudo publicar la foto de perfil", error);
}

/** Fotos de perfil públicas de varios usuarios (para Comunidad). Vacío si falta la columna. */
// Si profiles.avatar_url aún no existe (falta correr el SQL), se deja de preguntar
// en esta sesión para no repetir el error 400 cada vez que se recarga el feed
let avatarColumnMissing = false;

export async function avatarsOf(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length || avatarColumnMissing) return {};
  const { data, error } = await supabase.from("profiles").select("id, avatar_url").in("id", userIds);
  if (error) {
    if (error.code === "42703") {
      avatarColumnMissing = true;
      console.warn(
        "[foto] falta la columna profiles.avatar_url: ejecuta supabase/sql/2026-10-12_completar_app.sql en Supabase"
      );
    }
    return {};
  }
  const map: Record<string, string> = {};
  for (const p of (data ?? []) as { id: string; avatar_url: string | null }[]) {
    if (p.avatar_url) map[p.id] = p.avatar_url;
  }
  return map;
}

// ---------------------------------------------------------------
// Perfil: nombre, ciudad y contadores
// ---------------------------------------------------------------

export async function updateProfileName(name: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
  if (error) throw error;
}

/** Ciudad del perfil: profiles no tiene columna, se guarda en los datos de la cuenta. */
export async function updateCity(city: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { city } });
  if (error) throw error;
}

/** Publicaciones del usuario (todas: publicadas y en revisión), como getMyStats de web-development. */
export async function myPostsCount(): Promise<number> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return 0;
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

// ---------------------------------------------------------------
// Adopción (pets.status = 'for_adoption' + adoption_interests)
// ---------------------------------------------------------------

/**
 * Trigger enforce_adoption_verified (migración 0046): mientras no se ejecute
 * supabase/sql/2026-10-13_adopcion_abierta.sql, solo veterinarias y refugios verificados pueden publicar.
 */
function adoptionError(error: { message?: string }): Error | { message?: string } {
  if (/refugios verificados/i.test(error.message ?? ""))
    return new Error(
      "Por ahora el servidor solo deja publicar en adopción a veterinarias y refugios verificados. Pídele al administrador que active la adopción para todos."
    );
  return error;
}

/**
 * Dar en adopción una mascota que ya está registrada: la misma fila de pets pasa a for_adoption
 * (no se crea otra). `description` reemplaza las señas: lleva el lugar y lo que cuente el dueño.
 */
export async function putPetUpForAdoption(petId: string, description: string | null): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("pets")
    .update({ status: "for_adoption", ...(description ? { description } : {}) })
    .eq("id", petId)
    .eq("user_id", userId);
  if (error) throw adoptionError(error);
}

/** Quitar de adopción: la mascota vuelve a ser solo tuya (status active). */
export async function removePetFromAdoption(petId: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("pets")
    .update({ status: "active" })
    .eq("id", petId)
    .eq("user_id", userId)
    .eq("status", "for_adoption");
  if (error) throw error;
}

export async function listAdoptionPets(limit = 20): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*, species:species(id, name)")
    .eq("status", "for_adoption")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Pet[];
}

/** "Me interesa adoptar": el dueño lo ve en la ficha de su mascota y puede aprobarlo. */
export async function expressAdoptionInterest(petId: string, message: string): Promise<void> {
  const { error } = await supabase.rpc("express_adoption_interest", { p_pet_id: petId, p_message: message });
  if (error) throw error;
}

export interface AdoptionInterest {
  id: string;
  pet_id: string;
  interested_user_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  created_at: string;
  interested?: { name: string } | null;
}

export async function listAdoptionInterests(petId: string): Promise<AdoptionInterest[]> {
  const { data, error } = await supabase
    .from("adoption_interests")
    .select("*, interested:profiles(name)")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdoptionInterest[];
}

/** El dueño aprueba o rechaza; al aprobar la mascota pasa a "adopted" (lo hace la RPC). */
export async function respondAdoptionInterest(interestId: string, status: "approved" | "rejected"): Promise<void> {
  const { error } = await supabase.rpc("respond_adoption_interest", { p_interest_id: interestId, p_status: status });
  if (error) throw error;
}

// ---------------------------------------------------------------
// "¡La encontré!" (report_matches): respuesta PRIVADA a una alerta.
// No es un chat: es como un comentario a la publicación que solo ve quien la publicó.
// Igual que en web-development (FoundPetReportPage + panel en CommunityPage).
// ---------------------------------------------------------------

export async function createReportMatch(input: {
  reportId: string;
  message?: string | null;
  contact?: string | null;
}): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("report_matches").insert({
    report_id: input.reportId,
    finder_id: userId,
    message: input.message?.trim() || null,
    contact: input.contact?.trim() || null,
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("duplicate")) throw new Error("Ya le enviaste un aviso al dueño de esta alerta.", { cause: error });
    if (msg.includes("muchas coincidencias"))
      throw new Error("Esta alerta ya recibió muchos avisos recientes. Intenta más tarde.", { cause: error });
    throw error;
  }
}

/** Avisos recibidos en una alerta propia (la RLS solo se los muestra al dueño de la alerta). */
export async function listReportMatches(reportId: string): Promise<ReportMatch[]> {
  const { data, error } = await supabase
    .from("report_matches")
    .select(
      "id, report_id, finder_id, message, contact, status, created_at, resolved_at, finder:profiles!report_matches_finder_id_fkey(name)"
    )
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ReportMatch[];
}

export async function resolveReportMatch(matchId: string, status: "confirmed" | "dismissed"): Promise<void> {
  const { error } = await supabase.from("report_matches").update({ status }).eq("id", matchId);
  if (error) throw error;
}

// ---------------------------------------------------------------
// Mis reportes (alertas que publicó el usuario)
// ---------------------------------------------------------------

/** Texto con el que empieza el comentario de resolución que el dueño deja en su alerta. */
export const RESOLUTION_PREFIX = "Resolución: ";

/** Alertas del usuario, la más nueva primero, con su publicación y la última resolución escrita. */
export async function myReports(): Promise<Record<string, unknown>[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, type, status, description, photos, created_at, resolved_at, species:species(name), pet:pets(name, photo_url), post:posts(id)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Record<string, unknown>[];

  // La resolución no tiene columna propia: es el comentario más reciente del dueño que empieza por RESOLUTION_PREFIX
  const postIdOf = (r: Record<string, unknown>) => {
    const post = r.post as { id: string } | { id: string }[] | null;
    return Array.isArray(post) ? post[0]?.id ?? null : post?.id ?? null;
  };
  const postIds = rows.map(postIdOf).filter(Boolean) as string[];
  const resolutions: Record<string, string> = {};
  if (postIds.length) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id, text, created_at")
      .eq("user_id", userId)
      .in("post_id", postIds)
      .like("text", `${RESOLUTION_PREFIX}%`)
      .order("created_at", { ascending: false });
    for (const c of (comments ?? []) as { post_id: string; text: string }[]) {
      if (!resolutions[c.post_id]) resolutions[c.post_id] = c.text.slice(RESOLUTION_PREFIX.length);
    }
  }
  return rows.map((r) => {
    const postId = postIdOf(r);
    return { ...r, post_id: postId, resolution: postId ? resolutions[postId] ?? "" : "" };
  });
}

/**
 * Cambia el estado de una alerta propia (open | searching | resolved | closed).
 * La resolución, si se escribe, se publica como comentario del dueño en la alerta.
 * Al cerrar la alerta deja de aparecer en el mapa y la mascota vuelve a "activa" (trigger sync_pet_status_from_report).
 */
export async function updateMyReport(
  reportId: string,
  input: { status: "open" | "searching" | "resolved" | "closed"; resolution?: string; postId?: string | null }
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const finished = input.status === "resolved" || input.status === "closed";
  const { error } = await supabase
    .from("reports")
    .update({ status: input.status, resolved_at: finished ? new Date().toISOString() : null })
    .eq("id", reportId)
    .eq("user_id", userId);
  if (error) throw error;
  const text = input.resolution?.trim();
  if (text && input.postId) await addComment(input.postId, `${RESOLUTION_PREFIX}${text}`);
}

/**
 * Reporte completo para la ficha: `reports_near` solo trae un resumen (sin raza, sexo,
 * tamaño, color ni edad). Incluye la mascota registrada si el reporte es de "perdí mi mascota".
 */
export async function getReportDetails(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, type, description, photos, sex, breed, color, size, age_estimate, lost_at, created_at, species:species(name), pet:pets(name, breed, sex, size, color, birth_date, photo_url, description, species:species(name))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Record<string, unknown> | null) ?? null;
}

/**
 * Qué cuentas son una veterinaria o un refugio (para la etiqueta extra en adopción y en "Publicado por"):
 * - con un lugar VERIFICADO en el mapa (vet_clinics): su tipo, que eligió el admin;
 * - sin lugar todavía pero con rol foundation: refugio.
 * El médico veterinario (persona) no lleva etiqueta.
 */
export async function publisherKinds(userIds: string[]): Promise<Record<string, "clinic" | "shelter">> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return {};
  const [places, roles] = await Promise.all([
    supabase.from("vet_clinics").select("created_by, kind, created_at").in("created_by", ids).eq("verified", true).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role").in("id", ids),
  ]);
  if (places.error) throw places.error;
  const kinds: Record<string, "clinic" | "shelter"> = {};
  for (const row of (places.data ?? []) as { created_by: string; kind: "clinic" | "shelter" }[]) {
    if (!kinds[row.created_by]) kinds[row.created_by] = row.kind;
  }
  for (const p of (roles.data ?? []) as { id: string; role: string }[]) {
    if (!kinds[p.id] && p.role === "foundation") kinds[p.id] = "shelter";
  }
  return kinds;
}

/**
 * "Publicado por" de una ficha: el autor de un reporte (reportId) o el dueño de una mascota (userId).
 * Devuelve su nombre y foto (profiles.avatar_url, si la columna existe).
 */
export async function getPublisher(input: {
  reportId?: string;
  userId?: string;
}): Promise<{ id: string; name: string; avatarUrl: string | null; kind: "clinic" | "shelter" | null } | null> {
  let userId = input.userId;
  if (!userId && input.reportId) {
    const { data, error } = await supabase.from("reports").select("user_id").eq("id", input.reportId).maybeSingle();
    if (error) throw error;
    userId = (data as { user_id: string } | null)?.user_id;
  }
  if (!userId) return null;
  const { data, error } = await supabase.from("profiles").select("id, name").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [avatars, kinds] = await Promise.all([avatarsOf([userId]), publisherKinds([userId]).catch(() => ({}))]);
  return {
    id: userId,
    name: (data as { name: string | null }).name || "Usuario de PetClue",
    avatarUrl: avatars[userId] ?? null,
    kind: (kinds as Record<string, "clinic" | "shelter">)[userId] ?? null,
  };
}

/**
 * Contexto de las alertas que aparecen en Comunidad (el post solo trae el texto/dirección):
 * perdida o encontrada, nombre, especie, sexo, tamaño y color — de la mascota registrada o del reporte.
 */
export async function alertSummaries(reportIds: string[]): Promise<Record<string, {
  type: "lost" | "found";
  status: string | null;
  petName: string | null;
  species: string | null;
  sex: string | null;
  size: string | null;
  color: string | null;
}>> {
  const ids = [...new Set(reportIds.filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("reports")
    .select("id, type, status, sex, size, color, species:species(name), pet:pets(name, sex, size, color, species:species(name))")
    .in("id", ids);
  if (error) throw error;
  const out: Record<string, any> = {};
  for (const r of (data ?? []) as any[]) {
    const pet = r.pet ?? {};
    out[r.id] = {
      type: r.type,
      status: r.status ?? null,
      petName: pet.name ?? null,
      species: pet.species?.name ?? r.species?.name ?? null,
      sex: pet.sex ?? r.sex ?? null,
      size: pet.size ?? r.size ?? null,
      color: pet.color ?? r.color ?? null,
    };
  }
  return out;
}

export async function getReportById(id: string): Promise<ReportNear | null> {
  const { data, error } = await supabase.rpc("report_by_id", { p_id: id });
  if (error) throw error;
  const rows = (data as ReportNear[]) ?? [];
  return rows[0] ?? null;
}

export async function getPostById(id: string): Promise<FeedItem | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, user_id, pet_id, type, content, image_url, report_id, created_at, author:profiles!posts_user_id_fkey(name)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    user_id: string;
    pet_id: string | null;
    type: string;
    content: string;
    image_url: string | null;
    report_id: string | null;
    created_at: string;
    author: { name: string } | null;
  };

  const userId = (await supabase.auth.getUser()).data.user?.id;
  const [comments, likes, mine] = await Promise.all([
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", id)
      .eq("is_hidden", false),
    supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", id),
    userId
      ? supabase
          .from("post_likes")
          .select("post_id", { count: "exact", head: true })
          .eq("post_id", id)
          .eq("user_id", userId)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    id: row.id,
    user_id: row.user_id,
    pet_id: row.pet_id,
    type: row.type,
    content: row.content,
    image_url: row.image_url,
    report_id: row.report_id,
    longitude: null,
    latitude: null,
    author_name: row.author?.name ?? "Usuario",
    tags: [],
    comment_count: comments.count ?? 0,
    like_count: likes.count ?? 0,
    liked_by_me: (mine.count ?? 0) > 0,
    created_at: row.created_at,
  };
}

export async function getPostByReportId(reportId: string): Promise<FeedItem | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("report_id", reportId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return getPostById((data as { id: string }).id);
}

export async function getCommentById(id: string): Promise<CommentRow | null> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, text, created_at, is_hidden, author:profiles!comments_user_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as CommentRow) ?? null;
}

export async function uploadPhotos(
  files: File[],
  bucket: "pet-photos" | "post-images"
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadPhoto(file, bucket));
  }
  return urls;
}

export async function changeEmail(input: {
  currentEmail: string;
  currentPassword: string;
  newEmail: string;
}): Promise<string | null> {
  const reauth = await supabase.auth.signInWithPassword({
    email: input.currentEmail,
    password: input.currentPassword,
  });
  if (reauth.error) return "Tu contraseña actual no es correcta.";
  const { error } = await supabase.auth.updateUser({ email: input.newEmail });
  return error ? translateAuthError(error) : null;
}

export async function changePassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<string | null> {
  const reauth = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.currentPassword,
  });
  if (reauth.error) {
    console.warn("[cambiar contraseña] la contraseña actual no coincide:", reauth.error);
    return "Tu contraseña actual no es correcta.";
  }
  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) {
    console.error("[cambiar contraseña] Supabase rechazó la contraseña nueva:", error);
    return translateAuthError(error);
  }
  const verifyError = await verifyPasswordSaved(input.email, input.newPassword);
  if (verifyError) return verifyError;
  await supabase.auth.signOut({ scope: "others" });
  return null;
}

/** Comprueba de verdad que Supabase guardó la contraseña: inicia sesión con la nueva. */
async function verifyPasswordSaved(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;
  console.error("[contraseña] la contraseña nueva no funciona al iniciar sesión:", error);
  return "Supabase no guardó la contraseña nueva. Intenta de nuevo; si sigue fallando, revisa la consola.";
}

/**
 * "Olvidé mi contraseña": Supabase envía un correo con un enlace de recuperación.
 * En el navegador el enlace vuelve a esta misma página. En el APK, `window.location.origin`
 * es https://localhost (no sirve fuera del celular), así que se usa VITE_PUBLIC_SITE_URL o,
 * si no está, la "Site URL" configurada en Supabase.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  // APK: el enlace abre la app (deep link). Web: vuelve a esta misma página.
  const site = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  const redirectTo = Capacitor.isNativePlatform() ? APP_RESET_URL : site || window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  return error ? translateAuthError(error) : null;
}

/** Guarda la contraseña nueva usando la sesión que crea el enlace de recuperación. */
export async function setNewPassword(newPassword: string): Promise<string | null> {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error("[recuperar contraseña] Supabase rechazó la contraseña nueva:", error);
    return translateAuthError(error);
  }
  const email = data.user?.email;
  return email ? verifyPasswordSaved(email, newPassword) : null;
}

export const SUPPORT_EMAIL = "soporte@petclue.co";

/**
 * Ayuda y soporte (igual que web-development): la Edge Function `send-support-message` guarda el
 * mensaje y lo envía a soporte@petclue.co (Resend, secreto RESEND_API_KEY). Si la función no
 * responde, el mensaje se guarda directo en `support_messages` (RLS: inserta el usuario, lee el admin).
 * `emailed` = false → el correo no salió y conviene ofrecer el mailto.
 */
export async function sendSupportMessage(input: {
  message: string;
  email: string;
  subject?: string;
}): Promise<{ emailed: boolean }> {
  const { data, error } = await supabase.functions.invoke("send-support-message", { body: input });
  if (!error) return { emailed: Boolean((data as { emailed?: boolean } | null)?.emailed) };

  console.warn("[soporte] send-support-message no respondió; se guarda en support_messages", error);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error: insertError } = await supabase.from("support_messages").insert({
    user_id: userId ?? null,
    email: input.email,
    subject: input.subject ?? null,
    message: input.message,
  });
  if (insertError) throw insertError;
  return { emailed: false };
}

export async function searchGuides(query: string, limit = 10): Promise<GuideRow[]> {
  const { data, error } = await supabase.rpc("search_guides", {
    p_q: query.trim() || null,
    p_limit: limit,
  });
  if (error) throw error;
  return data as GuideRow[];
}

// ---------------------------------------------------------------
// Admin (solo funciona con role = 'admin' por RLS/RPC)
// ---------------------------------------------------------------

export async function getModerationQueue(
  status = "under_review"
): Promise<ModerationPost[]> {
  const { data, error } = await supabase.rpc("get_moderation_queue", {
    p_status: status,
  });
  if (error) throw error;
  return newestFirst(data as ModerationPost[]);
}

export async function moderatePost(
  postId: string,
  status: "published" | "rejected"
): Promise<void> {
  const { error } = await supabase.rpc("moderate_post", {
    p_post_id: postId,
    p_status: status,
  });
  if (error) throw error;
}

export async function listPendingVetApplications(): Promise<VetApplication[]> {
  const { data, error } = await supabase
    .from("vet_applications")
    .select("*, applicant:profiles!vet_applications_user_id_fkey(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as VetApplication[];
}

/** Todas las solicitudes (pendientes, aprobadas y rechazadas) para la vista de admin. */
export async function listVetApplications(): Promise<VetApplication[]> {
  const { data, error } = await supabase
    .from("vet_applications")
    .select("*, applicant:profiles!vet_applications_user_id_fkey(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as VetApplication[];
}

export async function reviewVetApplication(
  applicationId: string,
  approved: boolean
): Promise<void> {
  const { error } = await supabase.rpc("review_vet_application", {
    p_application_id: applicationId,
    p_approved: approved,
  });
  if (error) throw error;
}

export async function listPendingClinics(): Promise<PendingClinic[]> {
  const { data, error } = await supabase
    .from("vet_clinics")
    .select(
      "id, name, address, kind, created_by, created_at, creator:profiles!vet_clinics_created_by_fkey(name)"
    )
    .eq("verified", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as PendingClinic[];
}

export async function verifyClinic(
  clinicId: string,
  approved: boolean
): Promise<void> {
  const { error } = await supabase.rpc("verify_clinic", {
    p_clinic_id: clinicId,
    p_approved: approved,
  });
  if (error) throw error;
}

/** Lugar en el mapa de una cuenta (para saber si una solicitud aprobada ya quedó ubicada). */
export async function placeOfUser(userId: string): Promise<{ id: string; name: string; address: string | null; kind: string; verified: boolean } | null> {
  const { data, error } = await supabase
    .from("vet_clinics")
    .select("id, name, address, kind, verified")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Tipo de lugar en el mapa de varias cuentas a la vez (para clasificar la lista de solicitudes). */
export async function placeKindsOfUsers(userIds: string[]): Promise<Record<string, "clinic" | "shelter">> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from("vet_clinics")
    .select("created_by, kind, created_at")
    .in("created_by", userIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const kinds: Record<string, "clinic" | "shelter"> = {};
  for (const row of (data ?? []) as { created_by: string; kind: "clinic" | "shelter" }[]) {
    if (!kinds[row.created_by]) kinds[row.created_by] = row.kind;
  }
  return kinds;
}

/**
 * Lo que decide el admin para un establecimiento: Veterinaria → rol vet, Refugio → rol foundation.
 * Se guarda en la solicitud (target_role) antes de aprobar, porque review_vet_application asigna ese rol.
 */
export const roleForKind = (kind: "clinic" | "shelter"): "vet" | "foundation" =>
  kind === "clinic" ? "vet" : "foundation";

export async function setApplicationRole(applicationId: string, role: "vet" | "foundation"): Promise<void> {
  const { error } = await supabase.from("vet_applications").update({ target_role: role }).eq("id", applicationId);
  if (error) throw error;
}

/** Cambia el rol de una cuenta ya aprobada (solo admin; la BD lo protege con protect_profile_role). */
export async function setUserRole(userId: string, role: "vet" | "foundation"): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

/** El admin cambia la etiqueta de un lugar ya aprobado: clinic = Veterinaria, shelter = Refugio. */
export async function updatePlaceKind(placeId: string, kind: "clinic" | "shelter"): Promise<void> {
  const { error } = await supabase.from("vet_clinics").update({ kind }).eq("id", placeId);
  if (error) throw error;
}

/**
 * Pone en el mapa la veterinaria o el refugio aprobado: crea su fila en vet_clinics ya verificada
 * y a nombre del solicitante (así luego la ve como "Mi clínica"). El admin tiene gestión total
 * sobre vet_clinics (RLS P3). Si la inserción directa no está permitida, usa create_clinic + verify_clinic.
 */
export async function createVerifiedPlace(input: {
  ownerId: string;
  name: string;
  address: string;
  point: GeoPoint;
  kind: "clinic" | "shelter";
}): Promise<void> {
  const adminId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data: created, error } = await supabase
    .from("vet_clinics")
    .insert({
      name: input.name,
      address: input.address,
      kind: input.kind,
      location: `SRID=4326;POINT(${input.point.lon} ${input.point.lat})`,
      created_by: input.ownerId,
      verified: true,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (!error) {
    // Una regla de la BD puede forzar verified=false al crear: se sella con verify_clinic para que salga en el mapa
    await verifyClinic((created as { id: string }).id, true);
    return;
  }

  console.warn("[mapa] inserción directa en vet_clinics rechazada, se usa create_clinic:", error);
  const { data: clinicId, error: rpcError } = await supabase.rpc("create_clinic", {
    p_name: input.name,
    p_address: input.address,
    p_phone: null,
    p_lat: input.point.lat,
    p_lon: input.point.lon,
    p_kind: input.kind,
  });
  if (rpcError) throw rpcError;
  await verifyClinic(clinicId as string, true);
}

export async function listCommentReports(): Promise<CommentReport[]> {
  const { data, error } = await supabase
    .from("comment_reports")
    .select(
      "*, comment:comments!comment_reports_comment_id_fkey(text), reporter:profiles!comment_reports_reporter_id_fkey(name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as CommentReport[];
}

export async function moderateComment(
  commentId: string,
  hidden: boolean
): Promise<void> {
  const { error } = await supabase.rpc("moderate_comment", {
    p_comment_id: commentId,
    p_hidden: hidden,
  });
  if (error) throw error;
}

export async function resolveCommentReports(
  commentId: string,
  status: "resolved" | "dismissed"
): Promise<void> {
  const { error } = await supabase
    .from("comment_reports")
    .update({ status })
    .eq("comment_id", commentId);
  if (error) throw error;
}

// ---------------------------------------------------------------
// Verificación profesional (vet / fundación) y mi clínica
// ---------------------------------------------------------------

export async function uploadVetDocument(file: File): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? "anon";
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage
    .from("vet-documents")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function getVetDocumentUrl(pathOrUrl: string): Promise<string | null> {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const { data, error } = await supabase.storage
    .from("vet-documents")
    .createSignedUrl(pathOrUrl, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function myVetApplication(): Promise<VetApplication | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("vet_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as VetApplication | null) ?? null;
}

/** Misma firma que en web-development: el RPC guarda todos los datos del formulario. */
export async function submitVetApplication(
  role: "vet" | "foundation",
  input: {
    documentPath: string;
    idDocumentPath: string | null;
    fullName: string | null;
    contactEmail: string | null;
    professionalLicense: string | null;
    degree: string | null;
    specialty: string | null;
  }
): Promise<void> {
  const rpc = role === "foundation" ? "apply_as_foundation" : "apply_as_vet";
  const { error } = await supabase.rpc(rpc, {
    p_document_url: input.documentPath,
    p_full_name: input.fullName,
    p_contact_email: input.contactEmail,
    p_professional_license: input.professionalLicense,
    p_degree: input.degree,
    p_specialty: input.specialty,
    p_id_document_url: input.idDocumentPath,
  });
  if (error) throw error;
}

export async function myClinic(): Promise<MyClinic | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("vet_clinics")
    .select("id, name, address, phone, kind, verified, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as MyClinic | null) ?? null;
}

export async function createMyClinic(input: {
  name: string;
  address: string;
  phone: string | null;
  point: GeoPoint;
  kind: "clinic" | "shelter";
}): Promise<void> {
  const { error } = await supabase.rpc("create_clinic", {
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_lat: input.point.lat,
    p_lon: input.point.lon,
    p_kind: input.kind,
  });
  if (error) throw error;
}

export async function updateMyClinic(
  clinicId: string,
  patch: { name?: string; address?: string; phone?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from("vet_clinics")
    .update(patch)
    .eq("id", clinicId);
  if (error) throw error;
}

/**
 * Editar un lugar YA verificado (RPC update_my_clinic del SQL 2026-10-12_completar_app.sql).
 * El teléfono se cambia sin perder la verificación; nombre, dirección o punto vuelven a revisión.
 * Devuelve true si quedó pendiente de verificar de nuevo.
 */
export async function updateMyVerifiedClinic(input: {
  name: string;
  address: string;
  phone: string | null;
  point?: GeoPoint | null;
  changedReviewable: boolean;
}): Promise<boolean> {
  const { error } = await supabase.rpc("update_my_clinic", {
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_lat: input.point?.lat ?? null,
    p_lon: input.point?.lon ?? null,
  });
  if (error) {
    if (error.code === "PGRST202")
      throw new Error("Falta ejecutar en Supabase el archivo supabase/sql/2026-10-12_completar_app.sql.", { cause: error });
    throw error;
  }
  return input.changedReviewable || Boolean(input.point);
}
