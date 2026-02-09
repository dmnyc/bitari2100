import React, { useMemo } from "react";
import { Payment } from "@breeztech/breez-sdk-spark";
import { formatWithCommas } from "../utils/formatNumber";

const formatWithSpaces = formatWithCommas;

const formatTimeAgo = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diffSeconds = now - timestamp;
  if (diffSeconds < 60) return "NOW";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}M`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}H`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}D`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}MO`;
  return `${Math.floor(diffSeconds / 31536000)}Y`;
};

const getDescription = (payment: Payment): string => {
  if (payment.method === "lightning") {
    if (payment.details?.type === "lightning") {
      if (payment.details.lnurlPayInfo?.lnAddress) {
        return payment.details.lnurlPayInfo.lnAddress;
      }
      return payment.details?.description || "Lightning";
    }
    return "Lightning";
  }
  if (payment.method === "spark") return "Spark";
  if (payment.method === "deposit") return "On-Chain";
  if (payment.method === "withdraw") return "On-Chain";
  return "";
};

/** Green down-arrow (receive — funds coming in) */
const ReceiveArrow = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 5 4"
    shapeRendering="crispEdges"
    className="shrink-0"
  >
    <rect x="0" y="0" width="5" height="1" fill="#5c9c5c" />
    <rect x="1" y="1" width="3" height="1" fill="#5c9c5c" />
    <rect x="2" y="2" width="1" height="1" fill="#5c9c5c" />
  </svg>
);

/** Red up-arrow (send — funds going out) */
const SendArrow = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 5 4"
    shapeRendering="crispEdges"
    className="shrink-0"
  >
    <rect x="2" y="0" width="1" height="1" fill="#984430" />
    <rect x="1" y="1" width="3" height="1" fill="#984430" />
    <rect x="0" y="2" width="5" height="1" fill="#984430" />
  </svg>
);

interface TransactionListProps {
  transactions: Payment[];
  onPaymentSelected: (payment: Payment) => void;
  onRefresh?: () => void;
}

/**
 * Atari scoreboard-style transaction list.
 * Single-line rows: TYPE  DESCRIPTION  AMOUNT
 */
const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onPaymentSelected,
  onRefresh,
}) => {
  const { pendingApproval, regularPayments } = useMemo(() => {
    const pending: Payment[] = [];
    const regular: Payment[] = [];
    for (const tx of transactions) {
      if (tx.method === "deposit" && tx.status === "pending") {
        pending.push(tx);
      } else {
        regular.push(tx);
      }
    }
    return { pendingApproval: pending, regularPayments: regular };
  }, [transactions]);

  const isEmpty = !transactions.length;

  const renderItem = (tx: Payment, index: number) => {
    const isReceive = tx.paymentType === "receive";
    const isPending = tx.status === "pending";
    const isFailed = tx.status === "failed";

    return (
      <div
        key={tx.id || `${tx.timestamp}-${tx.amount}-${index}`}
        className={`tx-row ${isPending ? "opacity-60" : ""}`}
        onClick={() => onPaymentSelected(tx)}
        data-testid="transaction-item"
      >
        {/* Type indicator */}
        <span className="tx-type">
          {isReceive ? <ReceiveArrow /> : <SendArrow />}
        </span>

        {/* Description */}
        <span className={`tx-desc ${isFailed ? "line-through" : ""}`}>
          {getDescription(tx)}
        </span>

        {/* Time */}
        <span className="font-pixel text-xs sm:text-base text-atari-darkgray text-right flex-shrink-0">
          {formatTimeAgo(tx.timestamp)}
        </span>

        {/* Amount */}
        <span
          className={`tx-amount ${
            isFailed
              ? "text-atari-midgray line-through"
              : isReceive
                ? "tx-amount-positive"
                : "tx-amount-negative"
          }`}
          data-testid="transaction-amount"
        >
          {isReceive ? "+" : "-"}
          {formatWithSpaces(Number(tx.amount))}
        </span>
      </div>
    );
  };

  return (
    <div className="py-2">
      {/* HISTORY / REFRESH header — always visible */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="font-pixel text-xs sm:text-base text-atari-midgray tracking-wider">
          HISTORY
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="font-pixel text-xs sm:text-base text-atari-orange hover:text-atari-yellow tracking-wider"
          >
            REFRESH
          </button>
        )}
      </div>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4"
          data-testid="empty-state"
        >
          <div className="font-pixel text-base text-atari-midgray mb-4">
            NO PAYMENTS YET
          </div>
          <div className="font-pixel text-lg text-atari-darkgray text-center leading-relaxed mb-6">
            YOUR SCORE HISTORY WILL
            <br />
            APPEAR HERE
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="font-pixel text-sm text-atari-orange border-2 border-atari-orange px-6 py-3 hover:bg-atari-orange hover:text-atari-black transition-colors"
            >
              REFRESH
            </button>
          )}
        </div>
      ) : (
        <>
          {pendingApproval.length > 0 && (
            <>
              <div className="px-3 py-2">
                <span className="font-pixel text-xs sm:text-base text-atari-yellow tracking-wider">
                  PENDING
                </span>
              </div>
              {pendingApproval.map((tx, i) => renderItem(tx, i))}
              <hr className="pixel-divider mx-3" />
            </>
          )}

          {regularPayments.map((tx, i) => renderItem(tx, i))}
        </>
      )}
    </div>
  );
};

export default TransactionList;
