import { ReactNode } from 'react';

interface CRTOverlayProps {
  children: ReactNode;
  /** Show the CRT power-on animation */
  boot?: boolean;
}

/**
 * CRT display overlay that wraps content with authentic scanlines,
 * vignette, and optional power-on animation.
 */
export function CRTOverlay({ children, boot = false }: CRTOverlayProps) {
  return (
    <div
      className={`
        crt-screen crt-scanlines crt-vignette crt-scanline-bar crt-flicker
        relative min-h-full
        ${boot ? 'crt-boot' : ''}
      `}
    >
      {children}
    </div>
  );
}
