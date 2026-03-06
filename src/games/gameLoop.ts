/**
 * Frame-rate-capped game loop using requestAnimationFrame.
 *
 * All arcade games are designed for 60fps with per-frame physics.
 * On high-refresh displays (120Hz+), rAF fires too often, making
 * gameplay run 2x speed. This utility skips frames to maintain
 * a consistent ~60fps tick rate regardless of display refresh rate.
 */

const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS; // ~16.67ms

export function createGameLoop(tick: (timestamp: number) => void) {
  let rafId: number | null = null;
  let lastTickTime = 0;

  function loop(timestamp: number) {
    rafId = requestAnimationFrame(loop);

    if (timestamp - lastTickTime < FRAME_DURATION) return;
    lastTickTime = timestamp - ((timestamp - lastTickTime) % FRAME_DURATION);

    tick(timestamp);
  }

  return {
    start() {
      lastTickTime = 0;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
