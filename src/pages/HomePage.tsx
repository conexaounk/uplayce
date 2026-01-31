import { useState } from "react";
import { usePacks } from "@/hooks/use-packs";
import { useDJs } from "@/hooks/use-djs";
import { PackCard } from "@/components/PackCard";
import { DJCard } from "@/components/DJCard";
import { PackDetailsModal } from "@/components/PackDetailsModal";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PackWithTracks } from "@/types/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: packs,
    isLoading: packsLoading
  } = usePacks({
    search: searchTerm
  });
  const {
    data: djs,
    isLoading: djsLoading
  } = useDJs();
  const [selectedPack, setSelectedPack] = useState<PackWithTracks | null>(null);
  const {
    user,
    login
  } = useAuth();
  return <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
          <div className="absolute inset-0 bg-[url('https://pixabay.com/get/g2444942c81653b30670596223c8773febd2882639dc97a2be3832e754ac9738f4810cc140379e5ad24c3710b581ef344ebcdecaded7f9e1e198f21db25596a26_1280.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          x: -50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.8
        }} className="max-w-2xl">
            <h1 className="text-6xl font-black tracking-tighter text-white mb-6 leading-none md:text-5xl">
              ​TRACKS <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">DJs UNK</span> <br />
              EXCLUSIVAS
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
               Packs, tracks não lançadas e stems direto dos DJs UNK   
            </p>

            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar gêneros, artistas ou packs..." className="pl-12 h-14 rounded-full bg-white/10 border-white/10 text-lg backdrop-blur-md focus:ring-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {!user}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-16 space-y-20">
        {/* Latest Packs */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold font-display flex items-center gap-2">
              <span className="w-2 h-8 bg-secondary rounded-full block" />
              Últimos Lançamentos
            </h2>
            <div className="flex gap-2 text-sm font-mono text-muted-foreground">
              <span>{packs?.length || 0} RESULTADOS</span>
            </div>
          </div>

          {packsLoading ? <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {packs?.map(pack => <PackCard key={pack.id} pack={pack} onClick={() => setSelectedPack(pack)} />)}
              {packs?.length === 0 && <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                  Nenhum pack encontrado para sua busca.
                </div>}
            </div>}
        </section>

        {/* Top DJs */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold font-display flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full block" />
              Artistas em Destaque
            </h2>
          </div>

          {djsLoading ? <div className="h-24 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {djs?.slice(0, 6).map(dj => <DJCard key={dj.id} dj={dj} />)}
            </div>}
        </section>
      </div>

      <PackDetailsModal pack={selectedPack} isOpen={!!selectedPack} onClose={() => setSelectedPack(null)} />
    </div>;
}