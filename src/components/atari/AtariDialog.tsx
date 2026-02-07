import { ReactNode, useEffect } from "react";

interface AtariDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom-sheet dialog styled as a retro console screen overlay.
 * Double-line pixel border, Atari font title, stepped animation.
 */
export function AtariDialog({
  open,
  onClose,
  title,
  children,
}: AtariDialogProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="atari-overlay" onClick={onClose}>
      <div className="atari-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="atari-dialog-header">
          <span className="atari-dialog-title">{title}</span>
          <button className="atari-dialog-close" onClick={onClose}>
            [X]
          </button>
        </div>
        <div className="atari-dialog-body">{children}</div>
      </div>
    </div>
  );
}
