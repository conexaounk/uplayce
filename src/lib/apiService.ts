// lib/apiService.ts
import { supabase } from "@/integrations/supabase/client";

const API_BASE = "https://api.conexaounk.com";

// Helper para remover undefined, strings vazias e valores inválidos
function cleanPayload(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      // Remove undefined e valores inválidos
      if (value === undefined) return false;
      // Mantém null, 0, false, [] e {} (devem ser explícitos)
      return true;
    })
  );
}

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = new Headers(options.headers);
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  // Upload simples para arquivos
  async uploadTrack(file: File, metadata: any, onProgress?: (p: number) => void) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Usuário não autenticado");
    }

    // 1. Upload do arquivo para o R2 (usando FormData)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("type", "audio");

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${session.access_token}`);

    const uploadResponse = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload para R2 falhou (${uploadResponse.status}): ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Simular progresso durante upload (já completado)
    if (onProgress) {
      onProgress(100);
    }

    // 2. AGORA O PULO DO GATO: Salvar no D1
    // Chamamos a rota /tracks com os metadados completos
    const cleanedPayload = cleanPayload({
      ...metadata,
      audio_url: uploadResult.url, // Link que veio do R2
      bpm: metadata.bpm,
      key: metadata.key,
    });

    console.log('📝 Payload limpo para /tracks:', cleanedPayload);

    return this.fetch("/tracks", {
      method: "POST",
      body: JSON.stringify(cleanedPayload),
    });
  },


  async updateTrackPublicity(trackId: string, isPublic: boolean) {
    return this.fetch(`/tracks/${trackId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_public: isPublic }),
    });
  },
};
