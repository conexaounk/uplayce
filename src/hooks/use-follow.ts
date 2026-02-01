import { useAuth } from "./use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-notification";

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Query para verificar se já está seguindo
  const { data: isFollowing = false, isLoading: isCheckingFollow } = useQuery({
    queryKey: ["isFollowing", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar follow:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });

  // Query para contar followers
  const { data: followerCount = 0 } = useQuery({
    queryKey: ["followerCount", targetUserId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      if (error) {
        console.error("Erro ao contar followers:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!targetUserId,
  });

  // Mutation para fazer follow
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sucesso", "Você está seguindo este artista!");
      queryClient.invalidateQueries({ queryKey: ["isFollowing", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followerCount", targetUserId] });
    },
    onError: (error: any) => {
      console.error("Erro ao seguir:", error);
      toast.error("Erro", "Não foi possível seguir este artista.");
    },
  });

  // Mutation para fazer unfollow
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sucesso", "Você deixou de seguir este artista.");
      queryClient.invalidateQueries({ queryKey: ["isFollowing", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followerCount", targetUserId] });
    },
    onError: (error: any) => {
      console.error("Erro ao deixar de seguir:", error);
      toast.error("Erro", "Não foi possível deixar de seguir este artista.");
    },
  });

  const handleToggleFollow = async () => {
    if (!user?.id) {
      toast.error("Erro", "Você precisa estar autenticado para seguir artistas.");
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    isCheckingFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    followerCount,
    handleToggleFollow,
  };
}
