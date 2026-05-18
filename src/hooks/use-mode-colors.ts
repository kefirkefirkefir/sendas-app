"use client";

import { useGameStore, type GameMode } from "@/lib/game-store";

// ─── Extended mode color interface ───
export interface ModeColors {
  // Core accent
  accent: string;
  accentRgb: string;
  accentDim: string;
  glow: string;
  tint: string;
  tintWeak: string;
  bg: string;
  // Text
  fg: string;           // Primary text (warm for renaissance, green for xfiles)
  fgMuted: string;      // Secondary/muted text
  fgDim: string;        // Very dim text (placeholders, subtle labels)
  // Surfaces
  card: string;
  border: string;
  borderHover: string;
  inputBorder: string;
  bodyBg: string;       // Solid background for body
  headerBg: string;     // Header background
  // Mode label
  label: string;
}

// ═══════════════════════════════════════════
// X-FILES MODE COLORS
// ═══════════════════════════════════════════
const XFILES_MODE_COLORS: Record<GameMode, ModeColors> = {
  neutral: {
    accent: "#fbbf24",
    accentRgb: "251,191,36",
    accentDim: "#a37e1a",
    glow: "rgba(251,191,36,0.3)",
    tint: "rgba(251,191,36,0.12)",
    tintWeak: "rgba(251,191,36,0.04)",
    bg: "rgba(15,13,8,0.85)",
    fg: "#c8d6c0",
    fgMuted: "#6b8a6b",
    fgDim: "#4a5a4a",
    card: "rgba(10,10,8,0.88)",
    border: "rgba(251,191,36,0.15)",
    borderHover: "rgba(251,191,36,0.30)",
    inputBorder: "rgba(251,191,36,0.20)",
    bodyBg: "#0a0a0a",
    headerBg: "rgba(10,10,8,0.96)",
    label: "Neutral",
  },
  estudio: {
    accent: "#3b82f6",
    accentRgb: "59,130,246",
    accentDim: "#2563eb",
    glow: "rgba(59,130,246,0.3)",
    tint: "rgba(30,60,180,0.14)",
    tintWeak: "rgba(30,60,180,0.05)",
    bg: "rgba(8,10,18,0.85)",
    fg: "#c8d6c0",
    fgMuted: "#6b8a6b",
    fgDim: "#4a5a4a",
    card: "rgba(8,10,18,0.88)",
    border: "rgba(59,130,246,0.15)",
    borderHover: "rgba(59,130,246,0.30)",
    inputBorder: "rgba(59,130,246,0.20)",
    bodyBg: "#0a0a0a",
    headerBg: "rgba(8,10,18,0.96)",
    label: "Concentración",
  },
  busqueda: {
    accent: "#00ff41",
    accentRgb: "0,255,65",
    accentDim: "#00cc33",
    glow: "rgba(0,255,65,0.35)",
    tint: "rgba(0,255,65,0.12)",
    tintWeak: "rgba(0,255,65,0.04)",
    bg: "rgba(8,15,10,0.85)",
    fg: "#c8d6c0",
    fgMuted: "#6b8a6b",
    fgDim: "#4a5a4a",
    card: "rgba(8,15,10,0.88)",
    border: "rgba(0,255,65,0.15)",
    borderHover: "rgba(0,255,65,0.30)",
    inputBorder: "rgba(0,255,65,0.20)",
    bodyBg: "#0a0a0a",
    headerBg: "rgba(8,15,10,0.96)",
    label: "Trabajo",
  },
  descanso: {
    accent: "#a78bfa",
    accentRgb: "167,139,250",
    accentDim: "#8b5cf6",
    glow: "rgba(167,139,250,0.3)",
    tint: "rgba(167,139,250,0.14)",
    tintWeak: "rgba(167,139,250,0.05)",
    bg: "rgba(12,10,18,0.85)",
    fg: "#c8d6c0",
    fgMuted: "#6b8a6b",
    fgDim: "#4a5a4a",
    card: "rgba(12,10,18,0.88)",
    border: "rgba(167,139,250,0.15)",
    borderHover: "rgba(167,139,250,0.30)",
    inputBorder: "rgba(167,139,250,0.20)",
    bodyBg: "#0a0a0a",
    headerBg: "rgba(12,10,18,0.96)",
    label: "Descanso",
  },
};

