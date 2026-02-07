import React, { useEffect, useState } from "react";
import { AtariButton } from "../components/atari/AtariButton";
import { CartridgeLabel } from "../components/atari/CartridgeLabel";

interface HomePageProps {
  onRestoreWallet: () => void;
  onCreateNewWallet: () => void;
}

/** Starfield positions for background decoration */
const STARS = Array.from({ length: 24 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 3,
}));

const HomePage: React.FC<HomePageProps> = ({
  onRestoreWallet,
  onCreateNewWallet,
}) => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Starfield background */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-atari-midgray"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animation: `star-twinkle 2s steps(3) infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Cartridge label / logo */}
      <div className="mb-12">
        <CartridgeLabel />
      </div>

      {/* CTA Buttons */}
      {showButtons && (
        <div className="w-full max-w-xs space-y-4 animate-pixel-fade">
          <AtariButton
            variant="primary"
            fullWidth
            onClick={onCreateNewWallet}
            data-testid="create-wallet-button"
          >
            NEW WALLET
          </AtariButton>

          <AtariButton
            variant="secondary"
            fullWidth
            onClick={onRestoreWallet}
            data-testid="restore-wallet-button"
          >
            RESTORE
          </AtariButton>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 text-center space-y-2">
        <a
          href="https://zap.cooking/user/npub1aeh2zw4elewy5682lxc6xnlqzjnxksq303gwu2npfaxd49vmde6qcq4nwx"
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
