"use client";

import { useGameStore } from "@/lib/game-store";
import { getRank, getLevelProgress } from "@/lib/rank-system";
import { useThemeText } from "@/hooks/use-theme-text";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";

export default function AgentProfile() {
  const { playerName, level, xp, xpToNextLevel, setPlayerName } =
    useGameStore();
  const mc = useModeColors();
  const t = useThemeText();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const inputRef = useRef<HTMLInputElement>(null);

  const rank = getRank(level, t.ranks);
  const progress = getLevelProgress(level, xp);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setEditing(false);
  };

  const displayName = playerName || "Agente X";

  return (
    <div className="w-full">
      {/* Agent name + rank */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Shield className="w-4 h-4 shrink-0" style={{ color: mc.accent }} />
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              onBlur={handleSave}
              className="xfiles-input rounded px-2 py-0.5 text-xs font-mono w-32"
              maxLength={20}
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setTempName(playerName);
              setEditing(true);
            }}
            className="font-mono text-xs hover:underline cursor-pointer text-left"
            style={{ color: mc.accent }}
          >
            {displayName}
          </button>
        )}

        {/* Rank badge */}
        <motion.div
          key={rank.name}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5"
          style={{
            backgroundColor: `rgba(${mc.accentRgb},0.08)`,
            border: `1px solid rgba(${mc.accentRgb},0.25)`,
          }}
        >
          <span className="font-mono text-[10px]" style={{ color: mc.accent }}>
            {rank.name}
          </span>
        </motion.div>
      </div>

      {/* Level + XP bar */}
      <div className="mt-1.5 flex items-center justify-center gap-2.5">
        <div className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" style={{ color: mc.accent }} />
          <span className="font-mono text-[10px] text-[#6b8a6b]">
            NIVEL <span className="text-xs font-bold" style={{ color: mc.accent }}>{level}</span>
          </span>
        </div>

        <div className="w-32 sm:w-40">
          <div className="xfiles-xp-bar rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="xfiles-xp-fill h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="font-mono text-[9px] text-[#4a5a4a]">
              {xp} XP
            </span>
            <span className="font-mono text-[9px] text-[#4a5a4a]">
              {xpToNextLevel} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
