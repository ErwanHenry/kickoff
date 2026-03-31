import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlayerProfile, getPlayerMatchHistory, getPlayerComments } from "@/lib/db/queries/players";
import { StatsOverview } from "@/components/player/stats-overview";
import { PlayerRadarChart } from "@/components/player/radar-chart";
import { MatchHistory } from "@/components/player/match-history";
import { CommentsList } from "@/components/player/comments-list";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate OG metadata for player profile
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const profile = await getPlayerProfile(id);

    return {
      title: `${profile.name} — Profil joueur | kickoff`,
      description: `${profile.matchesPlayed} matchs • Note ${profile.avgOverall.toFixed(1)}/5 • Présence ${profile.attendanceRate}%`,
      openGraph: {
        title: `${profile.name} — Profil joueur`,
        description: `${profile.matchesPlayed} matchs • Note ${profile.avgOverall.toFixed(1)}/5 • Présence ${profile.attendanceRate}%`,
        type: "profile",
      },
    };
  } catch {
    return {
      title: "Profil non trouvé | kickoff",
    };
  }
}

/**
 * Player profile page - Server Component for data fetching
 * Displays complete player stats, radar chart, match history, and comments
 */
export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch all data in parallel
  try {
    const [profile, matchHistory, comments] = await Promise.all([
      getPlayerProfile(id),
      getPlayerMatchHistory(id, 10),
      getPlayerComments(id, 10),
    ]);

    // Generate initials from name
    const initials = profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <main className="min-h-screen bg-chalk pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {/* Avatar with initials */}
              <div className="w-16 h-16 rounded-full bg-pitch flex items-center justify-center">
                <span className="text-lime text-xl font-semibold">
                  {initials}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Membre depuis {format(profile.createdAt, "MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={{ ...profile, totalRatingsReceived: profile.totalRatingsReceived }} />

          {/* Radar Chart */}
          <section>
            <PlayerRadarChart stats={profile} />
          </section>

          {/* Match History */}
          <section>
            <MatchHistory matches={matchHistory} />
          </section>

          {/* Comments */}
          <section>
            <CommentsList comments={comments} />
          </section>
        </div>
      </main>
    );
  } catch (error) {
    notFound();
  }
}
