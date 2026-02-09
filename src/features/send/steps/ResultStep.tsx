import React, { useEffect } from "react";
import { AtariButton } from "../../../components/atari/AtariButton";
import { playSendSuccess, playError } from "../../../services/tiaSoundService";

export interface ResultStepProps {
  result: "success" | "failure";
  error: string | null;
  onClose: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ result, error, onClose }) => {
  const isSuccess = result === "success";

  useEffect(() => {
    if (isSuccess) {
      playSendSuccess();
    } else {
      playError();
    }
  }, [isSuccess]);

  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      data-testid={isSuccess ? "payment-success" : "payment-failure"}
    >
      <div
        className={`font-pixel text-xl mb-4 ${
          isSuccess ? "text-atari-green" : "text-atari-red"
        }`}
      >
        {isSuccess ? "+ SENT +" : "! FAILED !"}
      </div>

      <div className="font-pixel text-sm text-atari-midgray text-center max-w-xs mb-8 leading-relaxed">
        {isSuccess
          ? "PAYMENT SENT SUCCESSFULLY"
          : error || "THERE WAS AN ERROR PROCESSING YOUR PAYMENT"}
      </div>

      <AtariButton
        variant={isSuccess ? "primary" : "secondary"}
        onClick={onClose}
      >
        {isSuccess ? "DONE" : "CLOSE"}
      </AtariButton>
    </div>
  );
};

export default ResultStep;
