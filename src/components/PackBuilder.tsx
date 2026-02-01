import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Music } from "lucide-react";

// Mock das tracks filtradas por mashup
const mashupTracks = [
  { id: "1", title: "Mashup Funk 2024", artist: "DJ Top" },
  { id: "2", title: "Mega Mix House", artist: "DJ Tech" },
  // ... mais tracks
];

export function PackBuilder() {
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const PACK_LIMIT = 10;
  const PACK_PRICE = 100; // R$
  const UNIT_PRICE = 15;  // R$

  const toggleTrack = (id: string) => {
    if (selectedTracks.includes(id)) {
      setSelectedTracks(prev => prev.filter(t => t !== id));
    } else {
      if (selectedTracks.length < PACK_LIMIT) {
        setSelectedTracks(prev => [...prev, id]);
      }
    }
  };

  const totalPrice = selectedTracks.length === PACK_LIMIT ? PACK_PRICE : selectedTracks.length * UNIT_PRICE;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Monte seu Pack</h2>
          <p className="text-muted-foreground">Selecione {PACK_LIMIT} mashups por apenas R$ {PACK_PRICE}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total selecionado: {selectedTracks.length}/{PACK_LIMIT}</div>
          <div className="text-3xl font-black text-primary">R$ {totalPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mashupTracks.map((track) => (
          <Card 
            key={track.id}
            onClick={() => toggleTrack(track.id)}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedTracks.includes(track.id) 
                ? "border-primary bg-primary/10" 
                : "border-white/5 hover:border-white/20 bg-background/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Music size={18} className={selectedTracks.includes(track.id) ? "text-primary" : "text-muted-foreground"} />
                <div>
                  <p className="font-medium line-clamp-1">{track.title}</p>
                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                </div>
              </div>
              {selectedTracks.includes(track.id) && <CheckCircle2 className="text-primary" size={20} />}
            </div>
          </Card>
        ))}
      </div>

      <Button 
        className="w-full h-14 text-lg font-bold" 
        disabled={selectedTracks.length === 0}
      >
        <ShoppingBag className="mr-2" />
        {selectedTracks.length === PACK_LIMIT ? "Fechar Pack Promocional" : "Comprar Avulso"}
      </Button>
    </div>
  );
}
