import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FootballIcon } from "@/components/icons/football-icons";
import { statusBadges } from "@/lib/design-tokens";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import Link from "next/link";
import type { Match } from "@/db/schema";

interface MatchCardProps {
  match: Partial<Match> & { confirmedCount?: number } & Pick<Match, "id" | "title" | "location" | "date" | "maxPlayers" | "status" | "shareToken">;
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

  // Get status badge from design tokens
  const badge = statusBadges[match.status as keyof typeof statusBadges] || statusBadges.open;

  // Determine link based on variant
  const href = variant === "upcoming" ? `/m/${match.shareToken}` : `/match/${match.id}`;

  return (
    <Link href={href}>
      <Card className="group hover:scale-105 transition-transform duration-200 cursor-pointer shadow-card hover:shadow-card-hover rounded-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {match.title || `Match du ${formattedDate}`}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <FootballIcon name="chrono" size={14} className="flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <FootballIcon name="pitch" size={14} className="flex-shrink-0" />
                <span className="truncate">{match.location}</span>
              </div>
            </div>
            <Badge className={cn(badge.bg, badge.text, "flex-shrink-0 gap-1.5")}>
              <FootballIcon name={badge.icon} size={14} />
              {badge.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono">
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
