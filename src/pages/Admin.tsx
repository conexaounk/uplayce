import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Disc3,
  ArrowLeft,
  Settings,
  Users,
  CreditCard,
  Smartphone,
  Building,
  Save,
  Shield,
} from "lucide-react";
import logoImage from "@/assets/logo.png";

interface CompanySettings {
  id: string;
  whatsapp_number: string | null;
  instagram_url: string | null;
  dominio_encurtado: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dominio, setDominio] = useState("");

  // Payment settings (mock for now)
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (userRole !== null && userRole !== "admin") {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setWhatsapp(data.whatsapp_number || "");
        setInstagram(data.instagram_url || "");
        setDominio(data.dominio_encurtado || "");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from("company_settings")
          .update({
            whatsapp_number: whatsapp,
            instagram_url: instagram,
            dominio_encurtado: dominio,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("company_settings").insert({
          whatsapp_number: whatsapp,
          instagram_url: instagram,
          dominio_encurtado: dominio,
        });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas! ✅",
        description: "As alterações foram aplicadas.",
      });

      fetchSettings();
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingSettings || (userRole !== "admin" && userRole !== null)) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Uplay" className="w-8 h-8 rounded-lg" />
              <span className="font-bold neon-text">Admin Panel</span>
              <Shield className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Company Settings */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Configurações da Empresa</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/uplay"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dominio">Domínio Encurtado</Label>
                <Input
                  id="dominio"
                  value={dominio}
                  onChange={(e) => setDominio(e.target.value)}
                  placeholder="uplay.link"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-secondary" />
              <h2 className="text-xl font-bold">Configurações de Pagamento</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="email@exemplo.com ou CPF/CNPJ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Banco
                </Label>
                <Input
                  id="bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Nome do Banco"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              ⚠️ Integração com gateway de pagamento em desenvolvimento.
            </p>
          </div>

          {/* DJ Management */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Gerenciar DJs</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              Lista de DJs cadastrados na plataforma.
            </p>

            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Gerenciamento de DJs em desenvolvimento
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              {saving ? (
                <Disc3 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Todas as Configurações
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
