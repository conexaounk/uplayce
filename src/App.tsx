import { Switch, Route, Link, useLocation } from "wouter";
import { PackProvider } from "@/context/packContext";
import { FloatingFolder } from "@/components/FloatingFolder";
import { CreatePackModal } from "@/components/CreatePackModal";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CartSidebar } from "@/components/CartSidebar";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, LogOut, Menu, Home, Search, Music, Settings, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";

// Pages
import HomePage from "@/pages/HomePage";
import DJsPage from "@/pages/DJsPage";
import DJProfilePage from "@/pages/DJProfilePage";
import ProfileViewPage from "@/pages/ProfileViewPage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/AdminPage";

function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/djs", icon: Search, label: "Artists" },
    { href: "#library", icon: Music, label: "Library" },
    { href: "#settings", icon: Settings, label: "Settings" },
  ];

  if (!user) return null;

  return (
    <aside className="fixed left-5 top-[76px] bottom-5 w-[95px] hidden md:flex flex-col items-center py-6 glass-panel rounded-[40px] z-50 border border-white/10">
      <nav className="flex-1 flex flex-col gap-8 w-full items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div className="relative w-full flex justify-center group cursor-pointer">
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-purple-500 rounded-r-full shadow-[0_0_10px_#a855f7]"></div>
                )}
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                  isActive
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-white/5 group-hover:bg-white/10"
                }`}>
                  <Icon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 hover:text-white transition-colors cursor-pointer group">
          <Bell className="w-5 h-5" />
        </div>
      </div>
    </aside>
  );
}

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
  const [createPackOpen, setCreatePackOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const navLinks = [{
    href: "/",
    label: "Home"
  }, {
    href: "/djs",
    label: "Artists"
  }];
  return <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 h-16 backdrop-blur-md bg-black/20">
      <div className="container max-w-7xl mx-auto px-6 h-full flex items-center justify-between ml-[110px] md:ml-0">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block text-white">
              U<span className="text-accent-purple">PLAYCE</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 flex-1 ml-12">
          {navLinks.slice(0, 1).map(link => <Link key={link.href} href={link.href}>
              <span className={`text-sm font-medium cursor-pointer transition-colors ${location === link.href ? "text-white" : "text-gray-400 hover:text-white"}`}>
                {link.label}
              </span>
            </Link>)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hover:bg-white/10" onClick={() => setIsOpen(true)}>
            <ShoppingBag size={20} />
            {items.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-pink rounded-full border border-black" />}
          </Button>

          {user ? <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 hover:bg-white/10">
                  <User size={16} />
                  <span>{user.email?.split("@")[0]}</span>
                </Button>
              </Link>

              <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => setCreatePackOpen(true)}>
                Criar Pack
              </Button>

              <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="hover:text-destructive">
                <LogOut size={18} />
              </Button>
            </div> : <Button size="sm" onClick={() => setLocation("/login")} className="bg-accent-purple hover:bg-purple-600 text-white hidden sm:flex">
              <p>login</p>
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
      <CreatePackModal open={createPackOpen} onOpenChange={setCreatePackOpen} />
    </nav>;
}
function Router() {
  return <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/djs" component={DJsPage} />
      <Route path="/djs/:id" component={DJProfilePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile/edit" component={ProfileEditPage} />
      <Route path="/profile" component={ProfileViewPage} />
      {/* Nova Rota de Admin */}
      <Route path="/admin" component={AdminPage} />
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
  const { user } = useAuth();

  return <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <CartProvider>
          <PackProvider>
            <TooltipProvider>
              <AuthRedirect />
              <div className="min-h-screen text-foreground font-body flex flex-col overflow-x-hidden">
                <Sidebar />
                <Navbar />
                <div className={`flex-1 pt-16 overflow-hidden px-4 transition-all ${user ? 'md:ml-[110px]' : 'pb-6'}`}>
                  <Router />
                </div>
                <CartSidebar />
                <NotificationCenter />
                <FloatingFolder />
              </div>
            </TooltipProvider>
          </PackProvider>
        </CartProvider>
      </NotificationProvider>
    </QueryClientProvider>;
}
export default App;
