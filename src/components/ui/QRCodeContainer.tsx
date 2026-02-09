import React from "react";
import QRCode from "react-qr-code";

interface QRCodeContainerProps {
  value: string;
  size?: number;
}

/**
 * 18x18 pixel-art Bitcoin "B" with chrome-to-orange gradient.
 * Same bitmap as CartridgeLabel but rendered as a compact SVG for QR overlay.
 */
function BitcoinLogoSvg({ size }: { size: number }) {
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

  // prettier-ignore
  const rowColors = [
    "#ececec","#dcdcdc","#c8c8c8","#b0b0b0",
    "#909090","#6c6c6c","#404040","#000000",
    "#ac5030","#c06848","#d4884c","#c06848",
    "#ac5030","#985c28","#844414","#702800",
    "#442800","#442800",
  ];

  // Bitmap occupies columns 0-13 (14 wide) x 18 rows tall.
  // Center it in an 18x18 square viewBox so the overlay is a perfect square.
  const xOffset = 2; // (18 - 14) / 2
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < bitmap.length; i++) {
    if (!bitmap[i]) continue;
    const row = Math.floor(i / 18);
    const col = i % 18;
    rects.push(
      <rect
        key={i}
        x={col + xOffset}
        y={row}
        width={1}
        height={1}
        fill={rowColors[row]}
      />,
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
}

export const QRCodeContainer: React.FC<QRCodeContainerProps> = ({
  value,
  size = 280,
}) => {
  const logoSize = Math.round(size * 0.22);

  return (
    <div className="qr-container">
      <div className="qr-frame">
        <div
          style={{
            position: "relative",
            display: "inline-block",
            maxWidth: "100%",
          }}
        >
          <QRCode
            value={value}
            size={size}
            level="H"
            style={{ width: "100%", height: "auto", maxWidth: size }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#000",
              padding: `${Math.round(size * 0.015)}px ${Math.round(size * 0.015) + 1}px ${Math.round(size * 0.015)}px ${Math.round(size * 0.015)}px`,
              lineHeight: 0,
            }}
          >
            <BitcoinLogoSvg size={logoSize} />
          </div>
        </div>
      </div>
    </div>
  );
};
