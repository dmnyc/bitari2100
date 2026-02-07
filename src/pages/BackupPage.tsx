import React, { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { AtariButton } from '../components/atari/AtariButton';
import { AlertCard } from '../components/AlertCard';

interface BackupPageProps {
  onBack: () => void;
}

const BackupPage: React.FC<BackupPageProps> = ({ onBack }) => {
  const wallet = useWallet();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setMnemonic(wallet.getSavedMnemonic());
  }, [wallet]);

  const handleCopy = async () => {
    if (!mnemonic) return;
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy mnemonic:', e);
    }
  };

  const words = mnemonic ? mnemonic.split(' ') : [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-2 p-3 border-b-2 border-dashed border-atari-darkgray">
        <button onClick={onBack} className="font-pixel text-base text-atari-midgray hover:text-atari-orange">
          {'<'} BACK
        </button>
        <span className="font-pixel text-lg text-atari-bright uppercase tracking-wider">
          BACKUP
        </span>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        <AlertCard type="warning" className="mb-4">
          ! KEEP THIS SECRET !<br />
          ANYONE WITH THESE WORDS CAN STEAL YOUR FUNDS
        </AlertCard>

        {!isRevealed ? (
          <div className="text-center py-8">
            <div className="font-pixel text-base text-atari-midgray mb-4">
              RECOVERY PHRASE HIDDEN
            </div>
            <AtariButton variant="primary" onClick={() => setIsRevealed(true)}>
              REVEAL PHRASE
            </AtariButton>
          </div>
        ) : (
          <>
            <div className="pixel-border p-3 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, index) => (
                  <div key={index} className="flex items-center gap-1 py-1">
                    <span className="font-pixel text-base text-atari-midgray w-5 text-right">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-pixel text-base text-atari-bright uppercase">
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <AtariButton variant="secondary" onClick={handleCopy}>
                {copied ? '+ COPIED' : '@ COPY'}
              </AtariButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BackupPage;
