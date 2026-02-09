import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { MuteButton } from "../components/atari/MuteButton";
import type { DepositInfo, Fee } from "@breeztech/breez-sdk-spark";
import { LoadingSpinner } from "../components/ui";
import { AtariButton } from "../components/atari/AtariButton";
import { AtariInput } from "../components/atari/AtariInput";
import { SimpleAlert } from "../components/AlertCard";
import {
  isDepositRejected,
  removeRejectedDeposit,
} from "../services/depositState";
import { formatWithCommas } from "../utils/formatNumber";

interface GetRefundPageProps {
  onBack: () => void;
  animationDirection?: "horizontal" | "vertical";
}

const GetRefundPage: React.FC<GetRefundPageProps> = ({ onBack }) => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(
    null,
  );
  const [destination, setDestination] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const [refundStep, setRefundStep] = useState<"address" | "result">("address");

  const loadDeposits = useCallback(async () => {
    try {
      setIsLoading(true);
      const allDeposits = await wallet.unclaimedDeposits();
      const rejected = allDeposits.filter((d) =>
        isDepositRejected(d.txid, d.vout),
      );
      setDeposits(rejected);
    } catch (_e) {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const handleRefund = async () => {
    if (!selectedDeposit || !destination) return;
    setIsProcessing(true);
    setRefundError(null);
    try {
      const fee: Fee = { type: "rate", satPerVbyte: 1 };
      await wallet.refundDeposit(
        selectedDeposit.txid,
        selectedDeposit.vout,
        destination,
        fee,
      );
      removeRejectedDeposit(selectedDeposit.txid, selectedDeposit.vout);
      setRefundStep("result");
    } catch (_e) {
      setRefundError("REFUND FAILED");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center p-3 border-b-2 border-dashed border-atari-darkgray">
        <button
          onClick={onBack}
          className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
        >
          {"<"}
          <span className="hidden sm:inline"> BACK</span>
        </button>
        <span className="flex-1 text-center font-pixel text-sm sm:text-lg text-atari-bright uppercase tracking-wider">
          GET REFUND
        </span>
        <MuteButton />
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        {isLoading ? (
          <LoadingSpinner />
        ) : deposits.length === 0 ? (
          <div className="text-center py-8">
            <div className="font-pixel text-base text-atari-midgray">
              NO DEPOSITS TO REFUND
            </div>
          </div>
        ) : !selectedDeposit ? (
          <div>
            <div className="font-pixel text-base text-atari-lightgray mb-3">
              SELECT DEPOSIT TO REFUND:
            </div>
            {deposits.map((d, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDeposit(d);
                  setRefundStep("address");
                }}
                className="w-full pixel-border p-3 mb-2 text-left hover:border-atari-orange"
              >
                <div className="font-pixel text-base text-atari-bright">
                  {formatWithCommas(Number(d.amountSats))} SATS
                </div>
                <div className="font-pixel text-base text-atari-midgray mt-1 truncate">
                  TX: {d.txid.slice(0, 16)}...
                </div>
              </button>
            ))}
          </div>
        ) : refundStep === "address" ? (
          <div>
            <div className="font-pixel text-base text-atari-lightgray mb-3">
              REFUND {formatWithCommas(Number(selectedDeposit.amountSats))} SATS
            </div>
            <AtariInput
              label="BITCOIN ADDRESS"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="BC1..."
            />
            <div className="flex gap-2 mt-4">
              <AtariButton
                variant="secondary"
                onClick={() => setSelectedDeposit(null)}
              >
                BACK
              </AtariButton>
              <AtariButton
                variant="primary"
                onClick={handleRefund}
                disabled={!destination || isProcessing}
              >
                {isProcessing ? "SENDING..." : "REFUND"}
              </AtariButton>
            </div>
            {refundError && (
              <SimpleAlert
                message={refundError}
                type="error"
                className="mt-3"
              />
            )}
          </div>
        ) : refundStep === "result" ? (
          <div className="text-center py-8">
            <div className="font-pixel text-lg text-atari-green mb-4">
              REFUND SENT!
            </div>

            <AtariButton variant="primary" onClick={onBack}>
              DONE
            </AtariButton>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GetRefundPage;
