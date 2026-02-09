import React, {
  ReactNode,
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// ============================================
// RE-EXPORTS
// ============================================
export { QRCodeContainer } from "./QRCodeContainer";
export { BottomSheetContainer, BottomSheetCard } from "./sheets/BottomSheet";
export type {
  BottomSheetMaxWidth,
  BottomSheetContainerProps,
  BottomSheetCardProps,
} from "./sheets/BottomSheet";

// ============================================
// BUTTONS
// ============================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  className = "",
  ...props
}) => (
  <button className={`atari-btn atari-btn-primary ${className}`} {...props}>
    {children}
  </button>
);

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  className = "",
  ...props
}) => (
  <button className={`atari-btn atari-btn-secondary ${className}`} {...props}>
    {children}
  </button>
);

export const TextButton: React.FC<ButtonProps> = ({
  children,
  className = "",
  ...props
}) => (
  <button
    className={`font-pixel text-base text-atari-lightgray hover:text-atari-orange cursor-pointer bg-transparent border-none ${className}`}
    {...props}
  >
    {children}
  </button>
);

export interface FloatingIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
}

export const FloatingIconButton: React.FC<FloatingIconButtonProps> = ({
  children,
  icon,
  className = "",
  ...props
}) => (
  <button
    className={`atari-btn atari-btn-secondary p-2 ${className}`}
    {...props}
  >
    {icon || children}
  </button>
);

// ============================================
// FORMS
// ============================================

export const FormGroup: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const FormLabel: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <label
    className={`block font-pixel text-xs sm:text-base text-atari-lightgray mb-2 uppercase tracking-wider ${className}`}
  >
    {children}
  </label>
);

export const FormDescription: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <p className="font-pixel text-base text-atari-midgray mt-1">{children}</p>
);

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div>
      {label && <FormLabel>{label}</FormLabel>}
      <input
        ref={ref}
        className={`atari-input ${error ? "border-atari-red" : ""} ${className}`}
        {...props}
      />
      {error && <FormError>{error}</FormError>}
    </div>
  ),
);
FormInput.displayName = "FormInput";

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea ref={ref} className={`atari-textarea ${className}`} {...props} />
  ),
);
FormTextarea.displayName = "FormTextarea";

export const FormError: React.FC<{
  children?: ReactNode;
  error?: string | null;
}> = ({ children, error }) => {
  const content = error || children;
  if (!content) return null;
  return <p className="font-pixel text-base text-atari-red mt-2">{content}</p>;
};

export const FormHint: React.FC<{ children: ReactNode }> = ({ children }) => (
  <p className="font-pixel text-base text-atari-midgray mt-1">{children}</p>
);

// ============================================
// LOADING
// ============================================

export interface LoadingSpinnerProps {
  text?: string;
  size?: SpinnerSize;
  [key: string]: any;
}

export type SpinnerSize = "sm" | "md" | "lg";

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text }) => (
  <div className="flex flex-col items-center justify-center gap-4 p-8">
    <div className="font-pixel text-base text-atari-midgray tracking-wider animate-title-blink">
      {text || "LOADING..."}
    </div>
    <div className="w-40 atari-loading-bar atari-loading-indeterminate">
      <div className="atari-loading-fill" />
    </div>
  </div>
);

// ============================================
// DIALOGS
// ============================================

export const DialogContainer: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`atari-overlay ${className}`}>{children}</div>
);

interface DialogCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export const DialogCard = forwardRef<HTMLDivElement, DialogCardProps>(
  ({ children, className = "" }, ref) => (
    <div ref={ref} className={`atari-dialog ${className}`}>
      {children}
    </div>
  ),
);
DialogCard.displayName = "DialogCard";

export const DialogHeader: React.FC<{
  title: string;
  onClose?: () => void;
  children?: ReactNode;
  icon?: ReactNode;
}> = ({ title, onClose, children, icon }) => (
  <>
    {onClose && (
      <button className="atari-dialog-close" onClick={onClose}>
        X
      </button>
    )}
    <div className="atari-dialog-header">
      {icon && <span className="mr-2">{icon}</span>}
      <span className="atari-dialog-title">{title}</span>
      {children && (
        <div className="flex items-center gap-2 ml-auto">{children}</div>
      )}
    </div>
  </>
);

