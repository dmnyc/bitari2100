import React from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FormError,
  BottomSheetContainer,
  BottomSheetCard,
  DialogHeader,
} from "../../components/ui";
import { AtariButton } from "../../components/atari/AtariButton";

interface AmountPanelProps {
  isOpen: boolean;
  amount: string;
  setAmount: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  limits: { min: number; max: number };
  isLoading: boolean;
  error: string | null;
  onCreateInvoice: () => void;
  onClose: () => void;
}

const formatWithSpaces = (num: number): string => {
  return num.toLocaleString("en-US").replace(/,/g, "\u2009");
};

const QUICK_AMOUNTS = [100, 1000, 10000, 100000];

const AmountPanel: React.FC<AmountPanelProps> = ({
  isOpen,
  amount,
  setAmount,
  description,
  setDescription,
  limits,
  isLoading,
  error,
  onCreateInvoice,
  onClose,
}) => {
  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose} showBackdrop>
      <BottomSheetCard>
        <DialogHeader title="CREATE INVOICE" onClose={onClose} />

        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <div className="font-pixel text-sm text-atari-midgray mb-2">
              AMOUNT
            </div>
            <div className="flex items-center pixel-border overflow-hidden">
              <svg
                width="16"
                height="22"
                viewBox="0 0 6 8"
                shapeRendering="crispEdges"
                className="ml-3 shrink-0"
              >
                <rect x="1" y="0" width="4" height="1" fill="#ffff55" />
                <rect x="1" y="1" width="3" height="1" fill="#ffff55" />
                <rect x="0" y="2" width="3" height="1" fill="#ffff55" />
                <rect x="0" y="3" width="5" height="1" fill="#ffff55" />
                <rect x="2" y="4" width="2" height="1" fill="#ffff55" />
                <rect x="1" y="5" width="2" height="1" fill="#ffff55" />
                <rect x="0" y="6" width="2" height="1" fill="#ffff55" />
              </svg>
              <input
                type="number"
                min={limits.min}
                max={999999}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) <= 999999) setAmount(val);
                }}
                placeholder="0"
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-3 font-pixel text-lg sm:text-xl text-atari-bright placeholder-atari-darkgray focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-testid="invoice-amount-input"
              />
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={isLoading}
                className={`font-pixel text-sm sm:text-base px-4 py-3 border-3 ${
                  amount === quickAmount.toString()
                    ? "border-atari-orange text-atari-orange"
                    : "border-atari-darkgray text-atari-midgray hover:border-atari-lightgray hover:text-atari-lightgray"
                }`}
              >
                {formatWithSpaces(quickAmount)}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <div className="font-pixel text-sm text-atari-midgray mb-2">
              DESCRIPTION
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              disabled={isLoading}
              className="atari-input"
            />
          </div>

          <FormError error={error} data-testid="invoice-error-message" />

          <AtariButton
            variant="primary"
            fullWidth
            onClick={onCreateInvoice}
            disabled={isLoading || !amount}
            data-testid="generate-invoice-button"
          >
            {isLoading ? <LoadingSpinner size="small" /> : "GENERATE"}
          </AtariButton>
        </div>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default AmountPanel;
