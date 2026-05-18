"use client";

import { useGameStore, type GameMode } from "@/lib/game-store";
import { getAudioEngine } from "@/lib/audio-engine";
import { motion } from "framer-motion";
import {
  CircleDot,
  BookOpen,
  Briefcase,
  Coffee,
} from "lucide-react";

const MODES: {
  value: GameMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  glowColor: string;
}[] = [
  {
    value: "neutral",
    label: "Neutral",
    icon: <CircleDot className="w-3.5 h-3.5" />,
    description: "Modo por defecto",
    color: "#fbbf24",
    glowColor: "rgba(251,191,36,0.3)",
  },
  {
    value: "busqueda",
    label: "Trabajo",
    icon: <Briefcase className="w-3.5 h-3.5" />,
    description: "Energía motivacional",
    color: "#00ff41",
    glowColor: "rgba(0,255,65,0.35)",
  },
  {
    value: "estudio",
    label: "Concentración",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    description: "Enfoque profundo",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.3)",
  },
  {
    value: "descanso",
    label: "Descanso",
    icon: <Coffee className="w-3.5 h-3.5" />,
    description: "Relajación total",
    color: "#a78bfa",
    glowColor: "rgba(167,139,250,0.3)",
  },
];

export default function ModeSelector() {
  const { currentMode, setMode, audioEnabled } = useGameStore();

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
          return (
            <motion.button
              key={mode.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeChange(mode.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[10px] transition-all cursor-pointer ${
                isActive
                  ? ""
                  : "border-[rgba(255,255,255,0.05)] text-[#6b8a6b] hover:border-[rgba(255,255,255,0.15)]"
              }`}
              style={
                isActive
                  ? {
                      borderColor: mode.color,
                      color: mode.color,
                      background: mode.glowColor,
                      boxShadow: `0 0 10px ${mode.glowColor}`,
                    }
                  : undefined
              }
              data-tooltip={mode.description}
            >
              {mode.icon}
              {mode.label}
            </motion.button>
          );
        })}
    </div>
  );
}
