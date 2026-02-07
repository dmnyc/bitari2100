interface AtariLoadingBarProps {
  /** 0-100 for determinate, undefined for indeterminate */
  progress?: number;
  /** Optional label above the bar */
  label?: string;
}

/**
 * Retro loading progress bar with stepped fill animation.
 */
export function AtariLoadingBar({ progress, label }: AtariLoadingBarProps) {
  const indeterminate = progress === undefined;

  return (
    <div className="w-full">
      {label && (
        <div className="font-pixel text-base text-atari-midgray mb-2 text-center uppercase tracking-wider">
          {label}
        </div>
      )}
      <div className={`atari-loading-bar ${indeterminate ? 'atari-loading-indeterminate' : ''}`}>
        <div
          className="atari-loading-fill"
          style={indeterminate ? undefined : { width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
