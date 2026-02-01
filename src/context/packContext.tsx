import React, { createContext, useContext, useState } from 'react';
import { generateCover } from '@/components/PackFolder';
import { toast } from 'sonner';

export type Track = {
  id: string;
  title: string;
  artist?: string;
  track_type?: string;
  price_cents?: number | null;
};

export type Pack = {
  id: string;
  name: string;
  color: string;
  userName?: string;
  tracks: Track[];
};

type PackContextValue = {
  currentPack: Pack | null;
  createPack: (name: string, color: string, userName?: string) => void;
  clearPack: () => void;
  addTrack: (track: Track) => boolean;
  removeTrack: (trackId: string) => void;
  finalize: () => Promise<{ cover?: string; pack?: Pack } | null>;
};

const PackContext = createContext<PackContextValue | undefined>(undefined);

export function PackProvider({ children }: { children: React.ReactNode }) {
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);

  function createPack(name: string, color: string, userName?: string) {
    const pack: Pack = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      color,
      userName,
      tracks: [],
    };
    setCurrentPack(pack);
    toast.success('Pack criado');
  }

  function clearPack() {
    setCurrentPack(null);
  }

  function addTrack(track: Track) {
    if (!currentPack) {
      toast.error('Nenhum pack ativo. Crie um pack primeiro.');
      return false;
    }
    // Apenas mashups nos packs - regra opcional
    if (track.track_type && track.track_type !== 'mashup') {
      toast.error('Somente Mashups podem ser adicionados ao pack.');
      return false;
    }
    if (currentPack.tracks.find((t) => t.id === track.id)) {
      toast('Track já adicionada ao pack');
      return false;
    }
    if (currentPack.tracks.length >= 10) {
      toast.error('Pack já está cheio');
      return false;
    }

    setCurrentPack((prev) => prev ? { ...prev, tracks: [...prev.tracks, track] } : prev);
    toast.success('Adicionar ao pack');
    return true;
  }

  function removeTrack(trackId: string) {
    if (!currentPack) return;
    setCurrentPack({ ...currentPack, tracks: currentPack.tracks.filter((t) => t.id !== trackId) });
  }

  async function finalize() {
    if (!currentPack) return null;
    if (currentPack.tracks.length < 1) {
      toast.error('Adicione pelo menos uma música antes de finalizar');
      return null;
    }
    const cover = generateCover(currentPack.name, currentPack.userName || 'ARTIST', currentPack.color);
    // aqui você pode subir a capa para o backend / R2 e criar o pack no D1
    toast.success('Pack finalizado');
    return { cover, pack: currentPack };
  }

  return (
    <PackContext.Provider value={{ currentPack, createPack, clearPack, addTrack, removeTrack, finalize }}>
      {children}
    </PackContext.Provider>
  );
}

export function usePack() {
  const ctx = useContext(PackContext);
  if (!ctx) throw new Error('usePack deve ser usado dentro de PackProvider');
  return ctx;
}
