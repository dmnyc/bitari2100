/**
 * TIA Sound Synthesis Service
 *
 * Atari 2600-era bleeps and bloops via Web Audio API.
 * No external audio files — everything is synthesized.
 */

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

// --- Global mute (persisted in localStorage) ---
const MUTE_KEY = "bitari_sound_muted";
let _muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
})();

export function isMuted(): boolean {
  return _muted;
}
type MuteListener = (muted: boolean) => void;
const _muteListeners = new Set<MuteListener>();
export function onMuteChange(fn: MuteListener): () => void {
  _muteListeners.add(fn);
  return () => {
    _muteListeners.delete(fn);
  };
}

export function setMuted(m: boolean) {
  _muted = m;
  try {
    localStorage.setItem(MUTE_KEY, String(m));
  } catch {
    /* noop */
  }
  _muteListeners.forEach((fn) => fn(m));
}
export function toggleMuted(): boolean {
  setMuted(!_muted);
  return _muted;
}

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function getNoiseBuffer(): AudioBuffer {
  if (!noiseBuffer) {
    const ac = getCtx();
    const len = ac.sampleRate; // 1 second of noise
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

function playTone(
  freq: number,
  duration: number,
  volume = 0.15,
  startTime?: number,
  wave: OscillatorType = "square",
) {
  if (_muted) return;
  const ac = getCtx();
  const t = startTime ?? ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.linearRampToValueAtTime(0, t + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function playNoise(duration: number, volume = 0.08, startTime?: number) {
  if (_muted) return;
  const ac = getCtx();
  const t = startTime ?? ac.currentTime;
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = getNoiseBuffer();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.linearRampToValueAtTime(0, t + duration);
  src.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + duration);
}

// --- Exported sound effects ---

/** Speaker-crackle + ascending boop for unmute confirmation */
export function playUnmute() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  // Static crackle
  playNoise(0.06, 0.15, t);
  playNoise(0.03, 0.1, t + 0.04);
  // Ascending boop
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
  gain.gain.setValueAtTime(0.18, t + 0.08);
  gain.gain.linearRampToValueAtTime(0, t + 0.22);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t + 0.08);
  osc.stop(t + 0.22);
}

/** Tiny tick for menu item hover/focus */
export function playHover() {
  if (_muted) return;
  playTone(1200, 0.02, 0.06);
}

/** Rising sweep for menu item press */
export function playMenuSelect() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.07);
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.09);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}

/** Short blip for button presses */
export function playClick() {
  if (_muted) return;
  playTone(880, 0.05, 0.12);
}

/** Two-tone click-clack for toggle switches */
export function playToggle() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(660, 0.03, 0.1, t);
  playTone(880, 0.03, 0.1, t + 0.03);
}

/** Descending sweep for page transitions */
export function playNavigate() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.linearRampToValueAtTime(200, t + 0.12);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.12);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

/** 3-note ascending arpeggio for successful send */
export function playSendSuccess() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(523, 0.1, 0.15, t); // C5
  playTone(659, 0.1, 0.15, t + 0.1); // E5
  playTone(784, 0.12, 0.15, t + 0.2); // G5
}

/** 4-note fanfare for payment received celebration */
export function playCelebration() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(523, 0.12, 0.18, t); // C5
  playTone(659, 0.12, 0.18, t + 0.15); // E5
  playTone(784, 0.12, 0.18, t + 0.3); // G5
  playTone(1047, 0.25, 0.2, t + 0.45); // C6 (held longer)
}

/** Descending buzz + noise for errors */
export function playError() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.linearRampToValueAtTime(110, t + 0.3);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.3);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
  playNoise(0.15, 0.1, t + 0.15);
}

/** 3 quick ascending beeps for QR code scanned */
export function playQrScan() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(880, 0.04, 0.12, t);
  playTone(1100, 0.04, 0.12, t + 0.06);
  playTone(1320, 0.06, 0.12, t + 0.12);
}

/** Short tick for typewriter / modem cursor */
export function playTypingTick() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(1800, 0.02, 0.06, t);
  playNoise(0.015, 0.04, t);
}

/** Subtle high ping for toast notifications */
export function playToast() {
  if (_muted) return;
  playTone(1047, 0.06, 0.08); // C6
}

/** Quick blip for menu open (hamburger tap) */
export function playMenuOpen() {
  if (_muted) return;
  playTone(660, 0.05, 0.12);
}

/** Ascending two-note for menu close (unpause) */
export function playMenuClose() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(523, 0.08, 0.12, t); // C5
  playTone(784, 0.12, 0.12, t + 0.08); // G5
}

