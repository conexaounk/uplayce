import { ShoppingCart, Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onLogoClick: () => void;
}

export function Header({ cartItemsCount, onCartClick, onLogoClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={logoImage} alt="Uplay Logo" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-xl font-bold neon-text">Uplay</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={onLogoClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorar
          </button>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Gêneros
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            DJs
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login DJ</span>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center font-medium animate-scale-in">
                {cartItemsCount}
              </span>
            )}
          </Button>

          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-border/50 animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <button 
              onClick={() => {
                onLogoClick();
                setMobileMenuOpen(false);
              }}
              className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Explorar
            </button>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              Gêneros
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
              DJs
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
