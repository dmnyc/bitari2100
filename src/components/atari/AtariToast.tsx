import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface AtariToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const typeClasses: Record<ToastType, string> = {
  success: 'atari-toast-success',
  error:   'atari-toast-error',
  info:    'atari-toast-info',
};

/**
 * Pixel-art toast notification that appears at the top of the screen.
 */
export function AtariToast({ message, type = 'info', duration = 3000, onDismiss }: AtariToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`atari-toast ${typeClasses[type]}`}>
      {message}
    </div>
  );
}
