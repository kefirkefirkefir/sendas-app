"use client";

import { useGameStore } from "@/lib/game-store";
import { THEME_TEXTS, type ThemeTexts } from "@/config/theme-texts";

export function useThemeText(): ThemeTexts {
  const aestheticTheme = useGameStore((s) => s.aestheticTheme);
  return THEME_TEXTS[aestheticTheme] ?? THEME_TEXTS["xfiles"];
}
