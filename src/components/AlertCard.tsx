import React, { ReactNode } from "react";

interface AlertCardProps {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
  className?: string;
}

const typeStyles = {
  info: "border-atari-midgray text-atari-lightgray",
  warning: "border-atari-yellow text-atari-yellow",
  error: "border-atari-red text-atari-red",
  success: "border-atari-green text-atari-green",
};

export const AlertCard: React.FC<AlertCardProps> = ({
  children,
  type = "info",
  className = "",
}) => (
  <div
    className={`border-3 p-4 font-pixel text-base leading-relaxed ${typeStyles[type]} ${className}`}
  >
    {children}
  </div>
);

export interface SimpleAlertProps {
  message?: string;
  children?: ReactNode;
  type?: "info" | "warning" | "error" | "success";
  variant?: "info" | "warning" | "error" | "success";
  onDismiss?: () => void;
  className?: string;
  dataTestId?: string;
}

export const SimpleAlert: React.FC<SimpleAlertProps> = ({
  message,
  children,
  type,
  variant,
  onDismiss,
  className = "",
}) => (
  <AlertCard type={type || variant || "error"} className={className}>
    <div className="flex items-start justify-between gap-2">
      <span>{children || message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="font-pixel text-base opacity-60 hover:opacity-100"
        >
          X
        </button>
      )}
    </div>
  </AlertCard>
);
