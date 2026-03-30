"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rsvpMatch, cancelRsvp } from "@/lib/actions/rsvp";
import { toast } from "sonner";

interface RSVPButtonProps {
  matchId: string;
  shareToken: string;
  isFull: boolean;
  existingPlayer?: {
    id: string;
    status: string;
    name: string | null;
    guestToken: string | null;
  };
  guestToken?: string;
}

/**
 * RSVP button component with 4-state machine
 * Per 02-UI-SPEC.md "RSVP Button" section and CONTEXT.md D-15, D-16, D-17, D-18
 */
export function RSVPButton({
  matchId,
  shareToken,
  isFull,
  existingPlayer,
  guestToken,
}: RSVPButtonProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine current state based on existing player
  const isConfirmed = existingPlayer?.status === "confirmed";
  const isWaitlisted = existingPlayer?.status === "waitlisted";
  const guestName = existingPlayer?.name || "";

  // localStorage fallback for Safari ITP (per CONTEXT.md D-17)
  useEffect(() => {
    if (guestToken && !localStorage.getItem("kickoff_guest_token")) {
      localStorage.setItem("kickoff_guest_token", guestToken);
    }
  }, [guestToken]);

  // Handle RSVP submission
  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("shareToken", shareToken);
      formData.append("guestName", name);

      const result = await rsvpMatch(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        // Store token in localStorage for Safari ITP fallback
        if (result.guestToken) {
          localStorage.setItem("kickoff_guest_token", result.guestToken);
        }

        if (result.status === "waitlisted" && result.waitlistPosition) {
          toast.success(
            `Tu es en liste d'attente (position ${result.waitlistPosition})`
          );
        } else {
          toast.success("Tu es confirmé !");
        }

        router.refresh();
      }
    } catch (error) {
      console.error("RSVP error:", error);
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    if (!guestToken) {
      toast.error("Token non trouvé");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("shareToken", shareToken);
      formData.append("guestToken", guestToken);

      const result = await cancelRsvp(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tu es désinscrit");
        router.refresh();
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // State 1: Initial (no guest detected) - Show name input + RSVP button
  if (!isConfirmed && !isWaitlisted) {
    return (
      <Card className="sticky bottom-0 z-10 border-t shadow-lg">
        <CardContent className="p-4 safe-area-inset-bottom">
          <form onSubmit={handleRsvp} className="space-y-3">
            <Input
              type="text"
              placeholder="Ton prénom ou surnom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-12 text-base"
              autoComplete="given-name"
            />
            <Button
              type="submit"
              className="w-full h-12 text-base bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-semibold"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Inscription..." : "Je suis là !"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // State 2: Confirmed (cookie detected, satisfies GUEST-04)
  if (isConfirmed) {
    return (
      <Card className="sticky bottom-0 z-10 border-t shadow-lg">
        <CardContent className="p-4 space-y-3 safe-area-inset-bottom">
          {/* Personalized welcome banner (per CONTEXT.md D-18) */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Salut {guestName} ! Tu es confirmé ✓
            </p>
          </div>

          <Button
            onClick={handleCancel}
            variant="destructive"
            className="w-full h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Annulation..." : "Me désinscrire"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 3: Waitlisted
  if (isWaitlisted) {
    return (
      <Card className="sticky bottom-0 z-10 border-t shadow-lg">
        <CardContent className="p-4 space-y-3 safe-area-inset-bottom">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100">
              Liste d'attente
            </Badge>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Tu es sur la liste d'attente
          </p>

          <Button
            onClick={handleCancel}
            variant="destructive"
            className="w-full h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Annulation..." : "Me désinscrire"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
