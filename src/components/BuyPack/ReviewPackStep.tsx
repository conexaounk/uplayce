import { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Music, AlertCircle, Check } from "lucide-react";
import type { Track } from "@/types/supabase";
import { getStorageUrl } from "@/lib/storageUtils";
import { useCreatePackOrder } from "@/hooks/use-packs";
import { useAuth } from "@/hooks/use-auth";

interface ReviewPackStepProps {
  selectedTracks: Track[];
  packName: string;
  packColor: string;
  djName: string;
  djId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function ReviewPackStep({
  selectedTracks,
  packName,
  packColor,
  djName,
  djId,
  onComplete,
  onBack,
}: ReviewPackStepProps) {
  const { user } = useAuth();
  const createPackOrder = useCreatePackOrder();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalDuration = selectedTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 1000 / 60);
  const pricePerTrack = 9.99;
  const totalPrice = selectedTracks.length * pricePerTrack;
  const isProcessing = createPackOrder.isPending;

  const handleConfirmPurchase = async () => {
    if (!user) return;

    try {
      await createPackOrder.mutateAsync({
        trackIds: selectedTracks.map((t) => t.id),
        packName,
        packColor,
        djId,
        buyerId: user.id,
      });
      setShowConfirmation(true);
    } catch (error) {
      console.error("Erro ao confirmar compra:", error);
    }
  };

  if (showConfirmation) {
    return (
      <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh] items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Compra Realizada!</h2>
            <p className="text-muted-foreground">
              Seu pack "{packName}" foi criado com sucesso.
            </p>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>10 músicas adicionadas</p>
            <p>Duração total: {totalMinutes} minutos</p>
            <p>
              Valor pago: <span className="text-white font-bold">R$ {totalPrice.toFixed(2)}</span>
            </p>
          </div>

          <Button
            onClick={() => {
              setShowConfirmation(false);
              onComplete();
            }}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            Voltar para o Perfil
          </Button>
        </div>
      </div>
    );
  }

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
              <Music className="text-primary" />
              Revisar Compra
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-8">
          {/* Pack Cover - Large */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="w-40 h-40 rounded-xl shadow-2xl border border-white/10 flex items-center justify-center text-center p-6"
              style={{ backgroundColor: packColor }}
            >
              <div className="text-white drop-shadow-lg">
                <div className="font-bold text-2xl truncate mb-2">{packName}</div>
                <div className="text-sm opacity-80">por {djName}</div>
                <div className="text-xs opacity-70 mt-3">{selectedTracks.length} faixas</div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Duração Total</p>
              <p className="text-2xl font-bold">{totalMinutes} minutos</p>
            </div>
          </div>

          {/* Warning about track changes */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100">
              <p className="font-semibold mb-1">Última chance para ajustar!</p>
              <p>
                Após confirmar, você poderá trocar músicas depois, mas será cobrado novamente.
              </p>
            </div>
          </div>

          {/* Selected Tracks List */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Músicas do Pack</h3>

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

          {/* Price Breakdown */}
          <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-bold">Detalhes da Compra</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>10 músicas × R$ {pricePerTrack.toFixed(2)}</span>
                <span>R$ {(selectedTracks.length * pricePerTrack).toFixed(2)}</span>
              </div>

              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span>Total a Pagar</span>
                <span className="text-primary text-lg">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm space-y-2">
            <p className="font-semibold">Métodos de Pagamento Aceitos:</p>
            <ul className="space-y-1 text-primary/90">
              <li>✓ PIX (instantâneo)</li>
              <li>✓ Cartão de Crédito (parcelado em até 12x)</li>
            </ul>
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-6 border-t border-white/10 bg-card space-y-3">
        <Button
          onClick={handleConfirmPurchase}
          disabled={isProcessing}
          className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold"
        >
          {isProcessing ? "Processando..." : `Confirmar Compra - R$ ${totalPrice.toFixed(2)}`}
        </Button>

        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full"
        >
          Voltar e Ajustar
        </Button>
      </div>
    </div>
  );
}
