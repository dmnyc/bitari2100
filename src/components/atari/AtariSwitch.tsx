import { playToggle } from "../../services/tiaSoundService";

interface AtariSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/**
 * Toggle switch styled like retro console difficulty switches.
 */
export function AtariSwitch({ checked, onChange, label }: AtariSwitchProps) {
  const handleChange = () => {
    playToggle();
    onChange(!checked);
  };

  return (
    <div
      className="atari-switch"
      onClick={handleChange}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleChange();
        }
      }}
    >
      <div className={`atari-switch-track ${checked ? "active" : ""}`}>
        <div className="atari-switch-thumb" />
      </div>
      {label && (
        <span className="font-pixel text-base text-atari-lightgray uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
