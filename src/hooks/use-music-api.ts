import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-notification";
import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";
console.log('🔌 API_BASE inicializado:', API_BASE);

export function useMusicApi() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch tracks com filtros opcionais
  const useTracks = (userId?: string, search?: string) => useQuery({
    queryKey: ['tracks', userId, search],
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
        const response = await fetch(fullApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 useTracks: Response status:', response.status);

        if (!response.ok) {
          console.warn(`⚠️ useTracks: Erro HTTP ${response.status}:`, response.statusText);
          return [];
        }

        const data = await response.json();
        console.log('✅ useTracks: Dados recebidos:', data);

        // Garantir que sempre retorna um array
        if (Array.isArray(data)) {
          return data;
        }
        if (data?.tracks && Array.isArray(data.tracks)) {
          return data.tracks;
        }
        if (data?.data && Array.isArray(data.data)) {
          return data.data;
        }
        console.warn('⚠️ useTracks: Resposta não é um array:', data);
        return [];
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Erro ao buscar tracks:', errorMsg);
        console.error('❌ API_BASE:', API_BASE);
        console.error('❌ Full URL:', fullApiUrl);
        console.error('❌ Stack:', error);
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
