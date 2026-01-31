import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Track } from "@/types/supabase";
import { SelectTracksStep } from "./BuyPack/SelectTracksStep";
import { ConfirmPackStep } from "./BuyPack/ConfirmPackStep";
import { ReviewPackStep } from "./BuyPack/ReviewPackStep";

interface BuyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  djName: string;
  djId: string;
  allTracks: Track[];
}

export type Step = "select" | "confirm" | "review";

export function BuyPackModal({ isOpen, onClose, djName, djId, allTracks }: BuyPackModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [packName, setPackName] = useState(djName);
  const [packColor, setPackColor] = useState("#A424FF");

  const resetFlow = () => {
    setStep("select");
    setSelectedTracks([]);
    setPackName(djName);
    setPackColor("#A424FF");
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleSelectTracksNext = (tracks: Track[]) => {
    setSelectedTracks(tracks);
    setStep("confirm");
  };

  const handleConfirmNext = (name: string, color: string) => {
    setPackName(name);
    setPackColor(color);
    setStep("review");
  };

  const handleConfirmBack = () => {
    setStep("select");
  };

  const handleReviewComplete = () => {
    resetFlow();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full bg-card border-white/10 p-0 overflow-hidden">
        {step === "select" && (
          <SelectTracksStep
            tracks={allTracks}
            onNext={handleSelectTracksNext}
            onCancel={handleClose}
          />
        )}

        {step === "confirm" && (
          <ConfirmPackStep
            selectedTracks={selectedTracks}
            djName={djName}
            onNext={handleConfirmNext}
            onBack={handleConfirmBack}
          />
        )}

        {step === "review" && (
          <ReviewPackStep
            selectedTracks={selectedTracks}
            packName={packName}
            packColor={packColor}
            djName={djName}
            djId={djId}
            onComplete={handleReviewComplete}
            onBack={() => setStep("confirm")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
