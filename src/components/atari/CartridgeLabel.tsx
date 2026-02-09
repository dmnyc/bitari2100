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
        COMPUTER SPACE MONEY
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
 * 18x18 pixel art Bitcoin "B" with chrome/rainbow row banding.
 * Each row gets a different ANSI color for a metallic gradient effect.
 */
function BitcoinPixelArt() {
  // prettier-ignore
  const bitmap = [
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
  ];

  // Chrome effect: white top, grays through first hole, black above middle bar
  // prettier-ignore
  const rowColors = [
    "#ececec", // 0  Serif - bright white
    "#dcdcdc", // 1  Serif - off-white
    "#c8c8c8", // 2  Top bar - light gray
    "#b0b0b0", // 3  Top bar - gray
    "#909090", // 4  First hole - mid gray
    "#6c6c6c", // 5  First hole - darker gray
    "#404040", // 6  First hole - dark gray
    "#000000", // 7  First hole - BLACK (line above separator)
    "#ac5030", // 8  Middle bar - orange (color starts)
    "#c06848", // 9  Middle bar - light orange
    "#d4884c", // 10 Second hole - warm gold
    "#c06848", // 11 Second hole - light orange
    "#ac5030", // 12 Second hole - orange
    "#985c28", // 13 Second hole - medium brown
    "#844414", // 14 Bottom bar - dark wood
    "#702800", // 15 Bottom bar - deep brown
    "#442800", // 16 Serif - very dark
    "#442800", // 17 Serif - very dark
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
      {bitmap.map((pixel, i) => {
        const row = Math.floor(i / 18);
        return (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              background: pixel ? rowColors[row] : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}
