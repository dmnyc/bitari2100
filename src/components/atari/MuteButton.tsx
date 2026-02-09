import { useAudio } from "../../contexts/AudioContext";

/** Compact pixel speaker icon that reads mute state from AudioContext. */
export function MuteButton() {
  const { muted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className="p-1"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 8 8"
        shapeRendering="crispEdges"
      >
        <rect x="1" y="2" width="1" height="4" fill="#909090" />
        <rect x="2" y="2" width="1" height="4" fill="#909090" />
        <rect x="3" y="1" width="1" height="6" fill="#909090" />
        <rect x="4" y="0" width="1" height="8" fill="#909090" />
        {muted ? (
          <>
            <rect x="6" y="1" width="1" height="1" fill="#aa0000" />
            <rect x="7" y="2" width="1" height="1" fill="#aa0000" />
            <rect x="6" y="3" width="1" height="1" fill="#aa0000" />
            <rect x="7" y="4" width="1" height="1" fill="#aa0000" />
            <rect x="6" y="5" width="1" height="1" fill="#aa0000" />
            <rect x="7" y="6" width="1" height="1" fill="#aa0000" />
          </>
        ) : (
          <>
            <rect x="6" y="2" width="1" height="1" fill="#6c6c6c" />
            <rect x="6" y="5" width="1" height="1" fill="#6c6c6c" />
            <rect x="7" y="1" width="1" height="1" fill="#6c6c6c" />
            <rect x="7" y="3" width="1" height="2" fill="#6c6c6c" />
            <rect x="7" y="6" width="1" height="1" fill="#6c6c6c" />
          </>
        )}
      </svg>
    </button>
  );
}
