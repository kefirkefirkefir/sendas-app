"use client";

import { useState, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { getRank } from "@/lib/rank-system";
import { exportSaveData, importSaveData } from "@/lib/utils";
import { motion } from "framer-motion";
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
import { Input } from "@/components/ui/input";
import { Settings, Minus, ArrowDownToLine, Trash2, AlertTriangle, Download, Upload } from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";

export default function SettingsPanel() {
  const { level, xp, totalXpEarned, availableCoins, missions, subtractXp, setLevel, resetAll } =
    useGameStore();
  const mc = useModeColors();
  const t = useThemeText();

  const [open, setOpen] = useState(false);
  const [xpToRemove, setXpToRemove] = useState("50");
  const [levelTarget, setLevelTarget] = useState("0");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rank = getRank(level, t.ranks);

  const handleSubtractXp = () => {
    const amount = parseInt(xpToRemove) || 0;
    if (amount > 0) {
      subtractXp(amount);
    }
  };

  const handleSetLevel = () => {
    const target = parseInt(levelTarget) || 0;
    setLevel(target);
    setOpen(false);
  };

  const handleReset = () => {
    resetAll();
    setConfirmReset(false);
    setOpen(false);
  };

  const handleExport = () => {
    exportSaveData();
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setConfirmRestore(true);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestoreConfirm = async () => {
    if (!restoreFile) return;
    setImporting(true);
    await importSaveData(restoreFile);
    // If import fails, importSaveData returns false and shows alert
    setImporting(false);
    setConfirmRestore(false);
    setRestoreFile(null);
  };

  const currentMode = useGameStore((s) => s.currentMode);
  const DIALOG_BG: Record<string, string> = {
    neutral: "#0f0d08",
    busqueda: "#080f0a",
    estudio: "#080a12",
    descanso: "#0c0a12",
  };
  const dialogBg = DIALOG_BG[currentMode] ?? DIALOG_BG.neutral;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer" style={{ borderColor: `rgba(${mc.accentRgb},0.25)`, backgroundColor: `rgba(${mc.accentRgb},0.08)` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.4)`; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.25)`; }} data-tooltip="Config">
            <Settings className="w-3 h-3" style={{ color: mc.accent }} />
          </button>
        </DialogTrigger>
        <DialogContent className="xfiles-card max-w-md max-h-[90vh] overflow-y-auto" style={{ background: dialogBg }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
              {t.settingsTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-3">
            {/* Backup & Restore */}
            <div className="xfiles-card rounded p-3">
              <h3 className="font-mono text-[10px] text-[#6b8a6b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Download className="w-3 h-3" />
                Backup / Restaurar
              </h3>
              <p className="font-mono text-[10px] text-[#6b8a6b] mb-3">
                Exporta todo tu progreso a un archivo JSON o restaura desde un backup anterior. La restauración sobrescribe todos los datos actuales.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleExport}
                  className="xfiles-btn font-mono text-xs gap-1.5 w-full"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Backup
                </Button>
                <Button
                  onClick={handleRestoreClick}
                  className="xfiles-btn font-mono text-xs gap-1.5 w-full"
                  style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Restaurar Backup
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>

            {/* Current Status */}
            <div className="xfiles-card rounded p-3">
              <h3 className="font-mono text-[10px] text-[#6b8a6b] uppercase tracking-wider mb-2">
                Estado Actual
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#6b8a6b]">Rango:</span>{" "}
                  <span style={{ color: mc.accent }}>{rank.name}</span>
                </div>
                <div>
                  <span className="text-[#6b8a6b]">Nivel:</span>{" "}
                  <span style={{ color: mc.accent }}>{level}</span>
                </div>
                <div>
                  <span className="text-[#6b8a6b]">XP actual:</span>{" "}
                  <span className="text-[#4ade80]">{xp}</span>
                </div>
                <div>
                  <span className="text-[#6b8a6b]">XP total:</span>{" "}
                  <span className="text-[#4ade80]">{totalXpEarned}</span>
                </div>
                <div>
                  <span className="text-[#6b8a6b]">Monedas:</span>{" "}
                  <span className="text-[#fbbf24]">{availableCoins}</span>
                </div>
                <div>
                  <span className="text-[#6b8a6b]">Misiones:</span>{" "}
                  <span className="text-[#c8d6c0]">{missions.length}</span>
                </div>
              </div>
            </div>

            {/* Subtract XP */}
            <div className="xfiles-card rounded p-3">
              <h3 className="font-mono text-[10px] text-[#6b8a6b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Minus className="w-3 h-3" />
                Restar XP
              </h3>
              <p className="font-mono text-[10px] text-[#6b8a6b] mb-2">
                Reduce la experiencia ganada. Si bajas por debajo de 0, perderás un nivel.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={xpToRemove}
                  onChange={(e) => setXpToRemove(e.target.value)}
                  className="xfiles-input text-xs font-mono"
                  min={1}
                  max={99999}
                />
                <Button
                  onClick={handleSubtractXp}
                  className="xfiles-btn font-mono text-xs gap-1 shrink-0"
                  style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}
                >
                  <Minus className="w-3 h-3" />
                  Restar
                </Button>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[50, 100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setXpToRemove(String(val));
                      subtractXp(val);
                    }}
                    className="font-mono text-[9px] px-2 py-0.5 rounded border border-[rgba(239,68,68,0.2)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-all cursor-pointer"
                  >
                    -{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Restore Level */}
            <div className="xfiles-card rounded p-3">
              <h3 className="font-mono text-[10px] text-[#6b8a6b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowDownToLine className="w-3 h-3" />
                Restaurar Nivel
              </h3>
              <p className="font-mono text-[10px] text-[#6b8a6b] mb-2">
                Establece directamente un nivel inferior. El XP se pondrá a 0.
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={levelTarget}
                  onChange={(e) => setLevelTarget(e.target.value)}
                  className="xfiles-input text-xs font-mono"
                  min={0}
                  max={level}
                />
                <Button
                  onClick={handleSetLevel}
                  className="xfiles-btn font-mono text-xs gap-1 shrink-0"
                  style={{ borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24" }}
                >
                  <ArrowDownToLine className="w-3 h-3" />
                  Aplicar
                </Button>
              </div>
              {/* Quick level buttons */}
              <div className="mt-2">
                <p className="font-mono text-[9px] text-[#4a5a4a] mb-1">Rangos disponibles:</p>
                <div className="flex gap-1 flex-wrap">
                  {t.ranks.filter((r) => r.level < level).map((r) => (
                    <button
                      key={r.level}
                      onClick={() => {
                        setLevelTarget(String(r.level));
                        setLevel(r.level);
                      }}
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-[rgba(251,191,36,0.15)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.08)] transition-all cursor-pointer"
                    >
                      Lv.{r.level} {r.name}
                    </button>
                  ))}
                  {t.ranks.filter((r) => r.level < level).length === 0 && (
                    <span className="font-mono text-[9px] text-[#4a5a4a]">Ya estás en el nivel mínimo</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reset All */}
            <div className="xfiles-card rounded p-3 border-[rgba(239,68,68,0.15)]">
              <h3 className="font-mono text-[10px] text-[#ef4444] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                {t.dangerZone}
              </h3>
              <p className="font-mono text-[10px] text-[#6b8a6b] mb-2">
                Borra todo el progreso: nivel, XP, misiones, recompensas y monedas. Esta acción es irreversible.
              </p>
              <Button
                onClick={() => setConfirmReset(true)}
                className="font-mono text-xs gap-1.5 w-full"
                style={{
                  borderColor: "rgba(239,68,68,0.4)",
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.08)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reiniciar Todo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              ¿Reiniciar todo el progreso?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#6b8a6b]">
              Se eliminará todo: nivel, XP, misiones, recompensas y monedas. El diario de campo y el CRM se conservarán. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#6b8a6b]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)]"
            >
              Sí, reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Backup Confirmation */}
      <AlertDialog open={confirmRestore} onOpenChange={(v) => { if (!v) setRestoreFile(null); setConfirmRestore(v); }}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm" style={{ color: mc.accent }}>
              ¿Restaurar desde backup?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#6b8a6b]">
              {restoreFile && (
                <>
                  Archivo: <span className="text-[#c8d6c0]">{restoreFile.name}</span>
                  <br />
                </>
              )}
              Esto sobrescribirá todo tu progreso actual con los datos del backup. Los datos actuales se perderán. La página se recargará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#6b8a6b]" style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }} disabled={importing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={importing}
              className="font-mono text-xs border hover:brightness-110"
              style={{
                borderColor: `rgba(${mc.accentRgb},0.4)`,
                color: mc.accent,
                background: `rgba(${mc.accentRgb},0.15)`,
              }}
            >
              {importing ? "Restaurando..." : "Sí, restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
