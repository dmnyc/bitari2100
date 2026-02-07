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
 */
export function AtariConsole({ children, boot = false }: AtariConsoleProps) {
  return (
    <>
      {/* Desktop: 4:3 centered viewport */}
      <div className="hidden md:flex items-center justify-center min-h-screen bg-black">
        <div className="viewport-4x3">
          <CRTOverlay boot={boot}>
            <div className="viewport-content relative z-10 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </CRTOverlay>
        </div>
      </div>

      {/* Mobile: full vertical */}
      <div className="md:hidden min-h-screen min-h-[100dvh]">
        <CRTOverlay boot={boot}>
          <div className="relative z-10 min-h-screen min-h-[100dvh] overflow-y-auto">
            {children}
          </div>
        </CRTOverlay>
      </div>
    </>
  );
}
