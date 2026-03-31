import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { getMatchByShareToken } from "@/lib/db/queries/ratings";
import { getMatchPlayersForRating, getExistingRatings, getMatchRatingProgress } from "@/lib/db/queries/ratings";
import { GuestRatingWrapper } from "@/components/rating/guest-rating-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FootballIcon } from "@/components/icons/football-icons";
import { submitRatings } from "@/lib/actions/ratings";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

const GUEST_TOKEN_COOKIE = "kickoff_guest_token";

/**
 * Generate metadata for guest rating page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;

  return {
    title: "Noter le match — kickoff",
    description: "Note tes coéquipiers sur 3 axes : technique, physique, collectif",
  };
}

/**
 * Loading skeleton for guest rating page
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
 * Guest rating page - accessible without authentication
 * Server Component for fast initial load
 * Per PLAN 06-02 Task 2 requirements:
 * - Reads guest_token from cookies for identification
 * - Verifies match status is "played" and guest attended
 * - Fetches players and existing ratings
 * - Renders RatingForm with isGuest=true
 */
export default async function GuestRatingPage({ params }: PageProps) {
  const { shareToken } = await params;

  // Fetch match by shareToken
  const match = await getMatchByShareToken(shareToken);

  if (!match) {
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
            onClick={() => window.location.href = `/m/${shareToken}`}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Read guest_token from cookies
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;

  if (!guestToken) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6 text-center space-y-4">
          <FootballIcon name="card" size={40} className="mx-auto text-red-card" />
          <h1 className="text-xl font-semibold text-foreground">
            Non identifié
          </h1>
          <p className="text-muted-foreground">
            Tu n'es pas reconnu comme ayant participé à ce match.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/m/${shareToken}`}
          >
            Rejoindre le match
          </Button>
        </Card>
      </div>
    );
  }

  // Verify guest participated (attended=true)
  const { matchPlayers } = await import("@/db/schema");
  const { db } = await import("@/db");
  const { eq, and } = await import("drizzle-orm");

  const [guestRecord] = await db
    .select()
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, match.id),
        eq(matchPlayers.guestToken, guestToken),
        eq(matchPlayers.attended, true)
      )
    )
    .limit(1);

  if (!guestRecord) {
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
            onClick={() => window.location.href = `/m/${shareToken}`}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch players to rate (excluding self)
  const players = await getMatchPlayersForRating(match.id, guestToken);

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
            onClick={() => window.location.href = `/m/${shareToken}`}
          >
            Retour au match
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch existing ratings
  const existingRatings = await getExistingRatings(match.id, guestToken);

  // Fetch rating progress for UI display
  // Per PLAN 06-03 Task 4: getMatchRatingProgress combines raters and confirmed counts
  const ratingProgress = await getMatchRatingProgress(match.id);

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

        {/* Rating form with guest CTA */}
        <GuestRatingWrapper
          matchId={match.id}
          shareToken={shareToken}
          players={players.map((p) => ({
            id: p.id,
            name: p.name || "Joueur",
            avatar: p.id,
          }))}
          existingRatings={existingRatings}
          submitRatings={submitRatings}
          ratingProgress={ratingProgress}
        />
      </div>
    </main>
  );
}
