import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-notification";
import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";
console.log('🔌 API_BASE inicializado:', API_BASE);
console.log('🔌 Current origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');

// Helper function para retry com exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Tentativa ${attempt + 1} falhou:`, lastError.message);

      // Se não é a última tentativa, espera antes de retentar
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 1s, 2s, 4s
        console.log(`⏳ Retentando em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

export function useMusicApi() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch tracks com filtros opcionais
  const useTracks = (userId?: string, search?: string) => useQuery({
    queryKey: ['tracks', userId, search],
    retry: 2, // Retry automático do React Query
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('⚠️ useTracks: Sem token de autenticação');
        return [];
      }

      let url = '/tracks';
      const params = new URLSearchParams();

      if (userId) params.append('user_id', userId);
      if (search) params.append('search', search);

      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const fullApiUrl = `${API_BASE}${fullUrl}`;

      console.log('📡 useTracks: Tentando buscar de', fullApiUrl);
      console.log('📡 useTracks: userId=', userId, 'search=', search);

      try {
        console.log('🔐 Token presente:', !!session.access_token);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
          const response = await fetchWithRetry(fullApiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }, 2);

          clearTimeout(timeoutId);
          console.log('📡 useTracks: Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text().catch(() => response.statusText);
            console.warn(`⚠️ useTracks: Erro HTTP ${response.status}:`, errorText);

            // Tenta fazer parse como JSON para mensagem de erro da API
            try {
              const errorJson = JSON.parse(errorText);
              console.warn('⚠️ Erro da API:', errorJson);
            } catch (e) {
              // Ignorar se não for JSON
            }

            return [];
          }

          const data = await response.json();
          console.log('✅ useTracks: Dados recebidos:', data);

          // 1. Tenta encontrar a lista de tracks em diferentes formatos possíveis
          let allTracks: any[] = [];

          if (Array.isArray(data)) {
            allTracks = data;
          } else if (data && typeof data === 'object') {
            // Tenta chaves comuns: data, tracks, results
            allTracks = data.data || data.tracks || data.results || [];
          }

          console.log('📊 Total de tracks recebidas (bruto):', allTracks.length);

          if (allTracks.length > 0) {
            console.log('🔍 Exemplo de user_id na primeira track:', allTracks[0].user_id);
          }

          // 2. Se userId foi fornecido, filtra apenas as tracks desse usuário
          if (userId) {
            const filteredTracks = allTracks.filter((t: any) => {
              // Tratamento de strings: case insensitive e trim
              const trackUserId = String(t.user_id || '').trim().toLowerCase();
              const currentUserId = String(userId).trim().toLowerCase();
              return trackUserId === currentUserId;
            });

            console.log('✅ Total após filtrar pelo userId:', filteredTracks.length);
            return filteredTracks;
          }

          return allTracks;
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error('❌ Timeout na requisição (>10s)');
            toast.error('Timeout', 'A requisição demorou muito tempo. Tente novamente.');
          } else if (fetchError instanceof TypeError) {
            // TypeError geralmente é CORS ou rede indisponível
            console.error('❌ Erro de conexão (CORS ou rede):', fetchError.message);
            toast.error(
              'Erro de Conexão',
              'Não foi possível conectar à API. Verifique sua conexão ou tente mais tarde.'
            );
          } else {
            throw fetchError;
          }

          return [];
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Erro ao buscar tracks:', errorMsg);
        console.error('❌ API_BASE:', API_BASE);
        console.error('❌ Full URL:', fullApiUrl);
        console.error('❌ Stack:', error);

        // Mostrar toast de erro genérico
        toast.error(
          'Erro ao carregar tracks',
          'Ocorreu um erro ao buscar suas tracks. Tente novamente.'
        );

        return [];
      }
    }
  });

  // Upload de áudio
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata, onProgress }: { file: File, metadata: any, onProgress: any }) => {
      // 1. Upload do arquivo
      const uploadResult = await apiService.uploadAudio(file, { onProgress });
      
      // 2. Criar registro da track
      return await apiService.createTrack(
        uploadResult.publicUrl,
        uploadResult.r2_key,
        {
          title: metadata.title || 'Untitled',
          genre: metadata.genre || 'Outro',
          artist: metadata.artist || null,
          collaborations: metadata.collaborations || null,
          isPublic: !!metadata.is_public,
          coverUrl: metadata.cover_url || null,
          bpm: metadata.bpm || null,
          key: metadata.key || null,
          trackType: metadata.track_type || 'mashup',
          duration: metadata.duration || null,
        }
      );
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success("Música enviada com sucesso!", "Sua música foi publicada na plataforma");
    },
    onError: (error: any) => {
      toast.error("Erro no upload", error.message);
    }
  });

  // Adicionar track à biblioteca do usuário
  const addTrackToProfileMutation = useMutation({
    mutationFn: (trackId: string) => apiService.addToUserLibrary(trackId),
    onSuccess: () => {
      toast.success("Música adicionada", "Agora está no seu perfil");
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar", error.message);
    }
  });

  // Atualizar publicidade da track (privada/pública)
  const updateTrackPublicityMutation = useMutation({
    mutationFn: async ({ trackId, isPublic }: { trackId: string; isPublic: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Login necessário');

      const res = await fetch(`${API_BASE}/tracks/${trackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar publicidade');
      }

      return res.json();
    },
    onSuccess: (_, { isPublic }) => {
      const status = isPublic ? "pública" : "privada";
      toast.success(`Marcado como ${status}`, `A música agora é ${status}`);
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar", error.message);
    }
  });

  // Atualizar campos da track
  const updateTrackMutation = useMutation({
    mutationFn: async ({ trackId, payload }: { trackId: string; payload: any }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Login necessário');

      const res = await fetch(`${API_BASE}/tracks/${trackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar track');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Atualizado', 'Mudanças salvas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar', error.message);
    }
  });

  // Remover track do perfil do usuário
  const removeFromProfileMutation = useMutation({
    mutationFn: (trackId: string) => apiService.removeFromUserLibrary(trackId),
    onSuccess: () => {
      toast.success('Removida', 'Música removida do seu perfil');
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      console.error('Erro ao remover do perfil:', error);
      toast.error('Erro ao remover', error.message);
    }
  });

  return { 
    useTracks, 
    uploadMutation, 
    addTrackToProfileMutation, 
    updateTrackPublicityMutation, 
    updateTrackMutation, 
    removeFromProfileMutation 
  };
}
