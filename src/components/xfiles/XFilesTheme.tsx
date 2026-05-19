"use client";

import { useGameStore } from "@/lib/game-store";
import { useModeColors } from "@/hooks/use-mode-colors";

export default function XFilesTheme({ children }: { children: React.ReactNode }) {
  const currentMode = useGameStore((s) => s.currentMode);
  const aestheticTheme = useGameStore((s) => s.aestheticTheme);
  const mc = useModeColors();

  const isRenaissance = aestheticTheme === "renaissance";
  const themeClass = isRenaissance ? "renaissance-theme" : "xfiles-theme";
  const modeTintClass = `mode-tint-${currentMode}`;

  return (
    <div
      className={`${themeClass} ${modeTintClass} transition-colors duration-500`}
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
          "--mode-header-bg": mc.headerBg,
          "--mode-accent-mid": isRenaissance ? "#C08A4D" : mc.accent,
          "--mode-accent-light": isRenaissance ? "#D09042" : mc.accent,
        } as React.CSSProperties
      }
    >
      <div
        className="fixed inset-0 z-[-1] transition-colors duration-500"
        style={{ backgroundColor: mc.bodyBg }}
      />
      {children}
    </div>
  );
}
