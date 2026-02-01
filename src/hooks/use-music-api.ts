import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiService";
import { useToast } from "@/hooks/use-notification";

export function useMusicApi() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // MUDANÇA AQUI: Agora aceita userId e search como parâmetros opcionais
  const useTracks = (userId?: string, search?: string) => useQuery({
    queryKey: ['tracks', userId, search],
    queryFn: async () => {
      // Constrói a URL corretamente baseada nos filtros
      let url = '/tracks';
      const params = new URLSearchParams();

      if (userId) params.append('user_id', userId);
      if (search) params.append('search', search);

      const queryString = params.toString();
      // Retorna /tracks?user_id=123 ou apenas /tracks
      const response = await api.fetch(queryString ? `${url}?${queryString}` : url);

      // Garantir que sempre retorna um array
      // API retorna { success, count, tracks: [...] }
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.tracks && Array.isArray(response.tracks)) {
        return response.tracks;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      // Se ainda não é array, retorna array vazio
      return [];
    }
  });

  // Fazer Upload e Criar Track
  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata, onProgress }: { file: File, metadata: any, onProgress: any }) => 
      api.uploadTrack(file, metadata, onProgress),
    onSuccess: async (data, variables: any) => {
      // Invalida cache e notifica envio concluído
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success("Música enviada com sucesso!", "Sua música foi publicada na plataforma");

      // Se a resposta já contém o registro (id/track), nada a fazer
      if (data?.id || data?.track?.id) return;

      // Caso o endpoint tenha apenas gravado no R2 e retornado publicUrl/r2_key, tentar criar o registro no D1
      try {
        const meta = variables?.metadata || {};
        const payload: any = {
          title: meta.title || 'Untitled',
          genre: meta.genre || 'Outro',
          artist: meta.artist || null,
          collaborations: meta.collaborations || null,
          is_public: !!meta.is_public,
          audio_url: data?.publicUrl || data?.public_url || null,
          r2_key_full: data?.r2_key || null,
        };

        if (!payload.audio_url) {
          console.warn('Sem audio_url retornada pelo /upload — não será criado registro automático.');
          return;
        }

        await api.fetch('/tracks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        toast.success('Registro criado', 'A música foi registrada no banco de dados');
      } catch (error: any) {
        console.error('Erro ao criar registro da música:', error);
        toast.error('Erro ao registrar música', error?.message || 'Tente novamente');
      }
    },
    onError: (error: any) => {
      toast.error("Erro no upload", error.message);
    }
  });

  // Adicionar track do banco global ao perfil do DJ
  const addTrackToProfileMutation = useMutation({
    mutationFn: (trackId: string) =>
      api.fetch("/user-library", {
        method: "POST",
        body: JSON.stringify({ track_id: trackId })
      }),
    onSuccess: () => {
      toast.success("Música adicionada", "Agora está no seu perfil");
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar", error.message);
    }
  });

  // Controlar publicidade de uma track (privada/pública)
  const updateTrackPublicityMutation = useMutation({
    mutationFn: ({ trackId, isPublic }: { trackId: string; isPublic: boolean }) =>
      api.updateTrackPublicity(trackId, isPublic),
    onSuccess: (_, { isPublic }) => {
      const status = isPublic ? "pública" : "privada";
      toast.success(`Marcado como ${status}`, `A música agora é ${status}`);
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar", error.message);
    }
  });

  // Atualizar campos da track (título, gênero, price_cents, etc.)
  const updateTrackMutation = useMutation({
    mutationFn: ({ trackId, payload }: { trackId: string; payload: any }) =>
      api.fetch(`/tracks/${trackId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Atualizado', 'Mudanças salvas com sucesso');
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar', error.message);
    }
  });

  // Remover música do perfil do usuário (sem deletar do DB)
  // Remove apenas a associação user-library, mantendo a track no banco
  const removeFromProfileMutation = useMutation({
    mutationFn: (trackId: string) => {
      console.log(`🗑️ Removendo track ${trackId} do perfil (não do banco)`);
      return api.fetch(`/user-library/${trackId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast.success('Removida', 'Música removida do seu perfil');
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: any) => {
      console.error('Erro ao remover do perfil:', error);
      toast.error('Erro ao remover', error.message);
    }
  });

  return { useTracks, uploadMutation, addTrackToProfileMutation, updateTrackPublicityMutation, updateTrackMutation, removeFromProfileMutation };
}
