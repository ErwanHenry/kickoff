import { notFound, redirect } from "next/navigation";
import { getMatchById } from "@/lib/db/queries/match-by-id";
import { getConfirmedPlayersForAttendance } from "@/lib/db/queries/matches";
import { closeMatch } from "@/lib/actions/close-match";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AttendanceForm } from "@/components/match/attendance-form";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Clôture du match",
  description: "Marque la présence et entre le score final",
};

function AttendanceFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Score section skeleton */}
      <Card className="p-4 h-32 bg-muted" />

      {/* Attendance list skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 h-14 bg-muted" />
          ))}
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    </div>
  );
}

export default async function AttendancePage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: matchId } = await params;

  try {
    // Fetch match and verify it exists
    const match = await getMatchById(matchId);

    // Verify user is match creator (D-12: only creator can close)
    if (match.createdBy !== session.user.id) {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Accès non autorisé
            </h1>
            <p className="text-muted-foreground mb-4">
              Seul le créateur du match peut le clôturer.
            </p>
            <a
              href={`/match/${matchId}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retour au match
            </a>
          </Card>
        </div>
      );
    }

    // Check if match is already played (show warning per D-11)
    if (match.status === "played") {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Match déjà clôturé
            </h1>
            <p className="text-muted-foreground mb-4">
              Ce match a déjà été clôturé. Vous ne pouvez pas le modifier.
            </p>
            <a
              href={`/match/${matchId}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Voir le match
            </a>
          </Card>
        </div>
      );
    }

    // Fetch confirmed players for attendance marking
    const players = await getConfirmedPlayersForAttendance(matchId);

    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 pb-24">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Clôture du match
          </h1>
          <p className="text-muted-foreground mt-1">
            {match.title || `Match du ${format(match.date, "PPP 'à' HH:mm", { locale: fr })}`}
          </p>
        </header>

        <AttendanceForm
          players={players}
          matchId={matchId}
          closeMatchAction={closeMatch}
        />
      </div>
    );
  } catch (error) {
    // Match not found
    notFound();
  }
}
