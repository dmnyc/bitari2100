/**
 * POW-MAN — Pac-Man inspired game with Bitcoin/mining theme.
 *
 * POW-MAN (₿ symbol) navigates a maze eating lightning bolts (electricity),
 * chased by 4 Wojak ghosts. Power pellets are "halvings" that make ghosts
 * vulnerable. Eat all dots to clear the level.
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
  red: "#b03c3c",
  redLit: "#c05858",
  redHot: "#e06060",
  yellow: "#a0a034",
  yellowLit: "#b8b84c",
  yellowBright: "#d0d060",
  purple: "#4c2080",
  purpleLit: "#6c3ca0",
  cyan: "#00a0a0",
  cyanLit: "#20c0c0",
  pink: "#b04878",
  pinkLit: "#d068a0",
  gold: "#c8a020",
  goldLit: "#e8c040",
};

// --- Game constants ---
const GAME_W = 336;
const GAME_H = 280;
const TILE = 12;

// Maze dimensions in tiles (must fit in canvas with HUD)
const MAZE_COLS = 28;
const MAZE_ROWS = 22;
const MAZE_X = 0; // flush left — 28*12=336 fills width exactly
const MAZE_Y = 16; // leave room for HUD at top

const LIVES_INITIAL = 3;
const EXTRA_LIFE_SCORE = 10000;
// Power duration now varies by level — see FRIGHT_DURATIONS
const GHOST_PEN_RELEASE_INTERVAL = 3000; // ms between ghost releases
const BONUS_SPAWN_DOTS_1 = 70; // first bonus
const BONUS_SPAWN_DOTS_2 = 170; // second bonus

// Bonus items per level (index 0 = level 1, repeats last for higher levels)
interface BonusItem {
  name: string;
  points: number;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
}

const BONUS_ITEMS: BonusItem[] = [
  {
    // Level 1: Coffee — mug with steam
    name: "COFFEE",
    points: 100,
    draw: (ctx, x, y) => {
      // Steam wisps
      ctx.fillStyle = C.lightgray;
      ctx.fillRect(x + 3, y + 0, 1, 1);
      ctx.fillRect(x + 5, y + 1, 1, 1);
      ctx.fillRect(x + 7, y + 0, 1, 1);
      // Mug body
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 2, y + 3, 7, 7);
      // Coffee fill
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(x + 3, y + 4, 5, 5);
      // Handle
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 9, y + 4, 2, 1);
      ctx.fillRect(x + 10, y + 5, 1, 2);
      ctx.fillRect(x + 9, y + 7, 2, 1);
      // Rim
      ctx.fillRect(x + 2, y + 2, 7, 1);
    },
  },
  {
    // Level 2: Socks — single sock shape, clearly recognizable
    name: "SOCKS",
    points: 200,
    draw: (ctx, x, y) => {
      // Sock leg
      ctx.fillStyle = C.redLit;
      ctx.fillRect(x + 4, y + 0, 4, 7);
      // Foot (extends right)
      ctx.fillRect(x + 4, y + 7, 7, 3);
      // Toe cap
      ctx.fillRect(x + 9, y + 6, 2, 1);
      // Cuff stripe
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 4, y + 0, 4, 2);
      // Heel
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 4, y + 7, 2, 2);
    },
  },
  {
    // Level 3: Book — open book, orange cover
    name: "T.B.S.",
    points: 300,
    draw: (ctx, x, y) => {
      // Left page
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 1, y + 2, 5, 8);
      // Right page
      ctx.fillRect(x + 6, y + 2, 5, 8);
      // Spine
      ctx.fillStyle = C.orangeHot;
      ctx.fillRect(x + 5, y + 1, 2, 10);
      // Cover edges
      ctx.fillRect(x + 0, y + 2, 1, 8);
      ctx.fillRect(x + 11, y + 2, 1, 8);
      // Text lines on left page
      ctx.fillStyle = C.midgray;
      ctx.fillRect(x + 2, y + 4, 3, 1);
      ctx.fillRect(x + 2, y + 6, 3, 1);
      ctx.fillRect(x + 2, y + 8, 2, 1);
      // Text lines on right page
      ctx.fillRect(x + 7, y + 4, 3, 1);
      ctx.fillRect(x + 7, y + 6, 3, 1);
    },
  },
  {
    // Level 4: Egg — fried egg, sunny side up
    name: "EGG",
    points: 500,
    draw: (ctx, x, y) => {
      // White (irregular blob)
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 2, y + 1, 8, 2);
      ctx.fillRect(x + 1, y + 3, 10, 6);
      ctx.fillRect(x + 2, y + 9, 8, 2);
      // Yolk
      ctx.fillStyle = C.goldLit;
      ctx.fillRect(x + 4, y + 4, 4, 4);
      // Yolk highlight
      ctx.fillStyle = C.yellowBright;
      ctx.fillRect(x + 5, y + 4, 2, 2);
    },
  },
  {
    // Level 5: Steak — thick cut with fat rim and marbling
    name: "STEAK",
    points: 700,
    draw: (ctx, x, y) => {
      // Black outline / shadow
      ctx.fillStyle = C.black;
      ctx.fillRect(x + 3, y + 0, 7, 1);
      ctx.fillRect(x + 1, y + 1, 2, 1);
      ctx.fillRect(x + 10, y + 1, 2, 1);
      ctx.fillRect(x + 0, y + 2, 1, 7);
      ctx.fillRect(x + 11, y + 2, 1, 6);
      ctx.fillRect(x + 1, y + 9, 2, 1);
      ctx.fillRect(x + 9, y + 8, 2, 1);
      ctx.fillRect(x + 3, y + 10, 6, 1);
      // Fat rim (top edge, pinkish-tan)
      ctx.fillStyle = "#e8b8a0";
      ctx.fillRect(x + 3, y + 1, 7, 2);
      ctx.fillRect(x + 1, y + 2, 2, 1);
      ctx.fillRect(x + 10, y + 2, 1, 1);
      // Main meat body (deep red)
      ctx.fillStyle = "#c01820";
      ctx.fillRect(x + 1, y + 3, 10, 5);
      ctx.fillRect(x + 3, y + 8, 6, 2);
      ctx.fillRect(x + 1, y + 8, 2, 1);
      ctx.fillRect(x + 9, y + 7, 2, 1);
      // Lighter red marbling
      ctx.fillStyle = "#e83838";
      ctx.fillRect(x + 2, y + 4, 3, 1);
      ctx.fillRect(x + 7, y + 5, 2, 1);
      ctx.fillRect(x + 3, y + 7, 2, 1);
      // White fat streak
      ctx.fillStyle = "#f0d0c0";
      ctx.fillRect(x + 5, y + 5, 2, 1);
      // Bone nub (bottom, white)
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 4, y + 9, 1, 1);
    },
  },
  {
    // Level 6: Dumbbells — barbell, horizontal
    name: "WEIGHTS",
    points: 1000,
    draw: (ctx, x, y) => {
      // Bar
      ctx.fillStyle = C.bright;
      ctx.fillRect(x + 2, y + 5, 8, 2);
      // Left weight plates
      ctx.fillStyle = C.midgray;
      ctx.fillRect(x + 0, y + 2, 3, 8);
      ctx.fillStyle = C.lightgray;
      ctx.fillRect(x + 0, y + 2, 1, 8);
      // Right weight plates
      ctx.fillStyle = C.midgray;
      ctx.fillRect(x + 9, y + 2, 3, 8);
      ctx.fillStyle = C.lightgray;
      ctx.fillRect(x + 9, y + 2, 1, 8);
    },
  },
  {
    // Level 7: Diamond — gem with black outline, cyan facets
    name: "DIAMOND",
    points: 2000,
    draw: (ctx, x, y) => {
      // Black outline
      ctx.fillStyle = C.black;
      ctx.fillRect(x + 3, y + 0, 6, 1);
      ctx.fillRect(x + 2, y + 1, 1, 1);
      ctx.fillRect(x + 9, y + 1, 1, 1);
      ctx.fillRect(x + 1, y + 2, 1, 1);
      ctx.fillRect(x + 10, y + 2, 1, 1);
      ctx.fillRect(x + 0, y + 3, 1, 2);
      ctx.fillRect(x + 11, y + 3, 1, 2);
      ctx.fillRect(x + 1, y + 5, 1, 1);
      ctx.fillRect(x + 10, y + 5, 1, 1);
      ctx.fillRect(x + 2, y + 6, 1, 1);
      ctx.fillRect(x + 9, y + 6, 1, 1);
      ctx.fillRect(x + 3, y + 7, 1, 1);
      ctx.fillRect(x + 8, y + 7, 1, 1);
      ctx.fillRect(x + 4, y + 8, 1, 1);
      ctx.fillRect(x + 7, y + 8, 1, 1);
      ctx.fillRect(x + 5, y + 9, 2, 1);
      // Crown (flat top, darker teal)
      ctx.fillStyle = "#00a0a0";
      ctx.fillRect(x + 3, y + 1, 6, 1);
      ctx.fillRect(x + 2, y + 2, 8, 1);
      // Cross line at girdle
      ctx.fillStyle = "#00c8c8";
      ctx.fillRect(x + 5, y + 1, 2, 1);
      // Main body (bright cyan)
      ctx.fillStyle = "#00d8e8";
      ctx.fillRect(x + 1, y + 3, 10, 2);
      // Lower facets taper
      ctx.fillStyle = "#00b8d0";
      ctx.fillRect(x + 2, y + 5, 8, 1);
      ctx.fillRect(x + 3, y + 6, 6, 1);
      ctx.fillRect(x + 4, y + 7, 4, 1);
      ctx.fillRect(x + 5, y + 8, 2, 1);
      // Bright highlight (upper left facet)
      ctx.fillStyle = "#80f0ff";
      ctx.fillRect(x + 2, y + 3, 3, 1);
      ctx.fillRect(x + 1, y + 4, 2, 1);
      // White sparkle
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 3, y + 2, 1, 1);
    },
  },
  {
    // Level 8: Lightning bolt — orange/yellow gradient zigzag
    name: "ZAPATHON",
    points: 3000,
    draw: (ctx, x, y) => {
      // Orange outer layer
      ctx.fillStyle = "#e07000";
      // Top point angled right
      ctx.fillRect(x + 6, y + 0, 3, 1);
      ctx.fillRect(x + 5, y + 1, 3, 1);
      ctx.fillRect(x + 4, y + 2, 3, 1);
      // Jag left — wide bar
      ctx.fillRect(x + 2, y + 3, 5, 1);
      ctx.fillRect(x + 2, y + 4, 6, 1);
      // Jag right
      ctx.fillRect(x + 5, y + 5, 4, 1);
      ctx.fillRect(x + 4, y + 6, 4, 1);
      // Jag left again
      ctx.fillRect(x + 3, y + 7, 4, 1);
      ctx.fillRect(x + 3, y + 8, 3, 1);
      // Bottom point
      ctx.fillRect(x + 2, y + 9, 3, 1);
      ctx.fillRect(x + 2, y + 10, 2, 1);
      // Yellow middle layer
      ctx.fillStyle = "#f0b000";
      ctx.fillRect(x + 6, y + 1, 2, 1);
      ctx.fillRect(x + 5, y + 2, 2, 1);
      ctx.fillRect(x + 3, y + 3, 4, 1);
      ctx.fillRect(x + 3, y + 4, 4, 1);
      ctx.fillRect(x + 5, y + 5, 3, 1);
      ctx.fillRect(x + 5, y + 6, 2, 1);
      ctx.fillRect(x + 4, y + 7, 2, 1);
      ctx.fillRect(x + 3, y + 8, 2, 1);
      ctx.fillRect(x + 3, y + 9, 1, 1);
      // Hot white/yellow core
      ctx.fillStyle = "#ffe060";
      ctx.fillRect(x + 4, y + 3, 2, 1);
      ctx.fillRect(x + 6, y + 5, 1, 1);
      ctx.fillRect(x + 4, y + 7, 1, 1);
    },
  },
  {
    // Level 9+: Moon — crescent with craters
    name: "MOON",
    points: 5000,
    draw: (ctx, x, y) => {
      // Full disc (rounder — 12x12)
      ctx.fillStyle = C.goldLit;
      ctx.fillRect(x + 3, y + 0, 6, 1);
      ctx.fillRect(x + 2, y + 1, 8, 1);
      ctx.fillRect(x + 1, y + 2, 10, 2);
      ctx.fillRect(x + 0, y + 4, 12, 4);
      ctx.fillRect(x + 1, y + 8, 10, 2);
      ctx.fillRect(x + 2, y + 10, 8, 1);
      ctx.fillRect(x + 3, y + 11, 6, 1);
      // Shadow cutout (right side, deeper and rounder)
      ctx.fillStyle = C.black;
      ctx.fillRect(x + 7, y + 1, 3, 1);
      ctx.fillRect(x + 6, y + 2, 5, 2);
      ctx.fillRect(x + 7, y + 4, 5, 4);
      ctx.fillRect(x + 6, y + 8, 5, 2);
      ctx.fillRect(x + 7, y + 10, 3, 1);
      // Craters (dark spots on lit surface)
      ctx.fillStyle = C.gold;
      ctx.fillRect(x + 2, y + 3, 2, 2);
      ctx.fillRect(x + 4, y + 7, 1, 1);
      ctx.fillRect(x + 1, y + 6, 1, 1);
      // Bright highlight
      ctx.fillStyle = C.yellowBright;
      ctx.fillRect(x + 3, y + 1, 2, 1);
      ctx.fillRect(x + 1, y + 4, 1, 2);
    },
  },
];

// Movement speeds (pixels per frame at 60fps)
const PLAYER_SPEED = 0.7;
const GHOST_SPEED = 0.55;
const GHOST_SPEED_FRIGHTENED = 0.5;
const GHOST_SPEED_EATEN = 1.5;
const GHOST_SPEED_TUNNEL = 0.4; // ghosts slow down in tunnels
const SPEED_INCREMENT = 0.18; // per level

// Tunnel rows (E at cols 0 and 27)
const TUNNEL_ROWS = [4, 12];

// Scatter/chase cycle durations per level bracket (ms)
// [scatterDuration, chaseDuration]
const MODE_TIMINGS: [number, number][] = [
  [7000, 20000], // levels 1-2
  [5000, 20000], // levels 3-4
  [3000, 20000], // levels 5+
];

// Frightened duration per level (ms) — decreases, then 0 (no blue)
const FRIGHT_DURATIONS = [8000, 6000, 4000, 3000, 2000, 2000, 1000, 1000, 0];

// Cruise Elroy thresholds: HATEY speeds up when dots remaining drops below these
const ELROY1_DOTS = 20; // first speedup
const ELROY2_DOTS = 10; // second speedup
const ELROY_SPEED_BOOST1 = 0.15;
const ELROY_SPEED_BOOST2 = 0.3;

// Directions
const DIR = {
  NONE: { dx: 0, dy: 0 },
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
} as const;
type Direction = (typeof DIR)[keyof typeof DIR];

const DIRS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

// Tile types
const W = 1; // wall
const D = 2; // dot
const P = 3; // power pellet
const E = 0; // empty
const G = 4; // ghost door
const N = 5; // ghost pen (no dot, not wall)

// Classic-style maze — purple outline walls, centered ghost pen, symmetric layout
// 22 rows x 28 cols — W=wall D=dot P=power E=empty G=ghost-door N=pen
// Flipped 180° from classic orientation: player at top, pen in lower half
// prettier-ignore
const MAZE_TEMPLATE: number[][] = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // 0
  [W, P, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, P, W], // 1
  [W, D, W, W, W, D, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, D, W, W, W, D, W], // 2
  [W, D, W, W, W, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, W, W, W, D, W], // 3
  [E, D, D, D, D, D, W, W, D, W, W, W, D, D, D, D, W, W, W, D, W, W, D, D, D, D, D, E], // 4   tunnel
  [W, D, W, W, W, D, W, W, D, D, D, D, D, W, W, D, D, D, D, D, W, W, D, W, W, W, D, W], // 5
  [W, D, D, D, W, D, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, D, W, D, D, D, W], // 6
  [W, W, W, D, W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W, D, W, W, W], // 7
  [W, D, D, D, D, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, D, D, D, D, W], // 8
  [W, D, W, W, W, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, W, W, W, D, W], // 9
  [W, D, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, D, W], // 10
  [W, D, D, D, D, D, W, W, D, W, W, W, N, N, N, N, W, W, W, D, W, W, D, D, D, D, D, W], // 11  pen
  [E, D, W, W, W, D, D, D, D, W, W, W, N, N, N, N, W, W, W, D, D, D, D, W, W, W, D, E], // 12  tunnel + pen
  [W, D, W, W, W, D, W, W, D, W, W, W, W, G, G, W, W, W, W, D, W, W, D, W, W, W, D, W], // 13  ghost door
  [W, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, W], // 14
  [W, D, W, W, W, D, W, W, D, W, W, W, W, W, W, W, W, W, W, D, W, W, D, W, W, W, D, W], // 15
  [W, D, D, D, D, D, W, W, D, D, D, D, D, W, W, D, D, D, D, D, W, W, D, D, D, D, D, W], // 16
  [W, W, W, D, W, D, W, W, W, W, W, W, D, W, W, D, W, W, W, W, W, W, D, W, D, W, W, W], // 17
  [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W], // 18
  [W, P, W, W, W, D, W, W, W, W, W, W, D, D, D, D, W, W, W, W, W, W, D, W, W, W, P, W], // 19
  [W, D, D, D, D, D, D, D, D, D, D, D, D, W, W, D, D, D, D, D, D, D, D, D, D, D, D, W], // 20
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // 21
];

// Player start position (tile coords) — above the ghost pen
const PLAYER_START = { col: 14, row: 7 };

// Ghost start positions and scatter targets
interface GhostDef {
  name: string;
  color: string;
  startCol: number;
  startRow: number;
  scatterCol: number;
  scatterRow: number;
  penDelay: number; // ms before leaving pen
}

const GHOST_DEFS: GhostDef[] = [
  {
    name: "HATEY",
    color: C.redLit,
    startCol: 14,
    startRow: 11, // starts in pen, exits first
    scatterCol: 25,
    scatterRow: 0,
    penDelay: 500,
  },
  {
    name: "FUDDY",
    color: C.pinkLit,
    startCol: 13,
    startRow: 11,
    scatterCol: 2,
    scatterRow: 0,
    penDelay: GHOST_PEN_RELEASE_INTERVAL,
  },
  {
    name: "SCAMMY",
    color: C.cyanLit,
    startCol: 14,
    startRow: 11,
    scatterCol: 27,
    scatterRow: 21,
    penDelay: GHOST_PEN_RELEASE_INTERVAL * 2,
  },
  {
    name: "PETER",
    color: C.greenLit,
    startCol: 13,
    startRow: 12,
    scatterCol: 0,
    scatterRow: 21,
    penDelay: GHOST_PEN_RELEASE_INTERVAL * 3,
  },
];

type GhostMode = "scatter" | "chase" | "frightened" | "eaten";

interface Ghost {
  x: number;
  y: number;
  col: number;
  row: number;
  dir: Direction;
  mode: GhostMode;
  prevMode: GhostMode; // mode before frightened
  def: GhostDef;
  inPen: boolean;
  leavingPen: boolean; // walking out through the door
  penTimer: number;
  speed: number;
}

export type GameState =
  | "title"
  | "gate"
  | "ready"
  | "playing"
  | "paused"
  | "dying"
  | "levelClear"
  | "gameOver";

export interface PowManGame {
  start: () => void;
  stop: () => void;
  beginGame: () => void;
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

let wakaToggle = false;
function playWaka() {
  wakaToggle = !wakaToggle;
  gameTone(wakaToggle ? 260 : 330, 0.06, 0.08);
}

function playEatGhost() {
  gameTone(300, 0.06, 0.12);
  setTimeout(() => gameTone(500, 0.06, 0.12), 70);
  setTimeout(() => gameTone(700, 0.1, 0.15), 140);
}

function playDeath() {
  gameTone(400, 0.15, 0.12);
  setTimeout(() => gameTone(300, 0.15, 0.1), 160);
  setTimeout(() => gameTone(200, 0.2, 0.1), 320);
  setTimeout(() => gameTone(120, 0.3, 0.08), 480);
}

function playPowerPellet() {
  gameTone(200, 0.1, 0.12);
  setTimeout(() => gameTone(400, 0.1, 0.12), 100);
  setTimeout(() => gameTone(600, 0.15, 0.15), 200);
}

function playLevelClear() {
  playCelebration();
}

function playBonusPickup() {
  // Ta-da! Two quick grace notes then a held high note
  gameTone(440, 0.06, 0.1);
  setTimeout(() => gameTone(554, 0.06, 0.1), 70);
  setTimeout(() => gameTone(880, 0.25, 0.15), 150);
}

function playComboChime() {
  // Triumphant ascending arpeggio for eating all 4 ghosts
  gameTone(400, 0.08, 0.12);
  setTimeout(() => gameTone(500, 0.08, 0.12), 80);
  setTimeout(() => gameTone(600, 0.08, 0.12), 160);
  setTimeout(() => gameTone(800, 0.08, 0.15), 240);
  setTimeout(() => gameTone(1000, 0.15, 0.15), 320);
  setTimeout(() => gameTone(1200, 0.25, 0.12), 440);
}

// --- Main game factory ---
export function createPowMan(
  canvas: HTMLCanvasElement,
  onStateChange?: (state: GameState) => void,
  gated = true,
): PowManGame {
  const ctx = canvas.getContext("2d")!;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  let state: GameState = "title";
  let score = 0;
  let level = 1;
  let lives = LIVES_INITIAL;
  let extraLifeAwarded = false;
  let animFrame = 0;
  let rafId: number | null = null;
  let levelClearTimer: ReturnType<typeof setTimeout> | null = null;
  let dyingTimer: ReturnType<typeof setTimeout> | null = null;
  let readyTimer: ReturnType<typeof setTimeout> | null = null;
  let dyingStart = 0;
  let pauseStart = 0; // wall-clock time when paused
  let pauseShowBonus = false; // show bonus key screen while paused

  // Maze state (mutable copy of template)
  let maze: number[][] = [];
  let totalDots = 0;
  let dotsEaten = 0;

  // Player state
  let px = 0,
    py = 0; // pixel position
  let pCol = 0,
    pRow = 0; // tile position
  let pDir: Direction = DIR.NONE;
  let pNextDir: Direction = DIR.NONE;
  let mouthOpen = true;
  let mouthTimer = 0;

  // Ghost state
  let ghosts: Ghost[] = [];
  let powerEndTime = 0;
  let ghostsEatenCombo = 0; // for scoring: 200, 400, 800, 1600
  let globalMode: "scatter" | "chase" = "scatter";
  let modeStartTime = 0;

  // Dev sprite preview
  let showSpritePreview = false;

  // Bonus
  let bonusActive = false;
  let bonusTimer = 0;
  let bonusCol = 14;
  let bonusRow = 9;
  let bonusScorePopup = 0; // frames remaining for score popup
  let bonusScoreValue = 0; // points to display

  // Floating score popups (ghost eats, etc.)
  interface ScorePopup {
    x: number;
    y: number;
    value: number;
    timer: number;
  }
  let scorePopups: ScorePopup[] = [];

  function getBonusItem(): BonusItem {
    const idx = Math.min(level - 1, BONUS_ITEMS.length - 1);
    return BONUS_ITEMS[idx];
  }

  // Input
  const keys: Record<string, boolean> = {};
  let swipeStartX = 0,
    swipeStartY = 0;

  function setState(s: GameState) {
    state = s;
    onStateChange?.(s);
  }

  // --- Maze helpers ---
  function initMaze() {
    maze = MAZE_TEMPLATE.map((row) => [...row]);
    totalDots = 0;
    dotsEaten = 0;
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        if (maze[r][c] === D || maze[r][c] === P) totalDots++;
      }
    }
  }

  function isWall(col: number, row: number): boolean {
    if (row < 0 || row >= MAZE_ROWS) return true;
    // Tunnel wrap
    if (col < 0 || col >= MAZE_COLS) return false;
    const t = maze[row][col];
    return t === W;
  }

  function isGhostDoor(col: number, row: number): boolean {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS)
      return false;
    return maze[row][col] === G;
  }

  function canMove(col: number, row: number, ghostMode?: GhostMode): boolean {
    if (row < 0 || row >= MAZE_ROWS) return false;
    // Tunnel
    if (col < 0 || col >= MAZE_COLS) return true;
    const t = maze[row][col];
    if (t === W) return false;
    if (t === G) {
      // Only eaten ghosts can path through the door
      return ghostMode === "eaten";
    }
    return true;
  }

  function wrapCol(col: number): number {
    if (col < 0) return MAZE_COLS - 1;
    if (col >= MAZE_COLS) return 0;
    return col;
  }

  // --- Player ---
  function initPlayer() {
    pCol = PLAYER_START.col;
    pRow = PLAYER_START.row;
    px = pCol * TILE;
    py = pRow * TILE;
    pDir = DIR.NONE;
    pNextDir = DIR.NONE;
  }

  // Move an entity along its direction, stopping at the next tile center.
  // Returns true if entity reached a tile center (decision point).
  function moveToNextCenter(
    ent: { x: number; y: number },
    dx: number,
    dy: number,
    speed: number,
  ): boolean {
    if (dx === 0 && dy === 0) {
      // Not moving — at center if perfectly aligned
      return ent.x % TILE === 0 && ent.y % TILE === 0;
    }
    // Distance past last tile center
    const remX = ((ent.x % TILE) + TILE) % TILE;
    const remY = ((ent.y % TILE) + TILE) % TILE;
    // Distance to next center in direction of travel
    let distToCenter: number;
    if (dx !== 0) {
      distToCenter =
        dx > 0 ? (remX === 0 ? TILE : TILE - remX) : remX === 0 ? TILE : remX;
    } else {
      distToCenter =
        dy > 0 ? (remY === 0 ? TILE : TILE - remY) : remY === 0 ? TILE : remY;
    }
    if (speed >= distToCenter) {
      // Reached the next tile center — snap exactly to it
      ent.x += dx * distToCenter;
      ent.y += dy * distToCenter;
      return true;
    }
    // Sub-tile movement, haven't reached center yet
    ent.x += dx * speed;
    ent.y += dy * speed;
    return false;
  }

  function snapToGrid() {
    px = Math.round(px / TILE) * TILE;
    py = Math.round(py / TILE) * TILE;
    pCol = wrapCol(Math.round(px / TILE));
    pRow = Math.round(py / TILE);
    px = pCol * TILE;
    py = pRow * TILE;
  }

  let eatingSlowdown = 0; // frames of dot-eating speed penalty remaining

  function updatePlayer() {
    let speed = PLAYER_SPEED + (level - 1) * SPEED_INCREMENT * 0.5;

    // Dot-eating speed penalty (~90% speed for 1 frame after eating)
    if (eatingSlowdown > 0) {
      speed *= 0.9;
      eatingSlowdown--;
    }

    // Cornering: allow direction change slightly before reaching tile center
    if (pDir !== DIR.NONE && pNextDir !== DIR.NONE && pNextDir !== pDir) {
      const remX = ((px % TILE) + TILE) % TILE;
      const remY = ((py % TILE) + TILE) % TILE;
      const distToCenter =
        pDir.dx !== 0
          ? pDir.dx > 0
            ? remX === 0
              ? 0
              : TILE - remX
            : remX
          : pDir.dy > 0
            ? remY === 0
              ? 0
              : TILE - remY
            : remY;
      // If within 2 pixels of center, try the buffered turn early
      if (distToCenter > 0 && distToCenter <= 2) {
        const snapCol = wrapCol(Math.round(px / TILE));
        const snapRow = Math.round(py / TILE);
        const testCol = wrapCol(snapCol + pNextDir.dx);
        const testRow = snapRow + pNextDir.dy;
        if (!isWall(testCol, testRow) && !isGhostDoor(testCol, testRow)) {
          // Snap to center and turn
          px = snapCol * TILE;
          py = snapRow * TILE;
          pCol = snapCol;
          pRow = snapRow;
          pDir = pNextDir;
          // Eat dot at the snap tile (would otherwise be skipped)
          if (pRow >= 0 && pRow < MAZE_ROWS && pCol >= 0 && pCol < MAZE_COLS) {
            const tile = maze[pRow][pCol];
            if (tile === D) {
              maze[pRow][pCol] = E;
              score += 10;
              dotsEaten++;
              eatingSlowdown = 1;
              playWaka();
              checkBonus();
            } else if (tile === P) {
              maze[pRow][pCol] = E;
              score += 50;
              dotsEaten++;
              eatingSlowdown = 1;
              activatePower();
              playPowerPellet();
            }
          }
        }
      }
    }

    // Move player and check if we reached a tile center
    const pEnt = { x: px, y: py };
    const reachedCenter = moveToNextCenter(pEnt, pDir.dx, pDir.dy, speed);
    px = pEnt.x;
    py = pEnt.y;

    // Tunnel wrap (pixel level)
    if (px < -TILE) px = MAZE_COLS * TILE;
    if (px > MAZE_COLS * TILE) px = -TILE;

    // Mouth animation
    if (pDir !== DIR.NONE) {
      mouthTimer++;
      if (mouthTimer >= 4) {
        mouthTimer = 0;
        mouthOpen = !mouthOpen;
      }
    }

    if (reachedCenter) {
      snapToGrid();

      // Eat dot/pellet
      if (pRow >= 0 && pRow < MAZE_ROWS && pCol >= 0 && pCol < MAZE_COLS) {
        const tile = maze[pRow][pCol];
        if (tile === D) {
          maze[pRow][pCol] = E;
          score += 10;
          dotsEaten++;
          eatingSlowdown = 1;
          playWaka();
          checkBonus();
        } else if (tile === P) {
          maze[pRow][pCol] = E;
          score += 50;
          dotsEaten++;
          eatingSlowdown = 1;
          activatePower();
          playPowerPellet();
        }
      }

      // Check bonus pickup
      if (bonusActive && pCol === bonusCol && pRow === bonusRow) {
        bonusActive = false;
        const item = getBonusItem();
        score += item.points;
        bonusScoreValue = item.points;
        bonusScorePopup = 90; // 1.5 seconds
        playBonusPickup();
      }

      // Check level clear
      if (dotsEaten >= totalDots) {
        setState("levelClear");
        playLevelClear();
        levelClearTimer = setTimeout(() => {
          level++;
          initLevel();
          enterReady();
        }, 2000);
        return;
      }

      // Extra life
      if (!extraLifeAwarded && score >= EXTRA_LIFE_SCORE) {
        extraLifeAwarded = true;
        lives++;
        gameTone(880, 0.1, 0.15);
        setTimeout(() => gameTone(1100, 0.15, 0.15), 120);
      }

      // Try next direction
      const nextCol = wrapCol(pCol + pNextDir.dx);
      const nextRow = pRow + pNextDir.dy;
      if (!isWall(nextCol, nextRow) && !isGhostDoor(nextCol, nextRow)) {
        pDir = pNextDir;
      }

      // Check if current direction is blocked
      const aheadCol = wrapCol(pCol + pDir.dx);
      const aheadRow = pRow + pDir.dy;
      if (isWall(aheadCol, aheadRow) || isGhostDoor(aheadCol, aheadRow)) {
        pDir = DIR.NONE;
      }
    }
  }

  // --- Power pellet ---
  function getFrightDuration(): number {
    const idx = Math.min(level - 1, FRIGHT_DURATIONS.length - 1);
    return FRIGHT_DURATIONS[idx];
  }

  function getModeTiming(): [number, number] {
    const idx = level <= 2 ? 0 : level <= 4 ? 1 : 2;
    return MODE_TIMINGS[idx];
  }

  function activatePower() {
    const frightDur = getFrightDuration();
    ghostsEatenCombo = 0;

    // At high levels, power pellets still reverse ghosts but no frightened mode
    if (frightDur <= 0) {
      for (const g of ghosts) {
        if (!g.inPen && !g.leavingPen && g.mode !== "eaten") {
          g.dir = { dx: -g.dir.dx, dy: -g.dir.dy } as Direction;
        }
      }
      return;
    }

    powerEndTime = Date.now() + frightDur;
    for (const g of ghosts) {
      if (!g.inPen && !g.leavingPen && g.mode !== "eaten") {
        g.prevMode = g.mode;
        g.mode = "frightened";
        // Reverse direction
        g.dir = { dx: -g.dir.dx, dy: -g.dir.dy } as Direction;
      }
    }
  }

  function checkBonus() {
    if (
      !bonusActive &&
      (dotsEaten === BONUS_SPAWN_DOTS_1 || dotsEaten === BONUS_SPAWN_DOTS_2)
    ) {
      bonusActive = true;
      bonusTimer = 600; // frames (~10 seconds)
    }
  }

  // --- Ghost AI ---
  function initGhosts() {
    ghosts = GHOST_DEFS.map((def) => ({
      x: def.startCol * TILE,
      y: def.startRow * TILE,
      col: def.startCol,
      row: def.startRow,
      dir: DIR.UP,
      mode: "scatter" as GhostMode,
      prevMode: "scatter" as GhostMode,
      def,
      inPen: def.penDelay > 0,
      leavingPen: false,
      penTimer: def.penDelay,
      speed: GHOST_SPEED,
    }));
    globalMode = "scatter";
    modeStartTime = Date.now();
  }

  function distSq(c1: number, r1: number, c2: number, r2: number): number {
    const dc = c1 - c2;
    const dr = r1 - r2;
    return dc * dc + dr * dr;
  }

  // BFS to find the best first step from (startCol,startRow) toward (goalCol,goalRow)
  // Returns the direction to take, or null if no path found.
  function bfsDirection(
    startCol: number,
    startRow: number,
    goalCol: number,
    goalRow: number,
  ): Direction | null {
    if (startCol === goalCol && startRow === goalRow) return null;
    const visited = new Set<number>();
    const key = (c: number, r: number) => r * MAZE_COLS + c;
    // Queue entries: [col, row, firstDir]
    const queue: [number, number, Direction][] = [];
    visited.add(key(startCol, startRow));
    for (const d of DIRS) {
      const nc = wrapCol(startCol + d.dx);
      const nr = startRow + d.dy;
      if (nr < 0 || nr >= MAZE_ROWS) continue;
      if (isWall(nc, nr)) continue;
      const k = key(nc, nr);
      if (visited.has(k)) continue;
      visited.add(k);
      if (nc === goalCol && nr === goalRow) return d;
      queue.push([nc, nr, d]);
    }
    let head = 0;
    while (head < queue.length) {
      const [c, r, firstDir] = queue[head++];
      for (const d of DIRS) {
        const nc = wrapCol(c + d.dx);
        const nr = r + d.dy;
        if (nr < 0 || nr >= MAZE_ROWS) continue;
        if (isWall(nc, nr)) continue;
        const k = key(nc, nr);
        if (visited.has(k)) continue;
        visited.add(k);
        if (nc === goalCol && nr === goalRow) return firstDir;
        queue.push([nc, nr, firstDir]);
      }
    }
    return null;
  }

  function getGhostTarget(ghost: Ghost): { col: number; row: number } {
    if (ghost.mode === "scatter") {
      return { col: ghost.def.scatterCol, row: ghost.def.scatterRow };
    }
    if (ghost.mode === "eaten") {
      return { col: 13, row: 13 }; // ghost pen door
    }
    // Chase mode — different per ghost
    switch (ghost.def.name) {
      case "HATEY": // direct chase
        return { col: pCol, row: pRow };
      case "FUDDY": // 4 tiles ahead of player
        return {
          col: wrapCol(pCol + pDir.dx * 4),
          row: Math.max(0, Math.min(MAZE_ROWS - 1, pRow + pDir.dy * 4)),
        };
      case "SCAMMY": {
        // vector from Hatey doubled through point 2 ahead of player
        const hatey = ghosts[0];
        const aheadCol = pCol + pDir.dx * 2;
        const aheadRow = pRow + pDir.dy * 2;
        return {
          col: wrapCol(aheadCol + (aheadCol - hatey.col)),
          row: Math.max(
            0,
            Math.min(MAZE_ROWS - 1, aheadRow + (aheadRow - hatey.row)),
          ),
        };
      }
      case "PETER": {
        // chase if far, scatter if close
        const d = distSq(ghost.col, ghost.row, pCol, pRow);
        if (d > 64) return { col: pCol, row: pRow };
        return { col: ghost.def.scatterCol, row: ghost.def.scatterRow };
      }
      default:
        return { col: pCol, row: pRow };
    }
  }

  function updateGhost(ghost: Ghost) {
    const baseSpeed = GHOST_SPEED + (level - 1) * SPEED_INCREMENT;

    // In pen — count down then start leaving
    if (ghost.inPen) {
      ghost.penTimer -= 16.67; // ~1 frame at 60fps
      if (ghost.penTimer <= 0) {
        ghost.inPen = false;
        ghost.leavingPen = true;
        // Move to center column and start walking down toward door
        ghost.x = 13 * TILE;
        ghost.col = 13;
        ghost.dir = DIR.DOWN;
        ghost.speed = GHOST_SPEED;
      }
      return;
    }

    // Leaving pen — walk down through the ghost door
    if (ghost.leavingPen) {
      ghost.speed = GHOST_SPEED;
      ghost.dir = DIR.DOWN;
      const moved = moveToNextCenter(
        ghost,
        ghost.dir.dx,
        ghost.dir.dy,
        ghost.speed,
      );
      if (moved) {
        ghost.col = wrapCol(Math.round(ghost.x / TILE));
        ghost.row = Math.round(ghost.y / TILE);
        // Once past the door (row 14), become a normal ghost
        if (ghost.row >= 14) {
          ghost.leavingPen = false;
          ghost.mode = globalMode;
        }
      }
      return;
    }

    // Set speed based on mode
    const inTunnel = TUNNEL_ROWS.includes(ghost.row);
    if (ghost.mode === "frightened") {
      ghost.speed = GHOST_SPEED_FRIGHTENED;
    } else if (ghost.mode === "eaten") {
      ghost.speed = GHOST_SPEED_EATEN;
    } else if (inTunnel) {
      ghost.speed = GHOST_SPEED_TUNNEL;
    } else {
      // Cruise Elroy: HATEY speeds up when few dots remain
      let speed = baseSpeed;
      if (ghost.def.name === "HATEY") {
        const dotsLeft = totalDots - dotsEaten;
        if (dotsLeft <= ELROY2_DOTS) {
          speed += ELROY_SPEED_BOOST2;
        } else if (dotsLeft <= ELROY1_DOTS) {
          speed += ELROY_SPEED_BOOST1;
        }
      }
      ghost.speed = speed;
    }

    // Move ghost toward next tile center
    const reachedGhostCenter = moveToNextCenter(
      ghost,
      ghost.dir.dx,
      ghost.dir.dy,
      ghost.speed,
    );

    // Tunnel wrap
    if (ghost.x < -TILE) ghost.x = MAZE_COLS * TILE;
    if (ghost.x > MAZE_COLS * TILE) ghost.x = -TILE;

    // Only make decisions at tile centers
    if (!reachedGhostCenter) return;

    ghost.x = Math.round(ghost.x / TILE) * TILE;
    ghost.y = Math.round(ghost.y / TILE) * TILE;
    ghost.col = wrapCol(Math.round(ghost.x / TILE));
    ghost.row = Math.max(
      0,
      Math.min(MAZE_ROWS - 1, Math.round(ghost.y / TILE)),
    );
    ghost.y = ghost.row * TILE; // re-sync pixel pos after clamp

    // Eaten ghost reached pen door — enter pen then walk back out
    if (
      ghost.mode === "eaten" &&
      ghost.row >= 11 &&
      ghost.row <= 13 &&
      ghost.col >= 11 &&
      ghost.col <= 17
    ) {
      // Place inside pen and start leaving
      ghost.col = 13;
      ghost.row = 11;
      ghost.x = ghost.col * TILE;
      ghost.y = ghost.row * TILE;
      ghost.mode = globalMode;
      ghost.prevMode = globalMode;
      ghost.inPen = false;
      ghost.leavingPen = true;
      ghost.dir = DIR.DOWN;
      ghost.speed = GHOST_SPEED;
    }

    // Eaten ghosts use BFS for reliable pathfinding back to pen
    if (ghost.mode === "eaten") {
      const bfsDir = bfsDirection(ghost.col, ghost.row, 13, 13);
      if (bfsDir) {
        ghost.dir = bfsDir;
      }
      return;
    }

    // Get target tile
    const target =
      ghost.mode === "frightened"
        ? {
            col: Math.floor(Math.random() * MAZE_COLS),
            row: Math.floor(Math.random() * MAZE_ROWS),
          }
        : getGhostTarget(ghost);

    // Choose best direction (never reverse)
    const reverse: Direction = {
      dx: -ghost.dir.dx,
      dy: -ghost.dir.dy,
    } as Direction;
    let bestDir: Direction | null = null;
    let bestDist = Infinity;

    for (const d of DIRS) {
      if (d.dx === reverse.dx && d.dy === reverse.dy) continue;

      const nc = wrapCol(ghost.col + d.dx);
      const nr = ghost.row + d.dy;

      if (!canMove(nc, nr, ghost.mode)) continue;

      const dd = distSq(nc, nr, target.col, target.row);
      if (dd < bestDist) {
        bestDist = dd;
        bestDir = d;
      }
    }

    if (bestDir) {
      ghost.dir = bestDir;
    } else {
      // No valid forward direction — reverse as fallback
      ghost.dir = reverse as Direction;
    }
  }

  function updateGhostModes() {
    const elapsed = Date.now() - modeStartTime;
    const [scatterDur, chaseDur] = getModeTiming();
    const currentDuration = globalMode === "scatter" ? scatterDur : chaseDur;

    if (elapsed >= currentDuration) {
      globalMode = globalMode === "scatter" ? "chase" : "scatter";
      modeStartTime = Date.now();
      for (const g of ghosts) {
        if (
          g.mode !== "frightened" &&
          g.mode !== "eaten" &&
          !g.inPen &&
          !g.leavingPen
        ) {
          g.mode = globalMode;
          // Reverse direction on mode change
          g.dir = { dx: -g.dir.dx, dy: -g.dir.dy } as Direction;
        }
      }
    }

    // Check power expiry
    if (powerEndTime > 0 && Date.now() >= powerEndTime) {
      powerEndTime = 0;
      for (const g of ghosts) {
        if (g.mode === "frightened") {
          g.mode = globalMode;
        }
      }
    }
  }

  // --- Collision detection ---
  function checkGhostCollisions() {
    for (const g of ghosts) {
      if (g.inPen || g.leavingPen) continue;
      const dx = Math.abs(g.x + TILE / 2 - (px + TILE / 2));
      const dy = Math.abs(g.y + TILE / 2 - (py + TILE / 2));
      if (dx < TILE * 0.7 && dy < TILE * 0.7) {
        if (g.mode === "frightened") {
          // Eat ghost
          g.mode = "eaten";
          ghostsEatenCombo++;
          const pts = 200 * Math.pow(2, ghostsEatenCombo - 1);
          score += pts;
          scorePopups.push({ x: g.x, y: g.y, value: pts, timer: 60 });
          if (ghostsEatenCombo >= 4) {
            playComboChime();
          } else {
            playEatGhost();
          }
        } else if (g.mode !== "eaten") {
          // Player dies
          playerDie();
          return;
        }
      }
    }
  }

  function playerDie() {
    setState("dying");
    dyingStart = Date.now();
    playDeath();
    dyingTimer = setTimeout(() => {
      lives--;
      if (lives <= 0) {
        setState("gameOver");
        playError();
      } else {
        initPlayer();
        initGhosts();
        enterReady();
      }
    }, 1500);
  }

  // --- Level init ---
  function initLevel() {
    initMaze();
    initPlayer();
    initGhosts();
    bonusActive = false;
    bonusScorePopup = 0;
    scorePopups = [];
    powerEndTime = 0;
    eatingSlowdown = 0;
    modeStartTime = Date.now();
    globalMode = "scatter";
  }

  // --- Update ---
  function update() {
    if (state !== "playing") return;

    updatePlayer();
    updateGhostModes();
    for (const g of ghosts) updateGhost(g);
    checkGhostCollisions();

    // Bonus timer
    if (bonusActive) {
      bonusTimer--;
      if (bonusTimer <= 0) bonusActive = false;
    }
    if (bonusScorePopup > 0) bonusScorePopup--;
    for (const p of scorePopups) p.timer--;
    scorePopups = scorePopups.filter((p) => p.timer > 0);
  }

  // --- Drawing ---
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
    ctx.fillText(text, x, y);
  }

  // Check if tile at (row, col) is a wall for maze rendering purposes
  function isWallTile(r: number, c: number): boolean {
    if (r < 0 || r >= MAZE_ROWS || c < 0 || c >= MAZE_COLS) return false;
    return maze[r][c] === W;
  }

  function drawMaze() {
    const BW = 2; // border width in pixels

    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const tile = maze[r][c];
        const tx = MAZE_X + c * TILE;
        const ty = MAZE_Y + r * TILE;

        if (tile === W) {
          // Outline-style: single-color border on edges facing non-wall
          // Check all 8 neighbors
          const wU = isWallTile(r - 1, c);
          const wD = isWallTile(r + 1, c);
          const wL = isWallTile(r, c - 1);
          const wR = isWallTile(r, c + 1);
          const wUL = isWallTile(r - 1, c - 1);
          const wUR = isWallTile(r - 1, c + 1);
          const wDL = isWallTile(r + 1, c - 1);
          const wDR = isWallTile(r + 1, c + 1);

          ctx.fillStyle = C.purpleLit;

          // Edge borders (full-width strips)
          if (!wU) ctx.fillRect(tx, ty, TILE, BW);
          if (!wD) ctx.fillRect(tx, ty + TILE - BW, TILE, BW);
          if (!wL) ctx.fillRect(tx, ty, BW, TILE);
          if (!wR) ctx.fillRect(tx + TILE - BW, ty, BW, TILE);

          // Inner corners: where two adjacent edges meet, fill the corner
          // This connects L-shaped wall junctions properly
          if (!wU && !wL) ctx.fillRect(tx, ty, BW, BW);
          if (!wU && !wR) ctx.fillRect(tx + TILE - BW, ty, BW, BW);
          if (!wD && !wL) ctx.fillRect(tx, ty + TILE - BW, BW, BW);
          if (!wD && !wR) ctx.fillRect(tx + TILE - BW, ty + TILE - BW, BW, BW);

          // Outer corners: wall surrounded by walls on sides, but diagonal is open
          // This creates the rounded-corner look at wall block corners
          if (wU && wL && !wUL) ctx.fillRect(tx, ty, BW, BW);
          if (wU && wR && !wUR) ctx.fillRect(tx + TILE - BW, ty, BW, BW);
          if (wD && wL && !wDL) ctx.fillRect(tx, ty + TILE - BW, BW, BW);
          if (wD && wR && !wDR)
            ctx.fillRect(tx + TILE - BW, ty + TILE - BW, BW, BW);
        } else if (tile === G) {
          // Ghost door
          ctx.fillStyle = C.pinkLit;
          ctx.fillRect(tx, ty + 5, TILE, 2);
        } else if (tile === D) {
          // Small dot
          ctx.fillStyle = C.yellowBright;
          ctx.fillRect(tx + 5, ty + 5, 2, 2);
        } else if (tile === P) {
          // Power pellet (pulsing)
          const pulse = Math.sin(animFrame * 0.1) > 0;
          if (pulse) {
            ctx.fillStyle = C.goldLit;
            ctx.fillRect(tx + 2, ty + 2, 8, 8);
          }
        }
      }
    }

    // Bonus item or score popup
    const bx = MAZE_X + bonusCol * TILE;
    const by = MAZE_Y + bonusRow * TILE;
    if (bonusActive) {
      getBonusItem().draw(ctx, bx, by);
    } else if (bonusScorePopup > 0) {
      drawText(`${bonusScoreValue}`, bx + 6, by + 6, C.white, 8, "center");
    }

    // Floating score popups (ghost eats)
    for (const p of scorePopups) {
      drawText(
        `${p.value}`,
        MAZE_X + p.x + 6,
        MAZE_Y + p.y + 4,
        C.cyanLit,
        8,
        "center",
      );
    }
  }

  function drawPlayer() {
    const sx = MAZE_X + px;
    const sy = MAZE_Y + py;
    const fl = pDir === DIR.LEFT;

    // Design (11 rows, 12 cols):
    // OOOOOOOOOOOO  rows 0-1: solid body
    // OOWBBOOWBBOO  rows 2-3: eyes (W=white, B=black)
    // OOOOOOOOOOOO  row 4: solid
    // OOOOBBBBOOOO  rows 5-6: centered mouth
    // OOOOOOOOOOOO  row 7: solid
    // ..OOO..OOO..  row 8: narrow leg tops
    // OOOOO..OOOOO  rows 9-10: wider leg bases

    // Helper: mirror x-offset when facing left (flips around center of 12px)
    const mx = (x: number, w: number) => (fl ? 12 - x - w : x);

    // Body (rows 0-7: solid orange 12x8)
    ctx.fillStyle = C.orangeHot;
    ctx.fillRect(sx, sy, 12, 8);

    // Legs — inverted T shape (mirrored when facing left)
    ctx.fillRect(sx + mx(2, 3), sy + 8, 3, 1);
    ctx.fillRect(sx + mx(7, 3), sy + 8, 3, 1);
    ctx.fillRect(sx + mx(0, 5), sy + 9, 5, 2);
    ctx.fillRect(sx + mx(7, 5), sy + 9, 5, 2);

    // Eyes (rows 2-3): white 2px + black 2px per eye, pupils face movement dir
    ctx.fillStyle = C.white;
    ctx.fillRect(sx + mx(2, 2), sy + 2, 2, 2);
    ctx.fillRect(sx + mx(7, 2), sy + 2, 2, 2);
    ctx.fillStyle = C.black;
    ctx.fillRect(sx + mx(4, 2), sy + 2, 2, 2);
    ctx.fillRect(sx + mx(9, 2), sy + 2, 2, 2);

    // Mouth (rows 5-6): 4px black, offset 1px right of center (mirrored when left)
    if (mouthOpen) {
      ctx.fillStyle = C.black;
      ctx.fillRect(sx + mx(5, 4), sy + 5, 4, 2);
    }
  }

  function drawGhost(ghost: Ghost) {
    const sx = MAZE_X + ghost.x;
    const sy = MAZE_Y + ghost.y;

    if (ghost.mode === "eaten") {
      // Eyes and open mouth floating back to pen
      ctx.fillStyle = C.white;
      ctx.fillRect(sx + 2, sy + 4, 3, 3);
      ctx.fillRect(sx + 7, sy + 4, 3, 3);
      ctx.fillStyle = C.black;
      ctx.fillRect(sx + 3, sy + 5, 1, 1);
      ctx.fillRect(sx + 8, sy + 5, 1, 1);
      // Nose + sad mouth — same as normal face
      ctx.fillStyle = C.white;
      ctx.fillRect(sx + 5, sy + 7, 2, 1);
      ctx.fillRect(sx + 4, sy + 8, 1, 1);
      ctx.fillRect(sx + 5, sy + 9, 2, 1);
      ctx.fillRect(sx + 7, sy + 8, 1, 1);
      return;
    }

    // Body/skin color
    let skinColor = ghost.def.color;
    let outlineColor = C.black;
    if (ghost.mode === "frightened") {
      const timeLeft = powerEndTime - Date.now();
      if (timeLeft < 2000 && Math.floor(animFrame / 8) % 2 === 0) {
        // Flashing: revert to normal color to warn player
        skinColor = ghost.def.color;
        outlineColor = C.black;
      } else {
        // White wojak with black features
        skinColor = C.white;
        outlineColor = C.black;
      }
    }

    // Wojak head — bald round head shape (12x12)
    // Row 0:                 ####
    // Row 1:              ##########
    // Row 2:            ############
    // Row 3:            ############   (forehead wrinkles)
    // Row 4:            ############   (eyebrows)
    // Row 5:            ############   (eyes)
    // Row 6:            ############   (eyes)
    // Row 7:            ############   (nose)
    // Row 8:            ############   (mouth)
    // Row 9:            ############
    // Row 10:            ##########
    // Row 11:              ######

    // Head shape (skin fill)
    ctx.fillStyle = skinColor;
    ctx.fillRect(sx + 3, sy + 0, 6, 1); // row 0
    ctx.fillRect(sx + 1, sy + 1, 10, 1); // row 1
    ctx.fillRect(sx + 0, sy + 2, 12, 8); // rows 2-9
    ctx.fillRect(sx + 1, sy + 10, 10, 1); // row 10
    ctx.fillRect(sx + 3, sy + 11, 6, 1); // row 11

    if (ghost.mode === "frightened") {
      // Frightened face: X eyes and wavy mouth
      ctx.fillStyle = outlineColor;
      // X eyes
      ctx.fillRect(sx + 2, sy + 4, 1, 1);
      ctx.fillRect(sx + 4, sy + 4, 1, 1);
      ctx.fillRect(sx + 3, sy + 5, 1, 1);
      ctx.fillRect(sx + 2, sy + 6, 1, 1);
      ctx.fillRect(sx + 4, sy + 6, 1, 1);
      ctx.fillRect(sx + 7, sy + 4, 1, 1);
      ctx.fillRect(sx + 9, sy + 4, 1, 1);
      ctx.fillRect(sx + 8, sy + 5, 1, 1);
      ctx.fillRect(sx + 7, sy + 6, 1, 1);
      ctx.fillRect(sx + 9, sy + 6, 1, 1);
      // Wavy mouth
      ctx.fillRect(sx + 3, sy + 9, 1, 1);
      ctx.fillRect(sx + 4, sy + 8, 1, 1);
      ctx.fillRect(sx + 5, sy + 9, 1, 1);
      ctx.fillRect(sx + 6, sy + 8, 1, 1);
      ctx.fillRect(sx + 7, sy + 9, 1, 1);
      ctx.fillRect(sx + 8, sy + 8, 1, 1);
    } else {
      // Normal Wojak face
      ctx.fillStyle = outlineColor;

      // Forehead wrinkles (2 horizontal lines)
      ctx.fillRect(sx + 3, sy + 2, 6, 1);
      ctx.fillRect(sx + 4, sy + 3, 4, 1);

      // Worried eyebrows (angled down toward center)
      ctx.fillRect(sx + 2, sy + 4, 2, 1);
      ctx.fillRect(sx + 4, sy + 5, 1, 1);
      ctx.fillRect(sx + 8, sy + 4, 2, 1);
      ctx.fillRect(sx + 7, sy + 5, 1, 1);

      // Eyes — white with dark pupils that track player
      ctx.fillStyle = C.white;
      ctx.fillRect(sx + 2, sy + 5, 3, 2);
      ctx.fillRect(sx + 7, sy + 5, 3, 2);
      ctx.fillStyle = outlineColor;
      const pdx = pCol > ghost.col ? 1 : pCol < ghost.col ? -1 : 0;
      const pdy = pRow > ghost.row ? 1 : pRow < ghost.row ? 0 : 0;
      ctx.fillRect(sx + 3 + pdx, sy + 5 + pdy, 1, 2);
      ctx.fillRect(sx + 8 + pdx, sy + 5 + pdy, 1, 2);

      // Nose — small bump
      ctx.fillStyle = outlineColor;
      ctx.fillRect(sx + 5, sy + 7, 2, 1);

      // Sad mouth — slight frown
      ctx.fillRect(sx + 4, sy + 8, 1, 1);
      ctx.fillRect(sx + 5, sy + 9, 2, 1);
      ctx.fillRect(sx + 7, sy + 8, 1, 1);
    }
  }

  function drawHud() {
    drawText(`${score}`, 4, 14, C.bright, 10, "left");
    drawText(`LV ${level}`, GAME_W / 2, 14, C.bright, 10, "center");

    // Current bonus item icon
    getBonusItem().draw(ctx, GAME_W - 14, 2);

    // Lives (small ₿ icons)
    for (let i = 0; i < lives - 1; i++) {
      ctx.fillStyle = C.orangeHot;
      ctx.fillRect(GAME_W - 28 - i * 14, 3, 10, 10);
    }
  }

  function drawTitle() {
    const blink = Math.floor(animFrame / 30) % 2 === 0;

    // POW-MAN title — horizontal banded color stripes using clip regions
    const titleSize = 28;
    const titleY = 20;
    const bandColors = [
      C.redHot,
      C.orangeHot,
      C.gold,
      C.yellowBright,
      C.yellowBright,
      C.gold,
      C.orangeHot,
      C.redHot,
    ];
    const totalH = titleSize + 4;
    const bandH = totalH / bandColors.length;
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < bandColors.length; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, titleY + i * bandH, GAME_W, bandH);
      ctx.clip();
      ctx.fillStyle = bandColors[i];
      ctx.fillText("POW-MAN", GAME_W / 2, titleY);
      ctx.restore();
    }
    ctx.textBaseline = "alphabetic";

    drawText("Consume all the energy,", GAME_W / 2, 68, C.bright, 10);
    drawText("but don't get wojacked!", GAME_W / 2, 84, C.bright, 10);

    // POW-MAN character centered at 3x (36w x 33h)
    const S = 3;
    const pmx = GAME_W / 2 - (12 * S) / 2; // centered
    const pmy = 100;
    ctx.fillStyle = C.orangeHot;
    ctx.fillRect(pmx, pmy, 12 * S, 8 * S);
    ctx.fillRect(pmx + 2 * S, pmy + 8 * S, 3 * S, 1 * S);
    ctx.fillRect(pmx + 7 * S, pmy + 8 * S, 3 * S, 1 * S);
    ctx.fillRect(pmx, pmy + 9 * S, 5 * S, 2 * S);
    ctx.fillRect(pmx + 7 * S, pmy + 9 * S, 5 * S, 2 * S);
    ctx.fillStyle = C.white;
    ctx.fillRect(pmx + 2 * S, pmy + 2 * S, 2 * S, 2 * S);
    ctx.fillRect(pmx + 7 * S, pmy + 2 * S, 2 * S, 2 * S);
    ctx.fillStyle = C.black;
    ctx.fillRect(pmx + 4 * S, pmy + 2 * S, 2 * S, 2 * S);
    ctx.fillRect(pmx + 9 * S, pmy + 2 * S, 2 * S, 2 * S);
    ctx.fillRect(pmx + 5 * S, pmy + 5 * S, 4 * S, 2 * S);

    // WOJAKS header
    drawText("WOJAKS:", GAME_W / 2, 158, C.white, 10);

    // 4 wojak faces in a horizontal row with names below
    const ghostColors = [C.redLit, C.pinkLit, C.cyanLit, C.greenLit];
    const ghostNames = ["HATEY", "FUDDY", "SCAMMY", "PETER"];
    const GS = 2;
    const faceW = 12 * GS; // 24px
    const colSpacing = 72; // space between each ghost column
    const rowStartX = GAME_W / 2 - (colSpacing * 3) / 2 - faceW / 2;
    const faceY = 174;
    for (let i = 0; i < 4; i++) {
      const gx = rowStartX + i * colSpacing;
      const gy = faceY;
      // 2x wojak head shape
      ctx.fillStyle = ghostColors[i];
      ctx.fillRect(gx + 3 * GS, gy, 6 * GS, 1 * GS);
      ctx.fillRect(gx + 1 * GS, gy + 1 * GS, 10 * GS, 1 * GS);
      ctx.fillRect(gx, gy + 2 * GS, 12 * GS, 8 * GS);
      ctx.fillRect(gx + 1 * GS, gy + 10 * GS, 10 * GS, 1 * GS);
      ctx.fillRect(gx + 3 * GS, gy + 11 * GS, 6 * GS, 1 * GS);
      // Wrinkles
      ctx.fillStyle = C.black;
      ctx.fillRect(gx + 3 * GS, gy + 2 * GS, 6 * GS, 1 * GS);
      ctx.fillRect(gx + 4 * GS, gy + 3 * GS, 4 * GS, 1 * GS);
      // Eyebrows
      ctx.fillRect(gx + 2 * GS, gy + 4 * GS, 2 * GS, 1 * GS);
      ctx.fillRect(gx + 4 * GS, gy + 5 * GS, 1 * GS, 1 * GS);
      ctx.fillRect(gx + 8 * GS, gy + 4 * GS, 2 * GS, 1 * GS);
      ctx.fillRect(gx + 7 * GS, gy + 5 * GS, 1 * GS, 1 * GS);
      // Eyes
      ctx.fillStyle = C.white;
      ctx.fillRect(gx + 2 * GS, gy + 5 * GS, 3 * GS, 2 * GS);
      ctx.fillRect(gx + 7 * GS, gy + 5 * GS, 3 * GS, 2 * GS);
      ctx.fillStyle = C.black;
      ctx.fillRect(gx + 3 * GS, gy + 5 * GS, 1 * GS, 2 * GS);
      ctx.fillRect(gx + 8 * GS, gy + 5 * GS, 1 * GS, 2 * GS);
      // Nose + mouth
      ctx.fillRect(gx + 5 * GS, gy + 7 * GS, 2 * GS, 1 * GS);
      ctx.fillRect(gx + 4 * GS, gy + 8 * GS, 1 * GS, 1 * GS);
      ctx.fillRect(gx + 5 * GS, gy + 9 * GS, 2 * GS, 1 * GS);
      ctx.fillRect(gx + 7 * GS, gy + 8 * GS, 1 * GS, 1 * GS);
      // Name centered below face
      drawText(ghostNames[i], gx + faceW / 2, faceY + 36, ghostColors[i], 8);
    }

    if (blink) {
      drawText("PRESS START", GAME_W / 2, 246, C.yellow, 14);
    }

    drawText("SPACE OR TAP TO BEGIN", GAME_W / 2, 266, C.midgray, 10);
  }

  function drawSpritePreview() {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    drawText("BONUS ITEMS", GAME_W / 2, 20, C.gold, 14, "center");

    const scale = 3;
    const cols = 3;
    const cellW = GAME_W / cols;
    const cellH = 76;
    const startY = 30;

    for (let i = 0; i < BONUS_ITEMS.length; i++) {
      const item = BONUS_ITEMS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = col * cellW + cellW / 2;
      const cy = startY + row * cellH;

      // Draw sprite at 3x using a temp canvas
      const tmp = document.createElement("canvas");
      tmp.width = 12;
      tmp.height = 12;
      const tc = tmp.getContext("2d")!;
      tc.fillStyle = C.black;
      tc.fillRect(0, 0, 12, 12);
      item.draw(tc, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, cx - (12 * scale) / 2, cy, 12 * scale, 12 * scale);

      // Label
      drawText(`LV${i + 1}`, cx, cy + 12 * scale + 10, C.bright, 8, "center");
      drawText(item.name, cx, cy + 12 * scale + 22, C.lightgray, 8, "center");
      drawText(
        `${item.points}`,
        cx,
        cy + 12 * scale + 34,
        C.yellowLit,
        8,
        "center",
      );
    }

    // Footer text drawn by caller (title screen vs pause have different text)
  }

  function drawGameOver() {
    drawText("GAME OVER", GAME_W / 2, 90, C.redHot, 20);
    drawText(`SCORE: ${score}`, GAME_W / 2, 130, C.bright, 12);
    drawText(`LEVEL: ${level}`, GAME_W / 2, 160, C.lightgray, 12);

    const blink = Math.floor(animFrame / 30) % 2 === 0;
    if (blink) {
      drawText("PRESS START", GAME_W / 2, 210, C.yellow, 12);
    }
  }

  function draw() {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    if (state === "title" || state === "gate") {
      if (showSpritePreview && state === "title") {
        drawSpritePreview();
        drawText(
          "PRESS D TO CLOSE",
          GAME_W / 2,
          GAME_H - 10,
          C.midgray,
          8,
          "center",
        );
      } else {
        drawTitle();
      }
      return;
    }

    if (state === "gameOver") {
      drawGameOver();
      return;
    }

    drawHud();
    drawMaze();
    drawPlayer();
    for (const g of ghosts) drawGhost(g);

    if (state === "paused") {
      if (pauseShowBonus) {
        drawSpritePreview();
        drawText(
          "SPACE OR TAP TO RESUME",
          GAME_W / 2,
          GAME_H - 10,
          C.midgray,
          8,
          "center",
        );
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        drawText("PAUSED", GAME_W / 2, GAME_H / 2 - 4, C.bright, 16);
        drawText(
          "SPACE OR TAP TO RESUME",
          GAME_W / 2,
          GAME_H / 2 + 18,
          C.midgray,
          8,
        );
      }
    }

    if (state === "ready") {
      const blink = Math.floor(animFrame / 15) % 2 === 0;
      if (blink) {
        drawText("READY!", GAME_W / 2, GAME_H / 2 + 4, C.yellowBright, 14);
      }
    }

    if (state === "levelClear") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      drawText("BLOCK MINED!", GAME_W / 2, GAME_H / 2 - 10, C.greenLit, 16);
      drawText(
        `LEVEL ${level} CLEAR`,
        GAME_W / 2,
        GAME_H / 2 + 20,
        C.bright,
        12,
      );
    }

    if (state === "dying") {
      // Player sprite is already drawn above — punch out pixels to dissipate
      const elapsed = Date.now() - dyingStart;
      const progress = Math.min(elapsed / 1500, 1); // 0→1 over 1.5s
      const sx = MAZE_X + px;
      const sy = MAZE_Y + py;
      ctx.fillStyle = C.black;
      for (let dy = -1; dy < 12; dy++) {
        for (let dx = -1; dx < 13; dx++) {
          if (Math.random() < progress) {
            ctx.fillRect(sx + dx, sy + dy, 1, 1);
          }
        }
      }
    }

    // Power timer
    if (powerEndTime > 0) {
      const remaining = Math.max(0, powerEndTime - Date.now());
      const secs = Math.ceil(remaining / 1000);
      drawText(
        `HALVING ${secs}s`,
        GAME_W - 4,
        MAZE_Y + MAZE_ROWS * TILE + 12,
        C.white,
        10,
        "right",
      );
    }
  }

  // --- Game loop ---
  function gameLoop() {
    animFrame++;
    update();
    draw();
    rafId = requestAnimationFrame(gameLoop);
  }

  function enterReady() {
    setState("ready");
    readyTimer = setTimeout(() => {
      readyTimer = null;
      setState("playing");
    }, 2000);
  }

  /** Try to start — if gated, fire "gate" instead. */
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
    extraLifeAwarded = false;
    initLevel();
    enterReady();
  }

  // --- Input handlers ---
  function onKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;
    if (state === "title" && e.key === "d") {
      showSpritePreview = !showSpritePreview;
    } else if (
      state === "title" &&
      !showSpritePreview &&
      (e.key === " " || e.key === "Enter")
    ) {
      tryStart();
    } else if (state === "gameOver" && (e.key === " " || e.key === "Enter")) {
      tryStart();
    } else if (state === "paused") {
      if (e.key === " " || e.key === "Enter") {
        resumeFromPause();
      }
    } else if (state === "playing") {
      if (e.key === " ") {
        pauseShowBonus = false;
        pauseStart = Date.now();
        setState("paused");
      } else if (e.key === "ArrowUp" || e.key === "w") pNextDir = DIR.UP;
      else if (e.key === "ArrowDown" || e.key === "s") pNextDir = DIR.DOWN;
      else if (e.key === "ArrowLeft" || e.key === "a") pNextDir = DIR.LEFT;
      else if (e.key === "ArrowRight" || e.key === "d") pNextDir = DIR.RIGHT;
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;

    if (state === "title" || state === "gameOver") {
      tryStart();
    } else if (state === "paused") {
      resumeFromPause();
    } else if (state === "playing") {
      const { cx, cy } = canvasCoords(touch.clientX, touch.clientY);
      if (isHudRightTap(cx, cy)) {
        pauseShowBonus = true;
        pauseStart = Date.now();
        setState("paused");
      }
    }
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (state !== "playing") return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeStartX;
    const dy = touch.clientY - swipeStartY;
    const minSwipe = 10;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        pNextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        pNextDir = dy > 0 ? DIR.DOWN : DIR.UP;
      }
    }
  }

  function canvasCoords(
    clientX: number,
    clientY: number,
  ): { cx: number; cy: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      cx: (clientX - rect.left) * (GAME_W / rect.width),
      cy: (clientY - rect.top) * (GAME_H / rect.height),
    };
  }

  function isHudRightTap(cx: number, cy: number): boolean {
    return cy < MAZE_Y && cx > GAME_W - 80;
  }

  function resumeFromPause() {
    const pauseDur = Date.now() - pauseStart;
    if (powerEndTime > 0) powerEndTime += pauseDur;
    modeStartTime += pauseDur;
    pauseShowBonus = false;
    setState("playing");
  }

  function onMouseClick(e: MouseEvent) {
    if (state === "title" || state === "gameOver") {
      tryStart();
    } else if (state === "paused") {
      resumeFromPause();
    } else if (state === "playing") {
      const { cx, cy } = canvasCoords(e.clientX, e.clientY);
      if (isHudRightTap(cx, cy)) {
        pauseShowBonus = true;
        pauseStart = Date.now();
        setState("paused");
      }
    }
  }

  // --- Public API ---
  function start() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("click", onMouseClick);

    setState("title");
    gameLoop();
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (levelClearTimer !== null) clearTimeout(levelClearTimer);
    if (dyingTimer !== null) clearTimeout(dyingTimer);
    if (readyTimer !== null) clearTimeout(readyTimer);
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
    getState: () => state,
    getScore: () => score,
    getLevel: () => level,
    getLives: () => lives,
  };
}
