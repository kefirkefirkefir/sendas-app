"use client";

import { useGameStore, type GameMode } from "@/lib/game-store";
import { useModeColors } from "@/hooks/use-mode-colors";
import { getAudioEngine } from "@/lib/audio-engine";
import { motion } from "framer-motion";
import {
  CircleDot,
  BookOpen,
  Briefcase,
  Coffee,
} from "lucide-react";

interface ModeDef {
  value: GameMode;
  xfilesLabel: string;
  renaissanceLabel: string;
  icon: React.ReactNode;
  description: string;
}

const MODES: ModeDef[] = [
  {
    value: "neutral",
    xfilesLabel: "Neutral",
    renaissanceLabel: "Giotto",
    icon: <CircleDot className="w-3.5 h-3.5" />,
    description: "Modo por defecto",
  },
  {
    value: "busqueda",
    xfilesLabel: "Trabajo",
    renaissanceLabel: "Gozzoli",
    icon: <Briefcase className="w-3.5 h-3.5" />,
    description: "Energía motivacional",
  },
  {
    value: "estudio",
    xfilesLabel: "Concentración",
    renaissanceLabel: "Piero",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    description: "Enfoque profundo",
  },
  {
    value: "descanso",
    xfilesLabel: "Descanso",
    renaissanceLabel: "Tiziano",
    icon: <Coffee className="w-3.5 h-3.5" />,
    description: "Relajación total",
  },
];

export default function ModeSelector() {
  const { currentMode, setMode, audioEnabled, aestheticTheme } = useGameStore();
  const mc = useModeColors();

  const handleModeChange = (mode: GameMode) => {
    setMode(mode);
    const engine = getAudioEngine();
    if (audioEnabled && engine.initialized) {
      engine.setMode(mode);
    }
  };

  return (
    <div className="flex gap-1.5">
      {MODES.map((mode) => {
        const isActive = currentMode === mode.value;
        const label = aestheticTheme === "renaissance" ? mode.renaissanceLabel : mode.xfilesLabel;

        return (
          <motion.button
            key={mode.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleModeChange(mode.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[10px] transition-all cursor-pointer ${
              isActive
                ? ""
                : "hover:border-[rgba(255,255,255,0.15)]"
            }`}
            style={
              isActive
                ? {
                    borderColor: mc.accent,
                    color: mc.accent,
                    background: mc.glow,
                    boxShadow: `0 0 10px ${mc.glow}`,
                  }
                : {
                    borderColor: "rgba(255,255,255,0.05)",
                    color: mc.fgMuted,
                  }
            }
            data-tooltip={mode.description}
          >
            {mode.icon}
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
