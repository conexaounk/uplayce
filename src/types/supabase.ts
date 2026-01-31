import type { Tables } from "@/integrations/supabase/types";

// Re-export database types for convenience
export type Profile = Tables<"profiles">;
export type Pack = Tables<"packs">;
export type Track = Tables<"tracks">;
export type Follow = Tables<"follows">;
export type Like = Tables<"likes">;
export type DJLink = Tables<"dj_links">;
export type Notification = Tables<"notifications">;

// Extended types with relationships
export type ProfileWithUser = Profile;

export type PackWithTracks = Pack & {
  tracks?: Track[];
  profile?: Profile;
};

export type TrackWithPack = Track & {
  pack?: Pack;
};

// Auth user type for our app
export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
}

// Insert types
export type InsertProfile = Omit<Profile, "created_at" | "updated_at">;
export type InsertPack = Omit<Pack, "id" | "created_at" | "updated_at">;
export type InsertTrack = Omit<Track, "id" | "created_at" | "updated_at">;
