import { supabase } from '@/integrations/supabase/client';

const WORKER_URL = 'https://api.conexaounk.com';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SIMPLE_UPLOAD = 50 * 1024 * 1024; // 50MB - acima disso usa chunked

interface UploadOptions {
  onProgress?: (progress: { loaded: number; total: number } ) => void;
}

interface TrackData {
  title: string;
  genre: string;
  artist?: string | null;
  collaborations?: string | null;
  duration?: number | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  isExclusive?: boolean;
  priceCents?: number;
  bpm?: number | null;
  key?: string | null;
  trackType?: string;
  bpmConfidence?: number;
}

/* ======================================================
   UPLOAD EM CHUNKS
====================================================== */
async function uploadAudioChunked(
  file: File,
  options: UploadOptions = {}
): Promise<{ publicUrl: string; r2_key: string }> {

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Você precisa estar logado');
  }

  let uploadedBytes = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const uploadUrl = `${WORKER_URL}/upload-chunked`;
    console.log(`📤 Enviando chunk ${i + 1}/${totalChunks} para ${uploadUrl}`);

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-Upload-Id': uploadId,
          'X-Upload-Chunk': i.toString(),
          'X-Upload-Total-Chunks': totalChunks.toString(),
        },
        body: chunk,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Chunk ${i} falhou:`, {
          status: res.status,
          statusText: res.statusText,
          response: errText,
          url: uploadUrl,
        });
        const err = (() => { try { return JSON.parse(errText); } catch { return {}; } })();
        throw new Error(err.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      uploadedBytes += chunk.size;
      options.onProgress?.({ loaded: uploadedBytes, total: file.size });

      const result = await res.json();
      if (result.completed) {
        if (!result.publicUrl || !result.r2_key) {
          throw new Error(`Resposta incompleta: ${JSON.stringify(result)}`);
        }
        return {
          publicUrl: result.publicUrl,
          r2_key: result.r2_key,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erro no chunk ${i}:`, {
        error: errorMessage,
        url: uploadUrl,
        workerUrl: WORKER_URL,
      });
      if (errorMessage.includes('Failed to fetch')) {
        throw new Error(`❌ Erro ao conectar com o servidor de upload.`);
      }
      throw error;
    }
  }

  throw new Error('Upload em chunks não foi finalizado');
}

/* ======================================================
   UPLOAD SIMPLES
====================================================== */
async function uploadAudioSimple(
  file: File,
  options: UploadOptions = {}
): Promise<{ publicUrl: string; r2_key: string }> {

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Você precisa estar logado');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        options.onProgress?.({ loaded: e.loaded, total: e.total });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data.publicUrl || !data.r2_key) {
            reject(new Error(`Resposta incompleta: ${JSON.stringify(data)}`));
            return;
          }
          resolve({ publicUrl: data.publicUrl, r2_key: data.r2_key });
        } catch (e) {
          reject(new Error(`Resposta inválida: ${xhr.responseText}`));
        }
      } else {
        reject(new Error(`Erro no upload: ${xhr.status} - ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede'));
    
    const uploadUrl = `${WORKER_URL}/upload`;
    xhr.open('POST', uploadUrl);
    xhr.timeout = 300000;
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    
    xhr.send(formData); 
  });
}

/* ======================================================
   ESCOLHER MÉTODO DE UPLOAD
====================================================== */
export async function uploadAudio(file: File, options: UploadOptions = {}) {
  return file.size <= MAX_SIMPLE_UPLOAD
    ? await uploadAudioSimple(file, options)
    : await uploadAudioChunked(file, options);
}

/* ======================================================
   CRIAR TRACK (D1)
====================================================== */
export async function createTrack(
  audioUrl: string,
  r2Key: string,
  trackData: TrackData
): Promise<{ track_id: string }> {
  if (!trackData.title?.trim() || !trackData.genre?.trim() || !audioUrl) {
    throw new Error('Campos obrigatórios faltando');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Você precisa estar logado');

  const payload = {
    title: trackData.title.trim(),
    genre: trackData.genre.trim(),
    user_id: session.user.id,
    audio_url: audioUrl,
    r2_key_full: r2Key,
    artist: trackData.artist?.trim() || null,
    collaborations: trackData.collaborations?.trim() || null,
    duration: trackData.duration ?? null,
    is_public: trackData.isPublic === true,
    is_exclusive: trackData.isExclusive === true,
    price_cents: trackData.priceCents ?? 0,
    cover_url: trackData.coverUrl || null,
    bpm: trackData.bpm ?? null,
    key: trackData.key?.trim() || null,
    track_type: trackData.trackType?.trim() || 'mashup',
    bpm_confidence: trackData.bpmConfidence ?? 0.85,
  };

  const res = await fetch(`${WORKER_URL}/tracks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar track');
  }

  return res.json();
}

/* ======================================================
   PLAYLISTS (D1)
====================================================== */
interface PlaylistData {
  name: string;
  description?: string;
  cover_url?: string | null;
  isPublic?: boolean;
}

interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: number;
  created_at: string;
}

export async function createPlaylist(data: PlaylistData): Promise<Playlist> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description || null,
      is_public: data.isPublic !== false ? 1 : 0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar playlist');
  }

  const result = await res.json();
  return result.playlist;
}

export async function fetchUserPlaylists(): Promise<Playlist[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return [];

    const res = await fetch(`${WORKER_URL}/playlists`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.playlists || [];
  } catch (error) {
    return [];
  }
}

export async function fetchPlaylistById(playlistId: string): Promise<Playlist | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch(`${WORKER_URL}/playlists/${playlistId}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.playlist || null;
  } catch (error) {
    return null;
  }
}

export async function updatePlaylist(
  playlistId: string,
  data: { name?: string; description?: string | null; isPublic?: boolean }
): Promise<Playlist> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/playlists/${playlistId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      is_public: data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar playlist');
  }

  const result = await res.json();
  return result.playlist;
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao deletar playlist');
  }
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ track_id: trackId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao adicionar track à playlist');
  }
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/playlists/${playlistId}/tracks/${trackId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao remover track da playlist');
  }
}

export async function fetchPlaylistWithTracks(playlistId: string): Promise<{ playlist: Playlist; tracks: any[] } | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const res = await fetch(`${WORKER_URL}/playlists/${playlistId}/with-tracks`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

/* ======================================================
   USER LIBRARY
====================================================== */
export async function addToUserLibrary(trackId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/user-library`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ track_id: trackId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao adicionar à biblioteca`);
  }

  return res.json();
}

export async function fetchUserLibrary(limit = 100) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return [];

  const res = await fetch(`${WORKER_URL}/user-library?limit=${limit}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks || [];
}

export async function removeFromUserLibrary(trackId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${WORKER_URL}/user-library/${trackId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao remover da biblioteca`);
  }

  return res.json();
}

export async function checkUserLibraryExists(trackId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const res = await fetch(`${WORKER_URL}/user-library/${trackId}/exists`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) return false;
  const data = await res.json();
  return !!data.exists;
}
