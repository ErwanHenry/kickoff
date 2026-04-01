import { GroupForm } from "@/components/group/group-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Créer un groupe - kickoff",
  description: "Crée un groupe pour organiser des matchs récurrents avec tes potes",
};

/**
 * Group creation page
 * Per 08-01-PLAN.md: Mobile-first, max-w-2xl, breadcrumbs, back navigation
 * Auth protection handled by middleware.ts (/dashboard/* requires session)
 */
export default function NewGroupPage() {
  return (
    <div className="min-h-screen bg-chalk">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-chalk-pure/95 backdrop-blur supports-[backdrop-filter]:bg-chalk-pure/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="size-5" />
              <span className="sr-only">Retour aux groupes</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-mid">
            <span>Dashboard</span>
            <span className="text-slate-light">/</span>
            <span>Groupes</span>
            <span className="text-slate-light">/</span>
            <span className="font-medium text-pitch">Nouveau</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-semibold text-pitch">
            Créer un groupe
          </h1>
          <p className="text-sm text-slate-mid mt-1">
            Organise des matchs récurrents avec tes potes
          </p>
        </div>

        {/* Group Form - handles redirect internally */}
        <GroupForm />
      </main>
    </div>
  );
}
