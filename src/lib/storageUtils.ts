const SUPABASE_URL = "https://mlamcmbqmdegyhgvfthj.supabase.co";

/**
 * Converts a storage ID or partial path to a full Supabase storage URL
 * @param storageId - The storage ID or file path (e.g., "abc123def456" or "avatars/profile.jpg")
 * @param bucket - The bucket name (default: "profiles")
 * @returns A complete Supabase storage URL
 */
export function getStorageUrl(storageId: string | null | undefined, bucket: string = "profiles"): string {
  if (!storageId) return "";

  // If it's already a full URL, return as is
  if (storageId.startsWith("http://") || storageId.startsWith("https://")) {
    return storageId;
  }

  // If it contains a known domain, it's likely already a URL
  if (storageId.includes("supabase.co") || storageId.includes("cdn.builder.io")) {
    return storageId;
  }

  // Otherwise, construct the URL
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storageId}`;
}

/**
 * Extracts the storage path from a full URL (if needed)
 */
export function extractStoragePath(url: string): string {
  if (!url) return "";
  
  const parts = url.split("/object/public/");
  if (parts.length > 1) {
    return parts[1];
  }
  
  return url;
}
