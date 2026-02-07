/**
 * Bitari 2100 NTSC color palette - 128 colors
 * Based on classic console NTSC palette
 *
 * Organized as 16 hue rows x 8 luminance steps (dark to light)
 */
export const ATARI_PALETTE = {
  // Row 0 - Grays
  gray: [
    "#000000",
    "#404040",
    "#6c6c6c",
    "#909090",
    "#b0b0b0",
    "#c8c8c8",
    "#dcdcdc",
    "#ececec",
  ],
  // Row 1 - Gold/Brown
  gold: [
    "#444400",
    "#646410",
    "#848424",
    "#a0a034",
    "#b8b84c",
    "#d0d064",
    "#e8e47c",
    "#fcfc9c",
  ],
  // Row 2 - Orange
  orange: [
    "#702800",
    "#844414",
    "#985c28",
    "#ac783c",
    "#c09050",
    "#d4a868",
    "#e8c080",
    "#fcd898",
  ],
  // Row 3 - Red-Orange
  redOrange: [
    "#841800",
    "#983418",
    "#ac5030",
    "#c06848",
    "#d48060",
    "#e89878",
    "#fcb090",
    "#fcc8a8",
  ],
  // Row 4 - Red
  red: [
    "#880000",
    "#9c2020",
    "#b03c3c",
    "#c05858",
    "#d07070",
    "#e08888",
    "#eca0a0",
    "#fcb4b4",
  ],
  // Row 5 - Purple
  purple: [
    "#78005c",
    "#8c2074",
    "#a03c88",
    "#b0589c",
    "#c070b0",
    "#d084c0",
    "#dc9cd0",
    "#ecb0e0",
  ],
  // Row 6 - Blue-Purple
  bluePurple: [
    "#480078",
    "#602090",
    "#783ca4",
    "#8c58b8",
    "#a070cc",
    "#b484dc",
    "#c49cec",
    "#d4b0fc",
  ],
  // Row 7 - Blue
  blue: [
    "#140090",
    "#3020a8",
    "#3840b0",
    "#505cc0",
    "#6878d0",
    "#7c94e0",
    "#90b0ec",
    "#a8ccfc",
  ],
  // Row 8 - Light Blue
  lightBlue: [
    "#000094",
    "#1c209c",
    "#3840b0",
    "#505cc0",
    "#6878d0",
    "#8090e0",
    "#98a8ec",
    "#b0c0fc",
  ],
  // Row 9 - Cyan
  cyan: [
    "#00588c",
    "#106c9c",
    "#2484ac",
    "#389cbc",
    "#4cb4cc",
    "#5cccdc",
    "#70e0ec",
    "#84f4fc",
  ],
  // Row 10 - Blue-Green
  blueGreen: [
    "#005c5c",
    "#0c7878",
    "#209090",
    "#34a8a8",
    "#4cc0c0",
    "#5cd4d4",
    "#70e8e8",
    "#84fcfc",
  ],
  // Row 11 - Green
  green: [
    "#005400",
    "#106c10",
    "#208420",
    "#349c34",
    "#4cb44c",
    "#5ccc5c",
    "#70e070",
    "#84fc84",
  ],
  // Row 12 - Yellow-Green
  yellowGreen: [
    "#143800",
    "#2c5414",
    "#407028",
    "#548c3c",
    "#68a450",
    "#7cbc64",
    "#90d478",
    "#a8ec8c",
  ],
  // Row 13 - Dark Green
  darkGreen: [
    "#204c00",
    "#3c6c14",
    "#5c8c28",
    "#78ac3c",
    "#94c850",
    "#afe068",
    "#c8fc80",
    "#dcfc9c",
  ],
  // Row 14 - Olive
  olive: [
    "#3c4800",
    "#546414",
    "#6c842c",
    "#84a044",
    "#9cbc5c",
    "#b4d474",
    "#cce88c",
    "#e0fca4",
  ],
  // Row 15 - Yellow
  yellow: [
    "#544400",
    "#6c6410",
    "#848424",
    "#9ca038",
    "#b0b84c",
    "#c4d064",
    "#d8e87c",
    "#ecfc9c",
  ],
} as const;

/** Semantic color aliases for the wallet UI */
export const ATARI_SEMANTIC = {
  background: ATARI_PALETTE.gray[0], // #000000
  surface: ATARI_PALETTE.gray[1], // #404040
  border: ATARI_PALETTE.gray[2], // #6c6c6c
  textMuted: ATARI_PALETTE.gray[3], // #909090
  text: ATARI_PALETTE.gray[4], // #b0b0b0
  textBright: ATARI_PALETTE.gray[5], // #c8c8c8

  primary: ATARI_PALETTE.redOrange[2], // #ac5030 (Bitcoin orange)
  primaryLit: ATARI_PALETTE.redOrange[3], // #c06848
  primaryDim: ATARI_PALETTE.orange[1], // #844414

  send: ATARI_PALETTE.blue[2], // #3840b0
  sendLit: ATARI_PALETTE.blue[3], // #505cc0

  receive: ATARI_PALETTE.green[2], // #208420
  receiveLit: ATARI_PALETTE.green[3], // #349c34

  error: ATARI_PALETTE.red[2], // #b03c3c
  errorLit: ATARI_PALETTE.red[3], // #c05858

  warning: ATARI_PALETTE.gold[3], // #a0a034

  wood: ATARI_PALETTE.orange[1], // #844414
  woodLight: ATARI_PALETTE.redOrange[2], // #ac5030
  woodDark: "#442800",

  phosphor: ATARI_PALETTE.green[3], // #349c34
} as const;
