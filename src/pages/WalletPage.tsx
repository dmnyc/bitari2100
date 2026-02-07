import React, { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useWallet } from "../contexts/WalletContext";
import { LoadingSpinner } from "../components/ui";
import CollapsingWalletHeader from "../components/CollapsingWalletHeader";
import SideMenu from "../components/SideMenu";
import TransactionList from "../components/TransactionList";
import {
  GetInfoResponse,
  Payment,
  Rate,
  FiatCurrency,
  DepositInfo,
} from "@breeztech/breez-sdk-spark";
import { SendInput } from "@/types/domain";
import {
  mergeDepositsWithTransactions,
  ExtendedPayment,
  isUnclaimedDepositPayment,
} from "@/utils/depositHelpers";

const SendPaymentDialog = lazy(
  () => import("../features/send/SendPaymentDialog"),
);
const ReceivePaymentDialog = lazy(
  () => import("../features/receive/ReceivePaymentDialog"),
);
const QrScannerDialog = lazy(() => import("../components/QrScannerDialog"));
const PaymentDetailsDialog = lazy(
  () => import("../components/PaymentDetailsDialog"),
);
const UnclaimedDepositDetailsPage = lazy(
  () => import("./UnclaimedDepositDetailsPage"),
);

interface WalletPageProps {
  walletInfo: GetInfoResponse | null;
  transactions: Payment[];
  unclaimedDeposits: DepositInfo[];
  fiatRates: Rate[];
  fiatCurrencies: FiatCurrency[];
  refreshWalletData: (showLoading?: boolean) => Promise<void>;
  isRestoring: boolean;
  error: string | null;
  onClearError: () => void;
  onLogout: () => void;
  hasUnclaimedDeposits: boolean;
  onOpenGetRefund: (source?: "menu" | "icon") => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAbout?: () => void;
  onDepositChanged?: () => void;
}

