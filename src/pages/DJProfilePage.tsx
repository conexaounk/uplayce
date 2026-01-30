import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePacks, Pack } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disc3, ArrowLeft, Instagram, Youtube, Share2, Edit2, Plus, LogOut, X } from "lucide-react";
import PackCard from "@/components/PackCard";
import AddPackModal from "@/components/AddPackModal";
import AddTrackModal from "@/components/AddTrackModal";
import logoImage from "@/assets/logo.png";

interface DJProfile {
  id: string;
  dj_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  background_url: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  music_links?: string | null;
}

export default function DJProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { djName } = useParams<{ djName: string }>();
  const { getPacks, deletePack } = usePacks();

  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [packsLoading, setPacksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPackModal, setShowAddPackModal] = useState(false);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // Edit form state
  const [editDjName, setEditDjName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBackgroundUrl, setEditBackgroundUrl] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [editMusicLinks, setEditMusicLinks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (djName) {
      fetchProfile();
    }
  }, [djName]);

  const fetchPacks = async (djId: string) => {
    setPacksLoading(true);
    const packsData = await getPacks(djId);
    setPacks(packsData);
    setPacksLoading(false);
  };

  useEffect(() => {
    // Check if this is the logged-in user's profile
    if (user && profile) {
      setIsOwnProfile(user.id === profile.id);
      // Populate edit form with current data
      setEditDjName(profile.dj_name || "");
      setEditBio(profile.bio || "");
      setEditCity(profile.city || "");
      setEditAvatarUrl(profile.avatar_url || "");
      setEditBackgroundUrl(profile.background_url || "");
      setEditInstagramUrl(profile.instagram_url || "");
      setEditYoutubeUrl(profile.youtube_url || "");
      setEditMusicLinks(profile.music_links || "");
      // Load packs
      fetchPacks(profile.id);
    }
  }, [user, profile]);

  const fetchProfile = async () => {
    if (!djName) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("dj_name", djName)
        .maybeSingle();

      if (error) {
        console.error("Error fetching DJ profile:", error);
        setError("Perfil não encontrado");
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        setError("DJ não encontrado");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !editDjName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          dj_name: editDjName.trim(),
          bio: editBio.trim(),
          city: editCity.trim(),
          avatar_url: editAvatarUrl.trim(),
          background_url: editBackgroundUrl.trim(),
          instagram_url: editInstagramUrl.trim(),
          youtube_url: editYoutubeUrl.trim(),
          music_links: editMusicLinks.trim(),
        });

      if (error) throw error;

      // Refetch and close modal
      await fetchProfile();
      setShowEditModal(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">😕</p>
          <h1 className="text-2xl font-bold mb-2">{error || "Perfil não encontrado"}</h1>
          <p className="text-muted-foreground mb-6">Verifique o nome do DJ e tente novamente</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={logoImage} alt="Uplay Logo" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-bold neon-text">Uplay</span>
          </button>

          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        </div>
      </header>

      {/* Profile Background */}
      {profile.background_url && (
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage: `url(${profile.background_url})`,
            height: "448px",
            paddingTop: "81px",
            margin: "3px 0 -1px",
          }}
        />
      )}

      {/* Profile Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="relative max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="glass-card rounded-2xl border border-border/50 relative z-10" style={{margin: "-222px 0 0 -2px", padding: "1px 8px 32px 32px"}}>
            <div className="flex flex-col sm:flex-row gap-6 items-start" style={{paddingTop: "26px"}}>
              {/* Avatar */}
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.dj_name}
                  className="rounded-2xl object-cover flex-shrink-0 border-4 border-primary/20"
                  style={{height: "211px", width: "202px"}}
                />
              )}

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{profile.dj_name}</h1>

                    {profile.city && (
                      <p className="text-lg text-muted-foreground">
                        📍 {profile.city}
                      </p>
                    )}
                  </div>

                  {/* Owner Controls */}
                  {isOwnProfile && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEditModal(true)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSignOut}
                        className="gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Sair</span>
                      </Button>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-base text-muted-foreground leading-relaxed mb-6">
                    {profile.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <></>
                  ) : (
                    <>
                      <Button className="gap-2 bg-gradient-to-r from-primary to-secondary">
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                      </Button>
                      {profile.instagram_url && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(profile.instagram_url, "_blank")}
                        >
                          <Instagram className="h-4 w-4" />
                          <span className="hidden sm:inline">Instagram</span>
                        </Button>
                      )}
                      {profile.youtube_url && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(profile.youtube_url, "_blank")}
                        >
                          <Youtube className="h-4 w-4" />
                          <span className="hidden sm:inline">YouTube</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Packs Section */}
          <div className="glass-card rounded-2xl border border-border/50 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Packs de <span className="neon-text">{profile.dj_name}</span>
              </h2>
              {isOwnProfile && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPackId(null);
                    setShowAddTrackModal(false);
                    setShowAddPackModal(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Pack
                </Button>
              )}
            </div>

            {packsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Disc3 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : packs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {isOwnProfile ? "Crie seu primeiro pack!" : "Nenhum pack disponível ainda"}
                </p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setShowAddPackModal(true)}
                    className="gap-2 bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Pack
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => (
                  <div key={pack.id}>
                    <PackCard
                      pack={pack}
                      isOwner={isOwnProfile}
                      onDelete={async (packId) => {
                        const success = await deletePack(packId);
                        if (success) {
                          setPacks(packs.filter((p) => p.id !== packId));
                        }
                      }}
                      onDownload={(pack) => {
                        // Implementar download later
                        console.log("Download pack:", pack);
                      }}
                    />
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-2"
                        onClick={() => {
                          setSelectedPackId(pack.id);
                          setShowAddTrackModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Track
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl border border-border/50 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Editar Perfil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-background rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editDjName">Nome Artístico</Label>
                <Input
                  id="editDjName"
                  value={editDjName}
                  onChange={(e) => setEditDjName(e.target.value)}
                  placeholder="DJ Seu Nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCity">Cidade</Label>
                <Input
                  id="editCity"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="São Paulo, SP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBio">Bio</Label>
                <Textarea
                  id="editBio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editAvatarUrl">URL do Avatar</Label>
                <Input
                  id="editAvatarUrl"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBackgroundUrl">URL da Imagem de Fundo</Label>
                <Input
                  id="editBackgroundUrl"
                  value={editBackgroundUrl}
                  onChange={(e) => setEditBackgroundUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {isSaving ? (
                    <Disc3 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pack Modal */}
      <AddPackModal
        djId={user?.id || ""}
        isOpen={showAddPackModal}
        onClose={() => setShowAddPackModal(false)}
        onPackCreated={() => {
          if (profile) {
            fetchPacks(profile.id);
          }
        }}
      />

      {/* Add Track Modal */}
      {selectedPackId && (
        <AddTrackModal
          packId={selectedPackId}
          djId={user?.id || ""}
          isOpen={showAddTrackModal}
          onClose={() => {
            setShowAddTrackModal(false);
            setSelectedPackId(null);
          }}
          onTrackAdded={() => {
            if (profile) {
              fetchPacks(profile.id);
            }
          }}
        />
      )}
    </div>
  );
}
