import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("pwa-banner-dismissed");
    if (saved) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-safe pointer-events-none">
      <div className="max-w-md mx-auto px-4 pt-3 pointer-events-auto">
        <div className="bg-card border border-card-border rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Install Trip Tracker</p>
            <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
          </div>
          <button
            onClick={handleInstall}
            className="text-xs font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg shrink-0"
          >
            Install
          </button>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
