import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { SearchFilters } from "@/components/SearchFilters";
import { DJGrid } from "@/components/DJGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { PackDetailsModal } from "@/components/PackDetailsModal";
import { useDJs } from "@/hooks/useDJs";
import { Pack, CartItem } from "@/types";
import { toast } from "@/hooks/use-toast";

type Page = "home";

const Index = () => {
  const navigate = useNavigate();
  const { djs, loading } = useDJs();
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);

  // Filter DJs by search query
  const filteredDJs = useMemo(() => {
    return djs.filter((dj) => {
      const matchesSearch = dj.dj_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [djs, searchQuery]);

  // Cart item IDs for quick lookup
  const cartItemIds = useMemo(() => cartItems.map((item) => item.pack.id), [cartItems]);

  // Handlers
  const handleDJClick = (djName: string) => {
    navigate(`/dj/${encodeURIComponent(djName)}`);
  };

  const handlePackClick = (pack: Pack) => {
    setSelectedPack(pack);
    setIsPackModalOpen(true);
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
        onLogoClick={handleBackToHome}
      />

      {currentPage === "home" ? (
        <>
          <HeroSection />
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
          />
          <DJGrid 
            djs={filteredDJs} 
            onDJClick={handleDJClick} 
          />
        </>
      ) : selectedDJ ? (
        <DJProfilePage
          dj={selectedDJ}
          onBack={handleBackToHome}
          onPackClick={handlePackClick}
          onAddToCart={(pack) => handleAddToCart(pack, selectedDJ.name)}
          cartItems={cartItemIds}
        />
      ) : null}

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

      {/* Pack Details Modal */}
      <PackDetailsModal
        pack={selectedPack}
        djName={selectedDJ?.name || ""}
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        onAddToCart={() => {
          if (selectedPack && selectedDJ) {
            handleAddToCart(selectedPack, selectedDJ.name);
          }
        }}
        isInCart={selectedPack ? cartItemIds.includes(selectedPack.id) : false}
      />
    </div>
  );
};

export default Index;
