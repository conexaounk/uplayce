import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Profile } from "@/types/supabase";
import { Music, MapPin } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";

interface DJCardProps {
  dj: Profile;
}

export function DJCard({ dj }: DJCardProps) {
  const avatarUrl = getStorageUrl(dj.avatar_url, "avatars") || "/placeholder.svg";

  return (
    <Link href={`/djs/${dj.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors flex-shrink-0">
          <img
            src={avatarUrl}
            alt={dj.dj_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors truncate">
            {dj.dj_name}
          </h3>
          {dj.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin size={12} />
              {dj.city}
            </p>
          )}
          {dj.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {dj.bio}
            </p>
          )}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          <Music size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </motion.div>
    </Link>
  );
}
