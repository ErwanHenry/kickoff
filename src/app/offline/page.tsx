export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">📵</div>
        <h1 className="text-2xl font-bold">Hors ligne</h1>
        <p className="text-muted-foreground">
          Tu n&apos;as pas de connexion internet.
          <br />
          Reconnecte-toi pour continuer.
        </p>
      </div>
    </div>
  );
}
