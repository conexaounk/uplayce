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
      try {
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
          console.error("Erro ao inserir track no perfil:", error);
          if (error.message && error.message.includes("UNIQUE")) {
            throw new Error("Esta track já foi adicionada ao seu perfil");
          }
          // Se for erro de política de RLS
          if (error.message && error.message.includes("row level security")) {
            throw new Error("Você não tem permissão para adicionar tracks");
          }
          throw new Error(error.message || "Erro ao adicionar track");
        }

        return data;
      } catch (err) {
        console.error("Erro em useAddProfileTrack:", err);
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidar ambas as queries para atualizar
      queryClient.invalidateQueries({ queryKey: ["profile-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tracks"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : "Erro ao adicionar track";

      console.error("Erro na mutação:", error);

      toast({
        title: "Erro",
        description: errorMessage,
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
