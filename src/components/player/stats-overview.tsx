"use client";

import { FootballIcon } from "@/components/icons/football-icons";
import { attendanceBadge } from "@/lib/design-tokens";
import { formatRelative } from "date-fns";
import { fr } from "date-fns/locale";

interface StatsOverviewProps {
  stats: {
    matchesPlayed: number;
    attendanceRate: number;
    avgOverall: number;
    lastMatchDate: Date | null;
    totalRatingsReceived?: number;
  };
  className?: string;
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const badge = attendanceBadge(Number(stats.attendanceRate));

  return (
    <div className={`grid grid-cols-2 gap-3 ${className || ""}`}>
      {/* Card 1: Matchs joués */}
      <div className="bg-chalk-pure shadow-card rounded-card p-4 space-y-2">
        <FootballIcon name="goal" size={20} className="text-pitch" />
        <div className="font-mono text-2xl text-pitch">
          {stats.matchesPlayed}
        </div>
        <div className="text-sm text-muted-foreground">
          Matchs joués
        </div>
      </div>

      {/* Card 2: Note globale */}
      <div className="bg-chalk-pure shadow-card rounded-card p-4 space-y-2">
        <FootballIcon name="star" size={20} className="text-pitch" />
        <div className="font-mono text-2xl text-pitch">
          {stats.avgOverall.toFixed(1)}/5
        </div>
        <div className="text-xs text-muted-foreground">
          {stats.totalRatingsReceived || 0} avis
        </div>
      </div>

      {/* Card 3: Taux de présence */}
      <div className="bg-chalk-pure shadow-card rounded-card p-4 space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-lg">{badge.emoji}</span>
          <span className={`font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="font-mono text-sm text-muted-foreground">
          {stats.attendanceRate}%
        </div>
      </div>

      {/* Card 4: Dernier match */}
      <div className="bg-chalk-pure shadow-card rounded-card p-4 space-y-2">
        <FootballIcon name="chrono" size={20} className="text-pitch" />
        {stats.lastMatchDate ? (
          <div className="font-sans text-sm text-foreground">
            {formatRelative(stats.lastMatchDate, new Date(), { locale: fr })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Jamais joué
          </div>
        )}
      </div>
    </div>
  );
}
