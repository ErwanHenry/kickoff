import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { getMatchByShareToken, getMatchPlayers, getWaitlistCount } from "@/lib/db/queries/matches";
import { PlayerList } from "@/components/match/player-list";
import { RSVPButton } from "@/components/match/rsvp-button";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

/**
 * Get match data with all related information
 * Returns null if match not found
 */
async function getMatchData(shareToken: string) {
  const match = await getMatchByShareToken(shareToken);

  if (!match) {
    return null;
  }

  const players = await getMatchPlayers(match.id);
  const waitlistCount = await getWaitlistCount(match.id);

  return { match, players, waitlistCount };
}

/**
 * Generate OG metadata for WhatsApp preview (SHARE-03)
 * Server-rendered for fast initial load and SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const data = await getMatchData(shareToken);

  if (!data) {
    return {
      title: "Match non trouvé | kickoff",
    };
  }

  const { match, players } = data;

  const confirmedCount = players.filter((p) => p.status === "confirmed").length;

  const title = match.title || `Match du ${format(match.date, "dd MMM", { locale: fr })}`;
  const description = `⚽ ${confirmedCount}/${match.maxPlayers} joueurs • 📍 ${match.location} • 📅 ${format(match.date, "EEE d MMM HH'h'mm", { locale: fr })}`;

  return {
    title: `${title} — kickoff`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Public match page - accessible without authentication
 * Server Component for fast initial load (SHARE-03 <1s on 3G)
 * Per RESEARCH.md "Pattern 2: Public Route with Server Component"
 */
export default async function PublicMatchPage({ params }: PageProps) {
  const { shareToken } = await params;
  const data = await getMatchData(shareToken);

  if (!data) {
    notFound();
  }

  const { match, players, waitlistCount } = data;

  // Get guest token from cookies for return visit detection (GUEST-04)
  const cookieStore = await cookies();
  const guestToken = cookieStore.get("kickoff_guest_token")?.value;

  // Find existing player for this guest
  const existingPlayer = players.find((p) => p.guestToken === guestToken);

  // Count confirmed players
  const confirmedCount = players.filter((p) => p.status === "confirmed").length;

  const isFull = confirmedCount >= match.maxPlayers;

  return (
    <main className="min-h-screen bg-background pb-safe">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Match information card (per CONTEXT.md D-09) */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {match.title || `Match du ${format(match.date, "dd MMMM", { locale: fr })}`}
            </h1>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CalendarDays className="size-5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  {format(match.date, "EEEE d MMMM", { locale: fr })}
                </p>
                <p className="text-xs">
                  {format(match.date, "HH'h'mm", { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="size-5 shrink-0" />
              <p className="font-medium text-foreground">{match.location}</p>
            </div>
          </div>
        </div>

        {/* Player list with progress ring */}
        <PlayerList
          players={players.filter((p) => p.status === "confirmed")}
          confirmed={confirmedCount}
          max={match.maxPlayers}
          waitlistCount={waitlistCount}
        />

        {/* RSVP button with state machine */}
        <RSVPButton
          matchId={match.id}
          shareToken={shareToken}
          isFull={isFull}
          existingPlayer={existingPlayer}
          guestToken={guestToken}
        />
      </div>
    </main>
  );
}
