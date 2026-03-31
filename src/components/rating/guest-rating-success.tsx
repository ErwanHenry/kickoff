"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FootballIcon } from "@/components/icons/football-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GuestRatingSuccessProps {
  ratedCount: number;
}

/**
 * Guest rating success CTA component
 * Displays after successful rating submission for guests
 * Per PLAN 07-02 Task 1 requirements
 */
export function GuestRatingSuccess({ ratedCount }: GuestRatingSuccessProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Success message */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-lime-glow flex items-center justify-center mx-auto">
          <FootballIcon name="star" size={32} className="text-lime-dark" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Merci pour tes notes !
        </h2>
        <p className="text-sm text-muted-foreground">
          {ratedCount} joueur{ratedCount > 1 ? "s" : ""} noté{ratedCount > 1 ? "s" : ""}
        </p>
      </div>

      {/* CTA Card */}
      <Card className="p-6 bg-chalk-pure shadow-card rounded-card">
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <FootballIcon name="star" size={32} className="text-lime" />
          </div>

          {/* Heading */}
          <h3 className="text-xl font-semibold text-center text-foreground">
            Sauvegarde tes stats !
          </h3>

          {/* Description */}
          <p className="text-sm text-center text-muted-foreground">
            Crée un compte pour garder ton historique de matchs, voir tes stats, et accéder à ton profil complet.
          </p>

          {/* CTA Button */}
          <Button
            variant="default"
            className="w-full bg-pitch text-lime hover:bg-pitch/90 rounded-button"
            onClick={() => router.push("/register")}
          >
            <FootballIcon name="boot" size={16} className="mr-2" />
            Créer un compte gratuitement
          </Button>
        </div>
      </Card>
    </div>
  );
}
