/**
 * Service para buscar tracks da API externa (tabela d1)
 */

export interface TrackFromDB1 {
  id: string;
  title: string;
  genre: string;
  user_id: string;
  audio_url: string;
  duration: number | null;
  is_public: boolean;
  artist: string | null;
  price_cents: number;
  r2_key_preview: string | null;
  r2_key_full: string | null;
  created_at: string;
  updated_at: string;
  cover_url: string | null;
  bpm_confidence: number;
  bpm: number | null;
  is_exclusive: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";
const DB_ID = "1072a4a8-9411-48fa-b855-68d53f57edf6";

/**
 * Busca todas as tracks da tabela d1
 */
export async function fetchTracksFromDB1(
  search?: string,
  isPublic: boolean = true
): Promise<TrackFromDB1[]> {
  try {
    let url = `${API_URL}/d1/tracks?db=${DB_ID}&is_public=${isPublic}`;

    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrackFromDB1[];
  } catch (error) {
    console.error("Erro ao buscar tracks da API:", error);
    throw error;
  }
}

/**
 * Busca uma track específica pelo ID
 */
export async function fetchTrackByIdFromDB1(trackId: string): Promise<TrackFromDB1> {
  try {
    const url = `${API_URL}/d1/tracks/${trackId}?db=${DB_ID}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrackFromDB1;
  } catch (error) {
    console.error("Erro ao buscar track da API:", error);
    throw error;
  }
}

/**
 * Busca tracks de um usuário específico
 */
export async function fetchUserTracksFromDB1(userId: string): Promise<TrackFromDB1[]> {
  try {
    const url = `${API_URL}/d1/users/${userId}/tracks?db=${DB_ID}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrackFromDB1[];
  } catch (error) {
    console.error("Erro ao buscar tracks do usuário:", error);
    throw error;
  }
}
