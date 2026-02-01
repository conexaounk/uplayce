import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2, ShieldCheck, Lock, Edit, Trash2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/apiService";
import { getSettings, setSetting } from "@/lib/settingsService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Proteção: checar role no metadata do Supabase
  useEffect(() => {
    const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.is_admin === true;
    if (!authLoading && !isAdmin) {
      toast.error("Acesso negado. Apenas administradores.");
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState({
    unit: "15.00",
    pack: "100.00",
    pack_quantity: "10",
  });

  // Management of tracks
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [editTrack, setEditTrack] = useState<any | null>(null);
  const [hiddenTrackIds, setHiddenTrackIds] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Função para salvar no backend (POST /settings para cada chave)
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const entries = Object.entries(prices);
      const results = await Promise.all(entries.map(async ([key, value]) => {
        const response = await fetch('https://api.conexaounk.com/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ key, value })
        });
        return response.json();
      }));

      const failed = results.find(r => !r || r.success === false);
      if (failed) {
        throw new Error(failed.error || 'Erro ao salvar alguma configuração');
      }

      toast.success('Configurações atualizadas no D1!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error?.message || error));
    } finally {
      setSaving(false);
    }
  };

  // ======================= Tracks management =======================
  const fetchTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await api.fetch('/tracks');
      // API pode retornar { tracks: [...] } ou array
      const list = Array.isArray(res) ? res : (res?.tracks || res?.data || []);
      setTracks(list as any[]);
    } catch (e) {
      console.error('Erro ao buscar tracks:', e);
      toast.error('Erro ao buscar tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  const fetchHidden = async () => {
    try {
      const s = await getSettings();
      const raw = s?.settings?.hidden_tracks;
      let arr: string[] = [];
      if (raw) {
        try { arr = JSON.parse(raw); } catch { arr = []; }
      }
      setHiddenTrackIds(arr);
    } catch (e) {
      console.warn('Erro ao buscar hidden_tracks', e);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchHidden();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveHiddenList = async (arr: string[]) => {
    try {
      await setSetting('hidden_tracks', JSON.stringify(arr));
      setHiddenTrackIds(arr);
      toast.success('Lista de ocultos atualizada');
    } catch (e) {
      console.error('Erro ao salvar hidden list', e);
      toast.error('Erro ao atualizar ocultos');
    }
  };

  const handleHide = (id: string) => {
    const next = Array.from(new Set([...hiddenTrackIds, id]));
    // Remove from UI immediately
    setTracks((prev) => prev.filter(t => t.id !== id));
    saveHiddenList(next);
  };

  const handleUnhide = (id: string) => {
    const next = hiddenTrackIds.filter(x => x !== id);
    saveHiddenList(next);
    // Refetch tracks to include it back
    fetchTracks();
  };

  const handleOpenEdit = (track: any) => {
    setEditTrack(track);
  };

  const handleSaveEdit = async (updated: any) => {
    try {
      const res = await api.fetch(`/tracks/${updated.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
      toast.success('Track atualizada');
      setEditTrack(null);
      fetchTracks();
    } catch (e) {
      console.error('Erro ao atualizar track', e);
      toast.error('Erro ao atualizar track');
    }
  };

  const handleDeleteFromView = (id: string) => {
    // Apenas remove da visualização (sem excluir do DB)
    handleHide(id);
  };


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm">Controle de fluxos e precificação global</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-card/50 border-white/10">
            <h3 className="font-bold mb-4">Configuração de Mashups</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preço Unitário (R$)</Label>
                <Input 
                  type="number" 
                  value={prices.unit}
                  onChange={(e) => setPrices({...prices, unit: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço do Pack (10 músicas)</Label>
                <Input 
                  type="number"
                  value={prices.pack}
                  onChange={(e) => setPrices({...prices, pack: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full" 
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Salvar Alterações
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Gerenciar Tracks</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowHidden(!showHidden); }}>
                  {showHidden ? <><Eye className="mr-2" /> Mostrar ativos</> : <><EyeOff className="mr-2" /> Mostrar ocultos</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={fetchTracks}>Atualizar</Button>
              </div>
            </div>

            {loadingTracks ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tracks.filter(t => showHidden ? hiddenTrackIds.includes(t.id) : !hiddenTrackIds.includes(t.id)).map(track => (
                  <div key={track.id} className="p-3 border border-white/5 rounded-lg flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="font-bold truncate">{track.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">{track.genre} • {track.track_type || '—'} • R$ {(track.price_cents ? (track.price_cents/100).toFixed(2) : '—')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(track)}><Edit /></Button>
                      {hiddenTrackIds.includes(track.id) ? (
                        <Button size="sm" variant="outline" onClick={() => handleUnhide(track.id)}>Desocultar</Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFromView(track.id)}><Trash2 /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}