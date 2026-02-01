import { createContext, useState, ReactNode } from "react";

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string;
  genre: string;
  track_type: string;
  price_cents: number;
  duration: number;
  is_public: boolean;
}

interface PlayerContextType {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  setCurrentTrack: (track: PlayerTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, setCurrentTrack, setIsPlaying }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = React.useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}
