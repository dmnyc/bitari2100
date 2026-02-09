import { createContext, useContext } from "react";

interface AudioContextValue {
  muted: boolean;
  toggleMute: () => void;
}

const AudioCtx = createContext<AudioContextValue>({
  muted: false,
  toggleMute: () => {},
});

export const AudioProvider = AudioCtx.Provider;
export const useAudio = () => useContext(AudioCtx);
