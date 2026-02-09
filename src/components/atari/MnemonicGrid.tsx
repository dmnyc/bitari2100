import React, { useState, useEffect, useRef } from "react";
import { playTypingTick } from "../../services/tiaSoundService";

interface MnemonicGridProps {
  words: string[];
  animate?: boolean;
  onAnimationDone?: () => void;
}

/**
 * Shared seed-phrase grid with optional typewriter animation.
 * Used by GeneratePage (animate=true) and BackupPage (animate=true after reveal).
 */
export const MnemonicGrid: React.FC<MnemonicGridProps> = ({
  words,
  animate = false,
  onAnimationDone,
}) => {
  const [cursorChar, setCursorChar] = useState(animate ? 0 : Infinity);
  const [revealedCount, setRevealedCount] = useState(
    animate ? 0 : words.length,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneCalledRef = useRef(false);

  const totalChars = words.reduce((sum, w, i) => {
    const prefix = String(i + 1).padStart(2, "0") + " ";
    return sum + prefix.length + w.length;
  }, 0);

  const done = cursorChar >= totalChars;

  // Typewriter tick
  useEffect(() => {
    if (!animate || done) return;
    timerRef.current = setTimeout(() => {
      playTypingTick();
      setCursorChar((c) => c + 1);
    }, 35);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [animate, cursorChar, done]);

  // Track which row is being typed
  useEffect(() => {
    if (!animate) return;
    let chars = 0;
    for (let i = 0; i < words.length; i++) {
      const prefix = String(i + 1).padStart(2, "0") + " ";
      chars += prefix.length + words[i].length;
      if (cursorChar < chars) {
        setRevealedCount(i);
        return;
      }
    }
    setRevealedCount(words.length);
  }, [animate, cursorChar, words]);

  // Fire done callback once
  useEffect(() => {
    if (done && !doneCalledRef.current) {
      doneCalledRef.current = true;
      onAnimationDone?.();
    }
  }, [done, onAnimationDone]);

  function getWordDisplay(wordIndex: number): {
    prefix: string;
    text: string;
    showCursor: boolean;
  } {
    if (!animate) {
      return {
        prefix: String(wordIndex + 1).padStart(2, "0"),
        text: words[wordIndex].toUpperCase(),
        showCursor: false,
      };
    }

    let offset = 0;
    for (let i = 0; i < wordIndex; i++) {
      const p = String(i + 1).padStart(2, "0") + " ";
      offset += p.length + words[i].length;
    }
    const prefix = String(wordIndex + 1).padStart(2, "0") + " ";
    const fullLen = prefix.length + words[wordIndex].length;
    const charsIntoThis = cursorChar - offset;

    if (charsIntoThis <= 0) return { prefix: "", text: "", showCursor: false };
    if (charsIntoThis >= fullLen) {
      return {
        prefix: prefix.trimEnd(),
        text: words[wordIndex].toUpperCase(),
        showCursor: charsIntoThis === fullLen && !done,
      };
    }
    if (charsIntoThis <= prefix.length) {
      return {
        prefix: prefix.slice(0, charsIntoThis).trimEnd(),
        text: "",
        showCursor: true,
      };
    }
    const wordChars = charsIntoThis - prefix.length;
    return {
      prefix: prefix.trimEnd(),
      text: words[wordIndex].toUpperCase().slice(0, wordChars),
      showCursor: true,
    };
  }

  return (
    <div className="pixel-border p-3 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 sm:gap-4">
        {words.map((_, index) => {
          if (animate && index > revealedCount && !done) {
            return <div key={index} className="py-1 sm:py-2" />;
          }
          const display = getWordDisplay(index);
          return (
            <div
              key={index}
              className="flex items-baseline gap-1 sm:gap-2 py-1 sm:py-2 font-pixel text-sm sm:text-lg"
            >
              <span className="text-atari-midgray shrink-0">
                {display.prefix}
              </span>
              <span className="text-atari-bright">{display.text}</span>
              {display.showCursor && (
                <span className="text-atari-green animate-title-blink">_</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
