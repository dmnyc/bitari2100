import React, { useMemo, useState, useCallback } from "react";
import type {
  GetInfoResponse,
  Rate,
  FiatCurrency,
} from "@breeztech/breez-sdk-spark";
import { getFiatSettings } from "../services/settings";
import { formatWithThinSpaces } from "../utils/formatNumber";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

interface CollapsingWalletHeaderProps {
  walletInfo: GetInfoResponse | null;
  fiatRates: Rate[];
  fiatCurrencies: FiatCurrency[];
  scrollProgress: number;
  onOpenMenu: () => void;
  hasUnclaimedDeposits: boolean;
  onOpenGetRefund: () => void;
}

const CollapsingWalletHeader: React.FC<CollapsingWalletHeaderProps> = ({
  walletInfo,
  scrollProgress,
  fiatRates,
  fiatCurrencies,
  onOpenMenu,
  hasUnclaimedDeposits,
  onOpenGetRefund,
}) => {
  const [activeFiatIndex, setActiveFiatIndex] = useState(0);

  const ratesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const rate of fiatRates) {
      map.set(rate.coin, rate.value);
    }
    return map;
  }, [fiatRates]);

  const currenciesMap = useMemo(() => {
    const map = new Map<string, FiatCurrency>();
    for (const currency of fiatCurrencies) {
      map.set(currency.id, currency);
    }
    return map;
  }, [fiatCurrencies]);

  const fiatValues = useMemo(() => {
    if (!walletInfo) return [];
    const balanceSat = walletInfo.balanceSats || 0;
    if (balanceSat === 0) return [];
    const balanceBtc = balanceSat / 100000000;
    const settings = getFiatSettings();
    const result: Array<{
      currencyId: string;
      symbol: string;
      value: string;
      symbolPosition: "before" | "after";
    }> = [];

    for (const currencyId of settings.selectedCurrencies) {
      const rateValue = ratesMap.get(currencyId);
      const currency = currenciesMap.get(currencyId);
      if (rateValue === undefined || !currency) continue;
      const value = balanceBtc * rateValue;
      const symbol = currency.info.symbol?.grapheme || currencyId;
      const fractionSize = currency.info.fractionSize || 2;
      result.push({
        currencyId,
        symbol,
        value: value.toFixed(fractionSize),
        symbolPosition: currency.info.symbol?.rtl ? "after" : "before",
      });
    }
    return result;
  }, [walletInfo, ratesMap, currenciesMap]);

  const handleFiatTap = useCallback(() => {
    if (fiatValues.length > 1) {
      setActiveFiatIndex((prev) => (prev + 1) % fiatValues.length);
    }
  }, [fiatValues.length]);

  const currentFiat =
    fiatValues.length > 0
      ? fiatValues[activeFiatIndex % fiatValues.length]
      : null;

  const balanceSat = walletInfo?.balanceSats || 0;
  const animatedBalance = useAnimatedNumber(balanceSat);
  const isCompact = scrollProgress > 0.5;

  if (!walletInfo) return null;

  return (
    <div className="bg-atari-black border-b-2 border-dashed border-atari-darkgray">
      {/* Top bar: menu + warning */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={onOpenMenu}
          className="font-pixel text-lg text-atari-lightgray hover:text-atari-orange"
          aria-label="Open menu"
          data-testid="menu-button"
        >
          [=]
        </button>

        <span className="font-pixel text-lg text-atari-orange tracking-widest">
          BITARI 2100
        </span>

        <div className="flex items-center gap-2">
          {hasUnclaimedDeposits && (
            <button
              onClick={onOpenGetRefund}
              className="font-pixel text-lg text-atari-yellow animate-title-blink"
              title="Rejected deposits need refund"
              aria-label="Get refund for rejected deposits"
            >
              [!]
            </button>
          )}
          {!hasUnclaimedDeposits && <span className="w-8" />}
        </div>
      </div>

      {/* Balance display - collapsible */}
      {!isCompact ? (
        <div className="score-display pb-3">
          <div className="score-label">SCORE</div>
          <div className="score-value" data-testid="wallet-balance">
            {formatWithThinSpaces(animatedBalance)}
          </div>
          <div className="font-pixel text-base text-atari-lightgray mt-2">
            SATS
          </div>
          {currentFiat && (
            <div className="score-fiat cursor-pointer" onClick={handleFiatTap}>
              ~
              {currentFiat.symbolPosition === "before"
                ? currentFiat.symbol
                : ""}
              {currentFiat.value}
              {currentFiat.symbolPosition === "after"
                ? ` ${currentFiat.symbol}`
                : ""}
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 py-2"
          data-testid="wallet-balance"
        >
          <span className="font-pixel text-xl text-atari-bright">
            {formatWithThinSpaces(animatedBalance)}
          </span>
          <span className="font-pixel text-lg text-atari-midgray">SATS</span>
        </div>
      )}
    </div>
  );
};

export default CollapsingWalletHeader;
