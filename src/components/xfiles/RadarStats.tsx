"use client";

import { useGameStore, type Stats } from "@/lib/game-store";
import { useModeColors, RENAISSANCE_STAT_COLORS } from "@/hooks/use-mode-colors";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { Clock, TrendingUp } from "lucide-react";
import { useThemeText } from "@/hooks/use-theme-text";

const STAT_LABELS_XFILES: { key: keyof Stats; label: string; color: string }[] = [
  { key: "trabajo", label: "Trabajo", color: "#4ade80" },
  { key: "oposicion", label: "Estudio", color: "#22d3ee" },
  { key: "salud", label: "Salud", color: "#ef4444" },
  { key: "asociacion", label: "Voluntariado", color: "#fbbf24" },
  { key: "ocio", label: "Ocio", color: "#a78bfa" },
];

const STAT_LABELS_RENAISSANCE: { key: keyof Stats; label: string; color: string }[] = [
  { key: "trabajo", label: "Trabajo", color: RENAISSANCE_STAT_COLORS.trabajo },
  { key: "oposicion", label: "Estudio", color: RENAISSANCE_STAT_COLORS.oposicion },
  { key: "salud", label: "Salud", color: RENAISSANCE_STAT_COLORS.salud },
  { key: "asociacion", label: "Voluntariado", color: RENAISSANCE_STAT_COLORS.asociacion },
  { key: "ocio", label: "Ocio", color: RENAISSANCE_STAT_COLORS.ocio },
];

const WEIGHTED_POINTS_FOR_MAX_CUMULATIVE = 150; // 150 weighted pts per category = 100 (4-6 months at 3-4 missions/day total)
const MISSIONS_FOR_MAX_7DAYS = 8; // 8 missions in a week per category = 100 (current pace)
const CLASS_STAT_SCALE = 3; // class stat × 3 = base points on 0-100 radar
const HEALTH_PENALTY_PER_BLANK_DAY = 0.5; // weighted pts deducted from salud per day with no productive activity

function getStatsFromMissions(
  dailyActivity: { date: string; category: keyof Stats; missionsCompleted: number; weightedPoints: number }[],
  dates: string[] | null, // null = all time
  maxRaw: number,
  maxWeighted: number,
): Stats {
  const totals: Record<keyof Stats, number> = {
    trabajo: 0, oposicion: 0, salud: 0, asociacion: 0, ocio: 0,
  };
  const weightedTotals: Record<keyof Stats, number> = {
    trabajo: 0, oposicion: 0, salud: 0, asociacion: 0, ocio: 0,
  };

  const dateSet = dates ? new Set(dates) : null;

  for (const entry of dailyActivity) {
    if (!dateSet || dateSet.has(entry.date)) {
      totals[entry.category] += entry.missionsCompleted;
      weightedTotals[entry.category] += entry.weightedPoints ?? 0;
    }
  }

  return {
    trabajo: Math.min(100, Math.round((totals.trabajo / maxRaw) * 100)),
    oposicion: Math.min(100, Math.round((totals.oposicion / maxRaw) * 100)),
    salud: Math.min(100, Math.round((totals.salud / maxRaw) * 100)),
    asociacion: Math.min(100, Math.round((totals.asociacion / maxRaw) * 100)),
    ocio: Math.min(100, Math.round((totals.ocio / maxRaw) * 100)),
  };
}

function getStatsWeighted(
  dailyActivity: { date: string; category: keyof Stats; weightedPoints: number }[],
  dates: string[] | null,
  maxWeighted: number,
): Stats {
  const totals: Record<keyof Stats, number> = {
    trabajo: 0, oposicion: 0, salud: 0, asociacion: 0, ocio: 0,
  };

  const dateSet = dates ? new Set(dates) : null;

  for (const entry of dailyActivity) {
    if (!dateSet || dateSet.has(entry.date)) {
      totals[entry.category] += entry.weightedPoints ?? 0;
    }
  }

  return {
    trabajo: Math.min(100, Math.round((totals.trabajo / maxWeighted) * 100)),
    oposicion: Math.min(100, Math.round((totals.oposicion / maxWeighted) * 100)),
    salud: Math.min(100, Math.round((totals.salud / maxWeighted) * 100)),
    asociacion: Math.min(100, Math.round((totals.asociacion / maxWeighted) * 100)),
    ocio: Math.min(100, Math.round((totals.ocio / maxWeighted) * 100)),
  };
}

// Days with no trabajo/oposicion/asociacion activity → salud penalty (bad habits from inactivity)
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

