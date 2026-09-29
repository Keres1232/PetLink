import { supabase } from "./supabase";
import type {
  CommentRow,
  FeedItem,
  GeoPoint,
  GuideRow,
  NotificationRow,
  Pet,
  PlaceNear,
  PrivateProfile,
  ReportNear,
  Species,
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
    .select("id, post_id, user_id, text, created_at, is_hidden, author:profiles(name)")
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
  const { data, error } = await supabase
    .from("pets")
    .select("*, species:species(id, name)")
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
}): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("No hay sesión activa.");
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
    status: "active",
  });
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
  if (reauth.error) return "Tu contrase�a actual no es correcta.";
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
  if (reauth.error) return "Tu contrase�a actual no es correcta.";
  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return error.message;
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