// ============================================
// MISC
// ============================================

export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div
    className="atari-switch"
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
  >
    <div className={`atari-switch-track ${checked ? "active" : ""}`}>
      <div className="atari-switch-thumb" />
    </div>
    {label && (
      <span className="font-pixel text-base text-atari-lightgray">{label}</span>
    )}
  </div>
);

export const Checkbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div
    className="flex items-center gap-2 cursor-pointer"
    onClick={() => onChange(!checked)}
    role="checkbox"
    aria-checked={checked}
  >
    <span className="font-pixel text-base text-atari-orange">
      [{checked ? "X" : " "}]
    </span>
    {label && (
      <span className="font-pixel text-base text-atari-lightgray">{label}</span>
    )}
  </div>
);

export const CollapsibleCodeField: React.FC<{
  value: string;
  label?: string;
  isVisible?: boolean;
  onToggle?: () => void;
}> = ({ value, label, isVisible = true, onToggle }) => (
  <div className="w-full">
    <div className="flex items-center justify-between">
      {label && <FormLabel>{label}</FormLabel>}
      {onToggle && (
        <button
          onClick={onToggle}
          className="font-pixel text-xs sm:text-base text-atari-orange"
        >
          {isVisible ? "HIDE" : "SHOW"}
        </button>
      )}
    </div>
    {isVisible && (
      <div className="pixel-border p-2 font-pixel text-xs sm:text-base text-atari-lightgray break-all">
        {value}
      </div>
    )}
  </div>
);

export const PaymentInfoCard: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`pixel-border p-3 ${className}`}>{children}</div>
);

export const PaymentInfoRow: React.FC<{
  label: string;
  value: ReactNode;
  className?: string;
}> = ({ label, value, className = "" }) => (
  <div className={`flex items-center justify-between py-1 gap-2 ${className}`}>
    <span className="font-pixel text-xs sm:text-base text-atari-midgray uppercase shrink-0">
      {label}
    </span>
    <span className="font-pixel text-xs sm:text-base text-atari-lightgray text-right">
      {value}
    </span>
  </div>
);

// ============================================
// COPYABLE TEXT
// ============================================

