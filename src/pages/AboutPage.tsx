import React, { useEffect, useRef } from "react";
import { CartridgeLabel } from "../components/atari/CartridgeLabel";
import { MuteButton } from "../components/atari/MuteButton";
import { SpaceScene } from "../components/atari/SpaceScene";
import { playJourney } from "../services/tiaSoundService";

interface AboutPageProps {
  onBack: () => void;
}

const NOSTR_PROFILE_URL = "https://nostree.me/daniel";

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    // Stop any previous instance before starting a new one
    stopRef.current?.();
    const stop = playJourney();
    stopRef.current = stop;
    return () => {
      stop();
      stopRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] relative">
      <SpaceScene starsOnly />
      <div className="flex items-center p-3 border-b-2 border-dashed border-atari-darkgray relative z-10 shrink-0 safe-top">
        <button
          onClick={onBack}
          className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
        >
          {"<"}
          <span className="hidden sm:inline"> BACK</span>
        </button>
        <span className="flex-1 text-center font-pixel text-sm sm:text-lg text-atari-bright uppercase tracking-wider">
          ABOUT
        </span>
        <MuteButton />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 gap-8 relative z-10">
        <CartridgeLabel />

        <div className="pixel-border p-4 max-w-xs w-full space-y-4">
          <div className="text-center">
            <div className="font-pixel text-base text-atari-midgray tracking-wider mb-2">
              CREATED BY
            </div>
            <a
              href={NOSTR_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-lg text-atari-blue-sky hover:text-atari-orange-lit"
            >
              @daniel
            </a>
          </div>

          <div className="border-t border-dashed border-atari-darkgray" />

          <div className="text-center space-y-2">
            <div className="font-pixel text-base text-atari-midgray tracking-wider">
              WALLET ENGINE
            </div>
            <div className="font-pixel text-base text-atari-lightgray">
              BREEZ SDK SPARK
            </div>
          </div>

          <div className="border-t border-dashed border-atari-darkgray" />

          <div className="text-center">
            <div className="font-pixel text-base text-atari-midgray tracking-wider mb-1">
              VERSION
            </div>
            <div className="font-pixel text-base text-atari-lightgray">
              {import.meta.env.PACKAGE_VERSION || "0.1.0"}
            </div>
          </div>

          <div className="border-t border-dashed border-atari-darkgray" />

          <div className="text-center">
            <a
              href="https://github.com/dmnyc/bitari2100/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-base text-atari-blue-sky hover:text-atari-orange-lit"
            >
              BUGS / FEATURES
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
