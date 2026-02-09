import React, { useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { QRCodeContainer, FormLabel } from "../../components/ui";
import { useToast } from "../../contexts/ToastContext";

const SEGMENT_COLORS = [
  "#c87020", // orange
  "#5c9c5c", // green
  "#6c8cc8", // blue
  "#c85c9c", // pink
  "#c8c858", // yellow
  "#58c8c8", // cyan
  "#b07040", // brown
  "#9c6cc8", // purple
];

const SEGMENT_SIZE = 4;

interface Props {
  address: string | null;
  isLoading: boolean;
}

const BitcoinAddressDisplay: React.FC<Props> = ({ address, isLoading }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (isLoading || !address) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Generating BTC address..." />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("success", "Copied!");
    });
  };

  // Split address into segments
  const segments: string[] = [];
  for (let i = 0; i < address.length; i += SEGMENT_SIZE) {
    segments.push(address.slice(i, i + SEGMENT_SIZE));
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <QRCodeContainer value={address} />

      <div className="w-full">
        <FormLabel>BTC ADDRESS</FormLabel>
        <div
          className="pixel-border p-3 cursor-pointer"
          onClick={handleCopy}
          data-testid="bitcoin-address-text"
        >
          <div className="grid grid-cols-4 gap-x-2 gap-y-1 font-pixel text-xs sm:text-base leading-relaxed max-w-sm mx-auto">
            {segments.map((seg, i) => (
              <span
                key={i}
                style={{ color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              >
                {seg}
              </span>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            {copied ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 7 7"
                shapeRendering="crispEdges"
              >
                <rect x="6" y="0" width="1" height="1" fill="#5c9c5c" />
                <rect x="5" y="1" width="1" height="1" fill="#5c9c5c" />
                <rect x="4" y="2" width="1" height="1" fill="#5c9c5c" />
                <rect x="0" y="3" width="1" height="1" fill="#5c9c5c" />
                <rect x="3" y="3" width="1" height="1" fill="#5c9c5c" />
                <rect x="1" y="4" width="1" height="1" fill="#5c9c5c" />
                <rect x="2" y="5" width="1" height="1" fill="#5c9c5c" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 7 7"
                shapeRendering="crispEdges"
              >
                <rect x="2" y="0" width="5" height="1" fill="#c87020" />
                <rect x="2" y="1" width="1" height="1" fill="#c87020" />
                <rect x="6" y="1" width="1" height="1" fill="#c87020" />
                <rect x="6" y="2" width="1" height="1" fill="#c87020" />
                <rect x="6" y="3" width="1" height="1" fill="#c87020" />
                <rect x="2" y="4" width="5" height="1" fill="#c87020" />
                <rect x="0" y="2" width="3" height="1" fill="#c87020" />
                <rect x="0" y="3" width="1" height="1" fill="#c87020" />
                <rect x="2" y="3" width="1" height="1" fill="#c87020" />
                <rect x="0" y="4" width="1" height="1" fill="#c87020" />
                <rect x="0" y="5" width="1" height="1" fill="#c87020" />
                <rect x="4" y="5" width="1" height="1" fill="#c87020" />
                <rect x="0" y="6" width="5" height="1" fill="#c87020" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinAddressDisplay;
