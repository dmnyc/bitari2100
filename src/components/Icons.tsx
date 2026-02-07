import React from "react";

/**
 * Atari-style text-based icons.
 * Uses monospace characters instead of SVGs for authentic retro feel.
 */

export interface IconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "text-base",
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const Icon: React.FC<{ char: string } & IconProps> = ({
  char,
  className = "",
  size = "sm",
}) => (
  <span
    className={`font-pixel ${sizeClasses[size]} ${className} inline-flex items-center justify-center`}
    aria-hidden="true"
  >
    {char}
  </span>
);

export const SendIcon: React.FC<IconProps> = (props) => (
  <Icon char=">" {...props} />
);
export const ReceiveIcon: React.FC<IconProps> = (props) => (
  <Icon char="<" {...props} />
);
export const LightningIcon: React.FC<IconProps> = (props) => (
  <Icon char="!" {...props} />
);
export const BitcoinIcon: React.FC<IconProps> = (props) => (
  <Icon char="B" {...props} />
);
export const SparkIcon: React.FC<IconProps> = (props) => (
  <Icon char="~" {...props} />
);
export const ScanIcon: React.FC<IconProps> = (props) => (
  <Icon char="#" {...props} />
);
export const MenuIcon: React.FC<IconProps> = (props) => (
  <Icon char="=" {...props} />
);
export const CloseIcon: React.FC<IconProps> = (props) => (
  <Icon char="X" {...props} />
);
export const BackIcon: React.FC<IconProps> = (props) => (
  <Icon char="<" {...props} />
);
export const CheckIcon: React.FC<IconProps> = (props) => (
  <Icon char="+" {...props} />
);
export const CopyIcon: React.FC<IconProps> = (props) => (
  <Icon char="@" {...props} />
);
export const WarningIcon: React.FC<IconProps> = (props) => (
  <Icon char="!" {...props} />
);
export const SettingsIcon: React.FC<IconProps> = (props) => (
  <Icon char="*" {...props} />
);
export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <Icon char=">" {...props} />
);
export const DownloadIcon: React.FC<IconProps> = (props) => (
  <Icon char="v" {...props} />
);
export const NotificationIcon: React.FC<IconProps> = (props) => (
  <Icon char="!" {...props} />
);
export const CurrencyIcon: React.FC<IconProps> = (props) => (
  <Icon char="$" {...props} />
);
export const RefundIcon: React.FC<IconProps> = (props) => (
  <Icon char="<" {...props} />
);
export const SpinnerIcon: React.FC<IconProps> = (props) => (
  <Icon char="*" {...props} />
);
export const ShareIcon: React.FC<IconProps> = (props) => (
  <Icon char="^" {...props} />
);
