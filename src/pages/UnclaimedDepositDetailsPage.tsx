import React from "react";
import type { DepositInfo } from "@breeztech/breez-sdk-spark";
import { formatWithCommas } from "../utils/formatNumber";
import { AtariButton } from "../components/atari/AtariButton";

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
      <div className="flex items-center gap-2 p-3 border-b-2 border-dashed border-atari-darkgray">
        <button
          onClick={onBack}
          className="font-pixel text-base text-atari-midgray hover:text-atari-orange"
        >
          {"<"} BACK
        </button>
        <span className="font-pixel text-lg text-atari-bright uppercase tracking-wider">
          DEPOSIT DETAILS
        </span>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        <div className="pixel-border p-4 space-y-3">
          <div>
            <span className="font-pixel text-base text-atari-midgray">
              AMOUNT
            </span>
            <div className="font-pixel text-lg text-atari-bright">
              {formatWithCommas(Number(deposit.amountSats))} SATS
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
