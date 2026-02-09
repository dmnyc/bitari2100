import React, { useState, useEffect, useRef } from "react";
import * as bip39 from "bip39";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";
import { AtariButton } from "../components/atari/AtariButton";
import { MnemonicGrid } from "../components/atari/MnemonicGrid";
import { playToggle, playSendSuccess } from "../services/tiaSoundService";

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
  const [done, setDone] = useState(false);
  const playedRevealSound = useRef(false);

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

  const words = mnemonic ? mnemonic.split(" ") : [];

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(mnemonic)
      .then(() => {
        setIsCopied(true);
        playSendSuccess();
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

  return (
    <PageLayout onBack={onBack} title="NEW WALLET">
      <div className="flex flex-col p-3 sm:p-6 max-w-2xl mx-auto">
        <div className="font-pixel text-sm sm:text-lg text-atari-lightgray text-center mb-4 sm:mb-6 leading-relaxed">
          YOUR SECRET RECOVERY CODE
        </div>

        <div className="mb-4 sm:mb-6">
          <MnemonicGrid
            words={words}
            animate
            onAnimationDone={() => setDone(true)}
          />
        </div>

        {done && (
          <div
            className="animate-pixel-fade"
            ref={() => {
              if (!playedRevealSound.current) {
                playedRevealSound.current = true;
                playToggle();
              }
            }}
          >
            <div className="flex justify-center mb-8">
              <AtariButton variant="secondary" onClick={handleCopyToClipboard}>
                {isCopied ? (
                  <span className="inline-flex items-center gap-2">
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
                    COPIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 7 7"
                      shapeRendering="crispEdges"
                    >
                      <rect
                        x="2"
                        y="0"
                        width="5"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="2"
                        y="1"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="6"
                        y="1"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="6"
                        y="2"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="6"
                        y="3"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="2"
                        y="4"
                        width="5"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="2"
                        width="3"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="3"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="2"
                        y="3"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="4"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="5"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="4"
                        y="5"
                        width="1"
                        height="1"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="6"
                        width="5"
                        height="1"
                        fill="currentColor"
                      />
                    </svg>
                    COPY
                  </span>
                )}
              </AtariButton>
            </div>
            <AtariButton
              variant="primary"
              fullWidth
              onClick={() => onMnemonicConfirmed(mnemonic)}
            >
              I SAVED MY PHRASE
            </AtariButton>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default GeneratePage;
