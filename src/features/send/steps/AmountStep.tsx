import React, { useEffect, useState } from "react";
import { FormError } from "../../../components/ui";
import { AtariButton } from "../../../components/atari/AtariButton";

export interface AmountStepProps {
  paymentInput: string;
  amount: string;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onNext: (amountSats: number) => void;
}

const AmountStep: React.FC<AmountStepProps> = ({
  paymentInput,
  amount,
  isLoading,
  error,
  onBack,
  onNext,
}) => {
  const [localAmount, setLocalAmount] = useState<string>(amount || "");

  useEffect(() => {
    setLocalAmount(amount || "");
  }, [amount]);

  const validAmount = localAmount && parseInt(localAmount) > 0;
  const amountNum = parseInt(localAmount) || 0;

  return (
    <div className="space-y-4">
      {/* Destination */}
      <div>
        <div className="font-pixel text-sm text-atari-midgray mb-2">
          DESTINATION
        </div>
        <div className="pixel-border p-3 font-pixel text-xs text-atari-lightgray break-all">
          {paymentInput}
        </div>
      </div>

      {/* Amount input */}
      <div>
        <div className="font-pixel text-sm text-atari-midgray mb-2">
          AMOUNT (SATS)
        </div>
        <input
          type="number"
          value={localAmount}
          onChange={(e) => setLocalAmount(e.target.value)}
          placeholder="0"
          className="atari-input"
          disabled={isLoading}
          min={1}
          data-testid="amount-input"
        />

        {/* Quick amount buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[100, 1000, 10000, 100000].map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setLocalAmount(String(quickAmount))}
              className={`font-pixel text-xs px-3 py-2 border-3 ${
                amountNum === quickAmount
                  ? "border-atari-orange text-atari-orange"
                  : "border-atari-darkgray text-atari-midgray hover:border-atari-lightgray hover:text-atari-lightgray"
              }`}
            >
              {quickAmount.toLocaleString("en-US").replace(/,/g, "\u2009")}
            </button>
          ))}
        </div>
      </div>

      <FormError error={error} />

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <AtariButton
          variant="secondary"
          fullWidth
          onClick={onBack}
          disabled={isLoading}
        >
          BACK
        </AtariButton>
        <AtariButton
          variant="primary"
          fullWidth
          onClick={() => validAmount && onNext(parseInt(localAmount))}
          disabled={isLoading || !validAmount}
        >
          {isLoading ? "PROCESSING..." : "CONTINUE"}
        </AtariButton>
      </div>
    </div>
  );
};

export default AmountStep;
