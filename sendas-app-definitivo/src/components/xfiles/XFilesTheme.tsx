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
          "--mode-glow": mc.glow,
          "--mode-tint": mc.tint,
          "--mode-bg": mc.bg,
        } as React.CSSProperties
      }
    >
      <div
        className={`fixed inset-0 z-[-1] ${modeTintClass} transition-colors duration-1000`}
      />
      {children}
    </div>
  );
}