function getLast7DaysDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function RadarStats() {
  const dailyActivity = useGameStore((s) => s.dailyActivity);
  const selectedClass = useGameStore((s) => s.selectedClass);
  const aestheticTheme = useGameStore((s) => s.aestheticTheme);
  const mc = useModeColors();
  const t = useThemeText();

  const isRenaissance = aestheticTheme === "renaissance";
  const STAT_LABELS = isRenaissance ? STAT_LABELS_RENAISSANCE : STAT_LABELS_XFILES;
  const classData = t.classes.find((c) => c.id === selectedClass) ?? null;

  const mounted = useMounted();
  const [view, setView] = useState<"cumulative" | "7days">("cumulative");
  const [animatedData, setAnimatedData] = useState<
    Array<{ key: keyof Stats; label: string; color: string; value: number; displayValue: number }>
  >(() => STAT_LABELS.map((s) => ({ ...s, value: 0, displayValue: 0 })));
  const animatedDataRef = useRef(animatedData);

  const sevenDayDates = getLast7DaysDates();
  let missionStats = view === "cumulative"
    ? getStatsWeighted(dailyActivity, null, WEIGHTED_POINTS_FOR_MAX_CUMULATIVE)
    : getStatsFromMissions(dailyActivity, sevenDayDates, MISSIONS_FOR_MAX_7DAYS, MISSIONS_FOR_MAX_7DAYS);

  // Health penalty: blank productive days (no trabajo/oposicion/asociacion) → salud decays
  const blankDays = countBlankProductiveDays(dailyActivity);
  const penaltyPct = Math.round((blankDays * HEALTH_PENALTY_PER_BLANK_DAY / WEIGHTED_POINTS_FOR_MAX_CUMULATIVE) * 100);
  const healthPenalty = Math.min(missionStats.salud, penaltyPct);
  missionStats = { ...missionStats, salud: Math.max(0, missionStats.salud - healthPenalty) };

  // Add class base stats (class stat × 3 = base points)
  const classBase: Stats = classData
    ? {
        trabajo: classData.stats.trabajo * CLASS_STAT_SCALE,
        oposicion: classData.stats.oposicion * CLASS_STAT_SCALE,
        salud: classData.stats.salud * CLASS_STAT_SCALE,
        asociacion: classData.stats.asociacion * CLASS_STAT_SCALE,
        ocio: classData.stats.ocio * CLASS_STAT_SCALE,
      }
    : { trabajo: 0, oposicion: 0, salud: 0, asociacion: 0, ocio: 0 };

  const sourceStats: Stats = {
    trabajo: Math.min(100, missionStats.trabajo + classBase.trabajo),
    oposicion: Math.min(100, missionStats.oposicion + classBase.oposicion),
    salud: Math.min(100, missionStats.salud + classBase.salud),
    asociacion: Math.min(100, missionStats.asociacion + classBase.asociacion),
    ocio: Math.min(100, missionStats.ocio + classBase.ocio),
  };

  // Animate stats on load and when they change
  useEffect(() => {
    if (!mounted) return;

    const targetData = STAT_LABELS.map((s) => ({
      ...s,
      value: sourceStats[s.key],
      classBase: classBase[s.key],
      displayValue: sourceStats[s.key],
    }));

    // Smooth animation from current to target
    const startData = [...animatedDataRef.current];
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

      const newData = startData.map((start, i) => ({
        ...targetData[i],
        value: start.value + (targetData[i].value - start.value) * eased,
        classBase: targetData[i].classBase,
        displayValue: targetData[i].displayValue,
      }));

      setAnimatedData(newData);
      animatedDataRef.current = newData;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [sourceStats, mounted]);

  if (!mounted) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <div className="font-mono text-xs text-[#6b8a6b]">
          CARGANDO DATOS...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-0.5">
        <button
          onClick={() => setView(view === "cumulative" ? "7days" : "cumulative")}
          className="font-mono text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1"
          style={{
            borderColor: view === "7days" ? `rgba(${mc.accentRgb},0.3)` : "rgba(255,255,255,0.08)",
            color: view === "7days" ? mc.accent : mc.fgMuted,
            backgroundColor: view === "7days" ? `rgba(${mc.accentRgb},0.06)` : "transparent",
          }}
        >
          {view === "7days" ? (
            <>
              <Clock className="w-3 h-3" />
              Últimos 7 días
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3" />
              Acumulado
            </>
          )}
        </button>

      </div>

      <motion.div
        className="radar-pulse"
        key={view} // re-mount to restart animation on view change
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={animatedData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke={isRenaissance ? "rgba(173,122,53,0.12)" : "rgba(0, 255, 65, 0.12)"}
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="label"
              tick={{
                fill: isRenaissance ? "#8F7B63" : "#6b8a6b",
                fontSize: isRenaissance ? 12 : 11,
                fontFamily: isRenaissance ? "'EB Garamond', Georgia, serif" : "monospace",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {/* Class base layer (subtle background) */}
            {classData && (
              <Radar
                name="Base de clase"
                dataKey="classBase"
                stroke={isRenaissance ? "rgba(184,120,55,0.15)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill={isRenaissance ? "rgba(184,120,55,0.04)" : "rgba(255, 255, 255, 0.03)"}
                fillOpacity={1}
              />
            )}
            {/* Mission progress layer (main) */}
            <Radar
              name={view === "cumulative" ? "Acumulado" : "7 días"}
              dataKey="value"
              stroke={isRenaissance ? mc.accent : "#4ade80"}
              strokeWidth={isRenaissance ? 1.5 : 2}
              strokeDasharray={isRenaissance ? "4 2" : undefined}
              fill={isRenaissance ? mc.accent : "#4ade80"}
              fillOpacity={isRenaissance ? 0.08 : 0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Stat breakdown */}
      <div className="grid grid-cols-5 gap-1 mt-1">
        {STAT_LABELS.map((s) => (
          <motion.div
            key={s.key}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div
              className="font-mono text-sm font-bold"
              style={{ color: s.key === "salud" && healthPenalty > 0 ? "#ef4444" : s.color }}
            >
              {sourceStats[s.key]}
            </div>
            <div className="font-mono text-[8px] text-[#6b8a6b] uppercase">
              {s.label}
            </div>
            {s.key === "salud" && healthPenalty > 0 && view === "cumulative" && (
              <div className="font-mono text-[9px] text-red-500/80">
                -{healthPenalty} inactividad
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
