import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Music, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixCheckoutModal, OrderData } from '@/components/PixCheckoutModal';
import { usePack } from '@/context/packContext';
import { useToast } from '@/hooks/use-notification';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.conexaounk.com';

export function FloatingFolder() {
  const { currentPack, removeTrack, finalize } = usePack();
  const toast = useToast();
  const [orderData, setOrderData] = useState<{ id: string; qrcode: string; amount_cents: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!currentPack) return null;

  const slots = Array.from({ length: 10 });
  const isFull = currentPack.tracks.length === 10;

  const handleCancel = () => {
    toast.info('Pack cancelado', 'Você descartou este pack');
    finalize(); // This will clear the pack
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 shadow-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl">
      <div style={{ backgroundColor: currentPack.color }} className="p-4 flex items-center justify-between text-black">
        <div className="flex items-center gap-2">
          <Folder fill="currentColor" size={20} />
          <span className="font-bold text-sm truncate max-w-[120px]">{currentPack.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-black">{currentPack.tracks.length}/10</span>
          <button
            onClick={() => {
              toast.info('Pack cancelado', 'Você descartou este pack');
              finalize();
            }}
            className="bg-black/20 hover:bg-black/40 p-1 rounded transition-colors"
            title="Cancelar pack"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-3 grid grid-cols-5 gap-2 bg-white/5">
        {slots.map((_, i) => (
          <div key={i} className={`h-10 rounded border flex items-center justify-center transition-all ${currentPack.tracks[i] ? 'border-primary/50 bg-primary/20' : 'border-dashed border-white/10 bg-white/5'}`}>
            {currentPack.tracks[i] ? (
              <div className="flex items-center gap-1">
                <Music size={14} className="text-primary" />
                <span className="text-[10px] truncate max-w-[80px]">{currentPack.tracks[i].title}</span>
                <button className="ml-2 text-muted-foreground" onClick={() => removeTrack(currentPack.tracks[i].id)} title="Remover">×</button>
              </div>
            ) : (
              <span className="text-[8px] text-muted-foreground">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isFull && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2 mb-3 font-bold text-sm">
              <CheckCircle size={18} />
              <span>Pack Completo!</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  try {
                    // Se o pack for gratuito (somatório 0), baixa diretamente
                    const total = currentPack.tracks.reduce((s, t) => s + (t.price_cents ?? 0), 0);
                    if (total === 0) {
                      toast.info('Preparando download', 'Pack gratuito — iniciando download');
                      const { downloadPack } = await import('@/lib/packDownload');
                      const userName = currentPack.userName || 'artist';
                      await downloadPack(currentPack.name, userName, currentPack.color, currentPack.tracks);
                      toast.success('Download iniciado', 'Seu pack está sendo baixado');
                      return;
                    }

                    // Cria ordem no backend e abre modal de pagamento com QR
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

                    setOrderData({ id: order.id || order.orderId || order._id, qrcode: order.qrcode, amount_cents: order.amount_cents ?? payload.amount_cents });
                    setCheckoutOpen(true);
                  } catch (e) {
                    console.error('Erro ao criar pedido do pack', e);
                    toast.error('Erro ao processar pedido', 'Tente novamente');
                  }
                }}
                variant="secondary"
                className="w-full text-xs font-bold bg-white text-black"
              >
                Finalizar e Baixar
              </Button>
              <Button variant="ghost" className="w-full text-[10px] hover:bg-black/10">Editar Seleção</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
