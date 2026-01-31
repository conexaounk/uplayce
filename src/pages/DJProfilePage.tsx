import { useDJ } from "@/hooks/use-djs";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";

export default function DJProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: djProfile, isLoading } = useDJ(id || "");

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!djProfile) {
    return (
      <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
        <Card className="bg-card border-white/10 shadow-2xl">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">Artista não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatarUrl = getStorageUrl(djProfile.avatar_url, "avatars") || "/placeholder.svg";

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
                {djProfile.dj_name || "Artista"}
              </CardTitle>
              {djProfile.city && (
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin size={16} />
                  {djProfile.city}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className="pt-8 overflow-hidden"
          style={{
            border: "1px solid rgba(144, 19, 254, 0.06)",
          }}
        >
          {djProfile.bio ? (
            <div>
              <h3 className="text-lg font-semibold mb-3">Bio</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{djProfile.bio}</p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              Este artista não adicionou uma bio ainda.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full mt-6"
        style={{
          backgroundColor: "rgba(164, 36, 255, 0.01)",
          boxShadow: "1px 1px 0 0 rgba(0, 0, 0, 1)",
        }}
      >
        Ver Packs
      </Button>
    </div>
  );
}
