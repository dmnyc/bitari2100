/**
 * DIP HOPPER — Frogger-style game with Pepe theme.
 *
 * Pepe hops across three obstacle zones to reach 5 citadel slots:
 * 1. Lambo Race Track — dodge fast race cars
 * 2. Nothing Stops This Train — ride flatbed cars, avoid locomotive/boxcars
 * 3. The Canyon — ride floating Bitcoin coins & clouds, avoid falling coins
 *
 * Renders to a <canvas> element. Uses TIA sound synthesis.
 * Atari 2600 NTSC palette colors.
 */

import {
  playError,
  playCelebration,
  isMuted,
} from "../services/tiaSoundService";

// --- Atari 2600 palette ---
const C = {
  black: "#000000",
  darkgray: "#404040",
  midgray: "#6c6c6c",
  lightgray: "#909090",
  bright: "#d4d4d4",
  white: "#ececec",
  orange: "#ac5030",
  orangeLit: "#c06848",
  orangeHot: "#e07838",
  blue: "#3840b0",
  blueLit: "#505cc0",
  blueSky: "#6888e8",
  green: "#407c40",
  greenLit: "#5c9c5c",
  greenBright: "#78b878",
  red: "#b03c3c",
  redLit: "#c05858",
  redHot: "#e06060",
  yellow: "#a0a034",
  yellowLit: "#b8b84c",
  yellowBright: "#d0d060",
  purple: "#6c3ca0",
  purpleLit: "#8c5cc0",
  cyan: "#00a0a0",
  cyanLit: "#20c0c0",
  pink: "#b04878",
  pinkLit: "#d068a0",
  gold: "#c8a020",
  goldLit: "#e8c040",
  brown: "#6c4420",
  brownLit: "#8c6040",
  stoneGray: "#808080",
  stoneDark: "#585858",
};

// --- Game constants ---
const GAME_W = 320;
const GAME_H = 288; // 24px HUD + 11 rows * 24px
const HUD_H = 24;
const ROW_H = 24;
const NUM_ROWS = 11;
const PEPE_W = 16;
const PEPE_H = 16;
const NUM_CITADELS = 5;
const LIVES_INITIAL = 3;
const HOP_COOLDOWN = 120; // ms between hops

// Row indices (bottom=0, top=10)
const ROW_START = 0;
const ROW_LAMBO_1 = 1;
const ROW_LAMBO_2 = 2;
const ROW_SAFE_1 = 3;
const ROW_TRAIN_1 = 4; // train going right
const ROW_TRAIN_2 = 5; // train going left
const ROW_SAFE_2 = 6;
const ROW_CANYON_1 = 7;
// Canyon lane 2 = ROW_CANYON_1 + 1, lane 3 = ROW_CANYON_3
const ROW_CANYON_3 = 9;
const ROW_CITADEL = 10;

// Convert row index to pixel Y (row 0 at bottom, row 9 at top)
function rowY(row: number): number {
  return HUD_H + (NUM_ROWS - 1 - row) * ROW_H;
}

// --- Speed scaling ---
const BASE_LAMBO_SPEED = 0.7;
const BASE_TRAIN_SPEED = 0.5;
const BASE_CANYON_SPEED = 0.3;
const BASE_ROCKET_SPEED = 1.8;
const SPEED_PER_LEVEL = 0.08;

// --- Car colors for lambos ---
const LAMBO_COLORS = [
  C.redHot,
  C.yellowBright,
  C.blueSky,
  C.orangeHot,
  C.greenBright,
  C.pinkLit,
  C.cyanLit,
];

// --- Train segment types ---
type TrainSegType = "locomotive" | "boxcar" | "tanker" | "flatbed" | "caboose";
interface TrainSegment {
  type: TrainSegType;
  width: number; // pixels
}

// Train pattern repeats: locomotive leads, mix of safe/unsafe cars
function buildTrainPattern(): TrainSegment[] {
  return [
    { type: "locomotive", width: 40 },
    { type: "boxcar", width: 32 },
    { type: "tanker", width: 32 },
    { type: "flatbed", width: 36 },
    { type: "boxcar", width: 32 },
    { type: "tanker", width: 32 },
    { type: "boxcar", width: 32 },
    { type: "flatbed", width: 36 },
    { type: "tanker", width: 32 },
    { type: "boxcar", width: 32 },
    { type: "flatbed", width: 36 },
    { type: "caboose", width: 28 },
  ];
}

// --- Canyon platform types ---
type PlatformType = "coin" | "cloud" | "rocket" | "shitcoin";
type ShitcoinVariant = "eth" | "xrp" | "doge" | "sol" | "ltc";
type CoinState = "floating" | "warning" | "falling" | "gone" | "rising";

interface CanyonPlatform {
  type: PlatformType;
  x: number;
  width: number;
  speed: number; // px/frame, positive=right, negative=left
  coinState: CoinState;
  coinTimer: number; // ms until next state transition
  coinCycle: number; // ms of full float duration before next fall
  shitcoinVariant?: ShitcoinVariant; // eth or xrp (for shitcoins)
  stormy: boolean; // cloud is currently stormy (kills on contact)
  stormTimer: number; // ms until storm state toggles
}

// --- Lambo car ---
interface LamboCar {
  x: number;
  width: number;
  speed: number;
  color: string;
}

// --- Types ---
export type GameState =
  | "title"
  | "gate"
  | "playing"
  | "paused"
  | "dying"
  | "levelClear"
  | "gameOver";

export interface DipHopperGame {
  start: () => void;
  stop: () => void;
  beginGame: () => void;
  reGate: () => void;
  pause: () => void;
  resume: () => void;
  getState: () => GameState;
  getScore: () => number;
  getLevel: () => number;
  getLives: () => number;
  setLevel: (n: number) => void;
}

