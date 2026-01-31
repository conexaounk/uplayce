import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  url: string;
  title: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function AudioPlayer({ url, title, isPlaying, onPlayPause }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Play failed", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, url]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
      
      if (current >= duration) {
        onPlayPause(); // Stop when finished
        setProgress(0);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full bg-white/5 p-2 rounded-lg border border-white/10 hover:border-primary/50 transition-colors group">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
      />
      
      <button
        onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-transform active:scale-95"
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium truncate text-white/90">{title}</span>
          <span className="font-mono text-primary/80">{isPlaying ? "PLAYING" : "PREVIEW"}</span>
        </div>
        
        {/* Progress Bar / Visualizer Placeholder */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-secondary"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
          />
          {/* Faux visualizer bars when playing */}
          {isPlaying && (
            <div className="absolute inset-0 flex items-end justify-around opacity-30">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2%] bg-white"
                  animate={{ height: ["10%", "100%", "30%"] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.5, 
                    delay: i * 0.05,
                    repeatType: "reverse" 
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}
