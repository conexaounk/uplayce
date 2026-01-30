import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Music2, Link as LinkIcon, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Track {
  id: string;
  name: string;
  artist: string | null;
  genre: string | null;
  audio_url?: string;
}

interface DownloadLinkValue {
  type: "external" | "uplay" | "upload";
  value: string; // URL ou Track ID
  fileName?: string; // Para upload
}

interface DownloadLinkSelectorProps {
  value: DownloadLinkValue | null;
  onChange: (value: DownloadLinkValue | null) => void;
  djId: string;
}

export default function DownloadLinkSelector({
  value,
  onChange,
  djId,
}: DownloadLinkSelectorProps) {
  const [externalLink, setExternalLink] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [uplayTracks, setUplayTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const activeTab = value?.type || "external";

  // Fetch Uplay tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      setLoadingTracks(true);
      try {
        const { data, error } = await supabase
          .from("tracks")
          .select("id, name, artist, genre, audio_url")
          .eq("user_id", djId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUplayTracks(data || []);
      } catch (error) {
        console.error("Erro ao buscar tracks:", error);
      } finally {
        setLoadingTracks(false);
      }
    };

    fetchTracks();
  }, [djId]);

  const handleExternalLinkChange = () => {
    if (externalLink.trim()) {
      onChange({
        type: "external",
        value: externalLink,
      });
    } else {
      onChange(null);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    onChange({
      type: "uplay",
      value: track.id,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadedFile(file);
    setIsUploadingFile(true);

    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}.mp3`;
      const filePath = `${djId}/pack-downloads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("music-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("music-files")
        .getPublicUrl(filePath);

      onChange({
        type: "upload",
        value: data.publicUrl,
        fileName: file.name,
      });

      toast.success("Arquivo carregado com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro no upload";
      toast.error(message);
      setUploadedFile(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Link de Download</Label>
      <Tabs value={activeTab} onValueChange={() => {}}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="external"
            onClick={() => {
              setExternalLink("");
              setSelectedTrack(null);
              setUploadedFile(null);
              onChange(null);
            }}
            className="gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Link Externo
          </TabsTrigger>
          <TabsTrigger
            value="uplay"
            onClick={() => {
              setExternalLink("");
              setUploadedFile(null);
              onChange(null);
            }}
            className="gap-2"
          >
            <Music2 className="w-4 h-4" />
            Uplay
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            onClick={() => {
              setExternalLink("");
              setSelectedTrack(null);
              onChange(null);
            }}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* External Link Tab */}
        <TabsContent value="external" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole o link do Google Drive, Dropbox ou outro serviço
          </p>
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              onBlur={handleExternalLinkChange}
              className="bg-background"
            />
          </div>
          {externalLink && (
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-sm">
              ✓ Link externo configurado
            </div>
          )}
        </TabsContent>

        {/* Uplay Tracks Tab */}
        <TabsContent value="uplay" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Selecione uma música que você já publicou na Uplay
          </p>
          {loadingTracks ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Carregando músicas...</p>
            </div>
          ) : uplayTracks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Você não tem músicas publicadas na Uplay ainda
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uplayTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedTrack?.id === track.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Music2 className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.name}</p>
                      {track.artist && (
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist}
                        </p>
                      )}
                      {track.genre && (
                        <p className="text-xs text-primary">{track.genre}</p>
                      )}
                    </div>
                    {selectedTrack?.id === track.id && (
                      <div className="text-primary text-sm">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedTrack && (
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-sm">
              ✓ Música configurada: {selectedTrack.name}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Faça upload direto do arquivo de áudio (até 500MB)
          </p>
          {!uploadedFile ? (
            <label className="block">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={isUploadingFile}
                className="hidden"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {isUploadingFile ? "Carregando..." : "Clique para selecionar áudio"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP3, WAV, OGG, M4A até 500MB
                </p>
              </div>
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Music2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null);
                    onChange(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadedFile(null);
                  onChange(null);
                }}
              >
                Trocar arquivo
              </Button>
            </div>
          )}
          {uploadedFile && (
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-sm">
              ✓ Arquivo carregado com sucesso
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
