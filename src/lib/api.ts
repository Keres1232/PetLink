import { supabase } from "./supabase";
import { isWeakPasswordError, PASSWORD_POLICY_HINT } from "./authErrors";
import type {
  AdoptionInterest,
  CommentReport,
  CommentRow,
  FeedItem,
  GeoPoint,
  GuideRow,
  ModerationPost,
  MyClinic,
  MyPlace,
  NotificationRow,
  PendingClinic,
  Pet,
  PlaceNear,
  PrivateProfile,
  RecentContentRow,
  ReportMatch,
  ReportNear,
  Species,
  VetApplication,
} from "./types";

export async function getFeed(opts?: {
  type?: string;
  limit?: number;
}): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc("get_feed", {
    p_type: opts?.type ?? null,
    p_limit: opts?.limit ?? 20,
  });
  if (error) throw error;
  return data as FeedItem[];
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
  if (error) throw error;
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
    .select("id, post_id, user_id, text, created_at, is_hidden, author:profiles!comments_user_id_fkey(name, avatar_url)")
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as CommentRow[];
}

export async function addComment(postId: string, text: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, text });
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
  const { data, error } = await supabase
    .from("pets")
    .select("*, species:species(id, name)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Pet[];
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
  speciesId: string | null;
  description: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  sex?: "male" | "female" | "unknown" | null;
  breed?: string | null;
  color?: string | null;
  size?: "small" | "medium" | "large" | null;
  status?: "active" | "for_adoption";
}): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { data, error } = await supabase
    .from("pets")
    .insert({
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
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updatePet(
  id: string,
  input: {
    name: string;
    speciesId: string | null;
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

/** Soft delete: la mascota deja de mostrarse al usuario pero se conserva en la BD. */
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

export async function getMyPet(id: string): Promise<Pet | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("pets")
    .select("*, species:species(id, name)")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Pet | null) ?? null;
}

export async function getMyStats(): Promise<{ posts: number; activeReports: number }> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { posts: 0, activeReports: 0 };
  const [posts, reports] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "open"),
  ]);
  if (posts.error) throw posts.error;
  if (reports.error) throw reports.error;
  return { posts: posts.count ?? 0, activeReports: reports.count ?? 0 };
}

export async function updateProfileName(name: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
  if (error) throw error;
}

export async function getPrivateProfile(): Promise<PrivateProfile | null> {
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
  bucket: "pet-photos" | "post-images" | "avatars"
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

/** Borra un archivo público del storage a partir de su URL (best-effort). */
export async function removePhoto(
  bucket: "pet-photos" | "post-images" | "avatars",
  url: string
): Promise<void> {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  await supabase.storage.from(bucket).remove([path]);
}

export async function updateAvatar(url: string | null): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) throw error;
}

export async function getReportById(
  id: string,
  point?: GeoPoint | null
): Promise<ReportNear | null> {
  const { data, error } = await supabase.rpc("report_by_id", {
    p_id: id,
    p_lat: point?.lat ?? null,
    p_lon: point?.lon ?? null,
  });
  if (error) throw error;
  const rows = (data as ReportNear[]) ?? [];
  return rows[0] ?? null;
}

