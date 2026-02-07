import { useEffect } from 'react';

interface PaymentReceivedCelebrationProps {
  amount: number;
  onClose: () => void;
}

/**
 * "HIGH SCORE!" victory screen shown when a payment is received.
 * Replaces glow-web's confetti celebration with Atari-style fanfare.
 */
export default function PaymentReceivedCelebration({ amount, onClose }: PaymentReceivedCelebrationProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="celebration-overlay" onClick={onClose}>
      <div className="celebration-stars">
        * * * * * * * * * * * *
      </div>
      <div className="celebration-title">
        HIGH SCORE!
      </div>
      <div className="celebration-amount">
        +{amount.toLocaleString()} SATS
      </div>
      <div className="celebration-stars">
        * * * * * * * * * * * *
      </div>
      <div className="font-pixel text-base text-atari-midgray mt-8 animate-title-blink">
        TAP TO CONTINUE
      </div>
    </div>
  );
}