/** Upbeat retro title screen jingle (saved for future use) */
export function playIntroClassic() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  const bpm = 200;
  const eighth = 60 / bpm / 2;

  // Pickup: two quick notes
  playTone(330, eighth * 0.8, 0.14, t); // E4
  playTone(392, eighth * 0.8, 0.14, t + eighth); // G4

  // Phrase 1: ascending run
  playTone(523, eighth * 0.8, 0.16, t + eighth * 2); // C5
  playTone(587, eighth * 0.8, 0.16, t + eighth * 3); // D5
  playTone(659, eighth * 0.8, 0.16, t + eighth * 4); // E5
  playTone(784, eighth * 1.6, 0.18, t + eighth * 5); // G5 (held)

  // Phrase 2: bounce down and resolve up
  playTone(659, eighth * 0.8, 0.16, t + eighth * 7); // E5
  playTone(523, eighth * 0.8, 0.16, t + eighth * 8); // C5
  playTone(659, eighth * 0.8, 0.16, t + eighth * 9); // E5
  playTone(784, eighth * 0.8, 0.16, t + eighth * 10); // G5

  // Final: big held note with octave
  playTone(1047, eighth * 3, 0.2, t + eighth * 11); // C6 (held)
  playTone(523, eighth * 3, 0.1, t + eighth * 11); // C5 (octave below, quieter)
}

/** Schedule one full intro pass, tracking nodes for cleanup. Returns duration. */
function scheduleIntro(t: number): number {
  const s = 0.136; // eighth-note step at 220 BPM

  const bassPattern = [
    110, 110, 73, 73, 110, 110, 73, 73, 98, 98, 65, 65, 98, 98, 65, 65,
  ];
  for (let cycle = 0; cycle < 4; cycle++) {
    for (let i = 0; i < 16; i++) {
      playTone(bassPattern[i], s * 0.83, 0.14, t + (cycle * 16 + i) * s);
    }
  }

  const arpHi = [988, 784, 587, 494, 392, 294];
  const arpLo = [494, 392, 294, 247, 196, 147];
  const cascadeStarts = [
    3.273, 3.545, 3.818, 4.091, 7.636, 7.909, 8.182, 8.455,
  ];
  const arpStep = 0.034;

  for (const cs of cascadeStarts) {
    for (let i = 0; i < 6; i++) {
      const nt = t + cs + (i === 0 ? 0 : 0.034 + (i - 1) * arpStep);
      const dur = i === 0 ? 0.06 : 0.03;
      playTone(arpHi[i], dur, 0.1, nt);
      playTone(arpLo[i], dur, 0.08, nt, "triangle");
    }
  }

  return 4 * 16 * s; // ~8.704s
}

/** Universal Chaos title screen — from Atari 2600 MIDI (~8.7s) */
export function playIntro() {
  if (_muted) return;
  const ac = getCtx();
  scheduleIntro(ac.currentTime);
}

/** Play the intro up to `repeats` times, then stop. Returns a stop function. */
export function playIntroLoop(repeats = 4): () => void {
  let stopped = false;
  let played = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  function loop() {
    if (stopped || played >= repeats || _muted) return;
    played++;
    const ac = getCtx();
    const duration = scheduleIntro(ac.currentTime);
    timerId = setTimeout(loop, duration * 1000);
  }

  loop();

  // When muted, silence all scheduled notes; when unmuted, restart
  const unsubscribe = onMuteChange((muted) => {
    if (stopped) return;
    if (muted) {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
    } else if (played < repeats) {
      loop();
    }
  });

  return () => {
    stopped = true;
    unsubscribe();
    if (timerId !== null) clearTimeout(timerId);
    // Kill the AudioContext and recreate to silence all scheduled notes
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  };
}

