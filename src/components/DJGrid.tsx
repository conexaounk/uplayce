import { DJ } from "@/types";
import { DJCard } from "./DJCard";

interface DJGridProps {
  djs: DJ[];
  onDJClick: (dj: DJ) => void;
}

export function DJGrid({ djs, onDJClick }: DJGridProps) {
  if (djs.length === 0) {
    return <div />;
  }

  return (
    <div className="container mx-auto px-4 pb-16">
      <h2 className="text-2xl font-bold mb-6">
        DJs em <span className="neon-text">destaque</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {djs.map((dj, index) => (
          <div
            key={dj.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <DJCard dj={dj} onClick={() => onDJClick(dj)} />
          </div>
        ))}
      </div>
    </div>
  );
}
