"use client";

import { useState } from "react";
import { useGameStore, type GameMode } from "@/lib/game-store";
import type { AestheticTheme } from "@/config/theme-config";
import { useModeColors } from "@/hooks/use-mode-colors";
import { motion } from "framer-motion";
import { Paintbrush } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

// ─── Mode color previews ───
const MODE_BAR_COLORS: { mode: GameMode; xfLabel: string; rnLabel: string; color: string; glow: string; rnColor: string; rnGlow: string }[] = [
  { mode: "neutral",   xfLabel: "Neutral",       rnLabel: "Giotto",            color: "#fbbf24", glow: "rgba(251,191,36,0.3)",  rnColor: "#C9A84C", rnGlow: "rgba(201,168,76,0.15)" },
  { mode: "busqueda",  xfLabel: "Trabajo",       rnLabel: "Gozzoli",           color: "#00ff41", glow: "rgba(0,255,65,0.35)",    rnColor: "#D4AF8C", rnGlow: "rgba(212,175,140,0.15)" },
  { mode: "estudio",   xfLabel: "Concentración",  rnLabel: "Piero",            color: "#3b82f6", glow: "rgba(59,130,246,0.3)",   rnColor: "#b67f46", rnGlow: "rgba(182,127,70,0.15)" },
  { mode: "descanso",  xfLabel: "Descanso",      rnLabel: "Tiziano",           color: "#a78bfa", glow: "rgba(167,139,250,0.3)",  rnColor: "#8e997a", rnGlow: "rgba(142,153,122,0.15)" },
];

export default function ThemeSelector() {
  const { aestheticTheme, setAestheticTheme } = useGameStore();
  const mc = useModeColors();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>

      <DialogContent
        className="xfiles-card max-w-md"
        style={{
          background: "linear-gradient(145deg, #0c0b08 0%, #0a0908 100%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-sm flex items-center gap-2" style={{ color: mc.accent }}>
            <Paintbrush className="w-4 h-4" />
            Colección de Temas
          </DialogTitle>
        </DialogHeader>

        <p className="font-mono text-[10px] text-[#4a5a4a] tracking-wider -mt-1">
          Selecciona una estética para tu expediente
        </p>

        {/* Theme cards */}
        <div className="space-y-3 mt-2">
          {(Object.keys(THEME_META) as AestheticTheme[]).map((themeKey) => {
            const meta = THEME_META[themeKey];
            const isActive = aestheticTheme === themeKey;

            return (
              <motion.button
                key={themeKey}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setAestheticTheme(themeKey);
                }}
                className="w-full text-left rounded-lg p-4 transition-all cursor-pointer"
                style={{
                  border: `1px solid ${isActive ? meta.accent : `rgba(${mc.accentRgb},0.1)`}`,
                  background: isActive
                    ? `rgba(${mc.accentRgb},0.06)`
                    : "rgba(0,0,0,0.25)",
                  boxShadow: isActive ? `0 0 16px rgba(${mc.accentRgb},0.12)` : "none",
                }}
              >
                {/* Theme name + active indicator */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: meta.accent,
                        boxShadow: isActive ? `0 0 8px ${meta.accent}` : "none",
                      }}
                    />
                    <span
                      className="font-mono text-[13px] font-bold tracking-wider"
                      style={{ color: isActive ? meta.accent : "#8a9a8a" }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {isActive && (
                    <span
                      className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded"
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
                <p className="font-mono text-[10px] text-[#4a5a4a] tracking-[0.1em] mb-2">
                  {meta.subtitle}
                </p>

                {/* Sensory description */}
                <p className="font-mono text-[10px] text-[#6b8a6b] leading-relaxed mb-3">
                  {meta.sensory}
                </p>

                {/* 4 mode color bars — composition */}
                <div className="flex gap-1.5">
                  {MODE_BAR_COLORS.map((m) => {
                    const isRnPreview = themeKey === "renaissance";
                    const barColor = isRnPreview ? m.rnColor : m.color;
                    const barGlow = isRnPreview ? m.rnGlow : m.glow;
                    const barLabel = isRnPreview ? m.rnLabel : m.xfLabel;
                    return (
                      <div key={m.mode} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: barColor,
                            boxShadow: isActive ? `0 0 8px ${barGlow}` : "none",
                            opacity: isActive ? 1 : 0.4,
                          }}
                        />
                        <span className="font-mono text-[8px] text-[#3a4a3a] uppercase tracking-wider">
                          {barLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer — museum catalog number */}
        <div
          className="flex justify-between items-center pt-2 mt-1"
          style={{ borderTop: `1px solid rgba(${mc.accentRgb},0.06)` }}
        >
          <span className="font-mono text-[8px] text-[#2a3a2a] tracking-widest uppercase">
            Cat. N. aesthetic-001
          </span>
          <span className="font-mono text-[8px] text-[#2a3a2a] tracking-widest">
            {aestheticTheme === "xfiles" ? "FX/1993" : "RN/1308"}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
