import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Pack, PackWithTracks, InsertPack, InsertTrack } from "@/types/supabase";

export function usePacks(filters?: { genre?: string; search?: string }) {
  return useQuery({
    queryKey: ["packs", filters],
    queryFn: async () => {
      let query = supabase
        .from("packs")
        .select(`
          *,
          tracks (*),
          profile:profiles!packs_dj_id_fkey (*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PackWithTracks[];
    },
  });
}

export function usePack(id: string) {
  return useQuery({
    queryKey: ["packs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packs")
        .select(`
          *,
          tracks (*),
          profile:profiles!packs_dj_id_fkey (*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as PackWithTracks;
    },
    enabled: !!id,
  });
}

export function useCreatePack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPack & { tracks?: Omit<InsertTrack, "pack_id">[] }) => {
      const { tracks, ...packData } = data;

      // Create pack
      const { data: pack, error: packError } = await supabase
        .from("packs")
        .insert(packData)
        .select()
        .single();

      if (packError) throw packError;

      // Create tracks if provided
      if (tracks && tracks.length > 0) {
        const tracksWithPackId = tracks.map((track) => ({
          ...track,
          pack_id: pack.id,
        }));

        const { error: tracksError } = await supabase
          .from("tracks")
          .insert(tracksWithPackId);

        if (tracksError) throw tracksError;
      }

      return pack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({
        title: "Pack Criado",
        description: "Seu pack está agora disponível no marketplace!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Placeholder for order creation - can be expanded with proper orders table
export function useCreateOrder() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { items: string[]; paymentMethod: "pix" | "credit_card" }) => {
      // For now, just simulate the order creation
      // In production, you'd create an orders table and handle payments
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, items: data.items };
    },
    onSuccess: () => {
      toast({
        title: "Pedido Realizado!",
        description: "Obrigado pela sua compra.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para criar um pack customizado com seleção de 10 músicas
export interface CreatePackOrderInput {
  trackIds: string[];
  packName: string;
  packColor: string;
  djId: string;
  buyerId?: string;
}

export function useCreatePackOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePackOrderInput) => {
      // For now, just simulate the pack creation
      // In production, you'd:
      // 1. Create a new pack in the packs table
      // 2. Add the selected tracks to that pack
      // 3. Create an order/purchase record
      // 4. Handle payment processing

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate creating a pack
      const { data: newPack, error } = await supabase
        .from("packs")
        .insert({
          name: data.packName,
          dj_id: data.djId,
          is_free: false,
          price: 99.9, // 10 tracks × R$ 9.99
          color: data.packColor,
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, you would also:
      // - Add the selected tracks to the pack
      // - Create an order record for the purchase
      // - Handle payment processing

      return newPack;
    },
    onSuccess: (pack) => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({
        title: "Pack Criado com Sucesso!",
        description: `O pack "${pack.name}" foi adicionado ao seu catálogo.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar pack",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