export const CopyableText: React.FC<{
  text: string;
  label?: string;
  truncate?: boolean;
  className?: string;
  showShare?: boolean;
  textColor?: string;
  onCopied?: () => void;
  onShareError?: () => void;
  additionalActions?: ReactNode;
  textToCopy?: string;
  textToShare?: string;
  shareLabel?: string;
  [key: string]: any;
}> = ({
  text,
  label,
  truncate = true,
  className = "",
  onCopied,
  textToCopy,
}) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy || text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopied?.();
    });
  };
  return (
    <div className={`w-full ${className}`}>
      {label && <FormLabel>{label}</FormLabel>}
      <div
        className="pixel-border p-2 flex items-center gap-2 cursor-pointer"
        onClick={handleCopy}
      >
        <span
          className={`font-pixel text-xs sm:text-base text-atari-lightgray flex-1 ${truncate ? "truncate" : "break-all"}`}
        >
          {text}
        </span>
        <span className="flex-shrink-0">
          {copied ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 7 7"
              shapeRendering="crispEdges"
            >
              <rect x="6" y="0" width="1" height="1" fill="#5c9c5c" />
              <rect x="5" y="1" width="1" height="1" fill="#5c9c5c" />
              <rect x="4" y="2" width="1" height="1" fill="#5c9c5c" />
              <rect x="0" y="3" width="1" height="1" fill="#5c9c5c" />
              <rect x="3" y="3" width="1" height="1" fill="#5c9c5c" />
              <rect x="1" y="4" width="1" height="1" fill="#5c9c5c" />
              <rect x="2" y="5" width="1" height="1" fill="#5c9c5c" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 7 7"
              shapeRendering="crispEdges"
            >
              {/* Back square (visible parts) */}
              <rect x="2" y="0" width="5" height="1" fill="#c87020" />
              <rect x="2" y="1" width="1" height="1" fill="#c87020" />
              <rect x="6" y="1" width="1" height="1" fill="#c87020" />
              <rect x="6" y="2" width="1" height="1" fill="#c87020" />
              <rect x="6" y="3" width="1" height="1" fill="#c87020" />
              <rect x="2" y="4" width="5" height="1" fill="#c87020" />
              {/* Front square */}
              <rect x="0" y="2" width="3" height="1" fill="#c87020" />
              <rect x="0" y="3" width="1" height="1" fill="#c87020" />
              <rect x="2" y="3" width="1" height="1" fill="#c87020" />
              <rect x="0" y="4" width="1" height="1" fill="#c87020" />
              <rect x="0" y="5" width="1" height="1" fill="#c87020" />
              <rect x="4" y="5" width="1" height="1" fill="#c87020" />
              <rect x="0" y="6" width="5" height="1" fill="#c87020" />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
};

// ============================================
// ALERT
// ============================================

export const Alert: React.FC<{
  children?: ReactNode;
  type?: "info" | "warning" | "error" | "success";
  variant?: "info" | "warning" | "error" | "success";
  className?: string;
  message?: string;
  dataTestId?: string;
  [key: string]: any;
}> = ({ children, type, variant, className = "", message }) => {
  const resolvedType = type || variant || "info";
  const colors: Record<string, string> = {
    info: "border-atari-midgray text-atari-lightgray",
    warning: "border-atari-yellow text-atari-yellow",
    error: "border-atari-red text-atari-red",
    success: "border-atari-green text-atari-green",
  };
  return (
    <div
      className={`border-2 p-3 font-pixel text-base leading-relaxed ${colors[resolvedType] || colors.info} ${className}`}
    >
      {children || message}
    </div>
  );
};

// ============================================
// STEP PANELS (for Send workflow)
// ============================================

export const StepPanelGroup: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`${className}`}>{children}</div>
);

export const StepPanel: React.FC<{
  children: ReactNode;
  active?: boolean;
  isActive?: boolean;
  className?: string;
}> = ({ children, active, isActive, className = "" }) =>
  (active ?? isActive ?? true) ? (
    <div className={`animate-pixel-fade ${className}`}>{children}</div>
  ) : null;

export const StepContainer: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// ============================================
// TABS (for Receive dialog)
// ============================================

export const TabContainer: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const TabList: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`flex border-b-2 border-atari-darkgray ${className}`}>
    {children}
  </div>
);

export const Tab: React.FC<{
  children: ReactNode;
  selected?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}> = ({ children, selected, isActive, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`flex-1 font-pixel text-xs sm:text-base py-2 px-2 sm:px-3 text-center border-b-2 -mb-[2px] ${
      (selected ?? isActive)
        ? "border-atari-orange text-atari-orange"
        : "border-transparent text-atari-midgray hover:text-atari-lightgray"
    } ${className}`}
  >
    {children}
  </button>
);

export const TabPanel: React.FC<{
  children: ReactNode;
  active?: boolean;
  isActive?: boolean;
  className?: string;
}> = ({ children, active, isActive, className = "" }) =>
  (active ?? isActive ?? true) ? (
    <div className={`p-3 ${className}`}>{children}</div>
  ) : null;

export const TabPanelGroup: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

// ============================================
// CONFIRM DIALOG
// ============================================

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default" | "warning";
}> = ({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "CANCEL",
  onConfirm,
  onCancel,
  variant = "default",
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 z-80 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="pixel-border-double p-4 max-w-xs w-full bg-atari-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-pixel text-lg text-atari-bright text-center mb-3">
          {title}
        </div>
        <div className="font-pixel text-base text-atari-lightgray text-center mb-4 leading-relaxed">
          {message}
        </div>
        <div className="flex gap-2">
          <button
            className="atari-btn atari-btn-secondary flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`atari-btn flex-1 ${variant === "danger" ? "atari-btn-danger" : "atari-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
