import { useState, useEffect, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Music, Loader2, Edit, Play, ExternalLink, Plus } from "lucide-react";
import { api } from "@/lib/apiService";
import { useToast } from "@/hooks/use-notification";
import { UploadTrackModal } from "@/components/UploadTrackModal";
import { PlayerContext } from "@/context/PlayerContext";

// Interface exata do seu D1
interface Track {
  id: string;
  title: string;
  genre: string;
  user_id: string; // Este ID vem do Supabase Auth
  audio_url: string;
  artist: string;
  price_cents: number;
  duration: number;
  track_type: string;
  cover_url?: string;
  is_public: boolean;
}

export default function MyTracksPage() {
  // ✅ Pega o usuário logado via Supabase
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const playerContext = useContext(PlayerContext);

  const fetchUserTracks = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // 1. Faz a chamada para a API
      const res = await api.fetch('/tracks');

      // 2. Tenta encontrar a lista de tracks em diferentes formatos possíveis
      let allTracks: Track[] = [];

      if (Array.isArray(res)) {
        allTracks = res;
      } else if (res && typeof res === 'object') {
        // Tenta chaves comuns: data, tracks, results
        allTracks = res.data || res.tracks || res.results || [];
      }

      // 3. LOG DE DEBUG (Abra o F12 para ver isso no navegador)
      console.log("ID do Usuário Logado:", user.id);
      console.log("Total de tracks recebidas (bruto):", allTracks.length);

      if (allTracks.length > 0) {
         console.log("Exemplo de user_id na primeira track vinda do banco:", allTracks[0].user_id);
      }

      // 4. Filtragem com tratamento de strings (case insensitive e trim)
      const myTracks = allTracks.filter((t: any) => {
        // Garantimos que ambos são strings para comparação
        const trackUserId = String(t.user_id || '').trim().toLowerCase();
        const currentUserId = String(user.id).trim().toLowerCase();
        return trackUserId === currentUserId;
      });

      console.log("Total após filtrar:", myTracks.length);
      setTracks(myTracks);

    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error("Erro", "Não foi possível carregar as tracks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserTracks();
    }
  }, [user?.id]);

  // 1. Estado de carregamento do Auth (Supabase)
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Verificação de login
  if (!user) {
    return (
      <div className="text-center py-20 bg-black/20 rounded-xl border border-white/5 m-6">
        <p className="text-gray-400 mb-4">Sessão expirada ou não autenticada.</p>
        <Button onClick={() => window.location.href = '/auth'}>Fazer Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white">Minhas Tracks</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{tracks.length}</span>
          </div>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="rounded-full"
          >
            <Plus size={18} className="mr-2" /> Nova Track
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-gray-500">Consultando Cloudflare D1...</p>
        </div>
      ) : tracks.length > 0 ? (
        <div className="grid gap-3">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group bg-[#121212] hover:bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-all flex items-center gap-4"
            >
              {/* Thumbnail com fallback */}
              <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0 overflow-hidden border border-white/10">
                {track.cover_url ? (
                  <img src={track.cover_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Music className="absolute inset-0 m-auto text-gray-700" size={20} />
                )}
              </div>

              {/* Info da Track */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{track.title}</h3>
                  {track.is_public && <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">Público</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">{track.artist || 'Artista desconhecido'} • {track.genre}</p>
              </div>

              {/* Ações e Preço */}
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-white font-mono text-sm">R$ {(track.price_cents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-tighter">{track.track_type}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary hover:text-white transition-colors"
                    onClick={() => setSelectedTrack(track)}
                    title="Ouvir prévia (30 segundos)"
                  >
                    <Play size={16} fill="currentColor" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-gray-500 hover:text-white"
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="text-gray-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Nenhuma track no D1</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm">
            Você não possui registros vinculados de tracks.
          </p>
        </div>
      )}

      {/* Miniplayer Modal */}
      {selectedTrack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTrack(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white truncate">{selectedTrack.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedTrack.artist || 'Artista desconhecido'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white flex-shrink-0"
                onClick={() => setSelectedTrack(null)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Cover Image */}
            {selectedTrack.cover_url && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                <img
                  src={selectedTrack.cover_url}
                  alt={selectedTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Audio Preview Player */}
            <AudioPreview
              url={selectedTrack.audio_url}
              title={selectedTrack.title}
              size="lg"
              showTime={true}
            />

            {/* Track Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Gênero</p>
                <p className="text-sm font-semibold text-white mt-1">{selectedTrack.genre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Tipo</p>
                <p className="text-sm font-semibold text-white mt-1">{selectedTrack.track_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Duração</p>
                <p className="text-sm font-semibold text-white mt-1">{Math.floor(selectedTrack.duration)}s</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Preço</p>
                <p className="text-sm font-semibold text-primary mt-1">R$ {(selectedTrack.price_cents / 100).toFixed(2)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {selectedTrack.is_public ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Público
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Privado
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Upload Track Modal */}
      <UploadTrackModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </div>
  );
}
