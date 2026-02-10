import React, { useCallback, useEffect, useRef, useState } from "react";
import { AtariButton } from "../components/atari/AtariButton";
import { MuteButton } from "../components/atari/MuteButton";
import { QRCodeContainer } from "../components/ui/QRCodeContainer";
import { useWallet } from "../contexts/WalletContext";
import { useToast } from "../contexts/ToastContext";
import { useAudio } from "../contexts/AudioContext";
import {
  playClick,
  playNavigate,
  playCelebration,
} from "../services/tiaSoundService";
import { createHashBreaker } from "../games/HashBreaker";
import { createPowMan } from "../games/PowMan";

const ZAP_ADDRESS = "bitari2100@breez.tips";
const ZAP_AMOUNT = 21; // sats per game
const FREE_PLAY_KEY = "bitari_arcade_free_used";

// Dev mode: unlimited free play on localhost
const IS_DEV = import.meta.env.DEV;

type ArcadeScreen = "menu" | "donate" | "playing" | "rom";

interface ArcadePageProps {
  onBack: () => void;
  onCreateWallet?: () => void;
  initialGame?: "hashout" | "powman" | "rom";
  onNavigate?: (
    screen: "arcade" | "arcade/hashout" | "arcade/powman" | "arcade/rom",
  ) => void;
}

