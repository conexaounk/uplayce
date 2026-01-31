import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface EmojiAvatarPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
}

const EMOJI_AVATARS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "🤪", "😝", "😏", "😒", "😞", "😔", "😟", "😕",
  "🙁", "😲", "😮", "😯", "😳", "🥺", "😦", "😧",
  "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
  "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠",
  "🤬", "😈", "👿", "💀", "☠️", "💋", "👋", "🤚",
  "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
  "🫰", "🤟", "🤘", "🤙", "👍", "👎", "👊", "👏",
  "🙌", "👐", "🤲", "🤝", "🤜", "🤛", "🦁", "🐯",
  "🐻", "🐼", "🐨", "🐶", "🐱", "🐭", "🐹", "🐰",
  "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
  "🐢", "🐍", "🐙", "🐠", "🐟", "🐡", "🦈", "🌺",
  "🌸", "🌼", "🌻", "🌷", "🌹", "💐", "⭐", "🌟",
  "✨", "⚡", "🔥", "💧", "🌈", "☀️", "🎨", "🎭",
  "🎪", "🎬", "🎤", "🎧", "🎮", "🎯", "🏆", "🎁",
];

export function EmojiAvatarPicker({ value, onChange }: EmojiAvatarPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState(value || "");

  const handleSelectEmoji = (emoji: string) => {
    setSelectedEmoji(emoji);
    onChange(emoji);
  };

  const handleClear = () => {
    setSelectedEmoji("");
    onChange("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Selecione um Emoji Avatar</label>
        <p className="text-xs text-muted-foreground">
          Escolha um emoji para representar seu avatar
        </p>
      </div>

      {selectedEmoji && (
        <div className="bg-muted/50 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{selectedEmoji}</span>
            <span className="text-sm text-muted-foreground">Emoji Avatar Selecionado</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            Limpar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-8 gap-2 bg-muted/20 border border-white/10 rounded-lg p-4 max-h-96 overflow-y-auto">
        {EMOJI_AVATARS.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelectEmoji(emoji)}
            className={`
              w-full aspect-square flex items-center justify-center rounded-lg
              text-3xl transition-all duration-200
              ${selectedEmoji === emoji
                ? "bg-primary/30 border-2 border-primary scale-110"
                : "bg-background/30 border border-white/10 hover:bg-background/50"
              }
            `}
            title={`Selecionar ${emoji}`}
          >
            {selectedEmoji === emoji && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check className="w-4 h-4 text-primary absolute bottom-0 right-0" />
              </div>
            )}
            <span>{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
