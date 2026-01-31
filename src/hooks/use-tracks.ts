import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchTracksFromDB1, type TrackFromDB1 } from "@/services/tracksDBService";

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  genre: string;
  user_id: string;
  audio_url: string;
  duration: number | null;
  is_public: boolean;
  created_at: string;
  r2_key_full: string | null;
}

export function useTracks(search?: string, isPublic: boolean = true) {
  return useQuery({
    queryKey: ["tracks", search, isPublic],
    queryFn: async () => {
      // Busca da API externa (tabela d1)
      const data = await fetchTracksFromDB1(search, isPublic);
      return data as Track[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useTrackById(id: string) {
  return useQuery({
    queryKey: ["tracks", id],
    queryFn: async () => {
      // Busca da API externa (tabela d1)
      const { fetchTrackByIdFromDB1 } = await import("@/services/tracksDBService");
      const data = await fetchTrackByIdFromDB1(id);
      return data as Track;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useUserTracks(userId?: string, search?: string) {
  return useQuery({
    queryKey: ["user-tracks", userId, search],
    queryFn: async () => {
      if (!userId) return [];

      const { fetchUserTracksFromDB1 } = await import("@/services/tracksDBService");
      const data = await fetchUserTracksFromDB1(userId);

      // Filtrar por busca se fornecido
      if (search) {
        const query = search.toLowerCase();
        return data.filter(track =>
          track.title.toLowerCase().includes(query) ||
          track.artist?.toLowerCase().includes(query) ||
          track.genre?.toLowerCase().includes(query)
        );
      }

      return data;
    },
    enabled: !!userId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddTrackToProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trackId: string) => {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // For now, we'll just mark the track as used by the user
      // In a real scenario, you might have a separate table for user tracks
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", trackId)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      toast({
        title: "Track Adicionado",
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
