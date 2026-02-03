import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Music, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixCheckoutModal, OrderData } from '@/components/PixCheckoutModal';
import { usePack } from '@/context/packContext';
import { useToast } from '@/hooks/use-notification';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.conexaounk.com';

export function FloatingFolder() {
  const { currentPack, removeTrack, addTrack, finalize, clearPack } = usePack();
  const toast = useToast();
  const [orderData, setOrderData] = useState<{ id: string; qrcode: string; amount_cents: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!currentPack) return null;

  const slots = Array.from({ length: 10 });
  const isFull = currentPack.tracks.length === 10;

  // Handlers para drag and drop
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const track = JSON.parse(data);
        const success = addTrack({
          id: track.id,
          title: track.title,
          artist: track.artist,
          track_type: track.track_type,
          price_cents: track.price_cents,
        });
        if (success) {
          toast.success('Track adicionada', `${track.title} foi adicionada ao pack`);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar track via drag:', error);
    }
  };

  return (
    <motion.div
      layout
      className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-xl"
    >
      {/* Header com gradiente */}
      <div
        style={{
          backgroundColor: currentPack.color,
          backgroundImage: `linear-gradient(135deg, ${currentPack.color}dd 0%, ${currentPack.color}aa 100%)`,
        }}
        className="p-5 flex items-center justify-between text-white relative overflow-hidden"
      >
        {/* Efeito de brilho */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-white/20 via-transparent to-transparent" />

        <div className="flex items-center gap-3 relative z-10">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Folder fill="currentColor" size={24} />
          </motion.div>
          <div>
            <span className="font-black text-sm block truncate max-w-[140px]">{currentPack.name}</span>
            <span className="text-xs opacity-80">{currentPack.tracks.length} de 10 tracks</span>
          </div>
        </div>

        <button
          onClick={() => {
            toast.info('Pack cancelado', 'Você descartou este pack');
            clearPack();
          }}
          className="relative z-10 bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all hover:scale-110"
          title="Cancelar pack"
        >
          <X size={18} />
        </button>
      </div>

      {/* Área de slots com drag and drop */}
      <div
        className={`p-4 grid grid-cols-5 gap-3 transition-all ${
          isDragOver ? 'bg-primary/20 border-b-2 border-primary/50' : 'bg-white/[0.02]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {slots.map((_, i) => {
          const track = currentPack.tracks[i];
          const isOver = dragOverIndex === i;

          return (
            <motion.div
              key={i}
              layout
              className={`relative h-16 rounded-xl border-2 flex items-center justify-center transition-all cursor-grab active:cursor-grabbing overflow-hidden group ${
                track
                  ? 'border-primary/60 bg-gradient-to-br from-primary/25 to-primary/10 shadow-lg shadow-primary/20'
                  : isOver
                    ? 'border-primary/80 bg-primary/30 scale-105'
                    : 'border-dashed border-white/20 bg-white/5 hover:border-primary/40 hover:bg-primary/10'
              }`}
            >
              {track ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center relative">
                  {/* Gradiente de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Conteúdo */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Music size={14} className="text-primary drop-shadow" />
                    <span className="text-[9px] font-semibold truncate max-w-[60px] line-clamp-1 text-white/90">
                      {track.title}
                    </span>
                  </div>

                  {/* Botão X - aparece no hover */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                      toast.info('Removida', `${track.title} saiu do pack`);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors z-20"
                    title="Remover do pack"
                  >
                    <X size={12} strokeWidth={3} />
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  animate={isOver ? { scale: 1.2 } : { scale: 1 }}
                  className="text-center"
                >
                  <span className="text-xs font-semibold text-white/40">{i + 1}</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Mensagem de drop */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-primary/30 px-4 py-3 text-center border-t border-primary/20"
        >
          <p className="text-sm font-semibold text-primary">Solte a track aqui</p>
        </motion.div>
      )}

      {/* Status completo ou botões de ação */}
      <AnimatePresence>
        {isFull && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-primary/20 to-primary/10 border-t border-primary/20 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-primary mb-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <CheckCircle size={18} />
              </motion.div>
              <span>Pack Completo!</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  try {
                    const total = currentPack.tracks.reduce((s, t) => s + (t.price_cents ?? 0), 0);
                    if (total === 0) {
                      toast.info('Preparando download', 'Pack gratuito — iniciando download');
                      const { downloadPack } = await import('@/lib/packDownload');
                      const userName = currentPack.userName || 'artist';
                      await downloadPack(currentPack.name, userName, currentPack.color, currentPack.tracks);
                      toast.success('Download iniciado', 'Seu pack está sendo baixado');
                      return;
                    }

                    toast.info('Processando pedido', 'Aguarde enquanto prepararmos seu QR Code');

                    const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
                    if (!session?.access_token) throw new Error('Login necessário');

                    const payload = {
                      amount_cents: total,
                      pack_name: currentPack.name,
                      items: currentPack.tracks.map((t) => t.id),
                    };

                    const res = await fetch(`${API_BASE}/orders`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify(payload),
                    });

                    if (!res.ok) throw new Error('Erro ao criar pedido');
                    const order = await res.json();

                    setOrderData({
                      id: order.id || order.orderId || order._id,
                      qrcode: order.qrcode,
                      amount_cents: order.amount_cents ?? payload.amount_cents,
                    });
                    setCheckoutOpen(true);
                  } catch (e) {
                    console.error('Erro ao criar pedido do pack', e);
                    toast.error('Erro ao processar pedido', 'Tente novamente');
                  }
                }}
                variant="secondary"
                className="w-full text-sm font-bold bg-white hover:bg-white/90 text-black"
              >
                Finalizar e Baixar
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs hover:bg-primary/20 hover:text-primary transition-colors"
              >
                Editar Seleção
              </Button>

              <Button
                onClick={() => {
                  toast.info('Pack cancelado', 'Você descartou este pack');
                  clearPack();
                }}
                variant="ghost"
                className="w-full text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão cancelar para packs incompletos */}
      {!isFull && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-white/5 p-3"
        >
          <Button
            onClick={() => {
              toast.info('Pack cancelado', 'Você descartou este pack');
              clearPack();
            }}
            variant="ghost"
            className="w-full text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            Cancelar Pack
          </Button>
        </motion.div>
      )}

      {/* Modal de checkout */}
      {orderData && (
        <PixCheckoutModal
          isOpen={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setOrderData(null);
          }}
          orderData={orderData}
        />
      )}
    </motion.div>
  );
}
