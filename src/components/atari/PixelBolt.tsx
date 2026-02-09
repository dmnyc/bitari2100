import React from "react";

interface PixelIconProps {
  size?: number;
  className?: string;
}

type PixelBoltProps = PixelIconProps;

/**
 * 8-bit lightning bolt icon. Default 10x14px, scales proportionally.
 * Use inline next to amounts as a currency symbol replacing "sats".
 */
export const PixelBolt: React.FC<PixelBoltProps> = ({
  size = 14,
  className = "",
}) => {
  const w = Math.round(size * (6 / 8));
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 6 8"
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
    >
      <rect x="1" y="0" width="4" height="1" fill="#ffff55" />
      <rect x="1" y="1" width="3" height="1" fill="#ffff55" />
      <rect x="0" y="2" width="3" height="1" fill="#ffff55" />
      <rect x="0" y="3" width="5" height="1" fill="#ffff55" />
      <rect x="2" y="4" width="2" height="1" fill="#ffff55" />
      <rect x="1" y="5" width="2" height="1" fill="#ffff55" />
      <rect x="0" y="6" width="2" height="1" fill="#ffff55" />
    </svg>
  );
};

/** Red up-arrow for send amounts. */
export const PixelArrowUp: React.FC<PixelIconProps> = ({
  size = 14,
  className = "",
}) => {
  const w = Math.round(size * (5 / 4));
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 5 4"
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
    >
      <rect x="2" y="0" width="1" height="1" fill="#d04040" />
      <rect x="1" y="1" width="3" height="1" fill="#d04040" />
      <rect x="0" y="2" width="5" height="1" fill="#d04040" />
    </svg>
  );
};

/** Green down-arrow for receive amounts. */
export const PixelArrowDown: React.FC<PixelIconProps> = ({
  size = 14,
  className = "",
}) => {
  const w = Math.round(size * (5 / 4));
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 5 4"
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
    >
      <rect x="0" y="0" width="5" height="1" fill="#5c9c5c" />
      <rect x="1" y="1" width="3" height="1" fill="#5c9c5c" />
      <rect x="2" y="2" width="1" height="1" fill="#5c9c5c" />
    </svg>
  );
};
