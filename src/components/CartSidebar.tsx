import { X, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (packId: string) => void;
  onCheckout: () => void;
}

export function CartSidebar({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onCheckout,
}: CartSidebarProps) {
  const total = items.reduce((acc, item) => acc + item.pack.price * item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Carrinho</h2>
              {items.length > 0 && (
                <span className="px-2 py-1 bg-primary/20 text-primary text-sm rounded-full">
                  {items.length}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Carrinho vazio</h3>
                <p className="text-muted-foreground text-sm">
                  Adicione packs para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.pack.id}
                    className="glass-card rounded-xl p-4 animate-fade-in"
                  >
                    <div className="flex items-start gap-4">
                      {/* Pack Cover */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                        {item.pack.coverEmoji}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-1">{item.pack.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.djName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.pack.tracks.length} tracks • {item.pack.sizeGB} GB
                        </p>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right">
                        <p className="font-bold neon-text">
                          R$ {item.pack.price.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.pack.id)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-border space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold neon-text">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button 
                variant="neon" 
                size="lg" 
                className="w-full"
                onClick={onCheckout}
              >
                Finalizar Compra
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
