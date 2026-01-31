// lib/apiService.ts
import { supabase } from "@/integrations/supabase/client";

const API_BASE = "https://api.conexaounk.com";

export const api = {
  // Função mestre para qualquer chamada (GET, POST, DELETE)
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
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Lógica específica de upload (Chunked)
  async uploadTrack(file: File, metadata: any, onProgress: (p: number) => void) {
    // Aqui entra sua lógica de fatiar o arquivo em 5MB (chunks)
    // conforme o limite da sua API.
    // 1. POST /upload-chunked (Inicia)
    // 2. Envia os pedaços...
    // 3. POST /tracks (Salva metadados no D1)
    
    // Por enquanto, simulando o envio simplificado:
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    return this.fetch("/upload-chunked", {
      method: "POST",
      body: formData,
      // No fetch padrão não tem onProgress nativo fácil, 
      // precisaria de XMLHttpRequest ou um loop de pedaços.
    });
  }
};
