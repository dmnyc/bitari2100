/**
 * ASTERORDINALS — Asteroids-style game where you blast ordinal NFT collections.
 *
 * Ship = orange triangle, fires zaps (lightning bolts).
 * Ordinals = monkeys, penguins, pepes, bears, punks, cowboys, emojis.
 * Large ordinals split into medium, medium split into small.
 * CEX saucer appears periodically and shoots back.
 *
 * Renders to a <canvas> element. Uses TIA sound synthesis.
 * Atari 2600 NTSC palette colors.
 */

import {
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
};

// --- Game constants ---
const GAME_W = 320;
const GAME_H = 240;
const HUD_H = 16;
const PLAY_TOP = HUD_H;
const PLAY_H = GAME_H - HUD_H;

// Ship
const SHIP_TURN_SPEED = 0.07;
const SHIP_THRUST = 0.12;
const SHIP_FRICTION = 0.988;
const SHIP_MAX_SPEED = 4.5;
const SHIP_RADIUS = 7;

// Bullets
const BULLET_SPEED = 5.5;
const BULLET_LIFETIME = 55;
const BULLET_MAX = 4;
const FIRE_COOLDOWN = 12;

// Ordinals
const ORD_LARGE_R = 18;
const ORD_MEDIUM_R = 11;
const ORD_SMALL_R = 6;
const ORD_LARGE_SPEED_MIN = 0.35;
const ORD_LARGE_SPEED_MAX = 0.80;
const ORD_MEDIUM_SPEED_MIN = 0.60;
const ORD_MEDIUM_SPEED_MAX = 1.30;
const ORD_SMALL_SPEED_MIN = 1.00;
const ORD_SMALL_SPEED_MAX = 2.00;

// Scoring
const SCORE_LARGE = 20;
const SCORE_MEDIUM = 50;
const SCORE_SMALL = 100;
const SCORE_SAUCER_LARGE = 200;
const SCORE_SAUCER_SMALL = 1000;

// Levels
const INITIAL_LARGE = 2;
const LARGE_PER_LEVEL = 1;
const MAX_LARGE = 8;
const LIVES_INITIAL = 3;
const EXTRA_LIFE_SCORE = 10000;

// Saucer
const SAUCER_INTERVAL_MIN = 12000;
const SAUCER_INTERVAL_MAX = 25000;
const SAUCER_SPEED = 1.5;
const SAUCER_FIRE_INTERVAL = 2000;
const SAUCER_RADIUS = 10;

// Respawn
const RESPAWN_INVINCIBLE_MS = 2500;
const RESPAWN_DELAY_MS = 1000;

// --- Types ---
type OrdinalSize = "large" | "medium" | "small";
type OrdinalType = "monkey" | "penguin" | "pepe" | "bear" | "punk" | "cowboy" | "emoji";
const ORD_TYPES: OrdinalType[] = ["monkey", "penguin", "pepe", "bear", "punk", "cowboy", "emoji"];

interface Ordinal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: OrdinalSize;
  radius: number;
  type: OrdinalType;
  colorVariant: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Saucer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isSmall: boolean;
  fireTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  alive: boolean;
  invincibleUntil: number;
}

export type GameState =
  | "title"
  | "gate"
  | "playing"
  | "paused"
  | "levelClear"
  | "gameOver";

export interface AsterordinalsGame {
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

function playShoot() {
  gameTone(800, 0.04, 0.08);
  setTimeout(() => gameTone(400, 0.03, 0.05), 30);
}

function playOrdinalDestroy(size: OrdinalSize) {
  if (size === "large") {
    gameTone(150, 0.15, 0.15);
    setTimeout(() => gameTone(100, 0.2, 0.12), 80);
    setTimeout(() => gameTone(70, 0.15, 0.1), 180);
  } else if (size === "medium") {
    gameTone(200, 0.1, 0.12);
    setTimeout(() => gameTone(140, 0.12, 0.09), 70);
  } else {
    gameTone(300, 0.06, 0.1);
    setTimeout(() => gameTone(200, 0.06, 0.07), 50);
  }
}

function playShipDestroy() {
  gameTone(400, 0.08, 0.15);
  setTimeout(() => gameTone(300, 0.08, 0.15), 80);
  setTimeout(() => gameTone(200, 0.1, 0.12), 160);
  setTimeout(() => gameTone(100, 0.3, 0.15), 250);
  setTimeout(() => gameTone(60, 0.4, 0.08, "sawtooth"), 300);
}

function playSaucerAlert() {
  const warble = () => {
    gameTone(440, 0.1, 0.07);
    setTimeout(() => gameTone(330, 0.1, 0.07), 110);
  };
  warble();
  setTimeout(warble, 220);
}

function playExtraLife() {
  gameTone(523, 0.08, 0.12);
  setTimeout(() => gameTone(659, 0.08, 0.12), 90);
  setTimeout(() => gameTone(784, 0.08, 0.12), 180);
  setTimeout(() => gameTone(1047, 0.15, 0.15), 270);
}

function playGameStart() {
  // Close Encounters-style 5-tone motif (D E C C' G)
  gameTone(587, 0.25, 0.12, "sine");       // D5
  setTimeout(() => gameTone(659, 0.25, 0.12, "sine"), 300);  // E5
  setTimeout(() => gameTone(523, 0.25, 0.12, "sine"), 600);  // C5
  setTimeout(() => gameTone(262, 0.25, 0.12, "sine"), 900);  // C4
  setTimeout(() => gameTone(392, 0.4, 0.14, "sine"), 1200);  // G4
}

function playThumpLow() {
  gameTone(80, 0.06, 0.08, "triangle");
}

function playThumpHigh() {
  gameTone(95, 0.06, 0.08, "triangle");
}

// Thrust sound — continuous rumble while thrusting
let thrustOsc: OscillatorNode | null = null;
let thrustGain: GainNode | null = null;

function startThrustSound() {
  if (thrustOsc || isMuted()) return;
  const ac = getAudioCtx();
  thrustOsc = ac.createOscillator();
  thrustGain = ac.createGain();
  thrustOsc.type = "sawtooth";
  thrustOsc.frequency.setValueAtTime(55, ac.currentTime);
  thrustGain.gain.setValueAtTime(0.04, ac.currentTime);
  thrustOsc.connect(thrustGain);
  thrustGain.connect(ac.destination);
  thrustOsc.start();
}

function stopThrustSound() {
  if (!thrustOsc || !thrustGain) return;
  const ac = getAudioCtx();
  thrustGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.05);
  const osc = thrustOsc;
  setTimeout(() => { try { osc.stop(); } catch {} }, 60);
  thrustOsc = null;
  thrustGain = null;
}

