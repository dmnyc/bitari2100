import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

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
export function ScoreDisplay({ sats, fiat, compact = false }: ScoreDisplayProps) {
  const animatedSats = useAnimatedNumber(sats);
  const formattedSats = animatedSats.toLocaleString();

  if (compact) {
    return (
      <div className="score-display py-2">
        <span className="score-value text-lg">{formattedSats}</span>
        <span className="font-pixel text-base text-atari-midgray ml-2">SATS</span>
      </div>
    );
  }

  return (
    <div className="score-display">
      <div className="score-label">SCORE</div>
      <div className="score-value">{formattedSats}</div>
      <div className="font-pixel text-lg text-atari-lightgray mt-1">SATS</div>
      {fiat && <div className="score-fiat">~{fiat}</div>}
    </div>
  );
}
