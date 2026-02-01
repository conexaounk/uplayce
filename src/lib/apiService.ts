// lib/apiService.ts
import { supabase } from "@/integrations/supabase/client";

const API_BASE = "https://api.conexaounk.com";

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

  // Upload simples para arquivos até 50MB
  async uploadTrack(file: File, metadata: any, onProgress?: (p: number) => void) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Usuário não autenticado");
    }

    // Escolher endpoint baseado no tamanho do arquivo
    const maxSimpleUpload = 50 * 1024 * 1024; // 50MB
    const useChunked = file.size > maxSimpleUpload;

    if (useChunked) {
      return this.uploadTrackChunked(file, metadata, onProgress);
    }

    const formData = new FormData();
    formData.append("file", file);

    // Campos permitidos pela API
    const allowedFields = ["title", "genre", "artist", "collaborations", "is_public"];

    Object.entries(metadata).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${session.access_token}`);
    // NÃO definir Content-Type para FormData

    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload falhou (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  // Upload chunked para arquivos grandes
  async uploadTrackChunked(file: File, metadata: any, onProgress?: (p: number) => void) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Usuário não autenticado");
    }

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB conforme API
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);

      // Adicionar metadata apenas no primeiro chunk
      if (chunkIndex === 0) {
        const allowedFields = ["title", "genre", "artist", "collaborations", "is_public"];
        Object.entries(metadata).forEach(([key, value]) => {
          if (allowedFields.includes(key) && value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }

      const headers = new Headers();
      headers.set("Authorization", `Bearer ${session.access_token}`);
      headers.set("X-Upload-Chunk", String(chunkIndex));
      headers.set("X-Upload-Total-Chunks", String(totalChunks));
      headers.set("X-Upload-Id", uploadId);

      const response = await fetch(`${API_BASE}/upload-chunked`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload do chunk ${chunkIndex + 1}/${totalChunks} falhou: ${errorText}`);
      }

      if (onProgress) {
        onProgress(((chunkIndex + 1) / totalChunks) * 100);
      }
    }

    // Retornar resultado do último chunk
    return { success: true, uploadId };
  },

  async updateTrackPublicity(trackId: string, isPublic: boolean) {
    return this.fetch(`/tracks/${trackId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_public: isPublic }),
    });
  },
};
