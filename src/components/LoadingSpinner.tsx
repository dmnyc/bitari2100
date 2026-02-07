import { AtariLoadingBar } from "./atari/AtariLoadingBar";

interface LoadingSpinnerProps {
  text?: string;
  size?: string;
}

/**
 * Atari-styled loading indicator (replaces glow-web spinner).
 * Used as the default loading state throughout the app.
 */
export default function LoadingSpinner({
  text,
  size: _size,
}: LoadingSpinnerProps = {}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="font-pixel text-base text-atari-midgray tracking-wider animate-title-blink">
        {text || "LOADING..."}
      </div>
      <div className="w-40">
        <AtariLoadingBar />
      </div>
    </div>
  );
}