const WalletPage: React.FC<WalletPageProps> = ({
  walletInfo,
  transactions,
  unclaimedDeposits,
  fiatRates,
  fiatCurrencies,
  refreshWalletData,
  isRestoring,
  onLogout,
  hasUnclaimedDeposits,
  onOpenGetRefund,
  onOpenSettings,
  onOpenBackup,
  onOpenAbout,
  onDepositChanged,
}) => {
  const wallet = useWallet();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannerOpenedFromSend, setScannerOpenedFromSend] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(
    null,
  );
  const [paymentInput, setPaymentInput] = useState<SendInput | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const transactionsContainerRef = useRef<HTMLDivElement>(null);
  const dialogStateRef = useRef({
    isSendDialogOpen,
    isReceiveDialogOpen,
    selectedPayment,
    selectedDeposit,
  });
  dialogStateRef.current = {
    isSendDialogOpen,
    isReceiveDialogOpen,
    selectedPayment,
    selectedDeposit,
  };
  const collapseThreshold = 100;

  const handleScroll = useCallback(() => {
    if (transactionsContainerRef.current) {
      const scrollTop = transactionsContainerRef.current.scrollTop;
      const progress = Math.min(1, scrollTop / collapseThreshold);
      setScrollProgress(progress);
    }
  }, [collapseThreshold]);

  const handlePaymentSelected = useCallback(
    (payment: Payment | ExtendedPayment) => {
      const {
        isSendDialogOpen,
        isReceiveDialogOpen,
        selectedPayment,
        selectedDeposit,
      } = dialogStateRef.current;
      if (
        isSendDialogOpen ||
        isReceiveDialogOpen ||
        selectedPayment ||
        selectedDeposit
      ) {
        setIsSendDialogOpen(false);
        setIsReceiveDialogOpen(false);
        setSelectedPayment(null);
        setSelectedDeposit(null);
        return;
      }
      if (isUnclaimedDepositPayment(payment) && payment.depositInfo) {
        setSelectedDeposit(payment.depositInfo);
      } else {
        setSelectedPayment(payment);
      }
    },
    [],
  );

  const handlePaymentDetailsClose = useCallback(
    () => setSelectedPayment(null),
    [],
  );
  const handleDepositDetailsClose = useCallback(
    () => setSelectedDeposit(null),
    [],
  );

  const handleDepositChanged = useCallback(async () => {
    setSelectedDeposit(null);
    onDepositChanged?.();
    await refreshWalletData(false);
  }, [onDepositChanged, refreshWalletData]);

  const handleSendDialogClose = useCallback(() => {
    setIsSendDialogOpen(false);
    setPaymentInput(null);
    refreshWalletData(false);
  }, [refreshWalletData]);

  const handleReceiveDialogClose = useCallback(() => {
    setIsReceiveDialogOpen(false);
    refreshWalletData(false);
  }, [refreshWalletData]);

  const handleQrScannerClose = useCallback(() => {
    setIsQrScannerOpen(false);
    if (scannerOpenedFromSend) {
      setScannerOpenedFromSend(false);
      setIsSendDialogOpen(true);
    }
  }, [scannerOpenedFromSend]);

  const handleScanFromSendDialog = useCallback(() => {
    setIsSendDialogOpen(false);
    setPaymentInput(null);
    setScannerOpenedFromSend(true);
    setIsQrScannerOpen(true);
  }, []);

  const handleQrScan = async (data: string | null) => {
    if (!data) return;
    try {
      const parseResult = await wallet.parseInput(data);
      setIsQrScannerOpen(false);
      setScannerOpenedFromSend(false);
      setPaymentInput({ rawInput: data, parsedInput: parseResult });
      setIsSendDialogOpen(true);
    } catch (error) {
      console.error("Failed to parse QR code:", error);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Restoration overlay */}
      {isRestoring && (
        <div className="absolute inset-0 bg-atari-black z-50 flex items-center justify-center">
          <LoadingSpinner text="RESTORING..." />
        </div>
      )}

      {/* Fixed header with score display */}
      <div className="sticky top-0 z-10">
        <CollapsingWalletHeader
          walletInfo={walletInfo}
          fiatRates={fiatRates}
          fiatCurrencies={fiatCurrencies}
          scrollProgress={scrollProgress}
          onOpenMenu={() => setIsMenuOpen(true)}
          hasUnclaimedDeposits={hasUnclaimedDeposits}
          onOpenGetRefund={() => onOpenGetRefund("icon")}
        />
      </div>

      {/* Scrollable transaction list */}
      <div
        ref={transactionsContainerRef}
        className="flex-grow overflow-y-auto relative z-0"
        onScroll={handleScroll}
      >
        <TransactionList
          transactions={mergeDepositsWithTransactions(
            transactions,
            unclaimedDeposits,
          )}
          onPaymentSelected={handlePaymentSelected}
        />
      </div>

      {/* Dialogs */}
      {isSendDialogOpen && (
        <Suspense fallback={null}>
          <SendPaymentDialog
            isOpen={isSendDialogOpen}
            onClose={handleSendDialogClose}
            initialPaymentInput={paymentInput}
            onScanQr={handleScanFromSendDialog}
          />
        </Suspense>
      )}

      {isReceiveDialogOpen && (
        <Suspense fallback={null}>
          <ReceivePaymentDialog
            isOpen={isReceiveDialogOpen}
            onClose={handleReceiveDialogClose}
          />
        </Suspense>
      )}

      {isQrScannerOpen && (
        <Suspense fallback={null}>
          <QrScannerDialog
            isOpen={isQrScannerOpen}
            onClose={handleQrScannerClose}
            onScan={handleQrScan}
          />
        </Suspense>
      )}

      {selectedPayment && (
        <Suspense fallback={null}>
          <PaymentDetailsDialog
            optionalPayment={selectedPayment}
            onClose={handlePaymentDetailsClose}
          />
        </Suspense>
      )}

      {selectedDeposit && (
        <Suspense fallback={null}>
          <UnclaimedDepositDetailsPage
            deposit={selectedDeposit}
            onBack={handleDepositDetailsClose}
            onChanged={handleDepositChanged}
          />
        </Suspense>
      )}

      {/* Bottom action bar - Atari style */}
      <div className="flex items-center justify-center gap-4 p-4 border-t-3 border-dashed border-atari-darkgray bg-atari-black z-30">
        <button
          onClick={() => setIsSendDialogOpen(true)}
          className="atari-btn atari-btn-send flex-1"
          data-testid="send-button"
        >
          SEND
        </button>

        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="atari-btn atari-btn-secondary"
          aria-label="Scan QR Code"
          data-testid="scan-button"
        >
          [#]
        </button>

        <button
          onClick={() => setIsReceiveDialogOpen(true)}
          className="atari-btn atari-btn-receive flex-1"
          data-testid="receive-button"
        >
          RECEIVE
        </button>
      </div>

      {/* Pause Menu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onOpenBackup={onOpenBackup}
        onOpenRefund={() => onOpenGetRefund("menu")}
        onOpenAbout={onOpenAbout}
        hasRejectedDeposits={hasUnclaimedDeposits}
      />
    </div>
  );
};

export default WalletPage;
