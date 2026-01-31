import { useDJs } from "@/hooks/use-djs";
import { DJCard } from "@/components/DJCard";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Profile } from "@/types/supabase";

export default function DJsPage() {
  const { data: djs, isLoading } = useDJs();

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-black font-display mb-4 text-glow">Todos os Artistas</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubra os produtores moldando o som do amanhã. Explore perfis, ouça previews e baixe packs exclusivos.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {djs?.map((dj: Profile) => (
            <DJCard key={dj.id} dj={dj} />
          ))}
          {djs?.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              Nenhum artista cadastrado ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
