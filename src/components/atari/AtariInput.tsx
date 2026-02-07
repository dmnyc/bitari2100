import { InputHTMLAttributes, forwardRef } from "react";

interface AtariInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AtariInput = forwardRef<HTMLInputElement, AtariInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-pixel text-lg text-atari-lightgray mb-3 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`atari-input ${error ? "border-atari-red" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="font-pixel text-lg text-atari-red mt-2">{error}</p>
        )}
      </div>
    );
  },
);

AtariInput.displayName = "AtariInput";
