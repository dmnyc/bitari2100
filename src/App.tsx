import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import {
  playNavigate,
  playUnmute,
  playWalletReady,
  playGameOver,
  isMuted,
  setMuted,
} from "./services/tiaSoundService";
import { SpaceScene } from "./components/atari/SpaceScene";
import { PixelBolt } from "./components/atari/PixelBolt";
import {
  Config,
  GetInfoResponse,
  Network,
  Payment,
  SdkEvent,
  defaultConfig,
  Rate,
  FiatCurrency,
  DepositInfo,
} from "@breeztech/breez-sdk-spark";
import { WalletProvider, useWallet } from "./contexts/WalletContext";
import LoadingSpinner from "./components/LoadingSpinner";
import PaymentReceivedCelebration from "./components/PaymentReceivedCelebration";

import StagingGate from "./components/StagingGate";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { AudioProvider } from "./contexts/AudioContext";
import AppShell from "./components/layout/AppShell";
import { hideSplash } from "./main";

// Eager-loaded pages (critical path)
import HomePage from "./pages/HomePage";
import WalletPage from "./pages/WalletPage";

// Lazy-loaded pages
const RestorePage = lazy(() => import("./pages/RestorePage"));
const GeneratePage = lazy(() => import("./pages/GeneratePage"));
const GetRefundPage = lazy(() => import("./pages/GetRefundPage"));
const BackupPage = lazy(() => import("./pages/BackupPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const FiatCurrenciesPage = lazy(() => import("./pages/FiatCurrenciesPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ArcadePage = lazy(() => import("./pages/ArcadePage"));

import { getSettings } from "./services/settings";
import { isDepositRejected } from "./services/depositState";
import {
  showPaymentReceivedNotification,
  showDepositClaimedNotification,
} from "./services/notificationService";

// --- URL routing ---
type Screen =
  | "home"
  | "restore"
  | "generate"
  | "wallet"
  | "getRefund"
  | "settings"
  | "backup"
  | "fiatCurrencies"
  | "about"
  | "arcade"
  | "arcade/hashout"
  | "arcade/powman"
  | "arcade/diphopper"
  | "arcade/rom";

const SCREEN_PATHS: Record<Screen, string> = {
  home: "/",
  restore: "/restore",
  generate: "/generate",
  wallet: "/wallet",
  getRefund: "/refund",
  settings: "/settings",
  backup: "/backup",
  fiatCurrencies: "/currencies",
  about: "/about",
  arcade: "/arcade",
  "arcade/hashout": "/arcade/hashout",
  "arcade/powman": "/arcade/powman",
  "arcade/diphopper": "/arcade/diphopper",
  "arcade/rom": "/arcade/rom",
};

const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([s, p]) => [p, s as Screen]),
) as Record<string, Screen>;

/** Look up screen from pathname, stripping trailing slashes. */
function screenFromPath(pathname: string): Screen | undefined {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_SCREEN[normalized];
}

