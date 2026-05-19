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
  // NEUTRAL — Paleta cálida apagada (marrón ámbar editorial)
  neutral: {
    accent: "#B87837",
    accentRgb: "184,120,55",
    accentDim: "#8C5A28",
    glow: "rgba(184,120,55,0.18)",
    tint: "rgba(184,120,55,0.06)",
    tintWeak: "rgba(184,120,55,0.03)",
    bg: "#201D19",
    fg: "#D2C2AA",
    fgMuted: "#8F7B63",
    fgDim: "#685845",
    card: "#24201B",
    border: "rgba(173,122,53,0.18)",
    borderHover: "rgba(184,120,55,0.35)",
    inputBorder: "rgba(173,122,53,0.15)",
    bodyBg: "#1C1A17",
    headerBg: "#1C1A17",
    label: "Neutral",
  },
  // ESTUDIO — Concentración (Superficie mineral pétreo, gris claro roto)
  // Interfaz mineral, silenciosa, ligeramente marmórea, mate.
  // Caliza clara, mármol gris lavado, piedra arquitectónica.
  // FRÍA desaturada — sin dominante amarilla, sin beige, sin crema.
  estudio: {
    accent: "#6D879D",
    accentRgb: "109,135,157",
    accentDim: "#577385",
    glow: "rgba(109,135,157,0.05)",
    tint: "rgba(109,135,157,0.04)",
    tintWeak: "rgba(109,135,157,0.02)",
    bg: "#E4E1DB",
    fg: "#5E6B78",
    fgMuted: "#8490A0",
    fgDim: "#AEB8C4",
    card: "#ECE9E4",
    border: "rgba(115,125,138,0.16)",
    borderHover: "rgba(109,135,157,0.32)",
    inputBorder: "rgba(115,125,138,0.16)",
    bodyBg: "#F3F1ED",
    headerBg: "#F3F1ED",
    label: "Concentración",
  },
  // BUSQUEDA — Trabajo (Ámbar cálido con más presencia atmosférica)
  // Misma base cálida que neutral pero con mayor brillo ambiental,
  // glow más evidente, partículas más abundantes y acentos más intensos.
  busqueda: {
    accent: "#C08A4D",
    accentRgb: "192,138,77",
    accentDim: "#9A6B35",
    glow: "rgba(184,120,55,0.22)",
    tint: "rgba(184,120,55,0.08)",
    tintWeak: "rgba(184,120,55,0.04)",
    bg: "#201D19",
    fg: "#D2C2AA",
    fgMuted: "#8F7B63",
    fgDim: "#685845",
    card: "#24201B",
    border: "rgba(173,122,53,0.18)",
    borderHover: "rgba(184,120,55,0.40)",
    inputBorder: "rgba(173,122,53,0.18)",
    bodyBg: "#1C1A17",
    headerBg: "#1C1A17",
    label: "Trabajo",
  },
  // DESCANSO — Verde oliva ennegrecido, táctico, clandestino, documental.
  // Superficie oscura con dominante oliva, baja opacidad, sin glow.
  // Sensación militar silenciosa, no cyberpunk ni gaming.
  descanso: {
    accent: "#9AA66B",
    accentRgb: "154,166,107",
    accentDim: "#88955C",
    glow: "rgba(154,166,107,0.14)",
    tint: "rgba(154,166,107,0.05)",
    tintWeak: "rgba(154,166,107,0.02)",
    bg: "#0B120B",
    fg: "#AAB38B",
    fgMuted: "#7F876C",
    fgDim: "#5D6654",
    card: "#0D140D",
    border: "rgba(124,148,96,0.18)",
    borderHover: "rgba(154,166,107,0.32)",
    inputBorder: "rgba(124,148,96,0.14)",
    bodyBg: "#070E08",
    headerBg: "#070E08",
    label: "Descanso",
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