// --- TIA sound helpers ---
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function gameTone(
  freq: number,
  dur: number,
  vol = 0.1,
  wave: OscillatorType = "square",
) {
  if (isMuted()) return;
  const ac = getAudioCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function playHop() {
  gameTone(500, 0.04, 0.08);
}

function playSplat() {
  gameTone(200, 0.15, 0.15);
  setTimeout(() => gameTone(120, 0.2, 0.12), 100);
}

function playFall() {
  gameTone(400, 0.08, 0.1);
  setTimeout(() => gameTone(300, 0.08, 0.1), 80);
  setTimeout(() => gameTone(200, 0.1, 0.08), 160);
}

function playCitadel() {
  gameTone(440, 0.08, 0.12);
  setTimeout(() => gameTone(660, 0.08, 0.12), 90);
  setTimeout(() => gameTone(880, 0.12, 0.15), 180);
}

function playLevelClear() {
  playCelebration();
}

function playCoinWarning() {
  gameTone(300, 0.06, 0.06, "triangle");
  setTimeout(() => gameTone(280, 0.06, 0.06, "triangle"), 100);
}

// --- Main game factory ---
export function createDipHopper(
  canvas: HTMLCanvasElement,
  onStateChange?: (state: GameState) => void,
  gated = true,
  devMode = false,
): DipHopperGame {
  const ctx = canvas.getContext("2d")!;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  let state: GameState = "title";
  let score = 0;
  let level = 1;
  let lives = LIVES_INITIAL;
  let animFrame = 0;
  let rafId: number | null = null;
  let levelClearTimer: ReturnType<typeof setTimeout> | null = null;
  let pauseStart = 0;

  // Pepe state
  let pepeRow = ROW_START;
  let pepeX = GAME_W / 2 - PEPE_W / 2; // pixel X on screen
  let pepeTargetX = pepeX;
  let pepeTargetRow = pepeRow;
  let pepeHopping = false;
  let pepeHopProgress = 0; // 0..1
  let pepeStartX = pepeX;
  let pepeStartRow = pepeRow;
  let lastHopTime = 0;
  let pepeDir: "up" | "down" | "left" | "right" = "up"; // used for sprite facing
  let dyingTimer = 0;
  let dyingType: "splat" | "fall" = "splat";
  let highestRow = 0; // highest row reached this life (for scoring)

  // Per-life countdown timer (Frogger-style)
  const LIFE_TIME = 45_000; // 45 seconds per life
  let lifeTimer = LIFE_TIME;

  // Female Pepe bonus (appears randomly at an empty citadel)
  let bonusCitadel = -1; // index of citadel showing lady Pepe, or -1
  let bonusTimer = 0; // ms until bonus disappears

  // Citadels
  let citadels: boolean[] = [];

  // Lambo lanes
  let lamboLane1: LamboCar[] = [];
  let lamboLane2: LamboCar[] = [];

  // Trains (two going opposite directions)
  let train1X = 0;
  let train1Segments: TrainSegment[] = [];
  let train1TotalWidth = 0;
  let train2X = 0;
  let train2Segments: TrainSegment[] = [];
  let train2TotalWidth = 0;

  // Canyon
  let canyonLanes: CanyonPlatform[][] = [];

  // Input
  const keys: Record<string, boolean> = {};

  function setState(s: GameState) {
    state = s;
    onStateChange?.(s);
  }

  // --- Level setup ---
  function speedScale(): number {
    return 1 + (level - 1) * SPEED_PER_LEVEL;
  }

  function initCitadels() {
    citadels = Array(NUM_CITADELS).fill(false);
  }

  function initLambos() {
    const s = speedScale();
    const carW = 28;
    // Gap shrinks with level: 90px at L1 down to 60px by L6+
    const minGap = Math.max(60, 90 - (level - 1) * 6);
    // Cars: 2 at L1, 3 at L3+ (difficulty comes from speed, not density)
    const numCars = level <= 2 ? 2 : 3;

    // Lane 1: cars going right
    lamboLane1 = [];
    const spacing1 = Math.max(carW + minGap, GAME_W / numCars);
    const laneSpeed1 = BASE_LAMBO_SPEED * s * (1 + Math.random() * 0.2);
    for (let i = 0; i < numCars; i++) {
      lamboLane1.push({
        x: i * spacing1,
        width: carW,
        speed: laneSpeed1,
        color: LAMBO_COLORS[i % LAMBO_COLORS.length],
      });
    }
    // Lane 2: cars going left (slightly different speed)
    lamboLane2 = [];
    const spacing2 = Math.max(carW + minGap, GAME_W / numCars);
    const laneSpeed2 = BASE_LAMBO_SPEED * s * (1.1 + Math.random() * 0.2);
    for (let i = 0; i < numCars; i++) {
      lamboLane2.push({
        x: i * spacing2,
        width: carW,
        speed: -laneSpeed2,
        color: LAMBO_COLORS[(i + 3) % LAMBO_COLORS.length],
      });
    }
  }

  function initTrain() {
    train1Segments = buildTrainPattern().reverse(); // reversed so locomotive is at right (leading edge going right)
    train1TotalWidth = train1Segments.reduce((sum, seg) => sum + seg.width, 0);
    train1X = -train1TotalWidth; // start off-screen left, enters from left

    train2Segments = buildTrainPattern(); // locomotive at left = leading edge going left
    train2TotalWidth = train2Segments.reduce((sum, seg) => sum + seg.width, 0);
    train2X = GAME_W; // start off-screen right, enters from right
  }

  function initCanyon() {
    const s = speedScale();
    canyonLanes = [];

    for (let lane = 0; lane < 3; lane++) {
      const platforms: CanyonPlatform[] = [];
      const dir = lane % 2 === 0 ? 1 : -1;
      const baseSpeed = BASE_CANYON_SPEED * s * dir;

      // Place 3-5 platforms per lane
      const count = 3 + Math.floor(Math.random() * 3);
      const spacing = GAME_W / count;
      function pickShitcoin(): ShitcoinVariant {
        const pool: ShitcoinVariant[] = ["eth", "xrp"];
        if (level >= 4) pool.push("doge");
        if (level >= 5) pool.push("sol", "ltc");
        return pool[Math.floor(Math.random() * pool.length)];
      }
      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        // ~25% bitcoin, ~10% shitcoin (level 3+), rest clouds
        const hasShitcoins = level >= 3;
        const isCoin = roll < 0.25;
        const isShitcoin = !isCoin && hasShitcoins && roll < 0.35;
        const type: PlatformType = isCoin
          ? "coin"
          : isShitcoin
            ? "shitcoin"
            : "cloud";
        const floatDur = 4000 + Math.random() * 4000 - level * 200;
        // From level 5, some clouds can go stormy
        const canStorm = type === "cloud" && level >= 5 && Math.random() < 0.4;
        platforms.push({
          type,
          x: i * spacing + Math.random() * 20,
          width: type === "cloud" ? 28 : 16,
          speed: baseSpeed * (0.8 + Math.random() * 0.4),
          coinState: "floating",
          coinTimer: type !== "cloud" ? 2000 + Math.random() * floatDur : 0,
          coinCycle: Math.max(2000, floatDur),
          shitcoinVariant: isShitcoin ? pickShitcoin() : undefined,
          stormy: false,
          stormTimer: canStorm ? 3000 + Math.random() * 5000 : -1, // -1 = never storms
        });
      }

      // Rocket on canyon lane 3 (index 2) — starts far off-screen, rarer at low levels
      if (lane === 2) {
        const rocketGap = GAME_W * (3 - Math.min(level - 1, 4) * 0.4);
        platforms.push({
          type: "rocket",
          x: dir > 0 ? -rocketGap : GAME_W + rocketGap,
          width: 24,
          speed: BASE_ROCKET_SPEED * s * dir,
          coinState: "floating",
          coinTimer: 0,
          coinCycle: 0,
          stormy: false,
          stormTimer: -1,
        });
      }

      canyonLanes.push(platforms);
    }
  }

  function initLevel() {
    initCitadels();
    initLambos();
    initTrain();
    initCanyon();
    resetPepe();
    highestRow = 0;
    bonusCitadel = -1;
    bonusTimer = 0;
  }

  function resetPepe() {
    pepeRow = ROW_START;
    pepeX = GAME_W / 2 - PEPE_W / 2;
    pepeTargetX = pepeX;
    pepeTargetRow = pepeRow;
    pepeHopping = false;
    pepeHopProgress = 0;
    pepeDir = "up";
    lifeTimer = LIFE_TIME;
  }

  // --- Collision helpers ---
  function pepeScreenY(): number {
    if (pepeHopping) {
      const startY = rowY(pepeStartRow) + (ROW_H - PEPE_H) / 2;
      const endY = rowY(pepeTargetRow) + (ROW_H - PEPE_H) / 2;
      return startY + (endY - startY) * pepeHopProgress;
    }
    return rowY(pepeRow) + (ROW_H - PEPE_H) / 2;
  }

  function pepeScreenX(): number {
    if (pepeHopping) {
      return pepeStartX + (pepeTargetX - pepeStartX) * pepeHopProgress;
    }
    return pepeX;
  }

  function rectsOverlap(
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // Check if Pepe overlaps a car in a lambo lane
  function checkLamboCollision(): boolean {
    const px = pepeScreenX();
    const py = pepeScreenY();
    const row = pepeHopping ? pepeTargetRow : pepeRow;
    if (row !== ROW_LAMBO_1 && row !== ROW_LAMBO_2) return false;

    const cars = row === ROW_LAMBO_1 ? lamboLane1 : lamboLane2;
    const laneY = rowY(row);
    for (const car of cars) {
      if (
        rectsOverlap(px, py, PEPE_W, PEPE_H, car.x, laneY + 4, car.width, 16)
      ) {
        return true;
      }
    }
    return false;
  }

  // Check if Pepe is on a flatbed of either train. Returns:
  // "safe" if on a flatbed, "hit" if on unsafe segment, "none" if not on any train
  function getTrainStatus(): "safe" | "hit" | "none" {
    const row = pepeHopping ? pepeTargetRow : pepeRow;
    // Each train is on its own row
    let train: { segments: TrainSegment[]; x: number; total: number } | null =
      null;
    if (row === ROW_TRAIN_1)
      train = { segments: train1Segments, x: train1X, total: train1TotalWidth };
    else if (row === ROW_TRAIN_2)
      train = { segments: train2Segments, x: train2X, total: train2TotalWidth };
    if (!train) return "none";

    const cx = pepeScreenX() + PEPE_W / 2; // use Pepe's center
    let segX = train.x;
    for (const seg of train.segments) {
      if (cx >= segX && cx < segX + seg.width) {
        return seg.type === "flatbed" ? "safe" : "hit";
      }
      segX += seg.width;
    }
    return "none";
  }

  // Get the platform Pepe is on in the canyon, or null
  // Rockets are prioritized — if Pepe overlaps a rocket, return that
  function getCanyonPlatform(): CanyonPlatform | null {
    const row = pepeHopping ? pepeTargetRow : pepeRow;
    const laneIdx = row - ROW_CANYON_1;
    if (laneIdx < 0 || laneIdx >= 3) return null;

    const px = pepeScreenX();
    const platforms = canyonLanes[laneIdx];
    let best: CanyonPlatform | null = null;
    for (const plat of platforms) {
      if (
        (plat.type === "coin" || plat.type === "shitcoin") &&
        (plat.coinState === "gone" ||
          plat.coinState === "falling" ||
          plat.coinState === "rising")
      )
        continue;
      if (px + PEPE_W > plat.x && px < plat.x + plat.width) {
        if (plat.type === "rocket") return plat; // rocket always wins
        if (!best) best = plat;
      }
    }
    return best;
  }

  // --- Update ---
  function update() {
    if (state !== "playing" && state !== "dying") return;

    animFrame++;

    if (state === "dying") {
      dyingTimer -= 16.67;
      if (dyingTimer <= 0) {
        lives--;
        if (lives <= 0) {
          playError();
          setState("gameOver");
        } else {
          resetPepe();
          setState("playing");
        }
      }
      return;
    }

    // Life countdown timer
    lifeTimer -= 16.67;
    if (lifeTimer <= 0) {
      die("fall");
      return;
    }

    // Bonus lady Pepe at citadel
    if (bonusCitadel >= 0) {
      bonusTimer -= 16.67;
      if (bonusTimer <= 0) {
        bonusCitadel = -1;
      }
    } else if (Math.random() < 0.001) {
      // Randomly spawn bonus at an empty citadel
      const empty = citadels.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
      if (empty.length > 0) {
        bonusCitadel = empty[Math.floor(Math.random() * empty.length)];
        bonusTimer = 5000 + Math.random() * 3000;
      }
    }

    // Update hop animation
    if (pepeHopping) {
      pepeHopProgress += 0.15;
      if (pepeHopProgress >= 1) {
        pepeHopProgress = 1;
        pepeRow = pepeTargetRow;
        pepeX = pepeTargetX;
        pepeHopping = false;

        // Score for forward progress
        if (pepeRow > highestRow) {
          score += (pepeRow - highestRow) * 10;
          highestRow = pepeRow;
        }

        // Canyon landing checks
        if (pepeRow >= ROW_CANYON_1 && pepeRow <= ROW_CANYON_3) {
          const plat = getCanyonPlatform();
          // Shitcoin trap — immediately falls and kills
          if (
            plat &&
            plat.type === "shitcoin" &&
            plat.coinState === "floating"
          ) {
            plat.coinState = "falling";
            plat.coinTimer = 300;
            gameTone(150, 0.15, 0.12);
            // Death handled next frame when falling coin check runs
          }
          // Bonus for landing on a bitcoin coin
          if (plat && plat.type === "coin" && plat.coinState === "floating") {
            score += 25;
            gameTone(660, 0.06, 0.1);
          }
          // Stormy cloud — die on landing
          if (plat && plat.type === "cloud" && plat.stormy) {
            die("splat");
            return;
          }
        }

        // Check citadel
        if (pepeRow === ROW_CITADEL) {
          const ci = getCitadelIndex(pepeX);
          if (ci >= 0 && !citadels[ci]) {
            citadels[ci] = true;
            // Bonus for landing on lady Pepe citadel
            if (ci === bonusCitadel) {
              score += 300;
              bonusCitadel = -1;
              bonusTimer = 0;
              gameTone(880, 0.08, 0.12);
              setTimeout(() => gameTone(1100, 0.1, 0.15), 100);
            } else {
              score += 100;
            }
            playCitadel();

            // Check level clear
            if (citadels.every(Boolean)) {
              score += 500;
              playLevelClear();
              setState("levelClear");
              levelClearTimer = setTimeout(() => {
                level++;
                initLevel();
                setState("playing");
              }, 2000);
              return;
            }
            // Reset Pepe to start for next citadel
            resetPepe();
            highestRow = 0;
            return;
          } else {
            // Landed on filled citadel or between citadels — die
            die("fall");
            return;
          }
        }
      }
    }

    // Update lambos
    for (const car of lamboLane1) {
      car.x += car.speed;
      if (car.x > GAME_W) car.x = -car.width;
    }
    for (const car of lamboLane2) {
      car.x += car.speed;
      if (car.x + car.width < 0) car.x = GAME_W;
    }

    // Update trains (extra gap so they don't re-enter immediately)
    const ts = BASE_TRAIN_SPEED * speedScale();
    // Gap scales with level — shorter at low levels, longer at high
    const trainGap = GAME_W * (0.2 + Math.min(level - 1, 5) * 0.15);
    // Train 1 goes right: reset far off-screen left
    train1X += ts;
    if (train1X > GAME_W) train1X = -train1TotalWidth - trainGap;
    // Train 2 goes left: reset far off-screen right
    train2X -= ts;
    if (train2X + train2TotalWidth < 0) train2X = GAME_W + trainGap;

    // Update canyon platforms
    for (let lane = 0; lane < 3; lane++) {
      for (const plat of canyonLanes[lane]) {
        plat.x += plat.speed;

        // Wrap horizontally (rockets get extra gap)
        const wrapGap =
          plat.type === "rocket"
            ? GAME_W * (2 - Math.min(level - 1, 4) * 0.3)
            : 20;
        if (plat.speed > 0 && plat.x > GAME_W + 20) {
          plat.x = -plat.width - wrapGap;
          if (plat.type === "coin" || plat.type === "shitcoin") {
            plat.coinState = "floating";
            plat.coinTimer = 2000 + Math.random() * plat.coinCycle;
          }
        }
        if (plat.speed < 0 && plat.x + plat.width < -20) {
          plat.x = GAME_W + wrapGap;
          if (plat.type === "coin" || plat.type === "shitcoin") {
            plat.coinState = "floating";
            plat.coinTimer = 2000 + Math.random() * plat.coinCycle;
          }
        }

        // Coin/shitcoin falling cycle
        if (plat.type === "coin" || plat.type === "shitcoin") {
          plat.coinTimer -= 16.67;
          if (plat.coinState === "floating" && plat.coinTimer <= 0) {
            plat.coinState = "warning";
            plat.coinTimer = 800; // warning period
            playCoinWarning();
          } else if (plat.coinState === "warning" && plat.coinTimer <= 0) {
            plat.coinState = "falling";
            plat.coinTimer = 500; // fall animation
          } else if (plat.coinState === "falling" && plat.coinTimer <= 0) {
            plat.coinState = "gone";
            plat.coinTimer = 2000 + Math.random() * 2000; // respawn timer
          } else if (plat.coinState === "gone" && plat.coinTimer <= 0) {
            plat.coinState = "rising";
            plat.coinTimer = 500; // grow-in animation
          } else if (plat.coinState === "rising" && plat.coinTimer <= 0) {
            plat.coinState = "floating";
            plat.coinTimer = 2000 + Math.random() * plat.coinCycle;
          }
        }

        // Storm cycle for clouds
        if (plat.type === "cloud" && plat.stormTimer >= 0) {
          plat.stormTimer -= 16.67;
          if (plat.stormTimer <= 0) {
            plat.stormy = !plat.stormy;
            // Stormy for 2-3s, calm for 4-6s
            plat.stormTimer = plat.stormy
              ? 2000 + Math.random() * 1000
              : 4000 + Math.random() * 2000;
            if (plat.stormy) {
              gameTone(80, 0.1, 0.08, "sawtooth");
            }
          }
        }
      }
    }

    // Pepe rides canyon platforms
    if (!pepeHopping && pepeRow >= ROW_CANYON_1 && pepeRow <= ROW_CANYON_3) {
      const plat = getCanyonPlatform();
      if (plat) {
        pepeX += plat.speed;
        pepeTargetX = pepeX;

        // Riding a rocket = immune to everything
        if (plat.type !== "rocket") {
          // Check if coin/shitcoin is falling under us
          if (
            (plat.type === "coin" || plat.type === "shitcoin") &&
            (plat.coinState === "falling" || plat.coinState === "gone")
          ) {
            die("fall");
            return;
          }

          // Stormy cloud kills
          if (plat.type === "cloud" && plat.stormy) {
            die("splat");
            return;
          }
        }
      } else {
        // No platform = fall into canyon
        die("fall");
        return;
      }

      // Pepe carried off screen
      if (pepeX + PEPE_W < 0 || pepeX > GAME_W) {
        die("fall");
        return;
      }

      // Rocket collision — only kills if Pepe is NOT riding a rocket
      const ridingPlat = getCanyonPlatform();
      if (!ridingPlat || ridingPlat.type !== "rocket") {
        const laneIdx = pepeRow - ROW_CANYON_1;
        if (laneIdx >= 0 && laneIdx < 3) {
          for (const p of canyonLanes[laneIdx]) {
            if (p.type !== "rocket" || p === ridingPlat) continue;
            if (pepeX + PEPE_W > p.x && pepeX < p.x + p.width) {
              die("splat");
              return;
            }
          }
        }
      }
    }

    // Pepe rides train flatbed
    if (!pepeHopping && (pepeRow === ROW_TRAIN_1 || pepeRow === ROW_TRAIN_2)) {
      const trainStatus = getTrainStatus();
      if (trainStatus === "hit") {
        die("splat");
        return;
      }
      if (trainStatus === "safe") {
        const trainSpeed = BASE_TRAIN_SPEED * speedScale();
        // Train 1 goes right, train 2 goes left
        pepeX += pepeRow === ROW_TRAIN_1 ? trainSpeed : -trainSpeed;
        pepeTargetX = pepeX;
      }
      // Carried off screen
      if (pepeX + PEPE_W < 0 || pepeX > GAME_W) {
        die("splat");
        return;
      }
    }

    // Check lambo collision
    if (!pepeHopping && (pepeRow === ROW_LAMBO_1 || pepeRow === ROW_LAMBO_2)) {
      if (checkLamboCollision()) {
        die("splat");
        return;
      }
    }

    // Process input
    processInput();
  }

  function die(type: "splat" | "fall") {
    if (state !== "playing") return;
    dyingType = type;
    dyingTimer = 600;
    if (type === "splat") playSplat();
    else playFall();
    setState("dying");
  }

  function getCitadelIndex(x: number): number {
    const slotWidth = GAME_W / NUM_CITADELS;
    const cx = x + PEPE_W / 2;
    const idx = Math.floor(cx / slotWidth);
    if (idx < 0 || idx >= NUM_CITADELS) return -1;
    // Check Pepe is roughly centered on the slot
    const slotCenter = idx * slotWidth + slotWidth / 2;
    if (Math.abs(cx - slotCenter) > slotWidth * 0.4) return -1;
    return idx;
  }

  function processInput() {
    if (pepeHopping || state !== "playing") return;

    const now = Date.now();
    if (now - lastHopTime < HOP_COOLDOWN) return;

    let dx = 0;
    let dy = 0;
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy = 1;
    else if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy = -1;
    else if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx = -1;
    else if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx = 1;

    if (dx === 0 && dy === 0) return;

    const newRow = pepeRow + dy;
    const hopDist = 20; // horizontal hop distance in pixels
    let newX = pepeX + dx * hopDist;

    // Bounds checks
    if (newRow < ROW_START || newRow > ROW_CITADEL) return;
    newX = Math.max(0, Math.min(GAME_W - PEPE_W, newX));

    // Can't hop onto bare train tracks — must have a train present
    if (newRow === ROW_TRAIN_1 || newRow === ROW_TRAIN_2) {
      const train =
        newRow === ROW_TRAIN_1
          ? { segments: train1Segments, x: train1X }
          : { segments: train2Segments, x: train2X };
      let segX = train.x;
      let onTrain = false;
      for (const seg of train.segments) {
        if (newX + PEPE_W > segX && newX < segX + seg.width) {
          onTrain = true;
          break;
        }
        segX += seg.width;
      }
      if (!onTrain) return; // bare track — blocked
    }

    // Can't hop onto a filled citadel
    if (newRow === ROW_CITADEL) {
      const ci = getCitadelIndex(newX);
      if (ci >= 0 && citadels[ci]) return; // blocked
    }

    pepeDir = dy > 0 ? "up" : dy < 0 ? "down" : dx > 0 ? "right" : "left";
    pepeStartX = pepeX;
    pepeStartRow = pepeRow;
    pepeTargetX = newX;
    pepeTargetRow = newRow;
    pepeHopping = true;
    pepeHopProgress = 0;
    lastHopTime = now;
    playHop();
  }

  // --- Draw ---
  function draw() {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    if (state === "title" || state === "gate") {
      drawTitle();
      return;
    }

    if (state === "gameOver") {
      drawGameOver();
      return;
    }

    drawHud();
    drawZones();
    drawObstacles();
    drawPepe();

    if (state === "levelClear") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      drawText("LEVEL CLEAR!", GAME_W / 2, GAME_H / 2 - 10, C.greenBright, 14);
      drawText(`LEVEL ${level}`, GAME_W / 2, GAME_H / 2 + 18, C.bright, 10);
    }

    if (state === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      drawText("PAUSED", GAME_W / 2, GAME_H / 2, C.yellowBright, 14);
    }
  }

  function drawHud() {
    // Score
    drawText(`SCORE ${score}`, 4, 4, C.bright, 8, "left");
    // Level
    drawText(`LVL ${level}`, GAME_W / 2, 4, C.yellowBright, 8);
    // Lives
    for (let i = 0; i < lives; i++) {
      drawPepeIcon(GAME_W - 20 - i * 18, 2);
    }

    // Timer bar (Frogger-style countdown)
    const barY = 16;
    const barW = GAME_W - 8;
    const barH = 5;
    const fraction = Math.max(0, lifeTimer / LIFE_TIME);
    // Background
    ctx.fillStyle = C.darkgray;
    ctx.fillRect(4, barY, barW, barH);
    // Fill — green→yellow→red as time runs out
    ctx.fillStyle =
      fraction > 0.5 ? C.greenLit : fraction > 0.2 ? C.yellowLit : C.redHot;
    ctx.fillRect(4, barY, Math.floor(barW * fraction), barH);
    // Outline
    ctx.strokeStyle = C.midgray;
    ctx.lineWidth = 1;
    ctx.strokeRect(4, barY, barW, barH);
  }

  function drawZones() {
    // Start zone
    ctx.fillStyle = "#1a1a0a";
    ctx.fillRect(0, rowY(ROW_START), GAME_W, ROW_H);

    // Lambo road
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, rowY(ROW_LAMBO_2), GAME_W, ROW_H * 2);
    // Road dashes
    const dashY = rowY(ROW_LAMBO_2) + ROW_H - 1;
    ctx.fillStyle = C.yellowLit;
    for (let dx = (animFrame * 0.5) % 16; dx < GAME_W; dx += 16) {
      ctx.fillRect(dx, dashY, 8, 2);
    }

    // Safe strip 1
    ctx.fillStyle = "#1a1a0a";
    ctx.fillRect(0, rowY(ROW_SAFE_1), GAME_W, ROW_H);
    drawSafeStrip(rowY(ROW_SAFE_1));

    // Train track 1 (going right)
    drawTrackRow(rowY(ROW_TRAIN_1));

    // Train track 2 (going left)
    drawTrackRow(rowY(ROW_TRAIN_2));

    // Safe strip 2
    ctx.fillStyle = "#1a1a0a";
    ctx.fillRect(0, rowY(ROW_SAFE_2), GAME_W, ROW_H);
    drawSafeStrip(rowY(ROW_SAFE_2));

    // Canyon (blue sky)
    ctx.fillStyle = "#1a2848";
    ctx.fillRect(0, rowY(ROW_CANYON_3), GAME_W, ROW_H * 3);

    // Citadel row (same sky color — gaps between castles are the chasm)
    ctx.fillStyle = "#1a2848";
    ctx.fillRect(0, rowY(ROW_CITADEL), GAME_W, ROW_H);
    drawCitadels();
  }

  function drawTrackRow(y: number) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, y, GAME_W, ROW_H);
    // Rails
    ctx.fillStyle = C.midgray;
    ctx.fillRect(0, y + 6, GAME_W, 2);
    ctx.fillRect(0, y + ROW_H - 8, GAME_W, 2);
    // Ties
    ctx.fillStyle = C.brown;
    for (let tx = 0; tx < GAME_W; tx += 14) {
      ctx.fillRect(tx, y + 4, 4, ROW_H - 8);
    }
  }

  function drawSafeStrip(y: number) {
    ctx.fillStyle = C.brownLit;
    ctx.fillRect(0, y + ROW_H - 3, GAME_W, 3);
    ctx.fillStyle = C.brown;
    for (let sx = 0; sx < GAME_W; sx += 20) {
      ctx.fillRect(sx, y + ROW_H - 3, 8, 3);
    }
  }

  function drawCitadels() {
    const y = rowY(ROW_CITADEL);
    const slotW = GAME_W / NUM_CITADELS;
    for (let i = 0; i < NUM_CITADELS; i++) {
      const cx = i * slotW + slotW / 2;
      const tx = cx - 12;
      const ty = y + 2;

      if (citadels[i]) {
        // Filled citadel — stone tower with flag
        ctx.fillStyle = C.stoneGray;
        ctx.fillRect(tx, ty, 24, 18);
        // Crenellations
        ctx.fillStyle = C.stoneDark;
        for (let j = 0; j < 5; j++) {
          ctx.fillRect(tx + j * 5, ty, 3, 4);
        }
        // Flag
        ctx.fillStyle = C.greenBright;
        ctx.fillRect(tx + 11, ty - 5, 1, 8);
        ctx.fillRect(tx + 12, ty - 5, 4, 3);
        // Pepe inside
        drawPepeIcon(cx - 6, ty + 6);
      } else {
        // Empty citadel — dark opening
        ctx.fillStyle = C.stoneDark;
        ctx.fillRect(tx, ty, 24, 18);
        ctx.fillStyle = C.stoneGray;
        // Crenellations
        for (let j = 0; j < 5; j++) {
          ctx.fillRect(tx + j * 5, ty, 3, 4);
        }
        ctx.fillStyle = C.black;
        ctx.fillRect(tx + 6, ty + 6, 12, 10);

        // Lady Pepe bonus — blink to attract attention
        if (i === bonusCitadel && Math.floor(animFrame / 10) % 3 !== 0) {
          drawLadyPepe(cx - 7, ty + 3, 14, 14);
        }
      }
    }
  }

  function drawObstacles() {
    // Lambo cars
    for (const car of lamboLane1) {
      drawLambo(car, rowY(ROW_LAMBO_1));
    }
    for (const car of lamboLane2) {
      drawLambo(car, rowY(ROW_LAMBO_2));
    }

    // Train
    drawTrain();

    // Canyon platforms — draw clouds first, then coins/shitcoins on top, rockets last
    for (let lane = 0; lane < 3; lane++) {
      const ly = rowY(ROW_CANYON_1 + lane);
      for (const plat of canyonLanes[lane]) {
        if (plat.type === "cloud") drawCloud(plat, ly);
      }
      for (const plat of canyonLanes[lane]) {
        if (plat.type === "coin") drawCoin(plat, ly);
        else if (plat.type === "shitcoin") drawShitcoin(plat, ly);
        else if (plat.type === "rocket") drawRocket(plat, ly);
      }
    }
  }

  function drawLambo(car: LamboCar, y: number) {
    const cx = Math.floor(car.x);
    const cy = y + 4;
    const w = car.width;
    const right = car.speed > 0; // traveling right

    // Wedge-shaped sportscar body (low front nose, high rear cabin)
    ctx.fillStyle = car.color;
    if (right) {
      // Traveling right: high rear (left), slopes down to low nose (right)
      ctx.fillRect(cx, cy + 8, w, 6); // lower body
      ctx.fillRect(cx, cy + 6, w - 4, 2); // mid body
      ctx.fillRect(cx, cy + 4, w - 10, 2); // upper slope
      ctx.fillRect(cx, cy + 2, 6, 2); // cabin top
    } else {
      // Traveling left: high rear (right), slopes down to low nose (left)
      ctx.fillRect(cx, cy + 8, w, 6);
      ctx.fillRect(cx + 4, cy + 6, w - 4, 2);
      ctx.fillRect(cx + 10, cy + 4, w - 10, 2);
      ctx.fillRect(cx + w - 6, cy + 2, 6, 2);
    }

    // Windshield (near rear cabin)
    ctx.fillStyle = C.blueSky;
    if (right) {
      ctx.fillRect(cx + 5, cy + 3, 5, 4);
    } else {
      ctx.fillRect(cx + w - 10, cy + 3, 5, 4);
    }

    // Wheels
    ctx.fillStyle = C.darkgray;
    ctx.fillRect(cx + 4, cy + 14, 4, 3);
    ctx.fillRect(cx + w - 8, cy + 14, 4, 3);

    // Headlight (at front/nose)
    ctx.fillStyle = C.yellowBright;
    if (right) {
      ctx.fillRect(cx + w - 2, cy + 8, 2, 3);
    } else {
      ctx.fillRect(cx, cy + 8, 2, 3);
    }

    // Shine highlight along top edge
    ctx.fillStyle = C.white;
    ctx.globalAlpha = 0.35;
    if (right) {
      ctx.fillRect(cx + 2, cy + 4, w - 12, 1);
    } else {
      ctx.fillRect(cx + 10, cy + 4, w - 12, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawTrain() {
    // Draw train 1 (going right) on its own row
    const y1 = rowY(ROW_TRAIN_1);
    let segX = train1X;
    for (const seg of train1Segments) {
      if (segX + seg.width > 0 && segX < GAME_W) {
        drawTrainSegment(seg, segX, y1, true);
      }
      segX += seg.width;
    }

    // Draw train 2 (going left) on its own row
    const y2 = rowY(ROW_TRAIN_2);
    segX = train2X;
    for (const seg of train2Segments) {
      if (segX + seg.width > 0 && segX < GAME_W) {
        drawTrainSegment(seg, segX, y2, false);
      }
      segX += seg.width;
    }
  }

  function drawTrainSegment(
    seg: TrainSegment,
    x: number,
    y: number,
    facingRight = true,
  ) {
    const h = ROW_H - 4;
    const ty = y + 2;

    switch (seg.type) {
      case "locomotive": {
        // Dark body with smokestack
        ctx.fillStyle = C.darkgray;
        ctx.fillRect(x, ty + 2, seg.width, h - 4);
        ctx.fillStyle = C.redLit;
        ctx.fillRect(x, ty + 2, seg.width, 3); // red top
        // Smokestack
        ctx.fillStyle = C.midgray;
        const stackX = facingRight ? x + seg.width - 8 : x + 4;
        ctx.fillRect(stackX, ty - 2, 4, 6);
        // Headlight
        ctx.fillStyle = C.yellowBright;
        const headX = facingRight ? x + seg.width - 2 : x;
        ctx.fillRect(headX, ty + 6, 2, 3);
        // Wheels
        ctx.fillStyle = C.black;
        ctx.fillRect(x + 4, ty + h - 3, 5, 3);
        ctx.fillRect(x + seg.width - 10, ty + h - 3, 5, 3);
        break;
      }

      case "boxcar":
        ctx.fillStyle = C.brownLit;
        ctx.fillRect(x + 1, ty + 2, seg.width - 2, h - 4);
        // Door
        ctx.fillStyle = C.brown;
        ctx.fillRect(x + seg.width / 2 - 3, ty + 4, 6, h - 8);
        // Wheels
        ctx.fillStyle = C.black;
        ctx.fillRect(x + 4, ty + h - 3, 4, 3);
        ctx.fillRect(x + seg.width - 8, ty + h - 3, 4, 3);
        break;

      case "tanker":
        // Cylindrical body
        ctx.fillStyle = C.midgray;
        ctx.fillRect(x + 2, ty + 4, seg.width - 4, h - 8);
        ctx.fillStyle = C.lightgray;
        ctx.fillRect(x + 4, ty + 4, seg.width - 8, 2);
        // Wheels
        ctx.fillStyle = C.black;
        ctx.fillRect(x + 4, ty + h - 3, 4, 3);
        ctx.fillRect(x + seg.width - 8, ty + h - 3, 4, 3);
        break;

      case "flatbed":
        // Low flat surface — clearly safe
        ctx.fillStyle = C.brownLit;
        ctx.fillRect(x + 1, ty + h - 8, seg.width - 2, 4);
        // Edge rails
        ctx.fillStyle = C.yellowLit;
        ctx.fillRect(x + 1, ty + h - 9, seg.width - 2, 1);
        // Wheels
        ctx.fillStyle = C.black;
        ctx.fillRect(x + 4, ty + h - 3, 4, 3);
        ctx.fillRect(x + seg.width - 8, ty + h - 3, 4, 3);
        break;

      case "caboose": {
        // Red caboose with cupola
        ctx.fillStyle = C.redLit;
        ctx.fillRect(x + 1, ty + 4, seg.width - 2, h - 6);
        // Cupola (raised section on top)
        ctx.fillStyle = C.redHot;
        ctx.fillRect(x + 6, ty + 1, seg.width - 12, 4);
        // Windows
        ctx.fillStyle = C.yellowBright;
        ctx.fillRect(x + 4, ty + 7, 3, 3);
        ctx.fillRect(x + seg.width - 7, ty + 7, 3, 3);
        // Rear light
        ctx.fillStyle = C.redHot;
        const tailX = facingRight ? x : x + seg.width - 2;
        ctx.fillRect(tailX, ty + 6, 2, 3);
        // Wheels
        ctx.fillStyle = C.black;
        ctx.fillRect(x + 4, ty + h - 3, 4, 3);
        ctx.fillRect(x + seg.width - 8, ty + h - 3, 4, 3);
        break;
      }
    }
  }

  function drawCoin(plat: CanyonPlatform, y: number) {
    if (plat.coinState === "gone") return;

    const cx = plat.x + plat.width / 2;
    const cy = y + ROW_H / 2;

    let scale = 1;
    if (plat.coinState === "falling") {
      scale = Math.max(0, plat.coinTimer / 500);
    } else if (plat.coinState === "rising") {
      scale = Math.max(0, 1 - plat.coinTimer / 500);
    }

    const flash =
      plat.coinState === "warning" && Math.floor(animFrame / 6) % 2 === 0;
    const r = Math.floor(8 * scale);
    if (r < 1) return;

    // Coin circle
    ctx.fillStyle = flash ? C.yellowBright : C.orange;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // B symbol
    if (r > 3) {
      ctx.fillStyle = flash ? C.orange : C.goldLit;
      ctx.font = `${Math.max(6, Math.floor(10 * scale))}px "Press Start 2P", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("B", cx, cy + 1);
    }
  }

  function drawShitcoin(plat: CanyonPlatform, y: number) {
    if (plat.coinState === "gone") return;

    const cx = plat.x + plat.width / 2;
    const cy = y + ROW_H / 2;

    let scale = 1;
    if (plat.coinState === "falling") {
      scale = Math.max(0, plat.coinTimer / 300);
    } else if (plat.coinState === "rising") {
      scale = Math.max(0, 1 - plat.coinTimer / 500);
    }

    const flash =
      plat.coinState === "warning" && Math.floor(animFrame / 6) % 2 === 0;
    const r = Math.floor(8 * scale);
    if (r < 1) return;

    const v = plat.shitcoinVariant;

    // Coin circle — color per variant
    const circleColor =
      v === "eth"
        ? "#7b7fc4"
        : v === "xrp"
          ? "#23292f"
          : v === "doge"
            ? "#c2a633"
            : v === "sol"
              ? "#14f195"
              : /* ltc */ "#b8b8b8";
    ctx.fillStyle = flash ? C.white : circleColor;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Symbol per variant
    if (r > 3) {
      if (v === "eth") {
        // Ethereum diamond logo
        const s = scale;
        const top = cy - Math.floor(6 * s);
        const mid = cy - Math.floor(1 * s);
        const bot = cy + Math.floor(7 * s);
        const hw = Math.floor(4 * s);

        ctx.fillStyle = flash ? C.midgray : "#c8c8f0";
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx - hw, mid);
        ctx.lineTo(cx, mid - Math.floor(1 * s));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = flash ? C.lightgray : C.white;
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx + hw, mid);
        ctx.lineTo(cx, mid - Math.floor(1 * s));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = flash ? C.midgray : "#9898d0";
        ctx.beginPath();
        ctx.moveTo(cx, bot);
        ctx.lineTo(cx - hw, mid);
        ctx.lineTo(cx, mid - Math.floor(1 * s));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = flash ? C.lightgray : "#b8b8e8";
        ctx.beginPath();
        ctx.moveTo(cx, bot);
        ctx.lineTo(cx + hw, mid);
        ctx.lineTo(cx, mid - Math.floor(1 * s));
        ctx.closePath();
        ctx.fill();
      } else if (v === "doge") {
        // Dogecoin: Ð on golden circle
        ctx.fillStyle = flash ? C.midgray : "#fff8dc";
        ctx.font = `bold ${Math.max(6, Math.floor(11 * scale))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Ð", cx, cy + 1);
      } else if (v === "sol") {
        // Solana: slanted S-bars — 3 horizontal bars tilted
        const s = scale;
        const bw = Math.floor(6 * s);
        const bh = Math.max(1, Math.floor(2 * s));
        const skew = Math.floor(2 * s);
        ctx.fillStyle = flash ? C.midgray : "#0d0d0d";
        for (let bi = -1; bi <= 1; bi++) {
          const by = cy + bi * Math.floor(3 * s) - bh / 2;
          const bx = cx - bw / 2 - bi * skew;
          ctx.fillRect(bx, by, bw, bh);
        }
      } else if (v === "ltc") {
        // Litecoin: Ł on silver circle
        ctx.fillStyle = flash ? C.midgray : "#3a3a3a";
        ctx.font = `bold ${Math.max(6, Math.floor(11 * scale))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Ł", cx, cy + 1);
      } else {
        // XRP: text "X"
        ctx.fillStyle = flash ? C.midgray : C.lightgray;
        ctx.font = `${Math.max(6, Math.floor(10 * scale))}px "Press Start 2P", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("X", cx, cy + 1);
      }
    }
  }

  function drawCloud(plat: CanyonPlatform, y: number) {
    const cx = plat.x;
    const cy = y + 6;

    if (plat.stormy) {
      // Dark storm cloud
      ctx.fillStyle = C.darkgray;
      ctx.fillRect(cx + 4, cy + 2, plat.width - 8, 10);
      ctx.fillRect(cx + 2, cy + 4, plat.width - 4, 8);
      ctx.fillRect(cx, cy + 6, plat.width, 4);
      // Underside darker
      ctx.fillStyle = C.black;
      ctx.fillRect(cx + 2, cy + 10, plat.width - 4, 2);
      // Lightning bolt flash
      if (Math.floor(animFrame / 4) % 5 === 0) {
        ctx.fillStyle = C.yellowBright;
        const lx = cx + Math.floor(plat.width / 2) - 1;
        ctx.fillRect(lx, cy + 12, 2, 3);
        ctx.fillRect(lx - 1, cy + 15, 2, 2);
        ctx.fillRect(lx, cy + 17, 2, 2);
      }
    } else {
      ctx.fillStyle = C.bright;
      // Puffy cloud shape
      ctx.fillRect(cx + 4, cy + 2, plat.width - 8, 10);
      ctx.fillRect(cx + 2, cy + 4, plat.width - 4, 8);
      ctx.fillRect(cx, cy + 6, plat.width, 4);
      // Highlight
      ctx.fillStyle = C.white;
      ctx.fillRect(cx + 6, cy + 3, plat.width - 14, 2);
      // Warning shimmer if this cloud can storm (subtle hint)
      if (plat.stormTimer >= 0 && plat.stormTimer < 1000) {
        ctx.fillStyle = C.midgray;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(cx + 2, cy + 10, plat.width - 4, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawRocket(plat: CanyonPlatform, y: number) {
    const rx = plat.x;
    const ry = y + 4;
    const facing = plat.speed > 0 ? 1 : -1;

    // Body
    ctx.fillStyle = C.redHot;
    ctx.fillRect(rx, ry + 4, plat.width, 10);

    // Pointy nose cone
    ctx.fillStyle = C.bright;
    if (facing > 0) {
      ctx.fillRect(rx + plat.width, ry + 5, 3, 8);
      ctx.fillRect(rx + plat.width + 3, ry + 7, 2, 4);
      ctx.fillRect(rx + plat.width + 5, ry + 8, 1, 2);
    } else {
      ctx.fillRect(rx - 3, ry + 5, 3, 8);
      ctx.fillRect(rx - 5, ry + 7, 2, 4);
      ctx.fillRect(rx - 6, ry + 8, 1, 2);
    }

    // Flame trail
    const flameX = facing > 0 ? rx - 8 : rx + plat.width;
    const flicker = Math.floor(animFrame / 3) % 2;
    ctx.fillStyle = flicker ? C.yellowBright : C.orangeHot;
    ctx.fillRect(flameX, ry + 6, 8, 6);
    ctx.fillStyle = flicker ? C.orangeHot : C.redLit;
    ctx.fillRect(flameX + (facing > 0 ? -4 : 8), ry + 8, 4, 2);

    // Tail fins (at rear end)
    ctx.fillStyle = C.redLit;
    const finX = facing > 0 ? rx : rx + plat.width - 3;
    ctx.fillRect(finX, ry + 2, 3, 3); // top fin
    ctx.fillRect(finX, ry + 13, 3, 3); // bottom fin

    // Window
    ctx.fillStyle = C.blueSky;
    const winX = facing > 0 ? rx + plat.width - 8 : rx + 4;
    ctx.fillRect(winX, ry + 6, 4, 3);
  }

  function drawPepe() {
    if (state === "dying") {
      // Death animation
      const px = pepeScreenX();
      const py = pepeScreenY();
      const progress = 1 - dyingTimer / 600;

      if (dyingType === "splat") {
        // Flatten and spread
        const squish = 1 + progress * 2;
        const h = Math.max(2, PEPE_H / squish);
        ctx.fillStyle = C.greenLit;
        ctx.fillRect(
          px - progress * 4,
          py + PEPE_H - h,
          PEPE_W + progress * 8,
          h,
        );
      } else {
        // Shrink into canyon
        const scale = 1 - progress;
        const w = PEPE_W * scale;
        const h = PEPE_H * scale;
        ctx.globalAlpha = scale;
        drawPepeSprite(px + (PEPE_W - w) / 2, py + (PEPE_H - h) / 2, w, h);
        ctx.globalAlpha = 1;
      }
      return;
    }

    const px = pepeScreenX();
    const py = pepeScreenY();

    // Hop arc (slight upward bounce)
    let hopOffset = 0;
    if (pepeHopping) {
      hopOffset = -Math.sin(pepeHopProgress * Math.PI) * 6;
    }

    drawPepeSprite(px, py + hopOffset, PEPE_W, PEPE_H);
  }

  function drawPepeSprite(x: number, y: number, w: number, h: number) {
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    const sw = Math.floor(w);
    const sh = Math.floor(h);

    // Head
    ctx.fillStyle = C.greenLit;
    ctx.fillRect(sx + 1, sy, sw - 2, sh);
    ctx.fillRect(sx, sy + 2, sw, sh - 4);

    // Eyes (white with black pupil)
    const eyeW = Math.max(2, Math.floor(sw * 0.25));
    const eyeH = Math.max(2, Math.floor(sh * 0.25));
    const eyeY = sy + Math.floor(sh * 0.2);
    const leftEyeX = sx + Math.floor(sw * 0.2);
    const rightEyeX = sx + Math.floor(sw * 0.55);

    ctx.fillStyle = C.white;
    ctx.fillRect(leftEyeX, eyeY, eyeW, eyeH);
    ctx.fillRect(rightEyeX, eyeY, eyeW, eyeH);

    ctx.fillStyle = C.black;
    const pupilW = Math.max(1, Math.floor(eyeW * 0.5));
    // Pupils shift based on facing direction
    const pupilDx =
      pepeDir === "left"
        ? 0
        : pepeDir === "right"
          ? eyeW - pupilW
          : Math.floor((eyeW - pupilW) / 2);
    const pupilDy =
      pepeDir === "up" ? 0 : pepeDir === "down" ? eyeH - pupilW : 1;
    ctx.fillRect(leftEyeX + pupilDx, eyeY + pupilDy, pupilW, pupilW);
    ctx.fillRect(rightEyeX + pupilDx, eyeY + pupilDy, pupilW, pupilW);

    // Pepe lips (brown/tan, distinctive shape)
    if (sh > 8) {
      const lipY = sy + Math.floor(sh * 0.6);
      // Upper lip line
      ctx.fillStyle = C.brownLit;
      ctx.fillRect(sx + 2, lipY, sw - 4, 1);
      // Lower lip (fuller, rounder)
      ctx.fillStyle = C.brown;
      ctx.fillRect(sx + 3, lipY + 1, sw - 6, 2);
      ctx.fillRect(sx + 4, lipY + 3, sw - 8, 1);
      // Lip highlight
      ctx.fillStyle = C.orangeLit;
      ctx.fillRect(sx + 4, lipY + 1, sw - 8, 1);
    }
  }

  function drawLadyPepe(x: number, y: number, w: number, h: number) {
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    const sw = Math.floor(w);
    const sh = Math.floor(h);

    // Pink bow on top (drawn first so it peeks above head)
    ctx.fillStyle = C.pinkLit;
    const bowX = sx + Math.floor(sw * 0.55);
    ctx.fillRect(bowX - 3, sy - 2, 3, 2); // left wing
    ctx.fillRect(bowX + 1, sy - 2, 3, 2); // right wing
    ctx.fillStyle = C.redLit;
    ctx.fillRect(bowX, sy - 2, 1, 2); // center knot

    // Head (lighter green than regular Pepe)
    ctx.fillStyle = C.greenBright;
    ctx.fillRect(sx + 1, sy, sw - 2, sh);
    ctx.fillRect(sx, sy + 2, sw, sh - 4);

    // Big cute eyes (larger ratio than male Pepe)
    const eyeW = Math.max(3, Math.floor(sw * 0.3));
    const eyeH = Math.max(3, Math.floor(sh * 0.3));
    const eyeY = sy + Math.floor(sh * 0.15);
    const leftEyeX = sx + Math.floor(sw * 0.12);
    const rightEyeX = sx + sw - Math.floor(sw * 0.12) - eyeW;

    ctx.fillStyle = C.white;
    ctx.fillRect(leftEyeX, eyeY, eyeW, eyeH);
    ctx.fillRect(rightEyeX, eyeY, eyeW, eyeH);

    // Big pupils (looking slightly up = cute)
    ctx.fillStyle = C.black;
    const pupilW = Math.max(1, Math.floor(eyeW * 0.5));
    const px = Math.floor((eyeW - pupilW) / 2);
    ctx.fillRect(leftEyeX + px, eyeY, pupilW, pupilW);
    ctx.fillRect(rightEyeX + px, eyeY, pupilW, pupilW);

    // Eye sparkle (cute highlight)
    ctx.fillStyle = C.white;
    ctx.fillRect(leftEyeX + px + pupilW - 1, eyeY, 1, 1);
    ctx.fillRect(rightEyeX + px + pupilW - 1, eyeY, 1, 1);

    // Eyelashes (two little lines above each eye)
    ctx.fillStyle = C.black;
    ctx.fillRect(leftEyeX, eyeY - 1, 1, 1);
    ctx.fillRect(leftEyeX + eyeW - 1, eyeY - 1, 1, 1);
    ctx.fillRect(rightEyeX, eyeY - 1, 1, 1);
    ctx.fillRect(rightEyeX + eyeW - 1, eyeY - 1, 1, 1);

    // Blush (rosy cheeks)
    ctx.fillStyle = C.pinkLit;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(sx + 1, eyeY + eyeH, 2, 2);
    ctx.fillRect(sx + sw - 3, eyeY + eyeH, 2, 2);
    ctx.globalAlpha = 1;

    // Fuller lips with lipstick
    if (sh > 6) {
      const lipY = sy + Math.floor(sh * 0.6);
      // Upper lip
      ctx.fillStyle = C.redHot;
      ctx.fillRect(sx + 2, lipY, sw - 4, 1);
      // Smile curve at corners
      ctx.fillRect(sx + 1, lipY - 1, 1, 1);
      ctx.fillRect(sx + sw - 2, lipY - 1, 1, 1);
      // Full lower lip
      ctx.fillStyle = C.pinkLit;
      ctx.fillRect(sx + 3, lipY + 1, sw - 6, 2);
      ctx.fillRect(sx + 2, lipY + 1, sw - 4, 1);
    }
  }

  function drawPepeIcon(x: number, y: number) {
    ctx.fillStyle = C.greenLit;
    ctx.fillRect(x, y, 12, 10);
    ctx.fillStyle = C.white;
    ctx.fillRect(x + 2, y + 2, 3, 3);
    ctx.fillRect(x + 7, y + 2, 3, 3);
    ctx.fillStyle = C.black;
    ctx.fillRect(x + 3, y + 3, 1, 1);
    ctx.fillRect(x + 8, y + 3, 1, 1);
    // Lips
    ctx.fillStyle = C.brownLit;
    ctx.fillRect(x + 3, y + 7, 6, 1);
    ctx.fillStyle = C.brown;
    ctx.fillRect(x + 4, y + 8, 4, 1);
  }

  function drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number,
    align: CanvasTextAlign = "center",
  ) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
  }

  function drawTitle() {
    // Banded title — draw each row of text with alternating green shades
    const title = "DIP HOPPER";
    const fontSize = 22;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tx = GAME_W / 2;
    const ty = 28;
    // Draw band layers top to bottom with clipping
    const bands = [
      C.greenBright,
      C.greenLit,
      C.greenBright,
      C.green,
      C.greenLit,
    ];
    const bandH = Math.ceil(fontSize / bands.length);
    for (let i = 0; i < bands.length; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, ty + i * bandH, GAME_W, bandH);
      ctx.clip();
      ctx.fillStyle = bands[i];
      ctx.fillText(title, tx, ty);
      ctx.restore();
    }

    // Pepe preview
    drawPepeSprite(GAME_W / 2 - 16, 80, 32, 32);

    drawText("HELP PEPE LEAP", GAME_W / 2, 130, C.bright, 8);
    drawText("TO THE CITADELS", GAME_W / 2, 145, C.bright, 8);

    drawText("DODGE THE LAMBOS!", GAME_W / 2, 170, C.orangeHot, 10);
    drawText("NOTHING STOPS", GAME_W / 2, 190, C.brownLit, 10);
    drawText("THIS TRAIN!", GAME_W / 2, 206, C.brownLit, 10);
    drawText("CROSS THE CHASM!", GAME_W / 2, 226, C.gold, 10);

    if (Math.floor(animFrame / 30) % 2 === 0) {
      drawText(
        "TAP OR PRESS SPACE",
        GAME_W / 2,
        GAME_H - 30,
        C.yellowBright,
        8,
      );
    }
  }

  function drawGameOver() {
    drawText("GAME OVER", GAME_W / 2, GAME_H / 2 - 30, C.redHot, 16);
    drawText(`SCORE: ${score}`, GAME_W / 2, GAME_H / 2 + 10, C.bright, 10);

    if (Math.floor(animFrame / 30) % 2 === 0) {
      drawText(
        "TAP OR PRESS SPACE",
        GAME_W / 2,
        GAME_H / 2 + 40,
        C.yellowBright,
        8,
      );
    }
  }

  // --- Game lifecycle ---
  function tryStart() {
    if (gated) {
      setState("gate");
    } else {
      startGame();
    }
  }

  function startGame() {
    score = 0;
    level = 1;
    lives = LIVES_INITIAL;
    initLevel();
    setState("playing");
  }

  function gameLoop() {
    animFrame++;
    update();
    draw();
    rafId = requestAnimationFrame(gameLoop);
  }

  // --- Input handlers ---
  function onKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;

    if (state === "title" || state === "gameOver") {
      if (e.key === " " || e.key === "Enter") {
        tryStart();
        e.preventDefault();
      }
      return;
    }

    // Dev: number keys 1-9 jump to that level
    if (devMode && e.key >= "1" && e.key <= "9" && state === "playing") {
      level = parseInt(e.key, 10);
      initLevel();
      resetPepe();
      return;
    }

    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
      ].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  // Touch/swipe input
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (state === "title" || state === "gameOver") {
      tryStart();
      return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (state !== "playing" || pepeHopping) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;

    // Quick tap = hop up
    if (elapsed < 200 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      keys["ArrowUp"] = true;
      setTimeout(() => {
        keys["ArrowUp"] = false;
      }, 50);
      return;
    }

    // Swipe detection
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minSwipe = 20;

    if (absDx > absDy && absDx > minSwipe) {
      const key = dx > 0 ? "ArrowRight" : "ArrowLeft";
      keys[key] = true;
      setTimeout(() => {
        keys[key] = false;
      }, 50);
    } else if (absDy > minSwipe) {
      const key = dy < 0 ? "ArrowUp" : "ArrowDown";
      keys[key] = true;
      setTimeout(() => {
        keys[key] = false;
      }, 50);
    }
  }

  function onMouseClick() {
    if (state === "title" || state === "gameOver") {
      tryStart();
    }
  }

  function start() {
    canvas.width = GAME_W;
    canvas.height = GAME_H;
    setState("title");
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("click", onMouseClick);
    rafId = requestAnimationFrame(gameLoop);
  }

  function stop() {
    if (rafId != null) cancelAnimationFrame(rafId);
    if (levelClearTimer) clearTimeout(levelClearTimer);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("click", onMouseClick);
    rafId = null;
  }

  return {
    start,
    stop,
    beginGame: () => {
      gated = false;
      startGame();
    },
    reGate: () => {
      gated = true;
    },
    pause: () => {
      if (state === "playing") {
        pauseStart = Date.now();
        setState("paused");
      }
    },
    resume: () => {
      if (state === "paused") {
        // Adjust timers for pause duration so nothing expires while paused
        const d = Date.now() - pauseStart;
        for (const lane of canyonLanes) {
          for (const plat of lane) {
            if (plat.type === "coin") plat.coinTimer += d;
          }
        }
        // lifeTimer doesn't need adjustment — it decrements by frame dt, not wall clock
        setState("playing");
      }
    },
    getState: () => state,
    getScore: () => score,
    getLevel: () => level,
    getLives: () => lives,
    /** Dev hook: jump to a specific level mid-game */
    setLevel: (n: number) => {
      level = Math.max(1, Math.floor(n));
      initLevel();
      resetPepe();
      if (state !== "playing") setState("playing");
    },
  };
}
