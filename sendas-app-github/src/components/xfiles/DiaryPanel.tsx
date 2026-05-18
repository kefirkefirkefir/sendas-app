"use client";

import { useState, useMemo, useCallback } from "react";
import { useGameStore } from "@/lib/game-store";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Trash2,
  ChevronRight,
  Download,
  Eye,
  XCircle,
} from "lucide-react";

export default function DiaryPanel() {
  const { diaryEntries, addDiaryEntry, deleteDiaryEntry, clearAllDiaryEntries } = useGameStore();
  const mc = useModeColors();
  const t = useThemeText();
  const currentMode = useGameStore((s) => s.currentMode);

  const MODE_BG: Record<string, string> = {
    neutral: "rgba(10,9,5,0.97)",
    busqueda: "rgba(5,10,6,0.97)",
    estudio: "rgba(5,6,12,0.97)",
    descanso: "rgba(8,6,12,0.97)",
  };
  const overlayBg = MODE_BG[currentMode] ?? MODE_BG.neutral;

  const [text, setText] = useState("");
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [readerOpen, setReaderOpen] = useState(false);

  // Delete confirmation states
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addDiaryEntry(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDeleteEntry = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmDeleteEntry = useCallback(() => {
    if (deleteTarget) {
      deleteDiaryEntry(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDiaryEntry]);

  const handleBulkDelete = useCallback(() => {
    setConfirmBulkDelete(true);
  }, []);

  const confirmBulkDeleteEntries = useCallback(() => {
    clearAllDiaryEntries();
    setConfirmBulkDelete(false);
    setReaderOpen(false);
  }, [clearAllDiaryEntries]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return `${dateStr} — hoy`;
    if (dateStr === yesterday) return `${dateStr} — ayer`;
    return dateStr;
  };

  const SPANISH_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  const formatDateSpanish = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const month = SPANISH_MONTHS[d.getMonth()];
    return `${day} de ${month}`;
  };

  // Sequential entry numbers: oldest entry = 001, newest = last
  const entryNumbers = useMemo(() => {
    const map = new Map<string, number>();
    const reversed = [...diaryEntries].reverse();
    reversed.forEach((entry, idx) => {
      map.set(entry.id, idx + 1);
    });
    return map;
  }, [diaryEntries]);

  const formatJsonText = (entryText: string) => {
    return entryText
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  };

  // Group entries by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof diaryEntries> = {};
    for (const entry of diaryEntries) {
      const dateKey = new Date(entry.date).toISOString().slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [diaryEntries]);

  const toggleDate = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const getEntryHeader = (entry: { id: string; date: string }) => {
    const num = entryNumbers.get(entry.id) ?? 0;
    const paddedNum = String(num).padStart(3, "0");
    const dateStr = formatDateSpanish(entry.date);
    return `Entrada ${paddedNum} - ${dateStr}`;
  };

  return (
    <div className="flex flex-col min-h-0 h-full gap-3">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-[#7dd3fc] shrink-0" />
            <div>
              <h2 className="font-mono text-xs text-[#7dd3fc] uppercase tracking-wider">
                {t.diaryTitle}
              </h2>
              <p className="font-mono text-[9px] text-[#4a6a7a] tracking-wider mt-0.5">
                {t.diarySubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-[#4a6a7a]">
              {diaryEntries.length} {diaryEntries.length === 1 ? "entrada" : "entradas"}
            </span>
            {diaryEntries.length > 0 && (
              <>
                <button
                  onClick={() => setReaderOpen(true)}
                  className="text-[#4a6a7a] hover:text-[#7dd3fc] transition-colors duration-200"
                  data-tooltip="Leer archivo"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const json = JSON.stringify(diaryEntries, null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `diario-campo-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[#4a6a7a] hover:text-[#7dd3fc] transition-colors duration-200"
                  data-tooltip="Exportar como JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0" style={{ height: '40%' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='{ "text": "escribir entrada..." }'
          className="w-full h-full bg-[rgba(0,20,30,0.5)] border border-[rgba(125,211,252,0.1)] rounded px-3 py-2 font-mono text-[11px] text-[#94a3b8] placeholder-[#3a4a5a] resize-none focus:outline-none focus:border-[rgba(125,211,252,0.25)] focus:shadow-[0_0_8px_rgba(125,211,252,0.05)] transition-colors duration-200"
        />
      </div>

      {/* Scrollable entries grouped by date */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-cyan">
        {diaryEntries.length === 0 && (
          <div className="font-mono text-[10px] text-[#3a4a5a] text-center py-8 tracking-wider">
            {`{ }`}
          </div>
        )}

        {grouped.map(([dateKey, entries]) => {
          const isCollapsed = collapsedDates.has(dateKey);
          return (
            <div key={dateKey} className="mb-1">
              <button
                onClick={() => toggleDate(dateKey)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors duration-150"
                style={{ ['--hover-bg' as string]: `rgba(125,211,252,0.06)` }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `rgba(125,211,252,0.2)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <ChevronRight
                  className={`w-2.5 h-2.5 text-[#4a6a7a] shrink-0 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`}
                />
                <span className="font-mono text-[9px] text-[#4a6a7a] tracking-wider">
                  {`"${formatDateLabel(dateKey)}"`}
                </span>
                <span className="font-mono text-[8px] text-[#3a4a5a] ml-auto">
                  [{entries.length}]
                </span>
              </button>

              {!isCollapsed && (
                <div className="space-y-1 ml-1 border-l border-[rgba(125,211,252,0.06)] pl-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group bg-[rgba(0,15,25,0.4)] border border-[rgba(125,211,252,0.06)] rounded px-3 py-2 hover:border-[rgba(125,211,252,0.15)] transition-colors duration-200"
                    >

                      <div className="font-mono text-[10px] text-[#7dd3fc] mb-1 opacity-70">
                        {getEntryHeader(entry)}
                      </div>
                      <pre className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words">
                        <span className="text-[#4a6a7a]">{`{`}</span>
                        {"\n"}
                        <span className="text-[#4a6a7a]">{`  `}</span>
                        <span className="text-[#7dd3fc]">{`"time"`}</span>
                        <span className="text-[#4a6a7a]">{`: `}</span>
                        <span className="text-[#86efac]">{`"${formatTime(entry.date)}"`}</span>
                        <span className="text-[#4a6a7a]">{`,`}</span>
                        {"\n"}
                        <span className="text-[#4a6a7a]">{`  `}</span>
                        <span className="text-[#7dd3fc]">{`"text"`}</span>
                        <span className="text-[#4a6a7a]">{`: `}</span>
                        <span className="text-[#c8d6c0]">{`"${formatJsonText(entry.text)}"`}</span>
                        {"\n"}
                        <span className="text-[#4a6a7a]">{`}`}</span>
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reader Dialog */}
      <Dialog open={readerOpen} onOpenChange={setReaderOpen}>
        <DialogContent className="xfiles-card max-h-[94vh] border-[rgba(125,211,252,0.15)]" overlayClassName="bg-black/85" style={{ background: overlayBg, maxWidth: "40rem" }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-[#7dd3fc] text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t.diaryArchive}
              <span className="font-mono text-[9px] text-[#4a6a7a] font-normal ml-auto">
                {diaryEntries.length} entradas
              </span>
            </DialogTitle>
          </DialogHeader>

          {diaryEntries.length === 0 ? (
            <div className="py-12 text-center">
              <pre className="font-mono text-[10px] text-[#3a4a5a] tracking-wider">{`{ }`}</pre>
              <p className="font-mono text-[9px] text-[#3a4a5a] mt-2 tracking-wider">
                {t.diaryEmpty}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto scroll-cyan max-h-[55vh] pr-1">
                {grouped.map(([dateKey, entries]) => (
                  <div key={dateKey} className="mb-4 last:mb-0">
                    {/* Date separator */}
                    <div className="font-mono text-[9px] text-[#4a6a7a] tracking-wider border-b border-[rgba(125,211,252,0.06)] pb-1 mb-2">
                      {formatDateLabel(dateKey)}
                    </div>

                    {/* Entries — plain text reader */}
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div key={entry.id} className="group relative pl-3 pr-6 border-l-2 border-[rgba(125,211,252,0.1)]">
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="absolute top-0 right-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[#4a5a5a] hover:text-[#ef4444] transition-all duration-200 p-0.5"
                            data-tooltip="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="font-mono text-[11px] text-[#7dd3fc] mb-0.5 opacity-70">
                            {getEntryHeader(entry)}
                          </div>
                          <div className="font-mono text-[10px] text-[#4a6a7a] mb-0.5">
                            {formatTime(entry.date)}
                          </div>
                          <p className="font-mono text-[13px] text-[#c8d6c0] leading-relaxed whitespace-pre-wrap break-words">
                            {entry.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk delete button at the bottom of the reader */}
              <div className="border-t border-[rgba(125,211,252,0.08)] pt-3 mt-2">
                <button
                  onClick={handleBulkDelete}
                  className="font-mono text-[9px] text-[#6b4a4a] hover:text-[#ef4444] transition-colors duration-200 flex items-center gap-1.5"
                  data-tooltip="Eliminar todas las entradas"
                >
                  <XCircle className="w-3 h-3" />
                  Eliminar todo el archivo
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm single delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              Eliminar entrada del diario
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#6b8a6b]">
              Esta entrada se eliminará permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#6b8a6b]" style={{ borderColor: "rgba(125,211,252,0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={() => {
                if (deleteTarget) {
                  deleteDiaryEntry(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Eliminar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm bulk delete */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              Eliminar todo el archivo
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#6b8a6b]">
              Se eliminarán permanentemente las {diaryEntries.length} entradas del diario de campo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#6b8a6b]" style={{ borderColor: "rgba(125,211,252,0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={() => {
                clearAllDiaryEntries();
                setConfirmBulkDelete(false);
                setReaderOpen(false);
              }}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Eliminar todo ({diaryEntries.length})
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
