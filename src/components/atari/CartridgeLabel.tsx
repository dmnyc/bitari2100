/**
 * Decorative cartridge label for branding.
 * Used on the title screen.
 */
export function CartridgeLabel() {
  return (
    <div className="pixel-border-double p-8 text-center mx-auto max-w-sm">
      {/* Pixel art Bitcoin symbol */}
      <div className="mb-5">
        <BitcoinPixelArt />
      </div>
      <div className="font-pixel text-base text-atari-midgray tracking-[4px] mb-3">
        VIDEO COMPUTER SYSTEM
      </div>
      <div className="font-atari text-3xl text-atari-orange tracking-wider leading-relaxed">
        BITARI
      </div>
      <div className="font-atari text-4xl text-atari-orange-lit tracking-widest">
        2100
      </div>
      <div className="font-pixel text-base text-atari-midgray tracking-wider mt-3">
        A BITCOIN WALLET
      </div>
    </div>
  );
}

/**
 * 18x18 pixel art Bitcoin "B" rendered as a grid of colored divs.
 * Orange (#ac5030) on black, authentic retro look.
 */
function BitcoinPixelArt() {
  // 18x18 bitmap: 1 = orange pixel, 0 = transparent
  // Bitcoin "₿" symbol
  // prettier-ignore
  const bitmap = [
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0, // row 0: vertical strokes
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0, // row 1: vertical strokes
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0, // row 2: top bar (narrow)
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0, // row 3: top bar (wide)
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 4: top opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 5: top opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 6: top opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 7: top opening
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0, // row 8: middle bar (narrow)
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0, // row 9: middle bar (narrow)
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 10: bottom opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 11: bottom opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 12: bottom opening
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0, // row 13: bottom opening
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0, // row 14: bottom bar (wide)
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0, // row 15: bottom bar (narrow)
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0, // row 16: vertical strokes
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0, // row 17: vertical strokes
  ];

  return (
    <div
      className="inline-grid mx-auto"
      style={{
        gridTemplateColumns: "repeat(18, 6px)",
        gridTemplateRows: "repeat(18, 6px)",
        gap: "0px",
      }}
    >
      {bitmap.map((pixel, i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: "6px",
            background: pixel ? "#ac5030" : "transparent",
          }}
        />
      ))}
    </div>
  );
}
