import { useEffect } from "react";
import { playCelebration } from "../services/tiaSoundService";
import { PixelArrowDown } from "./atari/PixelBolt";

interface PaymentReceivedCelebrationProps {
  amount: number;
  onClose: () => void;
}

/**
 * "BONUS!" victory screen shown when a payment is received.
 * Replaces glow-web's confetti celebration with Atari-style fanfare.
 */
export default function PaymentReceivedCelebration({
  amount,
  onClose,
}: PaymentReceivedCelebrationProps) {
  // Play celebration fanfare on mount
  useEffect(() => {
    playCelebration();
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="celebration-overlay" onClick={onClose}>
      <div className="celebration-stars">* * * * * * * * * * * *</div>
      <div className="celebration-title">YOU SCORED!</div>
      <div
        className="celebration-amount"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        +
        <PixelArrowDown size={24} />
        {amount.toLocaleString()}
      </div>
      <div className="celebration-stars">* * * * * * * * * * * *</div>
      <div className="font-pixel text-base text-atari-midgray mt-8 animate-title-blink">
        TAP TO CONTINUE
      </div>
    </div>
  );
}
