// src/cosmetics/palette.js

// ——— Dice Skins (yours, unchanged) ———
export const DICE_SKINS = {
  default: { bg: "#ffffff", border: "#1f2937", text: "#0f172a" },
  gold:    { bg: "#F6E27A", border: "#B08900", text: "#1f2937" },
  neon:    { bg: "#e7ff4f", border: "#00bf63", text: "#0b1020" },
  carbon:  { bg: "#2b2f36", border: "#111318", text: "#e5e7eb" },
};

// ——— Tile Themes (yours, unchanged) ———
export const TILE_THEMES = {
  default: { openBg: "#ffffff", closedBg: "#f1f5f9", border: "#d1d5db", text: "#0f172a" },
  slate:   { openBg: "#e2e8f0", closedBg: "#cbd5e1", border: "#94a3b8", text: "#0f172a" },
  glass:   { openBg: "rgba(255,255,255,0.6)", closedBg: "rgba(226,232,240,0.5)", border: "rgba(148,163,184,0.6)", text: "#0f172a" },
};

// ——— App Theme Presets (NEW) ———
// Use ids like "default" (always available) and "midnight" (example unlock)
export const THEME_PRESETS = {
  default: {
    mode: "light",
    bg: "#f7f8fb",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#475569",
    primary: "#4f46e5",
    border: "#e5e7eb",
    tile: "#eef2ff",
    tileClosed: "#e2e8f0",
    diceBg: "#ffffff",
    radius: 14,
  },
  midnight: {
    mode: "dark",
    bg: "#0b1020",
    card: "#121831",
    text: "#e5e7eb",
    subtext: "#94a3b8",
    primary: "#7c3aed",
    border: "#1f2a44",
    tile: "#17203a",
    tileClosed: "#10172a",
    diceBg: "#0f172a",
    radius: 14,
  },
};

// ——— Confetti types (names only; renderer is ConfettiOverlay) ———
export const CONFETTI = {
  sparkles: "sparkles",
  fireworks: "fireworks",
  burst: "burst",
};
