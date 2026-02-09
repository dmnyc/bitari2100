import { ReactNode } from "react";
import { MuteButton } from "../atari/MuteButton";

interface PageLayoutProps {
  children: ReactNode;
  /** Optional page title shown at top */
  title?: string;
  /** Optional back button handler */
  onBack?: () => void;
}

/**
 * Standard page layout with optional Atari-styled header.
 */
export default function PageLayout({
  children,
  title,
  onBack,
}: PageLayoutProps) {
  return (
    <div className="flex flex-col h-[100dvh]">
      {(title || onBack) && (
        <div className="flex items-center p-3 border-b-2 border-dashed border-atari-darkgray">
          {onBack && (
            <button
              onClick={onBack}
              className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
            >
              {"<"}
              <span className="hidden sm:inline"> BACK</span>
            </button>
          )}
          {title && (
            <span className="flex-1 text-center font-pixel text-sm sm:text-lg text-atari-bright uppercase tracking-wider">
              {title}
            </span>
          )}
          <MuteButton />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
