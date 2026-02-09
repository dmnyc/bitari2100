import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { PixelBolt } from "./PixelBolt";

interface ScoreDisplayProps {
  /** Balance in sats */
  sats: number;
  /** Optional fiat string like "$567.89 USD" */
  fiat?: string;
  /** Compact mode for collapsed header */
  compact?: boolean;
}

/**
 * Displays the wallet balance as an Atari game score counter.
 * Rolling digit animation on value changes.
 */
export function ScoreDisplay({
  sats,
  fiat,
  compact = false,
}: ScoreDisplayProps) {
  const animatedSats = useAnimatedNumber(sats);
  const formattedSats = animatedSats.toLocaleString();

  if (compact) {
    return (
      <div className="score-display py-2">
        <span className="score-value text-lg">{formattedSats}</span>
        <PixelBolt size={14} className="ml-2" />
      </div>
    );
  }

  return (
    <div className="score-display">
      <div className="score-label">SCORE</div>
      <div className="flex items-center justify-center gap-2">
        <div className="score-value">{formattedSats}</div>
        <PixelBolt size={20} />
      </div>
      {fiat && <div className="score-fiat">~{fiat}</div>}
    </div>
  );
}
