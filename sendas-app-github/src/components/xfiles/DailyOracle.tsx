"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useGameStore, type Stats } from "@/lib/game-store";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Flame, Zap, Crown, Briefcase, ShieldCheck, HeartPulse, Users, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";
import type { ThemeTexts } from "@/config/theme-texts";

// Days with no trabajo/oposicion/asociacion → salud decays (bad habits from inactivity)
function countBlankProductiveDays(
  dailyActivity: { date: string; category: keyof Stats; missionsCompleted: number }[],
): number {
  if (dailyActivity.length === 0) return 0;
  const uniqueDates = [...new Set(dailyActivity.map(d => d.date))].sort();
  const firstDate = new Date(uniqueDates[0] + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const productiveKeys: (keyof Stats)[] = ["trabajo", "oposicion", "asociacion"];
  let blankDays = 0;
  const current = new Date(firstDate);
  while (current <= today) {
    const dateStr = current.toISOString().slice(0, 10);
    const hasProductive = dailyActivity.some(
      d => d.date === dateStr && productiveKeys.includes(d.category) && d.missionsCompleted > 0
    );
    if (!hasProductive) blankDays++;
    current.setDate(current.getDate() + 1);
  }
  return blankDays;
}

interface StatConfig {
  key: keyof Stats;
  label: string;
  icon: LucideIcon;
  color: string;
}

const STAT_CONFIG: StatConfig[] = [
  { key: "trabajo", label: "Trabajo", icon: Briefcase, color: "#4ade80" },
  { key: "oposicion", label: "Estudio", icon: ShieldCheck, color: "#22d3ee" },
  { key: "salud", label: "Salud", icon: HeartPulse, color: "#ef4444" },
  { key: "asociacion", label: "Voluntariado", icon: Users, color: "#fbbf24" },
  { key: "ocio", label: "Ocio", icon: Radio, color: "#a78bfa" },
];

const RANK_ICONS: LucideIcon[] = [Zap, Eye, Flame, Crown, Crown, Crown];

function getRank(totalPower: number, ranks: { min: number; name: string }[]) {
  let rank = ranks[0];
  for (const r of ranks) {
    if (totalPower >= r.min) rank = r;
  }
  return rank;
}

function getNextRankThreshold(totalPower: number, ranks: { min: number; name: string }[]): number | null {
  for (const r of ranks) {
    if (totalPower < r.min) return r.min;
  }
  return null;
}

function getResultText(total: number, statKey: keyof Stats, oracle: ThemeTexts['oracle']): string {
  const labels = oracle[statKey];
  if (total >= 28) return labels[28] || oracle.generic[28] || "";
  if (total >= 24) return labels[24] || oracle.generic[24] || "";
  if (total >= 18) return labels[18] || oracle.generic[18] || "";
  if (total >= 12) return labels[12] || oracle.generic[12] || "";
  if (total >= 6) return labels[6] || oracle.generic[6] || "";
  return labels[2] || oracle.generic[2] || "";
}

const HEALTH_PENALTY_RATE = 0.15; // per blank productive day, subtracted from salud score (0-10)

export default function DailyOracle() {
  const getDailyScores = useGameStore((s) => s.getDailyScores);
  const dailyActivity = useGameStore((s) => s.dailyActivity);
  const selectedClass = useGameStore((s) => s.selectedClass);
  const resetVersion = useGameStore((s) => s.resetVersion);
  const mc = useModeColors();
  const t = useThemeText();
  const currentMode = useGameStore((s) => s.currentMode);

  const ORACLE_BG: Record<string, string> = {
    neutral: "rgba(15,13,8,0.85)",
    busqueda: "rgba(8,15,10,0.85)",
    estudio: "rgba(8,10,18,0.85)",
    descanso: "rgba(12,10,18,0.85)",
  };
  const oracleBg = ORACLE_BG[currentMode] ?? ORACLE_BG.neutral;

  // CSS filters to tint the green d20 icon to each mode's accent color
  // sepia(1) converts to ~hue 40° (warm sepia). hue-rotate shifts from there.
  const DICE_FILTER: Record<string, string> = {
    neutral: "sepia(1) saturate(1.8)",                  // sepia ≈ amber
    busqueda: "sepia(1) hue-rotate(75deg) saturate(2)",  // → green (~115°)
    estudio: "sepia(1) hue-rotate(180deg) saturate(1.8)", // → blue (~220°)
    descanso: "sepia(1) hue-rotate(230deg) saturate(1.6)", // → purple (~270°)
  };
  const DICE_FILTER_ROLL: Record<string, string> = {
    neutral: "sepia(1) saturate(2.2) brightness(1.2)",
    busqueda: "sepia(1) hue-rotate(75deg) saturate(2.5) brightness(1.2)",
    estudio: "sepia(1) hue-rotate(180deg) saturate(2.2) brightness(1.2)",
    descanso: "sepia(1) hue-rotate(230deg) saturate(2) brightness(1.2)",
  };

  const [selectedStat, setSelectedStat] = useState<keyof Stats | null>("trabajo");
  const [rolling, setRolling] = useState(false);
  const diceFilter = rolling
    ? (DICE_FILTER_ROLL[currentMode] ?? DICE_FILTER_ROLL.neutral)
    : (DICE_FILTER[currentMode] ?? DICE_FILTER.neutral);
  const [result, setResult] = useState<{
    d20: number;
    modifier: number;
    total: number;
    statKey: keyof Stats;
  } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Clear result on reset
  useEffect(() => {
    setResult(null);
    setShowOverlay(false);
  }, [resetVersion]);

  const { scores, totalPower, rank, nextThreshold, healthPenalty, rankIconIdx } = (() => {
    const rawScores = getDailyScores();
    // Health handicap: blank productive days reduce salud score
    const blankDays = countBlankProductiveDays(dailyActivity);
    const penalty = Math.min(rawScores.salud.score, Math.round(blankDays * HEALTH_PENALTY_RATE));
    const s = {
      ...rawScores,
      salud: { ...rawScores.salud, score: Math.max(0, rawScores.salud.score - penalty) },
    };
    const tp = Object.values(s).reduce((sum, v) => sum + v.score, 0);
    const r = getRank(tp, t.oracleRanks);
    const nt = getNextRankThreshold(tp, t.oracleRanks);
    const rankIconIdx = t.oracleRanks.findIndex((rank) => rank === r) ?? 0;
    return { scores: s, totalPower: tp, rank: r, nextThreshold: nt, healthPenalty: penalty, rankIconIdx };
  })();

  const RankIcon = RANK_ICONS[rankIconIdx] ?? Zap;

  const modifier = selectedStat ? scores[selectedStat].score : 0; // today's effective score (carryover + today missions - penalty)

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setShowOverlay(false);

    let ticks = 0;
    const maxTicks = 15;
    const interval = setInterval(() => {
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        if (!selectedStat) { clearInterval(interval); setRolling(false); return; }
        setResult({ d20: finalRoll, modifier, total: finalRoll + modifier, statKey: selectedStat });
        setRolling(false);
        // Show overlay after rolling finishes
        setTimeout(() => setShowOverlay(true), 150);
      }
    }, 80);
  }, [rolling, modifier, selectedStat]);

  const isCrit = result && result.d20 === 20;
  const isFumble = result && result.d20 === 1;

  return (
    <div className="xfiles-card rounded-lg p-3 relative">
      {/* Header + Modifier */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" style={{ color: mc.accent }} />
          <h2 className="font-mono text-[10px] uppercase tracking-wider" style={{ color: mc.accent }}>
            {t.oracleTitle}
          </h2>
        </div>
        <div className="font-mono text-[10px] text-[#8a9a8a]">
          Mod:{" "}
          <span
            className={`font-bold ${
              selectedStat === "salud" && healthPenalty > 0
                ? "text-[#ef4444]"
                : modifier >= 8
                ? "text-[#4ade80]"
                : modifier >= 4
                ? "text-[#fbbf24]"
                : modifier > 0
                ? "text-[#8a9a8a]"
                : "text-[#ef4444]"
            }`}
          >
            {modifier > 0 ? `+${modifier}` : modifier}
          </span>{" "}
          <span className="text-[#4a5a4a]">
            ({STAT_CONFIG.find((s) => s.key === selectedStat)?.label})
          </span>
          {selectedStat === "salud" && healthPenalty > 0 && (
            <span className="text-red-500/70 ml-1 text-[9px]">
              (-{healthPenalty})
            </span>
          )}
        </div>
      </div>

      {/* Yesterday's stat bars (context for modifiers) */}
      <div className="space-y-1 mb-2">
        {STAT_CONFIG.map((stat, idx) => {
          const data = scores[stat.key];
          const filled = data.score;
          const empty = 10 - filled;
          const isActive = selectedStat === stat.key;
          const isHealthPenalized = stat.key === "salud" && healthPenalty > 0;
          return (
            <motion.button
              key={stat.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              onClick={() => setSelectedStat(selectedStat === stat.key ? null : stat.key)}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-2 w-full rounded px-1 py-0.5 transition-colors cursor-pointer ${
                isActive ? "bg-[rgba(255,255,255,0.04)]" : "hover:bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <stat.icon className="w-[10px] h-[10px] shrink-0" style={{ color: isActive ? (isHealthPenalized && stat.key === "salud" ? "#ef4444" : stat.color) : "#4a5a4a" }} />
                <span className={`font-mono text-[10px] shrink-0 text-left transition-colors ${
                  isActive ? "text-white" : "text-[#6b8a6b]"
                }`}
                  style={isActive ? { color: isHealthPenalized ? "#ef4444" : stat.color } : undefined}
                >
                  {stat.label}
                </span>
              </div>
              <div className="flex gap-[3.6px] justify-end">
                {Array.from({ length: filled }).map((_, i) => (
                  <motion.div
                    key={`f-${i}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    className="w-[7px] h-[7px] rounded-[1px]"
                    style={{
                      backgroundColor: isHealthPenalized && isActive
                        ? "#ef4444"
                        : isActive ? stat.color : `${stat.color}66`,
                    }}
                  />
                ))}
                {Array.from({ length: empty }).map((_, i) => (
                  <div
                    key={`e-${i}`}
                    className="w-[7px] h-[7px] rounded-[1px] bg-[rgba(255,255,255,0.06)]"
                  />
                ))}
              </div>
              <div className="flex flex-col items-end w-8 shrink-0">
                <span
                  className={`font-mono text-[10px] font-bold ${
                    filled >= 10 ? "" : "text-[rgba(255,255,255,0.4)]"
                  }`}
                  style={isHealthPenalized
                    ? { color: "#ef4444" }
                    : filled >= 10
                    ? { color: stat.color }
                    : undefined}
                >
                  {filled}/10
                </span>
                {isHealthPenalized && (
                  <span className="font-mono text-[8px] text-red-500/70">
                    -{healthPenalty}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Power & rank */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <RankIcon
            className="w-2.5 h-2.5"
            style={{ color: totalPower >= 30 ? mc.accent : "#4a5a4a" }}
          />
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: totalPower >= 30 ? mc.accent : "#4a5a4a" }}
          >
            {rank.name}
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold" style={{ color: mc.accent }}>
          {totalPower}/50
          {nextThreshold !== null && (
            <span className="text-[#4a5a4a] font-normal ml-1">→ {nextThreshold}</span>
          )}
        </span>
      </div>

      {/* Separator */}
      <div className="border-t border-[rgba(255,255,255,0.06)] my-2" />

      {/* Dice button — centered */}
      <div className="flex justify-center">
        <motion.button
          onClick={rollDice}
          disabled={rolling}
          whileTap={!rolling ? { scale: 0.9 } : {}}
          whileHover={!rolling ? { scale: 1.08 } : {}}
          className={`relative shrink-0 cursor-pointer transition-all select-none ${
            rolling
              ? ""
              : "text-[#6b8a6b] hover:text-[#c8d6c0]"
          }`}
          style={{
            filter: rolling
              ? `${diceFilter} drop-shadow(0 0 10px rgba(${mc.accentRgb},0.6))`
              : `drop-shadow(0 0 4px rgba(${mc.accentRgb},0.3))`,
          }}
        >
          <motion.img
            src="/d20-icon.png"
            alt="D20"
            className="w-10 h-10 mx-auto"
            draggable={false}
            style={{ filter: diceFilter }}
            animate={rolling ? {
              rotate: [0, 90, -90, 180, -180, 270, -270, 360],
              scale: [1, 1.15, 0.9, 1.2, 0.85, 1.15, 0.95, 1],
            } : {}}
            transition={rolling ? {
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            } : {}}
          />
          <motion.div
            animate={rolling ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={rolling ? { duration: 0.4, repeat: Infinity } : {}}
            className={`font-mono text-[8px] mt-1 ${rolling ? "" : "text-[#4a5a4a]"}`}
            style={rolling ? { color: mc.accent } : undefined}
          >
            {rolling ? "LANZANDO..." : "TIRAR"}
          </motion.div>
        </motion.button>
      </div>

      {/* Result overlay — covers the entire card */}
      <AnimatePresence>
        {showOverlay && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowOverlay(false)}
            className="absolute inset-0 z-10 cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xfiles-card rounded-lg w-full h-full text-center overflow-hidden flex flex-col items-center justify-center"
              style={{ background: oracleBg }}
            >
              {/* Stat label */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-mono text-[9px] uppercase tracking-widest text-[#4a5a4a] mb-1"
              >
                {STAT_CONFIG.find((s) => s.key === result.statKey)?.label}
              </motion.div>

              {/* Total result — the main number */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 200 }}
                className="font-mono text-4xl font-bold leading-none"
                style={{
                  color: isCrit ? "#fbbf24" : isFumble ? "#ef4444" : mc.accent,
                  textShadow: isCrit
                    ? "0 0 20px rgba(251,191,36,0.7), 0 0 40px rgba(251,191,36,0.3)"
                    : isFumble
                    ? "0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.2)"
                    : `0 0 20px rgba(${mc.accentRgb},0.5), 0 0 40px rgba(${mc.accentRgb},0.2)`,
                }}
              >
                {isCrit && `${t.oracle.critico} `}
                {isFumble && `${t.oracle.pifia} `}
                {result.total}
              </motion.div>

              {/* Roll breakdown — small */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-mono text-[10px] text-[#5a6a5a] mt-1"
              >
                D20: {result.d20} {result.modifier >= 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`}
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="border-t border-[rgba(255,255,255,0.08)] my-2 mx-8 w-full"
              />

              {/* Phrase */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="font-mono text-[11px] leading-relaxed px-4"
                style={{ color: isCrit ? "#fbbf24" : isFumble ? "#ef4444" : mc.accent }}
              >
                {getResultText(result.total, result.statKey, t.oracle)}
              </motion.div>

              {/* Dismiss hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="font-mono text-[8px] text-[#3a4a3a] mt-2"
              >
                toca para cerrar
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
