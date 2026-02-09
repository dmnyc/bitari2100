import { useEffect } from "react";
import { playCelebration } from "../services/tiaSoundService";

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
        <svg
          width="18"
          height="24"
          viewBox="0 0 6 8"
          shapeRendering="crispEdges"
        >
          <rect x="1" y="0" width="4" height="1" fill="#ffff55" />
          <rect x="1" y="1" width="3" height="1" fill="#ffff55" />
          <rect x="0" y="2" width="3" height="1" fill="#ffff55" />
          <rect x="0" y="3" width="5" height="1" fill="#ffff55" />
          <rect x="2" y="4" width="2" height="1" fill="#ffff55" />
          <rect x="1" y="5" width="2" height="1" fill="#ffff55" />
          <rect x="0" y="6" width="2" height="1" fill="#ffff55" />
        </svg>
        {amount.toLocaleString()}
      </div>
      <div className="celebration-stars">* * * * * * * * * * * *</div>
      <div className="font-pixel text-base text-atari-midgray mt-8 animate-title-blink">
        TAP TO CONTINUE
      </div>
    </div>
  );
}
