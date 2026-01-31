import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { X, Check, Music, Search } from "lucide-react";
import type { Track } from "@/types/supabase";
import { getStorageUrl } from "@/lib/storageUtils";

interface SelectTracksStepProps {
  tracks: Track[];
  onNext: (tracks: Track[]) => void;
  onCancel: () => void;
}

const REQUIRED_TRACKS = 10;

export function SelectTracksStep({ tracks, onNext, onCancel }: SelectTracksStepProps) {
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTracks = tracks.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTrack = (track: Track) => {
    const isSelected = selectedTracks.some((t) => t.id === track.id);

    if (isSelected) {
      setSelectedTracks(selectedTracks.filter((t) => t.id !== track.id));
    } else if (selectedTracks.length < REQUIRED_TRACKS) {
      setSelectedTracks([...selectedTracks, track]);
    }
  };

  const handleNext = () => {
    if (selectedTracks.length === REQUIRED_TRACKS) {
      onNext(selectedTracks);
    }
  };

  const isComplete = selectedTracks.length === REQUIRED_TRACKS;

  return (
    <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
      <DialogHeader className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Music className="text-primary" />
              Selecione 10 Músicas
            </DialogTitle>
            <DialogDescription className="mt-2">
              Escolha exatamente {REQUIRED_TRACKS} músicas para criar seu pack.
            </DialogDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {selectedTracks.length}/{REQUIRED_TRACKS}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Músicas selecionadas</p>
          </div>
        </div>
      </DialogHeader>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por título ou artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {/* Tracks List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-2">
          {filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mb-4 opacity-30" />
              <p>Nenhuma música encontrada</p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedTracks.some((t) => t.id === track.id);
              const canSelect = !isSelected && selectedTracks.length < REQUIRED_TRACKS;

              return (
                <button
                  key={track.id}
                  onClick={() => toggleTrack(track)}
                  disabled={!canSelect && !isSelected}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "bg-primary/20 border-primary/50"
                      : canSelect
                      ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                      : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black" />}
                  </div>

                  {/* Cover Image */}
                  {track.cover_url && (
                    <div className="flex-shrink-0 w-12 h-12 rounded bg-white/10 overflow-hidden">
                      <img
                        src={getStorageUrl(track.cover_url, "track-covers") || "/placeholder.svg"}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{track.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {track.artist && <span className="truncate">{track.artist}</span>}
                      {track.artist && track.genre && <span>•</span>}
                      {track.genre && <span className="capitalize">{track.genre}</span>}
                    </div>
                  </div>

                  {/* Duration */}
                  {track.duration && (
                    <span className="flex-shrink-0 text-sm text-muted-foreground">
                      {Math.floor(track.duration / 1000 / 60)}:
                      {String(Math.floor((track.duration / 1000) % 60)).padStart(2, "0")}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Selected Tracks Bar - Fixed at bottom */}
      {selectedTracks.length > 0 && (
        <div className="border-t border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Selecionadas:</span>
            {selectedTracks.map((track) => (
              <div
                key={track.id}
                className="bg-primary/20 border border-primary/50 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-2 max-w-full"
              >
                <span className="truncate">{track.title}</span>
                <button
                  onClick={() => toggleTrack(track)}
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 border-t border-white/10 bg-card flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isComplete}
          className="bg-primary hover:bg-primary/90"
        >
          Próximo ({selectedTracks.length}/{REQUIRED_TRACKS})
        </Button>
      </div>
    </div>
  );
}
