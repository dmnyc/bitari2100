import React, { useEffect, useState, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { MuteButton } from "../components/atari/MuteButton";
import { AtariButton } from "../components/atari/AtariButton";
import { MnemonicGrid } from "../components/atari/MnemonicGrid";
import { playToggle, playSendSuccess } from "../services/tiaSoundService";

interface BackupPageProps {
  onBack: () => void;
}

const BackupPage: React.FC<BackupPageProps> = ({ onBack }) => {
  const wallet = useWallet();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    setMnemonic(wallet.getSavedMnemonic());
  }, [wallet]);

  const handleCopy = async () => {
    if (!mnemonic) return;
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      playSendSuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy mnemonic:", e);
    }
  };

  const words = mnemonic ? mnemonic.split(" ") : [];
  const playedRevealSound = useRef(false);

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
          BACKUP
        </span>
        <MuteButton />
      </div>

      <div className="p-3 sm:p-4 max-w-lg mx-auto w-full">
        {!isRevealed ? (
          <div className="text-center py-8">
            <div className="font-pixel text-sm sm:text-base text-atari-midgray mb-4">
              RECOVERY PHRASE HIDDEN
            </div>
            <AtariButton variant="primary" onClick={() => setIsRevealed(true)}>
              REVEAL PHRASE
            </AtariButton>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <MnemonicGrid
                words={words}
                animate
                onAnimationDone={() => setAnimDone(true)}
              />
            </div>

            {animDone && (
              <div
                className="flex justify-center animate-pixel-fade"
                ref={() => {
                  if (!playedRevealSound.current) {
                    playedRevealSound.current = true;
                    playToggle();
                  }
                }}
              >
                <AtariButton variant="secondary" onClick={handleCopy}>
                  {copied ? (
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BackupPage;
