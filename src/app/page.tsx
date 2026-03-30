import Link from "next/link";
import { Send, Scale, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            kickoff
          </h1>

          {/* Per D-07: Problem + solution headline */}
          <p className="text-xl md:text-2xl text-foreground">
            Fini le bordel sur WhatsApp.
            <br />
            <span className="text-muted-foreground">
              Cree ton match, partage le lien.
            </span>
          </p>

          {/* Per D-09: Primary CTA */}
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-medium px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              C&apos;est parti !
            </Link>
          </div>
        </div>
      </section>

      {/* Per D-08: 3 feature icons */}
      <section className="px-4 py-12 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Send className="h-10 w-10 text-primary" />}
              title="Inviter"
              description="Partage un lien. Tes potes confirment en 1 tap, sans compte."
            />
            <FeatureCard
              icon={<Scale className="h-10 w-10 text-primary" />}
              title="Equilibrer"
              description="L'algo forme des equipes equilibrees selon les notes."
            />
            <FeatureCard
              icon={<Star className="h-10 w-10 text-primary" />}
              title="Noter"
              description="Apres le match, note tes coequipiers. Le niveau monte."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p>kickoff — Organise tes matchs de foot</p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-3 p-6">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
