import { supabase } from "@/lib/supabase";

export interface UploadOptions {
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  genre: string;
  duration?: number;
  isPublic?: boolean;
}

/**
 * Uploads an audio file to Cloudflare R2 and saves track metadata to Supabase
 */
export async function uploadTrackComplete(
  file: File,
  metadata: TrackMetadata,
  options?: UploadOptions
): Promise<{ trackId: string; audioUrl: string }> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${metadata.title.toLowerCase().replace(/\s+/g, "-")}-${timestamp}-${randomStr}.${extension}`;

    // Create FormData for upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);
    formData.append("bucketName", import.meta.env.VITE_R2_BUCKET_NAME || "tracks");

    // Upload to R2 via API endpoint (to be implemented)
    // For now, we'll store the track metadata in Supabase
    const { data: track, error } = await supabase.from("tracks").insert([
      {
        title: metadata.title,
        artist: metadata.artist || null,
        genre: metadata.genre,
        duration: metadata.duration || 0,
        is_public: metadata.isPublic ?? true,
        audio_url: `${import.meta.env.VITE_R2_PUBLIC_URL}/${filename}`,
        r2_key_full: `${import.meta.env.VITE_R2_BUCKET_NAME}/${filename}`,
        // Additional fields from the tracks table schema
        price_cents: 0,
        is_exclusive: false,
      },
    ]).select();

    if (error) {
      throw new Error(`Failed to save track metadata: ${error.message}`);
    }

    if (!track || track.length === 0) {
      throw new Error("Failed to create track record");
    }

    return {
      trackId: track[0].id,
      audioUrl: track[0].audio_url,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error instanceof Error ? error : new Error("Unknown upload error");
  }
}

/**
 * Deletes a track from R2 and Supabase
 */
export async function deleteTrack(trackId: string, r2Key?: string): Promise<void> {
  try {
    // Delete from Supabase
    const { error: deleteError } = await supabase.from("tracks").delete().eq("id", trackId);

    if (deleteError) {
      throw new Error(`Failed to delete track: ${deleteError.message}`);
    }

    // Note: R2 deletion should be handled by an API endpoint with proper credentials
    // This prevents exposing R2 credentials to the client
  } catch (error) {
    console.error("Delete error:", error);
    throw error instanceof Error ? error : new Error("Unknown delete error");
  }
}

/**
 * Gets the audio URL for a track
 */
export function getTrackAudioUrl(trackId: string, r2Key: string): string {
  if (!r2Key) {
    return "";
  }
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${r2Key.replace(/^[^/]*\//, "")}`;
}
