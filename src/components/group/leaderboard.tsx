import { FootballIcon } from "@/components/icons/football-icons";
import { attendanceBadge } from "@/lib/design-tokens";
import type { LeaderboardEntry } from "@/lib/db/queries/groups";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  groupId: string;
  leaderboard: LeaderboardEntry[];
}

/**
 * Leaderboard component - Server Component
 * Displays group rankings with medals for top 3, attendance badges, and profile links
 *
 * Mobile-first layout with responsive card design
 */
export function Leaderboard({ groupId, leaderboard }: LeaderboardProps) {
  return (
    <div className="bg-chalk-pure shadow-card rounded-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FootballIcon name="star" size={20} className="text-pitch" />
        <h2 className="text-lg font-semibold font-sans">🏆 Classement</h2>
      </div>

      {/* Empty state */}
      {leaderboard.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-mid">Aucun classement disponible</p>
          <p className="text-sm text-slate-mid mt-1">
            Les joueurs apparaissent après leur premier match noté
          </p>
        </div>
      )}

      {/* Leaderboard list */}
      {leaderboard.length > 0 && (
        <div className="space-y-1">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const badge = attendanceBadge(entry.attendanceRate);

            // Rank display with medals for top 3
            const rankDisplay = rank === 1 ? "🥇" :
                               rank === 2 ? "🥈" :
                               rank === 3 ? "🥉" :
                               `${rank}`;

            // Rating color based on score
            const ratingColor = entry.avgOverall >= 4.0 ? "text-pitch" : "text-slate-mid";

            return (
              <Link
                key={entry.id}
                href={`/player/${entry.id}`}
                className="block hover:bg-chalk rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 py-2 px-3 divide-y divide-slate-lighter last:divide-0">
                  {/* Rank column */}
                  <div className="w-12 text-center font-mono text-sm">
                    {rankDisplay}
                  </div>

                  {/* Name column */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium truncate text-pitch hover:underline">
                      {entry.name}
                    </p>
                  </div>

                  {/* Overall rating */}
                  <div className={cn("w-20 text-right font-mono font-semibold text-sm", ratingColor)}>
                    {entry.avgOverall.toFixed(1)}
                  </div>

                  {/* Matches played */}
                  <div className="w-16 text-right font-mono text-xs text-slate-mid">
                    {entry.matchesPlayed} {entry.matchesPlayed === 1 ? "match" : "matchs"}
                  </div>

                  {/* Attendance badge */}
                  <div className="w-24 flex items-center gap-1">
                    <span className="text-xs">{badge.emoji}</span>
                    <span className={cn("text-xs font-medium", badge.className)}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      {leaderboard.length > 0 && leaderboard.length < 50 && (
        <p className="text-xs text-slate-mid mt-4 text-center">
          Classement basé sur la note globale • {leaderboard.length} joueur{leaderboard.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