const ArcadePage: React.FC<ArcadePageProps> = ({
  onBack,
  onCreateWallet,
  initialGame,
  onNavigate,
}) => {
  const wallet = useWallet();
  const { showToast } = useToast();
  const { muted } = useAudio();
  const [screen, setScreen] = useState<ArcadeScreen>(
    initialGame === "rom" ? "rom" : initialGame ? "donate" : "menu",
  );
  const [selectedGame, setSelectedGame] = useState<string>(
    initialGame === "rom" ? "hashout" : (initialGame ?? "hashout"),
  );
  const [isZapping, setIsZapping] = useState(false);
  const [, setGameState] = useState<string>("title");
  const [balanceSats, setBalanceSats] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const hasFreePlayed = sessionStorage.getItem(FREE_PLAY_KEY) === "true";

  // Check if user has a wallet (is authenticated)
  const hasWallet = wallet.connected();

  // Sync Javatari audio with our global mute state
  useEffect(() => {
    const speaker = (window as any).Javatari?.room?.speaker;
    if (!speaker) return;
    // pause() disconnects the WebAudio gain node — true silence
    // unpause() reconnects it — no effect on emulation or keyboard
    if (muted) {
      speaker.pause();
    } else {
      speaker.unpause();
    }
  }, [muted]);

  // Fetch balance when donate screen opens
  useEffect(() => {
    if (screen !== "donate" || !hasWallet) return;
    wallet
      .getWalletInfo()
      .then((info) => {
        if (info) setBalanceSats(info.balanceSats);
      })
      .catch(() => {});
  }, [screen, hasWallet, wallet]);

  // --- Zap via wallet (per game) ---
  const handleZap = useCallback(async () => {
    setIsZapping(true);
    try {
      const parsed = await wallet.parseInput(ZAP_ADDRESS);
      if (parsed.type !== "lightningAddress") {
        throw new Error("Could not resolve lightning address");
      }
      const prepareResponse = await wallet.prepareLnurlPay({
        payRequest: parsed.payRequest,
        amountSats: ZAP_AMOUNT,
      });
      await wallet.lnurlPay({ prepareResponse });
      playClick();
      setScreen("playing");
    } catch (err) {
      console.error("Zap failed:", err);
      showToast(
        "error",
        `Zap failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsZapping(false);
    }
  }, [wallet, showToast]);

  // --- Free play (1 per session, unlimited in dev) ---
  const handleFreePlay = useCallback(() => {
    if (!IS_DEV) {
      sessionStorage.setItem(FREE_PLAY_KEY, "true");
    }
    playClick();
    setScreen("playing");
  }, []);

  // --- Payment confirmed (from QR invoice) ---
  const handlePaymentConfirmed = useCallback(() => {
    playCelebration();
    setScreen("playing");
  }, []);

  // --- Start game ---
  const startPlaying = useCallback(
    (game: string) => {
      setSelectedGame(game);
      if (game === "hashout" || game === "powman") {
        // Update URL to game-specific path
        onNavigate?.(`arcade/${game}` as "arcade/hashout" | "arcade/powman");
        if (IS_DEV) {
          setScreen("playing");
        } else {
          setScreen("donate");
        }
      }
    },
    [onNavigate],
  );

  // --- Integer-scale the canvas for crisp pixel rendering ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  const nativeW = selectedGame === "powman" ? 336 : 320;
  const nativeH = selectedGame === "powman" ? 280 : 240;

  useEffect(() => {
    if (screen !== "playing" || !containerRef.current) return;
    const updateScale = () => {
      const maxW = containerRef.current!.clientWidth - 4; // account for border
      const maxH = window.innerHeight * 0.75;
      const scaleW = Math.floor(maxW / nativeW) || 1;
      const scaleH = Math.floor(maxH / nativeH) || 1;
      setCanvasScale(Math.min(scaleW, scaleH));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [screen, nativeW, nativeH]);

  // --- Game lifecycle ---
  useEffect(() => {
    if (screen !== "playing" || !canvasRef.current) return;

    const factory =
      selectedGame === "powman" ? createPowMan : createHashBreaker;
    const game = factory(canvasRef.current, setGameState);
    gameRef.current = game;
    game.start();

    return () => {
      game.stop();
      gameRef.current = null;
    };
  }, [screen, selectedGame]);

  // --- ROM loader ---
  const handleLoadRom = useCallback(() => {
    setScreen("rom");
    onNavigate?.("arcade/rom");
  }, [onNavigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gameRef.current?.stop();
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-atari-black">
      {/* Header */}
      <div className="p-3 border-b-2 border-dashed border-atari-darkgray flex items-center safe-top">
        <button
          className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
          onClick={() => {
            playNavigate();
            if (
              screen === "playing" ||
              screen === "donate" ||
              screen === "rom"
            ) {
              gameRef.current?.stop();
              setScreen("menu");
              onNavigate?.("arcade");
            } else {
              onBack();
            }
          }}
        >
          {"<"} BACK
        </button>
        <span className="font-pixel text-sm sm:text-lg text-atari-bright tracking-wider flex-1 text-center">
          ARCADE
        </span>
        <MuteButton />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {screen === "menu" && (
          <GameMenu onSelectGame={startPlaying} onLoadRom={handleLoadRom} />
        )}

        {screen === "donate" && (
          <DonateGate
            wallet={wallet}
            hasWallet={hasWallet}
            balanceSats={balanceSats}
            hasFreePlayed={hasFreePlayed}
            isZapping={isZapping}
            onZap={handleZap}
            onFreePlay={handleFreePlay}
            onPaymentConfirmed={handlePaymentConfirmed}
            onCreateWallet={onCreateWallet}
          />
        )}

        {screen === "playing" && (
          <div ref={containerRef} className="flex flex-col items-center w-full">
            <canvas
              ref={canvasRef}
              className="border-2 border-atari-darkgray"
              style={{
                imageRendering: "pixelated",
                width: nativeW * canvasScale,
                height: nativeH * canvasScale,
              }}
            />
          </div>
        )}

        {screen === "rom" && <RomLoader />}
      </div>
    </div>
  );
};

// --- Game Menu ---
function GameMenu({
  onSelectGame,
  onLoadRom,
}: {
  onSelectGame: (game: string) => void;
  onLoadRom: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="font-pixel text-lg text-atari-orange text-center tracking-wider">
        SELECT GAME
      </div>

      {/* Hash-Out */}
      <button
        className="w-full max-w-sm border-2 border-atari-darkgray p-4 hover:border-atari-orange transition-colors"
        onClick={() => {
          playClick();
          onSelectGame("hashout");
        }}
      >
        <div className="font-pixel text-xl sm:text-2xl text-atari-yellow mb-2 text-center">
          HASH-OUT
        </div>
        <div className="font-pixel text-sm text-atari-midgray text-center">
          BREAKOUT-STYLE BLOCK MINING
        </div>
      </button>

      {/* POW-MAN */}
      <button
        className="w-full max-w-sm border-2 border-atari-darkgray p-4 hover:border-atari-orange transition-colors"
        onClick={() => {
          playClick();
          onSelectGame("powman");
        }}
      >
        <div className="font-pixel text-xl sm:text-2xl text-atari-yellow mb-2 text-center">
          POW-MAN
        </div>
        <div className="font-pixel text-sm text-atari-midgray text-center">
          PAC-MAN STYLE MAZE CHASE
        </div>
      </button>

      {/* Coming soon placeholders */}
      {[
        "ZAP INVADERS",
        "MOON LANDER",
        "LUNAR ROVER",
        "SATOSHI'S QUEST",
        "DIP HOPPER",
      ].map((name) => (
        <div
          key={name}
          className="w-full max-w-sm border-2 border-dashed border-atari-darkgray p-4 opacity-40"
        >
          <div className="font-pixel text-lg sm:text-xl text-atari-midgray mb-2 text-center">
            {name}
          </div>
          <div className="font-pixel text-xs text-atari-darkgray text-center">
            COMING SOON
          </div>
        </div>
      ))}

      {/* Load ROM */}
      <div className="w-full max-w-sm mt-4 pt-4 border-t-2 border-dashed border-atari-darkgray">
        <AtariButton
          variant="secondary"
          fullWidth
          onClick={() => {
            playClick();
            onLoadRom();
          }}
        >
          LOAD ROM
        </AtariButton>
        <div className="font-pixel text-xs text-atari-darkgray text-center mt-2">
          LOAD YOUR OWN ATARI 2600 ROM
        </div>
      </div>
    </div>
  );
}

// --- Donate Gate ---
function DonateGate({
  wallet,
  hasWallet,
  balanceSats,
  hasFreePlayed,
  isZapping,
  onZap,
  onFreePlay,
  onPaymentConfirmed,
  onCreateWallet,
}: {
  wallet: ReturnType<typeof useWallet>;
  hasWallet: boolean;
  balanceSats: number;
  hasFreePlayed: boolean;
  isZapping: boolean;
  onZap: () => void;
  onFreePlay: () => void;
  onPaymentConfirmed: () => void;
  onCreateWallet?: () => void;
}) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const listenerIdRef = useRef<string | null>(null);

  // Generate a bolt11 invoice for 21 sats and listen for payment
  useEffect(() => {
    if (!hasWallet) return;

    let cancelled = false;

    async function setup() {
      // Generate invoice
      setGeneratingInvoice(true);
      try {
        const resp = await wallet.receivePayment({
          paymentMethod: {
            type: "bolt11Invoice",
            description: "Bitari Arcade - 21 sats",
            amountSats: ZAP_AMOUNT,
            expirySecs: 600,
          },
        });
        if (!cancelled) {
          setInvoice(resp.paymentRequest);
        }
      } catch (err) {
        console.error("Failed to generate invoice:", err);
      } finally {
        if (!cancelled) setGeneratingInvoice(false);
      }

      // Listen for incoming payment
      try {
        const listenerId = await wallet.addEventListener((event) => {
          if (
            event.type === "paymentSucceeded" ||
            event.type === "paymentPending"
          ) {
            onPaymentConfirmed();
          }
        });
        if (!cancelled) {
          listenerIdRef.current = listenerId;
        } else {
          wallet.removeEventListener(listenerId).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to add event listener:", err);
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (listenerIdRef.current) {
        wallet.removeEventListener(listenerIdRef.current).catch(() => {});
        listenerIdRef.current = null;
      }
    };
  }, [hasWallet, wallet, onPaymentConfirmed]);

  const hasBalance = balanceSats >= ZAP_AMOUNT;

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="font-pixel text-lg text-atari-yellow text-center">
        INSERT COIN
      </div>

      <div className="font-pixel text-xs text-atari-midgray text-center max-w-xs leading-relaxed">
        ZAP 21 SATS TO PLAY
      </div>

      {/* Yellow bolt + 21 sats */}
      <div className="flex items-center gap-3">
        <svg
          width="20"
          height="28"
          viewBox="0 0 6 8"
          shapeRendering="crispEdges"
          className="shrink-0"
        >
          <rect x="1" y="0" width="4" height="1" fill="#ffff55" />
          <rect x="1" y="1" width="3" height="1" fill="#ffff55" />
          <rect x="0" y="2" width="3" height="1" fill="#ffff55" />
          <rect x="0" y="3" width="5" height="1" fill="#ffff55" />
          <rect x="2" y="4" width="2" height="1" fill="#ffff55" />
          <rect x="1" y="5" width="2" height="1" fill="#ffff55" />
          <rect x="0" y="6" width="2" height="1" fill="#ffff55" />
        </svg>
        <span className="font-pixel text-2xl text-atari-yellow">21</span>
      </div>

      {/* Zap from wallet (only if sufficient balance) */}
      {hasWallet && hasBalance && (
        <AtariButton variant="primary" onClick={onZap} disabled={isZapping}>
          {isZapping ? "ZAPPING..." : "ZAP 21 SATS"}
        </AtariButton>
      )}

      {/* QR code invoice for external payment */}
      {hasWallet && (
        <div className="flex flex-col items-center gap-3 mt-2">
          {generatingInvoice && (
            <div className="font-pixel text-xs text-atari-midgray">
              GENERATING INVOICE...
            </div>
          )}
          {invoice && (
            <>
              <div className="font-pixel text-xs text-atari-midgray mb-1">
                {hasBalance ? "OR SCAN TO PAY" : "SCAN TO PAY"}
              </div>
              <QRCodeContainer value={invoice} size={280} />
              <div className="font-pixel text-xs text-atari-darkgray text-center mt-1">
                WAITING FOR PAYMENT...
              </div>
            </>
          )}
        </div>
      )}

      {/* Wallet CTA for unauthenticated users */}
      {!hasWallet && onCreateWallet && (
        <div className="flex flex-col items-center gap-3 mt-2">
          <div className="font-pixel text-xs text-atari-midgray text-center max-w-xs leading-relaxed">
            CREATE A WALLET TO ZAP
          </div>
          <AtariButton variant="primary" onClick={onCreateWallet}>
            CREATE WALLET
          </AtariButton>
        </div>
      )}

      {/* Free play */}
      {!hasFreePlayed ? (
        <AtariButton variant="secondary" onClick={onFreePlay}>
          PLAY FREE (1 SESSION)
        </AtariButton>
      ) : (
        <div className="font-pixel text-xs text-atari-darkgray mt-4">
          FREE PLAY USED — ZAP TO PLAY
        </div>
      )}
    </div>
  );
}

// Javatari ConsoleControls numeric IDs
const JT_CONTROLS = {
  POWER: 51,
  SELECT: 53,
  RESET: 54,
} as const;

/** Send a console control press+release to Javatari via the consoleControlsSocket */
function jtControl(control: number) {
  const jt = (window as any).Javatari;
  const socket = jt?.room?.console?.getConsoleControlsSocket?.();
  if (!socket) return;
  socket.controlStateChanged(control, true);
  setTimeout(() => socket.controlStateChanged(control, false), 80);
}

/** Focus the Javatari screen element so keyboard input works */
function focusJtScreen() {
  const el = document.getElementById("javatari-screen");
  if (el) el.focus();
}

// --- ROM Loader (Javatari.js) ---
function RomLoader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLoaded] = useState(false);
  const [romName, setRomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRomFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      try {
        const jt = (window as any).Javatari;
        if (!jt?.room?.fileLoader) {
          setError("Emulator not ready — try again in a moment");
          return;
        }
        jt.room.fileLoader.loadFromContent(
          file.name,
          data,
          jt.fileLoader?.OPEN_TYPE?.ROM ?? "ROM",
          0,
          true,
          false,
        );
        // Power on the console after loading, then focus for keyboard input
        setTimeout(() => {
          if (jt.room?.console) {
            jt.room.console.userPowerOn();
          }
          focusJtScreen();
        }, 100);
        setRomName(file.name.replace(/\.[^.]+$/, ""));
        setLoaded(true);
        setError(null);
      } catch (err) {
        console.error("ROM load error:", err);
        setError("Failed to load ROM");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Load Javatari.js script
  useEffect(() => {
    const jt = (window as any).Javatari;

    // Already loaded from a previous visit — power it back on
    if (jt?.room) {
      try {
        jt.room.powerOn();
      } catch {
        /* noop */
      }
      setLoaded(true);
      return;
    }

    const w = window as any;
    w.Javatari = {
      SCREEN_ELEMENT_ID: "javatari-screen",
      SCREEN_CONSOLE_PANEL_DISABLED: true,
      SCREEN_CONTROL_BAR: -1, // hidden
      SCREEN_RESIZE_DISABLED: true, // sized via CSS
      SCREEN_FULLSCREEN_MODE: -2, // disable built-in fullscreen
      CARTRIDGE_CHANGE_DISABLED: true, // we handle ROM loading
      CARTRIDGE_SHOW_RECENT: false,
      SCREEN_DEFAULT_SCALE: -1,
      SCREEN_FILTER_MODE: 0,
      TOUCH_MODE: -1,
      AUTO_START: false, // start manually after script loads
      AUTO_POWER_ON_DELAY: 0,
    };

    const script = document.createElement("script");
    script.src = "/lib/javatari.js";
    script.onload = () => {
      // In a SPA, DOMContentLoaded and window.load have already fired,
      // so Javatari's auto-start never triggers. Start it manually.
      try {
        const jt = (window as any).Javatari;
        if (jt?.start) {
          jt.start();
        }
      } catch (err) {
        console.error("Javatari start error:", err);
        setError("Failed to start emulator");
      }
      setLoaded(true);
    };
    script.onerror = () => {
      setError("Failed to load emulator");
    };
    document.body.appendChild(script);

    return () => {
      const jtCleanup = (window as any).Javatari;
      if (jtCleanup?.room?.powerOff) {
        try {
          jtCleanup.room.powerOff();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {!romName && (
        <div className="font-pixel text-sm text-atari-orange text-center tracking-wider">
          ATARI 2600 EMULATOR
        </div>
      )}

      {error && (
        <div className="font-pixel text-xs text-atari-red text-center">
          {error}
        </div>
      )}

      {/* Javatari screen — constrain height so it doesn't eat all space */}
      <div ref={containerRef} className="w-full max-w-lg">
        <div id="javatari" style={{ textAlign: "center", margin: "0 auto" }}>
          <div
            id="javatari-screen"
            className="border-2 border-atari-darkgray"
            style={{ boxShadow: "2px 2px 10px rgba(0,0,0,.7)" }}
          />
        </div>
      </div>

      {/* ROM name + console controls */}
      {romName && (
        <div className="w-full max-w-lg">
          <div className="font-pixel text-xs text-atari-yellow text-center mb-2 truncate px-2">
            {romName.toUpperCase()}
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                playClick();
                const jt = (window as any).Javatari;
                if (jt?.room?.console) {
                  jt.room.console.userPowerOn();
                }
                focusJtScreen();
              }}
              className="font-pixel text-xs px-3 py-2 border-2 border-atari-darkgray text-atari-lightgray hover:border-atari-orange hover:text-atari-orange"
            >
              POWER
            </button>
            <button
              onClick={() => {
                playClick();
                jtControl(JT_CONTROLS.SELECT);
                focusJtScreen();
              }}
              className="font-pixel text-xs px-3 py-2 border-2 border-atari-darkgray text-atari-lightgray hover:border-atari-orange hover:text-atari-orange"
            >
              SELECT
            </button>
            <button
              onClick={() => {
                playClick();
                jtControl(JT_CONTROLS.RESET);
                focusJtScreen();
              }}
              className="font-pixel text-xs px-3 py-2 border-2 border-atari-darkgray text-atari-lightgray hover:border-atari-orange hover:text-atari-orange"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* ROM file picker — always visible, right below controls */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bin,.rom,.a26,.zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadRomFile(file);
        }}
      />

      <AtariButton
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        {romName ? "CHANGE ROM" : "SELECT ROM FILE"}
      </AtariButton>

      <div className="font-pixel text-xs text-atari-darkgray text-center max-w-xs leading-relaxed">
        {romName ? "" : "SUPPORTS .BIN .ROM .A26 .ZIP FILES"}
      </div>

      {!romName && (
        <div className="font-pixel text-xs text-atari-darkgray text-center mt-1 max-w-xs leading-relaxed">
          POWERED BY JAVATARI.JS
        </div>
      )}
    </div>
  );
}

export default ArcadePage;
