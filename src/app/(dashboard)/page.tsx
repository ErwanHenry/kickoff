import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Dashboard | kickoff",
  description: "Gere tes matchs de foot",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenue sur kickoff</h1>
        <p className="text-muted-foreground">
          Ton dashboard pour organiser tes matchs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commence ici</CardTitle>
          <CardDescription>
            Cree ton premier match et invite tes potes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/matches/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            Creer un match
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Cette fonctionnalite arrive dans la Phase 2.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines etapes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Phase 1: Fondations (tu es la)</p>
          <p>Phase 2: Creation de matchs et RSVP</p>
          <p>Phase 3: Waitlist et dashboard</p>
          <p>Phase 4: Team balancing</p>
        </CardContent>
      </Card>
    </div>
  );
}
