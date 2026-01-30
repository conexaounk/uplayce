import { ArrowLeft, Users, Music, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import PackCard from "./PackCard";
import { DJ, Pack } from "@/types";

interface DJProfilePageProps {
  dj: DJ;
  onBack: () => void;
  onPackClick: (pack: Pack) => void;
  onAddToCart: (pack: Pack) => void;
  cartItems: string[];
}

export function DJProfilePage({ 
  dj, 
  onBack, 
  onPackClick, 
  onAddToCart,
  cartItems 
}: DJProfilePageProps) {
  const totalTracks = dj.packs.reduce((acc, pack) => acc + pack.tracks.length, 0);
  
  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Back Button */}
      <div className="container mx-auto px-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 mb-12">
        <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-6xl neon-glow-purple">
              {dj.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-3">
                <span className="text-sm text-primary font-medium">{dj.genre}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 neon-text">{dj.name}</h1>
              <p className="text-muted-foreground max-w-xl mb-6">{dj.bio}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium">{dj.followers.toLocaleString()}</span>
                  <span className="text-muted-foreground">seguidores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-secondary" />
                  <span className="font-medium">{totalTracks}</span>
                  <span className="text-muted-foreground">tracks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Packs Section */}
      <div className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold mb-6">
          Packs <span className="neon-text">disponíveis</span>
        </h2>
        
        {dj.packs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dj.packs.map((pack, index) => (
              <div 
                key={pack.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PackCard
                  pack={pack}
                  onViewDetails={() => onPackClick(pack)}
                  onAddToCart={() => onAddToCart(pack)}
                  isInCart={cartItems.includes(pack.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum pack disponível ainda</p>
          </div>
        )}
      </div>

      {/* Free Downloads Section */}
      {dj.freeDownloads.length > 0 && (
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-bold">
              Downloads <span className="text-secondary">gratuitos</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dj.freeDownloads.map((pack, index) => (
              <div 
                key={pack.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PackCard
                  pack={pack}
                  onViewDetails={() => onPackClick(pack)}
                  onAddToCart={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
