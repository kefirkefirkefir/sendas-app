"use client";

import { useState, useMemo } from "react";
import { useGameStore, type Reward } from "@/lib/game-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ShoppingBag, Trash2, RotateCcw, BookmarkPlus, Tag, Zap, Coins, FolderCheck, Coffee, Film, Trees, Beer, Compass, Eye, Radio, Rocket, type LucideIcon } from "lucide-react";

const REWARD_ICONS: Record<string, LucideIcon> = {
  FolderCheck, Coffee, Film, Trees, Beer, Compass, Eye, Radio, Rocket,
};

function getRewardIcon(iconName?: string): LucideIcon {
  return (iconName && REWARD_ICONS[iconName]) || ShoppingBag;
}

import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";

// ---- Weekly Deal Helper ----

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Simple deterministic hash → random index per week+year
function seededIndex(seed: number, max: number): number {
  let h = (seed * 2654435761) >>> 0; // Knuth multiplicative hash
  h = ((h ^ (h >> 16)) * 2246822519) >>> 0;
  return h % max;
}

function getWeeklyDeal(templates: { name: string; description: string; cost: number; icon: string }[], seed?: number): { template: typeof templates[number]; originalCost: number; dealCost: number } {
  const now = new Date();
  const week = getISOWeek(now);
  const baseSeed = now.getFullYear() * 100 + week;
  const idx = seededIndex(seed !== undefined ? baseSeed + seed : baseSeed, templates.length);
  const template = templates[idx];
  const dealCost = Math.round(template.cost * 0.9);
  return { template, originalCost: template.cost, dealCost };
}

