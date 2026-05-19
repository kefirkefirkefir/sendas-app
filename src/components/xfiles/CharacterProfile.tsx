"use client";

import { useState, useRef } from "react";
import { useGameStore, type AgentClassId, type Stats } from "@/lib/game-store";
import { getRank, getLevelProgress } from "@/lib/rank-system";
import { useThemeText } from "@/hooks/use-theme-text";
import { motion, AnimatePresence } from "framer-motion";
import { useModeColors } from "@/hooks/use-mode-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, UserCircle, Camera, X, ChevronDown, Crosshair, MapPin, ChevronRight, Calendar, Zap, Brain, Radio, Shield, Shuffle, BookOpen, Settings } from "lucide-react";
import SettingsPanel from "./SettingsPanel";
import ThemeSelector from "./ThemeSelector";

import { type LucideIcon } from "lucide-react";

const CLASS_ICONS: Record<string, LucideIcon> = {
  spooky: Zap,
  doctora: Brain,
  informante: Radio,
  subdirector: Shield,
  agente_doble: Shuffle,
};

const STAT_SHORT: { key: keyof Stats; label: string }[] = [
  { key: "trabajo", label: "Trb" },
  { key: "oposicion", label: "Est" },
  { key: "salud", label: "Sal" },
  { key: "asociacion", label: "Vol" },
  { key: "ocio", label: "Oco" },
];

function statColor(val: number) {
  if (val >= 7) return "#00ff41";
  if (val >= 5) return "#4ade80";
  if (val >= 3) return "#fbbf24";
  return "#ef4444";
}

