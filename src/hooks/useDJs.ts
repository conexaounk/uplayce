import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DJProfile {
  id: string;
  dj_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  background_url: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  music_links?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useDJs() {
  const [djs, setDJs] = useState<DJProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDJs = async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("profiles").select("*");

      if (searchQuery && searchQuery.trim()) {
        query = query.ilike("dj_name", `%${searchQuery}%`);
      }

      const { data, error: err } = await query;

      if (err) {
        console.error("Error fetching DJs:", err);
        setError("Erro ao carregar DJs");
        return [];
      }

      setDJs(data || []);
      return data || [];
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao carregar DJs");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDJs();
  }, []);

  return {
    djs,
    loading,
    error,
    fetchDJs,
  };
}
