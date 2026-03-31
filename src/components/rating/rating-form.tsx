"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayerRatingCard } from "./player-rating-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FootballIcon } from "@/components/icons/football-icons";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface ExistingRating {
  ratedId: string;
  technique: number;
  physique: number;
  collectif: number;
  comment?: string;
}

interface RatingFormProps {
  matchId: string;
  shareToken?: string;
  players: Player[];
  existingRatings: ExistingRating[];
  isGuest: boolean;
  submitRatings: (formData: FormData) => Promise<{
    error?: string;
    success?: boolean;
    matchId?: string;
    ratingsCount?: number;
  }>;
  ratingProgress?: {
    raters: number;
    confirmed: number;
    percentage: number;
    isRated: boolean;
  };
  onRatingSuccess?: (ratedCount: number) => void;
}

/**
 * Rating Form component (shared between guest and user flows)
 * Per PLAN 06-02 requirements: mobile-first, progress indicator, post-submit flows
 * Per PLAN 06-03 Task 4: display rating progress (X/Y players rated, progress bar)
 * Composes PlayerRatingCard for each teammate
 */
export function RatingForm({
  matchId,
  shareToken,
  players,
  existingRatings,
  isGuest,
  submitRatings,
  ratingProgress,
  onRatingSuccess,
}: RatingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize ratings state from existingRatings
  const [ratings, setRatings] = useState<Record<string, ExistingRating>>(() => {
    const initial: Record<string, ExistingRating> = {};
    for (const player of players) {
      const existing = existingRatings.find((r) => r.ratedId === player.id);
      initial[player.id] = existing || {
        ratedId: player.id,
        technique: 0,
        physique: 0,
        collectif: 0,
        comment: "",
      };
    }
    return initial;
  });

  // Track if any rating is present
  const hasAnyRating = Object.values(ratings).some(
    (r) => r.technique > 0 || r.physique > 0 || r.collectif > 0
  );

  // Count rated players (all three axes rated)
  const ratedCount = Object.values(ratings).filter(
    (r) => r.technique > 0 && r.physique > 0 && r.collectif > 0
  ).length;

  // Handle rating change
  const handleRatingChange = (
    playerId: string,
    axis: "technique" | "physique" | "collectif",
    value: number
  ) => {
    setRatings((prev) => {
      const current = prev[playerId] || {
        ratedId: playerId,
        technique: 0,
        physique: 0,
        collectif: 0,
        comment: "",
      };
      return {
        ...prev,
        [playerId]: {
          ...current,
          [axis]: value,
        },
      };
    });
  };

  // Handle comment change
  const handleCommentChange = (playerId: string, comment: string) => {
    setRatings((prev) => {
      const current = prev[playerId] || {
        ratedId: playerId,
        technique: 0,
        physique: 0,
        collectif: 0,
        comment: "",
      };
      return {
        ...prev,
        [playerId]: {
          ...current,
          comment,
        },
      };
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAnyRating) {
      toast.error("Ajoute au moins une note avant d'envoyer");
      return;
    }

    const formData = new FormData();
    formData.append("matchId", matchId);

    // Filter only rated players (at least one axis rated)
    const ratingsToSubmit = Object.values(ratings).filter(
      (r) => r.technique > 0 || r.physique > 0 || r.collectif > 0
    );

    formData.append("ratings", JSON.stringify(ratingsToSubmit));

    startTransition(async () => {
      const result = await submitRatings(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setIsSubmitted(true);
        const count = result.ratingsCount || ratedCount;
        toast.success(`Notes envoyées ! (${count} joueur${count > 1 ? "s" : ""} noté${count > 1 ? "s" : ""})`);

        // Call onRatingSuccess callback if provided (for external CTA handling)
        if (onRatingSuccess) {
          onRatingSuccess(count);
        }

        // Redirect after 2 seconds (user) or show CTA (guest)
        setTimeout(() => {
          if (!isGuest) {
            router.push(`/match/${matchId}`);
          }
        }, 2000);
      }
    });
  };

  // Auto-redirect for user after submission
  useEffect(() => {
    if (isSubmitted && !isGuest) {
      const timer = setTimeout(() => {
        router.push(`/match/${matchId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, isGuest, matchId, router]);

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-lime-glow flex items-center justify-center">
          <FootballIcon name="star" size={40} className="text-lime-dark" />
        </div>

        {/* Success message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Merci pour tes notes !
          </h2>
          <p className="text-muted-foreground">
            {ratedCount} joueur{ratedCount > 1 ? "s" : ""} noté{ratedCount > 1 ? "s" : ""}
          </p>
        </div>

        {/* Guest CTA */}
        {isGuest && (
          <Card className="p-6 max-w-sm bg-lime-glow border-lime-dark">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FootballIcon name="ball" size={20} className="text-pitch" />
                <p className="font-semibold text-pitch">
                  Crée un compte pour voir ton historique
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Suive tes stats, ton historique de matchs et tes notes moyennes.
              </p>
              <Button
                onClick={() => router.push("/register")}
                className="w-full bg-pitch text-chalk-pure hover:bg-pitch/90"
              >
                Créer un compte
              </Button>
            </div>
          </Card>
        )}

        {/* User redirect message */}
        {!isGuest && (
          <p className="text-sm text-muted-foreground">
            Redirection vers le match...
          </p>
        )}
      </div>
    );
  }

  // Count unrated players
  const unratedCount = players.length - ratedCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground font-sans">
          Note tes coéquipiers
        </h1>
        <p className="text-sm text-muted-foreground">
          Match du {/* Date could be passed as prop */}
        </p>

        {/* Progress indicator badge (your ratings) */}
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge font-mono text-xs",
            ratedCount === 0
              ? "bg-slate-100 text-slate-mid"
              : ratedCount === players.length
              ? "bg-lime-glow text-lime-dark"
              : "bg-yellow-100 text-yellow-800"
          )}
        >
          <FootballIcon
            name="ball"
            size={14}
            className={cn(
              ratedCount === 0 ? "text-slate-mid" : "text-current"
            )}
          />
          {ratedCount}/{players.length} joueurs notés
        </Badge>

        {/* Per PLAN 06-03 Task 4: Rating participation progress indicator */}
        {ratingProgress && (
          <div className="space-y-1.5">
            {/* Progress bar */}
            <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 h-full transition-all duration-300",
                  ratingProgress.percentage >= 50
                    ? "bg-pitch"
                    : "bg-lime-glow"
                )}
                style={{ width: `${Math.min(ratingProgress.percentage, 100)}%` }}
              />
            </div>

            {/* Progress text with badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {ratingProgress.raters}/{ratingProgress.confirmed} joueurs ont noté
              </span>
              {ratingProgress.isRated && (
                <Badge className="px-2 py-0.5 rounded-badge font-mono text-xs bg-lime-glow text-lime-dark">
                  Complété
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Players list */}
      <div className="space-y-4">
        {players.map((player) => (
          <PlayerRatingCard
            key={player.id}
            player={player}
            ratings={ratings[player.id] || { technique: 0, physique: 0, collectif: 0 }}
            onChange={(axis, value) => handleRatingChange(player.id, axis, value)}
            onCommentChange={(comment) => handleCommentChange(player.id, comment)}
            comment={ratings[player.id]?.comment || ""}
            disabled={isPending}
          />
        ))}
      </div>

      {/* Warning for unrated players */}
      {unratedCount > 0 && ratedCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <FootballIcon name="card" size={16} className="shrink-0 mt-0.5 text-yellow-card" />
          <p className="text-sm text-yellow-card">
            {unratedCount} joueur{unratedCount > 1 ? "s" : ""} non noté{unratedCount > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Sticky submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-chalk-pure border-t border-slate-light shadow-card-hover safe-area-inset-bottom z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <Button
            type="submit"
            disabled={!hasAnyRating || isPending}
            className={cn(
              "w-full h-12 text-base rounded-button font-sans font-semibold transition-all",
              "bg-pitch text-chalk-pure hover:bg-pitch/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-btn-hover"
            )}
            size="lg"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-chalk-pure/30 border-t-chalk-pure rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : ratedCount === players.length ? (
              "Terminé"
            ) : (
              "Envoyer mes notes"
            )}
          </Button>

          {/* Unrated count warning below button */}
          {unratedCount > 0 && (
            <p className="text-xs text-center text-muted-foreground font-mono">
              {unratedCount} joueur{unratedCount > 1 ? "s" : ""} sans note
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
