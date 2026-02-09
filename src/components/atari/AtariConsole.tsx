import { ReactNode } from "react";
import { CRTOverlay } from "./CRTOverlay";

interface AtariConsoleProps {
  children: ReactNode;
  showControls?: boolean;
  boot?: boolean;
}

/**
 * Desktop: 4:3 viewport centered on screen with black letterboxing.
 * Mobile: full-screen vertical layout.
 *
 * Single DOM tree — CSS handles the layout switch so children mount only once.
 */
export function AtariConsole({ children, boot = false }: AtariConsoleProps) {
  return (
    <div className="atari-console-shell">
      <div className="atari-console-viewport">
        <CRTOverlay boot={boot}>
          <div className="atari-console-content">{children}</div>
        </CRTOverlay>
      </div>
    </div>
  );
}