// --- Sprite drawing ---
// Each ordinal type is drawn on an 8x8 pixel grid scaled to fit the size.
// scale: large=2.5, medium=1.5, small=1.0

function drawOrdinalSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  size: OrdinalSize,
  type: OrdinalType,
  colorVariant: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const scale = size === "large" ? 2.5 : size === "medium" ? 1.5 : 1.0;
  const o = -4 * scale; // center the 8x8 grid

  switch (type) {
    case "monkey": drawMonkeySprite(ctx, o, scale, size, colorVariant); break;
    case "penguin": drawPenguinSprite(ctx, o, scale, size, colorVariant); break;
    case "pepe": drawPepeSprite(ctx, o, scale, size, colorVariant); break;
    case "bear": drawBearSprite(ctx, o, scale, size, colorVariant); break;
    case "punk": drawPunkSprite(ctx, o, scale, size, colorVariant); break;
    case "cowboy": drawCowboySprite(ctx, o, scale, size, colorVariant); break;
    case "emoji": drawEmojiSprite(ctx, o, scale, size, colorVariant); break;
  }

  ctx.restore();
}

// Helper: fill a pixel at grid position (col, row) with current scale
function px(ctx: CanvasRenderingContext2D, o: number, s: number, col: number, row: number, w = 1, h = 1) {
  ctx.fillRect(o + col * s, o + row * s, w * s, h * s);
}

function drawMonkeySprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  const bodyColors = [C.brown, C.orange, "#5c3010", "#8c5030"];
  const body = bodyColors[v % 4];
  const face = C.brownLit;

  // Ears
  ctx.fillStyle = body;
  px(ctx, o, s, 0, 1, 1, 2); // left ear
  px(ctx, o, s, 7, 1, 1, 2); // right ear

  // Head
  ctx.fillStyle = body;
  px(ctx, o, s, 1, 0, 6, 6);
  px(ctx, o, s, 0, 1, 8, 4);

  // Face patch
  ctx.fillStyle = face;
  px(ctx, o, s, 2, 2, 4, 4);

  // Eyes
  ctx.fillStyle = C.black;
  px(ctx, o, s, 2, 3);
  px(ctx, o, s, 5, 3);

  // Mouth
  ctx.fillStyle = C.black;
  px(ctx, o, s, 3, 5, 2, 1);

  // Body hint
  ctx.fillStyle = body;
  px(ctx, o, s, 2, 6, 4, 2);

  // Hat at large size
  if (size === "large") {
    const hatColors = [null, C.red, C.gold, C.blueSky];
    const hc = hatColors[v % 4];
    if (hc) {
      ctx.fillStyle = hc;
      px(ctx, o, s, 1, -1, 6, 1);
      px(ctx, o, s, 2, -2, 4, 1);
    }
  }
}

function drawPenguinSprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  // Black wings/outline
  ctx.fillStyle = C.black;
  px(ctx, o, s, 0, 1, 1, 5);
  px(ctx, o, s, 7, 1, 1, 5);
  px(ctx, o, s, 1, 6, 6, 1);

  // White body
  ctx.fillStyle = C.white;
  px(ctx, o, s, 1, 0, 6, 6);
  px(ctx, o, s, 2, 5, 4, 1);

  // Eyes
  ctx.fillStyle = C.black;
  px(ctx, o, s, 2, 2);
  px(ctx, o, s, 5, 2);

  // Beak
  ctx.fillStyle = C.orangeHot;
  px(ctx, o, s, 3, 3, 2, 1);

  // Feet
  ctx.fillStyle = C.orangeHot;
  px(ctx, o, s, 2, 7, 2, 1);
  px(ctx, o, s, 5, 7, 2, 1);

  // Sunglasses at variant 0
  if (v === 0) {
    ctx.fillStyle = C.darkgray;
    px(ctx, o, s, 1, 2, 3, 1);
    px(ctx, o, s, 4, 2, 3, 1);
  }

  // Hat at large
  if (size === "large" && v > 0) {
    const hats = [null, C.red, C.yellowBright, C.blueSky];
    const hc = hats[v % 4];
    if (hc) {
      ctx.fillStyle = hc;
      px(ctx, o, s, 2, -2, 4, 2);
      px(ctx, o, s, 3, -3, 2, 1);
    }
  }
}

function drawPepeSprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  const greens = [C.green, C.greenLit, "#305030", C.greenBright];
  const g = greens[v % 4];

  // Head
  ctx.fillStyle = g;
  px(ctx, o, s, 1, 0, 6, 7);
  px(ctx, o, s, 0, 1, 8, 5);

  // Big white eyes
  ctx.fillStyle = C.white;
  px(ctx, o, s, 1, 2, 2, 2);
  px(ctx, o, s, 5, 2, 2, 2);

  // Pupils
  ctx.fillStyle = C.black;
  px(ctx, o, s, 2, 2);
  px(ctx, o, s, 6, 2);

  // Red lips
  ctx.fillStyle = C.redLit;
  px(ctx, o, s, 2, 5, 4, 1);

  // Mouth (large only)
  if (size !== "small") {
    ctx.fillStyle = C.black;
    px(ctx, o, s, 3, 6, 2, 1);
  }

  // Variant expressions
  if (v === 1 && size === "large") {
    // Sad — tear
    ctx.fillStyle = C.blueSky;
    px(ctx, o, s, 2, 4);
  }
  if (v === 3 && size === "large") {
    // Smug — raised brow
    ctx.fillStyle = g;
    px(ctx, o, s, 5, 1, 2, 1);
  }
}

function drawBearSprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  const bearColors = [C.purpleLit, C.pinkLit, C.orangeLit, C.cyanLit];
  const bc = bearColors[v % 4];

  // Ears
  ctx.fillStyle = bc;
  px(ctx, o, s, 0, 0, 2, 2);
  px(ctx, o, s, 6, 0, 2, 2);

  // Head
  ctx.fillStyle = bc;
  px(ctx, o, s, 1, 1, 6, 5);
  px(ctx, o, s, 0, 2, 8, 3);

  // Eyes
  const eyeColor = (v === 0 || v === 2) ? C.redHot : C.black;
  ctx.fillStyle = eyeColor;
  px(ctx, o, s, 2, 2);
  px(ctx, o, s, 5, 2);

  // Laser beams (large, variants 0 and 2)
  if (size === "large" && (v === 0 || v === 2)) {
    ctx.fillStyle = C.redHot;
    // Beams extend outward from eyes
    px(ctx, o, s, -3, 2, 3, 1);
    px(ctx, o, s, 8, 2, 3, 1);
  }

  // Mouth
  ctx.fillStyle = C.black;
  px(ctx, o, s, 3, 4, 2, 1);

  // Body
  ctx.fillStyle = bc;
  px(ctx, o, s, 2, 6, 4, 2);
}

function drawPunkSprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  const skinColors = ["#d0a080", "#c08060", "#a06040", "#80c0b0"];
  const mohawkColors = [C.redHot, C.cyanLit, C.purpleLit, C.yellowBright];
  const skin = skinColors[v % 4];
  const mohawk = mohawkColors[v % 4];

  // Hair/mohawk
  ctx.fillStyle = mohawk;
  if (v < 2) {
    // Spiky mohawk
    px(ctx, o, s, 3, -2, 2, 3);
    px(ctx, o, s, 2, -1, 4, 2);
  } else {
    // Flat cap
    px(ctx, o, s, 1, -1, 6, 1);
    px(ctx, o, s, 0, 0, 8, 1);
  }

  // Head (square)
  ctx.fillStyle = skin;
  px(ctx, o, s, 1, 0, 6, 7);

  // Eyes
  ctx.fillStyle = C.black;
  px(ctx, o, s, 2, 2);
  px(ctx, o, s, 5, 2);

  // Nose
  ctx.fillStyle = C.black;
  px(ctx, o, s, 4, 3);

  // Mouth
  ctx.fillStyle = C.black;
  px(ctx, o, s, 3, 5, 2, 1);

  // Cigarette (large, variant 0)
  if (size === "large" && v === 0) {
    ctx.fillStyle = C.white;
    px(ctx, o, s, 6, 5, 2, 1);
    ctx.fillStyle = C.orangeHot;
    px(ctx, o, s, 8, 5);
  }
}

function drawCowboySprite(ctx: CanvasRenderingContext2D, o: number, s: number, size: OrdinalSize, v: number) {
  const hatColors = [C.brown, "#3c2000", C.orange, C.midgray];
  const bandanaColors = [C.red, C.blueSky, C.yellowLit, C.green];
  const hat = hatColors[v % 4];
  const bandana = bandanaColors[v % 4];

  // Hat brim
  ctx.fillStyle = hat;
  px(ctx, o, s, 0, 1, 8, 1);
  // Hat crown
  px(ctx, o, s, 2, -2, 4, 3);

  // Face skin
  ctx.fillStyle = "#d0a060";
  px(ctx, o, s, 2, 2, 4, 5);

  // Eyes
  ctx.fillStyle = C.black;
  px(ctx, o, s, 2, 2);
  px(ctx, o, s, 5, 2);

  // Bandana
  ctx.fillStyle = bandana;
  px(ctx, o, s, 2, 4, 4, 2);

  // Bandana pattern (large)
  if (size === "large") {
    ctx.fillStyle = C.white;
    px(ctx, o, s, 3, 4);
    px(ctx, o, s, 5, 5);
  }
}

