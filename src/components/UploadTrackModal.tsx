import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";

import {
  Upload,
  Music,
  X,
  Loader2,
  Search,
  Plus,
  Activity,
  Hash,
  Sparkles,
  ChevronDown,
  Check,
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

const KEYS = [
  "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B",
  "7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"
];

const metadataSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  genre: z.string().min(1, "Gênero é obrigatório"),
  track_type: z.enum(["mashup", "remix"]),
  price_cents: z.coerce.number().optional(),
  collaborations: z.string().optional(),
  bpm: z.string()
    .optional()
    .refine(
      (val) => !val || val === "" || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 300),
      "BPM deve ser entre 1 e 300"
    ),
  key: z.string().optional(),
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
  
  const { uploadMutation, useTracks, addTrackToProfileMutation } = useMusicApi();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tracks = [], isLoading: tracksLoading } = useTracks(undefined, searchQuery);

  const form = useForm<MetadataForm>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      genre: "",
      track_type: "mashup",
      price_cents: undefined,
      collaborations: "",
      bpm: "",
      key: "",
    },
  });

  const trackType = form.watch("track_type");
  const priceCents = form.watch("price_cents");

  const [mashupPrice, setMashupPrice] = useState<number>(15);

  useEffect(() => {
    if (!open) return;
    fetch('https://api.conexaounk.com/settings')
      .then((res) => res.json())
      .then((data) => {
        try {
          const raw = data?.settings?.mashup_unit_price;
          if (raw !== undefined && raw !== null) {
            const num = Number(raw);
            if (!isNaN(num)) {
              const value = num > 100 ? (num / 100) : num;
              setMashupPrice(value);
            }
          }
        } catch (e) {
          console.warn('Erro ao processar settings:', e);
        }
      })
      .catch((e) => {
        console.warn('Erro ao buscar settings:', e);
      });
  }, [open]);

  function processFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande (máx. 500MB)");
      return;
    }
    setFile(file);
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    if (!form.getValues("title")) {
      form.setValue("title", fileName);
    }
  }

  async function onSubmit(data: MetadataForm) {
    if (!file || !user || !djProfile) {
      toast.error("Informações incompletas para upload");
      return;
    }

    const mainArtist = djProfile.dj_name;
    
    const metadata = {
      title: data.title,
      artist: mainArtist,
      genre: data.genre,
      track_type: data.track_type,
      user_id: user.id,
      price_cents: data.track_type === "mashup" 
        ? Math.round(mashupPrice * 100) 
        : (data.price_cents ?? 0),
      collaborations: data.collaborations?.trim() || null,
      bpm: data.bpm && data.bpm.trim() ? Number(data.bpm) : null,
      key: (data.key && data.key.trim()) ? data.key.trim() : null,
      is_public: false,
    };

    console.log("📤 Iniciando upload:", {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      metadata
    });

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        metadata,
        onProgress: (progress) => {
          console.log(`📊 Progresso: ${progress}%`);
          setUploadProgress(progress);
        },
      });

      console.log("✅ Upload e salvamento no D1 concluído:", result);
      
      toast.success("Música publicada e salva no banco!");
      setFile(null);
      setUploadProgress(0);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Erro ao processar upload ou salvar no banco:", error);
      toast.error("Erro ao processar upload ou salvar no banco");
      setUploadProgress(0);
    }
  }

  function handleSelectTrack(trackId: string) {
    addTrackToProfileMutation.mutate(trackId, {
      onSuccess: () => {
        toast.success("Música adicionada ao seu perfil!");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Erro ao adicionar música");
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFile(null);
      setUploadProgress(0);
      form.reset();
      setSearchQuery("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[70vw] max-w-5xl max-h-[95vh] glass-effect rounded-2xl p-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border-b border-white/10 p-6 sm:p-8 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <DialogTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Gerenciar Músicas
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-2">
              Compartilhe suas produções com o mundo ou explore a biblioteca global
            </DialogDescription>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/10 h-12 sm:h-14 rounded-none mx-0 p-0 flex-shrink-0">
            <TabsTrigger value="upload" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm font-medium transition-all">
              <Upload className="w-4 h-4 mr-2" />
              Novo Upload
            </TabsTrigger>
            <TabsTrigger value="browse" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm font-medium transition-all">
              <Search className="w-4 h-4 mr-2" />
              Banco Global
            </TabsTrigger>
          </TabsList>

          {/* ================= UPLOAD ================= */}
          <TabsContent value="upload" className="flex-1 overflow-y-auto p-6 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!file ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => document.getElementById("audio-input")?.click()}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-white/20 p-8 sm:p-12 md:p-16 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 glass-effect-subtle"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => e.target.files && processFile(e.target.files[0])}
                  />
                  <div className="relative z-10">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all"
                    >
                      <Upload className="w-8 sm:w-10 h-8 sm:h-10 text-primary group-hover:text-secondary transition-colors" />
                    </motion.div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      Solte sua faixa aqui
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      MP3, WAV, AIFF • até 500MB
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Card do arquivo */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 sm:p-5 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <Music className="relative z-10 text-primary w-7 h-7 sm:w-8 sm:h-8 drop-shadow-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base truncate text-foreground">{file.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFile(null)}
                        type="button"
                        disabled={uploadMutation.isPending}
                        className="hover:bg-destructive/10 hover:text-destructive h-10 w-10 p-0 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Barra de progresso */}
                    {uploadMutation.isPending && uploadProgress > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">Enviando...</span>
                          <span className="text-xs font-bold text-primary">{uploadProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Formulário */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Título */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Título da Faixa 
                        <span className="text-destructive text-base">*</span>
                      </Label>
                      <Input
                        placeholder="Ex: Toca Toca"
                        {...form.register("title")}
                        disabled={uploadMutation.isPending}
                        className="h-11 sm:h-12 text-sm font-medium bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                      />
                      {form.formState.errors.title && (
                        <p className="text-destructive text-xs font-medium flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                          {form.formState.errors.title.message}
                        </p>
                      )}
                    </div>

                    {/* Gênero com select customizado */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Gênero Musical
                        <span className="text-destructive text-base">*</span>
                      </Label>
                      <div className="relative">
                        <select
                          {...form.register("genre")}
                          disabled={uploadMutation.isPending}
                          className="h-11 sm:h-12 w-full px-4 pr-10 text-sm font-medium bg-white/5 border border-white/10 rounded-lg focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                          <option value="" className="bg-background">Selecione um gênero...</option>
                          {GENRES.map((g) => (
                            <option key={g} value={g} className="bg-background">{g}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                      </div>
                      {form.formState.errors.genre && (
                        <p className="text-destructive text-xs font-medium flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                          {form.formState.errors.genre.message}
                        </p>
                      )}
                    </div>

                    {/* Tipo de Produção */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Tipo de Produção</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => form.setValue("track_type", "mashup")}
                          className={`relative h-12 sm:h-14 rounded-xl font-bold text-sm transition-all overflow-hidden ${
                            trackType === "mashup"
                              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 border-2 border-primary/50"
                              : "bg-white/5 text-muted-foreground border-2 border-white/10 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Music className="w-4 h-4" />
                            <span>Mashup</span>
                            {trackType === "mashup" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                              >
                                <Check className="w-3 h-3" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => form.setValue("track_type", "remix")}
                          className={`relative h-12 sm:h-14 rounded-xl font-bold text-sm transition-all overflow-hidden ${
                            trackType === "remix"
                              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 border-2 border-primary/50"
                              : "bg-white/5 text-muted-foreground border-2 border-white/10 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Remix</span>
                            {trackType === "remix" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                              >
                                <Check className="w-3 h-3" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      </div>
                    </div>

                    {/* Card de Preço */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 backdrop-blur-sm"
                    >
                      {trackType === "mashup" ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              Preço Tabelado
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Definido pela plataforma
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              R$ {mashupPrice.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            Valor do Remix
                            <span className="text-xs font-normal text-muted-foreground">(preço livre)</span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="19,90"
                              className="pl-12 h-11 sm:h-12 text-sm font-medium bg-white/5 border-white/10 focus:border-primary/50"
                              value={priceCents !== undefined && priceCents !== null ? (priceCents / 100) : ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                const n = Number(v);
                                if (isNaN(n)) {
                                  form.setValue("price_cents", undefined);
                                } else {
                                  form.setValue("price_cents", Math.round(n * 100));
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* BPM e Key */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-secondary" />
                          BPM
                          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="128"
                          {...form.register("bpm")}
                          disabled={uploadMutation.isPending}
                          className="h-11 sm:h-12 text-sm font-medium bg-white/5 border-white/10 focus:border-primary/50"
                          min="1"
                          max="300"
                        />
                        {form.formState.errors.bpm && (
                          <p className="text-destructive text-xs font-medium">{form.formState.errors.bpm.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <Hash className="w-4 h-4 text-secondary" />
                          Key
                          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                        </Label>
                        <div className="relative">
                          <select
                            {...form.register("key")}
                            disabled={uploadMutation.isPending}
                            className="h-11 sm:h-12 w-full text-sm font-medium bg-white/5 border border-white/10 rounded-lg focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:bg-white/10"
                            style={{ padding: "0 6px 0 11px" }}
                          >
                            <option value="" className="bg-background">Selecione...</option>
                            {KEYS.map((k) => (
                              <option key={k} value={k} className="bg-background">{k}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Colaborações */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Music className="w-4 h-4 text-secondary" />
                        Colaborações (Feat)
                        <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                      </Label>
                      <Input
                        placeholder="MC Fulano, DJ Ciclano..."
                        {...form.register("collaborations")}
                        disabled={uploadMutation.isPending}
                        className="h-11 sm:h-12 text-sm font-medium bg-white/5 border-white/10 focus:border-primary/50"
                      />
                    </div>

                    {/* Botão de envio */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        type="submit"
                        disabled={uploadMutation.isPending}
                        className="w-full text-sm font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/40 transition-all rounded-xl"
                        style={{ gap: "2px", height: "59px", minHeight: "0px" }}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={18} />
                            <span>
                              Enviando {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}%` : '...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Publicar Música
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              )}
            </form>
          </TabsContent>

          {/* ================= BROWSE ================= */}
          <TabsContent value="browse" className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                className="pl-12 h-12 sm:h-14 text-sm font-medium bg-white/5 border-white/10 focus:border-primary/50"
                placeholder="Buscar por título, artista ou gênero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {tracksLoading ? (
              <div className="py-16 flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="text-primary" size={32} />
                </motion.div>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-2">
                {tracks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                      {searchQuery 
                        ? "Nenhuma música encontrada." 
                        : "Nenhuma música disponível."}
                    </p>
                  </motion.div>
                ) : (
                  tracks.map((track: any) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => handleSelectTrack(track.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          <Music className="relative z-10 text-primary w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-bold truncate text-foreground">
                            {track.title}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {track.artist}
                            {track.collaborations && (
                              <span className="text-secondary"> • {track.collaborations}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs px-2.5 py-1 bg-primary/20 text-primary rounded-lg font-semibold border border-primary/30">
                              {track.genre}
                            </span>
                            {track.bpm && (
                              <span className="text-xs px-2 py-1 bg-white/5 text-muted-foreground rounded-lg flex items-center gap-1 border border-white/10">
                                <Activity className="w-3 h-3" />
                                {track.bpm}
                              </span>
                            )}
                            {track.key && (
                              <span className="text-xs px-2 py-1 bg-white/5 text-muted-foreground rounded-lg flex items-center gap-1 border border-white/10">
                                <Hash className="w-3 h-3" />
                                {track.key}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-primary/10 hover:text-primary h-10 w-10 p-0 flex-shrink-0 rounded-lg transition-all"
                          disabled={addTrackToProfileMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTrack(track.id);
                          }}
                          title="Adicionar ao seu perfil"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </motion.div>
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
