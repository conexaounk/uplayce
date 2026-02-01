import { useState } from "react";
import { usePacks } from "@/hooks/use-packs";
import { useDJs } from "@/hooks/use-djs";
import { PackCard } from "@/components/PackCard";
import { DJCard } from "@/components/DJCard";
import { PackDetailsModal } from "@/components/PackDetailsModal";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Play, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { PackWithTracks } from "@/types/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: packs,
    isLoading: packsLoading,
    error: packsError
  } = usePacks({
    search: searchTerm
  });
  const {
    data: djs,
    isLoading: djsLoading,
    error: djsError
  } = useDJs();
  const [selectedPack, setSelectedPack] = useState<PackWithTracks | null>(null);
  const {
    user,
    login
  } = useAuth();

  // Filtrar DJs que têm packs/tracks
  const djsWithTracks = djs?.filter(dj => {
    // Procura se existe algum pack que pertence a este DJ
    return packs?.some(pack => pack.dj_id === dj.id);
  }) ?? [];

  return <div className={`h-full overflow-hidden flex flex-col ${user ? 'lg:flex-row' : 'flex-col'} gap-8 p-6`}>
    {/* Main Content */}
    <div className={`${user ? 'flex-1 lg:col-span-8' : 'w-full'} overflow-y-auto scrollbar-hide pb-32 space-y-10 pr-2`}>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center overflow-hidden glass-panel rounded-3xl border border-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/20 to-accent-blue/20" />
          <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay bg-[url('/lovable-uploads/ae781f05-9686-49ca-8aef-db5575a7283a.png')]" />
        </div>

        <div className="relative z-10 px-8 max-w-2xl">
          <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8
          }}>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 leading-tight">
              TRACKS <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-blue">DJs UNK</span>
            </h1>
            <p className="text-gray-300 mb-6 text-lg">
              Packs, tracks exclusivas e stems direto dos DJs UNK
            </p>

            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar packs..."
                className="pl-12 h-12 rounded-full bg-white/10 border-white/20 text-base placeholder:text-gray-400 focus:ring-accent-purple"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Packs Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Últimos Lançamentos</h2>
          <div className="flex items-center gap-3">
            <Button className="px-6 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 text-sm font-medium transition">
              <Play size={16} /> <span>Tocar Tudo</span>
            </Button>
          </div>
        </div>

        {packsError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-red-300">
          <p className="font-semibold">Erro ao carregar packs:</p>
          <p className="text-sm">{packsError.message}</p>
        </div>}

        {packsLoading ? <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent-purple w-10 h-10" />
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs?.map(pack => <PackCard key={pack.id} pack={pack} onClick={() => setSelectedPack(pack)} />)}
          {packs?.length === 0 && <div className="col-span-full text-center py-20 text-gray-400 border border-dashed border-white/10 rounded-xl">
            Nenhum pack encontrado para sua busca.
          </div>}
        </div>}
      </section>

      {/* Top DJs Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Users size={24} /> Artistas em Destaque
        </h2>
        {djsLoading || packsLoading ? <div className="h-40 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent-purple w-10 h-10" />
        </div> : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {djsWithTracks.slice(0, 8).map(dj => <DJCard key={dj.id} dj={dj} />)}
          {djsWithTracks.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">
            Nenhum artista com tracks disponível no momento.
          </div>}
        </div>}
      </section>
    </div>

    {/* Right Sidebar - Apenas para usuários logados */}
    {user && (
      <div className="hidden lg:flex lg:w-80 flex-col gap-6 overflow-y-auto scrollbar-hide pb-32 pr-2">
        {/* Artists to Follow Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-lg">Artistas para Seguir</h3>
            <a href="/djs" className="text-xs text-accent-purple hover:text-accent-purple/80">Ver Todos</a>
          </div>
          <div className="space-y-4">
            {djsWithTracks.slice(0, 3).map((dj) => (
              <div key={dj.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  {dj.avatar_url && (
                    <img src={dj.avatar_url} alt={dj.name} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{dj.name}</p>
                    <p className="text-xs text-gray-400">{dj.followers || 0} Seguidores</p>
                  </div>
                </div>
                <button className="border border-white/20 rounded-full px-4 py-1 text-xs text-white hover:bg-white hover:text-black transition">
                  Seguir
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <h3 className="font-bold text-white text-lg mb-4">Tendências</h3>
          <div className="space-y-3">
            {["Deep House", "Techno", "House", "Trance", "Drum & Bass"].map((genre, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-accent-purple transition">{genre}</p>
                  <p className="text-xs text-gray-400">1.2K packs</p>
                </div>
                <Play size={16} className="text-gray-400 group-hover:text-accent-purple transition" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <PackDetailsModal pack={selectedPack} isOpen={!!selectedPack} onClose={() => setSelectedPack(null)} />
  </div>;
}
