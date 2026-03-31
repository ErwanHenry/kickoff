"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface CopyInviteButtonProps {
  inviteCode: string;
}

/**
 * CopyInviteButton - Client Component
 * Handles copying invite code to clipboard with visual feedback
 */
export function CopyInviteButton({ inviteCode }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success("Code copié !");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
      console.error("Failed to copy invite code:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-2 hover:bg-chalk transition-colors"
    >
      {copied ? (
        <>
          <Check size={16} className="text-lime-dark" />
          <span className="text-sm">Copié</span>
        </>
      ) : (
        <>
          <Copy size={16} />
          <span className="text-sm">Copier</span>
        </>
      )}
    </Button>
  );
}
