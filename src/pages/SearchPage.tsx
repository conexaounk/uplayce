import { useState } from "react";
import { useDJs } from "@/hooks/use-djs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: djs } = useDJs();

  const filteredDJs = djs?.filter(dj =>
    dj.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dj.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dj.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-black text-white mt-[13px]">Buscar DJs</h1>
        <p className="text-gray-400">Encontre seus artistas favoritos na plataforma</p>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por nome, cidade ou bio..."
            className="pl-12 h-12 rounded-lg bg-white/10 border-white/20 text-base placeholder:text-gray-400 focus:ring-accent-purple"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDJs.length > 0 ? (
          filteredDJs.map((dj) => (
            <motion.div
              key={dj.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/djs/${dj.id}`}>
                <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-accent-purple/50 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer group">
                  {/* Avatar */}
                  {dj.avatar_url && (
                    <div className="mb-4 overflow-hidden rounded-xl">
                      <img
                        src={dj.avatar_url}
                        alt={dj.artist_name}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Name */}
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {dj.artist_name}
                  </h3>

                  {/* City */}
                  {dj.city && (
                    <p className="text-sm text-gray-400 mb-3">📍 {dj.city}</p>
                  )}

                  {/* Bio */}
                  {dj.bio && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                      {dj.bio}
                    </p>
                  )}

                  {/* Links */}
                  <div className="flex gap-2 flex-wrap">
                    {dj.instagram_url && (
                      <a
                        href={dj.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-accent-purple/20 text-gray-300 hover:text-white transition"
                        onClick={e => e.stopPropagation()}
                      >
                        Instagram
                      </a>
                    )}
                    {dj.youtube_url && (
                      <a
                        href={dj.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-accent-purple/20 text-gray-300 hover:text-white transition"
                        onClick={e => e.stopPropagation()}
                      >
                        YouTube
                      </a>
                    )}
                    {dj.tiktok_url && (
                      <a
                        href={dj.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-accent-purple/20 text-gray-300 hover:text-white transition"
                        onClick={e => e.stopPropagation()}
                      >
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <p className="text-gray-400 text-lg">
              {searchTerm ? "Nenhum DJ encontrado para sua busca" : "Digite algo para buscar DJs"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