function ClassDropdown({
  selected,
  onSelect,
}: {
  selected: AgentClassId | null;
  onSelect: (id: AgentClassId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const mc = useModeColors();
  const t = useThemeText();
  const current = t.classes.find((c) => c.id === selected) ?? null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="xfiles-input w-full flex items-center justify-between cursor-pointer text-left"
      >
        <span className="font-mono text-xs truncate flex items-center gap-1.5">
          {current ? (
            <>{(() => { const C = CLASS_ICONS[current.id]; return C ? <C className="w-3.5 h-3.5 text-[#4a6a7a] shrink-0" /> : null; })()}{current.name}</>
          ) : "Sin clase"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6b8a6b] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 z-[70] rounded-lg border bg-[#0a140a] shadow-lg overflow-hidden"
            style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}
            >
              {t.classes.map((cls) => {
                const isActive = selected === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => {
                      onSelect(cls.id as AgentClassId);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors text-left border-b border-[rgba(255,255,255,0.04)] last:border-0 ${
                      isActive ? "bg-[rgba(var(--mode-accent-rgb),0.08)]" : "hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                  >
                    {(() => { const C = CLASS_ICONS[cls.id]; return C ? <C className="w-4 h-4 text-[#4a6a7a] shrink-0" /> : null; })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#c8d6c0]">{cls.name}</span>
                        <span className="font-mono text-[9px] text-[#4a5a4a] uppercase">{cls.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {STAT_SHORT.map((s) => (
                          <span
                            key={s.key}
                            className="font-mono text-[9px]"
                            style={{ color: statColor(cls.stats[s.key]) }}
                          >
                            {s.label}:{cls.stats[s.key]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
              {selected && (
                <button
                  onClick={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-1.5 font-mono text-[10px] text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] cursor-pointer transition-colors text-center"
                >
                  Quitar clase
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CharacterProfile() {
  const { character, updateCharacter, playerName, setPlayerName, level, xp, xpToNextLevel, selectedClass, setSelectedClass } = useGameStore();
  const mc = useModeColors();
  const t = useThemeText();
  const currentMode = useGameStore((s) => s.currentMode);

  const DIALOG_BG: Record<string, string> = {
    neutral: "#0f0d08",
    busqueda: "#080f0a",
    estudio: "#080a12",
    descanso: "#0c0a12",
  };
  const dialogBg = DIALOG_BG[currentMode] ?? DIALOG_BG.neutral;
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const nameRef = useRef<HTMLInputElement>(null);
  const [temp, setTemp] = useState({
    age: character.age ?? "",
    backstory: character.backstory ?? "",
    specialty: character.specialty ?? "",
    base: character.base ?? "",
    trait: character.trait ?? ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentClass = t.classes.find((c) => c.id === selectedClass) ?? null;
  const rank = getRank(level, t.ranks);
  const progress = getLevelProgress(level, xp);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      alert("La imagen es demasiado grande. Máximo 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 150;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        updateCharacter({ avatar: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateCharacter(temp);
    setOpen(false);
  };

  const handleOpen = () => {
    setTemp({
      age: character.age ?? "",
      backstory: character.backstory ?? "",
      specialty: character.specialty ?? "",
      base: character.base ?? "",
      trait: character.trait ?? ""
    });
    setOpen(true);
  };

  const displayName = playerName || t.defaultName;

  const filledFields = [character.age, character.specialty, character.base, character.backstory].filter(Boolean).length;

  const handleSaveName = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setEditingName(false);
  };

  return (
    <>
      {/* Unified Character Card */}
      <div
        onClick={handleOpen}
        className="xfiles-card rounded-lg p-4 cursor-pointer group transition-all relative"
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
      >
        {/* Config button — top-right, visible on hover */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <ThemeSelector />
            <SettingsPanel />
          </div>
        </div>
        {/* Row 1-2: Avatar (left) | Name (right) */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-lg border bg-[rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden" style={{ borderColor: `rgba(${mc.accentRgb},0.25)` }}>
              {character.avatar ? (
                <img src={character.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ transform: 'scale(1.35)' }}>
                  <img src="/gravatar.png" alt="Avatar" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `rgba(${mc.accentRgb},0.15)`, borderColor: `rgba(${mc.accentRgb},0.3)` }}>
              <Camera className="w-2 h-2" style={{ color: mc.accent }} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                ref={nameRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                onBlur={handleSaveName}
                onClick={(e) => e.stopPropagation()}
                className="xfiles-input rounded px-2 py-0.5 text-xs font-mono w-full"
                maxLength={20}
                autoFocus
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempName(playerName);
                  setEditingName(true);
                }}
                className="font-mono text-sm hover:underline cursor-pointer text-left truncate"
                style={{ color: mc.accent }}
              >
                {displayName}
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Level + Rank badge */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3 h-3 shrink-0" style={{ color: mc.accent }} />
            <span className="font-mono text-[10px] text-[#6b8a6b]">
              NIVEL <span className="text-xs font-bold" style={{ color: mc.accent }}>{level}</span>
            </span>
          </div>

          <motion.div
            key={rank.name}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 shrink-0"
            style={{
              backgroundColor: `rgba(${mc.accentRgb},0.08)`,
              border: `1px solid rgba(${mc.accentRgb},0.25)`,
            }}
          >
            <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: mc.accent }}>
              {rank.name}
            </span>
          </motion.div>
        </div>

        {/* Row 4: XP bar */}
        <div className="mt-2">
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

        {/* Divider */}
        <div
          className="my-3"
          style={{ borderTop: `1px solid rgba(${mc.accentRgb},0.08)` }}
        />

        {/* Character info section */}
        <div className="space-y-1.5">
          {currentClass && (() => {
            const ClassIcon = CLASS_ICONS[currentClass.id] ?? Crosshair;
            return (
              <div className="flex items-center gap-1.5">
                <ClassIcon className="w-2.5 h-2.5 text-[#4a6a7a] shrink-0" />
                <span className="font-mono text-[9px] text-[#6b8a6b] truncate">Clase: {currentClass.name}</span>
              </div>
            );
          })()}
          {character.specialty && (
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-2.5 h-2.5 text-[#4a6a7a] shrink-0" />
              <span className="font-mono text-[9px] text-[#6b8a6b] truncate">{character.specialty}</span>
            </div>
          )}
          {character.base && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-2.5 h-2.5 text-[#4a6a7a] shrink-0" />
              <span className="font-mono text-[9px] text-[#6b8a6b] truncate">{character.base}</span>
            </div>
          )}
          {character.age && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-2.5 h-2.5 text-[#4a6a7a] shrink-0" />
              <span className="font-mono text-[9px] text-[#6b8a6b] truncate">{character.age} años</span>
            </div>
          )}
          {character.backstory && (
            <div className="flex items-start gap-1.5">
              <BookOpen className="w-2.5 h-2.5 text-[#4a6a7a] shrink-0 mt-0.5" />
              <span className="font-mono text-[9px] text-[#6b8a6b]">{character.backstory}</span>
            </div>
          )}
        </div>

        {filledFields === 0 && !currentClass && (
          <div className="font-mono text-[9px] text-[#4a5a4a] italic">
            Clic para crear ficha...
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="xfiles-card max-w-md max-h-[90vh] overflow-y-auto scroll-green" style={{ background: dialogBg }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
              {t.agentSheet}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Avatar + Emblem */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-lg border bg-[rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden" style={{ borderColor: `rgba(${mc.accentRgb},0.25)` }}>
                  {character.avatar ? (
                    <img src={character.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ transform: 'scale(1.35)' }}>
                      <img src="/gravatar.png" alt="Avatar" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                {character.avatar && (
                  <button
                    onClick={() => updateCharacter({ avatar: "" })}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.4)] flex items-center justify-center hover:bg-[rgba(239,68,68,0.4)] transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3 text-[#ef4444]" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-3">
                {/* Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="xfiles-btn font-mono text-xs gap-1.5 w-full"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Subir Avatar
                  </Button>
                  <p className="font-mono text-[9px] text-[#4a5a4a] mt-1">
                    JPG/PNG, máx. 500KB
                  </p>
                </div>
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                {t.agentClass}
              </label>
              <ClassDropdown selected={selectedClass} onSelect={setSelectedClass} />
              {currentClass && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[9px] text-[#4a5a4a] mt-1"
                >
                  {currentClass.description}
                </motion.p>
              )}
            </div>

            {/* Age + Specialty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  EDAD
                </label>
                <Input
                  value={temp.age}
                  onChange={(e) => setTemp({ ...temp, age: e.target.value })}
                  placeholder="35"
                  className="xfiles-input"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  <Crosshair className="w-3 h-3 inline mr-1" />
                  ESPECIALIDAD
                </label>
                <Input
                  value={temp.specialty}
                  onChange={(e) => setTemp({ ...temp, specialty: e.target.value })}
                  placeholder="Parapsicología"
                  className="xfiles-input"
                  maxLength={40}
                />
              </div>
            </div>

            {/* Base */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                {t.agentBase}
              </label>
              <Input
                value={temp.base}
                onChange={(e) => setTemp({ ...temp, base: e.target.value })}
                placeholder="FBI — Washington D.C., Sótano"
                className="xfiles-input"
                maxLength={60}
              />
            </div>

            {/* Backstory */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                {t.agentHistory}
              </label>
              <Textarea
                value={temp.backstory}
                onChange={(e) => setTemp({ ...temp, backstory: e.target.value })}
                placeholder="Ex-agente del FBI reasignado a la división de casos no resueltos. Especialista en fenómenos paranormales con una obsesión por la verdad..."
                className="xfiles-input min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="font-mono text-[9px] text-[#4a5a4a] text-right mt-0.5">
                {temp.backstory.length}/500
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="xfiles-btn w-full font-mono text-xs"
            >
              Guardar Ficha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
