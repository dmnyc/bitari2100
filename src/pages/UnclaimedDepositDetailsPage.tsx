import React from "react";
import type { DepositInfo } from "@breeztech/breez-sdk-spark";
import { MuteButton } from "../components/atari/MuteButton";
import { formatWithCommas } from "../utils/formatNumber";
import { AtariButton } from "../components/atari/AtariButton";
import { PixelBolt } from "../components/atari/PixelBolt";

interface UnclaimedDepositDetailsPageProps {
  deposit: DepositInfo;
  onBack: () => void;
  onChanged?: () => void;
}

const UnclaimedDepositDetailsPage: React.FC<
  UnclaimedDepositDetailsPageProps
> = ({ deposit, onBack, onChanged: _onChanged }) => {
  return (
    <div className="fixed inset-0 z-50 bg-atari-black flex flex-col">
      <div className="flex items-center p-3 border-b-2 border-dashed border-atari-darkgray safe-top">
        <button
          onClick={onBack}
          className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
        >
          {"<"}
          <span className="hidden sm:inline"> BACK</span>
        </button>
        <span className="flex-1 text-center font-pixel text-sm sm:text-lg text-atari-bright uppercase tracking-wider">
          DEPOSIT DETAILS
        </span>
        <MuteButton />
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        <div className="pixel-border p-4 space-y-3">
          <div>
            <span className="font-pixel text-base text-atari-midgray">
              AMOUNT
            </span>
            <div className="font-pixel text-lg text-atari-bright flex items-center gap-1">
              {formatWithCommas(Number(deposit.amountSats))}{" "}
              <PixelBolt size={14} />
            </div>
          </div>
          <div>
            <span className="font-pixel text-base text-atari-midgray">
              TX ID
            </span>
            <div className="font-pixel text-base text-atari-lightgray break-all">
              {deposit.txid}
            </div>
          </div>
          <div>
            <span className="font-pixel text-base text-atari-midgray">
              OUTPUT
            </span>
            <div className="font-pixel text-base text-atari-lightgray">
              {deposit.vout}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <AtariButton variant="secondary" fullWidth onClick={onBack}>
            CLOSE
          </AtariButton>
        </div>
      </div>
    </div>
  );
};

export default UnclaimedDepositDetailsPage;
