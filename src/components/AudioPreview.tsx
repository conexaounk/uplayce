import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AudioPreviewProps {
  url: string;
  title: string;
  size?: "sm" | "md" | "lg";
  showTime?: boolean;
  startTime?: number;
  onStartTimeChange?: (time: number) => void;
  editable?: boolean;
}

const PREVIEW_DURATION = 30; // 30 segundos

export function AudioPreview({
  url,
  title,
  size = "md",
  showTime = true,
  startTime = 0,
  onStartTimeChange,
  editable = false
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [musicDuration, setMusicDuration] = useState(0);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [previewStart, setPreviewStart] = useState(startTime);

  useEffect(() => {
    setPreviewStart(startTime);
  }, [startTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.currentTime = previewStart;
      audio.play().catch(e => console.error("Play failed", e));
    } else {
      audio.pause();
    }

    return () => {
      audio?.pause();
    };
  }, [isPlaying, url, previewStart]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const relativeTime = current - previewStart;

      // Parar no limite de 30 segundos após o ponto inicial
      if (relativeTime >= PREVIEW_DURATION) {
        audioRef.current.pause();
        setIsPlaying(false);
        setProgress(100);
        setCurrentTime(PREVIEW_DURATION);
        return;
      }

      // Se ainda não chegou no ponto inicial, não atualiza
      if (relativeTime < 0) {
        return;
      }

      setCurrentTime(relativeTime);
      setProgress((relativeTime / PREVIEW_DURATION) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setMusicDuration(audioRef.current.duration);
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * PREVIEW_DURATION;
      audioRef.current.currentTime = Math.min(newTime, PREVIEW_DURATION);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    sm: "h-9 p-2",
    md: "h-11 p-3",
    lg: "h-12 p-4"
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={`w-full glass-effect rounded-lg transition-all ${sizeClasses[size]}`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Play/Pause Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className="flex-shrink-0 rounded-md bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 p-1.5 transition-all text-white"
          title={isPlaying ? "Pausar prévia" : "Reproduzir prévia"}
        >
          {isPlaying ? (
            <Pause className={iconSize[size]} fill="currentColor" />
          ) : (
            <Play className={iconSize[size]} fill="currentColor" />
          )}
        </motion.button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-2">
          <div
            onClick={handleProgressClick}
            className="flex-1 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group/progress hover:h-2 sm:hover:h-2.5 transition-all"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Time Display */}
          {showTime && (
            <div className={`text-muted-foreground font-mono whitespace-nowrap ${
              size === "sm" ? "text-xs" : size === "md" ? "text-xs sm:text-sm" : "text-sm"
            }`}>
              <span className="text-primary font-semibold">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-muted-foreground">{formatTime(PREVIEW_DURATION)}</span>
            </div>
          )}
        </div>

        {/* Volume Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMute}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title={muted ? "Ativar som" : "Mutar"}
        >
          {muted ? (
            <VolumeX className={iconSize[size]} />
          ) : (
            <Volume2 className={iconSize[size]} />
          )}
        </motion.button>
      </div>

      {/* Preview Label */}
      <div className="text-xs text-muted-foreground mt-1.5 px-1">
        <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary/80 rounded text-xs font-medium">
          Prévia • 30 segundos
        </span>
      </div>
    </div>
  );
}
