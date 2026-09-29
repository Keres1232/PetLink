export type Role = "owner" | "vet" | "admin" | "foundation";
export type PetSex = "male" | "female" | "unknown";
export type PetSize = "small" | "medium" | "large";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  vet_status: string | null;
  created_at: string;
}

export interface PrivateProfile {
  profile_id: string;
  geolocation_consent: boolean;
  alert_radius_m: number | null;
  birth_date: string | null;
}

export interface Species {
  id: string;
  name: string;
}

export interface Pet {
  id: string;
  user_id: string;
  species_id: string | null;
  name: string;
  status: string;
  photo_url: string | null;
  description: string | null;
  birth_date: string | null;
  sex: PetSex | null;
  breed: string | null;
  color: string | null;
  size: PetSize | null;
  created_at: string;
  species?: Species | null;
}

export interface FeedItem {
  id: string;
  user_id: string;
  pet_id: string | null;
  type: string;
  content: string;
  image_url: string | null;
  report_id: string | null;
  longitude: number | null;
  latitude: number | null;
  author_name: string;
  tags: string[];
  comment_count: number;
  like_count: number;
  liked_by_me: boolean;
  created_at: string;
}

export interface ReportNear {
  id: string;
  type: "lost" | "found";
  status: string;
  description: string;
  pet_name: string | null;
  species_name: string | null;
  pet_photo_url: string | null;
  photos: string[];
  lost_at: string | null;
  post_id: string | null;
  distance_m: number;
  longitude: number;
  latitude: number;
  created_at: string;
}

export interface PlaceNear {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  kind: "clinic" | "shelter";
  verified: boolean;
  distance_m: number;
  longitude: number;
  latitude: number;
}

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  is_hidden: boolean;
  author?: Pick<Profile, "name"> | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: "geo_alert" | "post_reply" | "pet_reminder" | "post_like";
  title: string;
  body: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GuideRow {
  id: string;
  symptom: string;
  species_name: string | null;
  urgency_level: string | null;
  recommendation: string;
  validated_by: string | null;
  validated_at: string | null;
  source_count: number;
}

export const DEFAULT_CENTER: GeoPoint = { lat: 4.67, lon: -74.04 };
