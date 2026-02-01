import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiService";
import { toast } from "sonner";

export function useMusicApi() {
  const queryClient = useQueryClient();

  // MUDANÇA AQUI: Agora aceita userId e search como parâmetros opcionais
  const useTracks = (userId?: string, search?: string) => useQuery({
    queryKey: ['tracks', userId, search],
    queryFn: () => {
      // Constrói a URL corretamente baseada nos filtros
      let url = '/tracks';
      const params = new URLSearchParams();
      
      if (userId) params.append('user_id', userId);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      // Retorna /tracks?user_id=123 ou apenas /tracks
      return api.fetch(queryString ? `${url}?${queryString}` : url);
    }
  });

  // Fazer Upload e Criar Track
  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata, onProgress }: { file: File, metadata: any, onProgress: any }) => 
      api.uploadTrack(file, metadata, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success("Música enviada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro no upload: " + error.message);
    }
  });

  // Adicionar à biblioteca
  const addToLibraryMutation = useMutation({
    mutationFn: (trackId: string) => 
      api.fetch("/user-library", {
        method: "POST",
        body: JSON.stringify({ track_id: trackId })
      }),
    onSuccess: () => toast.success("Adicionado à sua biblioteca!")
  });

  return { useTracks, uploadMutation, addToLibraryMutation };
}
