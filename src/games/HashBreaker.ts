/**
 * Hash-Out — Breakout-style game with Bitcoin/mining theme.
 *
 * Paddle = hardware wallet, ball = bitcoin coin, bricks = hash puzzle blocks.
 * Break all bricks = "NONCE FOUND", next level adds more rows.
 * Special power-up brick: doubles paddle width for 21 seconds.
 *
 * Renders to a <canvas> element. Uses TIA sound synthesis.
 * Atari 2600 NTSC palette colors.
 */

import {
  playClick,
  playError,
  playCelebration,
  isMuted,
} from "../services/tiaSoundService";

// --- Atari 2600 palette colors (expanded) ---
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
};

// Brick row colors (top to bottom) — richer palette
const ROW_COLORS = [
  C.red,
  C.redLit,
  C.pink,
  C.orange,
  C.orangeLit,
  C.gold,
  C.yellow,
  C.yellowLit,
  C.green,
  C.greenLit,
  C.cyan,
  C.blue,
  C.blueLit,
  C.purple,
  C.purpleLit,
];

// --- Game constants ---
const GAME_W = 320;
const GAME_H = 240;
const PADDLE_W = 40;
const PADDLE_W_WIDE = 80; // 2x power-up
const PADDLE_H = 6;
const PADDLE_Y = GAME_H - 20;
const PADDLE_SPEED = 4;
const BALL_SIZE = 4;
const BALL_SPEED_INITIAL = 1.2;
const BALL_SPEED_INCREMENT = 0.25;
const BRICK_COLS = 10;
const BRICK_H = 8;
const BRICK_GAP = 2;
const BRICK_TOP = 40;
const LIVES_INITIAL = 7;
const INITIAL_ROWS = 4;
const MAX_ROWS = 10;
const POWERUP_DURATION = 21_000; // 21 seconds in ms

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
  points: number;
  isPowerUp: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  active: boolean;
}

export type GameState =
  | "title"
  | "playing"
  | "paused"
  | "levelClear"
  | "gameOver";

export interface HashBreakerGame {
  start: () => void;
  stop: () => void;
  getState: () => GameState;
  getScore: () => number;
  getLevel: () => number;
  getLives: () => number;
}

// --- TIA-style sound helpers (inline, bypass mute check for game sounds) ---
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

function playBrickHit(points: number) {
  gameTone(400 + points * 30, 0.06, 0.12);
}

function playPaddleHit() {
  gameTone(220, 0.05, 0.1);
}

function playWallHit() {
  gameTone(180, 0.03, 0.06);
}

function playLoseLife() {
  gameTone(200, 0.15, 0.15);
  setTimeout(() => gameTone(150, 0.2, 0.12), 160);
}

function playLevelClear() {
  playCelebration();
}

function playPowerUp() {
  gameTone(440, 0.08, 0.12);
  setTimeout(() => gameTone(660, 0.08, 0.12), 90);
  setTimeout(() => gameTone(880, 0.12, 0.15), 180);
}

