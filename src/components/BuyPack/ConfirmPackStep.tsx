import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Palette, Music } from "lucide-react";
import type { Track } from "@/types/supabase";
import { getStorageUrl } from "@/lib/storageUtils";

interface ConfirmPackStepProps {
  selectedTracks: Track[];
  djName: string;
  onNext: (packName: string, packColor: string) => void;
  onBack: () => void;
}

const COLOR_PRESETS = [
  { name: "Roxo", value: "#A424FF" },
  { name: "Rosa", value: "#FF1493" },
  { name: "Azul", value: "#00D9FF" },
  { name: "Verde", value: "#00FF41" },
  { name: "Laranja", value: "#FF6B35" },
  { name: "Vermelho", value: "#FF0000" },
  { name: "Amarelo", value: "#FFD700" },
  { name: "Ciano", value: "#00FFFF" },
];

export function ConfirmPackStep({
  selectedTracks,
  djName,
  onNext,
  onBack,
}: ConfirmPackStepProps) {
  const [packName, setPackName] = useState(djName);
  const [packColor, setPackColor] = useState("#A424FF");
  const [customColor, setCustomColor] = useState(packColor);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);

  const handleNext = () => {
    onNext(packName, packColor);
  };

  const totalDuration = selectedTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 1000 / 60);

  return (
    <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
      <DialogHeader className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Palette className="text-primary" />
              Configure Seu Pack
            </DialogTitle>
            <DialogDescription className="mt-2">
              Verifique as músicas, escolha um nome e cor para o pack.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-8">
          {/* Pack Configuration */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Configuração do Pack</h3>

            {/* Pack Name */}
            <div className="space-y-2">
              <Label htmlFor="pack-name">Nome do Pack</Label>
              <Input
                id="pack-name"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Seu nome de pack"
                className="bg-white/5 border-white/10 h-11"
              />
              <p className="text-xs text-muted-foreground">
                Este será o nome exibido na capa do seu pack.
              </p>
            </div>

            {/* Pack Color */}
            <div className="space-y-3">
              <Label>Cor do Pack</Label>

              {/* Color Presets Grid */}
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setPackColor(color.value);
                      setShowCustomColorInput(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      packColor === color.value
                        ? "border-white/50 bg-white/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded border border-white/20"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs font-medium">{color.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <button
                onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                className="text-sm text-primary hover:underline"
              >
                {showCustomColorInput ? "Usar presets" : "Cor personalizada"}
              </button>

              {showCustomColorInput && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setPackColor(e.target.value);
                    }}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        setPackColor(e.target.value);
                      }
                    }}
                    placeholder="#A424FF"
                    className="bg-white/5 border-white/10 h-10 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview Pack Cover */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Prévia da Capa</h3>
            <div
              className="w-32 h-32 rounded-lg shadow-lg border border-white/10 flex items-center justify-center text-center p-4 mx-auto"
              style={{ backgroundColor: packColor }}
            >
              <div className="text-white drop-shadow-lg">
                <div className="font-bold text-lg truncate">{packName || djName}</div>
                <div className="text-xs opacity-80 mt-2">{selectedTracks.length} faixas</div>
              </div>
            </div>
          </div>

          {/* Selected Tracks List */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Music className="text-primary" />
              Músicas no Pack ({selectedTracks.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Duração total: {totalMinutes} minutos
            </p>

            <div className="space-y-2">
              {selectedTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>

                  {track.cover_url && (
                    <div className="flex-shrink-0 w-10 h-10 rounded bg-white/10 overflow-hidden">
                      <img
                        src={getStorageUrl(track.cover_url, "track-covers") || "/placeholder.svg"}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{track.title}</h4>
                    {track.artist && (
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    )}
                  </div>

                  {track.duration && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {Math.floor(track.duration / 1000 / 60)}:
                      {String(Math.floor((track.duration / 1000) % 60)).padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change Track Notice */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary">
              Deseja trocar alguma música? Clique em "Voltar" para ajustar sua seleção.
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-6 border-t border-white/10 bg-card flex gap-3 justify-end">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!packName.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          Revisar Compra
        </Button>
      </div>
    </div>
  );
}
