import React, { useEffect, useState } from "react";
import { SimpleAlert } from "../../../components/AlertCard";
import { AtariButton } from "../../../components/atari/AtariButton";
import { formatWithThinSpaces } from "../../../utils/formatNumber";

export interface InputStepProps {
  paymentInput: string;
  isLoading: boolean;
  error: string | null;
  onContinue: (paymentInput: string) => void;
  onScanQr?: () => void;
  balanceSats?: number;
}

const InputStep: React.FC<InputStepProps> = ({
  paymentInput,
  isLoading,
  error,
  onContinue,
  onScanQr,
  balanceSats = 0,
}) => {
  const [localPaymentInput, setLocalPaymentInput] = useState<string>(
    paymentInput || "",
  );

  useEffect(() => {
    setLocalPaymentInput(paymentInput || "");
  }, [paymentInput]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        setLocalPaymentInput(text);
        onContinue(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center gap-2">
          <svg
            width="15"
            height="20"
            viewBox="0 0 6 8"
            shapeRendering="crispEdges"
            className="shrink-0"
          >
            <rect x="1" y="0" width="4" height="1" fill="#ffff55" />
            <rect x="1" y="1" width="3" height="1" fill="#ffff55" />
            <rect x="0" y="2" width="3" height="1" fill="#ffff55" />
            <rect x="0" y="3" width="5" height="1" fill="#ffff55" />
            <rect x="2" y="4" width="2" height="1" fill="#ffff55" />
            <rect x="1" y="5" width="2" height="1" fill="#ffff55" />
            <rect x="0" y="6" width="2" height="1" fill="#ffff55" />
          </svg>
          <span className="font-pixel text-xl text-atari-yellow">
            {formatWithThinSpaces(balanceSats)}
          </span>
        </div>
        <span className="font-pixel text-xs text-atari-darkgray mt-1">
          AVAILABLE BALANCE
        </span>
      </div>

      <textarea
        value={localPaymentInput}
        onChange={(e) => setLocalPaymentInput(e.target.value)}
        placeholder="lnbc... / bc1... / sp1... / user@domain.com"
        className="atari-textarea"
        rows={3}
        disabled={isLoading}
        data-testid="payment-input"
      />

      {error && (
        <SimpleAlert variant="error" dataTestId="send-error-banner">
          {error}
        </SimpleAlert>
      )}

      <div className="flex gap-3">
        <AtariButton
          variant="secondary"
          fullWidth
          onClick={handlePaste}
          disabled={isLoading}
        >
          PASTE
        </AtariButton>
        <AtariButton
          variant="secondary"
          fullWidth
          onClick={onScanQr}
          disabled={isLoading}
        >
          SCAN
        </AtariButton>
      </div>

      <AtariButton
        variant="primary"
        fullWidth
        onClick={() => onContinue(localPaymentInput)}
        disabled={isLoading || !localPaymentInput.trim()}
        data-testid="continue-button"
      >
        {isLoading ? "PROCESSING..." : "CONTINUE"}
      </AtariButton>
    </div>
  );
};

export default InputStep;
