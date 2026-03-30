import { InstallPrompt } from "@/components/install-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Per D-10: Install prompt appears after login */}
      <InstallPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-primary">kickoff</span>
          </div>
          <div className="flex-1" />
          {/* User menu will be added in Phase 2 */}
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
}
