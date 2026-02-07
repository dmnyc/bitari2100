type SpriteIconName =
  | 'send'
  | 'receive'
  | 'scan'
  | 'settings'
  | 'lightning'
  | 'bitcoin'
  | 'spark'
  | 'backup'
  | 'logout'
  | 'menu'
  | 'warning'
  | 'close';

interface SpriteIconProps {
  name: SpriteIconName;
  size?: 16 | 24 | 32;
  /** Enable 2-frame flicker effect (simulates TIA sprite multiplexing) */
  flicker?: boolean;
  className?: string;
}

/**
 * Renders pixel-art icons as text characters.
 * Uses Unicode/emoji-free text symbols for authentic Atari feel.
 * Phase 2 can upgrade to actual sprite sheet PNGs.
 */
const ICON_CHARS: Record<SpriteIconName, string> = {
  send:      '>',
  receive:   '<',
  scan:      '#',
  settings:  '*',
  lightning: '!',
  bitcoin:   'B',
  spark:     '~',
  backup:    '=',
  logout:    'X',
  menu:      '=',
  warning:   '!',
  close:     'X',
};

const ICON_COLORS: Record<SpriteIconName, string> = {
  send:      'text-atari-blue',
  receive:   'text-atari-green',
  scan:      'text-atari-orange',
  settings:  'text-atari-lightgray',
  lightning: 'text-atari-yellow',
  bitcoin:   'text-atari-orange',
  spark:     'text-atari-blue-lit',
  backup:    'text-atari-lightgray',
  logout:    'text-atari-red',
  menu:      'text-atari-lightgray',
  warning:   'text-atari-yellow',
  close:     'text-atari-midgray',
};

export function SpriteIcon({ name, size = 16, flicker = false, className = '' }: SpriteIconProps) {
  const fontSize = size === 32 ? 'text-2xl' : size === 24 ? 'text-xl' : 'text-base';

  return (
    <span
      className={`
        font-pixel ${fontSize} ${ICON_COLORS[name]}
        inline-flex items-center justify-center
        ${flicker ? 'sprite-flicker' : ''}
        ${className}
      `}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {ICON_CHARS[name]}
    </span>
  );
}
