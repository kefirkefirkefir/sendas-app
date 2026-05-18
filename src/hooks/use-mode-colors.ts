"use client";

import { useGameStore, type GameMode } from "@/lib/game-store";

const XFILES_MODE_COLORS: Record<GameMode, {
  accent: string;
  accentRgb: string;
  accentDim: string;
  glow: string;
  tint: string;
  tintWeak: string;
  bg: string;
}> = {
  neutral: {
    accent: "#fbbf24",
    accentRgb: "251,191,36",
    accentDim: "#a37e1a",
    glow: "rgba(251,191,36,0.3)",
    tint: "rgba(251,191,36,0.12)",
    tintWeak: "rgba(251,191,36,0.04)",
    bg: "rgba(15,13,8,0.85)",
  },
  estudio: {
    accent: "#3b82f6",
    accentRgb: "59,130,246",
    accentDim: "#2563eb",
    glow: "rgba(59,130,246,0.3)",
    tint: "rgba(30,60,180,0.14)",
    tintWeak: "rgba(30,60,180,0.05)",
    bg: "rgba(8,10,18,0.85)",
  },
  busqueda: {
    accent: "#00ff41",
    accentRgb: "0,255,65",
    accentDim: "#00cc33",
    glow: "rgba(0,255,65,0.35)",
    tint: "rgba(0,255,65,0.12)",
    tintWeak: "rgba(0,255,65,0.04)",
    bg: "rgba(8,15,10,0.85)",
  },
  descanso: {
    accent: "#a78bfa",
    accentRgb: "167,139,250",
    accentDim: "#8b5cf6",
    glow: "rgba(167,139,250,0.3)",
    tint: "rgba(167,139,250,0.14)",
    tintWeak: "rgba(167,139,250,0.05)",
    bg: "rgba(12,10,18,0.85)",
  },
};

export function useModeColors() {
  const currentMode = useGameStore((s) => s.currentMode);
  return XFILES_MODE_COLORS[currentMode];
}
