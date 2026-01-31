import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type PackWithTracks } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, Activity, Download } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";

interface PackDetailsModalProps {
  pack: PackWithTracks | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PackDetailsModal({ pack, isOpen, onClose }: PackDetailsModalProps) {
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const { addItem } = useCart();

  if (!pack) return null;

  const handleAddToCart = () => {
    addItem({
      id: pack.id,
      title: pack.title,
      price: pack.price.toString(),
      coverImage: pack.coverImage,
      author: { username: pack.author?.username || "Unknown" }
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-[#0d0d0d] border-white/10 p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        {/* Left Side: Cover & Info */}
        <div className="w-full md:w-2/5 relative">
          <div className="absolute inset-0">
            <img src={pack.coverImage} alt={pack.title} className="w-full h-full object-cover opacity-40 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>
          
          <div className="relative z-10 p-8 h-full flex flex-col justify-end">
             <div className="w-48 h-48 rounded-lg overflow-hidden shadow-2xl border border-white/10 mb-6 mx-auto md:mx-0">
               <img src={pack.coverImage} alt={pack.title} className="w-full h-full object-cover" />
             </div>
             
             <div className="space-y-2">
               <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">
                 {pack.genre}
               </span>
               <DialogTitle className="text-3xl font-display font-bold text-white text-glow">{pack.title}</DialogTitle>
               <p className="text-lg text-muted-foreground">by {pack.author?.username}</p>
             </div>

             <div className="mt-8 space-y-4">
               <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-white/10 pt-4">
                 <span className="flex items-center gap-2"><Download size={16}/> {pack.size}</span>
                 <span className="flex items-center gap-2">{pack.tracks?.length || 0} Faixas</span>
               </div>
               
               <div className="flex gap-4">
                 <Button 
                    size="lg" 
                    className="flex-1 bg-white text-black hover:bg-secondary hover:text-black transition-colors font-bold text-lg"
                    onClick={handleAddToCart}
                  >
                    R$ {pack.price}
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
                <div key={track.id} className="group flex flex-col gap-2">
                   <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                     <span className="flex items-center gap-2 w-20">
                       <Clock size={12} /> {track.duration}
                     </span>
                     <span className="flex items-center gap-2 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                       {track.bpm} BPM
                     </span>
                   </div>
                   
                   <AudioPlayer 
                     url={track.previewUrl}
                     title={track.title}
                     isPlaying={playingTrackId === track.id}
                     onPlayPause={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                   />
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
