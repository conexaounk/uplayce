import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label"; // Adicionei Label para ficar mais bonito

import {
  Upload,
  Music,
  X,
  Loader2,
  Search,
  Plus,
} from "lucide-react";

import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useDJ } from "@/hooks/use-djs";
import { useMusicApi } from "@/hooks/use-music-api";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const GENRES = [
  "Tribal House",
  "PsyTrance",
  "Hip-Hop",
  "House",
  "Techno",
  "Funk",
  "Outro",
];

const metadataSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  genre: z.string().min(1, "Gênero é obrigatório"),
  collaborations: z.string().optional(),
});

type MetadataForm = z.infer<typeof metadataSchema>;

interface UploadTrackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadTrackModal({
  open,
  onOpenChange,
}: UploadTrackModalProps) {
  const { user } = useAuth();
  const { data: djProfile } = useDJ(user?.id || "");
  
  // 1. AJUSTE AQUI: Pegamos as funções do hook
  const { uploadMutation, useTracks, addToLibraryMutation } = useMusicApi();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");

  // 2. AJUSTE AQUI: Chamamos o hook useTracks passando a busca
  // Passamos undefined no primeiro argumento (userId) para buscar no banco geral
  const { data: tracksData, isLoading: tracksLoading } = useTracks(undefined, searchQuery);
  const tracks = Array.isArray(tracksData) ? tracksData : [];

  const form = useForm<MetadataForm>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      genre: "",
      collaborations: "",
    },
  });

  function processFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande (máx. 500MB)");
      return;
    }
    setFile(file);
    // Tenta preencher o título automaticamente baseado no nome do arquivo
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    if (!form.getValues("title")) {
        form.setValue("title", fileName);
    }
  }

  async function onSubmit(data: MetadataForm) {
    if (!file || !user || !djProfile) return;

    const mainArtist = djProfile.dj_name;
    // Lógica para montar o display artist para players antigos
    const feat = data.collaborations
      ? ` (feat. ${data.collaborations})`
      : "";
    const displayArtist = `${mainArtist}${feat}`;

    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: {
          title: data.title,
          artist: mainArtist,
          display_artist: displayArtist,
          genre: data.genre,
          collaborations: data.collaborations, // Salvando o campo separado
          userId: user.id,
        },
        onProgress: setUploadProgress,
      });

      // Sucesso
      setFile(null);
      form.reset();
      onOpenChange(false);
    } catch {
      // Erro é tratado no hook, mas podemos deixar seguro aqui
    }
  }

  function handleSelectTrack(trackId: string) {
    addToLibraryMutation.mutate(trackId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-fit bg-card border-white/10 w-[95vw] sm:w-full md:max-w-2xl p-4 sm:p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold">Gerenciar Músicas</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Faça upload de uma nova produção ou adicione da biblioteca global.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="grid w-full grid-cols-2 bg-muted/20">
            <TabsTrigger value="upload">Novo Upload</TabsTrigger>
            <TabsTrigger value="browse">Banco Global</TabsTrigger>
          </TabsList>

          {/* ================= UPLOAD ================= */}
          <TabsContent value="upload" className="space-y-6 mt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!file ? (
                <div
                  onClick={() =>
                    document.getElementById("audio-input")?.click()
                  }
                  className="border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer border-white/10 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                >
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files && processFile(e.target.files[0])
                    }
                  />
                  <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1">Clique para selecionar</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Suporta MP3, WAV, AIFF (até 500MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Music className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setFile(null)}
                    type="button"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Título da Faixa</Label>
                    <Input
                      placeholder="Ex: Toca Toca"
                      {...form.register("title")}
                      className="bg-muted/30 text-xs h-8"
                    />
                    {form.formState.errors.title && (
                        <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Gênero</Label>
                        <select
                            {...form.register("genre")}
                            className="w-full h-8 bg-muted/30 border border-input rounded-md px-2 text-xs focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Selecione...</option>
                            {GENRES.map((g) => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                            ))}
                        </select>
                         {form.formState.errors.genre && (
                            <p className="text-red-500 text-xs">{form.formState.errors.genre.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Colaborações (Feat)</Label>
                        <Input
                            placeholder="Ex: MC Fulano"
                            {...form.register("collaborations")}
                            className="bg-muted/30 text-xs h-8"
                        />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={uploadMutation.isPending}
                    className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/90"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1 animate-spin" size={14} />
                        <span className="hidden sm:inline">Enviando...</span>
                      </>
                    ) : (
                      "Publicar Música"
                    )}
                  </Button>
                </motion.div>
              )}
            </form>
          </TabsContent>

          {/* ================= BROWSE ================= */}
          <TabsContent value="browse" className="space-y-4 mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-muted/30 h-10 text-sm"
                placeholder="Buscar musica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {tracksLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {tracks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma música encontrada.</p>
                ) : (
                    tracks.map((track: any) => (
                    <div
                        key={track.id}
                        className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-card/50 hover:border-primary/30 transition-colors"
                    >
                        <div className="flex gap-3 items-center overflow-hidden">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Music className="text-primary w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {track.artist}
                                {track.collaborations && <span className="text-primary/70"> feat. {track.collaborations}</span>}
                            </p>
                        </div>
                        </div>
                        <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary"
                        disabled={addToLibraryMutation.isPending}
                        onClick={() => handleSelectTrack(track.id)}
                        >
                        <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
