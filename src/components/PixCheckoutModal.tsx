import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.conexaounk.com';

export type OrderData = {
  id: string;
  qrcode: string; // copia e cola
  amount_cents: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: OrderData | null;
  onPaymentConfirmed: () => void;
};

export function PixCheckoutModal({ open, onOpenChange, orderData, onPaymentConfirmed }: Props) {
  useEffect(() => {
    if (!orderData || !open) return;
    let mounted = true;

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`${API_BASE}/orders/${orderData.id}/status`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!res.ok) return;
        const data = await res.json();

        // Espera resposta do servidor: { status: 'pending' | 'paid' }
        if (!mounted) return;
        if (data?.status === 'paid') {
          clearInterval(interval);
          onPaymentConfirmed();
          onOpenChange(false);
        }
      } catch (e) {
        // silenciar erros de polling
        console.error('Erro no polling de pagamento:', e);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orderData, open, onOpenChange, onPaymentConfirmed]);

  if (!orderData) return null;

  const formattedAmount = (orderData.amount_cents / 100).toFixed(2).replace('.', ',');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="pb-1">
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>Escaneie o QR Code ou copie o código para pagar</DialogDescription>
        </DialogHeader>

        <div className="p-6 text-center space-y-4 bg-card rounded-xl border border-white/10">
          <h2 className="text-xl font-bold">Pagamento via PIX</h2>
          <p className="text-sm text-muted-foreground">Valor: R$ {formattedAmount}</p>

          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG value={orderData.qrcode} size={200} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase">Copia e Cola</Label>
            <Input readOnly value={orderData.qrcode} className="text-[10px]" />
            <Button onClick={() => navigator.clipboard.writeText(orderData.qrcode)} size="sm" variant="outline" className="w-full">
              Copiar Código
            </Button>
          </div>

          <p className="text-[10px] text-primary animate-pulse italic">Aguardando confirmação do pagamento...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
