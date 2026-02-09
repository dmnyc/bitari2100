import React from "react";
import type { LightningAddressInfo } from "@breeztech/breez-sdk-spark";
import LoadingSpinner from "../../components/LoadingSpinner";
import { SimpleAlert } from "../../components/AlertCard";
import { QRCodeContainer, FormError, CopyableText } from "../../components/ui";
import { AtariButton } from "../../components/atari/AtariButton";
import { useToast } from "../../contexts/ToastContext";

export interface LightningAddressDisplayProps {
  address: LightningAddressInfo | null;
  isLoading: boolean;
  isEditing: boolean;
  editValue: string;
  error: string | null;
  isSupported: boolean;
  supportMessage: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (value: string) => void;
  onCustomizeAmount: () => void;
}

const LightningAddressDisplay: React.FC<LightningAddressDisplayProps> = ({
  address,
  isLoading,
  isEditing,
  editValue,
  error,
  isSupported,
  supportMessage,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
  onCustomizeAmount,
}) => {
  const { showToast } = useToast();

  if (!isSupported) {
    return (
      <div className="pt-4 space-y-4 flex flex-col items-center text-center">
        <SimpleAlert
          variant="info"
          className="w-full text-left"
          dataTestId="lightning-address-unsupported"
        >
          <div className="font-pixel text-xs sm:text-sm text-atari-bright mb-2">
            LN ADDRESS
          </div>
          <div className="font-pixel text-xs text-atari-midgray">
            {supportMessage ??
              "LN addresses are not available in this environment."}
          </div>
        </SimpleAlert>

        <AtariButton
          variant="secondary"
          onClick={onCustomizeAmount}
          data-testid="show-amount-panel-button"
        >
          SET AMOUNT
        </AtariButton>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Loading address..." />
      </div>
    );
  }

  if (!address && !isEditing) {
    return (
      <div className="pt-4 space-y-4 flex flex-col items-center">
        <div className="text-center">
          <div className="font-pixel text-xs sm:text-sm text-atari-bright mb-2">
            LN ADDRESS
          </div>
          <div className="font-pixel text-xs text-atari-midgray mb-4">
            CREATE AN LN ADDRESS TO RECEIVE PAYMENTS
          </div>
          <AtariButton variant="primary" onClick={onEdit}>
            CREATE ADDRESS
          </AtariButton>
        </div>

        <AtariButton
          variant="secondary"
          onClick={onCustomizeAmount}
          data-testid="show-amount-panel-button"
        >
          SET AMOUNT
        </AtariButton>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="pt-2 space-y-4">
        <div className="text-center">
          <div className="font-pixel text-xs sm:text-sm text-atari-bright mb-2">
            {address ? "EDIT ADDRESS" : "CREATE ADDRESS"}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center pixel-border overflow-hidden">
            <input
              id="lightning-address"
              type="text"
              value={editValue}
              onChange={(e) =>
                onEditValueChange(
                  e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                )
              }
              placeholder="satoshi"
              disabled={isLoading}
              className="flex-1 min-w-0 bg-transparent px-3 py-3 font-pixel text-base text-atari-bright placeholder-atari-darkgray focus:outline-none"
              autoComplete="off"
              autoCapitalize="off"
            />
            <span className="flex-shrink-0 px-3 py-3 font-pixel text-xs text-atari-midgray">
              @breez.tips
            </span>
          </div>

          <FormError error={error} />
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <AtariButton variant="secondary" fullWidth onClick={onCancel}>
            CANCEL
          </AtariButton>
          <AtariButton
            variant="primary"
            fullWidth
            onClick={onSave}
            disabled={isLoading || !editValue.trim()}
            data-testid="save-address-button"
          >
            {isLoading ? "SAVING..." : "SAVE"}
          </AtariButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <QRCodeContainer value={address?.lnurl || ""} />

      <div className="w-full flex flex-col items-center gap-3">
        <CopyableText
          text={address?.lightningAddress || ""}
          truncate
          label="LN ADDRESS"
          onCopied={() => showToast("success", "Copied!")}
          textToCopy={address?.lightningAddress || ""}
          data-testid="lightning-address-text"
        />

        <AtariButton
          variant="secondary"
          fullWidth
          onClick={onCustomizeAmount}
          data-testid="show-amount-panel-button"
        >
          SET AMOUNT
        </AtariButton>
      </div>
    </div>
  );
};

export default LightningAddressDisplay;
