import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getMatchById } from "@/lib/db/queries/match-by-id";
import { getMatchPlayersForRating, getExistingRatings, getMatchRatingProgress } from "@/lib/db/queries/ratings";
import { RatingForm } from "@/components/rating/rating-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FootballIcon } from "@/components/icons/football-icons";
import { submitRatings } from "@/lib/actions/ratings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate metadata for user rating page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Noter le match — kickoff",
    description: "Note tes coéquipiers sur 3 axes : technique, physique, collectif",
  };
}

/**
 * Loading skeleton for user rating page
 */
function RatingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-5 w-64 bg-muted rounded" />
      </div>

      {/* Player cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 h-56 bg-muted" />
        ))}
      </div>
    </div>
  );
}

/**
 * User rating page - requires authentication
 * Server Component for fast initial load
 * Per PLAN 06-02 Task 3 requirements:
 * - Uses session.user.id for identification
 * - Verifies match status is "played" and user attended
 * - Fetches players and existing ratings
 * - Renders RatingForm with isGuest=false
 * - Redirects unauthenticated users to login
 */
export default async function UserRatingPage({ params }: PageProps) {
  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    const { id: matchId } = await params;
    redirect(`/login?redirect=/match/${matchId}/rate`);
  }

  const { id: matchId } = await params;

  // Fetch match by matchId
  let match;
  try {
    match = await getMatchById(matchId);
  } catch (error) {
    notFound();
  }

  // Verify match status is "played" or "rated"
  const canRate = match.status === "played" || match.status === "rated";

  if (!canRate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center space-y-4">
          <FootballIcon name="card" size={40} className="mx-auto text-yellow-card" />
          <h1 className="text-xl font-semibold text-foreground">
            Match pas encore terminé
          </h1>
          <p className="text-muted-foreground">
            Ce match n'est pas encore terminé. Tu ne peux pas noter les joueurs pour le moment.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = `/match/${matchId}`)}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Verify user participated (attended=true)
  const { matchPlayers } = await import("@/db/schema");
  const { db } = await import("@/db");
  const { eq, and } = await import("drizzle-orm");

  const [userRecord] = await db
    .select()
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.userId, session.user.id),
        eq(matchPlayers.attended, true)
      )
    )
    .limit(1);

  if (!userRecord) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center space-y-4">
          <FootballIcon name="card" size={40} className="mx-auto text-red-card" />
          <h1 className="text-xl font-semibold text-foreground">
            Tu n'étais pas présent
          </h1>
          <p className="text-muted-foreground">
            Tu n'étais pas présent à ce match. Seuls les joueurs ayant participé peuvent noter leurs coéquipiers.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = `/match/${matchId}`)}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch players to rate (excluding self)
  const players = await getMatchPlayersForRating(matchId, session.user.id);

  if (players.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center space-y-4">
          <FootballIcon name="card" size={40} className="mx-auto text-yellow-card" />
          <h1 className="text-xl font-semibold text-foreground">
            Aucun joueur à noter
          </h1>
          <p className="text-muted-foreground">
            Il n'y a aucun autre joueur à noter pour ce match.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = `/match/${matchId}`)}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch existing ratings
  const existingRatings = await getExistingRatings(matchId, session.user.id);

  // Fetch rating progress for UI display
  // Per PLAN 06-03 Task 4: getMatchRatingProgress combines raters and confirmed counts
  const ratingProgress = await getMatchRatingProgress(matchId);

  return (
    <main className="min-h-screen bg-chalk pb-safe">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Page header */}
        <header className="mb-6 space-y-1">
          <p className="text-sm text-muted-foreground font-mono">
            Match du {format(match.date, "dd MMMM 'à' HH:mm", { locale: fr })}
          </p>
          <p className="text-xs text-muted-foreground">
            {match.location}
          </p>
        </header>

        {/* Rating form */}
        <RatingForm
          matchId={matchId}
          players={players.map((p) => ({
            id: p.id,
            name: p.name || "Joueur",
            avatar: p.id,
          }))}
          existingRatings={existingRatings}
          isGuest={false}
          submitRatings={submitRatings}
          ratingProgress={ratingProgress}
        />
      </div>
    </main>
  );
}
