import { useDJ } from "@/hooks/use-djs";
import { useMusicApi } from "@/hooks/use-music-api"; // 1. ALTERADO: Importando o hook centralizado
import { useFollow } from "@/hooks/use-follow";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { Loader2, MapPin, ShoppingCart, Music2, Heart } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";
import { useState } from "react";
import { BuyPackModal } from "@/components/BuyPackModal";
import { AudioPreview } from "@/components/AudioPreview";

export default function DJProfilePage() {
  const { id } = useParams<{ id: string }>();

  // 2. Hooks de Dados
  const { data: djProfile, isLoading: djLoading } = useDJ(id || "");

  // 3. ALTERADO: Usando o hook novo para buscar as músicas deste DJ específico
  const { useTracks } = useMusicApi();
  // Passamos o 'id' do DJ vindo da URL para filtrar apenas as músicas dele
  const { data: tracks = [], isLoading: tracksLoading } = useTracks(id);

  // 4. Hook para gerenciar follow/unfollow
  const { isFollowing, isLoading: isLoadingFollow, handleToggleFollow, followerCount } = useFollow(id || "");

  const [buyPackModalOpen, setBuyPackModalOpen] = useState(false);

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
            <div className="text-center md:text-left flex-1">
              <CardTitle className="text-4xl font-black tracking-tighter mb-2">
                {djProfile.dj_name}
              </CardTitle>
              {djProfile.city && (
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <MapPin size={16} className="text-primary" />
                  {djProfile.city}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 justify-center md:justify-start">
                <span className="text-sm text-muted-foreground">
                  {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
                </span>
                <Button
                  onClick={handleToggleFollow}
                  disabled={isLoadingFollow}
                  className={isFollowing ? "rounded-full" : "rounded-full bg-primary hover:bg-primary/90"}
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isLoadingFollow ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Heart size={16} className={`mr-2 ${isFollowing ? "fill-current" : ""}`} />
                  )}
                  {isFollowing ? "Deixar de Seguir" : "Seguir"}
                </Button>
              </div>
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
            {" "} Tracks Disponíveis
          </h2>
          <span className="text-sm text-muted-foreground">{tracks.length} músicas</span>
        </div>

        {tracksLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {tracks.length === 0 ? (
                <p className="text-muted-foreground text-center py-10 italic">Nenhuma música publicada por este DJ ainda.</p>
            ) : (
                tracks.map((track: any) => {
                return (
                    <div 
                    key={track.id}
                    className="group glass-effect rounded-xl p-5 sm:p-6 space-y-4 hover:border-primary/50 transition-all"
                    >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{track.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {track.artist}
                          {track.collaborations && (
                            <span className="text-secondary ml-1">• feat. {track.collaborations}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary/80 rounded">
                            {track.genre}
                          </span>
                          {track.bpm && (
                            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                              {track.bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {track.audio_url && (
                      <AudioPreview
                        url={track.audio_url}
                        title={track.title}
                        size="md"
                        showTime={true}
                      />
                    )}
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
    </div>
  );
}
