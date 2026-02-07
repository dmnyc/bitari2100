import { useState, useEffect } from 'react';
import { AtariButton } from './atari/AtariButton';
import { PixelBorder } from './atari/PixelBorder';

/**
 * Notification permission prompt in Atari style.
 * Shows once after wallet connects if notifications not yet granted.
 */
export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
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
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center">
      <PixelBorder variant="orange" className="max-w-md w-full p-3">
        <div className="font-pixel text-base text-atari-lightgray mb-3">
          ENABLE NOTIFICATIONS TO GET ALERTS WHEN PAYMENTS ARRIVE
        </div>
        <div className="flex gap-2">
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
