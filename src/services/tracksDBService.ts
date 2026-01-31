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

/**
 * Busca todas as tracks da tabela d1 (D1 database)
 */
export async function fetchTracksFromDB1(
  search?: string,
  isPublic: boolean = true
): Promise<TrackFromDB1[]> {
  try {
    const params = new URLSearchParams();
    if (isPublic) {
      params.append("public", "true");
    }
    if (search) {
      params.append("search", search);
    }

    const url = `${API_URL}/tracks?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.tracks || data) as TrackFromDB1[];
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
    const url = `${API_URL}/tracks/${trackId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.track || data) as TrackFromDB1;
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
    const url = `${API_URL}/tracks?user_id=${encodeURIComponent(userId)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.tracks || data) as TrackFromDB1[];
  } catch (error) {
    console.error("Erro ao buscar tracks do usuário:", error);
    throw error;
  }
}
