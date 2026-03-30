import { notFound } from 'next/navigation';
import { getMatchByShareToken } from '@/lib/db/queries/matches';
import { generateTeams } from '@/lib/actions/teams';
import { TeamReveal } from '@/components/match/team-reveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { BalanceResult } from '@/lib/team-balancer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamsPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatchByShareToken(id);

  if (!match) {
    notFound();
  }

  // If teams not generated yet, show generation button
  if (match.status !== 'locked') {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Générer les équipes</h1>
          <p className="text-gray-600 mb-6">
            Les équipes n'ont pas encore été générées pour ce match.
          </p>
          <form action={async () => {
            'use server';
            const result = await generateTeams({ matchId: id });
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success('Équipes générées avec succès !');
            }
          }}>
            <Button type="submit" size="lg">
              Générer les équipes
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Fetch teams from database
  // TODO: Create getMatchTeams query in Wave 2
  // For now, use placeholder data
  const placeholderTeams: BalanceResult = {
    teamA: {
      players: [],
      totalScore: 0,
      playerCount: 0,
    },
    teamB: {
      players: [],
      totalScore: 0,
      playerCount: 0,
    },
    diff: 0,
    algorithm: 'brute-force',
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Équipes</h1>
        <p className="text-gray-600">
          Glissez-déposez les joueurs pour rééquilibrer les équipes
        </p>
      </div>

      <TeamReveal
        matchId={id}
        initialTeams={placeholderTeams}
        isLocked={true}
      />
    </div>
  );
}