// ═══════════════════════════════════════════
// RENAISSANCE MODE COLORS
// ═══════════════════════════════════════════
const RENAISSANCE_MODE_COLORS: Record<GameMode, ModeColors> = {
  // NEUTRAL — Giotto (Oro puro renacentista)
  neutral: {
    accent: "#C9A84C",
    accentRgb: "201,168,76",
    accentDim: "#9A7B30",
    glow: "rgba(201,168,76,0.12)",
    tint: "rgba(201,168,76,0.08)",
    tintWeak: "rgba(201,168,76,0.04)",
    bg: "rgba(28,26,23,0.95)",
    fg: "#afa18b",
    fgMuted: "#878074",
    fgDim: "#585145",
    card: "rgba(20,18,14,0.88)",
    border: "rgba(201,168,76,0.15)",
    borderHover: "rgba(201,168,76,0.30)",
    inputBorder: "rgba(201,168,76,0.20)",
    bodyBg: "#141210",
    headerBg: "linear-gradient(180deg, rgba(24,20,16,0.96), rgba(18,16,14,0.94))",
    label: "Giotto",
  },
  // ESTUDIO — Piero della Francesca (Ámbar cálido)
  estudio: {
    accent: "#b67f46",
    accentRgb: "182,127,70",
    accentDim: "#965d3b",
    glow: "rgba(182,127,70,0.12)",
    tint: "rgba(182,127,70,0.08)",
    tintWeak: "rgba(182,127,70,0.04)",
    bg: "rgba(31,26,19,0.95)",
    fg: "#90897b",
    fgMuted: "#60615b",
    fgDim: "#3e3d3a",
    card: "rgba(20,18,14,0.88)",
    border: "rgba(182,127,70,0.15)",
    borderHover: "rgba(182,127,70,0.30)",
    inputBorder: "rgba(182,127,70,0.20)",
    bodyBg: "#141210",
    headerBg: "linear-gradient(180deg, rgba(28,22,16,0.96), rgba(20,18,14,0.94))",
    label: "Piero della Francesca",
  },
  // BUSQUEDA — Gozzoli (Dorado rosado / terracota clara)
  busqueda: {
    accent: "#D4AF8C",
    accentRgb: "212,175,140",
    accentDim: "#a08060",
    glow: "rgba(212,175,140,0.12)",
    tint: "rgba(212,175,140,0.08)",
    tintWeak: "rgba(212,175,140,0.04)",
    bg: "rgba(25,22,18,0.95)",
    fg: "#c4b8a0",
    fgMuted: "#7a7060",
    fgDim: "#4a4540",
    card: "rgba(20,18,14,0.88)",
    border: "rgba(212,175,140,0.15)",
    borderHover: "rgba(212,175,140,0.30)",
    inputBorder: "rgba(212,175,140,0.20)",
    bodyBg: "#141210",
    headerBg: "linear-gradient(180deg, rgba(26,22,18,0.96), rgba(20,18,14,0.94))",
    label: "Gozzoli",
  },
  // DESCANSO — Tiziano (Verde oliva)
  descanso: {
    accent: "#8e997a",
    accentRgb: "142,153,122",
    accentDim: "#777e68",
    glow: "rgba(142,153,122,0.12)",
    tint: "rgba(142,153,122,0.08)",
    tintWeak: "rgba(142,153,122,0.04)",
    bg: "rgba(19,22,17,0.95)",
    fg: "#8d9976",
    fgMuted: "#7c836d",
    fgDim: "#4a4e42",
    card: "rgba(20,18,14,0.88)",
    border: "rgba(142,153,122,0.15)",
    borderHover: "rgba(142,153,122,0.30)",
    inputBorder: "rgba(142,153,122,0.20)",
    bodyBg: "#141210",
    headerBg: "linear-gradient(180deg, rgba(20,22,18,0.96), rgba(18,20,16,0.94))",
    label: "Tiziano",
  },
};

// ─── Renaissance stat colors ───
export const RENAISSANCE_STAT_COLORS = {
  trabajo: "#D4AF8C",
  oposicion: "#C47A5C",
  salud: "#C45C5C",
  asociacion: "#C4A45C",
  ocio: "#8CAE6C",
};

export function useModeColors(): ModeColors {
  const currentMode = useGameStore((s) => s.currentMode);
  const aestheticTheme = useGameStore((s) => s.aestheticTheme);

  if (aestheticTheme === "renaissance") {
    return RENAISSANCE_MODE_COLORS[currentMode];
  }
  return XFILES_MODE_COLORS[currentMode];
}
