import React, { useEffect, useRef, useState } from "react";

// --- Sprite data format ---

interface SpriteDefinition {
  name: string;
  width: number;
  height: number;
  pixelSize: number;
  palette: string[]; // 0 = transparent, 1+ = colors
  bitmap: number[];
}

// --- 8-bit sprite designs ---

const ALIEN_INVADER: SpriteDefinition = {
  name: "alien",
  width: 8,
  height: 8,
  pixelSize: 4,
  palette: ["", "#407c40", "#5c9c5c"],
  // prettier-ignore
  bitmap: [
    0,0,1,0,0,1,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,2,1,1,2,1,0,
    0,1,1,1,1,1,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,1,1,0,0,1,
    0,1,0,0,0,0,1,0,
  ],
};

const UFO: SpriteDefinition = {
  name: "ufo",
  width: 10,
  height: 6,
  pixelSize: 4,
  palette: ["", "#505cc0", "#3840b0", "#a0a034"],
  // prettier-ignore
  bitmap: [
    0,0,0,0,1,1,0,0,0,0,
    0,0,0,1,2,2,1,0,0,0,
    0,1,1,1,1,1,1,1,1,0,
    1,3,1,1,1,1,1,1,3,1,
    0,0,1,1,1,1,1,1,0,0,
    0,0,0,1,0,0,1,0,0,0,
  ],
};

const ASTEROID: SpriteDefinition = {
  name: "asteroid",
  width: 8,
  height: 8,
  pixelSize: 3,
  palette: ["", "#6c6c6c", "#909090", "#404040"],
  // prettier-ignore
  bitmap: [
    0,0,1,1,1,0,0,0,
    0,1,2,2,1,1,0,0,
    1,2,2,3,1,2,1,0,
    1,1,3,1,2,2,1,1,
    1,2,1,1,3,1,2,1,
    0,1,2,1,1,2,1,0,
    0,0,1,1,1,1,0,0,
    0,0,0,1,1,0,0,0,
  ],
};

const SATURN: SpriteDefinition = {
  name: "saturn",
  width: 12,
  height: 10,
  pixelSize: 3,
  palette: ["", "#ac5030", "#c06848", "#d4884c"],
  // prettier-ignore
  bitmap: [
    0,0,0,0,1,1,1,0,0,0,0,0,
    0,0,0,1,2,2,2,1,0,0,0,0,
    0,0,1,2,3,2,2,2,1,0,0,0,
    3,0,1,2,2,2,2,2,1,0,3,0,
    0,3,0,1,2,2,2,1,0,3,0,0,
    0,0,3,1,2,2,2,1,3,0,0,0,
    0,0,0,1,1,2,1,1,0,0,0,0,
    0,0,0,0,1,1,1,0,0,0,0,0,
    0,0,0,0,0,1,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,
  ],
};

const SATELLITE: SpriteDefinition = {
  name: "satellite",
  width: 10,
  height: 8,
  pixelSize: 3,
  palette: ["", "#505cc0", "#909090", "#ac5030"],
  // prettier-ignore
  bitmap: [
    0,0,0,0,3,0,0,0,0,0,
    0,0,0,0,3,0,0,0,0,0,
    1,1,0,2,2,2,0,1,1,0,
    1,1,0,2,3,2,0,1,1,0,
    1,1,0,2,2,2,0,1,1,0,
    0,0,0,0,2,0,0,0,0,0,
    0,0,0,0,2,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ],
};

const COMET: SpriteDefinition = {
  name: "comet",
  width: 10,
  height: 3,
  pixelSize: 3,
  palette: ["", "#d4d4d4", "#909090", "#6c6c6c"],
  // prettier-ignore
  bitmap: [
    0,0,0,0,0,0,0,3,1,0,
    3,3,3,2,2,1,1,1,1,1,
    0,0,0,0,0,0,0,3,1,0,
  ],
};

// --- Pixel sprite renderer ---

function PixelSprite({ sprite }: { sprite: SpriteDefinition }) {
  return (
    <div
      className="inline-grid"
      style={{
        gridTemplateColumns: `repeat(${sprite.width}, ${sprite.pixelSize}px)`,
        gridTemplateRows: `repeat(${sprite.height}, ${sprite.pixelSize}px)`,
        imageRendering: "pixelated",
      }}
    >
      {sprite.bitmap.map((colorIdx, i) => (
        <div
          key={i}
          style={{
            width: sprite.pixelSize,
            height: sprite.pixelSize,
            background: colorIdx ? sprite.palette[colorIdx] : "transparent",
          }}
        />
      ))}
    </div>
  );
}

// --- Starfield data (generated once) ---

const WARP_STARS = Array.from({ length: 30 }, (_, i) => {
  const angle = Math.random() * Math.PI * 2;
  // How far from center to fly (in vw/vh units)
  const dist = 80 + Math.random() * 40; // 80-120
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  const delay = Math.random() * -12; // negative = already in progress
  const layer = i < 12 ? "far" : i < 22 ? "mid" : "near";
  return { dx, dy, delay, layer } as const;
});

