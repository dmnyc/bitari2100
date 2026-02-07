import React, { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getFiatSettings, saveFiatSettings } from '../services/settings';
import type { FiatCurrency } from '@breeztech/breez-sdk-spark';
import { LoadingSpinner } from '../components/ui';

interface FiatCurrenciesPageProps {
  onBack: () => void;
}

const FiatCurrenciesPage: React.FC<FiatCurrenciesPageProps> = ({ onBack }) => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [currencies, setCurrencies] = useState<FiatCurrency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const settings = getFiatSettings();
        setSelectedCurrencies(settings.selectedCurrencies);
        const fiatCurrencies = await wallet.listFiatCurrencies();
        setCurrencies(fiatCurrencies);
      } catch (error) {
        console.error('Failed to load fiat currencies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [wallet]);

  const toggleCurrency = (id: string) => {
    setSelectedCurrencies(prev => {
      const next = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
      saveFiatSettings({ selectedCurrencies: next });
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-2 p-3 border-b-2 border-dashed border-atari-darkgray">
        <button onClick={onBack} className="font-pixel text-base text-atari-midgray hover:text-atari-orange">
          {'<'} BACK
        </button>
        <span className="font-pixel text-lg text-atari-bright uppercase tracking-wider">
          CURRENCIES
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {currencies.map(currency => {
            const isSelected = selectedCurrencies.includes(currency.id);
            return (
              <button
                key={currency.id}
                onClick={() => toggleCurrency(currency.id)}
                className="w-full flex items-center justify-between p-2 border-b border-atari-darkgray/30 hover:bg-atari-darkgray/20"
              >
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-base text-atari-orange">
                    [{isSelected ? 'X' : ' '}]
                  </span>
                  <span className="font-pixel text-base text-atari-lightgray">
                    {currency.id}
                  </span>
                </div>
                <span className="font-pixel text-base text-atari-midgray">
                  {currency.info.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FiatCurrenciesPage;