function drawEmojiSprite(ctx: CanvasRenderingContext2D, o: number, s: number, _size: OrdinalSize, v: number) {
  // Circle body
  ctx.fillStyle = C.yellowBright;
  px(ctx, o, s, 1, 0, 6, 8);
  px(ctx, o, s, 0, 1, 8, 6);

  // Eyes
  ctx.fillStyle = C.black;
  if (v === 2) {
    // Surprised — tall eyes
    px(ctx, o, s, 2, 2, 1, 2);
    px(ctx, o, s, 5, 2, 1, 2);
  } else {
    px(ctx, o, s, 2, 2);
    px(ctx, o, s, 5, 2);
  }

  // Angry brows
  if (v === 3) {
    ctx.fillStyle = C.black;
    px(ctx, o, s, 1, 1, 2, 1);
    px(ctx, o, s, 5, 1, 2, 1);
  }

  // Mouth
  ctx.fillStyle = C.black;
  switch (v) {
    case 0: // happy smile
      px(ctx, o, s, 2, 5, 4, 1);
      px(ctx, o, s, 1, 5);
      px(ctx, o, s, 6, 5);
      break;
    case 1: // sad frown
      px(ctx, o, s, 2, 6, 4, 1);
      px(ctx, o, s, 1, 5);
      px(ctx, o, s, 6, 5);
      break;
    case 2: // surprised O
      px(ctx, o, s, 3, 5, 2, 2);
      break;
    case 3: // angry line
      px(ctx, o, s, 2, 5, 4, 1);
      break;
  }
}

// --- Physics helpers ---
function wrapX(x: number): number {
  if (x < 0) return GAME_W + x;
  if (x >= GAME_W) return x - GAME_W;
  return x;
}

function wrapY(y: number): number {
  if (y < PLAY_TOP) return GAME_H - (PLAY_TOP - y);
  if (y >= GAME_H) return PLAY_TOP + (y - GAME_H);
  return y;
}

