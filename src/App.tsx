import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CartSidebar } from "@/components/CartSidebar";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";

// Pages
import HomePage from "@/pages/HomePage";
import DJsPage from "@/pages/DJsPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";
function Navbar() {
  const {
    setIsOpen,
    items
  } = useCart();
  const {
    user,
    logout
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const navLinks = [{
    href: "/",
    label: "Marketplace"
  }, {
    href: "/djs",
    label: "Artists"
  }];
  return <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 h-16">
      <div className="container max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-black">
              ​
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
              U<span className="text-primary">​PLAYCE</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => <Link key={link.href} href={link.href}>
              <span className={`text-sm font-medium cursor-pointer transition-colors ${location === link.href ? "text-white" : "text-muted-foreground hover:text-white"}`}>
                {link.label}
              </span>
            </Link>)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hover:bg-white/10" onClick={() => setIsOpen(true)}>
            <ShoppingBag size={20} />
            {items.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full border border-black" />}
          </Button>

          {user ? <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 hover:bg-white/10">
                  <User size={16} />
                  <span>{user.email?.split("@")[0]}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="hover:text-destructive">
                <LogOut size={18} />
              </Button>
            </div> : <Button size="sm" onClick={() => setLocation("/login")} className="bg-primary hover:bg-primary/90 text-white hidden sm:flex">
              Sign In
            </Button>}

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-l border-white/10 pt-10">
              <div className="flex flex-col gap-4">
                {navLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-lg font-bold block py-2 border-b border-white/5">{link.label}</span>
                  </Link>)}
                {user && <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-lg font-bold block py-2 border-b border-white/5">My Profile</span>
                  </Link>}
                {!user && <Button onClick={() => {
                  setLocation("/login");
                  setMobileMenuOpen(false);
                }} className="mt-4">
                    Sign In
                  </Button>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>;
}
function Router() {
  return <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/djs" component={DJsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>;
}

function AuthRedirect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const previousUserRef = useRef<typeof user>(null);

  useEffect(() => {
    // Se o usuário estava deslogado e agora está logado, redireciona para /profile
    if (!previousUserRef.current && user) {
      setLocation("/profile");
    }
    previousUserRef.current = user;
  }, [user, setLocation]);

  return null;
}
function App() {
  return <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <AuthRedirect />
          <div className="bg-background min-h-screen text-foreground font-body">
            <Navbar />
            <Router />
            <CartSidebar />
            <Toaster />
          </div>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>;
}
export default App;
