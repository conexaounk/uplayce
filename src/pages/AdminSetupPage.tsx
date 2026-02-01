import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-notification";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminSetupPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const handleAddAdminRole = async () => {
    if (!userId.trim()) {
      toast.error("Erro", "Digite o ID do usuário");
      return;
    }

    setLoading(true);
    try {
      // Obter sessão para autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você deve estar autenticado');
      }

      // Inserir na tabela user_roles
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) {
        if (error.code === "23505") {
          toast.error("Erro", "Este usuário já possui um role atribuído");
        } else {
          throw error;
        }
      } else {
        toast.success("Sucesso", `Usuário ${userId} agora é admin!`);
        setUserId("");
      }
    } catch (error: any) {
      toast.error("Erro", error?.message || "Erro ao adicionar role de admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <Card className="p-6 bg-card/50 border-white/10">
          <h2 className="text-xl font-bold mb-4">Setup de Admin</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                ID do usuário atualmente logado:
              </p>
              <p className="font-mono text-sm break-all bg-background/50 p-2 rounded">
                {user?.id || "Não autenticado"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Adicionar role 'admin' a um usuário:
              </p>
              <Input
                placeholder="Cole o UUID do usuário aqui"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
                className="bg-background/50 border-white/10 font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleAddAdminRole}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Adicionar Role Admin
            </Button>

            {user?.id && (
              <Button
                onClick={() => setUserId(user.id)}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Usar ID do usuário atual
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
