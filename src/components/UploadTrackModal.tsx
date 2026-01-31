import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Upload, Music, X, AlertCircle, Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadTrackComplete } from "@/lib/uploadService";
import { useAuth } from "@/hooks/use-auth";
import { useDJ } from "@/hooks/use-djs";
import { useTracks, useUserTracks } from "@/hooks/use-tracks";
import { useAddProfileTrack } from "@/hooks/use-profile-tracks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const metadataSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  genre: z.string().min(1, "Gênero é obrigatório"),
  collaborations: z.string().optional().nullable(),
});

type MetadataForm = z.infer<typeof metadataSchema>;

interface UploadStats {
  loaded: number;
  total: number;
  speed: number;
  timeRemaining: number;
  percentage: number;
}

interface UploadTrackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENRES = [
  "Tribal House",
  "PsyTrance",
  "Hip-Hop",
  "House",
  "Techno",
  "Rock",
  "Pop",
  "Jazz",
  "Electronic",
  "Outro",
];

export function UploadTrackModal({ open, onOpenChange }: UploadTrackModalProps) {
  const { user } = useAuth();
  const { data: djProfile } = useDJ(user?.id || "");
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    loaded: 0,
    total: 0,
    speed: 0,
    timeRemaining: 0,
    percentage: 0,
  });
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);

  // Fetch available tracks for the current user
  const { data: tracks = [], isLoading: tracksLoading } = useUserTracks(user?.id, searchQuery || undefined);

  // Hook para adicionar track ao perfil
  const addProfileTrackMutation = useAddProfileTrack();

  const form = useForm<MetadataForm>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      genre: "",
      collaborations: "",
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + ["Bytes", "KB", "MB", "GB"][i];
  };

  const updateUploadStats = (loaded: number, total: number) => {
    const now = Date.now();
    if (!uploadStartTime) {
      setUploadStartTime(now);
    }

    const startTime = uploadStartTime || now;
    const elapsed = Math.max((now - startTime) / 1000, 0.1);
    const speed = loaded / elapsed;
    const remaining = speed > 0 ? (total - loaded) / speed : 0;
    const percentage = Math.round((loaded / total) * 100);

    setUploadStats({
      loaded,
      total,
      speed,
      timeRemaining: remaining,
      percentage,
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setUploadError(null);

    const allowedExtensions = ["mp3", "wav", "flac", "ogg", "m4a", "aac", "weba", "webm", "aiff"];
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    const isAudioType = selectedFile.type.startsWith("audio/") || selectedFile.type === "";

    if (!isAudioType && !allowedExtensions.includes(fileExtension)) {
      const errorMsg = `Formato não suportado. Use MP3, WAV, FLAC ou AIFF.`;
      toast.error(errorMsg);
      setUploadError(errorMsg);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const errorMsg = `Arquivo muito grande! Máximo ${formatFileSize(MAX_FILE_SIZE)}`;
      toast.error(errorMsg);
      setUploadError(errorMsg);
      return;
    }

    try {
      setFile(selectedFile);

      // Auto-fill title do filename
      const name = selectedFile.name.replace(/\.[^/.]+$/, "");
      form.setValue("title", name);

      toast.success("Áudio carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      const errorMsg = "Erro ao processar arquivo de áudio.";
      toast.error(errorMsg);
      setUploadError(errorMsg);
    }
  };

  const onSubmit = async (data: MetadataForm) => {
    if (!file) {
      toast.error("Selecione um arquivo de áudio");
      return;
    }

    if (!user?.id) {
      toast.error("Você precisa estar logado para fazer upload");
      return;
    }

    if (!djProfile?.dj_name) {
      toast.error("Perfil de DJ não configurado");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStartTime(null);
    setUploadStats({ loaded: 0, total: 0, speed: 0, timeRemaining: 0, percentage: 0 });

    try {
      // Upload using the service
      // Artist is always the DJ that's posting
      await uploadTrackComplete(
        file,
        {
          title: data.title,
          artist: djProfile.dj_name, // Use DJ name as the main artist
          genre: data.genre,
          userId: user.id, // Include user_id for the tracks table
          collaborations: data.collaborations || undefined,
          isPublic: true,
        },
        {
          onProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percentage);
            updateUploadStats(progress.loaded, progress.total);
          },
        }
      );

      toast.success("Track publicada com sucesso!");
      onOpenChange(false);
      setFile(null);
      form.reset();
    } catch (error: any) {
      console.error("Erro no upload:", error);
      const errorMsg = error.message || "Erro desconhecido no upload";
      toast.error("Erro no upload: " + errorMsg);
      setUploadError(errorMsg);
    } finally {
      setIsSubmitting(false);
      setUploadStartTime(null);
    }
  };

  const handleSelectTrack = async (trackId: string) => {
    try {
      await addProfileTrackMutation.mutateAsync(trackId);
      // Toast de sucesso é exibido aqui
      toast.success("Track adicionada ao seu perfil com sucesso!");
      onOpenChange(false);
      setSearchQuery("");
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : "Erro desconhecido ao adicionar track";
      console.error("Erro ao adicionar track:", errorMessage, error);
      // Erro já é exibido pelo toast do mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Música</DialogTitle>
          <DialogDescription>Upload novo ou selecione track já postada</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Novo</TabsTrigger>
            <TabsTrigger value="browse">Buscar Existente</TabsTrigger>
          </TabsList>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                    ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-white/20 hover:bg-white/5"}
                  `}
                >
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="audio-input"
                  />
                  <label htmlFor="audio-input" className="cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 mx-auto shadow-xl hover:scale-110 transition-transform">
                      <Upload
                        className={`w-8 h-8 ${isDragActive ? "text-primary" : "text-zinc-500"}`}
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Arraste e solte sua música</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Suporta MP3, WAV, FLAC, AIFF até 500MB
                    </p>
                  </label>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{file.name}</h4>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* Erro */}
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{uploadError}</p>
                </motion.div>
              )}

              {/* Form Fields */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                          placeholder="Título da Música"
                          className="bg-background/50 border-white/10"
                          {...form.register("title")}
                        />
                        {form.formState.errors.title && (
                          <p className="text-xs text-red-400">{form.formState.errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Artista Principal</label>
                        <div className="h-10 bg-background/50 border border-white/10 rounded-md px-3 flex items-center text-muted-foreground">
                          {djProfile?.dj_name || "Carregando..."}
                        </div>
                        <p className="text-xs text-muted-foreground">Automático: seu nome de DJ</p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Gênero</label>
                        <select
                          {...form.register("genre")}
                          className="w-full h-10 bg-background/50 border border-white/10 rounded-md px-3 outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Selecione o Gênero</option>
                          {GENRES.map((genre) => (
                            <option key={genre} value={genre.toLowerCase()}>
                              {genre}
                            </option>
                          ))}
                        </select>
                        {form.formState.errors.genre && (
                          <p className="text-xs text-red-400">{form.formState.errors.genre.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Colaborações (Opcional)</label>
                        <Input
                          placeholder="Nomes dos artistas colaboradores separados por vírgula"
                          className="bg-background/50 border-white/10"
                          {...form.register("collaborations")}
                        />
                        <p className="text-xs text-muted-foreground">Ex: DJ João, DJ Maria</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        "Publicar Música"
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </TabsContent>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, artista ou gênero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-white/10"
              />
            </div>

            {/* Tracks List */}
            {tracksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma track encontrada</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tracks.map((track) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <Music className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {track.artist && <span>{track.artist}</span>}
                          {track.artist && track.genre && <span>•</span>}
                          <span className="capitalize">{track.genre}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectTrack(track.id)}
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 ml-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Progress Modal */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-card rounded-xl border border-white/10 shadow-2xl p-6"
              >
                <h3 className="text-lg font-semibold mb-4 text-center">Enviando Música</h3>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center border border-white/10">
                      <div className="text-xl font-bold">{uploadProgress}%</div>
                      <div className="text-xs text-muted-foreground">Progresso</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center border border-white/10">
                      <div className="text-xl font-bold">
                        {uploadStats.speed > 0 ? (uploadStats.speed / 1024 / 1024).toFixed(1) : "0.0"}
                      </div>
                      <div className="text-xs text-muted-foreground">MB/s</div>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{(uploadStats.loaded / 1024 / 1024).toFixed(1)} MB</span>
                    <span>{(uploadStats.total / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
