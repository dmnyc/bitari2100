import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastNotificationProps {
  type: ToastType;
  message: string;
  detail?: React.ReactNode;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const typeClass: Record<ToastType, string> = {
  success: "atari-toast-success",
  error: "atari-toast-error",
  info: "atari-toast-info",
  warning: "atari-toast-error",
};

const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  detail,
  onClose,
  autoClose = true,
  duration = 4000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  return (
    <div
      className={`atari-toast ${typeClass[type]} ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{ transition: "opacity 0.3s steps(4)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-xs sm:text-sm leading-relaxed">
            {message}
          </div>
          {detail && (
            <div className="font-pixel text-xs text-atari-midgray mt-1">
              {detail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