function circleCollide(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

// --- Main game factory ---
export function createAsterordinals(
  canvas: HTMLCanvasElement,
  onStateChange?: (state: GameState) => void,
  gated = true,
  devMode = false,
): AsterordinalsGame {
  const ctx = canvas.getContext("2d")!;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  let state: GameState = "title";
  let score = 0;
  let level = 1;
  let lives = LIVES_INITIAL;
  let nextExtraLifeScore = EXTRA_LIFE_SCORE;
  let animFrame = 0;
  let rafId: number | null = null;
  let levelClearTimer: ReturnType<typeof setTimeout> | null = null;
  let pauseStart = 0;
  let lastTime = 0;

  // Ship
  let ship: Ship = {
    x: GAME_W / 2,
    y: GAME_H / 2 + HUD_H / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    alive: true,
    invincibleUntil: 0,
  };

  // Game objects
  let ordinals: Ordinal[] = [];
  let shipBullets: Bullet[] = [];
  let saucerBullets: Bullet[] = [];
  let particles: Particle[] = [];
  let saucer: Saucer | null = null;
  let saucerTimer = 0;
  let fireCooldown = 0;
  let respawnTimer: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat thump
  let thumpToggle = false;
  let thumpCounter = 0;

  // Input
  const keys: Record<string, boolean> = {};
  let touchThrust = false;
  let touchAngle = 0; // angle from swipe gesture
  let touchAiming = false; // true when swipe is actively setting ship angle

  // Swipe tracking per-touch
  const touchStarts: Map<
    number,
    { x: number; y: number; time: number }
  > = new Map();
  const TAP_MAX_DIST = 15; // px in game coords
  const TAP_MAX_TIME = 250; // ms

  // Starfield
  const stars: { x: number; y: number; brightness: number }[] = [];
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.floor(Math.random() * GAME_W),
      y: Math.floor(PLAY_TOP + Math.random() * PLAY_H),
      brightness: 0.2 + Math.random() * 0.6,
    });
  }

  // Title demo ordinals
  const demoOrdinals: { x: number; y: number; type: OrdinalType; baseAngle: number; v: number }[] = [
    { x: 40, y: 70, type: "monkey", baseAngle: 0.3, v: 0 },
    { x: 280, y: 65, type: "penguin", baseAngle: -0.4, v: 1 },
    { x: 160, y: 80, type: "pepe", baseAngle: 0.8, v: 0 },
    { x: 25, y: 150, type: "punk", baseAngle: -0.2, v: 2 },
    { x: 295, y: 155, type: "bear", baseAngle: 0.5, v: 0 },
    { x: 125, y: 175, type: "cowboy", baseAngle: -0.7, v: 3 },
    { x: 205, y: 170, type: "emoji", baseAngle: 0.1, v: 2 },
  ];

  function setState(s: GameState) {
    state = s;
    onStateChange?.(s);
  }

  // --- Level init ---
  function initLevel() {
    ordinals = spawnOrdinals(level);
    shipBullets = [];
    saucerBullets = [];
    particles = [];
    saucer = null;
    resetSaucerTimer();
    ship.x = GAME_W / 2;
    ship.y = GAME_H / 2 + HUD_H / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.alive = true;
    ship.invincibleUntil = Date.now() + RESPAWN_INVINCIBLE_MS;
    fireCooldown = 0;
  }

  function spawnOrdinals(lvl: number): Ordinal[] {
    const count = Math.min(INITIAL_LARGE + (lvl - 1) * LARGE_PER_LEVEL, MAX_LARGE);
    const result: Ordinal[] = [];

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = Math.random() * GAME_W;
        y = PLAY_TOP + Math.random() * PLAY_H;
      } while (Math.abs(x - GAME_W / 2) < 60 && Math.abs(y - GAME_H / 2) < 60);

      const angle = Math.random() * Math.PI * 2;
      const speed = ORD_LARGE_SPEED_MIN + Math.random() * (ORD_LARGE_SPEED_MAX - ORD_LARGE_SPEED_MIN);

      result.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        size: "large",
        radius: ORD_LARGE_R,
        type: ORD_TYPES[Math.floor(Math.random() * ORD_TYPES.length)],
        colorVariant: Math.floor(Math.random() * 4),
      });
    }
    return result;
  }

  function splitOrdinal(parent: Ordinal): Ordinal[] {
    const nextSize: OrdinalSize = parent.size === "large" ? "medium" : "small";
    const nextRadius = nextSize === "medium" ? ORD_MEDIUM_R : ORD_SMALL_R;
    const [speedMin, speedMax] =
      nextSize === "medium"
        ? [ORD_MEDIUM_SPEED_MIN, ORD_MEDIUM_SPEED_MAX]
        : [ORD_SMALL_SPEED_MIN, ORD_SMALL_SPEED_MAX];

    return [0, 1].map((i) => {
      const baseAngle = Math.atan2(parent.vy, parent.vx) + (i === 0 ? 0.5 : -0.5);
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      return {
        x: parent.x,
        y: parent.y,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.07,
        size: nextSize,
        radius: nextRadius,
        type: parent.type,
        colorVariant: parent.colorVariant,
      };
    });
  }

  function resetSaucerTimer() {
    saucerTimer = SAUCER_INTERVAL_MIN + Math.random() * (SAUCER_INTERVAL_MAX - SAUCER_INTERVAL_MIN);
  }

  // --- Explosion particles ---
  function spawnExplosion(x: number, y: number, size: OrdinalSize) {
    const count = size === "large" ? 16 : size === "medium" ? 10 : 6;
    const colors = [C.orangeHot, C.yellowBright, C.gold, C.white, C.redHot];
    const maxSpeed = size === "large" ? 2.5 : size === "medium" ? 1.8 : 1.2;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = maxSpeed * (0.4 + Math.random() * 0.6);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 20 + Math.floor(Math.random() * 20),
        maxLife: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  // --- Fire bullet ---
  function fireBullet() {
    if (shipBullets.length >= BULLET_MAX || !ship.alive) return;
    shipBullets.push({
      x: ship.x + Math.cos(ship.angle) * 11,
      y: ship.y + Math.sin(ship.angle) * 11,
      vx: Math.cos(ship.angle) * BULLET_SPEED + ship.vx * 0.3,
      vy: Math.sin(ship.angle) * BULLET_SPEED + ship.vy * 0.3,
      life: BULLET_LIFETIME,
    });
    fireCooldown = FIRE_COOLDOWN;
    playShoot();
  }

  // --- Kill ship ---
  function killShip() {
    stopThrustSound();
    spawnExplosion(ship.x, ship.y, "large");
    playShipDestroy();
    ship.alive = false;
    lives--;

    if (lives <= 0) {
      respawnTimer = setTimeout(() => setState("gameOver"), 1500);
    } else {
      respawnTimer = setTimeout(() => {
        ship.x = GAME_W / 2;
        ship.y = GAME_H / 2 + HUD_H / 2;
        ship.vx = 0;
        ship.vy = 0;
        ship.angle = -Math.PI / 2;
        ship.alive = true;
        ship.invincibleUntil = Date.now() + RESPAWN_INVINCIBLE_MS;
      }, RESPAWN_DELAY_MS);
    }
  }

  // --- Saucer ---
  function spawnSaucer() {
    const fromLeft = Math.random() < 0.5;
    const isSmall = level >= 3 && Math.random() < 0.4;
    saucer = {
      x: fromLeft ? -15 : GAME_W + 15,
      y: PLAY_TOP + 20 + Math.random() * (PLAY_H - 40),
      vx: (fromLeft ? 1 : -1) * SAUCER_SPEED,
      vy: (Math.random() - 0.5) * SAUCER_SPEED * 0.5,
      isSmall,
      fireTimer: SAUCER_FIRE_INTERVAL,
    };
    playSaucerAlert();
  }

  function updateSaucer(dt: number) {
    if (!saucer) {
      saucerTimer -= dt;
      if (saucerTimer <= 0 && ordinals.length > 0) {
        spawnSaucer();
      }
      return;
    }

    saucer.x += saucer.vx;
    saucer.y += saucer.vy;

    if (saucer.y < PLAY_TOP + SAUCER_RADIUS || saucer.y > GAME_H - SAUCER_RADIUS) {
      saucer.vy *= -1;
    }

    // Off screen — destroy
    if (saucer.x < -30 || saucer.x > GAME_W + 30) {
      saucer = null;
      resetSaucerTimer();
      return;
    }

    // Fire at ship
    saucer.fireTimer -= dt;
    if (saucer.fireTimer <= 0 && ship.alive) {
      let angle: number;
      if (saucer.isSmall) {
        angle = Math.atan2(ship.y - saucer.y, ship.x - saucer.x);
        angle += (Math.random() - 0.5) * (Math.PI * 0.3 / Math.max(level, 1));
      } else {
        angle = Math.random() * Math.PI * 2;
      }
      saucerBullets.push({
        x: saucer.x,
        y: saucer.y,
        vx: Math.cos(angle) * BULLET_SPEED * 0.8,
        vy: Math.sin(angle) * BULLET_SPEED * 0.8,
        life: BULLET_LIFETIME,
      });
      gameTone(600, 0.04, 0.06);
      saucer.fireTimer = SAUCER_FIRE_INTERVAL;
    }

    // Ship bullet → saucer collision
    for (let i = shipBullets.length - 1; i >= 0; i--) {
      const b = shipBullets[i];
      if (circleCollide(b.x, b.y, 2, saucer.x, saucer.y, SAUCER_RADIUS)) {
        shipBullets.splice(i, 1);
        const pts = saucer.isSmall ? SCORE_SAUCER_SMALL : SCORE_SAUCER_LARGE;
        score += pts;
        spawnExplosion(saucer.x, saucer.y, "medium");
        playOrdinalDestroy("large");
        saucer = null;
        resetSaucerTimer();
        checkExtraLife();
        return;
      }
    }

    // Ship → saucer collision
    const invincible = Date.now() < ship.invincibleUntil;
    if (ship.alive && !invincible) {
      if (circleCollide(ship.x, ship.y, SHIP_RADIUS, saucer.x, saucer.y, SAUCER_RADIUS)) {
        spawnExplosion(saucer.x, saucer.y, "medium");
        saucer = null;
        resetSaucerTimer();
        killShip();
      }
    }
  }

  function checkExtraLife() {
    if (score >= nextExtraLifeScore) {
      lives++;
      nextExtraLifeScore += EXTRA_LIFE_SCORE;
      playExtraLife();
    }
  }

  // --- Update ---
  function update(dt: number) {
    if (state !== "playing") return;

    animFrame++;

    // Ship rotation — keyboard
    const rotateLeft = keys["ArrowLeft"] || keys["a"] || keys["A"];
    const rotateRight = keys["ArrowRight"] || keys["d"] || keys["D"];
    if (rotateLeft && ship.alive) ship.angle -= SHIP_TURN_SPEED;
    if (rotateRight && ship.alive) ship.angle += SHIP_TURN_SPEED;

    // Ship rotation — touch swipe overrides angle directly
    if (touchAiming && ship.alive) {
      ship.angle = touchAngle;
    }

    // Thrust
    const thrusting = (keys["ArrowUp"] || keys["w"] || keys["W"] || touchThrust) && ship.alive;
    if (thrusting) {
      ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
      ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
      startThrustSound();
    } else {
      stopThrustSound();
    }

    // Friction + speed cap
    ship.vx *= SHIP_FRICTION;
    ship.vy *= SHIP_FRICTION;
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    if (speed > SHIP_MAX_SPEED) {
      ship.vx = (ship.vx / speed) * SHIP_MAX_SPEED;
      ship.vy = (ship.vy / speed) * SHIP_MAX_SPEED;
    }

    // Move ship
    if (ship.alive) {
      ship.x = wrapX(ship.x + ship.vx);
      ship.y = wrapY(ship.y + ship.vy);
    }

    // Fire
    if ((keys[" "] || keys["z"] || keys["Z"]) && fireCooldown <= 0 && ship.alive) {
      fireBullet();
    }
    if (fireCooldown > 0) fireCooldown--;

    // Update ship bullets
    for (let i = shipBullets.length - 1; i >= 0; i--) {
      const b = shipBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 || b.x < 0 || b.x > GAME_W || b.y < 0 || b.y > GAME_H) shipBullets.splice(i, 1);
    }

    // Update saucer bullets
    for (let i = saucerBullets.length - 1; i >= 0; i--) {
      const b = saucerBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 || b.x < 0 || b.x > GAME_W || b.y < 0 || b.y > GAME_H) saucerBullets.splice(i, 1);
    }

    // Update ordinals
    for (const o of ordinals) {
      o.x = wrapX(o.x + o.vx);
      o.y = wrapY(o.y + o.vy);
      o.angle += o.spin;
    }

    // Bullet → ordinal collisions
    for (let bi = shipBullets.length - 1; bi >= 0; bi--) {
      const b = shipBullets[bi];
      let hit = false;
      for (let oi = ordinals.length - 1; oi >= 0; oi--) {
        const o = ordinals[oi];
        if (circleCollide(b.x, b.y, 2, o.x, o.y, o.radius)) {
          shipBullets.splice(bi, 1);
          const pts = o.size === "large" ? SCORE_LARGE : o.size === "medium" ? SCORE_MEDIUM : SCORE_SMALL;
          score += pts;
          spawnExplosion(o.x, o.y, o.size);
          playOrdinalDestroy(o.size);

          if (o.size !== "small") {
            const fragments = splitOrdinal(o);
            ordinals.splice(oi, 1);
            ordinals.push(...fragments);
          } else {
            ordinals.splice(oi, 1);
          }

          checkExtraLife();
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }

    // Saucer bullet → ship collision
    const invincible = Date.now() < ship.invincibleUntil;
    if (ship.alive && !invincible) {
      for (let i = saucerBullets.length - 1; i >= 0; i--) {
        const b = saucerBullets[i];
        if (circleCollide(b.x, b.y, 2, ship.x, ship.y, SHIP_RADIUS)) {
          saucerBullets.splice(i, 1);
          killShip();
          break;
        }
      }
    }

    // Ship → ordinal collision
    if (ship.alive && !invincible) {
      for (const o of ordinals) {
        if (circleCollide(ship.x, ship.y, SHIP_RADIUS, o.x, o.y, o.radius)) {
          killShip();
          break;
        }
      }
    }

    // Saucer
    updateSaucer(dt);

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Heartbeat thump — speeds up as fewer ordinals remain
    if (ordinals.length > 0) {
      const thumpInterval = Math.max(15, 60 - ordinals.length * 3);
      thumpCounter++;
      if (thumpCounter >= thumpInterval) {
        thumpCounter = 0;
        if (thumpToggle) playThumpLow();
        else playThumpHigh();
        thumpToggle = !thumpToggle;
      }
    }

    // Level clear
    if (ordinals.length === 0 && !saucer) {
      setState("levelClear");
      playCelebration();
      levelClearTimer = setTimeout(() => {
        level++;
        initLevel();
        setState("playing");
      }, 2500);
    }
  }

  // --- Draw helpers ---
  function drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    size: number,
    align: CanvasTextAlign = "center",
  ) {
    ctx.fillStyle = color;
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
  }

  function drawStars() {
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.fillStyle = C.white;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawShipGfx(thrusting: boolean) {
    if (!ship.alive) return;
    const inv = Date.now() < ship.invincibleUntil;
    if (inv && Math.floor(animFrame / 4) % 2 === 0) return;

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Ship body
    ctx.fillStyle = C.orangeLit;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = C.yellowBright;
    ctx.fillRect(4, -1, 3, 2);

    // Thrust flame
    if (thrusting && Math.floor(animFrame / 3) % 2 === 0) {
      ctx.fillStyle = C.goldLit;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-7, -3);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-6, -1);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-6, 1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBulletGfx(b: Bullet, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
    ctx.fillStyle = C.white;
    ctx.fillRect(b.x, b.y, 1, 1);
  }

  function drawSaucerGfx() {
    if (!saucer) return;
    const s = saucer;

    ctx.fillStyle = C.midgray;
    ctx.fillRect(s.x - 10, s.y - 3, 20, 6);
    ctx.fillRect(s.x - 5, s.y - 6, 10, 3);

    ctx.fillStyle = C.lightgray;
    ctx.fillRect(s.x - 3, s.y - 6, 5, 2);

    ctx.fillStyle = C.cyanLit;
    ctx.fillRect(s.x - 7, s.y - 2, 3, 3);
    ctx.fillRect(s.x + 5, s.y - 2, 3, 3);

    if (!s.isSmall) {
      ctx.fillStyle = C.redHot;
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CEX", s.x, s.y + 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sz = Math.max(1, Math.floor(alpha * 3));
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    // Score
    drawText(`${score}`, 4, 3, C.bright, 7, "left");

    // Level
    drawText(`LV ${level}`, GAME_W / 2, 3, C.bright, 7, "center");

    // Lives as mini ship icons
    for (let i = 0; i < Math.min(lives, 6); i++) {
      const lx = GAME_W - 12 - i * 11;
      const ly = HUD_H / 2;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = C.orangeLit;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, -3);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // HUD separator
    ctx.fillStyle = C.darkgray;
    ctx.fillRect(0, HUD_H - 1, GAME_W, 1);
  }

  function drawTitle() {
    drawStars();

    // Demo ordinals
    for (const d of demoOrdinals) {
      drawOrdinalSprite(ctx, d.x, d.y, d.baseAngle + animFrame * 0.01, "large", d.type, d.v);
    }

    // Title — gradient band
    const titleSize = 14;
    const titleY = 16;
    const bandColors = [C.orangeHot, C.gold, C.yellowBright, C.yellowBright, C.gold, C.orangeHot];
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const totalH = titleSize + 4;
    const bandH = totalH / bandColors.length;
    for (let i = 0; i < bandColors.length; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, titleY + i * bandH, GAME_W, bandH);
      ctx.clip();
      ctx.fillStyle = bandColors[i];
      ctx.fillText("ASTERORDINALS", GAME_W / 2, titleY);
      ctx.restore();
    }
    ctx.textBaseline = "alphabetic";

    drawText("OBLITERATE THE JPEGS", GAME_W / 2, 42, C.midgray, 7, "center");

    const blink = Math.floor(animFrame / 30) % 2 === 0;
    if (blink) {
      drawText("PRESS START", GAME_W / 2, 115, C.yellow, 10, "center");
    }

    const hasTouch = "ontouchstart" in window;
    if (hasTouch) {
      drawText("SWIPE: THRUST", GAME_W / 2, 205, C.darkgray, 9, "center");
      drawText("TAP: FIRE", GAME_W / 2, 222, C.darkgray, 9, "center");
    } else {
      drawText("ARROWS: ROTATE + THRUST", GAME_W / 2, 205, C.darkgray, 9, "center");
      drawText("SPACE: FIRE", GAME_W / 2, 222, C.darkgray, 9, "center");
    }
  }

  function drawGameOver() {
    drawStars();

    drawText("GAME OVER", GAME_W / 2, 70, C.redHot, 16, "center");
    drawText(`SCORE: ${score}`, GAME_W / 2, 110, C.bright, 10, "center");
    drawText(`LEVEL: ${level}`, GAME_W / 2, 135, C.lightgray, 10, "center");

    const blink = Math.floor(animFrame / 30) % 2 === 0;
    if (blink) {
      drawText("PRESS START", GAME_W / 2, 180, C.yellow, 10, "center");
    }
  }

  // --- Main draw ---
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

    drawStars();
    drawHud();

    // Ordinals
    for (const o of ordinals) {
      drawOrdinalSprite(ctx, o.x, o.y, o.angle, o.size, o.type, o.colorVariant);
    }

    // Particles
    drawParticles();

    // Ship bullets
    for (const b of shipBullets) drawBulletGfx(b, C.yellowBright);
    // Saucer bullets (red)
    for (const b of saucerBullets) drawBulletGfx(b, C.redLit);

    // Saucer
    drawSaucerGfx();

    // Ship
    const thrusting = (keys["ArrowUp"] || keys["w"] || keys["W"] || touchThrust) && ship.alive;
    drawShipGfx(thrusting);

    // Touch thrust direction indicator
    if (state === "playing" && touchThrust && touchAiming) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(
        ship.x + Math.cos(touchAngle) * 30,
        ship.y + Math.sin(touchAngle) * 30
      );
      ctx.stroke();
      ctx.restore();
    }

    // Level clear overlay
    if (state === "levelClear") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      const clearTitles = ["LFG!", "PUMP IT UP!", "TO THE MOON!", "WAGMI!", "HODL!", "YOLO!", "BTFD!", "FUNDS ARE SAFU!", "WEN LAMBO?"];
      const title = clearTitles[Math.min(level - 1, clearTitles.length - 1)] || clearTitles[clearTitles.length - 1];
      drawText(title, GAME_W / 2, GAME_H / 2 - 16, C.yellowBright, 14, "center");
      drawText(`LEVEL ${level} CLEARED`, GAME_W / 2, GAME_H / 2 + 10, C.bright, 9, "center");
    }

    // Pause overlay
    if (state === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      drawText("PAUSED", GAME_W / 2, GAME_H / 2 - 8, C.bright, 14, "center");
    }
  }

  // --- Input handlers ---
  function onKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;

    if (state === "title" || state === "gate") {
      if (e.key === "Enter" || e.key === " ") {
        tryStart();
      }
    } else if (state === "gameOver") {
      if (e.key === "Enter" || e.key === " ") {
        tryStart();
      }
    } else if (state === "playing") {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        pauseStart = Date.now();
        setState("paused");
      }
    } else if (state === "paused") {
      if (e.key === "Escape" || e.key === "p" || e.key === "P" || e.key === "Enter" || e.key === " ") {
        const d = Date.now() - pauseStart;
        if (ship.invincibleUntil > 0) ship.invincibleUntil += d;
        saucerTimer += d;
        setState("playing");
      }
    }

    // Dev mode: number keys jump levels
    if (devMode && state === "playing" && e.key >= "1" && e.key <= "9") {
      level = parseInt(e.key);
      initLevel();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

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
    nextExtraLifeScore = EXTRA_LIFE_SCORE;
    initLevel();
    playGameStart();
    setState("playing");
  }

  // --- Touch handlers ---
  function getTouchPos(touch: Touch): { tx: number; ty: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    const scaleY = GAME_H / rect.height;
    return {
      tx: (touch.clientX - rect.left) * scaleX,
      ty: (touch.clientY - rect.top) * scaleY,
    };
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();

    if (state === "title" || state === "gate" || state === "gameOver") {
      tryStart();
      return;
    }

    if (state === "paused") {
      const d = Date.now() - pauseStart;
      if (ship.invincibleUntil > 0) ship.invincibleUntil += d;
      saucerTimer += d;
      setState("playing");
      return;
    }

    // Record start position for each new touch
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const { tx, ty } = getTouchPos(t);
      touchStarts.set(t.identifier, { x: tx, y: ty, time: Date.now() });
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (state !== "playing") return;

    // Check all active touches for swipe gestures
    let swiping = false;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      const start = touchStarts.get(t.identifier);
      if (!start) continue;

      const { tx, ty } = getTouchPos(t);
      const dx = tx - start.x;
      const dy = ty - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > TAP_MAX_DIST) {
        // Swipe detected — set angle and thrust
        touchAngle = Math.atan2(dy, dx);
        touchAiming = true;
        touchThrust = true;
        swiping = true;
      }
    }

    if (!swiping) {
      touchThrust = false;
      touchAiming = false;
    }
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const start = touchStarts.get(t.identifier);
      touchStarts.delete(t.identifier);

      if (!start) continue;

      // Check if this was a tap (short + small movement)
      const { tx, ty } = getTouchPos(t);
      const dx = tx - start.x;
      const dy = ty - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - start.time;

      if (dist <= TAP_MAX_DIST && elapsed <= TAP_MAX_TIME) {
        // Tap = fire
        if (state === "playing" && fireCooldown <= 0 && ship.alive) {
          fireBullet();
        }
      }
    }

    // If no touches remain, stop thrusting
    if (e.touches.length === 0) {
      touchThrust = false;
      touchAiming = false;
    } else {
      // Re-evaluate remaining touches
      let stillSwiping = false;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const start = touchStarts.get(t.identifier);
        if (!start) continue;
        const { tx, ty } = getTouchPos(t);
        const dx = tx - start.x;
        const dy = ty - start.y;
        if (Math.sqrt(dx * dx + dy * dy) > TAP_MAX_DIST) {
          stillSwiping = true;
          touchAngle = Math.atan2(dy, dx);
        }
      }
      if (!stillSwiping) {
        touchThrust = false;
        touchAiming = false;
      }
    }
  }

  function onMouseClick(_e: MouseEvent) {
    if (state === "title" || state === "gate" || state === "gameOver") {
      tryStart();
      return;
    }
    if (state === "playing" && fireCooldown <= 0 && ship.alive) {
      // Click to fire
      fireBullet();
    }
  }

  // --- Game loop ---
  function gameLoop(timestamp: number) {
    const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16.67;
    lastTime = timestamp;

    animFrame++;
    update(dt);
    draw();
    rafId = requestAnimationFrame(gameLoop);
  }

  // --- Public API ---
  function start() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("click", onMouseClick);

    setState("title");
    lastTime = 0;
    rafId = requestAnimationFrame(gameLoop);
  }

  function stop() {
    stopThrustSound();
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (levelClearTimer !== null) clearTimeout(levelClearTimer);
    if (respawnTimer !== null) clearTimeout(respawnTimer);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
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
        const d = Date.now() - pauseStart;
        if (ship.invincibleUntil > 0) ship.invincibleUntil += d;
        saucerTimer += d;
        setState("playing");
      }
    },
    getState: () => state,
    getScore: () => score,
    getLevel: () => level,
    getLives: () => lives,
  };
}