// Main App without toast functionality
const AppContent: React.FC = () => {
  // Screen navigation state — initialise from URL so deep links work
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    () => screenFromPath(window.location.pathname) ?? "home",
  );

  /** Navigate to a screen, pushing a history entry. */
  const navigateTo = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    const path = SCREEN_PATHS[screen];
    if (window.location.pathname !== path) {
      window.history.pushState({ screen }, "", path);
    }
  }, []);

  /** Navigate without pushing history (for internal redirects). */
  const navigateSilent = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    const path = SCREEN_PATHS[screen];
    if (window.location.pathname !== path) {
      window.history.replaceState({ screen }, "", path);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const screen =
        e.state?.screen ?? screenFromPath(window.location.pathname) ?? "home";
      setCurrentScreen(screen);
    };
    window.addEventListener("popstate", handlePopState);
    // Replace initial entry so it has state
    window.history.replaceState(
      { screen: currentScreen },
      "",
      SCREEN_PATHS[currentScreen],
    );
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    playNavigate();
  }, [currentScreen]);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);

  const isInitialLoadRef = useRef<boolean>(true);
  const [walletInfo, setWalletInfo] = useState<GetInfoResponse | null>(null);
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [unclaimedDeposits, setUnclaimedDeposits] = useState<DepositInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fiatRates, setFiatRates] = useState<Rate[]>([]);
  const [fiatCurrencies, setFiatCurrencies] = useState<FiatCurrency[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [hasUnclaimedDeposits, setHasUnclaimedDeposits] =
    useState<boolean>(false);
  const [celebrationAmount, setCelebrationAmount] = useState<number | null>(
    null,
  );
  const [refundAnimationDirection, setRefundAnimationDirection] = useState<
    "horizontal" | "vertical"
  >("horizontal");

  const { showToast } = useToast();

  useEffect(() => {
    const lnurlEnabled = config?.lnurlDomain ? "true" : "false";
    document.body.setAttribute("data-lnurl-enabled", lnurlEnabled);
    return () => {
      document.body.setAttribute("data-lnurl-enabled", "false");
    };
  }, [config?.lnurlDomain]);

  const eventListenerIdRef = useRef<string | null>(null);
  const shownPaymentIdsRef = useRef<Set<string>>(new Set());
  const currentScreenRef = useRef(currentScreen);
  currentScreenRef.current = currentScreen;

  const wallet = useWallet();

  const refreshWalletData = useCallback(
    async (showLoading: boolean = true) => {
      if (!isConnected) return;

      try {
        if (showLoading) {
          setIsLoading(true);
        }

        const [info, txns] = await Promise.all([
          wallet.getWalletInfo(),
          wallet.getTransactions(),
        ]);

        setWalletInfo(info);
        setTransactions(txns);
      } catch (error) {
        console.error("Error refreshing wallet data:", error);
        setError("Failed to refresh wallet data.");
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [isConnected, wallet],
  );

  const fetchUnclaimedDeposits = useCallback(async () => {
    try {
      const deposits = await wallet.unclaimedDeposits();
      setUnclaimedDeposits(deposits);
      const hasRejected = deposits.some((d) =>
        isDepositRejected(d.txid, d.vout),
      );
      setHasUnclaimedDeposits(hasRejected);
    } catch (e) {
      console.warn("Failed to fetch unclaimed deposits:", e);
      setUnclaimedDeposits([]);
      setHasUnclaimedDeposits(false);
    }
  }, [wallet]);

  const handleSdkEvent = useCallback(
    (event: SdkEvent) => {
      console.log("SDK event received:", event);

      if (event.type === "synced") {
        console.log("Synced event received, refreshing data...");

        if (isRestoring) {
          console.log("Restoration sync complete. Hiding overlay.");
          setIsRestoring(false);
        }

        document.body.setAttribute("data-wallet-synced", "true");
        refreshWalletData(false);
        fetchUnclaimedDeposits();
      } else if (event.type === "paymentSucceeded") {
        console.log("Payment succeeded event received");
        const paymentId = event.payment.id;

        if (!shownPaymentIdsRef.current.has(paymentId)) {
          shownPaymentIdsRef.current.add(paymentId);
          setTimeout(() => shownPaymentIdsRef.current.delete(paymentId), 30000);

          const isReceived = event.payment.paymentType === "receive";
          const amountSats = Number(event.payment.amount);

          if (isReceived) {
            setCelebrationAmount(amountSats);
            showPaymentReceivedNotification(amountSats);
          } else if (currentScreenRef.current !== "arcade") {
            showToast(
              "success",
              "PAYMENT SENT",
              <span className="flex items-center gap-1">
                <PixelBolt size={10} />
                {Number(event.payment.amount).toLocaleString()} TRANSMITTED
              </span>,
            );
          }
        }
        refreshWalletData(false);
      } else if (event.type === "claimedDeposits") {
        console.log("Claim deposits succeeded event received");
        if (currentScreenRef.current !== "getRefund") {
          showToast(
            "success",
            "DEPOSITS CLAIMED",
            `${event.claimedDeposits.length} DEPOSITS SECURED`,
          );
        }
        showDepositClaimedNotification(event.claimedDeposits.length);
        refreshWalletData(false);
        fetchUnclaimedDeposits();
      } else if (event.type === "unclaimedDeposits") {
        console.log("Claim deposits failed event received");
        if (currentScreenRef.current !== "getRefund") {
          showToast(
            "error",
            "CLAIM FAILED",
            `${event.unclaimedDeposits.length} DEPOSITS UNCLAIMED`,
          );
        }
        fetchUnclaimedDeposits();
      }
    },
    [refreshWalletData, showToast, isRestoring, fetchUnclaimedDeposits],
  );

  const fetchFiatData = useCallback(async () => {
    try {
      const [rates, currencies] = await Promise.all([
        wallet.listFiatRates(),
        wallet.listFiatCurrencies(),
      ]);
      setFiatRates(rates);
      setFiatCurrencies(currencies);
    } catch (error) {
      console.warn("Failed to fetch fiat data:", error);
    }
  }, [wallet]);

  useEffect(() => {
    if (isConnected) {
      fetchFiatData();
      const interval = setInterval(fetchFiatData, 60000);
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchFiatData]);

  // Try to connect with saved mnemonic on app startup
  useEffect(() => {
    const savedMnemonic = wallet.getSavedMnemonic();
    if (savedMnemonic) {
      connectWallet(savedMnemonic, false);
      // Restore screen from URL if it's an authenticated page, else default to wallet
      const urlScreen = screenFromPath(window.location.pathname);
      const authScreens: Screen[] = [
        "wallet",
        "settings",
        "backup",
        "fiatCurrencies",
        "about",
        "getRefund",
        "arcade",
        "arcade/hashout",
        "arcade/powman",
        "arcade/diphopper",
        "arcade/rom",
      ];
      const target =
        urlScreen && authScreens.includes(urlScreen) ? urlScreen : "wallet";
      navigateSilent(target);
    } else {
      // Allow arcade without auth
      const urlScreen = screenFromPath(window.location.pathname);
      const isArcade = urlScreen?.startsWith("arcade") ?? false;
      navigateSilent(isArcade && urlScreen ? urlScreen : "home");
      setIsLoading(false);
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      hideSplash();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initialization
  }, []);

  // Cleanup event listener on unmount
  useEffect(() => {
    return () => {
      if (eventListenerIdRef.current) {
        wallet
          .removeEventListener(eventListenerIdRef.current)
          .catch((error) =>
            console.error("Error removing event listener:", error),
          );
        eventListenerIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only cleanup
  }, []);

  const connectWallet = (
    mnemonic: string,
    restore: boolean,
    overrideNetwork?: Network,
    playSound: boolean = false,
  ) => {
    if (wallet.connected()) {
      return;
    }
    setError(null);

    const breezApiKey = import.meta.env.VITE_BREEZ_API_KEY;

    if (!breezApiKey) {
      showToast("error", "MISSING API KEY", "ADD VITE_BREEZ_API_KEY TO .ENV");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const network = (overrideNetwork ??
      urlParams.get("network") ??
      "mainnet") as Network;
    const config: Config = defaultConfig(network);
    config.apiKey = breezApiKey;
    config.privateEnabledDefault = false;

    try {
      const s = getSettings();
      if (s.depositMaxFee) {
        config.maxDepositClaimFee = s.depositMaxFee;
      }
      if (s.syncIntervalSecs != null) {
        config.syncIntervalSecs = s.syncIntervalSecs;
      }
      if (s.lnurlDomain != null) {
        config.lnurlDomain = s.lnurlDomain;
      }
      if (s.preferSparkOverLightning != null) {
        config.preferSparkOverLightning = s.preferSparkOverLightning;
      }
    } catch (e) {
      console.warn("Failed to apply user settings to config:", e);
    }

    setConfig(config);

    // Show wallet page immediately with connecting overlay
    setIsConnected(true);
    setIsConnecting(true);
    setIsRestoring(restore);
    setIsLoading(false);
    wallet.saveMnemonic(mnemonic);

    // Connect in background
    wallet
      .initWallet(mnemonic, config)
      .then(() => {
        setIsConnecting(false);
        setIsRestoring(false);
        if (playSound) playWalletReady();

        // Register event listener now that SDK is ready
        wallet
          .addEventListener(handleSdkEvent)
          .then((listenerId) => {
            eventListenerIdRef.current = listenerId;
          })
          .catch((error) => {
            console.error("Failed to add event listener:", error);
          });

        // Fetch data immediately + retry after 3s (sync may have completed during connect)
        const fetchData = () =>
          Promise.all([wallet.getWalletInfo(), wallet.getTransactions()])
            .then(([info, txns]) => {
              setWalletInfo(info);
              setTransactions(txns);
            })
            .catch((e) => console.warn("Data fetch error:", e));

        fetchData();
        setTimeout(fetchData, 3000);
        fetchUnclaimedDeposits().catch(() => {});
      })
      .catch((error) => {
        console.error("Error connecting wallet:", error);
        setIsConnecting(false);
        setIsRestoring(false);
        setIsConnected(false);
        setConfig(null);
        wallet.clearMnemonic();
        navigateSilent("home");
        setError(
          "Failed to connect wallet. Please check your mnemonic and try again.",
        );
      });
  };

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isConnected) {
        await wallet.disconnect();
      }

      wallet.clearMnemonic();

      setIsConnected(false);
      setWalletInfo(null);
      setTransactions([]);
      setConfig(null);

      setShowGameOver(true);
      playGameOver();

      setTimeout(() => {
        setShowGameOver(false);
        navigateSilent("home");
      }, 3000);
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out properly. Please try again.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const navigateToRestore = () => navigateTo("restore");
  const navigateToGenerate = () => navigateTo("generate");
  const navigateToHome = () => navigateTo("home");
  const clearError = () => setError(null);

  // Atari-themed loading screen
  const AtariLoading = () => (
    <div className="absolute inset-0 bg-atari-black z-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  const renderCurrentScreen = () => {
    if (isLoading && isInitialLoadRef.current) {
      return null;
    }

    if (isLoading) {
      return <AtariLoading />;
    }

    switch (currentScreen) {
      case "home":
        return (
          <HomePage
            onRestoreWallet={navigateToRestore}
            onCreateNewWallet={navigateToGenerate}
            onOpenArcade={() => navigateTo("arcade")}
          />
        );

      case "getRefund":
        return (
          <Suspense fallback={<AtariLoading />}>
            <GetRefundPage
              onBack={() => navigateTo("wallet")}
              animationDirection={refundAnimationDirection}
            />
          </Suspense>
        );

      case "settings":
        return (
          <Suspense fallback={<AtariLoading />}>
            <SettingsPage
              onBack={() => navigateTo("wallet")}
              config={config}
              onOpenFiatCurrencies={() => navigateTo("fiatCurrencies")}
            />
          </Suspense>
        );

      case "fiatCurrencies":
        return (
          <Suspense fallback={<AtariLoading />}>
            <FiatCurrenciesPage onBack={() => navigateTo("settings")} />
          </Suspense>
        );

      case "backup":
        return (
          <Suspense fallback={<AtariLoading />}>
            <BackupPage onBack={() => navigateTo("wallet")} />
          </Suspense>
        );

      case "restore":
        return (
          <Suspense fallback={<AtariLoading />}>
            <RestorePage
              onConnect={(mnemonic) => {
                connectWallet(mnemonic, true, undefined, true);
                navigateSilent("wallet");
              }}
              onBack={navigateToHome}
              onClearError={clearError}
            />
          </Suspense>
        );

      case "generate":
        return (
          <Suspense fallback={<AtariLoading />}>
            <GeneratePage
              onMnemonicConfirmed={(mnemonic) => {
                connectWallet(mnemonic, false, undefined, true);
                navigateSilent("wallet");
              }}
              onBack={navigateToHome}
              error={error}
              onClearError={clearError}
            />
          </Suspense>
        );

      case "wallet":
        return (
          <WalletPage
            walletInfo={walletInfo}
            transactions={transactions}
            unclaimedDeposits={unclaimedDeposits}
            fiatRates={fiatRates}
            fiatCurrencies={fiatCurrencies}
            isConnecting={isConnecting}
            refreshWalletData={refreshWalletData}
            isRestoring={isRestoring}
            error={error}
            onClearError={clearError}
            onLogout={handleLogout}
            hasUnclaimedDeposits={hasUnclaimedDeposits}
            onOpenGetRefund={(source?: "menu" | "icon") => {
              setRefundAnimationDirection(
                source === "icon" ? "vertical" : "horizontal",
              );
              navigateTo("getRefund");
            }}
            onOpenSettings={() => navigateTo("settings")}
            onOpenBackup={() => navigateTo("backup")}
            onOpenAbout={() => navigateTo("about")}
            onOpenArcade={() => navigateTo("arcade")}
            onDepositChanged={fetchUnclaimedDeposits}
          />
        );

      case "about":
        return (
          <Suspense fallback={<AtariLoading />}>
            <AboutPage onBack={() => navigateTo("wallet")} />
          </Suspense>
        );

      case "arcade":
      case "arcade/hashout":
      case "arcade/powman":
      case "arcade/diphopper":
      case "arcade/rom":
        return (
          <Suspense fallback={<AtariLoading />}>
            <ArcadePage
              onBack={() => navigateTo(isConnected ? "wallet" : "home")}
              onCreateWallet={isConnected ? undefined : navigateToGenerate}
              onRestoreWallet={isConnected ? undefined : navigateToRestore}
              initialGame={
                currentScreen === "arcade/hashout"
                  ? "hashout"
                  : currentScreen === "arcade/powman"
                    ? "powman"
                    : currentScreen === "arcade/diphopper"
                      ? "diphopper"
                      : currentScreen === "arcade/rom"
                        ? "rom"
                        : undefined
              }
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      default:
        return (
          <div className="flex items-center justify-center min-h-full">
            <span className="font-pixel text-atari-red">UNKNOWN SCREEN</span>
          </div>
        );
    }
  };

  const [muted, setMutedState] = useState(isMuted);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
    if (!next) playUnmute();
  }, []);

  return (
    <AudioProvider value={{ muted, toggleMute: handleToggleMute }}>
      {renderCurrentScreen()}
      {celebrationAmount !== null && (
        <PaymentReceivedCelebration
          amount={celebrationAmount}
          onClose={() => setCelebrationAmount(null)}
        />
      )}
      {showGameOver && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black">
          <SpaceScene />
          <div className="relative z-10 font-pixel text-2xl sm:text-4xl text-atari-red tracking-wider animate-title-blink">
            GAME OVER
          </div>
        </div>
      )}
    </AudioProvider>
  );
};

function App() {
  return (
    <StagingGate>
      <ToastProvider>
        <WalletProvider>
          <AppShell>
            <AppContent />
          </AppShell>
        </WalletProvider>
      </ToastProvider>
    </StagingGate>
  );
}

export default App;
