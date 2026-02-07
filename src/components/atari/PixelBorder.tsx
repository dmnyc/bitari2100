import { ReactNode } from 'react';

type PixelBorderVariant = 'default' | 'orange' | 'blue' | 'green' | 'double';

interface PixelBorderProps {
  children: ReactNode;
  variant?: PixelBorderVariant;
  className?: string;
}

const variantClasses: Record<PixelBorderVariant, string> = {
  default: 'pixel-border',
  orange:  'pixel-border pixel-border-orange',
  blue:    'pixel-border pixel-border-blue',
  green:   'pixel-border pixel-border-green',
  double:  'pixel-border-double bg-atari-black',
};

/**
 * Container with Atari-style pixel borders.
 */
export function PixelBorder({ children, variant = 'default', className = '' }: PixelBorderProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