export default function RewardShop() {
  const {
    rewards,
    availableCoins,
    redeemedRewards,
    createReward,
    redeemReward,
    removeRedeemedReward,
    deleteReward,
    weeklyDealSeed,
  } = useGameStore();
  const currentMode = useGameStore((s) => s.currentMode);
  const mc = useModeColors();
  const t = useThemeText();

  const MODE_BG: Record<string, string> = {
    neutral: "rgba(15,13,8,0.95)",
    busqueda: "rgba(8,15,10,0.95)",
    estudio: "rgba(8,10,18,0.95)",
    descanso: "rgba(12,10,18,0.95)",
  };
  const MODE_BG_LIGHT: Record<string, string> = {
    neutral: "rgba(15,13,8,0.85)",
    busqueda: "rgba(8,15,10,0.85)",
    estudio: "rgba(8,10,18,0.85)",
    descanso: "rgba(12,10,18,0.85)",
  };
  const MODE_BG_MID: Record<string, string> = {
    neutral: "rgba(15,13,8,0.5)",
    busqueda: "rgba(8,15,10,0.5)",
    estudio: "rgba(8,10,18,0.5)",
    descanso: "rgba(12,10,18,0.5)",
  };
  const modeBg = MODE_BG[currentMode] ?? MODE_BG.neutral;
  const modeBgLight = MODE_BG_LIGHT[currentMode] ?? MODE_BG_LIGHT.neutral;
  const modeBgMid = MODE_BG_MID[currentMode] ?? MODE_BG_MID.neutral;
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [tab, setTab] = useState<"shop" | "history">("shop");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("50");
  const [selectedIcon, setSelectedIcon] = useState("ShoppingBag");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  // Weekly deal — uses store seed for randomization on reset, theme-aware templates
  const weeklyDeal = useMemo(() => getWeeklyDeal(t.rewards, weeklyDealSeed), [t.rewards, weeklyDealSeed]);

  const handleTemplateSelect = (idx: string) => {
    setSelectedTemplate(idx);
    if (idx === "none") return;
    const tpl = t.rewards[parseInt(idx)];
    if (!tpl) return;
    setName(tpl.name);
    setDescription(tpl.description);
    setCost(String(tpl.cost));
    setSelectedIcon(tpl.icon);
  };

  const handleCreate = () => {
    if (!name.trim() || !cost) return;
    createReward({
      name: name.trim(),
      description: description.trim(),
      cost: parseInt(cost) || 50,
      icon: selectedIcon,
    });
    setName("");
    setDescription("");
    setCost("50");
    setSelectedIcon("ShoppingBag");
    setSelectedTemplate("none");
    setCreateOpen(false);
  };

  const handleClaimWeeklyDeal = () => {
    createReward({
      name: weeklyDeal.template.name,
      description: weeklyDeal.template.description,
      cost: weeklyDeal.dealCost,
      icon: weeklyDeal.template.icon,
    });
  };

  const confirmReward = redeemReward;
  const rewardToConfirm = confirmId
    ? rewards.find((r) => r.id === confirmId)
    : null;

  const daysUntilNextWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    return daysToMonday;
  }, []);

  const sortedRedeemed = useMemo(() => {
    return [...redeemedRewards].sort((a, b) => (b.redeemedAt || "").localeCompare(a.redeemedAt || ""));
  }, [redeemedRewards]);

  return (
    <div className="flex flex-col min-h-0 h-full gap-3">
      {/* Header — mirrors MissionPanel structure */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5" style={{ color: mc.accent }} />
          <div>
            <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: mc.accent }}>
              {t.shopTitle}
            </h2>
            <p className="font-mono text-[9px] text-[#4a5a4a] tracking-wider mt-0.5">
              {t.shopSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs px-2 py-0.5"
            style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: "#fbbf24" }}
          >
            {availableCoins} <Coins className="w-3 h-3 inline ml-0.5 text-[#fbbf24]" />
          </Badge>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="xfiles-btn font-mono text-xs gap-1.5" style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent, background: `rgba(${mc.accentRgb},0.08)` }}>
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: modeBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
                {t.newReward}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Template selector */}
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] flex items-center gap-1.5 mb-1.5">
                  <BookmarkPlus className="w-3 h-3" />
                  {t.quickTemplate}
                </label>
                <div className="grid gap-1 max-h-[180px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect("none")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono text-left transition-all cursor-pointer"
                    style={selectedTemplate === "none"
                      ? { background: `rgba(${mc.accentRgb},0.15)`, color: mc.accent, border: `1px solid rgba(${mc.accentRgb},0.3)` }
                      : { background: "rgba(0,0,0,0.3)", color: "#6b8a6b", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Personalizada
                  </button>
                  {t.rewards.map((tpl, i) => {
                    const Ic = getRewardIcon(tpl.icon);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleTemplateSelect(String(i))}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono text-left transition-all cursor-pointer"
                        style={selectedTemplate === String(i)
                          ? { background: `rgba(${mc.accentRgb},0.15)`, color: mc.accent, border: `1px solid rgba(${mc.accentRgb},0.3)` }
                          : { background: "rgba(0,0,0,0.3)", color: "#c8d6c0", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <Ic className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 truncate">{tpl.name}</span>
                        <span className="shrink-0 text-[10px] opacity-60">{tpl.cost} <Coins className="w-2.5 h-2.5 inline text-[#fbbf24]" /></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  NOMBRE
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cena con amigos..."
                  className="xfiles-input"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  DESCRIPCIÓN (OPCIONAL)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles..."
                  className="xfiles-input min-h-[50px] resize-none"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  COSTO EN MONEDAS
                </label>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="xfiles-input"
                  min={1}
                  max={9999}
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full font-mono text-xs mt-2"
                style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent, background: `rgba(${mc.accentRgb},0.12)` }}
                disabled={!name.trim()}
              >
                Crear Recompensa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tabs — mirrors filter row in MissionPanel */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <button
          onClick={() => setTab("shop")}
          className="font-mono text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer"
          style={tab === "shop" ? { borderColor: mc.accent, color: mc.accent, background: `rgba(${mc.accentRgb},0.08)` } : { borderColor: "rgba(255,255,255,0.1)", color: "#6b8a6b" }}
        >
          Mercado
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setTab(tab === "history" ? "shop" : "history")}
          className="font-mono text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer"
          style={tab === "history" ? { borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent } : { borderColor: "rgba(255,255,255,0.1)", color: "#6b8a6b" }}
        >
          {tab === "history" ? "Ocultar" : "Mostrar"} canjeadas{redeemedRewards.length > 0 ? ` (${redeemedRewards.length})` : ""}
        </button>
      </div>

      {tab === "shop" && (
        <div className="flex-1 min-h-0 overflow-y-auto scroll-green">
          <div className="flex flex-col gap-3">
          {/* Weekly Deal */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded border p-3 overflow-hidden"
            style={{ borderColor: `rgba(${mc.accentRgb},0.4)`, background: `rgba(${mc.accentRgb},0.06)`, boxShadow: `0 0 12px rgba(${mc.accentRgb},0.08)` }}
          >
            {/* Glow accent lines top + bottom */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-60" style={{ background: `linear-gradient(to right, transparent, ${mc.accent}, transparent)` }} />
            <div className="absolute bottom-0 left-0 right-0 h-px opacity-40" style={{ background: `linear-gradient(to right, transparent, ${mc.accent}, transparent)` }} />

            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{(() => { const Ic = getRewardIcon(weeklyDeal.template.icon); return <Ic className="w-6 h-6" style={{ color: mc.accent }} />; })()}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-[#c8d6c0] font-medium">
                  {weeklyDeal.template.name}
                </div>
                {weeklyDeal.template.description && (
                  <div className="font-mono text-[10px] text-[#6b8a6b] truncate mt-0.5">
                    {weeklyDeal.template.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-[10px] font-bold text-[#fbbf24]">
                    {weeklyDeal.dealCost} <Coins className="w-3 h-3 inline text-[#fbbf24]" />
                  </span>
                  <span className="font-mono text-[9px] text-[#4a5a4a] line-through">
                    {weeklyDeal.originalCost}
                  </span>
                  <span className="font-mono text-[9px] text-[#4ade80] font-bold">
                    -10%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" style={{ color: mc.accent }} />
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: mc.accent }}>
                    {t.weeklyOffer}
                  </span>
                </div>
                <button
                  onClick={handleClaimWeeklyDeal}
                  className="font-mono text-[10px] px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1"
                  style={{ borderColor: mc.accent, color: mc.accent, background: `rgba(${mc.accentRgb},0.12)` }}
                >
                  <Zap className="w-3 h-3" />
                  Reclamar
                </button>
                <span className="font-mono text-[10px] text-[#4a5a4a]">
                  Renueva en {daysUntilNextWeek}d
                </span>
              </div>
            </div>
          </motion.div>

          {/* Reward list */}
          <div className="space-y-2">
            <AnimatePresence>
              {rewards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="font-mono text-xs text-[#6b8a6b]">
                    Sin recompensas. Reclama la oferta semanal o crea una.
                  </div>
                </motion.div>
              ) : (
                rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    canAfford={availableCoins >= reward.cost}
                    onRedeem={() => setConfirmId(reward.id)}
                    onDelete={() => deleteReward(reward.id)}
                    modeBgLight={modeBgLight}
                    accent={mc.accent}
                    accentRgb={mc.accentRgb}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scroll-green">
          {redeemedRewards.length === 0 ? (
            <div className="text-center py-6">
              <div className="font-mono text-xs text-[#6b8a6b]">
                No has canjeado recompensas todavía.
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {sortedRedeemed.map((red, idx) => {
                const Ic = getRewardIcon(red.icon);
                return (
                  <motion.div
                    key={`${red.id}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="rounded p-3 flex items-center gap-3 border backdrop-blur-md"
                    style={{ borderColor: `rgba(${mc.accentRgb},0.06)`, background: modeBgMid }}
                  >
                    <Ic className="w-6 h-6" style={{ color: mc.accent }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-[#6b8a6b] line-through">
                        {red.name}
                      </div>
                      {red.description && (
                        <div className="font-mono text-[10px] text-[#4a5a4a] truncate">
                          {red.description}
                        </div>
                      )}
                      <div className="font-mono text-[10px] text-[#4a5a4a]">
                        {red.cost} <Coins className="w-3 h-3 inline text-[#fbbf24]" /> canjeados
                      </div>
                      {red.redeemedAt && (
                        <div className="font-mono text-[9px] text-[#3a4a3a]">
                          {new Date(red.redeemedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeRedeemedReward(redeemedRewards.indexOf(red))}
                      className="shrink-0 text-[#4a5a4a] hover:text-[#ef4444] transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <AlertDialogContent className="rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: modeBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
              ¿Canjear recompensa?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#6b8a6b]">
              {rewardToConfirm && (
                <>
                  {(() => { const Ic = getRewardIcon(rewardToConfirm.icon); return <Ic className="w-3.5 h-3.5 inline" style={{ color: mc.accent }} />; })()} <strong>{rewardToConfirm.name}</strong>{" "}
                  — Costo: {rewardToConfirm.cost} <Coins className="w-3 h-3 inline text-[#fbbf24]" />
                  <br />
                  Tienes {availableCoins} monedas disponibles.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-mono text-xs border text-[#6b8a6b]"
              style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmId) confirmReward(confirmId);
                setConfirmId(null);
              }}
              className="font-mono text-xs border"
              style={{ background: `rgba(${mc.accentRgb},0.15)`, color: mc.accent, borderColor: `rgba(${mc.accentRgb},0.3)` }}
            >
              Canjear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RewardCard({
  reward,
  canAfford,
  onRedeem,
  onDelete,
  modeBgLight,
  accent,
  accentRgb,
}: {
  reward: Reward;
  canAfford: boolean;
  onRedeem: () => void;
  onDelete: () => void;
  modeBgLight: string;
  accent: string;
  accentRgb: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded p-3 group border backdrop-blur-md transition-all"
      style={{ background: modeBgLight, borderColor: `rgba(${accentRgb},0.12)` }}
    >
      <div className="flex items-center gap-3">
        {(() => { const Ic = getRewardIcon(reward.icon); return <Ic className="w-6 h-6" style={{ color: accent }} />; })()}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-[#c8d6c0]">{reward.name}</div>
          {reward.description && (
            <div className="font-mono text-[10px] text-[#6b8a6b] truncate">
              {reward.description}
            </div>
          )}
          <div className="font-mono text-[10px] mt-0.5 text-[#fbbf24]">
            {reward.cost} <Coins className="w-3 h-3 inline text-[#fbbf24]" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRedeem}
            disabled={!canAfford}
            className="font-mono text-[10px] px-2.5 py-1 rounded border transition-all cursor-pointer"
            style={canAfford
              ? { borderColor: accent, color: accent, background: `rgba(${accentRgb},0.15)` }
              : { borderColor: "rgba(255,255,255,0.1)", color: "#4a5a4a" }}
          >
            Canjear
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6b8a6b] hover:text-[#ff4444] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
