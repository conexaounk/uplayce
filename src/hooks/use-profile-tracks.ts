import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para buscar todas as tracks adicionadas ao perfil do usuário
 */
export function useProfileTracks(userId?: string) {
  return useQuery({
    queryKey: ["profile-tracks", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_profile_tracks")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

/**
 * Hook para adicionar uma track ao perfil do usuário
 */
export function useAddProfileTrack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("user_profile_tracks")
        .insert([
          {
            user_id: user.id,
            track_id: trackId,
          },
        ])
        .select();

      if (error) {
        if (error.message.includes("UNIQUE")) {
          throw new Error("Esta track já foi adicionada ao seu perfil");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar ambas as queries para atualizar
      queryClient.invalidateQueries({ queryKey: ["profile-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tracks"] });
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

/**
 * Hook para remover uma track do perfil do usuário
 */
export function useRemoveProfileTrack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("user_profile_tracks")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-tracks"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover track",
        variant: "destructive",
      });
    },
  });
}
