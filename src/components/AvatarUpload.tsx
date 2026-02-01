import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-notification";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
  userId: string;
}

export function AvatarUpload({ currentAvatarUrl, onUploadComplete, userId }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", "Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", "A imagem deve ter no máximo 5MB");
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${timestamp}.${fileExt}`;

      // Upload para o bucket avatars
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        onUploadComplete(urlData.publicUrl);
        toast.success("Avatar atualizado", "Sua foto de perfil foi alterada");
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro no upload", "Não foi possível enviar a imagem");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getDisplayUrl = () => {
    if (preview) return preview;
    if (currentAvatarUrl) return currentAvatarUrl;
    return "/placeholder.svg";
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-white/5 flex items-center justify-center">
        <img
          src={getDisplayUrl()}
          alt="Avatar Preview"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Upload Input */}
      <div>
        <Input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer rounded-xl border-primary/50 hover:bg-primary/10"
            disabled={isUploading}
            asChild
          >
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Escolher Imagem
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Clear Button */}
      {preview && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPreview(null)}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        JPG, PNG ou WebP • Máx 5MB
      </p>
    </div>
  );
}
