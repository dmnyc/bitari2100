import { ButtonHTMLAttributes, ReactNode, MouseEvent } from "react";
import { playClick } from "../../services/tiaSoundService";

type AtariButtonVariant =
  | "primary"
  | "send"
  | "receive"
  | "secondary"
  | "danger";

interface AtariButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AtariButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<AtariButtonVariant, string> = {
  primary: "atari-btn-primary",
  send: "atari-btn-send",
  receive: "atari-btn-receive",
  secondary: "atari-btn-secondary",
  danger: "atari-btn-danger",
};

export function AtariButton({
  variant = "primary",
  children,
  fullWidth = false,
  className = "",
  onClick,
  ...props
}: AtariButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  return (
    <button
      className={`atari-btn ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
