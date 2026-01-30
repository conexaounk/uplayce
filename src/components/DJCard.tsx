import { DJProfile } from "@/hooks/useDJs";
import { getStorageUrl } from "@/lib/storageUtils";

interface DJCardProps {
  dj: DJProfile;
  onClick: () => void;
}

export function DJCard({ dj, onClick }: DJCardProps) {
  const avatarUrl = getStorageUrl(dj.avatar_url);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left glass-card rounded-2xl p-6 hover-glow transition-all duration-300 hover:scale-[1.02] hover:border-primary/30"
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={dj.dj_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            "🎧"
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-lg font-bold mb-1 group-hover:neon-text transition-all">
          {dj.dj_name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {dj.bio || "DJ talentoso"}
        </p>

        {/* City Info */}
        {dj.city && (
          <div className="text-sm text-muted-foreground mb-4">
            📍 {dj.city}
          </div>
        )}

        {/* View Profile Button */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <span className="text-sm font-medium text-secondary">
            Ver perfil completo →
          </span>
        </div>
      </div>
    </button>
  );
}
