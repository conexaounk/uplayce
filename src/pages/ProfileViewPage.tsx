import { useAuth } from "@/hooks/use-auth";
import { useDJ } from "@/hooks/use-djs";
import { useProfileTracks } from "@/hooks/use-profile-tracks";
import { useUserTracks } from "@/hooks/use-tracks";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, Plus, Music, Play, Pause, ShoppingCart } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";
import { UploadTrackModal } from "@/components/UploadTrackModal";
import { useState, useRef, useEffect } from "react";

export default function ProfileViewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const { data: profileTrackIds = [], isLoading: profileTracksLoading } = useProfileTracks(user?.id);
  const { data: allUserTracks = [] } = useUserTracks(user?.id);
  const { addItem, setIsOpen } = useCart();
  const [, setLocation] = useLocation();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Filtrar apenas as tracks que foram adicionadas ao perfil
  const profileTracks = allUserTracks.filter(track =>
    profileTrackIds.some(pt => pt.track_id === track.id)
  );

  // Adicionar uma track ao carrinho
  const handleAddTrackToCart = (track: typeof profileTracks[0]) => {
    addItem({
      id: track.id,
      title: track.title,
      price: "0", // Ajuste conforme necessário
      coverImage: track.cover_url || "/placeholder.svg",
      author: {
        username: track.artist || "Unknown",
      },
    });
  };

  // Play/Pause preview
  const handlePlayPreview = (trackId: string, audioUrl: string) => {
    if (playingTrackId === trackId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setPlayingTrackId(trackId);
      }
    }
  };

  // Parar quando terminar 30 segundos
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

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const avatarUrl = getStorageUrl(myProfile?.avatar_url, "avatars") || "/placeholder.svg";
  const avatarEmoji = (myProfile as any)?.avatar_emoji;

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
      <Card
        className="bg-card overflow-hidden"
        style={{
          borderRadius: "28px",
          boxShadow: "0 0 5px 0 rgba(95, 49, 143, 0.77)",
          border: "1px solid rgba(107, 30, 161, 0.85)",
        }}
      >
        <CardHeader
          className="pb-8 overflow-hidden"
          style={{
            borderRadius: "1px",
            border: "1px solid rgba(144, 19, 254, 0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                {avatarEmoji ? (
                  <span className="text-6xl">{avatarEmoji}</span>
                ) : (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="object-cover block"
                    style={{
                      width: "105%",
                      height: "104%",
                      margin: "0 20px 14px 1px",
                    }}
                  />
                )}
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  {myProfile?.dj_name || "Meu Perfil"}
                </CardTitle>
                {myProfile?.city && (
                  <p className="text-muted-foreground mb-2">{myProfile.city}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setLocation("/profile/edit")}
              size="lg"
              className="pl-2.5"
              style={{
                backgroundColor: "rgba(164, 36, 255, 0.01)",
                boxShadow: "1px 1px 0 0 rgba(0, 0, 0, 1)",
              }}
            >
              <Edit size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent
          className="pt-8 overflow-hidden"
          style={{
            border: "1px solid rgba(144, 19, 254, 0.06)",
          }}
        >
          {myProfile?.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Bio</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{myProfile.bio}</p>
            </div>
          )}
          {!myProfile?.bio && (
            <p className="text-muted-foreground italic">
              Nenhuma bio adicionada. Clique em "Editar Perfil" para adicionar uma.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tracks Section */}
      {profileTracks.length > 0 && (
        <Card
          className="bg-card overflow-hidden mt-6"
          style={{
            borderRadius: "28px",
            boxShadow: "0 0 5px 0 rgba(95, 49, 143, 0.77)",
            border: "1px solid rgba(107, 30, 161, 0.85)",
          }}
        >
          <CardHeader
            style={{
              borderRadius: "1px",
              border: "1px solid rgba(144, 19, 254, 0.15)",
            }}
          >
            <CardTitle className="text-2xl font-bold">Suas Tracks</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            {profileTracksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {profileTracks.map((track) => {
                  const isPlaying = playingTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      className="bg-muted/30 border border-white/10 rounded-lg p-4 flex items-center gap-3 hover:border-primary/50 transition-all"
                    >
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlayPreview(track.id, track.audio_url)}
                        className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors flex-shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {track.artist && <span>{track.artist}</span>}
                          {track.artist && track.genre && <span>•</span>}
                          <span className="capitalize">{track.genre}</span>
                        </div>
                        {isPlaying && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-primary/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(currentTime / 30) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-primary">
                              {Math.floor(currentTime)}s / 30s
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      {track.duration && (
                        <span className="text-sm text-muted-foreground flex-shrink-0">
                          {Math.floor(track.duration / 1000 / 60)}:{String(Math.floor((track.duration / 1000) % 60)).padStart(2, "0")}
                        </span>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddTrackToCart(track)}
                        className="w-10 h-10 rounded bg-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary/30 transition-colors flex-shrink-0"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setUploadModalOpen(true)}
        size="lg"
        className="w-full mt-6"
        style={{
          backgroundColor: "rgba(164, 36, 255, 0.01)",
          boxShadow: "1px 1px 0 0 rgba(0, 0, 0, 1)",
        }}
      >
        <Plus size={18} className="mr-2" />
        Add Track
      </Button>

      <UploadTrackModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />

      {/* Hidden audio element para preview */}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
