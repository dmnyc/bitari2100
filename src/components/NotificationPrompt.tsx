import { useState, useEffect } from "react";
import { AtariButton } from "./atari/AtariButton";
import { PixelBorder } from "./atari/PixelBorder";

/**
 * Notification permission prompt in Atari style.
 * Shows once after wallet connects if notifications not yet granted.
 */
export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Delay showing prompt
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const handleAllow = async () => {
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission errors
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <PixelBorder variant="orange" className="max-w-sm w-full p-4">
        <div className="font-pixel text-sm sm:text-base text-atari-lightgray mb-4 text-center">
          ENABLE NOTIFICATIONS TO GET ALERTS WHEN PAYMENTS ARRIVE
        </div>
        <div className="flex gap-2 justify-center">
          <AtariButton variant="primary" onClick={handleAllow}>
            ALLOW
          </AtariButton>
          <AtariButton variant="secondary" onClick={() => setShow(false)}>
            LATER
          </AtariButton>
        </div>
      </PixelBorder>
    </div>
  );
}
