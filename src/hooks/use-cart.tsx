import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type CartItem = {
  id: string;
  title: string;
  price: string;
  coverImage: string;
  author: {
    username: string;
  };
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load cart from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dj_marketplace_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("dj_marketplace_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    if (items.some((i) => i.id === item.id)) {
      toast({
        title: "Já no carrinho",
        description: "Este pack já está no seu carrinho.",
        variant: "destructive",
      });
      return;
    }
    setItems([...items, item]);
    setIsOpen(true);
    toast({
      title: "Adicionado ao carrinho",
      description: `${item.title} foi adicionado.`,
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + parseFloat(item.price || "0"), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
