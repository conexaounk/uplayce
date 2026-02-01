import { useDJ } from "@/hooks/use-djs";
import { useMusicApi } from "@/hooks/use-music-api"; // 1. ALTERADO: Importando o hook centralizado
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, ShoppingCart, Play, Pause, Music2 } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";
import { useState, useRef, useEffect } from "react";
import { BuyPackModal } from "@/components/BuyPackModal";

export default function DJProfilePage() {
  const { id } = useParams<{ id: string }>();
  
  // 2. Hooks de Dados
  const { data: djProfile, isLoading: djLoading } = useDJ(id || "");
  
  // 3. ALTERADO: Usando o hook novo para buscar as músicas deste DJ específico
  const { useTracks } = useMusicApi();
  // Passamos o 'id' do DJ vindo da URL para filtrar apenas as músicas dele
  const { data: tracks, isLoading: tracksLoading } = useTracks(id);

  const [buyPackModalOpen, setBuyPackModalOpen] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 4. Lógica de Áudio (Preview de 30s)
  const handlePlayPreview = (trackId: string, audioUrl: string) => {
    if (playingTrackId === trackId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingTrackId(trackId);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingTrackId(null);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  // Estados de Carregamento/Erro
  if (djLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!djProfile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Artista não encontrado.</p>
      </div>
    );
  }

  const avatarUrl = getStorageUrl(djProfile.avatar_url, "avatars") || "/placeholder.svg";

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
      {/* Card de Perfil */}
      <Card className="bg-card/50 backdrop-blur border-white/10 rounded-[28px] overflow-hidden shadow-2xl shadow-primary/5">
        <CardHeader className="border-b border-white/5 pb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex-shrink-0">
              <img src={avatarUrl} alt={djProfile.dj_name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left">
              <CardTitle className="text-4xl font-black tracking-tighter mb-2">
                {djProfile.dj_name}
              </CardTitle>
              {djProfile.city && (
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <MapPin size={16} className="text-primary" />
                  {djProfile.city}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <h3 className="text-sm uppercase tracking-widest font-bold text-primary mb-3">Bio</h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {djProfile.bio || "Este DJ prefere que sua música fale por ele."}
          </p>
        </CardContent>
      </Card>

      {/* Seção de Músicas */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music2 className="text-primary" /> Tracks Disponíveis
          </h2>
          <span className="text-sm text-muted-foreground">{tracks.length} músicas</span>
        </div>

        {tracksLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid gap-3">
            {tracks.length === 0 ? (
                <p className="text-muted-foreground text-center py-10 italic">Nenhuma música publicada por este DJ ainda.</p>
            ) : (
                tracks.map((track: any) => {
                const isPlaying = playingTrackId === track.id;
                
                return (
                    <div 
                    key={track.id}
                    className="group bg-card/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-primary/40 transition-all"
                    >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlayPreview(track.id, track.audio_url)}
                        className="w-12 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex-shrink-0"
                    >
                        {isPlaying ? <Pause /> : <Play className="ml-1" />}
                    </Button>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate">{track.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                        <span className="text-primary font-medium">{track.artist}</span>
                        {/* EXIBIÇÃO DO FEAT (Collaborations) */}
                        {track.collaborations && (
                            <span className="text-xs italic ml-1 opacity-80 text-white/70">
                            (feat. {track.collaborations})
                            </span>
                        )}
                        <span className="mx-2 opacity-50">•</span>
                        <span className="capitalize opacity-70">{track.genre}</span>
                        </p>
                        
                        {isPlaying && (
                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary shadow-[0_0_10px_rgba(144,19,254,0.5)] transition-all duration-300" 
                                style={{ width: `${(currentTime / 30) * 100}%` }}
                            />
                            </div>
                            <span className="text-[10px] font-mono text-primary">0:{Math.floor(currentTime).toString().padStart(2, '0')} / 0:30</span>
                        </div>
                        )}
                    </div>
                    </div>
                );
                })
            )}
          </div>
        )}
      </div>

      {/* Lógica do Pack */}
      {tracks.length >= 10 ? (
        <Button
          onClick={() => setBuyPackModalOpen(true)}
          className="w-full mt-10 h-16 text-xl font-black uppercase tracking-tighter shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform bg-gradient-to-r from-primary to-purple-600"
        >
          <ShoppingCart className="mr-3" /> Adquirir Pack Completo
        </Button>
      ) : (
        tracks.length > 0 && (
          <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-sm text-muted-foreground">
              A venda do pack será liberada quando o artista completar <span className="text-white font-bold">10 músicas</span>. 
              Faltam <span className="text-primary font-bold">{10 - tracks.length}</span>.
            </p>
          </div>
        )
      )}

      {/* Modal e Audio */}
      <BuyPackModal
        isOpen={buyPackModalOpen}
        onClose={() => setBuyPackModalOpen(false)}
        djName={djProfile.dj_name}
        djId={djProfile.id}
        allTracks={tracks}
      />
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
