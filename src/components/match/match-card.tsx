import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import type { Match } from "@/db/schema";

interface MatchCardProps {
  match: Match & { confirmedCount?: number };
  variant: "upcoming" | "recent";
}

/**
 * MatchCard component
 * Displays match summary in a compact card format
 *
 * Per 02-UI-SPEC.md: Mobile-first, status badge colors
 * - "Ouvert" → green (accent)
 * - "Complet" → red (destructive)
 * - "Verrouillé" → gray (muted)
 */
export function MatchCard({ match, variant }: MatchCardProps) {
  // Format date: "Mar 15 avril 20h"
  const formattedDate = format(new Date(match.date), "EEE d MMM HH'h'", {
    locale: fr,
  });

  // Status badge configuration
  const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
    open: { label: "Ouvert", variant: "default" },
    full: { label: "Complet", variant: "destructive" },
    locked: { label: "Verrouillé", variant: "secondary" },
    draft: { label: "Brouillon", variant: "outline" },
    played: { label: "Joué", variant: "secondary" },
    rated: { label: "Noté", variant: "outline" },
  };

  const status = statusConfig[match.status] || statusConfig.open;

  // Determine link based on variant
  const href = variant === "upcoming" ? `/m/${match.shareToken}` : `/match/${match.id}`;

  return (
    <Link href={href}>
      <Card className="group hover:scale-105 transition-transform duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {match.title || `Match du ${formattedDate}`}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{match.location}</span>
              </div>
            </div>
            <Badge variant={status.variant} className="flex-shrink-0">
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {match.confirmedCount ?? 0}/{match.maxPlayers} confirmés
            </span>
            <span className="text-primary font-medium group-hover:underline">
              {variant === "upcoming" ? "Voir le match" : "Détails"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
