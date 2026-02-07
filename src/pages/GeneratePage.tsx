import React, { useState, useEffect } from "react";
import * as bip39 from "bip39";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";
import { AtariButton } from "../components/atari/AtariButton";
import { AlertCard } from "../components/AlertCard";

interface GeneratePageProps {
  onMnemonicConfirmed: (mnemonic: string) => void;
  onBack: () => void;
  error: string | null;
  onClearError: () => void;
}

const GeneratePage: React.FC<GeneratePageProps> = ({
  onMnemonicConfirmed,
  onBack,
  onClearError: _onClearError,
}) => {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    const generateMnemonic = async () => {
      try {
        const newMnemonic = bip39.generateMnemonic(128);
        setMnemonic(newMnemonic);
      } catch (error) {
        console.error("Failed to generate mnemonic:", error);
      } finally {
        setIsLoading(false);
      }
    };
    generateMnemonic();
  }, []);

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(mnemonic)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy mnemonic:", err));
  };

  if (isLoading) {
    return (
      <PageLayout onBack={onBack} title="NEW WALLET">
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  const words = mnemonic.split(" ");

  return (
    <PageLayout onBack={onBack} title="NEW WALLET">
      <div className="flex flex-col p-6 max-w-2xl mx-auto">
        <div className="font-pixel text-lg text-atari-lightgray text-center mb-6 leading-relaxed">
          YOUR SECRET RECOVERY CODE
        </div>

        {/* Mnemonic grid - Atari style */}
        <div className="pixel-border p-5 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-2 py-2">
                <span className="font-pixel text-base text-atari-midgray w-8 text-right">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-pixel text-lg text-atari-bright uppercase">
                  {word}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy button */}
        <div className="flex justify-center mb-4">
          <AtariButton variant="secondary" onClick={handleCopyToClipboard}>
            {isCopied ? "+ COPIED" : "@ COPY"}
          </AtariButton>
        </div>

        {/* Warning */}
        <AlertCard type="warning" className="mb-6">
          ! WRITE THESE DOWN !<br />
          NEVER SHARE YOUR RECOVERY PHRASE
        </AlertCard>

        {/* Confirm button */}
        <AtariButton
          variant="primary"
          fullWidth
          onClick={() => onMnemonicConfirmed(mnemonic)}
        >
          I SAVED MY PHRASE
        </AtariButton>
      </div>
    </PageLayout>
  );
};

export default GeneratePage;
