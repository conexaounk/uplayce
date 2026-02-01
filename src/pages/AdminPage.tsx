import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2, ShieldCheck, Lock, Edit, Trash2, EyeOff, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-notification";
import { getSettings, setSetting } from "@/lib/settingsService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.conexaounk.com";


export default function AdminPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const toast = useToast();

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

  // ✅ TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL
  
  const fetchTracks = async () => {
    setLoadingTracks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Login necessário');

      const response = await fetch(`${API_BASE}/tracks`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Erro ao buscar tracks');
      const res = await response.json();
      const list = Array.isArray(res) ? res : (res?.tracks || res?.data || []);
      setTracks(list as any[]);
    } catch (e) {
      console.error('Erro ao buscar tracks:', e);
      toast.error('Erro ao carregar', 'Não foi possível carregar as músicas');
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

  // ✅ AGORA SIM: returns condicionais DEPOIS de todos os hooks
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Apenas administradores podem acessar esta página</p>
          <Button onClick={() => setLocation("/")} className="bg-primary hover:bg-primary/80">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  // Função para salvar no backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const entries = Object.entries(prices);
      const results = await Promise.all(entries.map(async ([key, value]) => {
        const response = await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ key, value } )
        });
        return response.json();
      }));

      const failed = results.find(r => !r || r.success === false);
      if (failed) {
        throw new Error(failed.error || 'Erro ao salvar alguma configuração');
      }

      toast.success('Configurações salvas', 'Alterações aplicadas com sucesso');
    } catch (error: any) {
      toast.error('Erro ao salvar', error?.message || 'Tente novamente');
    } finally {
      setSaving(false);
    }
  };

  const saveHiddenList = async (arr: string[]) => {
    try {
      await setSetting('hidden_tracks', JSON.stringify(arr));
      setHiddenTrackIds(arr);
      toast.success('Atualizado', 'Lista de ocultos alterada com sucesso');
    } catch (e) {
      console.error('Erro ao salvar hidden list', e);
      toast.error('Erro ao atualizar', 'Não foi possível salvar as alterações');
    }
  };

  const handleHide = (id: string) => {
    const next = Array.from(new Set([...hiddenTrackIds, id]));
    setTracks((prev) => prev.filter(t => t.id !== id));
    saveHiddenList(next);
  };

  const handleUnhide = (id: string) => {
    const next = hiddenTrackIds.filter(x => x !== id);
    saveHiddenList(next);
    fetchTracks();
  };

  const handleOpenEdit = (track: any) => {
    setEditTrack(track);
  };

  const handleSaveEdit = async (updated: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Login necessário');

      const res = await fetch(`${API_BASE}/tracks/${updated.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');
      toast.success('Atualizado', 'Música atualizada com sucesso');
      setEditTrack(null);
      fetchTracks();
    } catch (e) {
      console.error('Erro ao atualizar track', e);
      toast.error('Erro ao atualizar', 'Não foi possível salvar as alterações');
    }
  };

  const handleDeleteFromView = (id: string) => {
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
        </div>
      </div>

      {/* ✅ DIALOG DE EDIÇÃO (estava faltando) */}
      <Dialog open={!!editTrack} onOpenChange={(open) => !open && setEditTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Track</DialogTitle>
            <DialogDescription>Altere as informações da música</DialogDescription>
          </DialogHeader>
          {editTrack && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input 
                  value={editTrack.title} 
                  onChange={(e) => setEditTrack({...editTrack, title: e.target.value})}
                />
              </div>
              <div>
                <Label>Artista</Label>
                <Input 
                  value={editTrack.artist} 
                  onChange={(e) => setEditTrack({...editTrack, artist: e.target.value})}
                />
              </div>
              <div>
                <Label>Gênero</Label>
                <Input 
                  value={editTrack.genre} 
                  onChange={(e) => setEditTrack({...editTrack, genre: e.target.value})}
                />
              </div>
              <div>
                <Label>Preço (centavos)</Label>
                <Input 
                  type="number"
                  value={editTrack.price_cents} 
                  onChange={(e) => setEditTrack({...editTrack, price_cents: parseInt(e.target.value)})}
                />
              </div>
              <Button onClick={() => handleSaveEdit(editTrack)} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
