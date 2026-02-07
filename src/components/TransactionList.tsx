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
  if (payment.method === "deposit") return "BTC Deposit";
  if (payment.method === "withdraw") return "BTC Withdraw";
  return "Payment";
};

interface TransactionListProps {
  transactions: Payment[];
  onPaymentSelected: (payment: Payment) => void;
}

/**
 * Atari scoreboard-style transaction list.
 * Single-line rows: TYPE  DESCRIPTION  AMOUNT
 */
const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onPaymentSelected,
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

  if (!transactions.length) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 px-4"
        data-testid="empty-state"
      >
        <div className="font-pixel text-base text-atari-midgray mb-4">
          NO PAYMENTS YET
        </div>
        <div className="font-pixel text-lg text-atari-darkgray text-center leading-relaxed">
          YOUR SCORE HISTORY WILL
          <br />
          APPEAR HERE
        </div>
      </div>
    );
  }

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
        <span
          className={`tx-type ${isReceive ? "tx-type-receive" : "tx-type-send"}`}
        >
          {isReceive ? "RCV" : "SND"}
        </span>

        {/* Description */}
        <span className={`tx-desc ${isFailed ? "line-through" : ""}`}>
          {getDescription(tx)}
        </span>

        {/* Time */}
        <span className="font-pixel text-base text-atari-darkgray w-10 text-right flex-shrink-0">
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
      {pendingApproval.length > 0 && (
        <>
          <div className="px-3 py-2">
            <span className="font-pixel text-base text-atari-yellow tracking-wider">
              PENDING
            </span>
          </div>
          {pendingApproval.map((tx, i) => renderItem(tx, i))}
          <hr className="pixel-divider mx-3" />
        </>
      )}

      {regularPayments.length > 0 && (
        <>
          <div className="px-3 py-2">
            <span className="font-pixel text-base text-atari-midgray tracking-wider">
              PAYMENTS
            </span>
          </div>
          {regularPayments.map((tx, i) => renderItem(tx, i))}
        </>
      )}
    </div>
  );
};

export default TransactionList;
