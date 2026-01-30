import { Music, HardDrive, ShoppingCart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pack } from "@/types";

interface PackCardProps {
  pack: Pack;
  onViewDetails: () => void;
  onAddToCart: () => void;
  isInCart?: boolean;
}

export function PackCard({ pack, onViewDetails, onAddToCart, isInCart }: PackCardProps) {
  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover-glow transition-all duration-300 hover:border-primary/30">
      {/* Cover */}
      <button
        onClick={onViewDetails}
        className="w-full aspect-square bg-gradient-to-br from-primary/20 via-card to-secondary/20 flex items-center justify-center text-6xl relative overflow-hidden"
      >
        <span className="group-hover:scale-110 transition-transform duration-300">
          {pack.coverEmoji}
        </span>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-sm font-medium text-white">Ver detalhes</span>
        </div>

        {/* Free Badge */}
        {pack.isFree && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-secondary rounded-full">
            <span className="text-xs font-bold text-secondary-foreground">GRÁTIS</span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {pack.name}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Music className="w-4 h-4" />
            <span>{pack.tracks.length} tracks</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-4 h-4" />
            <span>{pack.sizeGB} GB</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {pack.isFree ? (
              <span className="text-secondary">Grátis</span>
            ) : (
              <span className="neon-text">R$ {pack.price.toFixed(2)}</span>
            )}
          </div>

          {pack.isFree ? (
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4 mr-1" />
              Baixar
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant={isInCart ? "outline" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              disabled={isInCart}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {isInCart ? "No carrinho" : "Comprar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
