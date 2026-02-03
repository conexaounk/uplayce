import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PackWithTracks } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, Activity, Download } from "lucide-react";
import AudioPreview from "./AudioPreview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";
import { getStorageUrl } from "@/lib/storageUtils";

interface PackDetailsModalProps {
  pack: PackWithTracks | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PackDetailsModal({ pack, isOpen, onClose }: PackDetailsModalProps) {
  const { addItem } = useCart();

  if (!pack) return null;

  const coverImage = getStorageUrl(pack.cover_url, "pack-covers") || "/placeholder.svg";
  const price = pack.price ?? 0;
  const djName = pack.profile?.dj_name || "DJ Desconhecido";

  const handleAddToCart = () => {
    addItem({
      id: pack.id,
      title: pack.name,
      price: price.toString(),
      coverImage,
      author: { username: djName },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-[#0d0d0d] border-white/10 p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        {/* Left Side: Cover & Info */}
        <div className="w-full md:w-2/5 relative">
          <div className="absolute inset-0">
            <img src={coverImage} alt={pack.name} className="w-full h-full object-cover opacity-40 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 p-8 h-full flex flex-col justify-end">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl border border-white/10 mb-6 mx-auto md:mx-0">
              <img src={coverImage} alt={pack.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              {pack.is_free && (
                <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold border border-secondary/20">
                  GRÁTIS
                </span>
              )}
              <DialogTitle className="text-3xl font-display font-bold text-white text-glow">
                {pack.name}
              </DialogTitle>
              <p className="text-lg text-muted-foreground">by {djName}</p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-white/10 pt-4">
                <span className="flex items-center gap-2">
                  <Download size={16} /> {pack.size_gb ? `${pack.size_gb} GB` : "N/A"}
                </span>
                <span className="flex items-center gap-2">{pack.tracks?.length || 0} Faixas</span>
              </div>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-white text-black hover:bg-secondary hover:text-black transition-colors font-bold text-lg"
                  onClick={handleAddToCart}
                >
                  {pack.is_free ? "Baixar Grátis" : `R$ ${price}`}
                  <ShoppingBag className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tracklist */}
        <div className="w-full md:w-3/5 bg-card/50 flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Activity className="text-secondary" />
              Lista de Músicas
            </h3>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {pack.tracks?.map((track) => (
                <div key={track.id} className="group flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{track.name}</h4>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatDuration(track.duration)}
                        </span>
                        {track.bpm && (
                          <span className="flex items-center gap-1 bg-primary/20 text-primary/80 px-2 py-0.5 rounded">
                            <Activity size={12} /> {track.bpm} BPM
                          </span>
                        )}
                        {track.key && (
                          <span className="bg-secondary/20 text-secondary/80 px-2 py-0.5 rounded">
                            {track.key}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {track.audio_url && (
                    <AudioPreview
                      url={track.audio_url}
                      title={track.name}
                      size="md"
                      showTime={true}
                    />
                  )}
                </div>
              ))}

              {(!pack.tracks || pack.tracks.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma faixa listada neste pack ainda.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
