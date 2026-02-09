import React, { useCallback, useRef, useState } from "react";
import { AtariButton } from "../components/atari/AtariButton";
import { CartridgeLabel } from "../components/atari/CartridgeLabel";
import { MuteButton } from "../components/atari/MuteButton";
import { SpaceScene } from "../components/atari/SpaceScene";
import { playIntroLoop } from "../services/tiaSoundService";

interface HomePageProps {
  onRestoreWallet: () => void;
  onCreateNewWallet: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onRestoreWallet,
  onCreateNewWallet,
}) => {
  const [started, setStarted] = useState(false);
  const stopIntroRef = useRef<(() => void) | null>(null);

  const handlePressStart = useCallback(() => {
    stopIntroRef.current = playIntroLoop();
    setStarted(true);
  }, []);

  const stopMusic = useCallback(() => {
    if (stopIntroRef.current) {
      stopIntroRef.current();
      stopIntroRef.current = null;
    }
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col items-center relative overflow-y-auto p-4">
      {/* Mute button — top right */}
      <div className="absolute top-3 right-3 z-10">
        <MuteButton />
      </div>

      {/* Animated space background */}
      <SpaceScene />

      {/* Push content to vertical center — min-h clears the mute toggle */}
      <div className="flex-[2] min-h-[76px]" />

      {/* Cartridge label / logo */}
      <div className="mb-8">
        <CartridgeLabel />
      </div>

      {/* PRESS START or wallet buttons */}
      {!started ? (
        <div className="w-full max-w-xs">
          <button
            onClick={handlePressStart}
            className="press-start-btn w-full font-pixel text-lg tracking-widest text-atari-black py-4 px-8 pixel-border"
          >
            START HERE
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-4 animate-pixel-fade">
          <AtariButton
            variant="primary"
            fullWidth
            onClick={() => {
              stopMusic();
              onCreateNewWallet();
            }}
            data-testid="create-wallet-button"
          >
            NEW WALLET
          </AtariButton>

          <AtariButton
            variant="secondary"
            fullWidth
            onClick={() => {
              stopMusic();
              onRestoreWallet();
            }}
            data-testid="restore-wallet-button"
          >
            RESTORE
          </AtariButton>
        </div>
      )}

      {/* Footer — pushed to bottom */}
      <div className="flex-[5] min-h-[24px]" />
      <div className="text-center space-y-2 pb-2 mt-6">
        <a
          href="https://nostree.me/daniel"
          target="_blank"
          rel="noopener noreferrer"
          className="font-pixel text-base text-atari-midgray hover:text-atari-orange tracking-wider block"
        >
          CREATED BY @DANIEL
        </a>
        <div className="font-pixel text-base text-atari-darkgray tracking-wider">
          POWERED BY BREEZ SDK
        </div>
      </div>
    </div>
  );
};

export default HomePage;
