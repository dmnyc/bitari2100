import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { AtariButton } from '../components/atari/AtariButton';
import { SimpleAlert } from '../components/AlertCard';

interface RestorePageProps {
  onConnect: (mnemonic: string) => void;
  onBack: () => void;
  onClearError: () => void;
}

const RestorePage: React.FC<RestorePageProps> = ({
  onConnect,
  onBack,
  onClearError: _onClearError
}) => {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cleaned = mnemonic.trim().replace(/\s+/g, ' ');
    const wordCount = cleaned.split(' ').length;

    if (wordCount !== 12 && wordCount !== 24) {
      setError('ENTER A VALID 12 OR 24 WORD PHRASE');
      return;
    }

    setError(null);
    onConnect(cleaned);
  };

  return (
    <PageLayout onBack={onBack} title="RESTORE WALLET">
      <div className="flex flex-col p-4 max-w-md mx-auto">
        <div className="font-pixel text-base text-atari-lightgray text-center mb-4 leading-relaxed">
          ENTER YOUR RECOVERY PHRASE
        </div>

        <div className="font-pixel text-base text-atari-midgray text-center mb-4">
          WORDS SEPARATED BY SPACES
        </div>

        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          className="atari-textarea h-32 mb-4"
          placeholder="WORD1 WORD2 WORD3 ..."
          data-testid="mnemonic-input"
        />

        {error && (
          <SimpleAlert message={error} type="error" onDismiss={() => setError(null)} />
        )}

        <AtariButton
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={!mnemonic.trim()}
          className="mt-4"
          data-testid="restore-confirm-button"
        >
          RESTORE WALLET
        </AtariButton>
      </div>
    </PageLayout>
  );
};

export default RestorePage;
