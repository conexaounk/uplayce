import { motion } from "framer-motion";
import { Play, ShoppingBag } from "lucide-react";
import type { PackWithTracks } from "@/types/supabase";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { getStorageUrl } from "@/lib/storageUtils";

interface PackCardProps {
  pack: PackWithTracks;
  onClick: () => void;
}

export function PackCard({ pack, onClick }: PackCardProps) {
  const { addItem } = useCart();

  const coverImage = getStorageUrl(pack.cover_url, "pack-covers") || "/placeholder.svg";
  const price = pack.price ?? 0;
  const djName = pack.profile?.dj_name || "DJ Desconhecido";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: pack.id,
      title: pack.name,
      price: price.toString(),
      coverImage,
      author: { username: djName },
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
          src={coverImage}
          alt={pack.name}
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

        {pack.is_free && (
          <div className="absolute top-3 right-3 bg-secondary/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-black border border-secondary">
            GRÁTIS
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
              {pack.name}
            </h3>
            <p className="text-sm text-muted-foreground">by {djName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-secondary">
              {pack.is_free ? "Grátis" : `R$ ${price}`}
            </span>
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