const LAYER_CONFIG = {
  far: { size: "1px", duration: 12, opacity: 0.4, color: "#404040" },
  mid: { size: "2px", duration: 8, opacity: 0.6, color: "#6c6c6c" },
  near: { size: "3px", duration: 5, opacity: 0.9, color: "#909090" },
} as const;

// --- Flying sprite configuration ---

interface FlyingSprite {
  sprite: SpriteDefinition;
  top: number; // % from top
  duration: number; // seconds
  delay: number; // seconds (negative = already flying)
  direction: "left" | "right" | "diag-down" | "diag-up";
  scale?: number; // CSS scale factor, default 1
}

const FLYING_SPRITES: FlyingSprite[] = [
  {
    sprite: ALIEN_INVADER,
    top: 8,
    duration: 14,
    delay: -2,
    direction: "right",
    scale: 1.2,
  },
  {
    sprite: UFO,
    top: 72,
    duration: 10,
    delay: -8,
    direction: "left",
    scale: 1.5,
  },
  {
    sprite: ASTEROID,
    top: 0,
    duration: 28,
    delay: -6,
    direction: "diag-down",
    scale: 0.7,
  },
  {
    sprite: SATURN,
    top: 55,
    duration: 8,
    delay: -3,
    direction: "left",
    scale: 1.8,
  },
  {
    sprite: SATELLITE,
    top: 0,
    duration: 32,
    delay: -13,
    direction: "diag-up",
    scale: 0.6,
  },
  {
    sprite: COMET,
    top: 40,
    duration: 12,
    delay: -3,
    direction: "left",
    scale: 1,
  },
  {
    sprite: ASTEROID,
    top: 82,
    duration: 11,
    delay: -7,
    direction: "right",
    scale: 1.4,
  },
  {
    sprite: ALIEN_INVADER,
    top: 0,
    duration: 36,
    delay: -10,
    direction: "diag-down",
    scale: 0.5,
  },
];

// Shooting star directions and rotation to match travel direction
const SHOOTING_DIRS: FlyingSprite["direction"][] = [
  "left",
  "right",
  "diag-down",
  "diag-up",
];

const DIR_ROTATION: Record<FlyingSprite["direction"], number> = {
  right: 0,
  left: 180,
  "diag-down": 45,
  "diag-up": 225,
};

// --- Main component ---

interface SpaceSceneProps {
  starsOnly?: boolean;
}

interface ShootingStar {
  key: number;
  top: number;
  duration: number;
  direction: FlyingSprite["direction"];
  scale: number;
}

function useShootingStars(enabled: boolean) {
  const [star, setStar] = useState<ShootingStar | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function schedule() {
      const pause =
        counterRef.current === 0 ? 2000 : 5000 + Math.random() * 7000;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          const dur = 4 + Math.random() * 4;
          const s: ShootingStar = {
            key: counterRef.current++,
            top: 5 + Math.random() * 80,
            duration: dur,
            direction:
              SHOOTING_DIRS[Math.floor(Math.random() * SHOOTING_DIRS.length)],
            scale: 0.6 + Math.random() * 0.8,
          };
          setStar(s);
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              setStar(null);
              schedule();
            }, dur * 1000),
          );
        }, pause),
      );
    }

    schedule();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [enabled]);

  return star;
}

export const SpaceScene: React.FC<SpaceSceneProps> = ({ starsOnly }) => {
  const shootingStar = useShootingStars(!!starsOnly);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Warp starfield */}
      {WARP_STARS.map((star, i) => {
        const cfg = LAYER_CONFIG[star.layer];
        return (
          <div
            key={`star-${i}`}
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              width: cfg.size,
              height: cfg.size,
              backgroundColor: cfg.color,
              opacity: cfg.opacity,
              animation: `star-warp ${cfg.duration}s steps(${cfg.duration * 4}) infinite`,
              animationDelay: `${star.delay}s`,
              // Custom properties for the keyframe endpoint
              ["--dx" as string]: `${star.dx}vw`,
              ["--dy" as string]: `${star.dy}vh`,
            }}
          />
        );
      })}

      {/* Flying sprites (full scene) or single shooting star (starsOnly) */}
      {starsOnly
        ? shootingStar && (
            <div
              key={`shoot-${shootingStar.key}`}
              className="absolute"
              style={{
                top: `${shootingStar.top}%`,
                animation: `fly-${shootingStar.direction} ${shootingStar.duration}s linear forwards`,
              }}
            >
              <div
                style={{
                  transform: `scale(${shootingStar.scale}) rotate(${DIR_ROTATION[shootingStar.direction]}deg)`,
                }}
              >
                <PixelSprite sprite={COMET} />
              </div>
            </div>
          )
        : FLYING_SPRITES.map((fs, i) => (
            <div
              key={`sprite-${i}`}
              className="absolute"
              style={{
                top: `${fs.top}%`,
                animation: `fly-${fs.direction} ${fs.duration}s steps(${fs.duration * 3}) infinite`,
                animationDelay: `${fs.delay}s`,
              }}
            >
              <div style={{ transform: `scale(${fs.scale ?? 1})` }}>
                <PixelSprite sprite={fs.sprite} />
              </div>
            </div>
          ))}
    </div>
  );
};
