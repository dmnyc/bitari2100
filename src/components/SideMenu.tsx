import React, { useState } from "react";
import { AtariButton } from "./atari/AtariButton";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenRefund?: () => void;
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
      onClick: () => {},
      disabled: true,
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
      onClick: () => setShowLogoutConfirm(true),
      danger: true,
    },
  ];

  return (
    <div className="pause-menu" onClick={onClose}>
      <div className="pause-menu-content" onClick={(e) => e.stopPropagation()}>
        <div className="pause-menu-title">BITARI 2100</div>

        <div className="font-pixel text-lg text-atari-midgray mb-8 tracking-wider">
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
                "disabled" in item && item.disabled ? undefined : item.onClick
              }
              disabled={"disabled" in item && item.disabled}
            >
              {item.label}
              {"disabled" in item && item.disabled && (
                <span className="font-pixel text-base text-atari-darkgray ml-3">
                  COMING SOON
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pause-menu-footer">PRESS SELECT TO RESUME</div>

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 bg-black/80 z-80 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="pixel-border-double p-6 max-w-xs w-full bg-atari-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-pixel text-base text-atari-yellow text-center mb-5">
                ! WARNING !
              </div>
              <div className="font-pixel text-lg text-atari-lightgray text-center mb-6 leading-relaxed">
                SAVE YOUR RECOVERY PHRASE BEFORE LOGGING OUT
              </div>
              <div className="flex gap-3">
                <AtariButton
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  CANCEL
                </AtariButton>
                <AtariButton
                  variant="danger"
                  fullWidth
                  onClick={handleConfirmLogout}
                >
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
