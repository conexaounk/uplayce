import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCreateOrder } from "@/hooks/use-packs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CartSidebar() {
  const { items, removeItem, total, isOpen, setIsOpen, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const createOrder = useCreateOrder();

  const handleCheckout = () => {
    setIsOpen(false);
    setCheckoutOpen(true);
  };

  const handlePayment = async (method: 'pix' | 'credit_card') => {
    try {
      await createOrder.mutateAsync({
        items: items.map(i => i.id),
        paymentMethod: method
      });
      clearCart();
      setCheckoutOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-card border-l border-border z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-primary" />
                  <h2 className="text-xl font-bold font-display">Seu Carrinho</h2>
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-mono">
                    {items.length}
                  </span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X />
                </button>
              </div>

              <ScrollArea className="flex-1 p-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <ShoppingCart size={48} className="text-muted-foreground" />
                    <p>Seu carrinho está vazio.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                        <img src={item.coverImage} alt={item.title} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{item.author.username}</p>
                          <p className="text-secondary font-mono font-bold">R$ {item.price}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors px-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-6 border-t border-border bg-card">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-white text-glow">R$ {total.toFixed(2)}</span>
                </div>
                <Button 
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
            <DialogDescription>
              Escolha seu método de pagamento para baixar seus packs instantaneamente.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pix" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="pix">PIX</TabsTrigger>
              <TabsTrigger value="card">Cartão de Crédito</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pix" className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                <div className="w-32 h-32 bg-white p-2 rounded-lg mb-4">
                  {/* Visual placeholder for QR Code */}
                  <div className="w-full h-full bg-black pattern-grid-lg" />
                </div>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Escaneie o QR Code com o app do seu banco para pagar instantaneamente.
                </p>
                <div className="text-xl font-bold text-secondary mb-4">R$ {total.toFixed(2)}</div>
                <Button 
                  onClick={() => handlePayment('pix')} 
                  className="w-full bg-secondary text-black hover:bg-secondary/80"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Processando..." : "Já paguei"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="card" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Número do Cartão</Label>
                <Input placeholder="0000 0000 0000 0000" className="bg-white/5 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Input placeholder="MM/YY" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input placeholder="123" className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome no Cartão</Label>
                <Input placeholder="NOME COMPLETO" className="bg-white/5 border-white/10" />
              </div>
              
              <Button 
                onClick={() => handlePayment('credit_card')} 
                className="w-full mt-4 bg-primary hover:bg-primary/80"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Processando..." : `Pagar R$ ${total.toFixed(2)}`}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
