/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        atari: {
          // Row 1 - Grays
          black: "#000000",
          darkgray: "#404040",
          midgray: "#6c6c6c",
          lightgray: "#909090",
          white: "#b0b0b0",
          bright: "#d4d4d4",

          // Primary - Bitcoin Orange (Row 3-4 oranges)
          orange: "#ac5030",
          "orange-lit": "#c06848",
          "orange-dim": "#844414",
          "orange-hot": "#d4884c",

          // Secondary - Electric Blue (Row 6 blues)
          blue: "#3840b0",
          "blue-lit": "#505cc0",
          "blue-dim": "#1c209c",
          "blue-sky": "#6878d0",

          // Success - Green (Row 8 greens)
          green: "#407c40",
          "green-lit": "#5c9c5c",
          "green-dim": "#205c20",

          // Error - Red
          red: "#b03c3c",
          "red-lit": "#c05858",
          "red-dim": "#9c2020",

          // Warning - Yellow
          yellow: "#a0a034",
          "yellow-lit": "#b8b84c",
          "yellow-dim": "#646410",

          // Wood grain (console frame)
          wood: "#844414",
          "wood-lit": "#ac5030",
          "wood-dark": "#442800",

          // CRT glow
          phosphor: "#5c9c5c",
          "amber-glow": "#ac7834",
        },
      },
      fontFamily: {
        atari: ['"Press Start 2P"', "monospace"],
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"Press Start 2P"', "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["8px", { lineHeight: "16px" }],
        sm: ["10px", { lineHeight: "16px" }],
        base: ["12px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["32px", { lineHeight: "40px" }],
        score: ["40px", { lineHeight: "48px" }],
      },
      animation: {
        scanline: "scanline 8s linear infinite",
        flicker: "flicker 0.15s infinite",
        "crt-on": "crt-on 0.5s ease-out",
        "sprite-cycle": "sprite-cycle 0.5s steps(4) infinite",
        "blink-cursor": "blink-cursor 1s steps(2) infinite",
        "score-up": "score-up 0.3s ease-out",
        "pixel-fade": "pixel-fade 0.3s steps(4)",
        "title-blink": "title-blink 1.5s steps(2) infinite",
        "star-twinkle": "star-twinkle 2s steps(3) infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.97" },
        },
        "crt-on": {
          "0%": {
            transform: "scaleY(0.005) scaleX(0)",
            filter: "brightness(30)",
          },
          "40%": {
            transform: "scaleY(0.005) scaleX(1)",
            filter: "brightness(10)",
          },
          "60%": { transform: "scaleY(1) scaleX(1)", filter: "brightness(2)" },
          "100%": { transform: "scaleY(1) scaleX(1)", filter: "brightness(1)" },
        },
        "sprite-cycle": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "-128px 0" },
        },
        "blink-cursor": {
          "0%, 49%": { borderColor: "currentColor" },
          "50%, 100%": { borderColor: "transparent" },
        },
        "score-up": {
          "0%": { transform: "scale(1.2)", color: "#5c9c5c" },
          "100%": { transform: "scale(1)", color: "inherit" },
        },
        "pixel-fade": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "title-blink": {
          "0%, 70%": { opacity: "1" },
          "71%, 100%": { opacity: "0" },
        },
        "star-twinkle": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      borderRadius: {
        crt: "8px",
        pixel: "0px",
        console: "12px",
      },
      boxShadow: {
        "crt-glow":
          "0 0 60px rgba(92, 156, 92, 0.3), inset 0 0 60px rgba(0,0,0,0.4)",
        "crt-inset": "inset 0 0 100px rgba(0,0,0,0.5)",
        "pixel-glow": "0 0 8px rgba(172, 80, 48, 0.6)",
        "wood-inset": "inset 0 2px 4px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
