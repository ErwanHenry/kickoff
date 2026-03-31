import { FootballIcon } from "@/components/icons/football-icons";
import type { GroupMatchEntry } from "@/lib/db/queries/groups";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MatchHistoryProps {
  matches: GroupMatchEntry[];
}

/**
 * MatchHistory component - Server Component
 * Displays group's completed matches with scores and dates
 *
 * Mobile-first layout linking to public match pages
 */
export function MatchHistory({ matches }: MatchHistoryProps) {
  return (
    <div className="bg-chalk-pure shadow-card rounded-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FootballIcon name="goal" size={20} className="text-pitch" />
        <h2 className="text-lg font-semibold font-sans">Matchs du groupe</h2>
      </div>

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="text-center py-8">
          <FootballIcon name="centerCircle" size={32} className="text-slate-lighter mx-auto mb-2" />
          <p className="text-slate-mid">Aucun match joué</p>
          <p className="text-sm text-slate-mid mt-1">
            Les matchs complétés apparaîtront ici
          </p>
        </div>
      )}

      {/* Match list */}
      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.slice(0, 5).map((match) => {
            // Format date as "15 Mar"
            const formattedDate = format(new Date(match.date), "d MMM", { locale: fr });

            // Score display: show X-Y if played/rated, otherwise "-"
            const scoreDisplay = (match.status === "played" || match.status === "rated")
              && match.scoreTeamA !== null
              && match.scoreTeamB !== null
              ? `${match.scoreTeamA}-${match.scoreTeamB}`
              : "-";

            return (
              <Link
                key={match.id}
                href={`/m/${match.shareToken}`}
                className="block hover:bg-chalk rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 py-2 px-3">
                  {/* Date */}
                  <div className="w-20 font-mono text-sm text-slate-mid">
                    {formattedDate}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium truncate text-pitch">
                      {match.title || `Match du ${formattedDate}`}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="w-16 font-mono text-sm text-slate-mid text-right">
                    {scoreDisplay}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* "Voir tout" link if more than 5 matches */}
      {matches.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            href={`/group/[slug]/matches`}
            className="text-sm text-whistle-blue hover:underline font-medium"
          >
            Voir tout ({matches.length} match{matches.length > 1 ? "s" : ""})
          </Link>
        </div>
      )}
    </div>
  );
}
