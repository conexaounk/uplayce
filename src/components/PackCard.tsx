import { motion } from "framer-motion";
import { Play, ShoppingBag } from "lucide-react";
import { type PackWithTracks } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

interface PackCardProps {
  pack: PackWithTracks;
  onClick: () => void;
}

export function PackCard({ pack, onClick }: PackCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: pack.id,
      title: pack.title,
      price: pack.price.toString(),
      coverImage: pack.coverImage,
      author: { username: pack.author?.username || "Unknown" }
    });
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={pack.coverImage} 
          alt={pack.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm bg-black/20">
          <Button 
            size="icon" 
            className="w-16 h-16 rounded-full bg-white text-black hover:bg-primary hover:text-white transition-colors shadow-lg shadow-black/50"
          >
            <Play className="ml-1" fill="currentColor" size={24} />
          </Button>
        </div>

        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
          {pack.genre}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">{pack.title}</h3>
            <p className="text-sm text-muted-foreground">by {pack.author?.username || "Unknown DJ"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-secondary">R$ {pack.price}</span>
          </div>
          
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            className="rounded-full bg-white/10 hover:bg-secondary hover:text-black text-white border-none transition-colors"
          >
            <ShoppingBag size={16} className="mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
