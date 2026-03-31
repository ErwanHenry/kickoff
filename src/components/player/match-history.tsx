import { FootballIcon } from "@/components/icons/football-icons";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { statusBadges } from "@/lib/design-tokens";
import type { MatchHistoryEntry } from "@/lib/db/queries/players";

interface MatchHistoryProps {
  matches: MatchHistoryEntry[];
  className?: string;
}

export function MatchHistory({ matches, className }: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <div className={`bg-chalk-pure shadow-card rounded-card p-4 ${className || ""}`}>
        <h3 className="font-semibold">Historique des matchs</h3>
        <p className="text-sm text-muted-foreground mb-4">10 derniers matchs</p>
        <p className="text-center text-muted-foreground py-8">
          Aucun match joué
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-chalk-pure shadow-card rounded-card p-4 ${className || ""}`}>
      <h3 className="font-semibold">Historique des matchs</h3>
      <p className="text-sm text-muted-foreground mb-4">10 derniers matchs</p>

      <div className="space-y-3">
        {matches.map((match, index) => {
          // Determine result badge
          let resultBadge = null;
          if (match.status === "played" || match.status === "rated") {
            if (match.scoreTeamA !== null && match.scoreTeamB !== null) {
              if (match.scoreTeamA === match.scoreTeamB) {
                resultBadge = (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-0">
                    Nul ≈
                  </Badge>
                );
              } else {
                const playerWon =
                  (match.team === "A" && match.scoreTeamA > match.scoreTeamB) ||
                  (match.team === "B" && match.scoreTeamB > match.scoreTeamA);

                resultBadge = playerWon ? (
                  <Badge className={`bg-lime-glow text-lime-dark border-0`}>
                    Victoire ✓
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-0">
                    Défaite ≈
                  </Badge>
                );
              }
            }
          }

          const scoreDisplay =
            match.scoreTeamA !== null && match.scoreTeamB !== null
              ? `${match.scoreTeamA}-${match.scoreTeamB}`
              : "-";

          return (
            <div
              key={match.matchId}
              className={`pb-3 space-y-2 ${
                index < matches.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              {/* Date row */}
              <div className="font-mono text-sm text-muted-foreground">
                {format(match.date, "d MMM yyyy", { locale: fr })}
              </div>

              {/* Main info row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {/* Location */}
                  <span className="font-medium text-foreground">
                    {match.location}
                  </span>

                  {/* Team badge */}
                  {match.team && (
                    <Badge variant="outline" className="bg-chalk text-slate-mid border-0">
                      Équipe {match.team}
                    </Badge>
                  )}

                  {/* Result badge */}
                  {resultBadge}

                  {/* Score */}
                  <span className="font-mono text-xs text-muted-foreground">
                    {scoreDisplay}
                  </span>
                </div>

                {/* Rating badge */}
                {match.avgRating !== null && (
                  <div className="flex items-center gap-1 text-pitch">
                    <FootballIcon name="ball" size={14} />
                    <span className="font-mono text-xs">
                      {match.avgRating.toFixed(1)}/5
                    </span>
                  </div>
                )}
              </div>

              {/* No-show indicator */}
              {match.attended === false && (
                <Badge
                  className={statusBadges.no_show.bg + " " + statusBadges.no_show.text + " border-0"}
                >
                  {statusBadges.no_show.icon && (
                    <FootballIcon name={statusBadges.no_show.icon} size={12} />
                  )}
                  {statusBadges.no_show.label}
                </Badge>
              )}

              {/* Link to match */}
              <a
                href={`/m/${match.shareToken}`}
                className="text-whistle-blue text-xs hover:underline"
              >
                Voir le match →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
