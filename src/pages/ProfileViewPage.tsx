import { useAuth } from "@/hooks/use-auth";
import { useDJ } from "@/hooks/use-djs";
import { useMusicApi } from "@/hooks/use-music-api";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, Plus, Play, Pause, ShoppingCart, Music, Lock, Globe } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";
import { UploadTrackModal } from "@/components/UploadTrackModal";
import { BuyPackModal } from "@/components/BuyPackModal";
import { useState, useRef, useEffect } from "react";

export default function ProfileViewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const { useTracks, updateTrackPublicityMutation } = useMusicApi();

  // Buscamos as músicas diretamente do banco pelo ID do usuário logado
  const { data: allUserTracks = [], isLoading: tracksLoading } = useTracks(user?.id || "");
  
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [buyPackModalOpen, setBuyPackModalOpen] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Redirecionar se usuário não está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  // Lógica de Áudio (Preview 30s)
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

  const handlePlayPreview = (trackId: string, audioUrl: string) => {
    if (playingTrackId === trackId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setPlayingTrackId(trackId);
    }
  };

  const handleAddTrackToCart = (track: any) => {
    addItem({
      id: track.id,
      title: track.title,
      price: track.price_cents ? (track.price_cents / 100).toString() : "0",
      coverImage: track.cover_url || "/placeholder.svg",
      author: { username: track.artist || "DJ" },
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = getStorageUrl(myProfile?.avatar_url, "avatars") || "/placeholder.svg";

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
      {/* Header do Perfil */}
      <Card className="bg-card border-primary/20 rounded-[28px] overflow-hidden shadow-xl shadow-black/50">
        <CardHeader className="pb-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-1">
                  {myProfile?.dj_name || "Meu Perfil"}
                </CardTitle>
                <p className="text-primary text-sm font-medium">{user.username}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/profile/edit")}
              className="rounded-xl border-primary/50 hover:bg-primary/10"
            >
              <Edit size={18} className="mr-2" /> Editar Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground italic">
            {myProfile?.bio || "Nenhuma bio adicionada ainda."}
          </p>
        </CardContent>
      </Card>

      {/* Lista de Tracks */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Music className="text-primary" /> Minhas Tracks
          </h3>
          <Button onClick={() => setUploadModalOpen(true)} className="rounded-full">
            <Plus size={18} className="mr-2" /> Nova Track
          </Button>
        </div>

        {tracksLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {allUserTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <div key={track.id} className="bg-muted/20 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group transition-all hover:border-primary/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlayPreview(track.id, track.audio_url)}
                    className="w-12 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white"
                  >
                    {isPlaying ? <Pause /> : <Play className="ml-0.5" />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{track.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {track.artist}
                      {/* MOSTRANDO O NOVO CAMPO COLLABORATIONS */}
                      {track.collaborations && (
                        <span className="text-primary/70 ml-1">feat. {track.collaborations}</span>
                      )}
                      <span className="mx-2">•</span>
                      <span className="capitalize">{track.genre}</span>
                    </p>
                    
                    {isPlaying && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${(currentTime / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateTrackPublicityMutation.mutate({ trackId: track.id, isPublic: !track.is_public })}
                      disabled={updateTrackPublicityMutation.isPending}
                      title={track.is_public ? "Tornar privada" : "Publicar"}
                      className={track.is_public ? "text-primary hover:text-destructive" : "text-muted-foreground hover:text-primary"}
                    >
                      {track.is_public ? <Globe size={20} /> : <Lock size={20} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddTrackToCart(track)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ShoppingCart size={20} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pack Button */}
      {allUserTracks.length >= 10 && (
        <Button
          onClick={() => setBuyPackModalOpen(true)}
          className="w-full mt-8 bg-gradient-to-r from-primary to-purple-600 h-14 text-lg font-bold shadow-lg"
        >
          <ShoppingCart className="mr-2" /> Visualizar Meu Pack
        </Button>
      )}

      {/* Modais */}
      <UploadTrackModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      <BuyPackModal
        isOpen={buyPackModalOpen}
        onClose={() => setBuyPackModalOpen(false)}
        djName={myProfile?.dj_name || "Meu DJ"}
        djId={user?.id || ""}
        allTracks={allUserTracks}
      />
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
