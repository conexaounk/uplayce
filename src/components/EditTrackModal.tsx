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

const schema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  collaborations: z.string().optional(),
  bpm: z.number().optional().nullable(),
  key: z.string().optional(),
  price_cents: z.number().optional().nullable(),
  is_public: z.boolean().optional(),
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
    };

    updateTrackMutation.mutate({ trackId: track.id, payload }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleRemoveFromProfile = () => {
    if (!track) return;
    if (!confirm('Remover essa música do seu perfil? Ela não será deletada do banco, apenas removida do seu perfil.')) return;
    removeFromProfileMutation.mutate(track.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Música</DialogTitle>
          <DialogDescription>Altere informações da faixa. Remover não deleta do banco.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Label>Título</Label>
            <Input {...form.register('title')} />
          </div>

          <div>
            <Label>Gênero</Label>
            <Input {...form.register('genre')} />
          </div>

          <div>
            <Label>Colaborações</Label>
            <Input {...form.register('collaborations')} />
          </div>

          <div>
            <Label>BPM</Label>
            <Input type="number" {...form.register('bpm', { valueAsNumber: true })} />
          </div>

          <div>
            <Label>Key</Label>
            <Input {...form.register('key')} />
          </div>

          <div>
            <Label>Preço (centavos)</Label>
            <Input type="number" {...form.register('price_cents', { valueAsNumber: true })} />
          </div>

          <div className="flex justify-between items-center">
            <Button type="submit" className="bg-primary">Salvar</Button>
            <Button variant="destructive" onClick={handleRemoveFromProfile}><Trash2 /> Remover do perfil</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
