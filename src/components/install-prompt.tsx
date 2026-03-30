"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );

    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Check if previously dismissed
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("install-prompt-dismissed", "true");
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || isDismissed) {
    return null;
  }

  // iOS-specific instructions
  if (isIOS && !deferredPrompt) {
    return (
      <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">Installe kickoff</CardTitle>
          <CardDescription>Pour un acces rapide depuis ton ecran d&apos;accueil</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Appuie sur{" "}
            <span className="inline-flex items-center px-1.5 py-0.5 bg-muted rounded text-xs">
              Partager
            </span>{" "}
            puis &quot;Sur l&apos;ecran d&apos;accueil&quot;
          </p>
        </CardContent>
      </Card>
    );
  }

  // Standard install prompt
  if (deferredPrompt) {
    return (
      <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">Installe kickoff</CardTitle>
          <CardDescription>Acces rapide depuis ton ecran d&apos;accueil</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInstall} className="w-full">
            Installer l&apos;app
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