export async function getPostById(id: string): Promise<FeedItem | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, user_id, pet_id, type, content, image_url, report_id, created_at, author:profiles!posts_user_id_fkey(name, avatar_url, role, vet_status)"
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
    author: { name: string; avatar_url: string | null; role: string | null; vet_status: string | null } | null;
  };

  const userId = (await supabase.auth.getUser()).data.user?.id;
  const [comments, likes, mine] = await Promise.all([
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", id)
      .eq("is_hidden", false),
    supabase.from("post_likes").select("post_id", { count: "exact", head: true }).eq("post_id", id),
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
    author_avatar_url: row.author?.avatar_url ?? null,
    author_role: row.author?.role ?? null,
    author_vet_status: row.author?.vet_status ?? null,
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
  bucket: "pet-photos" | "post-images" | "avatars"
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
  return error ? error.message : null;
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
  if (reauth.error) return "Tu contraseña actual no es correcta.";
  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return isWeakPasswordError(error) ? PASSWORD_POLICY_HINT : error.message;
  await supabase.auth.signOut({ scope: "others" });
  return null;
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
  return data as ModerationPost[];
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

/** El admin cambia la etiqueta de un lugar: clinic = Veterinaria, shelter = Refugio (RLS admin). */
export async function updatePlaceKind(
  placeId: string,
  kind: "clinic" | "shelter"
): Promise<void> {
  const { error } = await supabase.from("vet_clinics").update({ kind }).eq("id", placeId);
  if (error) throw error;
}

/**
 * Contenido reciente para moderar (pestaña "Contenido" del panel):
 * alertas/reportes + publicaciones ya visibles (las alertas no salen como post suelto).
 * Límite amplio para que también aparezcan las alertas viejas (el buscador del panel filtra).
 */
export async function listRecentContent(limit = 200): Promise<RecentContentRow[]> {
  const [reportsRes, postsRes] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, type, status, description, photos, created_at, author:profiles!reports_user_id_fkey(name), pet:pets!reports_pet_id_fkey(name), species:species!reports_species_id_fkey(name)"
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("posts")
      .select("id, type, content, image_url, created_at, author:profiles!posts_user_id_fkey(name)")
      .eq("moderation_status", "published")
      .is("report_id", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (reportsRes.error) throw reportsRes.error;
  if (postsRes.error) throw postsRes.error;

  const reports = (reportsRes.data ?? []) as unknown as {
    id: string;
    type: string;
    status: string;
    description: string | null;
    photos: string[] | null;
    created_at: string;
    author?: { name: string } | null;
    pet?: { name: string } | null;
    species?: { name: string } | null;
  }[];
  const posts = (postsRes.data ?? []) as unknown as {
    id: string;
    type: string;
    content: string | null;
    image_url: string | null;
    created_at: string;
    author?: { name: string } | null;
  }[];

  const rows: RecentContentRow[] = [
    ...reports.map((r) => ({
      kind: "report" as const,
      id: r.id,
      type: r.type,
      status: r.status,
      text: r.description,
      image: Array.isArray(r.photos) && r.photos.length > 0,
      created_at: r.created_at,
      author_name: r.author?.name ?? "Usuario",
      pet_name: r.pet?.name ?? r.species?.name ?? null,
    })),
    ...posts.map((p) => ({
      kind: "post" as const,
      id: p.id,
      type: p.type,
      status: null,
      text: p.content,
      image: Boolean(p.image_url),
      created_at: p.created_at,
      author_name: p.author?.name ?? "Usuario",
      pet_name: null,
    })),
  ];
  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return rows.slice(0, limit);
}

/** Admin: borra una alerta/reporte de otro usuario (y su publicación pareada). */
export async function adminDeleteReport(reportId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_report", { p_report_id: reportId });
  if (error) throw error;
}

/** Admin: borra una publicación de otro usuario (si es alerta, también su reporte). */
export async function adminDeletePost(postId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_post", { p_post_id: postId });
  if (error) throw error;
}

/**
 * Admin: quita una mascota de otra persona, p. ej. una publicación de adopción
 * (borrado lógico con `deleted_at`, igual que cuando la borra su dueño).
 */
export async function adminDeletePet(petId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_pet", { p_pet_id: petId });
  if (!error) return;
  if (error.code === "PGRST202") {
    throw new Error(
      "Para que el admin borre mascotas falta aplicar la migración 0056_admin_delete_pet en Supabase."
    );
  }
  throw error;
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

export async function moderateCommentAndResolve(
  commentId: string,
  hidden: boolean,
  status: "resolved" | "dismissed" = "resolved"
): Promise<void> {
  const { error } = await supabase.rpc("moderate_comment_and_resolve", {
    p_comment_id: commentId,
    p_hidden: hidden,
    p_status: status,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------
// Coincidencias "¡La encontré!" (report_matches)
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
  if (error) throw error;
}

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

export async function resolveReportMatch(
  matchId: string,
  status: "confirmed" | "dismissed"
): Promise<void> {
  const { error } = await supabase.from("report_matches").update({ status }).eq("id", matchId);
  if (error) throw error;
}

/** Cierra el reporte del dueño ("Ya la recuperé"); la alerta desaparece y la mascota vuelve a activa. */
export async function resolveMyReport(reportId: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
  const { error } = await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------------------------------------------------------
// Mi actividad: mis reportes (alertas) y mis publicaciones
// (homologado de la app: MyReportsPage)
// ---------------------------------------------------------------

/** Texto con el que empieza el comentario de resolución que el dueño deja en su alerta. */
export const RESOLUTION_PREFIX = "Resolución: ";

export interface MyReportRow {
  id: string;
  type: string;
  status: string;
  description: string | null;
  photos: string[] | null;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  species_name: string | null;
  pet_name: string | null;
  pet_photo_url: string | null;
  post_id: string | null;
}

function joinedName(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" && "name" in row ? String((row as { name: unknown }).name) : null;
}

function joinedField(value: unknown, field: string): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" && field in row
    ? ((row as Record<string, unknown>)[field] as string | null)
    : null;
}

/** Alertas del usuario (más nueva primero) con su publicación y la última resolución escrita. */
export async function myReports(): Promise<MyReportRow[]> {
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
  const postIdOf = (r: Record<string, unknown>) => joinedField(r.post, "id");
  const postIds = rows.map(postIdOf).filter(Boolean) as string[];

  // La resolución no tiene columna propia: es el comentario más reciente del
  // dueño que empieza por RESOLUTION_PREFIX.
  const resolutions: Record<string, string> = {};
  if (postIds.length) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id, text, created_at")
      .in("post_id", postIds)
      .like("text", `${RESOLUTION_PREFIX}%`)
      .order("created_at", { ascending: false });
    for (const c of (comments ?? []) as { post_id: string; text: string }[]) {
      if (!resolutions[c.post_id]) resolutions[c.post_id] = c.text.slice(RESOLUTION_PREFIX.length);
    }
  }

  return rows.map((r) => {
    const postId = postIdOf(r);
    return {
      id: r.id as string,
      type: r.type as string,
      status: r.status as string,
      description: (r.description as string) ?? null,
      photos: (r.photos as string[]) ?? null,
      created_at: r.created_at as string,
      resolved_at: (r.resolved_at as string) ?? null,
      resolution: postId ? resolutions[postId] ?? null : null,
      species_name: joinedName(r.species),
      pet_name: joinedName(r.pet),
      pet_photo_url: joinedField(r.pet, "photo_url"),
      post_id: postId,
    };
  });
}

/** Cambia el estado de una alerta propia; al resolverla/cerrarla deja una resolución. */
export async function updateMyReport(
  reportId: string,
  input: {
    status: "open" | "searching" | "resolved" | "closed";
    resolution?: string;
    postId?: string | null;
  }
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

export interface MyPostRow {
  id: string;
  type: string;
  content: string;
  image_url: string | null;
  moderation_status: string;
  created_at: string;
}

/** Publicaciones propias de la comunidad (más nueva primero), con su estado de moderación. */
export async function myPosts(): Promise<MyPostRow[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("id, type, content, image_url, moderation_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MyPostRow[];
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
  const bucketPath = extractVetDocumentPath(pathOrUrl);
  if (!bucketPath) return null;
  const { data, error } = await supabase.storage
    .from("vet-documents")
    .createSignedUrl(bucketPath, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Extrae la ruta interna de `vet-documents`; rechaza URLs externas o rutas sospechosas. */
function extractVetDocumentPath(input: string): string | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  const marker = "/vet-documents/";
  const idx = value.indexOf(marker);
  const candidate = idx >= 0 ? value.slice(idx + marker.length) : value;
  if (candidate.includes("://") || candidate.startsWith("//")) return null;
  const clean = candidate.replace(/^\/+/, "").split("?")[0];
  if (clean.includes("..")) return null;
  if (!/^[A-Za-z0-9._-]+\/[^/]+$/.test(clean)) return null;
  return clean;
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/restablecer`,
  });
  return error ? error.message : null;
}

export async function setNewPassword(newPassword: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) return null;
  return isWeakPasswordError(error) ? PASSWORD_POLICY_HINT : error.message;
}

/**
 * Ayuda y soporte: guarda el mensaje y lo envía a soporte@petclue.co
 * (Edge Function `send-support-message`). Si la función no está disponible,
 * el mensaje queda igualmente registrado en la BD.
 */
export async function sendSupportMessage(input: {
  message: string;
  email: string;
  subject?: string;
}): Promise<{ emailed: boolean }> {
  const { data, error } = await supabase.functions.invoke("send-support-message", {
    body: input,
  });
  if (!error) {
    return { emailed: Boolean((data as { emailed?: boolean } | null)?.emailed) };
  }
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { error: insertError } = await supabase.from("support_messages").insert({
    user_id: userId ?? null,
    email: input.email,
    subject: input.subject ?? null,
    message: input.message,
  });
  if (insertError) throw error;
  return { emailed: false };
}

/** "Me interesa adoptar": mensaje privado al dueño (le llega como interesado). */
export async function expressAdoptionInterest(petId: string, message: string): Promise<void> {
  const { error } = await supabase.rpc("express_adoption_interest", {
    p_pet_id: petId,
    p_message: message,
  });
  if (error) throw error;
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

/** El dueño aprueba o rechaza; al aprobar la mascota pasa a "adopted". */
export async function respondAdoptionInterest(
  interestId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase.rpc("respond_adoption_interest", {
    p_interest_id: interestId,
    p_status: status,
  });
  if (error) throw error;
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

/** Punto de un lugar: PostGIS (geography) llega como GeoJSON o WKB hex por PostgREST. */
export function parseGeoPoint(value: unknown): GeoPoint | null {
  if (!value) return null;
  if (typeof value === "object") {
    const coords = (value as { coordinates?: number[] }).coordinates;
    return coords?.length === 2 ? { lon: coords[0], lat: coords[1] } : null;
  }
  if (typeof value !== "string" || !/^[0-9a-fA-F]+$/.test(value) || value.length < 42) return null;
  const bytes = new Uint8Array(value.match(/../g)!.map((h) => parseInt(h, 16)));
  const view = new DataView(bytes.buffer);
  const little = bytes[0] === 1;
  const type = view.getUint32(1, little);
  let offset = 5;
  if (type & 0x20000000) offset += 4; // trae SRID
  if ((type & 0xff) !== 1) return null; // solo puntos
  const lon = view.getFloat64(offset, little);
  const lat = view.getFloat64(offset + 8, little);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

const PLACE_COLUMNS = "id, name, address, phone, kind, verified, created_at, location";

const withPoint = (row: unknown): MyPlace => {
  const { location, ...rest } = row as MyClinic & { location?: unknown };
  return { ...(rest as MyClinic), point: parseGeoPoint(location) };
};

/** Todas las sedes (veterinarias / refugios / consultorios) de la cuenta, la más reciente primero. */
export async function myPlaces(): Promise<MyPlace[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("vet_clinics")
    .select(PLACE_COLUMNS)
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(withPoint);
}

/** Una sede propia por id. */
export async function getMyPlace(id: string): Promise<MyPlace | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("vet_clinics")
    .select(PLACE_COLUMNS)
    .eq("id", id)
    .eq("created_by", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? withPoint(data) : null;
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

/**
 * Editar una sede propia (RPC update_my_place): el teléfono cambia al instante; si cambian el
 * nombre, la dirección o la ubicación, vuelve a revisión. Devuelve true si volvió a revisión.
 */
export async function updateMyPlace(
  id: string,
  patch: { name: string; address: string; phone: string | null; point?: GeoPoint | null }
): Promise<boolean> {
  const { data, error } = await supabase.rpc("update_my_place", {
    p_id: id,
    p_name: patch.name,
    p_address: patch.address,
    p_phone: patch.phone,
    p_lat: patch.point?.lat ?? null,
    p_lon: patch.point?.lon ?? null,
  });
  if (!error) return data === true;
  if (error.code !== "PGRST202") throw error;
  // Sin la función (migración sin aplicar): solo funciona en sedes pendientes (RLS)
  const direct = await supabase
    .from("vet_clinics")
    .update({ name: patch.name, address: patch.address, phone: patch.phone })
    .eq("id", id)
    .select("id");
  if (direct.error) throw direct.error;
  if (!direct.data?.length) {
    throw new Error("Para editar una sede ya verificada hay que aplicar la migración 0054_my_places.");
  }
  return false;
}

/** Eliminar una sede propia (RPC delete_my_place). */
export async function deleteMyPlace(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_my_place", { p_id: id });
  if (!error) return;
  if (error.code !== "PGRST202") throw error;
  // Sin la función: borrado directo (la RLS solo lo permite en sedes pendientes)
  const direct = await supabase.from("vet_clinics").delete().eq("id", id).select("id");
  if (direct.error || !direct.data?.length) {
    throw new Error("Para eliminar una sede ya verificada hay que aplicar la migración 0054_my_places.");
  }
}
