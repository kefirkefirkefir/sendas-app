"use client";

import { useState, useRef } from "react";
import { useGameStore, type GameMode } from "@/lib/game-store";
import type { AestheticTheme } from "@/config/theme-config";
import { useModeColors } from "@/hooks/use-mode-colors";
import { motion, AnimatePresence } from "framer-motion";
import { Paintbrush } from "lucide-react";

// ─── Theme sensory descriptions ───
const THEME_META: Record<AestheticTheme, {
  label: string;
  subtitle: string;
  sensory: string;
  accent: string;
}> = {
  xfiles: {
    label: "Expedientes X",
    subtitle: "TRUST NO ONE",
    sensory: "Oscuridad fosforescente, estática de radio y el aroma a café rancio de un sótano del FBI. La verdad está ahí fuera.",
    accent: "#fbbf24",
  },
  renaissance: {
    label: "Renacimiento",
    subtitle: "NEL MEZZO DEL CAMMIN",
    sensory: "Oro viejo, incienso y frescor de catedral. El paso de los peregrinos resuena en piedra milenaria bajo la luz de las velas.",
    accent: "#c9a44a",
  },
};

// ─── Mode color previews (same for both themes) ───
const MODE_BAR_COLORS: { mode: GameMode; label: string; color: string; glow: string }[] = [
  { mode: "neutral",   label: "Neutral",     color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { mode: "busqueda",  label: "Búsqueda",    color: "#00ff41", glow: "rgba(0,255,65,0.35)" },
  { mode: "estudio",   label: "Concentración", color: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
  { mode: "descanso",  label: "Descanso",    color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
];

export default function ThemeSelector() {
  const { aestheticTheme, setAestheticTheme } = useGameStore();
  const mc = useModeColors();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 250);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Paintbrush button */}
      <button
        className="w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer"
        style={{
          borderColor: `rgba(${mc.accentRgb},0.25)`,
          backgroundColor: `rgba(${mc.accentRgb},0.08)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.4)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.25)`;
        }}
        data-tooltip="Temas"
      >
        <Paintbrush className="w-3 h-3" style={{ color: mc.accent }} />
      </button>

      {/* Hover dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Invisible backdrop to capture mouse */}
            <div className="fixed inset-0 z-[60]" />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-full right-0 mt-2 z-[70] w-[300px] rounded-lg border overflow-hidden shadow-2xl"
              style={{
                borderColor: `rgba(${mc.accentRgb},0.2)`,
                background: "linear-gradient(145deg, #0c0b08 0%, #0a0908 100%)",
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Header — museum label feel */}
              <div
                className="px-3 pt-3 pb-2"
                style={{ borderBottom: `1px solid rgba(${mc.accentRgb},0.1)` }}
              >
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-3 h-3" style={{ color: mc.accent }} />
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: mc.accent }}
                  >
                    Colección de Temas
                  </span>
                </div>
                <p className="font-mono text-[9px] text-[#4a5a4a] mt-0.5 tracking-wider">
                  Selecciona una estética para tu expediente
                </p>
              </div>

              {/* Theme cards */}
              <div className="p-2 space-y-1.5">
                {(Object.keys(THEME_META) as AestheticTheme[]).map((themeKey) => {
                  const meta = THEME_META[themeKey];
                  const isActive = aestheticTheme === themeKey;

                  return (
                    <button
                      key={themeKey}
                      onClick={() => {
                        setAestheticTheme(themeKey);
                      }}
                      className="w-full text-left rounded-md p-2.5 transition-all cursor-pointer group/card"
                      style={{
                        border: `1px solid ${isActive ? meta.accent : `rgba(${mc.accentRgb},0.08)`}`,
                        background: isActive
                          ? `rgba(${mc.accentRgb},0.06)`
                          : "rgba(0,0,0,0.2)",
                        boxShadow: isActive ? `0 0 12px rgba(${mc.accentRgb},0.1)` : "none",
                      }}
                    >
                      {/* Theme name + active indicator */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: meta.accent,
                              boxShadow: isActive ? `0 0 6px ${meta.accent}` : "none",
                            }}
                          />
                          <span
                            className="font-mono text-[11px] font-bold tracking-wider"
                            style={{ color: isActive ? meta.accent : "#8a9a8a" }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        {isActive && (
                          <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `rgba(${mc.accentRgb},0.1)`,
                              color: mc.accent,
                            }}
                          >
                            Activo
                          </span>
                        )}
                      </div>

                      {/* Subtitle */}
                      <p className="font-mono text-[9px] text-[#4a5a4a] tracking-[0.1em] mb-1.5">
                        {meta.subtitle}
                      </p>

                      {/* Sensory description */}
                      <p className="font-mono text-[9px] text-[#6b8a6b] leading-relaxed mb-2.5">
                        {meta.sensory}
                      </p>

                      {/* 4 mode color bars — composition */}
                      <div className="flex gap-1">
                        {MODE_BAR_COLORS.map((m) => (
                          <div key={m.mode} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-full h-1.5 rounded-full transition-all"
                              style={{
                                backgroundColor: m.color,
                                boxShadow: isActive ? `0 0 6px ${m.glow}` : "none",
                                opacity: isActive ? 1 : 0.45,
                              }}
                            />
                            <span className="font-mono text-[7px] text-[#3a4a3a] uppercase tracking-wider">
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer — museum catalog number */}
              <div
                className="px-3 py-1.5 flex justify-between items-center"
                style={{ borderTop: `1px solid rgba(${mc.accentRgb},0.06)` }}
              >
                <span className="font-mono text-[8px] text-[#2a3a2a] tracking-widest uppercase">
                  Cat. N. aesthetic-001
                </span>
                <span className="font-mono text-[8px] text-[#2a3a2a] tracking-widest">
                  {aestheticTheme === "xfiles" ? "FX/1993" : "RN/1308"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
