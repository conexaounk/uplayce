import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertPack, type InsertTrack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePacks(filters?: { genre?: string; search?: string }) {
  return useQuery({
    queryKey: [api.packs.list.path, filters],
    queryFn: async () => {
      const url = filters 
        ? `${api.packs.list.path}?${new URLSearchParams(filters as Record<string, string>).toString()}`
        : api.packs.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch packs");
      return api.packs.list.responses[200].parse(await res.json());
    },
  });
}

export function usePack(id: number) {
  return useQuery({
    queryKey: [api.packs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.packs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch pack details");
      return api.packs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPack & { tracks: Omit<InsertTrack, "packId">[] }) => {
      // Validate with schema first if possible, or trust server validation
      const res = await fetch(api.packs.create.path, {
        method: api.packs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create pack");
      }
      return api.packs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.packs.list.path] });
      toast({
        title: "Pack Created",
        description: "Your music pack is now live on the marketplace!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { items: number[], paymentMethod: 'pix' | 'credit_card' }) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Checkout failed");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Order Placed!",
        description: "Thank you for your purchase.",
        variant: "default",
      });
    }
  });
}
