import { useContext } from "react";
import { PlayerContext } from "@/context/PlayerContext";
import { AudioPreview } from "./AudioPreview";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export function MiniPlayer() {
  const context = useContext(PlayerContext);
  
  if (!context) return null;
  
  const { currentTrack, setCurrentTrack } = context;

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] backdrop-blur-md z-40"
      style={{ border: "0.8px 0px 0px solid rgba(255, 255, 255, 0.18)" }}
    >
      <div className="max-w-full mx-auto flex flex-col" style={{ margin: "0 auto 0 111px", padding: "16px 24px 16px 175px" }}>
        <div className="flex items-center gap-4" style={{ margin: "0 auto 0 -22px" }}>
          {/* Cover Image */}
          {currentTrack.cover_url && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0">
              <img
                src={currentTrack.cover_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate text-sm">{currentTrack.title}</h4>
            <p className="text-xs text-gray-400 truncate">{currentTrack.artist || 'Artista desconhecido'}</p>
          </div>

          {/* Player Controls */}
          <div className="flex-1 min-w-[300px]">
            <AudioPreview
              url={currentTrack.audio_url}
              title={currentTrack.title}
              size="sm"
              showTime={true}
            />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white flex-shrink-0"
            onClick={() => setCurrentTrack(null)}
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
