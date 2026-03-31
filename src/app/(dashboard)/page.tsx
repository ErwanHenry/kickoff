import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { matches, matchPlayers } from "@/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { MatchCard } from "@/components/match/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileNav } from "@/components/layout/mobile-nav";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { FootballIcon } from "@/components/icons/football-icons";

export const metadata = {
  title: "Dashboard | kickoff",
  description: "Gère tes matchs de foot",
};

/**
 * Dashboard page
 * Shows upcoming match, recent matches, and navigation
 * Protected route - redirects to /login if not authenticated
 *
 * Per REQUIREMENTS.md MATCH-07 and Phase 3 dashboard requirements
 */
export default async function DashboardPage() {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's matches ordered by date
  const userMatches = await db
    .select({
      id: matches.id,
      title: matches.title,
      location: matches.location,
      date: matches.date,
      maxPlayers: matches.maxPlayers,
      status: matches.status,
      shareToken: matches.shareToken,
      createdAt: matches.createdAt,
    })
    .from(matches)
    .where(eq(matches.createdBy, session.user.id))
    .orderBy(desc(matches.date));

  // Get confirmed counts for all matches
  const matchesWithCounts = await Promise.all(
    userMatches.map(async (match) => {
      const [confirmedCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, match.id),
            eq(matchPlayers.status, "confirmed")
          )
        );

      return {
        ...match,
        confirmedCount: confirmedCount?.count ?? 0,
      };
    })
  );

  // Separate into upcoming and recent
  const now = new Date();
  const upcoming = matchesWithCounts.filter(
    (m) => m.date >= now && ["draft", "open", "full"].includes(m.status)
  );
  const recent = matchesWithCounts
    .filter((m) => m.date < now || ["locked", "played", "rated"].includes(m.status))
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      {/* Header with user greeting and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salut {session.user.name} 👋</h1>
          <p className="text-muted-foreground">
            Prêt pour le prochain match ?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/matches/new">
            <Button className="bg-primary hover:bg-primary/90">
              <FootballIcon name="centerCircle" size={16} className="mr-2" />
              Nouveau match
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/signout">Déconnexion</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Upcoming match section */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Prochain match</h2>
        {upcoming.length > 0 && upcoming[0] ? (
          <MatchCard match={upcoming[0]} variant="upcoming" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aucun match à venir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crée ton premier match et invite tes potes !
              </p>
              <Link href="/matches/new">
                <Button className="w-full">
                  <FootballIcon name="centerCircle" size={16} className="mr-2" />
                  Créer un match
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent matches section */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Mes matchs</h2>
            {recent.length >= 5 && (
              <Link href="/dashboard/matches">
                <Button variant="ghost" size="sm">Voir tout</Button>
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {recent.map((match) => (
              <MatchCard key={match.id} match={match} variant="recent" />
            ))}
          </div>
        </section>
      )}

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}