/** Journey Escape "Don't Stop Believin'" — About page music. Loops. */
// One cycle = 14.769s at 65 BPM. [startSec, freq, duration]
const _journeyBass: [number, number, number][] = [
  [0.0, 185.0, 1.385],
  [1.385, 207.7, 0.231],
  [1.615, 233.1, 0.231],
  [1.846, 277.2, 1.385],
  [3.231, 311.1, 0.231],
  [3.462, 349.2, 0.231],
  [3.692, 311.1, 1.385],
  [5.077, 349.2, 0.231],
  [5.308, 370.0, 0.231],
  [5.538, 246.9, 1.385],
  [6.923, 349.2, 0.231],
  [7.154, 370.0, 0.231],
  [7.385, 185.0, 1.385],
  [8.769, 207.7, 0.231],
  [9.0, 233.1, 0.231],
  [9.231, 277.2, 1.385],
  [10.615, 311.1, 0.231],
  [10.846, 349.2, 0.231],
  [11.077, 233.1, 1.385],
  [12.462, 233.1, 0.231],
  [12.692, 233.1, 0.231],
  [12.923, 246.9, 1.385],
  [14.308, 349.2, 0.231],
  [14.538, 370.0, 0.231],
];
const _journeyArp: [number, number, number][] = [
  [0.0, 740.0, 0.231],
  [0.231, 554.4, 0.231],
  [0.462, 740.0, 0.231],
  [0.692, 554.4, 0.231],
  [0.923, 740.0, 0.231],
  [1.154, 554.4, 0.231],
  [1.385, 740.0, 0.231],
  [1.615, 554.4, 0.231],
  [1.846, 830.6, 0.231],
  [2.077, 554.4, 0.231],
  [2.308, 830.6, 0.231],
  [2.538, 554.4, 0.231],
  [2.769, 830.6, 0.231],
  [3.0, 554.4, 0.231],
  [3.231, 830.6, 0.231],
  [3.462, 554.4, 0.231],
  [3.692, 740.0, 0.231],
  [3.923, 554.4, 0.231],
  [4.154, 740.0, 0.231],
  [4.385, 554.4, 0.231],
  [4.615, 740.0, 0.231],
  [4.846, 554.4, 0.231],
  [5.077, 740.0, 0.231],
  [5.308, 554.4, 0.231],
  [5.538, 622.3, 0.231],
  [5.769, 493.9, 0.231],
  [6.0, 622.3, 0.231],
  [6.231, 493.9, 0.231],
  [6.462, 622.3, 0.231],
  [6.692, 493.9, 0.231],
  [6.923, 622.3, 0.231],
  [7.154, 493.9, 0.231],
  [7.385, 740.0, 0.231],
  [7.615, 554.4, 0.231],
  [7.846, 740.0, 0.231],
  [8.077, 554.4, 0.231],
  [8.308, 740.0, 0.231],
  [8.538, 554.4, 0.231],
  [8.769, 740.0, 0.231],
  [9.0, 554.4, 0.231],
  [9.231, 830.6, 0.231],
  [9.462, 554.4, 0.231],
  [9.692, 830.6, 0.231],
  [9.923, 554.4, 0.231],
  [10.154, 830.6, 0.231],
  [10.385, 554.4, 0.231],
  [10.615, 830.6, 0.231],
  [10.846, 554.4, 0.231],
  [11.077, 698.5, 0.231],
  [11.308, 554.4, 0.231],
  [11.538, 698.5, 0.231],
  [11.769, 554.4, 0.231],
  [12.0, 698.5, 0.231],
  [12.231, 554.4, 0.231],
  [12.462, 698.5, 0.231],
  [12.692, 554.4, 0.231],
  [12.923, 622.3, 0.231],
  [13.154, 493.9, 0.231],
  [13.385, 622.3, 0.231],
  [13.615, 493.9, 0.231],
  [13.846, 622.3, 0.231],
  [14.077, 493.9, 0.231],
  [14.308, 622.3, 0.231],
  [14.538, 493.9, 0.231],
];
const _journeyCycleLen = 14.769;

function scheduleJourneyCycle(t: number) {
  for (const [s, f, d] of _journeyBass) {
    playTone(f, d * 0.9, 0.12, t + s, "triangle");
  }
  for (const [s, f, d] of _journeyArp) {
    playTone(f, d * 0.85, 0.14, t + s);
  }
}

export function playJourney(repeats = 4): () => void {
  let stopped = false;
  let played = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  function silenceCtx() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  }

  function loop() {
    if (stopped || played >= repeats || _muted) return;
    played++;
    const ac = getCtx();
    scheduleJourneyCycle(ac.currentTime);
    timerId = setTimeout(loop, _journeyCycleLen * 1000);
  }

  if (!_muted) loop();

  const unsubscribe = onMuteChange((muted) => {
    if (stopped) return;
    if (muted) {
      silenceCtx();
    } else if (played < repeats) {
      loop();
    }
  });

  return () => {
    stopped = true;
    unsubscribe();
    silenceCtx();
  };
}

/** Ominous low warning buzz for dangerous actions (e.g. opening logout confirm) */
export function playDanger() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  // Three descending dissonant stabs
  playTone(220, 0.12, 0.22, t); // A3
  playTone(207, 0.12, 0.18, t); // Detuned — beating
  playNoise(0.08, 0.12, t + 0.05);
  playTone(147, 0.12, 0.22, t + 0.15); // D3
  playTone(139, 0.12, 0.18, t + 0.15); // Detuned
  playNoise(0.08, 0.12, t + 0.2);
  playTone(82, 0.35, 0.25, t + 0.3); // Low E2 — rumble
  playTone(78, 0.35, 0.2, t + 0.3); // Detuned — growl
  playNoise(0.25, 0.15, t + 0.35);
}

/** Classic game-over jingle for logout */
export function playGameOver() {
  if (_muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  playTone(392, 0.2, 0.18, t); // G4
  playTone(330, 0.2, 0.18, t + 0.25); // E4
  playTone(262, 0.2, 0.18, t + 0.5); // C4
  playTone(196, 0.5, 0.2, t + 0.75); // G3 (long low note)
  playNoise(0.3, 0.06, t + 1.0); // static fade-out
}
