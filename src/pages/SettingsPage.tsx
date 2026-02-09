import React, { useEffect, useState } from "react";
import { Switch, FormError } from "../components/ui";
import { MuteButton } from "../components/atari/MuteButton";
import { getSettings, saveSettings } from "../services/settings";
import type { Config, Network } from "@breeztech/breez-sdk-spark";
import { useWallet } from "@/contexts/WalletContext";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
} from "../services/notificationService";
import { AtariButton } from "../components/atari/AtariButton";
import { useAudio } from "../contexts/AudioContext";
import { useLightningAddress } from "../features/receive/hooks/useLightningAddress";
import { useToast } from "../contexts/ToastContext";

const DEV_MODE_TAP_COUNT = 5;
const DEV_MODE_STORAGE_KEY = "spark-dev-mode";

interface SettingsPageProps {
  onBack: () => void;
  config: Config | null;
  onOpenFiatCurrencies: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  config: _config,
  onOpenFiatCurrencies,
}) => {
  const wallet = useWallet();
  const { muted, toggleMute } = useAudio();
  const { showToast } = useToast();
  const lnAddr = useLightningAddress();
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("mainnet");
  const [preferSparkOverLightning, setPreferSparkOverLightning] =
    useState<boolean>(false);
  const [sparkPrivateModeEnabled, setSparkPrivateModeEnabled] =
    useState<boolean>(true);
  const [isLoadingUserSettings, setIsLoadingUserSettings] =
    useState<boolean>(true);
  const [notificationEnabled, setNotificationEnabled] =
    useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] =
    useState<string>("default");

  useEffect(() => {
    const stored = localStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (stored === "true") setIsDevMode(true);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("dev") === "true") setIsDevMode(true);
    setSelectedNetwork((urlParams.get("network") ?? "mainnet") as Network);

    const s = getSettings();
    if (s.preferSparkOverLightning != null)
      setPreferSparkOverLightning(s.preferSparkOverLightning);

    if (isNotificationSupported()) {
      setNotificationPermission(getNotificationPermission());
      const ns = getNotificationSettings();
      setNotificationEnabled(ns.enabled);
    }

    // Load lightning address
    lnAddr.load();

    // Load SDK user settings
    wallet
      .getUserSettings?.()
      .then((settings) => {
        if (settings?.sparkPrivateModeEnabled !== undefined) {
          setSparkPrivateModeEnabled(settings.sparkPrivateModeEnabled);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserSettings(false));
  }, [wallet]);

  const handleVersionTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);
    if (newCount >= DEV_MODE_TAP_COUNT) {
      setIsDevMode(true);
      localStorage.setItem(DEV_MODE_STORAGE_KEY, "true");
      setDevTapCount(0);
    }
  };

  const handleDownloadLogs = () => {
    try {
      const logs = wallet.getSdkLogs();
      if (logs) {
        const blob = new Blob([logs], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bitari2100-logs-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Failed to download logs:", e);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center p-3 border-b-2 border-dashed border-atari-darkgray">
        <button
          onClick={onBack}
          className="font-pixel text-sm sm:text-base text-atari-midgray hover:text-atari-orange"
        >
          {"<"}
          <span className="hidden sm:inline"> BACK</span>
        </button>
        <span className="flex-1 text-center font-pixel text-sm sm:text-lg text-atari-bright uppercase tracking-wider">
          SETTINGS
        </span>
        <MuteButton />
      </div>

      <div className="p-5 space-y-8 max-w-lg mx-auto w-full">
        {/* Display */}
        <div>
          <div className="font-pixel text-lg text-atari-orange mb-4 tracking-wider">
            DISPLAY
          </div>
          <button
            onClick={onOpenFiatCurrencies}
            className="w-full flex items-center justify-between p-4 pixel-border hover:border-atari-orange"
          >
            <span className="font-pixel text-lg text-atari-lightgray">
              FIAT CURRENCIES
            </span>
            <span className="font-pixel text-lg text-atari-midgray">{">"}</span>
          </button>
        </div>

        {/* Lightning Address */}
        {lnAddr.isSupported && (
          <div>
            <div className="font-pixel text-lg text-atari-orange mb-4 tracking-wider">
              LN ADDRESS
            </div>
            {lnAddr.isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center pixel-border overflow-hidden">
                  <input
                    type="text"
                    value={lnAddr.editValue}
                    onChange={(e) =>
                      lnAddr.setEditValue(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                      )
                    }
                    placeholder="satoshi"
                    disabled={lnAddr.isLoading}
                    className="flex-1 min-w-0 bg-transparent px-3 py-3 font-pixel text-sm sm:text-base text-atari-bright placeholder-atari-darkgray focus:outline-none"
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                  <span className="flex-shrink-0 px-2 py-3 font-pixel text-xs text-atari-midgray">
                    @breez.tips
                  </span>
                </div>
                <FormError error={lnAddr.error} />
                <div className="flex gap-3">
                  <AtariButton
                    variant="secondary"
                    fullWidth
                    onClick={lnAddr.cancelEdit}
                  >
                    CANCEL
                  </AtariButton>
                  <AtariButton
                    variant="primary"
                    fullWidth
                    onClick={async () => {
                      await lnAddr.save();
                      if (!lnAddr.error && !lnAddr.isEditing) {
                        showToast("success", "ADDRESS SAVED");
                      }
                    }}
                    disabled={lnAddr.isLoading || !lnAddr.editValue.trim()}
                  >
                    {lnAddr.isLoading ? "SAVING..." : "SAVE"}
                  </AtariButton>
                </div>
              </div>
            ) : lnAddr.isLoading ? (
              <div className="font-pixel text-sm text-atari-midgray">
                LOADING...
              </div>
            ) : lnAddr.address ? (
              <div className="space-y-3">
                <div className="pixel-border p-3">
                  <div className="font-pixel text-xs text-atari-midgray mb-1">
                    YOUR ADDRESS
                  </div>
                  <div className="font-pixel text-sm sm:text-base text-atari-bright break-all">
                    {lnAddr.address.lightningAddress}
                  </div>
                </div>
                <AtariButton
                  variant="secondary"
                  fullWidth
                  onClick={() => lnAddr.beginEdit(lnAddr.address)}
                >
                  CHANGE ADDRESS
                </AtariButton>
              </div>
            ) : (
              <AtariButton
                variant="primary"
                fullWidth
                onClick={() => lnAddr.beginEdit()}
              >
                CREATE ADDRESS
              </AtariButton>
            )}
          </div>
        )}

        {/* Audio */}
        <div>
          <div className="font-pixel text-lg text-atari-orange mb-4 tracking-wider">
            AUDIO
          </div>
          <Switch
            checked={!muted}
            onChange={toggleMute}
            label="SOUND FX & MUSIC"
          />
        </div>

        {/* Notifications */}
        {isNotificationSupported() && (
          <div>
            <div className="font-pixel text-lg text-atari-orange mb-4 tracking-wider">
              NOTIFICATIONS
            </div>
            <Switch
              checked={notificationEnabled}
              onChange={async (checked) => {
                if (checked && notificationPermission !== "granted") {
                  const perm = await requestNotificationPermission();
                  setNotificationPermission(perm);
                  if (perm !== "granted") return;
                }
                setNotificationEnabled(checked);
                saveNotificationSettings({
                  enabled: checked,
                } as NotificationSettings);
              }}
              label="PAYMENT ALERTS"
            />
          </div>
        )}

        {/* Diagnostics - localhost only */}
        {window.location.hostname === "localhost" && (
          <div>
            <div className="font-pixel text-lg text-atari-orange mb-4 tracking-wider">
              DIAGNOSTICS
            </div>
            <AtariButton
              variant="secondary"
              fullWidth
              onClick={handleDownloadLogs}
            >
              DOWNLOAD LOGS
            </AtariButton>
          </div>
        )}

        {/* Dev mode settings */}
        {isDevMode && (
          <div>
            <div className="font-pixel text-lg text-atari-yellow mb-4 tracking-wider">
              DEV MODE
            </div>
            <div className="space-y-4">
              <div>
                <div className="font-pixel text-base text-atari-midgray mb-2">
                  NETWORK
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["mainnet", "testnet", "regtest"] as Network[]).map((n) => (
                    <button
                      key={n}
                      className={`font-pixel text-base px-3 py-2 border-3 ${
                        selectedNetwork === n
                          ? "border-atari-orange text-atari-orange"
                          : "border-atari-darkgray text-atari-midgray"
                      }`}
                    >
                      {n.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <Switch
                checked={preferSparkOverLightning}
                onChange={(checked) => {
                  setPreferSparkOverLightning(checked);
                  saveSettings({
                    ...getSettings(),
                    preferSparkOverLightning: checked,
                  });
                }}
                label="PREFER SPARK"
              />
              {!isLoadingUserSettings && (
                <Switch
                  checked={sparkPrivateModeEnabled}
                  onChange={async (checked) => {
                    setSparkPrivateModeEnabled(checked);
                    await wallet.setUserSettings?.({
                      sparkPrivateModeEnabled: checked,
                    });
                  }}
                  label="PRIVATE MODE"
                />
              )}
            </div>
          </div>
        )}

        {/* Version */}
        <div className="text-center pt-6" onClick={handleVersionTap}>
          <span className="font-pixel text-base text-atari-darkgray">
            BITARI 2100 V{import.meta.env.PACKAGE_VERSION || "0.1.0"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
