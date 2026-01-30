import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { SearchFilters } from "@/components/SearchFilters";
import { DJGrid } from "@/components/DJGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useDJs } from "@/hooks/useDJs";
import { Pack, CartItem } from "@/types";
import { toast } from "@/hooks/use-toast";

type Page = "home";

const Index = () => {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");

  const { djs, loading } = useDJs(searchQuery);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);


  // Cart item IDs for quick lookup
  const cartItemIds = useMemo(() => cartItems.map((item) => item.pack.id), [cartItems]);

  // Handlers
  const handleDJClick = (djName: string) => {
    navigate(`/dj/${encodeURIComponent(djName)}`);
  };

  const handleAddToCart = (pack: Pack, djName: string) => {
    if (cartItemIds.includes(pack.id)) {
      toast({
        title: "Pack já no carrinho",
        description: "Este pack já foi adicionado ao seu carrinho.",
        variant: "destructive",
      });
      return;
    }

    setCartItems((prev) => [
      ...prev,
      { pack, djName, quantity: 1 },
    ]);

    toast({
      title: "Adicionado ao carrinho! 🎉",
      description: `${pack.name} foi adicionado ao seu carrinho.`,
    });
  };

  const handleRemoveFromCart = (packId: string) => {
    setCartItems((prev) => prev.filter((item) => item.pack.id !== packId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleConfirmCheckout = () => {
    setIsCheckoutOpen(false);
    setCartItems([]);
    toast({
      title: "Compra realizada! 🎧",
      description: "Seus packs estão disponíveis para download.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemsCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        onLogoClick={() => navigate("/")}
      />

      <>
        <HeroSection />
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
        />
        {searchQuery && (
          <DJGrid
            djs={filteredDJs}
            onDJClick={handleDJClick}
          />
        )}
      </>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onConfirm={handleConfirmCheckout}
      />

    </div>
  );
};

export default Index;
