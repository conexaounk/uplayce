import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, List } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  currentTime: number;
  image?: string;
}

interface MusicPlayerProps {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
  track?: Track;
}

export function MusicPlayer({
  isPlaying = false,
  onPlayPause,
  onSkipNext,
  onSkipPrev,
  track = {
    id: "1",
    title: "Untitled Track",
    artist: "Unknown Artist",
    duration: 180,
    currentTime: 42,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop"
  }
}: MusicPlayerProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(66);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (track.currentTime / track.duration) * 100;

  return (
    <footer className="fixed bottom-5 left-5 right-5 md:left-[120px] md:right-5 h-20 glass-panel rounded-3xl z-50 flex items-center justify-between px-6 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Song Info - Left */}
      <div className="flex items-center gap-4 w-1/4 min-w-0">
        {track.image && (
          <img
            src={track.image}
            alt={track.title}
            className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/5 flex-shrink-0"
          />
        )}
        <div className="hidden sm:block min-w-0">
          <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
        </div>
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="text-gray-400 hover:text-accent-pink transition ml-2 hidden sm:block flex-shrink-0"
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Controls - Center */}
      <div className="flex flex-col items-center gap-2 w-2/4">
        <div className="flex items-center gap-6">
          <button
            className="text-gray-400 hover:text-white transition text-xs"
            title="Shuffle"
          >
            🔀
          </button>
          <button
            onClick={onSkipPrev}
            className="text-gray-300 hover:text-white transition"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? (
              <Pause size={18} className="ml-0" />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </button>
          <button
            onClick={onSkipNext}
            className="text-gray-300 hover:text-white transition"
          >
            <SkipForward size={20} />
          </button>
          <button
            className="text-gray-400 hover:text-white transition text-xs"
            title="Repeat"
          >
            🔁
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md flex items-center gap-2 text-[10px] text-gray-400 font-mono px-4">
          <span>{formatTime(track.currentTime)}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group hover:h-1.5 transition-all">
            <div
              className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>

      {/* Volume - Right */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        <button className="text-gray-400 hover:text-white transition hidden sm:block">
          🎤
        </button>
        <button className="text-gray-400 hover:text-white transition hidden sm:block">
          <List size={18} />
        </button>
        <div className="flex items-center gap-2 w-24 ml-2">
          <Volume2 size={16} className="text-gray-400 flex-shrink-0" />
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
            <div
              className="h-full bg-white group-hover:bg-accent-purple transition-colors"
              style={{ width: `${volume}%` }}
            ></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
