import { ReactNode } from "react";

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
    <div className="flex flex-col min-h-full">
      {(title || onBack) && (
        <div className="flex items-center gap-3 p-4 border-b-3 border-dashed border-atari-darkgray">
          {onBack && (
            <button
              onClick={onBack}
              className="font-pixel text-base text-atari-midgray hover:text-atari-orange"
            >
              {"<"} BACK
            </button>
          )}
          {title && (
            <span className="font-pixel text-lg text-atari-bright uppercase tracking-wider">
              {title}
            </span>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
