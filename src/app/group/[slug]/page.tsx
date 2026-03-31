import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getGroupBySlug, getGroupLeaderboard, getGroupMatchHistory, getGroupMembers } from "@/lib/db/queries/groups";
import { Leaderboard } from "@/components/group/leaderboard";
import { MatchHistory } from "@/components/group/match-history";
import { MembersList } from "@/components/group/members-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FootballIcon } from "@/components/icons/football-icons";
import { Copy, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CopyInviteButton } from "./copy-invite-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate OG metadata for group page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const group = await getGroupBySlug(slug);

    return {
      title: `${group.name} - kickoff`,
      description: `Classement et matchs du groupe ${group.name}`,
      openGraph: {
        title: `${group.name} - Groupe kickoff`,
        description: `${group.memberCount} membres • Rejoins le groupe avec le code ${group.inviteCode}`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Groupe non trouvé | kickoff",
    };
  }
}

/**
 * Group page - Server Component for data fetching
 * Displays group leaderboard, match history, and members list with tabbed navigation
 */
export default async function GroupPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch all data in parallel
  try {
    const [group, leaderboard, matches, members] = await Promise.all([
      getGroupBySlug(slug),
      getGroupLeaderboard((await getGroupBySlug(slug)).id),
      getGroupMatchHistory((await getGroupBySlug(slug)).id, 20),
      getGroupMembers((await getGroupBySlug(slug)).id),
    ]);

    const createdDate = format(new Date(group.createdAt), "MMMM yyyy", { locale: fr });

    return (
      <main className="min-h-screen bg-chalk pb-safe">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Header section */}
          <div className="space-y-4">
            {/* Back button */}
            <Link
              href="/dashboard/groups"
              className="inline-flex items-center gap-2 text-sm text-slate-mid hover:text-pitch transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Mes groupes</span>
            </Link>

            {/* Group name */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight font-sans text-pitch">
                {group.name}
              </h1>
              <p className="text-sm text-slate-mid">
                {group.memberCount} membre{group.memberCount > 1 ? "s" : ""} • Créé en {createdDate}
              </p>
            </div>

            {/* Invite code card */}
            <div className="bg-chalk-pure shadow-card rounded-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FootballIcon name="cornerFlag" size={20} className="text-pitch" />
                  <div>
                    <p className="text-sm font-medium text-pitch">Code d'invitation</p>
                    <p className="text-lg font-mono font-semibold text-pitch">{group.inviteCode}</p>
                  </div>
                </div>
                <CopyInviteButton inviteCode={group.inviteCode} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted">
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-background">
                Classement
              </TabsTrigger>
              <TabsTrigger value="matches" className="data-[state=active]:bg-background">
                Matchs
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-background">
                Membres
              </TabsTrigger>
            </TabsList>

            {/* Leaderboard tab */}
            <TabsContent value="leaderboard" className="mt-4">
              <Leaderboard groupId={group.id} leaderboard={leaderboard} />
            </TabsContent>

            {/* Matches tab */}
            <TabsContent value="matches" className="mt-4">
              <MatchHistory matches={matches} />
            </TabsContent>

            {/* Members tab */}
            <TabsContent value="members" className="mt-4">
              <MembersList members={members} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    );
  } catch (error) {
    notFound();
  }
}
