import { Button } from "@/components/ui/button";
import { Loader2, Heart } from "lucide-react";
import { useFollow } from "@/hooks/use-follow";

interface FollowButtonProps {
  userId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
}

export function FollowButton({ userId, className, size = "sm", variant = "outline" }: FollowButtonProps) {
  const { isFollowing, isLoading, handleToggleFollow } = useFollow(userId);

  const sizeClasses = {
    sm: "px-4 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`rounded-full gap-1.5 !min-h-[26px] !px-1.5 !py-0 !leading-[13px] ${className}`}
      variant={isFollowing ? "outline" : variant === "default" ? "default" : "outline"}
      size={size === "sm" ? "sm" : size === "md" ? "default" : "lg"}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin mr-2" />
      ) : (
        <Heart size={16} className={`mr-2 ${isFollowing ? "fill-current" : ""}`} />
      )}
      {isFollowing ? "Deixar de Seguir" : "Seguir"}
    </Button>
  );
}
