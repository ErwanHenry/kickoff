import { AuthTabs } from "@/components/auth/auth-tabs";

export const metadata = {
  title: "Connexion | kickoff",
  description: "Connecte-toi ou cree ton compte kickoff",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">kickoff</h1>
        <p className="text-muted-foreground mt-2">
          Organise tes matchs de foot
        </p>
      </div>
      <AuthTabs />
    </div>
  );
}
