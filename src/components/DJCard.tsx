import { Music, Users } from "lucide-react";
import { DJ } from "@/types";

interface DJCardProps {
  dj: DJ;
  onClick: () => void;
}

export function DJCard({ dj, onClick }: DJCardProps) {
  const totalTracks = dj.packs.reduce((acc, pack) => acc + pack.tracks.length, 0);
  
  return (
    <button
      onClick={onClick}
      className="group w-full text-left glass-card rounded-2xl p-6 hover-glow transition-all duration-300 hover:scale-[1.02] hover:border-primary/30"
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
          {dj.avatar}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary/20 rounded-full">
          <span className="text-xs text-primary font-medium">{dj.genre}</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-lg font-bold mb-1 group-hover:neon-text transition-all">
          {dj.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {dj.bio}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{(dj.followers / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex items-center gap-1">
            <Music className="w-4 h-4" />
            <span>{totalTracks} tracks</span>
          </div>
        </div>

        {/* Packs Count */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <span className="text-sm font-medium text-secondary">
            {dj.packs.length} Pack{dj.packs.length !== 1 ? 's' : ''} disponíve{dj.packs.length !== 1 ? 'is' : 'l'}
          </span>
        </div>
      </div>
    </button>
  );
}
