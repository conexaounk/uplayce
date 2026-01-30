import { useState } from "react";
import { X, CreditCard, QrCode, Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onConfirm: () => void;
}

type PaymentMethod = "pix" | "card";

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  onConfirm,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const total = items.reduce((acc, item) => acc + item.pack.price * item.quantity, 0);

  const pixCode = "00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540" + total.toFixed(2).replace(".", "") + "5802BR5925UPLAY MARKETPLACE LTDA6009SAO PAULO62070503***6304";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Checkout</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Resumo do Pedido
            </h3>
            
            {items.map((item) => (
              <div 
                key={item.pack.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.pack.coverEmoji}</span>
                  <div>
                    <p className="font-medium text-sm">{item.pack.name}</p>
                    <p className="text-xs text-muted-foreground">{item.djName}</p>
                  </div>
                </div>
                <span className="font-medium">R$ {item.pack.price.toFixed(2)}</span>
              </div>
            ))}
            
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold neon-text">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Método de Pagamento
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("pix")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <QrCode className={`w-6 h-6 mx-auto mb-2 ${
                  paymentMethod === "pix" ? "text-primary" : "text-muted-foreground"
                }`} />
                <span className={`text-sm font-medium ${
                  paymentMethod === "pix" ? "text-primary" : ""
                }`}>PIX</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod("card")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                  paymentMethod === "card" ? "text-primary" : "text-muted-foreground"
                }`} />
                <span className={`text-sm font-medium ${
                  paymentMethod === "card" ? "text-primary" : ""
                }`}>Cartão</span>
              </button>
            </div>
          </div>

          {/* PIX Section */}
          {paymentMethod === "pix" && (
            <div className="space-y-4 animate-fade-in">
              {/* QR Code Placeholder */}
              <div className="bg-white rounded-2xl p-6 mx-auto w-fit">
                <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-primary" />
                </div>
              </div>

              {/* Copy Code */}
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">Código PIX Copia e Cola</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded-lg p-2 overflow-x-auto">
                    {pixCode.slice(0, 40)}...
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyPix}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                O pagamento será confirmado automaticamente
              </p>
            </div>
          )}

          {/* Card Section */}
          {paymentMethod === "card" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Número do cartão"
                  className="w-full h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nome no cartão"
                  className="w-full h-12 px-4 rounded-xl bg-muted border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button 
            variant="neon" 
            size="lg" 
            className="w-full"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              `Pagar R$ ${total.toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
