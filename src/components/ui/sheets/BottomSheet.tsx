import React, { ReactNode, useEffect } from "react";

export type BottomSheetMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface BottomSheetContainerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  fullHeight?: boolean;
  showBackdrop?: boolean;
  maxWidth?: string;
}

export const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({
  children,
  isOpen,
  onClose,
  fullHeight,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (fullHeight) {
    return (
      <div className="fixed inset-0 z-60 bg-black" onClick={onClose}>
        <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="atari-overlay" onClick={onClose}>
      <div className="atari-dialog" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export interface BottomSheetCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: BottomSheetMaxWidth;
}

export const BottomSheetCard: React.FC<BottomSheetCardProps> = ({
  children,
  className = "",
}) => <div className={`atari-dialog-body ${className}`}>{children}</div>;
