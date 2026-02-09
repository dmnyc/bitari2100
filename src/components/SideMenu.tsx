import React, { useState } from "react";
import { AtariButton } from "./atari/AtariButton";
import {
  playClick,
  playDanger,
  playHover,
  playMenuSelect,
} from "../services/tiaSoundService";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenRefund?: () => void;
  onOpenArcade?: () => void;
  onOpenAbout?: () => void;
  hasRejectedDeposits?: boolean;
}

/**
 * Atari "Pause Menu" - full-screen overlay replacing the slide-out drawer.
 */
const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenSettings,
  onOpenBackup,
  onOpenRefund,
  onOpenArcade,
  onOpenAbout,
  hasRejectedDeposits = false,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  const menuItems = [
    ...(hasRejectedDeposits && onOpenRefund
      ? [
          {
            label: "GET REFUND",
            onClick: () => {
              onOpenRefund();
              onClose();
            },
            highlight: true,
          },
        ]
      : []),
    {
      label: "BACKUP",
      onClick: () => {
        onOpenBackup();
        onClose();
      },
    },
    {
      label: "SETTINGS",
      onClick: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      label: "ARCADE",
      onClick: () => {
        onOpenArcade?.();
        onClose();
      },
    },
    ...(onOpenAbout
      ? [
          {
            label: "ABOUT",
            onClick: () => {
              onOpenAbout();
              onClose();
            },
          },
        ]
      : []),
    {
      label: "LOGOUT",
      onClick: () => {
        playDanger();
        setShowLogoutConfirm(true);
      },
      danger: true,
    },
  ];

  return (
    <div className="pause-menu" onClick={onClose}>
      <button
        onClick={() => {
          playClick();
          onClose();
        }}
        className="atari-dialog-close"
        style={{ position: "fixed", top: 8, right: 8 }}
      >
        X
      </button>
      <div className="pause-menu-content" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-4 sm:mb-12">
          <div className="font-atari text-xl sm:text-3xl text-atari-orange tracking-wider leading-relaxed">
            BITARI
          </div>
          <div className="font-atari text-2xl sm:text-4xl text-atari-orange-lit tracking-widest">
            2100
          </div>
        </div>

        <div className="font-pixel text-sm sm:text-lg text-atari-midgray mb-3 sm:mb-8 tracking-wider">
          - - PAUSED - -
        </div>

        <nav>
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`pause-menu-item ${
                "disabled" in item && item.disabled ? "disabled" : ""
              } ${
                "highlight" in item && item.highlight ? "text-atari-yellow" : ""
              } ${"danger" in item && item.danger ? "text-atari-red" : ""}`}
              onClick={
                "disabled" in item && item.disabled
                  ? undefined
                  : () => {
                      if (!("danger" in item && item.danger)) playMenuSelect();
                      item.onClick();
                    }
              }
              onPointerEnter={
                "disabled" in item && item.disabled ? undefined : playHover
              }
              disabled={!!("disabled" in item && item.disabled)}
            >
              {item.label}
              {!!("disabled" in item && item.disabled) && (
                <span className="font-pixel text-base text-atari-darkgray ml-3">
                  COMING SOON
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 bg-black z-80 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="pixel-border-double p-4 sm:p-8 max-w-sm w-full bg-atari-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-pixel text-sm sm:text-lg text-atari-yellow text-center mb-4">
                ! WARNING !
              </div>
              <div className="font-pixel text-sm sm:text-lg text-atari-lightgray text-center mb-6 leading-relaxed">
                SAVE YOUR RECOVERY PHRASE BEFORE LOGGING OUT
              </div>
              <div className="flex gap-4 justify-center">
                <AtariButton
                  variant="secondary"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  CANCEL
                </AtariButton>
                <AtariButton variant="danger" onClick={handleConfirmLogout}>
                  LOGOUT
                </AtariButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideMenu;
