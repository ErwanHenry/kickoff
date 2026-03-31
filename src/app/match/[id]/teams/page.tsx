import { notFound } from 'next/navigation';
import { getMatchByShareToken } from '@/lib/db/queries/matches';
import { getMatchTeams } from '@/lib/db/queries/players';
import { generateTeams } from '@/lib/actions/teams';
import { TeamReveal } from '@/components/match/team-reveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { FootballIcon } from '@/components/icons/football-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamsPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatchByShareToken(id);

  if (!match) {
    notFound();
  }

  // Format match date for display
  const matchDate = format(new Date(match.date), 'EEEE d MMMM à HH:mm', { locale: fr });
  const matchTitle = match.title || `Match du ${matchDate}`;

  // If teams not generated yet, show generation button
  if (match.status !== 'locked') {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 text-pitch">Générer les équipes</h1>
          <p className="text-slate-600 mb-6">
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
            <Button type="submit" size="lg" className="bg-pitch hover:bg-pitch-light">
              Générer les équipes
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Fetch teams from database
  const teams = await getMatchTeams(id);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 bg-chalk min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FootballIcon name="centerCircle" size={24} className="text-pitch" />
          <h1 className="text-2xl font-bold text-pitch">{matchTitle}</h1>
        </div>
        <p className="text-slate-600 text-sm">
          {match.location} • {matchDate}
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Glissez-déposez les joueurs pour rééquilibrer les équipes
        </p>
      </div>

      {/* Teams display */}
      <TeamReveal
        matchId={id}
        initialTeams={teams}
        isLocked={false}
      />

      {/* Remélanger button */}
      <div className="mt-6 flex justify-center">
        <form action={async () => {
          'use server';
          const result = await generateTeams({ matchId: id });
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success('Équipes remélangées avec succès !');
          }
        }}>
          <Button type="submit" variant="outline" className="border-pitch text-pitch hover:bg-pitch hover:text-white">
            Remélanger
          </Button>
        </form>
      </div>
    </div>
  );
}
