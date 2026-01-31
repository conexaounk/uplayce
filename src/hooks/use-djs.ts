import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useDJs() {
  return useQuery({
    queryKey: [api.djs.list.path],
    queryFn: async () => {
      const res = await fetch(api.djs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch DJs");
      return api.djs.list.responses[200].parse(await res.json());
    },
  });
}

export function useDJ(id: number) {
  return useQuery({
    queryKey: [api.djs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.djs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch DJ profile");
      return api.djs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<InsertProfile>) => {
      const res = await fetch(api.djs.updateProfile.path, {
        method: api.djs.updateProfile.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update profile");
      return api.djs.updateProfile.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.djs.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); // Refresh auth user data if needed
      toast({
        title: "Profile Updated",
        description: "Your DJ profile changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
