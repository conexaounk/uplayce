import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Disc3, Upload, Image as ImageIcon } from "lucide-react";
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
  const { createPack, loading } = usePacks();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Digite o nome do pack");
      return;
    }

    let coverUrl: string | undefined = undefined;

    // Upload da capa se houver arquivo
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-border/50 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Novo Pack</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pack Name */}
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

          {/* Description */}
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

          {/* Cover Image Upload */}
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

          {/* Free or Paid Toggle */}
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

          {/* Price Input (only if paid) */}
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

          {/* Download Link */}
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
              helperText="Link que será disponibilizado para quem comprar"
            />
            <p className="text-xs text-muted-foreground">
              Link para downloads (Google Drive, Dropbox, etc)
            </p>
          </div>

          {/* Submit Buttons */}
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
                "Criar Pack"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
