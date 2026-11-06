"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const detection = window.setTimeout(() => {
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          ("standalone" in navigator &&
            (navigator as Navigator & { standalone?: boolean }).standalone === true),
      );
      setIsIOS(
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      );
    }, 0);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(detection);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isStandalone || (!installPrompt && !isIOS)) return null;

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      setShowIOSHelp((show) => !show);
    }
  }

  return (
    <div className="sm:text-right">
      <button
        type="button"
        onClick={install}
        className="rounded-md font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        Install app
      </button>
      {isIOS && showIOSHelp && (
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground sm:ml-auto">
          In Safari, tap Share, then choose “Add to Home Screen”.
        </p>
      )}
    </div>
  );
}
