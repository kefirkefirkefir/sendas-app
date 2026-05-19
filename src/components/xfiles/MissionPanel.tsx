"use client";

import { useState, useMemo, useCallback } from "react";
import { useGameStore, type Mission, type Subtask, type Difficulty, type Stats, type MissionType } from "@/lib/game-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Target,
  Filter,
  ListChecks,
  X,
  Flame,
  CalendarClock,
  Repeat,
  Clock,
  GripVertical,
  Coins,
  Zap,
  Pencil,
} from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";

const CATEGORIES: { value: keyof Stats; label: string; color: string }[] = [
  { value: "trabajo", label: "Trabajo", color: "stat-trabajo" },
  { value: "oposicion", label: "Estudio", color: "stat-oposicion" },
  { value: "salud", label: "Salud", color: "stat-salud" },
  { value: "asociacion", label: "Voluntariado", color: "stat-asociacion" },
  { value: "ocio", label: "Ocio", color: "stat-ocio" },
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
  legendario: "Legendario",
};

const DIFFICULTY_XP_MULTI: Record<Difficulty, number> = {
  facil: 1,
  medio: 1.5,
  dificil: 2,
  legendario: 3,
};

const DIFFICULTY_COINS: Record<Difficulty, number> = {
  facil: 10,
  medio: 25,
  dificil: 50,
  legendario: 100,
};

const CATEGORY_MULTI_LABELS: Record<keyof Stats, { xp: number; coins: number }> = {
  trabajo: { xp: 1, coins: 1 },
  oposicion: { xp: 1, coins: 1 },
  salud: { xp: 0.5, coins: 0.5 },
  asociacion: { xp: 0.5, coins: 0.5 },
  ocio: { xp: 0, coins: 0 },
};

const MISSION_TYPE_CONFIG: { value: MissionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "deadline", label: "Con fecha", icon: <CalendarClock className="w-3.5 h-3.5" />, desc: "Tiene fecha límite" },
  { value: "habit", label: "Hábito", icon: <Repeat className="w-3.5 h-3.5" />, desc: "Repetir cada día" },
];

function miniId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const HABIT_DAYS = 21;

