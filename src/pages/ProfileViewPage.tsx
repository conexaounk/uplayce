import { useAuth } from "@/hooks/use-auth";
import { EditTrackModal } from "@/components/EditTrackModal";
import AudioPreview from "@/components/AudioPreview";
import { useDJ } from "@/hooks/use-djs";
import { useMusicApi } from "@/hooks/use-music-api";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, Plus, ShoppingCart, Music, Lock, Globe, Trash2, GripVertical } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";
import { UploadTrackModal } from "@/components/UploadTrackModal";
import { BuyPackModal } from "@/components/BuyPackModal";
import { useToast } from "@/hooks/use-notification";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ProfileViewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const { useTracks, updateTrackPublicityMutation, removeFromProfileMutation, updateTrackMutation } = useMusicApi();
  const toast = useToast();

  // Buscamos as músicas diretamente do banco pelo ID do usuário logado
  const { data: allUserTracks = [], isLoading: tracksLoading } = useTracks(user?.id || "");
  
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [buyPackModalOpen, setBuyPackModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);

  // Redirecionar se usuário não está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

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
    <div className="min-h-screen pt-[21px] pb-20 container max-w-4xl mx-auto px-4">
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
              </div>
            </div>
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
            Minhas Tracks
          </h3>
        </div>

        {tracksLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {allUserTracks.map((track, index) => {
              // Sanitizar o ID removendo qualquer sufixo (ex: ":1")
              const cleanTrackId = String(track.id).split(':')[0];
              return (
                <motion.div
                  key={cleanTrackId}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        track_type: track.track_type,
                        price_cents: track.price_cents,
                      })
                    );
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-xl p-5 sm:p-6 space-y-4 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-primary/20">
                  {/* Track Info */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Drag indicator */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      <GripVertical size={16} className="text-gray-600" />
                    </div>
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
                        {track.track_type && (
                          <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary/80 rounded capitalize">
                            {track.track_type}
                          </span>
                        )}
                        {track.bpm && (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                            {track.bpm} BPM
                          </span>
                        )}
                        {track.key && (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                            {track.key}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateTrackPublicityMutation.mutate({ trackId: cleanTrackId, isPublic: !track.is_public })}
                        disabled={updateTrackPublicityMutation.isPending}
                        title={track.is_public ? "Tornar privada" : "Publicar"}
                        className={track.is_public ? "text-primary hover:text-destructive" : "text-muted-foreground hover:text-primary"}
                      >
                        {track.is_public ? <Globe size={20} /> : <Lock size={20} />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedTrack(track); setEditModalOpen(true); }}
                        className="text-muted-foreground hover:text-primary"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddTrackToCart(track)}
                        className="text-muted-foreground hover:text-primary"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingCart size={20} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Remover essa música do seu perfil? Ela não será deletada do banco.')) {
                            removeFromProfileMutation.mutate(cleanTrackId);
                          }
                        }}
                        className="text-destructive hover:text-destructive/80"
                        title="Remover do perfil"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  {track.audio_url && (
                    <AudioPreview
                      url={track.audio_url}
                      title={track.title}
                      size="md"
                      showTime={true}
                      startTime={track.preview_start_time || 0}
                      editable={true}
                      onStartTimeChange={(newStartTime) => {
                        updateTrackMutation.mutate(
                          {
                            trackId: cleanTrackId,
                            payload: { preview_start_time: newStartTime }
                          },
                          {
                            onSuccess: () => {
                              toast.success('Prévia ajustada', `Início em ${Math.floor(newStartTime)}s`);
                            }
                          }
                        );
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
            {allUserTracks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Você ainda não tem nenhuma música. <br /> Clique em "Nova Track" para começar!</p>
              </div>
            )}
            <div className="text-center py-6 text-xs text-muted-foreground">
              <p>💡 Dica: Arraste suas tracks para a pasta flutuante para criar packs!</p>
            </div>
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
      <EditTrackModal track={selectedTrack} open={editModalOpen} onOpenChange={(v) => { setEditModalOpen(v); if (!v) setSelectedTrack(null); }} />
    </div>
  );
}
