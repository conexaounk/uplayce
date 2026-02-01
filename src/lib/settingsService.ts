import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";

export async function getSettings() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${API_BASE}/settings`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  if (!res.ok) throw new Error('Erro ao buscar configurações');
  return res.json();
}

export async function setSetting(key: string, value: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ key, value }),
  });

  if (!res.ok) throw new Error('Erro ao salvar configuração');
  return res.json();
}
