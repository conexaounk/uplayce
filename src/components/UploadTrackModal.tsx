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
  // aceita valores vindos de inputs como string e converte para number
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

  // Observa mudanças de tipo e preço para atualizar a UI condicional
  const trackType = form.watch("track_type");
  const priceCents = form.watch("price_cents");

  // Preço do Mashup vindo do D1 (em reais)
  const [mashupPrice, setMashupPrice] = useState<number>(15);

  useEffect(() => {
    // Busca o preço do D1 quando o modal abrir
    if (!open) return;
    fetch('https://api.conexaounk.com/settings')
      .then((res) => res.json())
      .then((data) => {
        try {
          const raw = data?.settings?.mashup_unit_price;
          if (raw !== undefined && raw !== null) {
            // Suporta tanto valor em centavos (ex: 1500) quanto string '15.00'
            const num = Number(raw);
            if (!isNaN(num)) {
              // Se o número parecer grande (>100), assumimos que veio em centavos
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
      price_cents: data.track_type === "mashup" ? Math.round(mashupPrice * 100) : (data.price_cents !== undefined && data.price_cents !== null ? Number(data.price_cents) : undefined),
      ...(data.collaborations && data.collaborations.trim() !== "" && { 
        collaborations: data.collaborations.trim() 
      }),
      bpm: data.bpm ? Number(data.bpm) : undefined,
      ...(data.key && data.key.trim() !== "" && { 
        key: data.key 
      }),
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

      console.log("✅ Upload concluído:", result);
      
      toast.success("Música enviada com sucesso!");
      setFile(null);
      setUploadProgress(0);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Erro no upload:", error);
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
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-white/10 w-[95vw] sm:w-[90vw] md:w-full p-3 sm:p-4 md:p-6 overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold">
            Gerenciar Músicas
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Faça upload de uma nova produção ou adicione da biblioteca global.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-muted/20 h-9 sm:h-10">
            <TabsTrigger value="upload" className="text-xs sm:text-sm">
              Novo Upload
            </TabsTrigger>
            <TabsTrigger value="browse" className="text-xs sm:text-sm">
              Banco Global
            </TabsTrigger>
          </TabsList>

          {/* ================= UPLOAD ================= */}
          <TabsContent value="upload" className="space-y-4 mt-3 sm:mt-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {!file ? (
                <div
                  onClick={() => document.getElementById("audio-input")?.click()}
                  className="border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 text-center cursor-pointer border-white/10 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                >
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => e.target.files && processFile(e.target.files[0])}
                  />
                  <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1">
                    Clique para selecionar
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    MP3, WAV, AIFF (500MB máx)
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-3 p-3 sm:p-4 border border-primary/20 bg-primary/5 rounded-lg">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Music className="text-primary w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFile(null)}
                      type="button"
                      disabled={uploadMutation.isPending}
                      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Barra de progresso */}
                  {uploadMutation.isPending && uploadProgress > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Enviando...</span>
                        <span>{uploadProgress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Título */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">
                      Título da Faixa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Toca Toca"
                      {...form.register("title")}
                      disabled={uploadMutation.isPending}
                      className="bg-muted/30 text-xs sm:text-sm h-9 sm:h-10"
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  {/* Gênero */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">
                      Gênero <span className="text-red-500">*</span>
                    </Label>
                    <select
                      {...form.register("genre")}
                      disabled={uploadMutation.isPending}
                      className="w-full h-9 sm:h-10 bg-muted/30 border border-input rounded-md px-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {form.formState.errors.genre && (
                      <p className="text-red-500 text-xs">{form.formState.errors.genre.message}</p>
                    )}

                    <div className="space-y-1.5 mt-2">
                      <Label className="text-xs sm:text-sm font-medium">Tipo de Produção</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button
                          type="button"
                          variant={trackType === "mashup" ? "default" : "outline"}
                          onClick={() => form.setValue("track_type", "mashup")}
                          className="h-9 text-xs"
                        >
                          Mashup (Preço Fixo)
                        </Button>
                        <Button
                          type="button"
                          variant={trackType === "remix" ? "default" : "outline"}
                          onClick={() => form.setValue("track_type", "remix")}
                          className="h-9 text-xs"
                        >
                          Remix (Preço Livre)
                        </Button>
                      </div>
                      {form.formState.errors.track_type && (
                        <p className="text-red-500 text-xs">{form.formState.errors.track_type.message}</p>
                      )}

                      {/* Lógica de preço condicional */}
                      <div className="p-4 rounded-lg border border-white/10 bg-muted/20 mt-3">
                        {trackType === "mashup" ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold uppercase text-primary">Preço Tabelado</p>
                              <p className="text-sm text-muted-foreground italic">Incluso no Pack de 10</p>
                            </div>
                            <div className="text-xl font-black">R$ {mashupPrice.toFixed(2).replace('.', ',')}</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase">Valor do Remix (R$)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="pl-9 bg-background"
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
                            <p className="text-[10px] text-muted-foreground">
                              *Remixes individuais não entram no pacote promocional de Mashups.
                            </p>
                          </div>
                        )}
                      </div>
                    </div> 
                  </div>

                  {/* BPM e Key - OPCIONAIS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        BPM <span className="text-muted-foreground text-xs">(opcional)</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 128"
                        {...form.register("bpm")}
                        disabled={uploadMutation.isPending}
                        className="bg-muted/30 text-xs sm:text-sm h-9 sm:h-10"
                        min="1"
                        max="300"
                      />
                      {form.formState.errors.bpm && (
                        <p className="text-red-500 text-xs">{form.formState.errors.bpm.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        Key <span className="text-muted-foreground text-xs">(opcional)</span>
                      </Label>
                      <select
                        {...form.register("key")}
                        disabled={uploadMutation.isPending}
                        className="w-full h-9 sm:h-10 bg-muted/30 border border-input rounded-md px-3 text-xs sm:text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        {KEYS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium">
                        Preço (centavos) <span className="text-muted-foreground text-xs">(opcional)</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 0"
                        {...form.register("price_cents", { valueAsNumber: true })}
                        disabled={uploadMutation.isPending}
                        className="bg-muted/30 text-xs sm:text-sm h-9 sm:h-10"
                        min="0"
                      />
                      {form.formState.errors.price_cents && (
                        <p className="text-red-500 text-xs">{form.formState.errors.price_cents.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Colaborações */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">
                      Colaborações (Feat) <span className="text-muted-foreground text-xs">(opcional)</span>
                    </Label>
                    <Input
                      placeholder="Ex: MC Fulano, DJ Ciclano"
                      {...form.register("collaborations")}
                      disabled={uploadMutation.isPending}
                      className="bg-muted/30 text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Botão de envio */}
                  <Button
                    type="submit"
                    disabled={uploadMutation.isPending}
                    className="w-full h-10 sm:h-11 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 mt-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        <span>
                          Enviando {uploadProgress > 0 ? `${uploadProgress.toFixed(0)}%` : '...'}
                        </span>
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
          <TabsContent value="browse" className="space-y-3 mt-3 sm:mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-muted/30 h-9 sm:h-10 text-xs sm:text-sm"
                placeholder="Buscar por título, artista ou gênero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {tracksLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {tracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {searchQuery 
                        ? "Nenhuma música encontrada com esse termo." 
                        : "Nenhuma música disponível no momento."}
                    </p>
                  </div>
                ) : (
                  tracks.map((track: any) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border border-white/5 rounded-lg bg-card/50 hover:border-primary/30 hover:bg-card/70 transition-all"
                    >
                      <div className="flex gap-2 sm:gap-3 items-center overflow-hidden flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Music className="text-primary w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {track.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {track.artist}
                            {track.collaborations && (
                              <span className="text-primary/70"> feat. {track.collaborations}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              {track.genre}
                            </span>
                            {track.bpm && (
                              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-0.5">
                                <Activity className="w-2.5 h-2.5" />
                                {track.bpm} BPM
                              </span>
                            )}
                            {track.key && (
                              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex items-center gap-0.5">
                                <Hash className="w-2.5 h-2.5" />
                                {track.key}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                        disabled={addTrackToProfileMutation.isPending}
                        onClick={() => handleSelectTrack(track.id)}
                        title="Adicionar ao seu perfil"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
