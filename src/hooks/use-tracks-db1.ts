import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  fetchTracksFromDB1,
  fetchTrackByIdFromDB1,
  fetchUserTracksFromDB1,
  type TrackFromDB1,
} from "@/services/tracksDBService";

/**
 * Hook para buscar tracks da API externa (tabela d1)
 */
export function useTracksDB1(search?: string, isPublic: boolean = true) {
  return useQuery({
    queryKey: ["tracks-db1", search, isPublic],
    queryFn: async () => {
      const data = await fetchTracksFromDB1(search, isPublic);
      return data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar uma track específica pela ID da API externa
 */
export function useTrackByIdDB1(id: string) {
  return useQuery({
    queryKey: ["tracks-db1", id],
    queryFn: async () => {
      const data = await fetchTrackByIdFromDB1(id);
      return data;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar tracks de um usuário específico da API externa
 */
export function useUserTracksDB1(userId: string) {
  return useQuery({
    queryKey: ["user-tracks-db1", userId],
    queryFn: async () => {
      const data = await fetchUserTracksFromDB1(userId);
      return data;
    },
    enabled: !!userId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para adicionar uma track da API externa ao perfil do usuário
 */
export function useAddTrackFromDB1() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trackId: string) => {
      // Busca a track da API externa
      const track = await fetchTrackByIdFromDB1(trackId);
      return track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks-db1"] });
      toast({
        title: "Track Adicionada",
        description: "A track foi adicionada ao seu perfil.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar track",
        variant: "destructive",
      });
    },
  });
}
