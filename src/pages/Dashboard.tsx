import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Disc3,
  LogOut,
  Upload,
  Music,
  User,
  Instagram,
  Youtube,
  Link as LinkIcon,
  Save,
  ArrowLeft,
  Home,
} from "lucide-react";
import logoImage from "@/assets/logo.png";

interface DJProfile {
  id: string;
  dj_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  background_url: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut, userRole } = useAuth();

  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  // Form state
  const [djName, setDjName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Reset success message after 5 seconds
  useEffect(() => {
    if (savedSuccessfully) {
      const timer = setTimeout(() => setSavedSuccessfully(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [savedSuccessfully]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Supabase Error fetching profile:", error);
        throw new Error(error.message || "Erro ao carregar perfil");
      }

      if (data) {
        console.log("Profile loaded:", data);
        setProfile(data);
        setDjName(data.dj_name || "");
        setBio(data.bio || "");
        setCity(data.city || "");
        setAvatarUrl(data.avatar_url || "");
        setBackgroundUrl(data.background_url || "");
      } else {
        console.log("No profile data found, creating a new one");
        setProfile(null);
        setDjName("");
        setBio("");
        setCity("");
        setAvatarUrl("");
        setBackgroundUrl("");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate required fields
    if (!djName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome Artístico é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          dj_name: djName.trim(),
          bio: bio.trim(),
          city: city.trim(),
          avatar_url: avatarUrl.trim(),
          background_url: backgroundUrl.trim(),
        });

      if (error) {
        console.error("Supabase save error:", error);
        throw new Error(error.message || "Erro ao salvar perfil");
      }

      // Refetch the profile to ensure UI is in sync
      await fetchProfile();

      setSavedSuccessfully(true);
      toast({
        title: "Perfil salvo! ✅",
        description: "Suas alterações foram salvas com sucesso.",
      });
    } catch (err: any) {
      console.error("Error in handleSaveProfile:", err);
      toast({
        title: "Erro ao salvar",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Uplay" className="w-8 h-8 rounded-lg" />
              <span className="font-bold neon-text">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Profile Section */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Meu Perfil</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="djName">Nome Artístico *</Label>
                <Input
                  id="djName"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder="DJ Seu Nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo, SP"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">URL do Avatar</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">URL da Imagem de Fundo</Label>
                <Input
                  id="background"
                  value={backgroundUrl}
                  onChange={(e) => setBackgroundUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-primary to-secondary"
              >
                {saving ? (
                  <Disc3 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Perfil
              </Button>
            </div>
          </div>

          {/* Music Upload Section */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Music className="h-6 w-6 text-secondary" />
              <h2 className="text-xl font-bold">Minhas Músicas</h2>
            </div>

            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Funcionalidade de upload em desenvolvimento
              </p>
              <Button variant="outline" disabled>
                Em breve
              </Button>
            </div>
          </div>

          {/* Links Section */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <LinkIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Meus Links</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                <Instagram className="h-5 w-5 text-pink-500" />
                <Input placeholder="Instagram URL" className="flex-1" />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
                <Youtube className="h-5 w-5 text-red-500" />
                <Input placeholder="YouTube URL" className="flex-1" />
              </div>
            </div>

            <div className="mt-4">
              <Button variant="outline" className="w-full gap-2">
                <LinkIcon className="h-4 w-4" />
                Adicionar Link
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
