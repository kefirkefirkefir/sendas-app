"use client";

import { useGameStore } from "@/lib/game-store";
import { useModeColors } from "@/hooks/use-mode-colors";

export default function XFilesTheme({ children }: { children: React.ReactNode }) {
  const currentMode = useGameStore((s) => s.currentMode);
  const mc = useModeColors();

  const modeTintClass = `mode-tint-${currentMode}`;

  return (
    <div
      style={
        {
          "--mode-accent": mc.accent,
          "--mode-accent-rgb": mc.accentRgb,
          "--mode-accent-dim": mc.accentDim,
          "--mode-glow": mc.glow,
          "--mode-tint": mc.tint,
          "--mode-bg": mc.bg,
          "--mode-fg": mc.fg,
          "--mode-fg-muted": mc.fgMuted,
          "--mode-fg-dim": mc.fgDim,
          "--mode-card": mc.card,
          "--mode-border": mc.border,
          "--mode-border-hover": mc.borderHover,
          "--mode-input-border": mc.inputBorder,
          "--mode-body-bg": mc.bodyBg,
        } as React.CSSProperties
      }
    >
      <div
        className={`fixed inset-0 z-[-1] ${modeTintClass} transition-colors duration-1000`}
        style={{ backgroundColor: mc.bodyBg }}
      />
      {children}
    </div>
  );
}