// --- Main game factory ---
export function createHashBreaker(
  canvas: HTMLCanvasElement,
  onStateChange?: (state: GameState) => void,
): HashBreakerGame {
  const ctx = canvas.getContext("2d")!;
  canvas.width = GAME_W;
  canvas.height = GAME_H;

  let state: GameState = "title";
  let score = 0;
  let level = 1;
  let lives = LIVES_INITIAL;
  let currentPaddleW = PADDLE_W;
  let powerUpEndTime = 0;
  let paddle = { x: GAME_W / 2 - PADDLE_W / 2 };
  let ball: Ball = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    speed: BALL_SPEED_INITIAL,
    active: false,
  };
  let bricks: Brick[] = [];
  let animFrame = 0;
  let rafId: number | null = null;
  let levelClearTimer: ReturnType<typeof setTimeout> | null = null;

  // Input state
  const keys: Record<string, boolean> = {};
  let touchX: number | null = null;

  function setState(s: GameState) {
    state = s;
    onStateChange?.(s);
  }

  function buildBricks() {
    bricks = [];
    const rows = Math.min(INITIAL_ROWS + level - 1, MAX_ROWS);
    const brickW = Math.floor(
      (GAME_W - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS,
    );

    // Place 1-2 power-up bricks per level (random positions, not in top row)
    const totalBricks = rows * BRICK_COLS;
    const powerUpCount = Math.min(1 + Math.floor(level / 3), 3);
    const powerUpIndices = new Set<number>();
    while (powerUpIndices.size < powerUpCount) {
      const idx =
        BRICK_COLS + Math.floor(Math.random() * (totalBricks - BRICK_COLS));
      powerUpIndices.add(idx);
    }

    // Center the brick grid horizontally
    const gridW = BRICK_COLS * brickW + (BRICK_COLS - 1) * BRICK_GAP;
    const offsetX = Math.floor((GAME_W - gridW) / 2);

    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const isPowerUp = powerUpIndices.has(idx);
        bricks.push({
          x: offsetX + col * (brickW + BRICK_GAP),
          y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
          w: brickW,
          h: BRICK_H,
          color: isPowerUp ? C.goldLit : ROW_COLORS[row % ROW_COLORS.length],
          alive: true,
          points: isPowerUp ? 50 : (rows - row) * 10,
          isPowerUp,
        });
        idx++;
      }
    }
  }

  function activatePowerUp() {
    currentPaddleW = PADDLE_W_WIDE;
    powerUpEndTime = Date.now() + POWERUP_DURATION;
    // Re-center paddle so it doesn't go off-screen
    paddle.x = Math.max(
      0,
      Math.min(
        GAME_W - currentPaddleW,
        paddle.x - (PADDLE_W_WIDE - PADDLE_W) / 2,
      ),
    );
    playPowerUp();
  }

  function resetBall() {
    ball.x = paddle.x + currentPaddleW / 2;
    ball.y = PADDLE_Y - BALL_SIZE - 1;
    ball.dx = 0;
    ball.dy = 0;
    ball.active = false;
  }

  function launchBall() {
    if (ball.active) return;
    ball.active = true;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    ball.speed = BALL_SPEED_INITIAL + (level - 1) * BALL_SPEED_INCREMENT;
    ball.dx = Math.cos(angle) * ball.speed;
    ball.dy = Math.sin(angle) * ball.speed;
    playClick();
  }

  function initLevel() {
    buildBricks();
    currentPaddleW = PADDLE_W;
    powerUpEndTime = 0;
    paddle.x = GAME_W / 2 - PADDLE_W / 2;
    resetBall();
  }

  // --- Input handlers ---
  function onKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;
    if (state === "title" && (e.key === " " || e.key === "Enter")) {
      startGame();
    } else if (
      state === "playing" &&
      !ball.active &&
      (e.key === " " || e.key === "ArrowUp")
    ) {
      launchBall();
    } else if (state === "gameOver" && (e.key === " " || e.key === "Enter")) {
      startGame();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    touchX = (e.touches[0].clientX - rect.left) * scaleX;

    if (state === "title" || state === "gameOver") {
      startGame();
    } else if (state === "playing" && !ball.active) {
      launchBall();
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    touchX = (e.touches[0].clientX - rect.left) * scaleX;
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    touchX = null;
  }

  function onMouseClick() {
    if (state === "title" || state === "gameOver") {
      startGame();
    } else if (state === "playing" && !ball.active) {
      launchBall();
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (state !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(
      0,
      Math.min(GAME_W - currentPaddleW, mx - currentPaddleW / 2),
    );
  }

  // --- Update ---
  function update() {
    if (state !== "playing") return;

    // Check power-up expiry
    if (powerUpEndTime > 0 && Date.now() >= powerUpEndTime) {
      const oldCenter = paddle.x + currentPaddleW / 2;
      currentPaddleW = PADDLE_W;
      powerUpEndTime = 0;
      paddle.x = Math.max(
        0,
        Math.min(GAME_W - currentPaddleW, oldCenter - currentPaddleW / 2),
      );
    }

    // Paddle movement (keyboard)
    if (keys["ArrowLeft"] || keys["a"]) {
      paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
    }
    if (keys["ArrowRight"] || keys["d"]) {
      paddle.x = Math.min(GAME_W - currentPaddleW, paddle.x + PADDLE_SPEED);
    }

    // Paddle movement (touch)
    if (touchX !== null) {
      const target = touchX - currentPaddleW / 2;
      paddle.x = Math.max(0, Math.min(GAME_W - currentPaddleW, target));
    }

    // Ball follows paddle when not launched
    if (!ball.active) {
      ball.x = paddle.x + currentPaddleW / 2;
      ball.y = PADDLE_Y - BALL_SIZE - 1;
      return;
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x <= 0) {
      ball.x = 0;
      ball.dx = Math.abs(ball.dx);
      playWallHit();
    }
    if (ball.x >= GAME_W - BALL_SIZE) {
      ball.x = GAME_W - BALL_SIZE;
      ball.dx = -Math.abs(ball.dx);
      playWallHit();
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.dy = Math.abs(ball.dy);
      playWallHit();
    }

    // Ball falls below paddle
    if (ball.y >= GAME_H) {
      lives--;
      playLoseLife();
      if (lives <= 0) {
        setState("gameOver");
        playError();
      } else {
        resetBall();
      }
      return;
    }

    // Paddle collision
    if (
      ball.dy > 0 &&
      ball.y + BALL_SIZE >= PADDLE_Y &&
      ball.y + BALL_SIZE <= PADDLE_Y + PADDLE_H + 2 &&
      ball.x + BALL_SIZE >= paddle.x &&
      ball.x <= paddle.x + currentPaddleW
    ) {
      const hitPos = (ball.x + BALL_SIZE / 2 - paddle.x) / currentPaddleW;
      const angle = -Math.PI / 2 + (hitPos - 0.5) * (Math.PI * 0.7);
      ball.dx = Math.cos(angle) * ball.speed;
      ball.dy = Math.sin(angle) * ball.speed;
      ball.y = PADDLE_Y - BALL_SIZE - 1;
      playPaddleHit();
    }

    // Brick collisions
    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (
        ball.x + BALL_SIZE > brick.x &&
        ball.x < brick.x + brick.w &&
        ball.y + BALL_SIZE > brick.y &&
        ball.y < brick.y + brick.h
      ) {
        brick.alive = false;
        score += brick.points;
        playBrickHit(brick.points);

        if (brick.isPowerUp) {
          activatePowerUp();
        }

        // Determine bounce direction
        const overlapLeft = ball.x + BALL_SIZE - brick.x;
        const overlapRight = brick.x + brick.w - ball.x;
        const overlapTop = ball.y + BALL_SIZE - brick.y;
        const overlapBottom = brick.y + brick.h - ball.y;
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }
        break;
      }
    }

    // Check level clear
    if (bricks.every((b) => !b.alive)) {
      setState("levelClear");
      playLevelClear();
      levelClearTimer = setTimeout(() => {
        level++;
        ball.speed += BALL_SPEED_INCREMENT;
        initLevel();
        setState("playing");
      }, 2000);
    }
  }

  // --- Draw ---
  // Use only integer font sizes for crisp pixel-font rendering
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

  function draw() {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    if (state === "title") {
      drawTitle();
      return;
    }

    if (state === "gameOver") {
      drawGameOver();
      return;
    }

    // HUD
    drawHud();

    // Bricks
    for (const brick of bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

      if (brick.isPowerUp) {
        // Bright shimmer stripe to distinguish power-up bricks
        ctx.fillStyle = C.white;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(brick.x, brick.y, brick.w, 2);
        ctx.globalAlpha = 1;
      } else {
        // Highlight line on top
        ctx.fillStyle = C.bright;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(brick.x, brick.y, brick.w, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Paddle
    const paddleColor = currentPaddleW > PADDLE_W ? C.goldLit : C.orange;
    const paddleHighlight =
      currentPaddleW > PADDLE_W ? C.yellowBright : C.orangeLit;
    ctx.fillStyle = paddleColor;
    ctx.fillRect(paddle.x, PADDLE_Y, currentPaddleW, PADDLE_H);
    ctx.fillStyle = paddleHighlight;
    ctx.fillRect(paddle.x, PADDLE_Y, currentPaddleW, 2);

    // Ball
    ctx.fillStyle = C.yellowBright;
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

    // Power-up timer indicator
    if (powerUpEndTime > 0) {
      const remaining = Math.max(0, powerUpEndTime - Date.now());
      const secs = Math.ceil(remaining / 1000);
      drawText(`2X ${secs}s`, GAME_W - 4, 34, C.goldLit, 8, "right");
    }

    // Level clear overlay
    if (state === "levelClear") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      drawText("NONCE FOUND!", GAME_W / 2, GAME_H / 2 - 10, C.greenBright, 14);
      drawText(
        `LEVEL ${level} CLEAR`,
        GAME_W / 2,
        GAME_H / 2 + 18,
        C.bright,
        10,
      );
    }

    // Ball not launched hint
    if (state === "playing" && !ball.active) {
      if (Math.floor(animFrame / 30) % 2 === 0) {
        drawText(
          "TAP OR SPACE TO LAUNCH",
          GAME_W / 2,
          GAME_H - 4,
          C.midgray,
          7,
        );
      }
    }
  }

  function drawHud() {
    drawText(`${score}`, 4, 12, C.bright, 8, "left");
    drawText(`LV ${level}`, GAME_W / 2, 12, C.bright, 8, "center");

    // Lives
    ctx.textAlign = "right";
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = C.orange;
      ctx.fillRect(GAME_W - 12 - i * 10, 5, 6, 6);
    }

    // Separator line
    ctx.fillStyle = C.darkgray;
    ctx.fillRect(0, 18, GAME_W, 1);
  }

  function drawTitle() {
    const blink = Math.floor(animFrame / 30) % 2 === 0;

    // HASH-OUT title — horizontal banded color stripes (same style as POW-MAN)
    const titleSize = 28;
    const titleY = 16;
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
      ctx.fillText("HASH-OUT", GAME_W / 2, titleY);
      ctx.restore();
    }
    ctx.textBaseline = "alphabetic";

    // Decorative bricks — matches in-game layout (4 rows x 10 cols)
    const rowColors = [C.red, C.redLit, C.pink, C.orange];
    const cols = BRICK_COLS;
    const rows = 4;
    const bW = Math.floor((GAME_W - (cols + 1) * BRICK_GAP) / cols);
    const gW = cols * bW + (cols - 1) * BRICK_GAP;
    const ox = Math.floor((GAME_W - gW) / 2);
    const oy = 60;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // One gold power-up brick in row 2, col 7 (like the screenshot)
        const isPow = r === 2 && c === 7;
        ctx.fillStyle = isPow ? C.goldLit : rowColors[r];
        ctx.fillRect(
          ox + c * (bW + BRICK_GAP),
          oy + r * (BRICK_H + BRICK_GAP),
          bW,
          BRICK_H,
        );
      }
    }

    drawText("MINE THE BLOCKS", GAME_W / 2, 120, C.bright, 10);

    if (blink) {
      drawText("PRESS START", GAME_W / 2, 160, C.yellow, 10);
    }

    drawText("SPACE OR TAP TO BEGIN", GAME_W / 2, 210, C.midgray, 7);
  }

  function drawGameOver() {
    drawText("GAME OVER", GAME_W / 2, 80, C.redHot, 16);
    drawText(`FINAL HASH: ${score}`, GAME_W / 2, 120, C.bright, 10);
    drawText(`LEVEL: ${level}`, GAME_W / 2, 148, C.lightgray, 10);

    const blink = Math.floor(animFrame / 30) % 2 === 0;
    if (blink) {
      drawText("PRESS START", GAME_W / 2, 190, C.yellow, 10);
    }
  }

  // --- Game loop ---
  function gameLoop() {
    animFrame++;
    update();
    draw();
    rafId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    score = 0;
    level = 1;
    lives = LIVES_INITIAL;
    currentPaddleW = PADDLE_W;
    powerUpEndTime = 0;
    initLevel();
    setState("playing");
  }

  // --- Public API ---
  function start() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onMouseClick);

    setState("title");
    gameLoop();
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (levelClearTimer !== null) clearTimeout(levelClearTimer);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("click", onMouseClick);
    rafId = null;
  }

  return {
    start,
    stop,
    getState: () => state,
    getScore: () => score,
    getLevel: () => level,
    getLives: () => lives,
  };
}
