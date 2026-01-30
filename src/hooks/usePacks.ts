import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Track {
  id: string;
  pack_id: string;
  dj_id: string;
  name: string;
  duration: number | null;
  bpm: number | null;
  preview_url: string | null;
  file_url: string | null;
  r2_key: string | null;
  order_index: number;
  genre: string | null;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pack {
  id: string;
  dj_id: string;
  name: string;
  description: string | null;
  price: number;
  is_free: boolean;
  cover_url: string | null;
  size_gb: number | null;
  genre: string | null;
  created_at: string;
  updated_at: string;
  tracks?: Track[];
}

interface CreatePackInput {
  name: string;
  description?: string;
  price?: number;
  is_free?: boolean;
  cover_url?: string;
  genre?: string;
}

interface AddTrackInput {
  name: string;
  file_url: string;
  r2_key: string;
  duration?: number;
  bpm?: number;
  genre?: string;
  is_preview?: boolean;
}

export function usePacks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPacks = useCallback(async (djId: string): Promise<Pack[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("packs")
        .select("*")
        .eq("dj_id", djId)
        .order("created_at", { ascending: false });

      if (err) throw err;

      // Fetch tracks para cada pack
      const packsWithTracks = await Promise.all(
        (data || []).map(async (pack) => {
          const { data: tracks } = await supabase
            .from("tracks")
            .select("*")
            .eq("pack_id", pack.id)
            .order("order_index", { ascending: true });

          return {
            ...pack,
            tracks: tracks || [],
          };
        })
      );

      return packsWithTracks;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar packs";
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPack = useCallback(
    async (djId: string, input: CreatePackInput): Promise<Pack | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("packs")
          .insert({
            dj_id: djId,
            name: input.name,
            description: input.description || null,
            price: input.price || 0,
            is_free: input.is_free ?? false,
            cover_url: input.cover_url || null,
            genre: input.genre || null,
          })
          .select()
          .single();

        if (err) throw err;

        toast.success("Pack criado com sucesso!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar pack";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updatePack = useCallback(
    async (packId: string, input: Partial<CreatePackInput>): Promise<Pack | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("packs")
          .update({
            ...(input.name && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.price !== undefined && { price: input.price }),
            ...(input.is_free !== undefined && { is_free: input.is_free }),
            ...(input.cover_url && { cover_url: input.cover_url }),
            ...(input.genre && { genre: input.genre }),
          })
          .eq("id", packId)
          .select()
          .single();

        if (err) throw err;

        toast.success("Pack atualizado com sucesso!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao atualizar pack";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePack = useCallback(async (packId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("packs")
        .delete()
        .eq("id", packId);

      if (err) throw err;

      toast.success("Pack deletado com sucesso!");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao deletar pack";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrack = useCallback(
    async (packId: string, djId: string, input: AddTrackInput): Promise<Track | null> => {
      setLoading(true);
      setError(null);
      try {
        // Contar tracks existentes para definir order_index
        const { data: existingTracks } = await supabase
          .from("tracks")
          .select("order_index")
          .eq("pack_id", packId)
          .order("order_index", { ascending: false })
          .limit(1);

        const nextIndex = (existingTracks?.[0]?.order_index ?? -1) + 1;

        const { data, error: err } = await supabase
          .from("tracks")
          .insert({
            pack_id: packId,
            dj_id: djId,
            name: input.name,
            file_url: input.file_url,
            r2_key: input.r2_key,
            duration: input.duration || null,
            bpm: input.bpm || null,
            genre: input.genre || null,
            is_preview: input.is_preview ?? false,
            order_index: nextIndex,
          })
          .select()
          .single();

        if (err) throw err;

        toast.success("Track adicionada ao pack!");
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao adicionar track";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTrack = useCallback(async (trackId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("tracks")
        .delete()
        .eq("id", trackId);

      if (err) throw err;

      toast.success("Track removida!");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover track";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPacks,
    createPack,
    updatePack,
    deletePack,
    addTrack,
    deleteTrack,
  };
}
