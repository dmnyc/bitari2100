import React, { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QrScanner from "qr-scanner";
import { useQrScanner } from "../hooks/useQrScanner";
import { playQrScan, playClick } from "../services/tiaSoundService";
import { AtariButton } from "./atari/AtariButton";

interface QrScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QrScannerDialog: React.FC<QrScannerDialogProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const handleScan = useCallback(
    (data: string) => {
      playQrScan();
      onScan(data);
      onClose();
    },
    [onScan, onClose],
  );

  const handleGalleryPick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setGalleryError(null);
      try {
        const result = await QrScanner.scanImage(file);
        onScan(result);
        onClose();
      } catch {
        setGalleryError("No QR code found in image");
        setTimeout(() => setGalleryError(null), 3000);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onScan, onClose],
  );

  const {
    videoRef,
    error,
    isScanning,
    isInitializing,
    hasMultipleCameras,
    startScanning,
    stopScanning,
    toggleCamera,
    clearError,
  } = useQrScanner({ onScan: handleScan });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        if (videoRef.current) {
          startScanning();
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        stopScanning();
        document.body.style.overflow = "";
      };
    } else {
      stopScanning();
    }
  }, [isOpen, startScanning, stopScanning, videoRef]);

  const handleClose = () => {
    stopScanning();
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Full screen video */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan overlay with pixel corners */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-atari-orange" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-atari-orange" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-atari-orange" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-atari-orange" />
            {isScanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-atari-orange animate-scan-line" />
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            playClick();
            handleClose();
          }}
          className="atari-dialog-close"
          style={{ top: 8, right: 8 }}
          aria-label="Close scanner"
        >
          X
        </button>

        {/* Gallery picker button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-4 right-4 z-20 p-2 border-3 border-atari-midgray bg-black/80 font-pixel text-xs text-atari-midgray"
          aria-label="Pick image from gallery"
        >
          IMG
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryPick}
        />

        {/* Gallery error toast */}
        {galleryError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 atari-toast atari-toast-error z-30">
            {galleryError}
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="font-pixel text-sm text-atari-midgray animate-title-blink">
              INITIALIZING CAMERA...
            </div>
          </div>
        )}

        {!isScanning && !isInitializing && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6 max-w-xs">
              <div className="font-pixel text-lg text-atari-red mb-4">
                ! ERROR !
              </div>
              <div className="font-pixel text-xs text-atari-midgray">
                {error}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black p-4">
        <div className="flex gap-3">
          {hasMultipleCameras && (
            <AtariButton variant="secondary" onClick={toggleCamera}>
              FLIP
            </AtariButton>
          )}
          <AtariButton variant="secondary" fullWidth onClick={handleClose}>
            CANCEL
          </AtariButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default QrScannerDialog;
