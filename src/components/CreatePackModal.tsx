import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Palette, ArrowRight } from "lucide-react";
import { usePack } from "@/context/packContext";
import { useAuth } from "@/hooks/use-auth";

export function CreatePackModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [packName, setPackName] = useState("");
  const [packColor, setPackColor] = useState("#ff0000");
  const { createPack } = usePack();
  const { user } = useAuth();

  function handleConfirm() {
    if (!packName) return;
    createPack(packName, packColor, user?.email?.split('@')[0] || 'ARTIST');
    setPackName("");
    setPackColor("#ff0000");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
        <DialogHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
            <FolderPlus className="text-primary" size={24} />
          </div>
          <DialogTitle className="text-2xl font-bold">Inicie seu Novo Pack</DialogTitle>
          <DialogDescription>
            Dê um nome e uma identidade visual para a sua pasta de mashups.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Pack</Label>
            <Input
              id="name"
              placeholder="Ex: My Private Selection Vol. 1"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="bg-background/50 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor da Pasta</Label>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <input
                type="color"
                value={packColor}
                onChange={(e) => setPackColor(e.target.value)}
                className="w-12 h-12 rounded bg-transparent cursor-pointer border-none"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Escolha o tom</p>
                <p className="text-xs text-muted-foreground uppercase">{packColor}</p>
              </div>
              <Palette className="text-muted-foreground" size={20} />
            </div>
          </div>
        </div>

        <Button
          disabled={!packName}
          onClick={handleConfirm}
          className="w-full h-12 font-bold"
        >
          Começar a Escolher <ArrowRight className="ml-2" size={18} />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
