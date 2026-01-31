import { useAuth } from "@/hooks/use-auth";
import { useDJ } from "@/hooks/use-djs";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";

export default function ProfileViewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const [, setLocation] = useLocation();

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const avatarUrl = getStorageUrl(myProfile?.avatar_url, "avatars") || "/placeholder.svg";

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
      <Card
        className="bg-card overflow-hidden"
        style={{
          borderRadius: "28px",
          boxShadow: "0 0 5px 0 rgba(95, 49, 143, 0.77)",
          border: "1px solid rgba(107, 30, 161, 0.85)",
        }}
      >
        <CardHeader
          className="pb-8 overflow-hidden"
          style={{
            borderRadius: "1px",
            border: "1px solid rgba(144, 19, 254, 0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="object-cover block"
                  style={{
                    width: "105%",
                    height: "104%",
                    margin: "0 20px 14px 1px",
                  }}
                />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  {myProfile?.dj_name || "Meu Perfil"}
                </CardTitle>
                {myProfile?.city && (
                  <p className="text-muted-foreground mb-2">{myProfile.city}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setLocation("/profile/edit")}
              size="lg"
              className="pl-2.5"
              style={{
                backgroundColor: "rgba(164, 36, 255, 0.01)",
                boxShadow: "1px 1px 0 0 rgba(0, 0, 0, 1)",
              }}
            >
              <Edit size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent
          className="pt-8 overflow-hidden"
          style={{
            border: "1px solid rgba(144, 19, 254, 0.06)",
          }}
        >
          {myProfile?.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Bio</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{myProfile.bio}</p>
            </div>
          )}
          {!myProfile?.bio && (
            <p className="text-muted-foreground italic">
              Nenhuma bio adicionada. Clique em "Editar Perfil" para adicionar uma.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
