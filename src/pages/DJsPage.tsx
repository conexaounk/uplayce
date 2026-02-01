import { useDJs } from "@/hooks/use-djs";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Music } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";

export default function DJsPage() {
  const { data: djs = [], isLoading } = useDJs();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter mb-3 flex items-center gap-3">
          <Music className="text-primary" size={40} />
          Artistas
        </h1>
        <p className="text-lg text-muted-foreground">
          Descubra os melhores DJs e suas músicas exclusivas
        </p>
      </div>

      {/* Grid de DJs */}
      {djs.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground text-lg">Nenhum artista encontrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {djs.map((dj) => {
            const avatarUrl = getStorageUrl(dj.avatar_url, "avatars") || "/placeholder.svg";

            return (
              <Card
                key={dj.id}
                className="bg-card/50 backdrop-blur border-white/10 rounded-3xl overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                onClick={() => setLocation(`/djs/${dj.id}`)}
              >
                {/* Avatar Section */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
                  <img
                    src={avatarUrl}
                    alt={dj.dj_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Content Section */}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-1 truncate group-hover:text-primary transition-colors">
                    {dj.dj_name || "DJ"}
                  </h3>

                  {dj.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                      <MapPin size={14} className="text-primary flex-shrink-0" />
                      <span className="truncate">{dj.city}</span>
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                    {dj.bio || "Artista talentoso na plataforma UNK"}
                  </p>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/djs/${dj.id}`);
                    }}
                  >
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
