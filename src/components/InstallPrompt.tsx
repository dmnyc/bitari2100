import { useState, useEffect, useRef } from "react";
import { AtariButton } from "./atari/AtariButton";
import { PixelBorder } from "./atari/PixelBorder";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA install prompt in Atari style.
 */
export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center">
      <PixelBorder variant="blue" className="max-w-md w-full p-3">
        <div className="font-pixel text-base text-atari-lightgray mb-3">
          INSTALL BITARI 2100 FOR THE FULL EXPERIENCE
        </div>
        <div className="flex gap-2 justify-center">
          <AtariButton variant="primary" onClick={handleInstall}>
            INSTALL
          </AtariButton>
          <AtariButton variant="secondary" onClick={() => setShow(false)}>
            LATER
          </AtariButton>
        </div>
      </PixelBorder>
    </div>
  );
}
