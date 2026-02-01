import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMusicApi } from '@/hooks/use-music-api';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AudioPreview } from '@/components/AudioPreview';

const schema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  collaborations: z.string().optional(),
  bpm: z.number().optional().nullable(),
  key: z.string().optional(),
  price_cents: z.number().optional().nullable(),
  is_public: z.boolean().optional(),
  preview_start_time: z.number().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export function EditTrackModal({ open, onOpenChange, track }: { open: boolean; onOpenChange: (v: boolean) => void; track: any | null }) {
  const { updateTrackMutation, removeFromProfileMutation } = useMusicApi();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      genre: '',
      collaborations: '',
      bpm: undefined,
      key: '',
      price_cents: undefined,
      is_public: undefined,
      preview_start_time: undefined,
    }
  });

  useEffect(() => {
    if (track) {
      form.reset({
        title: track.title || '',
        genre: track.genre || '',
        collaborations: track.collaborations || '',
        bpm: track.bpm ?? undefined,
        key: track.key || '',
        price_cents: track.price_cents ?? undefined,
        is_public: track.is_public ?? false,
        preview_start_time: track.preview_start_time ?? undefined,
      });
    }
  }, [track]);

  if (!track) return null;

  const onSubmit = (data: FormData) => {
    const payload: any = {
      title: data.title,
      genre: data.genre,
      collaborations: data.collaborations || null,
      bpm: data.bpm ?? null,
      key: data.key || null,
      price_cents: data.price_cents ?? null,
      is_public: !!data.is_public,
      preview_start_time: data.preview_start_time ?? null,
    };

    // Sanitizar ID removendo sufixos (ex: ":1")
    const cleanTrackId = String(track.id).split(':')[0];
    updateTrackMutation.mutate({ trackId: cleanTrackId, payload }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleRemoveFromProfile = () => {
    if (!track) return;
    if (!confirm('Remover essa música do seu perfil? Ela não será deletada do banco, apenas removida do seu perfil.')) return;
    // Sanitizar ID removendo sufixos (ex: ":1")
    const cleanTrackId = String(track.id).split(':')[0];
    removeFromProfileMutation.mutate(cleanTrackId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Música</DialogTitle>
          <DialogDescription>Altere informações da faixa. Remover não deleta do banco.</DialogDescription>
        </DialogHeader>

        {/* Audio Preview with Editable Time Selector */}
        {track?.audio_url && (
          <div className="mb-6">
            <AudioPreview
              url={track.audio_url}
              title={track.title}
              size="sm"
              showTime={true}
              startTime={track.preview_start_time || 0}
              onStartTimeChange={(time) => form.setValue('preview_start_time', time)}
              editable={true}
            />
          </div>
        )}

        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Título</Label>
              <Input {...form.register('title')} className="h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">Gênero</Label>
              <Input {...form.register('genre')} className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">BPM</Label>
              <Input type="number" {...form.register('bpm', { valueAsNumber: true })} className="h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">Key</Label>
              <Input {...form.register('key')} className="h-8 text-sm" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Colaborações</Label>
            <Input {...form.register('collaborations')} className="h-8 text-sm" />
          </div>

          <div>
            <Label className="text-xs">Tempo inicial da prévia (segundos)</Label>
            <Input
              type="number"
              {...form.register('preview_start_time', { valueAsNumber: true })}
              placeholder="Ex: 0, 30, 60..."
              min="0"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define a partir de qual segundo a prévia de 30 segundos começará
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="bg-primary flex-1 h-8 text-sm">Salvar</Button>
            <Button variant="destructive" onClick={handleRemoveFromProfile} className="h-8 text-sm"><Trash2 size={14} className="mr-1" /> Remover</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
