import { Pack } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2, Music2, Trash2 } from "lucide-react";
import { useState } from "react";

interface PackCardProps {
  pack: Pack;
  isOwner?: boolean;
  onDelete?: (packId: string) => void;
  onDownload?: (pack: Pack) => void;
}

export default function PackCard({
  pack,
  isOwner = false,
  onDelete,
  onDownload,
}: PackCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar "${pack.name}"?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(pack.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const trackCount = pack.tracks?.length || 0;
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="glass-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
        {pack.cover_url ? (
          <img
            src={pack.cover_url}
            alt={pack.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Music2 className="w-12 h-12 opacity-50" />
            <span className="text-sm opacity-75">Sem capa</span>
          </div>
        )}

        {/* Badge - Free or Price */}
        <div className="absolute top-3 right-3 flex gap-2">
          {pack.is_free ? (
            <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
              GRÁTIS
            </div>
          ) : (
            <div className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
              {formatPrice(pack.price)}
            </div>
          )}
        </div>

        {/* Overlay on hover - Owner Controls */}
        {isOwner && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Deletar
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-bold text-lg line-clamp-2 text-white">{pack.name}</h3>
          {pack.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {pack.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music2 className="w-4 h-4" />
            <span>{trackCount} track{trackCount !== 1 ? "s" : ""}</span>
          </div>
          {pack.genre && (
            <div className="px-2 py-1 bg-primary/10 rounded-full text-primary font-medium">
              {pack.genre}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload?.(pack)}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
