import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";

export async function getSettings() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Login necessário');

  try {
    const url = `${API_BASE}/settings`;
    console.log('🔌 getSettings: Tentando buscar de', url);

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ getSettings error response:', res.status, errorText);
      throw new Error(`Erro ao buscar configurações (${res.status}): ${errorText.substring(0, 100)}`);
    }
    return res.json();
  } catch (error) {
    console.error('❌ getSettings: Erro completo:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Erro de conexão com o servidor (${API_BASE}). Verifique se o API está acessível.`);
    }
    throw error;
  }
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
