import { MatchForm } from "@/components/match/match-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Créer un match | kickoff",
  description: "Crée un nouveau match de foot et invite tes amis",
};

/**
 * Match creation page
 * Per 02-UI-SPEC.md: Mobile-first layout, max-w-md
 */
export default function NewMatchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="size-5" />
              <span className="sr-only">Retour</span>
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Créer un match</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-md mx-auto px-4 py-6">
        <MatchForm />
      </main>
    </div>
  );
}
