import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Music2, Disc3, Upload, Link as LinkIcon } from "lucide-react";
import { usePacks } from "@/hooks/usePacks";
import { toast } from "sonner";

interface AddTrackModalProps {
  packId: string;
  djId: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackAdded: () => void;
}

export default function AddTrackModal({
  packId,
  djId,
  isOpen,
  onClose,
  onTrackAdded,
}: AddTrackModalProps) {
  const { addTrack, loading } = usePacks();
  const [mode, setMode] = useState<"file" | "link">("file");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    fileUrl: "",
    bpm: "",
    genre: "",
    is_preview: false,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Selecione um arquivo de áudio válido");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      // 500MB limit
      toast.error("Arquivo muito grande (máximo 500MB)");
      return;
    }

    setAudioFile(file);
    if (!formData.name) {
      setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, "") });
    }
  };

  const uploadToR2 = async (file: File): Promise<{ url: string; r2Key: string } | null> => {
    try {
      setIsUploading(true);
      const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

      if (!r2PublicUrl) {
        throw new Error("R2 não configurado");
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}.mp3`;
      const r2Key = `${djId}/${fileName}`;

      // Upload para R2 via Cloudflare Workers API
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
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Digite o nome da track");
      return;
    }

    let fileUrl: string;
    let r2Key: string | null = null;

    if (mode === "file") {
      if (!audioFile) {
        toast.error("Selecione um arquivo de áudio");
        return;
      }

      // Upload arquivo para R2
      const uploadResult = await uploadToR2(audioFile);
      if (!uploadResult) {
        return;
      }

      fileUrl = uploadResult.url;
      r2Key = uploadResult.r2Key;
    } else {
      if (!formData.fileUrl.trim()) {
        toast.error("Cole o URL da música");
        return;
      }

      fileUrl = formData.fileUrl.trim();
    }

    // Registrar track no Supabase
    const track = await addTrack(packId, djId, {
      name: formData.name,
      file_url: fileUrl,
      r2_key: r2Key || undefined,
      bpm: formData.bpm ? parseInt(formData.bpm) : undefined,
      genre: formData.genre || undefined,
      is_preview: formData.is_preview,
    });

    if (track) {
      setAudioFile(null);
      setFormData({
        name: "",
        fileUrl: "",
        bpm: "",
        genre: "",
        is_preview: false,
      });
      setUploadProgress(0);
      onTrackAdded();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-border/50 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Adicionar Track</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2 bg-background rounded-lg p-1 border border-border">
            <button
              type="button"
              onClick={() => {
                setMode("file");
                setFormData({ ...formData, fileUrl: "" });
              }}
              className={`flex-1 py-2 px-3 rounded transition text-sm font-medium flex items-center justify-center gap-1 ${
                mode === "file"
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
                setMode("link");
                setAudioFile(null);
              }}
              className={`flex-1 py-2 px-3 rounded transition text-sm font-medium flex items-center justify-center gap-1 ${
                mode === "link"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Link
            </button>
          </div>

          {/* File Upload Option */}
          {mode === "file" && (
            <div className="space-y-2">
              <Label htmlFor="audioFile">Arquivo de Áudio *</Label>
              {!audioFile ? (
                <label htmlFor="audioFile" className="block">
                  <input
                    id="audioFile"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
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
          {mode === "link" && (
            <div className="space-y-2">
              <Label htmlFor="musicLink">Link da Música *</Label>
              <Input
                id="musicLink"
                type="url"
                placeholder="https://exemplo.com/musica.mp3"
                value={formData.fileUrl}
                onChange={(e) =>
                  setFormData({ ...formData, fileUrl: e.target.value })
                }
                required={mode === "link"}
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
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
              value={formData.bpm}
              onChange={(e) =>
                setFormData({ ...formData, bpm: e.target.value })
              }
            />
          </div>

          {/* Genre */}
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

          {/* Preview Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="isPreview"
              type="checkbox"
              checked={formData.is_preview}
              onChange={(e) =>
                setFormData({ ...formData, is_preview: e.target.checked })
              }
              className="rounded border-border"
            />
            <Label htmlFor="isPreview" className="cursor-pointer">
              Esta é uma prévia (30 segundos)
            </Label>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                (mode === "file" && !audioFile) ||
                (mode === "link" && !formData.fileUrl.trim()) ||
                !formData.name.trim() ||
                loading ||
                isUploading
              }
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              {loading || isUploading ? (
                <Disc3 className="h-4 w-4 animate-spin" />
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
