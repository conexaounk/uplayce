import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Clock, Activity, Music, HardDrive, ShoppingCart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pack, Track } from "@/types";

interface PackDetailsModalProps {
  pack: Pack | null;
  djName: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  isInCart: boolean;
}

export function PackDetailsModal({
  pack,
  djName,
  isOpen,
  onClose,
  onAddToCart,
  isInCart,
}: PackDetailsModalProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPlayingTrackId(null);
      setProgress(0);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
  }, [isOpen]);

  const handlePlayPause = (trackId: string) => {
    if (playingTrackId === trackId) {
      // Pause
      setPlayingTrackId(null);
      setProgress(0);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    } else {
      // Play new track
      setPlayingTrackId(trackId);
      setProgress(0);
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setPlayingTrackId(null);
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            return 0;
          }
          return prev + (100 / 30); // 30 seconds preview
        });
      }, 1000);
    }
  };

  if (!isOpen || !pack) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative">
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-br from-primary/30 via-card to-secondary/30 flex items-center justify-center">
            <span className="text-6xl">{pack.coverEmoji}</span>
          </div>
          
          {/* Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Free Badge */}
          {pack.isFree && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-secondary rounded-full">
              <span className="text-xs font-bold text-secondary-foreground">GRÁTIS</span>
            </div>
          )}
        </div>

        {/* Pack Info */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold mb-2">{pack.name}</h2>
          <p className="text-muted-foreground mb-4">por {djName}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span>{pack.tracks.length} tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{pack.sizeGB} GB</span>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="max-h-80 overflow-y-auto p-6">
          <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide mb-4">
            Tracks incluídas
          </h3>
          
          <div className="space-y-2">
            {pack.tracks.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                index={index + 1}
                isPlaying={playingTrackId === track.id}
                progress={playingTrackId === track.id ? progress : 0}
                onPlayPause={() => handlePlayPause(track.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <div>
            {pack.isFree ? (
              <span className="text-2xl font-bold text-secondary">Grátis</span>
            ) : (
              <span className="text-2xl font-bold neon-text">R$ {pack.price.toFixed(2)}</span>
            )}
          </div>

          {pack.isFree ? (
            <Button variant="secondary" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Baixar Grátis
            </Button>
          ) : (
            <Button 
              variant={isInCart ? "outline" : "neon"}
              size="lg"
              onClick={onAddToCart}
              disabled={isInCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isInCart ? "No carrinho" : "Adicionar ao Carrinho"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrackItemProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
}

function TrackItem({ track, index, isPlaying, progress, onPlayPause }: TrackItemProps) {
  return (
    <div 
      className={`relative rounded-xl p-4 transition-all ${
        isPlaying ? 'bg-primary/10 border border-primary/30' : 'glass-card hover:bg-muted/50'
      }`}
    >
      {/* Progress Bar */}
      {isPlaying && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-xl transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      )}
      
      <div className="flex items-center gap-4">
        {/* Play Button */}
        <button
          onClick={onPlayPause}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-primary text-primary-foreground neon-glow-purple' 
              : 'bg-muted hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {String(index).padStart(2, '0')}
            </span>
            <h4 className={`font-medium truncate ${isPlaying ? 'text-primary' : ''}`}>
              {track.name}
            </h4>
          </div>
          
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{track.duration}</span>
            </div>
            {track.bpm > 0 && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{track.bpm} BPM</span>
              </div>
            )}
          </div>
        </div>

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" />
            <div className="w-1 h-6 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
