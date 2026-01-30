import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Disc3, Upload, Image as ImageIcon, Music2, Link as LinkIcon, Plus } from "lucide-react";
import { usePacks } from "@/hooks/usePacks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPackModalProps {
  djId: string;
  isOpen: boolean;
  onClose: () => void;
  onPackCreated: () => void;
}

export default function AddPackModal({
  djId,
  isOpen,
  onClose,
  onPackCreated,
}: AddPackModalProps) {
  const { createPack, addTrack, loading } = usePacks();
  
  // Pack creation state
  const [isFree, setIsFree] = useState(true);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    genre: "",
    download_link: "",
  });

  // Music upload state
  const [createdPackId, setCreatedPackId] = useState<string | null>(null);
  const [musicMode, setMusicMode] = useState<"file" | "link">("file");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicFormData, setMusicFormData] = useState({
    name: "",
    fileUrl: "",
    bpm: "",
    genre: "",
    is_preview: false,
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida (JPG, PNG, etc)");
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMusicFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de áudio válido");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 500MB)");
      return;
    }

    setAudioFile(file);
    if (!musicFormData.name) {
      setMusicFormData({ ...musicFormData, name: file.name.replace(/\.[^/.]+$/, "") });
    }
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return null;

    try {
      setIsUploadingCover(true);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}.jpg`;
      const filePath = `${djId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("pack-covers")
        .upload(filePath, coverFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("pack-covers")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro no upload da capa";
      toast.error(message);
      return null;
    } finally {
      setIsUploadingCover(false);
    }
  };

  const uploadMusicToR2 = async (file: File): Promise<{ url: string; r2Key: string } | null> => {
    try {
      setIsUploadingMusic(true);
      const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

      if (!r2PublicUrl) {
        throw new Error("R2 não configurado");
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}.mp3`;
      const r2Key = `${djId}/${fileName}`;

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://api.conexaounk.com"}/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro no upload");
      }

      const result = await response.json();
      const publicUrl = result.publicUrl || `${r2PublicUrl}/${fileName}`;

      return { url: publicUrl, r2Key };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro no upload";
      toast.error(message);
      return null;
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Digite o nome do pack");
      return;
    }

    let coverUrl: string | undefined = undefined;

    if (coverFile) {
      coverUrl = await uploadCover() || undefined;
      if (!coverUrl && coverFile) {
        toast.error("Erro ao fazer upload da capa");
        return;
      }
    }

    const pack = await createPack(djId, {
      name: formData.name,
      description: formData.description || undefined,
      price: isFree ? 0 : formData.price,
      is_free: isFree,
      genre: formData.genre || undefined,
      cover_url: coverUrl,
      download_link: formData.download_link || undefined,
    });

    if (pack) {
      setCreatedPackId(pack.id);
      toast.success("Pack criado! Agora adicione suas músicas.");
    }
  };

  const handleMusicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdPackId) {
      toast.error("Pack não foi criado");
      return;
    }

    if (!musicFormData.name.trim()) {
      toast.error("Digite o nome da track");
      return;
    }

    let fileUrl: string;
    let r2Key: string | null = null;

    if (musicMode === "file") {
      if (!audioFile) {
        toast.error("Selecione um arquivo de áudio");
        return;
      }

      const uploadResult = await uploadMusicToR2(audioFile);
      if (!uploadResult) {
        return;
      }

      fileUrl = uploadResult.url;
      r2Key = uploadResult.r2Key;
    } else {
      if (!musicFormData.fileUrl.trim()) {
        toast.error("Cole o URL da música");
        return;
      }

      fileUrl = musicFormData.fileUrl.trim();
    }

    const track = await addTrack(createdPackId, djId, {
      name: musicFormData.name,
      file_url: fileUrl,
      r2_key: r2Key || undefined,
      bpm: musicFormData.bpm ? parseInt(musicFormData.bpm) : undefined,
      genre: musicFormData.genre || undefined,
      is_preview: musicFormData.is_preview,
    });

    if (track) {
      setAudioFile(null);
      setMusicFormData({
        name: "",
        fileUrl: "",
        bpm: "",
        genre: "",
        is_preview: false,
      });
      toast.success("Música adicionada!");
    }
  };

  const handleFinish = () => {
    setCreatedPackId(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      genre: "",
      download_link: "",
    });
    setCoverFile(null);
    setCoverPreview(null);
    setIsFree(true);
    onPackCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-border/50 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {createdPackId ? "Adicionar Músicas" : "Novo Pack"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!createdPackId ? (
          // PACK CREATION FORM
          <form onSubmit={handlePackSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packName">Nome do Pack *</Label>
              <Input
                id="packName"
                type="text"
                placeholder="ex: Summer Vibes 2024"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packDesc">Descrição</Label>
              <Textarea
                id="packDesc"
                placeholder="Descreva o pack..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Gênero</Label>
              <select
                id="genre"
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um gênero</option>
                <option value="tribal-house">Tribal House</option>
                <option value="psytrance">PsyTrance</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="house">House</option>
                <option value="techno">Techno</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="jazz">Jazz</option>
                <option value="funk">Funk</option>
                <option value="reggae">Reggae</option>
                <option value="samba">Samba</option>
                <option value="forró">Forró</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Capa do Pack</Label>
              {!coverPreview ? (
                <label htmlFor="coverInput" className="block">
                  <input
                    id="coverInput"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition">
                    <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique para selecionar imagem</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG ou PNG</p>
                  </div>
                </label>
              ) : (
                <div className="space-y-2">
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                  >
                    Trocar imagem
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Pack</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                    isFree
                      ? "bg-primary text-white"
                      : "bg-background border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  Grátis
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                    !isFree
                      ? "bg-primary text-white"
                      : "bg-background border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  Pago
                </button>
              </div>
            </div>

            {!isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="downloadLink">Link de Download</Label>
              <Input
                id="downloadLink"
                type="url"
                placeholder="https://drive.google.com/... ou outro link"
                value={formData.download_link}
                onChange={(e) =>
                  setFormData({ ...formData, download_link: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Link para downloads (Google Drive, Dropbox, etc)
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading || isUploadingCover}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!formData.name.trim() || loading || isUploadingCover}
                className="flex-1 bg-gradient-to-r from-primary to-secondary"
              >
                {loading || isUploadingCover ? (
                  <Disc3 className="h-4 w-4 animate-spin" />
                ) : (
                  "Próximo"
                )}
              </Button>
            </div>
          </form>
        ) : (
          // MUSIC UPLOAD FORM
          <form onSubmit={handleMusicSubmit} className="space-y-4">
            {/* Mode Selector */}
            <div className="flex gap-2 bg-background rounded-lg p-1 border border-border">
              <button
                type="button"
                onClick={() => {
                  setMusicMode("file");
                  setMusicFormData({ ...musicFormData, fileUrl: "" });
                }}
                className={`flex-1 py-2 px-3 rounded transition text-sm font-medium flex items-center justify-center gap-1 ${
                  musicMode === "file"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setMusicMode("link");
                  setAudioFile(null);
                }}
                className={`flex-1 py-2 px-3 rounded transition text-sm font-medium flex items-center justify-center gap-1 ${
                  musicMode === "link"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Link
              </button>
            </div>

            {/* File Upload Option */}
            {musicMode === "file" && (
              <div className="space-y-2">
                <Label htmlFor="audioFile">Arquivo de Áudio</Label>
                {!audioFile ? (
                  <label htmlFor="audioFile" className="block">
                    <input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicFileSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Clique ou arraste um arquivo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo 500MB
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Music2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAudioFile(null)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Link Option */}
            {musicMode === "link" && (
              <div className="space-y-2">
                <Label htmlFor="musicLink">Link da Música</Label>
                <Input
                  id="musicLink"
                  type="url"
                  placeholder="https://exemplo.com/musica.mp3"
                  value={musicFormData.fileUrl}
                  onChange={(e) =>
                    setMusicFormData({ ...musicFormData, fileUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL completa da música (HTTP ou HTTPS)
                </p>
              </div>
            )}

            {/* Track Name */}
            <div className="space-y-2">
              <Label htmlFor="trackName">Nome da Track *</Label>
              <Input
                id="trackName"
                type="text"
                placeholder="ex: Summer Vibes"
                value={musicFormData.name}
                onChange={(e) =>
                  setMusicFormData({ ...musicFormData, name: e.target.value })
                }
                required
              />
            </div>

            {/* BPM */}
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="ex: 128"
                value={musicFormData.bpm}
                onChange={(e) =>
                  setMusicFormData({ ...musicFormData, bpm: e.target.value })
                }
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="musicGenre">Gênero</Label>
              <select
                id="musicGenre"
                value={musicFormData.genre}
                onChange={(e) =>
                  setMusicFormData({ ...musicFormData, genre: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um gênero</option>
                <option value="tribal-house">Tribal House</option>
                <option value="psytrance">PsyTrance</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="house">House</option>
                <option value="techno">Techno</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="jazz">Jazz</option>
                <option value="funk">Funk</option>
                <option value="reggae">Reggae</option>
                <option value="samba">Samba</option>
                <option value="forró">Forró</option>
              </select>
            </div>

            {/* Preview Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="isPreview"
                type="checkbox"
                checked={musicFormData.is_preview}
                onChange={(e) =>
                  setMusicFormData({ ...musicFormData, is_preview: e.target.checked })
                }
                className="rounded border-border"
              />
              <Label htmlFor="isPreview" className="cursor-pointer">
                Esta é uma prévia (30 segundos)
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleFinish}
                className="flex-1"
                disabled={loading || isUploadingMusic}
              >
                Finalizar
              </Button>
              <Button
                type="submit"
                disabled={
                  (musicMode === "file" && !audioFile) ||
                  (musicMode === "link" && !musicFormData.fileUrl.trim()) ||
                  !musicFormData.name.trim() ||
                  loading ||
                  isUploadingMusic
                }
                className="flex-1 bg-gradient-to-r from-primary to-secondary"
              >
                {loading || isUploadingMusic ? (
                  <Disc3 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Adicionar Música
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
