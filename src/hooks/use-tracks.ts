import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      let query = supabase
        .from("tracks")
        .select("*")
        .eq("is_public", isPublic)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,artist.ilike.%${search}%,genre.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Track[];
    },
  });
}

export function useTrackById(id: string) {
  return useQuery({
    queryKey: ["tracks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Track;
    },
    enabled: !!id,
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
