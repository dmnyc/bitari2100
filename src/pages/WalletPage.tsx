import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useWallet } from "../contexts/WalletContext";
import { LoadingSpinner } from "../components/ui";
import { playMenuOpen, playMenuClose } from "../services/tiaSoundService";
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
  const prevMenuOpenRef = useRef(false);

  useEffect(() => {
    if (isMenuOpen && !prevMenuOpenRef.current) {
      playMenuOpen();
    } else if (!isMenuOpen && prevMenuOpenRef.current) {
      playMenuClose();
    }
    prevMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

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
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
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
            balanceSats={walletInfo?.balanceSats || 0}
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
      <div className="flex items-center justify-center gap-2 sm:gap-3 p-2 sm:p-3 border-t-3 border-dashed border-atari-darkgray bg-atari-black z-30">
        <button
          onClick={() => setIsSendDialogOpen(true)}
          className="atari-btn atari-btn-send flex-1 flex items-center justify-center gap-1 sm:gap-2"
          data-testid="send-button"
          aria-label="Send"
        >
          <svg
            className="w-[14px] h-[8px] sm:w-[21px] sm:h-[12px] shrink-0"
            viewBox="0 0 7 4"
            shapeRendering="crispEdges"
          >
            <rect x="3" y="0" width="1" height="1" fill="#d4d4d4" />
            <rect x="2" y="1" width="3" height="1" fill="#d4d4d4" />
            <rect x="1" y="2" width="5" height="1" fill="#d4d4d4" />
            <rect x="0" y="3" width="7" height="1" fill="#d4d4d4" />
          </svg>
          <span className="hidden sm:inline">SEND</span>
        </button>

        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="atari-btn atari-btn-secondary !p-2 sm:!p-4"
          aria-label="Scan QR Code"
          data-testid="scan-button"
        >
          <svg
            className="w-[18px] h-[18px] sm:w-[24px] sm:h-[24px] shrink-0"
            viewBox="0 0 7 7"
            shapeRendering="crispEdges"
          >
            <rect x="0" y="0" width="3" height="1" fill="#d4d4d4" />
            <rect x="0" y="1" width="1" height="1" fill="#d4d4d4" />
            <rect x="2" y="1" width="1" height="1" fill="#d4d4d4" />
            <rect x="0" y="2" width="3" height="1" fill="#d4d4d4" />
            <rect x="4" y="0" width="3" height="1" fill="#d4d4d4" />
            <rect x="4" y="1" width="1" height="1" fill="#d4d4d4" />
            <rect x="6" y="1" width="1" height="1" fill="#d4d4d4" />
            <rect x="4" y="2" width="3" height="1" fill="#d4d4d4" />
            <rect x="3" y="3" width="1" height="1" fill="#d4d4d4" />
            <rect x="0" y="4" width="3" height="1" fill="#d4d4d4" />
            <rect x="0" y="5" width="1" height="1" fill="#d4d4d4" />
            <rect x="2" y="5" width="1" height="1" fill="#d4d4d4" />
            <rect x="0" y="6" width="3" height="1" fill="#d4d4d4" />
            <rect x="4" y="4" width="1" height="1" fill="#d4d4d4" />
            <rect x="6" y="4" width="1" height="1" fill="#d4d4d4" />
            <rect x="5" y="5" width="1" height="1" fill="#d4d4d4" />
            <rect x="4" y="6" width="1" height="1" fill="#d4d4d4" />
            <rect x="6" y="6" width="1" height="1" fill="#d4d4d4" />
          </svg>
        </button>

        <button
          onClick={() => setIsReceiveDialogOpen(true)}
          className="atari-btn atari-btn-receive flex-1 flex items-center justify-center gap-1 sm:gap-2"
          data-testid="receive-button"
          aria-label="Receive"
        >
          <svg
            className="w-[14px] h-[8px] sm:w-[21px] sm:h-[12px] shrink-0"
            viewBox="0 0 7 4"
            shapeRendering="crispEdges"
          >
            <rect x="0" y="0" width="7" height="1" fill="#d4d4d4" />
            <rect x="1" y="1" width="5" height="1" fill="#d4d4d4" />
            <rect x="2" y="2" width="3" height="1" fill="#d4d4d4" />
            <rect x="3" y="3" width="1" height="1" fill="#d4d4d4" />
          </svg>
          <span className="hidden sm:inline">RECEIVE</span>
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
