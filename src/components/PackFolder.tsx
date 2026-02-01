import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Music, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Track = {
  id: string;
  title: string;
  artist?: string;
  price_cents?: number | null;
};

interface PackBuilderDrawerProps {
  packName: string;
  packColor: string;
  userName?: string;
  initialTracks?: Track[];
  onEdit?: () => void;
  onFinalize?: (tracks: Track[], coverDataUrl?: string) => void;
}

export function PackBuilderDrawer({
  packName,
  packColor,
  userName = "ARTIST",
  initialTracks = [],
  onEdit,
  onFinalize,
}: PackBuilderDrawerProps) {
  const [selectedTracks, setSelectedTracks] = useState<Track[]>(initialTracks);
  const isFull = selectedTracks.length === 10;

  function handleSlotClick(index: number) {
    if (selectedTracks[index]) {
      // remover
      if (confirm("Remover essa faixa do pack?")) {
        setSelectedTracks((prev) => prev.filter((_, i) => i !== index));
      }
      return;
    }

    const title = prompt("Título da faixa para adicionar ao pack:");
    if (!title) return;

    const newTrack: Track = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
    };

    setSelectedTracks((prev) => {
      const copy = [...prev];
      if (copy.length < 10) {
        copy.push(newTrack);
      }
      return copy;
    });
  }

  async function handleFinalize() {
    // gerar capa e retornar via callback
    const cover = generateCover(packName, userName, packColor);
    if (onFinalize) onFinalize(selectedTracks, cover);
    alert("Pack finalizado — capa gerada (data URI retornada via callback)");
  }

  return (
    <div className={`fixed bottom-0 right-0 m-6 w-80 rounded-t-2xl shadow-2xl border border-white/10 bg-card overflow-hidden`}>
      {/* Header com a Cor Escolhida */}
      <div style={{ backgroundColor: packColor }} className="p-4 flex items-center gap-3 text-black">
        <Folder fill="currentColor" size={24} />
        <span className="font-bold truncate">{packName}</span>
        <span className="ml-auto font-black">{selectedTracks.length}/10</span>
      </div>

      <div className="p-4 space-y-2 max-h-96 overflow-y-auto bg-black/40">
        {/* Slots de Música */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleSlotClick(i)}
            className={`h-10 border border-white/5 rounded flex items-center px-3 gap-2 bg-white/5 cursor-pointer ${selectedTracks[i] ? "hover:bg-primary/10" : "opacity-80"}`}
          >
            {selectedTracks[i] ? (
              <>
                <Music size={14} className="text-primary" />
                <span className="text-xs truncate">{selectedTracks[i].title}</span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Vazio</span>
            )}
          </div>
        ))}
      </div>

      {/* Feedback de Conclusão */}
      <AnimatePresence>
        {isFull && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="p-4 bg-primary text-primary-foreground text-center">
            <p className="font-bold mb-2">🔥 Pack Completo!</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => onEdit?.()}>Editar</Button>
              <Button size="sm" className="flex-1 bg-black text-white" onClick={handleFinalize}>Finalizar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Geração da Capa Exclusiva
export const generateCover = (packName: string, userName: string, color: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Fundo
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1000, 1000);

  // Texto - Nome do Pack
  ctx.fillStyle = "white";
  ctx.font = "bold 80px Montserrat, Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  // Ajuste simples para quebrar texto longo
  const title = packName.toUpperCase();
  const lines = [];
  if (title.length > 20) {
    // quebra em duas linhas
    const mid = Math.floor(title.length / 2);
    lines.push(title.slice(0, mid).trim(), title.slice(mid).trim());
  } else {
    lines.push(title);
  }

  let y = 700;
  lines.forEach((line) => {
    ctx.fillText(line, 100, y);
    y += 90;
  });

  // Texto - Nome do Usuário
  ctx.font = "40px Montserrat, Arial, sans-serif";
  ctx.globalAlpha = 0.85;
  ctx.fillText(`EXCLUSIVE PACK FOR ${userName.toUpperCase()}`, 100, 930);

  return canvas.toDataURL("image/jpeg", 0.9);
};