function getHabitDays(): string[] {
  const days: string[] = [];
  for (let i = 0; i < HABIT_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function MissionPanel() {
  const { missions, createMission, completeMission, deleteMission, updateMission, updateMissionProgress, toggleSubtask, toggleHabitDay, reorderMission } =
    useGameStore();
  const mc = useModeColors();
  const t = useThemeText();
  const currentMode = useGameStore((s) => s.currentMode);

  const MODE_BG: Record<string, string> = {
    neutral: "rgba(15,13,8,0.95)",
    busqueda: "rgba(8,15,10,0.95)",
    estudio: "rgba(8,10,18,0.95)",
    descanso: "rgba(12,10,18,0.95)",
  };
  const modeBg = MODE_BG[currentMode] ?? MODE_BG.neutral;

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<keyof Stats | "all">("all");
  const [typeFilter, setTypeFilter] = useState<MissionType | "all">("all");
  const [showCompleted, setShowCompleted] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<keyof Stats>("trabajo");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [xpReward, setXpReward] = useState("50");
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string }>>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [missionType, setMissionType] = useState<MissionType>("deadline");
  const [deadline, setDeadline] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<keyof Stats>("trabajo");
  const [editDifficulty, setEditDifficulty] = useState<Difficulty>("facil");
  const [editXpReward, setEditXpReward] = useState("50");
  const [editSubtasks, setEditSubtasks] = useState<Array<{ id: string; title: string }>>([]);
  const [editNewSubtask, setEditNewSubtask] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // DnD sensors — require 8px movement to start drag (avoids accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const allActiveCount = missions.filter((m) => !m.completed).length;

  const filteredMissions = missions.filter((m) => {
    if (filter !== "all" && m.category !== filter) return false;
    if (typeFilter !== "all" && m.missionType !== typeFilter) return false;
    if (!showCompleted && m.completed) return false;
    return true;
  });

  const activeMissions = filteredMissions.filter((m) => !m.completed);

  const activeCount = useMemo(() => missions.filter((m) => !m.completed).length, [missions]);

  // Split: deadline missions (sorted by urgency), habits, and completed missions
  const deadlineMissions = filteredMissions
    .filter((m) => m.missionType === "deadline" && !m.completed)
    .sort((a, b) => getDaysUntil(a.deadline || "2099-12-31") - getDaysUntil(b.deadline || "2099-12-31"));
  const habits = filteredMissions.filter((m) => m.missionType === "habit" && !m.completed);
  const completedMissions = filteredMissions.filter((m) => m.completed).sort((a, b) => {
    const dateA = a.completedAt ?? a.createdAt ?? "";
    const dateB = b.completedAt ?? b.createdAt ?? "";
    return dateB.localeCompare(dateA);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Only allow reordering within habits, not deadline (auto-sorted)
    const allItems = [...habits];
    const oldIndex = allItems.findIndex((m) => m.id === active.id);
    const newIndex = allItems.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(allItems, oldIndex, newIndex);
    // Update mission order in store to match new visual order
    const { missions } = useGameStore.getState();
    const missionIds = new Set(reordered.map((m) => m.id));
    const otherMissions = missions.filter((m) => !missionIds.has(m.id));
    const reorderedMissions = reordered.map((m) => missions.find((om) => om.id === m.id)!).filter(Boolean);
    useGameStore.setState({ missions: [...reorderedMissions, ...otherMissions] });
  };

  const addSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { id: miniId(), title: t }]);
    setNewSubtask("");
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const finalSubtasks: Subtask[] = subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: false,
    }));
    createMission({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      xpReward: parseInt(xpReward) || 50,
      coinReward: DIFFICULTY_COINS[difficulty],
      missionType,
      ...(deadline ? { deadline } : {}),
      ...(finalSubtasks.length > 0 && { subtasks: finalSubtasks }),
    });
    setTitle("");
    setDescription("");
    setCategory("trabajo");
    setDifficulty("facil");
    setXpReward("50");
    setSubtasks([]);
    setNewSubtask("");
    setMissionType("deadline");
    setDeadline("");
    setOpen(false);
  };

  const openEdit = (mission: Mission) => {
    setEditId(mission.id);
    setEditTitle(mission.title);
    setEditDescription(mission.description);
    setEditCategory(mission.category);
    setEditDifficulty(mission.difficulty);
    setEditXpReward(String(mission.xpReward));
    setEditSubtasks(mission.subtasks.map((s) => ({ id: s.id, title: s.title })));
    setEditNewSubtask("");
    setEditDeadline(mission.deadline ?? "");
  };

  const handleEditSubmit = () => {
    if (!editId || !editTitle.trim()) return;
    const finalSubtasks: Subtask[] = editSubtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: false,
    }));
    updateMission(editId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      difficulty: editDifficulty,
      xpReward: parseInt(editXpReward) || 50,
      coinReward: DIFFICULTY_COINS[editDifficulty],
      ...(editDeadline ? { deadline: editDeadline } : { deadline: undefined }),
      ...(finalSubtasks.length > 0 ? { subtasks: finalSubtasks } : {}),
    });
    setEditId(null);
  };

  const removeEditSubtask = (id: string) => {
    setEditSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const addEditSubtask = () => {
    const t = editNewSubtask.trim();
    if (!t) return;
    setEditSubtasks((prev) => [...prev, { id: miniId(), title: t }]);
    setEditNewSubtask("");
  };

  return (
    <div className="flex flex-col min-h-0 h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5" style={{ color: mc.accent }} />
          <div>
            <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: mc.accent }}>
              {t.missionsTitle}
            </h2>
            <p className="font-mono text-[9px] text-[#4a5a4a] tracking-wider mt-0.5">
              {t.missionsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs px-2 py-0.5"
            style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent }}
          >
            {activeCount}
          </Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="xfiles-btn font-mono text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Nueva
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: modeBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
                {t.newMission}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Mission type selector */}
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1.5">
                  {t.missionType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MISSION_TYPE_CONFIG.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setMissionType(t.value)}
                      className={`font-mono text-[10px] p-2 rounded border text-center transition-all cursor-pointer ${
                        missionType === t.value
                          ? "bg-[rgba(var(--mode-accent-rgb),0.08)]"
                          : "border-[rgba(255,255,255,0.08)] text-[#6b8a6b]"
                      }`}
                      style={missionType === t.value ? { borderColor: mc.accent, color: mc.accent } : { borderColor: 'rgba(255,255,255,0.08)' }}
                      onMouseEnter={(e) => { if (missionType !== t.value) e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`; }}
                      onMouseLeave={(e) => { if (missionType !== t.value) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        {t.icon}
                        <span>{t.label}</span>
                      </div>
                      <span className="text-[8px] text-[#4a5a4a]">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline field — always shown except for habits */}
              {missionType !== "habit" && (
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    FECHA LÍMITE
                  </label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="xfiles-input"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              )}

              {/* Habit info */}
              {missionType === "habit" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-2 rounded border border-[rgba(251,191,36,0.15)] bg-[rgba(251,191,36,0.03)]"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Repeat className="w-3 h-3 text-[#fbbf24]" />
                    <span className="font-mono text-[10px] text-[#fbbf24] uppercase tracking-wider">
                      Hábito diario
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-[#6b8a6b] leading-relaxed">
                    Marca cada día que completes este hábito. Gana XP y monedas pequeñas por cada día. Construye rachas consecutivas.
                  </p>
                </motion.div>
              )}

              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  TÍTULO
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enviar 5 currículums..."
                  className="xfiles-input"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  DESCRIPCIÓN (OPCIONAL)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles de la misión..."
                  className="xfiles-input min-h-[60px] resize-none"
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    CATEGORÍA
                  </label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as keyof Stats)}
                  >
                    <SelectTrigger className="xfiles-input text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a1410]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className={`text-xs font-mono ${c.color}`}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    DIFICULTAD
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => setDifficulty(v as Difficulty)}
                  >
                    <SelectTrigger className="xfiles-input text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a1410]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}>
                      {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className={`text-xs font-mono difficulty-${k}`}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  RECOMPENSA XP BASE
                </label>
                <Input
                  type="number"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="xfiles-input"
                  min={10}
                  max={500}
                />
                <div className="font-mono text-[10px] text-[#6b8a6b] mt-1">
                  {missionType === "habit" ? (() => {
                    const cm = CATEGORY_MULTI_LABELS[category];
                    const hxp = Math.max(0, Math.round(((parseInt(xpReward) || 50) / 21) * cm.xp));
                    const hcoins = Math.max(0, Math.round((DIFFICULTY_COINS[difficulty] / 21) * cm.coins));
                    return (
                      <>
                        XP por día: ~{hxp}{cm.xp < 1 ? " (cat. reducida)" : ""}
                        {" · "}{hcoins} monedas/día{cm.coins < 1 ? " (cat. reducida)" : ""}
                      </>
                    );
                  })() : (() => {
                    const cm = CATEGORY_MULTI_LABELS[category];
                    const fxp = Math.round((parseInt(xpReward) || 50) * DIFFICULTY_XP_MULTI[difficulty] * cm.xp);
                    return (
                      <>XP final: {fxp}{cm.xp < 1 ? ` (x${cm.xp} cat.)` : ` (x${DIFFICULTY_XP_MULTI[difficulty]})`}</>
                    );
                  })()}
                </div>
              </div>

              {/* Subtasks — not for habits */}
              {missionType !== "habit" && (
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] flex items-center gap-1.5 mb-2">
                    <ListChecks className="w-3 h-3" />
                    SUBTAREAS (OPCIONAL)
                  </label>
                  {subtasks.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {subtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2">
                          <Circle className="w-3 h-3 text-[#4a5a4a] shrink-0" />
                          <span className="font-mono text-[10px] text-[#c8d6c0] flex-1">
                            {st.title}
                          </span>
                          <button
                            onClick={() => removeSubtask(st.id)}
                            className="text-[#6b8a6b] hover:text-[#ff4444] transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                      placeholder="Añadir paso..."
                      className="xfiles-input text-xs"
                      maxLength={60}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addSubtask}
                      disabled={!newSubtask.trim()}
                      className="shrink-0 font-mono text-xs text-[#6b8a6b]"
                      style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = mc.accent; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.4)`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.2)`; }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  {subtasks.length > 0 && (
                    <p className="font-mono text-[9px] text-[#4a5a4a] mt-1">
                      El progreso se calculará automáticamente al completar subtareas
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full font-mono text-xs mt-2"
                style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent, background: `rgba(${mc.accentRgb},0.12)` }}
                disabled={!title.trim() || (missionType !== "habit" && !deadline)}
              >
                Crear {MISSION_TYPE_CONFIG.find((t) => t.value === missionType)?.label}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 shrink-0">
        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {MISSION_TYPE_CONFIG.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === t.value
                  ? "bg-[rgba(var(--mode-accent-rgb),0.08)]"
                  : typeFilter === "all"
                  ? "border-[rgba(255,255,255,0.08)] text-[#6b8a6b]"
                  : "border-[rgba(255,255,255,0.05)] text-[#4a5a4a]"
              }`}
              style={typeFilter === t.value ? { borderColor: mc.accent, color: mc.accent } : {}}
              onMouseEnter={(e) => { if (typeFilter !== t.value) e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`; }}
              onMouseLeave={(e) => { if (typeFilter !== t.value) e.currentTarget.style.borderColor = typeFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'; }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showCompleted
                ? "text-[#4ade80]"
                : "text-[#6b8a6b]"
            }`}
            style={{ borderColor: showCompleted ? `rgba(${mc.accentRgb},0.3)` : `rgba(${mc.accentRgb},0.1)` }}
            onMouseEnter={(e) => { if (!showCompleted) e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`; }}
            onMouseLeave={(e) => { if (!showCompleted) e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.1)`; }}
          >
            {showCompleted ? "Ocultar" : "Mostrar"} completadas
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3 text-[#4a5a4a]" />
          <button
            onClick={() => setFilter("all")}
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[rgba(var(--mode-accent-rgb),0.05)]"
                : "border-[rgba(255,255,255,0.05)] text-[#4a5a4a]"
            }`}
            style={filter === "all" ? { borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent } : {}}
            onMouseEnter={(e) => { if (filter !== 'all') e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.2)`; }}
            onMouseLeave={(e) => { if (filter !== 'all') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                filter === c.value
                  ? "bg-[rgba(var(--mode-accent-rgb),0.05)]"
                  : "border-[rgba(255,255,255,0.05)] text-[#4a5a4a]"
              }`}
              style={filter === c.value ? { borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent } : {}}
              onMouseEnter={(e) => { if (filter !== c.value) e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.2)`; }}
              onMouseLeave={(e) => { if (filter !== c.value) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* DnD wrapper for the whole missions area */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-green">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={[...habits].map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {/* Habits — draggable, always on top */}
            {habits.map((mission) => (
              <SortableHabitCard
                key={mission.id}
                mission={mission}
                onToggle={toggleHabitDay}
                onDelete={deleteMission}
                onEdit={openEdit}
              />
            ))}

            {/* Separator: habits / deadline missions */}
            {habits.length > 0 && deadlineMissions.length > 0 && (
              <div className="h-px" style={{ background: `rgba(${mc.accentRgb},0.15)` }} />
            )}

            {/* Deadline missions — auto-sorted by urgency, not draggable */}
            {deadlineMissions.length > 0 && (
              <AnimatePresence>
                {deadlineMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onComplete={completeMission}
                    onDelete={deleteMission}
                    onUpdateProgress={updateMissionProgress}
                    onToggleSubtask={toggleSubtask}
                    onEdit={openEdit}
                    dragHandleProps={{ attributes: {}, listeners: undefined, isDragging: false }}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* Separator */}
            {(habits.length > 0 || deadlineMissions.length > 0) && completedMissions.length > 0 && (
              <div className="h-px" style={{ background: `rgba(${mc.accentRgb},0.1)` }} />
            )}

            {/* Completed missions */}
            <AnimatePresence>
              {completedMissions.length > 0 && (
                <div className="space-y-2">
                  {completedMissions.map((mission) => (
                    <div key={mission.id} className="opacity-60 rounded border" style={{ borderColor: `rgba(${mc.accentRgb},0.06)` }}>
                      <div className="font-mono text-[9px] text-[#4a5a4a] px-2 pt-1.5">
                        Completada {mission.completedAt ? new Date(mission.completedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </div>
                      {mission.missionType === "habit" ? (
                        <HabitCard
                          mission={mission}
                          onToggle={toggleHabitDay}
                          onDelete={deleteMission}
                          onEdit={openEdit}
                          dragHandleProps={{ attributes: {}, listeners: undefined, isDragging: false }}
                        />
                      ) : (
                        <MissionCard
                          mission={mission}
                          onComplete={completeMission}
                          onDelete={deleteMission}
                          onUpdateProgress={updateMissionProgress}
                          onToggleSubtask={toggleSubtask}
                          onEdit={openEdit}
                          dragHandleProps={{ attributes: {}, listeners: undefined, isDragging: false }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {deadlineMissions.length === 0 && habits.length === 0 && completedMissions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="font-mono text-xs text-[#6b8a6b]">
                    {t.emptyMissions}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
      </div>

      {/* Edit Mission Dialog */}
      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: modeBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
              {t.editMission}
            </DialogTitle>
          </DialogHeader>
          {editId && (() => {
            const mission = missions.find((m) => m.id === editId);
            if (!mission) return null;
            const isHabit = mission.missionType === "habit";
            return (
              <div className="space-y-3 mt-2">
                {/* Deadline field — for deadline missions */}
                {!isHabit && (
                  <div>
                    <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                      FECHA LÍMITE
                    </label>
                    <Input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="xfiles-input"
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                )}

                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    TÍTULO
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="xfiles-input"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    DESCRIPCIÓN (OPCIONAL)
                  </label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="xfiles-input min-h-[60px] resize-none"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                      CATEGORÍA
                    </label>
                    <Select
                      value={editCategory}
                      onValueChange={(v) => setEditCategory(v as keyof Stats)}
                    >
                      <SelectTrigger className="xfiles-input text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1410]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value} className={`text-xs font-mono ${c.color}`}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                      DIFICULTAD
                    </label>
                    <Select
                      value={editDifficulty}
                      onValueChange={(v) => setEditDifficulty(v as Difficulty)}
                    >
                      <SelectTrigger className="xfiles-input text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1410]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}>
                        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className={`text-xs font-mono difficulty-${k}`}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                    RECOMPENSA XP BASE
                  </label>
                  <Input
                    type="number"
                    value={editXpReward}
                    onChange={(e) => setEditXpReward(e.target.value)}
                    className="xfiles-input"
                    min={10}
                    max={500}
                  />
                  <div className="font-mono text-[10px] text-[#6b8a6b] mt-1">
                    {isHabit ? (() => {
                      const cm = CATEGORY_MULTI_LABELS[editCategory];
                      const hxp = Math.max(0, Math.round(((parseInt(editXpReward) || 50) / 21) * cm.xp));
                      const hcoins = Math.max(0, Math.round((DIFFICULTY_COINS[editDifficulty] / 21) * cm.coins));
                      return (
                        <>
                          XP por día: ~{hxp}{cm.xp < 1 ? " (cat. reducida)" : ""}
                          {" · "}{hcoins} monedas/día{cm.coins < 1 ? " (cat. reducida)" : ""}
                        </>
                      );
                    })() : (() => {
                      const cm = CATEGORY_MULTI_LABELS[editCategory];
                      const fxp = Math.round((parseInt(editXpReward) || 50) * DIFFICULTY_XP_MULTI[editDifficulty] * cm.xp);
                      return (
                        <>XP final: {fxp}{cm.xp < 1 ? ` (x${cm.xp} cat.)` : ` (x${DIFFICULTY_XP_MULTI[editDifficulty]})`}</>
                      );
                    })()}
                  </div>
                </div>

                {/* Subtasks — not for habits */}
                {!isHabit && (
                  <div>
                    <label className="font-mono text-xs text-[#6b8a6b] flex items-center gap-1.5 mb-2">
                      <ListChecks className="w-3 h-3" />
                      SUBTAREAS (OPCIONAL)
                    </label>
                    {editSubtasks.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {editSubtasks.map((st) => (
                          <div key={st.id} className="flex items-center gap-2">
                            <Circle className="w-3 h-3 text-[#4a5a4a] shrink-0" />
                            <span className="font-mono text-[10px] text-[#c8d6c0] flex-1">
                              {st.title}
                            </span>
                            <button
                              onClick={() => removeEditSubtask(st.id)}
                              className="text-[#6b8a6b] hover:text-[#ff4444] transition-colors cursor-pointer shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={editNewSubtask}
                        onChange={(e) => setEditNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEditSubtask())}
                        placeholder="Añadir paso..."
                        className="xfiles-input text-xs"
                        maxLength={60}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addEditSubtask}
                        disabled={!editNewSubtask.trim()}
                        className="shrink-0 font-mono text-xs text-[#6b8a6b]"
                        style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = mc.accent; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.4)`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.2)`; }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleEditSubmit}
                  className="w-full font-mono text-xs mt-2"
                  style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent, background: `rgba(${mc.accentRgb},0.12)` }}
                  disabled={!editTitle.trim() || (!isHabit && !editDeadline)}
                >
                  Guardar cambios
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Sortable Habit Card ----

function SortableHabitCard({
  mission,
  onToggle,
  onDelete,
  onEdit,
}: {
  mission: Mission;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (mission: Mission) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mission.id });

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={sortableStyle}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <HabitCard
          mission={mission}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          dragHandleProps={{ attributes, listeners, isDragging }}
        />
      </motion.div>
    </div>
  );
}

// ---- Habit Card ----

function HabitCard({
  mission,
  onToggle,
  onDelete,
  onEdit,
  dragHandleProps,
}: {
  mission: Mission;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (mission: Mission) => void;
  dragHandleProps: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners | undefined;
    isDragging: boolean;
  };
}) {
    const mc = useModeColors();
    const today = new Date().toISOString().slice(0, 10);
    const isDoneToday = mission.completedDates.includes(today);
    const habitDays = getHabitDays();
    const completedCount = mission.completedDates.filter((d) => habitDays.includes(d)).length;
    const isBonus = completedCount >= 15;
    const bonusMulti = isBonus ? 2 : 1;
    const catInfo = CATEGORIES.find((c) => c.value === mission.category);
    const habitXp = Math.max(0, Math.round((mission.xpReward / 21) * (CATEGORY_MULTI_LABELS[mission.category]?.xp ?? 1) * bonusMulti));
    const rawCoins = Math.round((mission.coinReward / 21) * (CATEGORY_MULTI_LABELS[mission.category]?.coins ?? 1) * bonusMulti);
    const habitCoins = isBonus ? Math.max(1, rawCoins) : Math.max(0, rawCoins);

    return (
      <div
        className={`xfiles-card rounded p-3 group relative ${dragHandleProps.isDragging ? "ring-1 shadow-[0_0_12px_rgba(var(--mode-accent-rgb),0.15)]" : ""}`}
        style={dragHandleProps.isDragging ? { '--tw-ring-color': `rgba(${mc.accentRgb},0.4)` } as React.CSSProperties : undefined}
      >
        {/* Habit streak — top right */}
        {mission.habitStreak > 0 && (
          <div className="absolute top-3 right-16 font-mono text-[9px] flex items-center gap-1.5 text-[#fbbf24]">
            <Flame className="w-2.5 h-2.5 shrink-0" />
            <span className="text-left">{mission.habitStreak}d racha</span>
          </div>
        )}

        <div className="flex items-start gap-2">
          {/* Drag handle */}
          {dragHandleProps.listeners && (
            <button
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-[#3a4a3a] hover:text-[#6b8a6b] transition-colors touch-none"
              title="Arrastra para reordenar"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          {/* Today check button */}
          <button
            onClick={() => onToggle(mission.id)}
            className="mt-0.5 shrink-0 cursor-pointer"
            title={isDoneToday ? "Desmarcar hoy" : "Marcar como completado hoy"}
          >
            {isDoneToday ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-[#4ade80]" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-[#6b8a6b] hover:text-[#fbbf24] transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono text-xs font-medium ${isDoneToday ? "text-[#4ade80]" : "text-[#c8d6c0]"}`}>
                {mission.title}
              </span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border difficulty-${mission.difficulty}`}
              >
                {DIFFICULTY_LABELS[mission.difficulty]}
              </span>
            </div>

            {mission.description && (
              <p className="font-mono text-[10px] text-[#6b8a6b] mt-0.5 truncate">
                {mission.description}
              </p>
            )}

            {/* 21-day progress tracker */}
            <div className="flex items-center gap-1.5 mt-2 overflow-hidden" style={{ maxWidth: 'calc(100% - 1rem)' }}>
              {habitDays.map((day, idx) => {
                const checked = mission.completedDates.includes(day);
                const isToday = day === today;
                const isBonusStart = idx === 15;
                const isBonusZone = idx >= 15;
                return (
                  <div
                    key={day}
                    className={`w-4 h-4 rounded-sm flex items-center justify-center text-[7px] font-mono relative ${
                      checked
                        ? isBonusZone
                          ? "bg-[rgba(251,191,36,0.35)] text-[#fbbf24]"
                          : "bg-[rgba(251,191,36,0.2)] text-[#fbbf24]"
                        : isToday
                        ? "bg-[rgba(255,255,255,0.08)] text-[#4a5a4a]"
                        : "bg-[rgba(255,255,255,0.03)] text-[#2a3a2a]"
                    }`}
                    title={`Día ${idx + 1}${isBonusStart ? " — Inicio bonus x2" : ""} (${day})`}
                  >
                    {isBonusZone && !checked && <div className="absolute inset-0 rounded-sm border border-dashed border-[rgba(251,191,36,0.3)]" />}
                    {checked ? "✓" : "·"}
                  </div>
                );
              })}
              <span className="font-mono text-[8px] ml-1 shrink-0" style={{ color: mc.accent }}>{completedCount}/{HABIT_DAYS}</span>
              {isBonus && (
                <span className="font-mono text-[8px] text-[#fbbf24] shrink-0 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> x2
                </span>
              )}
            </div>

            {/* Rewards */}
            <div className="flex items-center gap-3 mt-1.5">
              {habitXp > 0 && (
                <span className="font-mono text-[10px] text-[#4ade80]">
                  +{habitXp} XP/día
                </span>
              )}
              {habitCoins > 0 && (
                <span className="font-mono text-[10px] text-[#fbbf24]">
                  +{habitCoins} <Coins className="w-3 h-3 inline" />/día
                </span>
              )}
              {habitXp === 0 && habitCoins === 0 && (
                <span className="font-mono text-[10px] text-[#4a5a4a] italic">
                  Sin recompensa material
                </span>
              )}
              {catInfo && (
                <span className={`font-mono text-[10px] ${catInfo.color}`}>
                  {catInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(mission)}
              className="text-[#6b8a6b] hover:text-[#fbbf24] cursor-pointer"
              title="Editar misión"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(mission.id)}
              className="text-[#6b8a6b] hover:text-[#ff4444] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
}

// ---- Sortable Mission Card ----

function SortableMissionCard({
  mission,
  onComplete,
  onDelete,
  onUpdateProgress,
  onToggleSubtask,
  onEdit,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleSubtask: (missionId: string, subtaskId: string) => void;
  onEdit: (mission: Mission) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mission.id });

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={sortableStyle}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: mission.completed ? 0.5 : 1, x: 0 }}
        exit={{ opacity: 0, x: 10, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <MissionCard
          mission={mission}
          onComplete={onComplete}
          onDelete={onDelete}
          onUpdateProgress={onUpdateProgress}
          onToggleSubtask={onToggleSubtask}
          onEdit={onEdit}
          dragHandleProps={{ attributes, listeners, isDragging }}
        />
      </motion.div>
    </div>
  );
}

// ---- Regular Mission Card ----

function MissionCard({
  mission,
  onComplete,
  onDelete,
  onUpdateProgress,
  onToggleSubtask,
  onEdit,
  dragHandleProps,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleSubtask: (missionId: string, subtaskId: string) => void;
  onEdit: (mission: Mission) => void;
  dragHandleProps: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners | undefined;
    isDragging: boolean;
  };
}) {
    const mc = useModeColors();
    const catInfo = CATEGORIES.find((c) => c.value === mission.category);
    const diffColor = `difficulty-${mission.difficulty}`;
    const xpMulti = DIFFICULTY_XP_MULTI[mission.difficulty];
    const catMulti = CATEGORY_MULTI_LABELS[mission.category] ?? { xp: 1, coins: 1 };
    const finalXp = Math.round(mission.xpReward * xpMulti * catMulti.xp);
    const finalCoins = Math.round(mission.coinReward * catMulti.coins);
    const hasSubtasks = mission.subtasks && mission.subtasks.length > 0;
    const completedSubtasks = hasSubtasks ? mission.subtasks.filter((s) => s.completed).length : 0;
    const [showSubtasks, setShowSubtasks] = useState(false);

    // Deadline logic
    const daysLeft = mission.deadline ? getDaysUntil(mission.deadline) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;
    const isWarning = daysLeft !== null && daysLeft >= 3 && daysLeft < 7;
    const deadlineColor = isOverdue
      ? "text-[#ef4444]"
      : isUrgent
      ? "text-[#fbbf24]"
      : isWarning
      ? "text-[#d4a853]"
      : "text-[#6b8a6b]";

    const deadlineLabel = (() => {
      if (daysLeft === null) return formatDateShort(mission.deadline!);
      if (daysLeft < 0) return `${Math.abs(daysLeft)}d vencida`;
      if (daysLeft === 0) return "Hoy";
      if (daysLeft === 1) return "Mañana";
      if (daysLeft < 7) return `${daysLeft}d restantes`;
      return formatDateShort(mission.deadline);
    })();

    return (
      <div
        className={`xfiles-card rounded p-3 group relative ${dragHandleProps.isDragging ? "ring-1 shadow-[0_0_12px_rgba(var(--mode-accent-rgb),0.15)]" : ""}`}
        style={dragHandleProps.isDragging ? { '--tw-ring-color': `rgba(${mc.accentRgb},0.4)` } as React.CSSProperties : undefined}
      >
        {/* Deadline date — top right */}
        {mission.missionType === "deadline" && mission.deadline && (
          <div className={`absolute top-3 right-16 font-mono text-[9px] flex flex-col items-start gap-0 ${deadlineColor}`}>
            <span className="flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span className="text-left">{deadlineLabel}</span>
            </span>
          </div>
        )}

        <div className="flex items-start gap-2">
          {/* Drag handle */}
          {dragHandleProps.listeners && (
            <button
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-[#3a4a3a] hover:text-[#6b8a6b] transition-colors touch-none"
              title="Arrastra para reordenar"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          {/* Complete button */}
          <button
            onClick={() => onComplete(mission.id)}
            className="mt-0.5 shrink-0 cursor-pointer"
            title={mission.completed ? "Desmarcar misión" : "Completar misión"}
          >
            {mission.completed ? (
              <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
            ) : (
              <Circle className="w-4 h-4 text-[#6b8a6b] transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = mc.accent} onMouseLeave={(e) => e.currentTarget.style.color = ''} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-mono text-xs font-medium ${mission.completed ? "line-through text-[#6b8a6b]" : "text-[#c8d6c0]"}`}
              >
                {mission.title}
              </span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${diffColor}`}
              >
                {DIFFICULTY_LABELS[mission.difficulty]}
              </span>
              {hasSubtasks && (
                <span className="font-mono text-[9px] text-[#6b8a6b] flex items-center gap-0.5">
                  <ListChecks className="w-3 h-3" />
                  {completedSubtasks}/{mission.subtasks!.length}
                </span>
              )}
            </div>

            {mission.description && (
              <p className={`font-mono text-[10px] text-[#6b8a6b] mt-0.5 ${showSubtasks ? '' : 'truncate'}`}>
                {mission.description}
              </p>
            )}

            {/* Subtasks — toggled by icon click */}
            <AnimatePresence initial={false}>
              {hasSubtasks && !mission.completed && showSubtasks && (
                <motion.div
                  key="subtasks"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1 pl-1 border-l" style={{ borderColor: `rgba(${mc.accentRgb},0.1)` }}>
                    {mission.subtasks!.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => onToggleSubtask(mission.id, st.id)}
                        className="flex items-center gap-1.5 w-full text-left py-1 cursor-pointer group/st"
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-[#4ade80] shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 text-[#4a5a4a] transition-colors shrink-0" onMouseEnter={(e) => e.currentTarget.style.color = mc.accent} onMouseLeave={(e) => e.currentTarget.style.color = ''} />
                        )}
                        <span
                          className={`font-mono text-[10px] transition-all ${
                            st.completed
                              ? "line-through text-[#4a5a4a]"
                              : "text-[#8a9a8a] group-hover/st:text-[#c8d6c0]"
                          }`}
                        >
                          {st.title}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Progress bar for subtasks */}
                  <div className="mt-1.5">
                    <div className="xfiles-progress rounded-full h-1 overflow-hidden">
                      <motion.div
                        className="xfiles-progress-bar h-full rounded-full"
                        animate={{ width: `${mission.progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rewards */}
            <div className="flex items-center gap-3 mt-1.5">
              {finalXp > 0 && (
                <span className="font-mono text-[10px] text-[#4ade80]">
                  +{finalXp} XP
                </span>
              )}
              {finalCoins > 0 && (
                <span className="font-mono text-[10px] text-[#fbbf24]">
                  +{finalCoins} <Coins className="w-3 h-3 inline" />
                </span>
              )}
              {finalXp === 0 && finalCoins === 0 && (
                <span className="font-mono text-[10px] text-[#4a5a4a] italic">
                  Sin recompensa material
                </span>
              )}
              {catInfo && (
                <span
                  className={`font-mono text-[10px] ${catInfo.color}`}
                >
                  {catInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(mission)}
              className="text-[#6b8a6b] hover:text-[#fbbf24] cursor-pointer"
              title="Editar misión"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(mission.id)}
              className="text-[#6b8a6b] hover:text-[#ff4444] cursor-pointer"
              title="Eliminar misión"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtask toggle indicator — bottom right */}
        {hasSubtasks && !mission.completed && (
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="absolute bottom-2 right-2 cursor-pointer transition-colors hover:text-[#8a9a8a]"
            style={{ color: showSubtasks ? `rgba(${mc.accentRgb},0.6)` : '#3a4a3a' }}
            title={showSubtasks ? "Ocultar subtareas" : "Mostrar subtareas"}
          >
            <ListChecks className={`w-4 h-4 transition-transform duration-200 ${showSubtasks ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    );
}
