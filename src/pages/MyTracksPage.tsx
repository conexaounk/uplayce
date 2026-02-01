import { useAuth } from "@/hooks/use-auth";
import { usePacks } from "@/hooks/use-packs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Music } from "lucide-react";

export default function MyTracksPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const {
    data: packs,
    isLoading,
    error,
  } = usePacks({
    search: "",
  });

  // Filtrar apenas packs do usuário atual
  const userPacks = packs?.filter(pack => pack.dj_id === user?.id) ?? [];

  // Extrair todas as tracks dos packs do usuário
  const allTracks = userPacks.flatMap(pack => pack.tracks || []);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Por favor, faça login para ver suas tracks</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-black text-white mt-7 ml-1">Minhas Tracks</h1>
        <p className="text-gray-400 mt-4 ml-[5px]">
          Você tem {allTracks.length} track{allTracks.length !== 1 ? "s" : ""} no total
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300">
          <p className="font-semibold">Erro ao carregar tracks:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin">
            <Music className="w-10 h-10 text-accent-purple" />
          </div>
        </div>
      ) : allTracks.length > 0 ? (
        <div className="space-y-4">
          {allTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel p-4 rounded-lg border border-white/10 hover:border-accent-purple/50 transition-all flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate group-hover:text-accent-purple transition">
                  {track.title}
                </h3>
                <p className="text-sm text-gray-400">{track.duration}s</p>
              </div>

              <div className="flex gap-2 ml-4">
                {track.preview_url && (
                  <a
                    href={track.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-accent-purple/20 text-gray-300 hover:text-white transition"
                  >
                    Ouvir
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10"
                >
                  Editar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Você não tem nenhuma track ainda</p>
          <p className="text-gray-500 text-sm mt-2">Comece criando um novo pack com suas tracks</p>
        </div>
      )}
    </div>
  );
}
