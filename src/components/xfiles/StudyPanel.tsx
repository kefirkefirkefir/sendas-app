"use client";

import { useState, useCallback, useRef } from "react";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useGameStore, type Stats, type Difficulty } from "@/lib/game-store";
import {
  useStudyStore,
  type Oposicion, type Idioma, type Curso, type Asignatura, type Evaluacion,
  type TemaFase, type TemaPrioridad, type TemaOposicion, type TemaIdioma, type TemaAsignatura, type TemaAsignaturaTipo,
  type Bloque, type TestResult,
} from "@/lib/study-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BookOpen, Plus, Trash2, ArrowLeft, GraduationCap, Languages, School, Zap, BarChart3, ArrowDown, CheckCircle2, BookOpenCheck, FileDown, FileUp, Lightbulb, ClipboardList, Pencil, X, Target, Eye, BookMarked, RefreshCw, Brain, Trophy, Clock, Calendar, Building2, Award, AlertTriangle, Save, Search, Users, Circle, ListChecks, FileText } from "lucide-react";

// ---- Constants ----

const MODE_BG: Record<string, string> = {
  neutral: "rgba(15,13,8,0.95)",
  busqueda: "rgba(8,15,10,0.95)",
  estudio: "rgba(8,10,18,0.95)",
  descanso: "rgba(12,10,18,0.95)",
};

const FASE_LABELS: Record<TemaFase, string> = {
  no_visto: "No visto",
  aprendiendo: "Aprendiendo",
  practicando: "Practicando",
  repasando: "Repasando",
  dominado: "Dominado",
};

const FASE_ICONS: Record<TemaFase, React.ReactNode> = {
  no_visto: <Eye className="w-3 h-3 text-[#4a5a4a]" />,
  aprendiendo: <BookMarked className="w-3 h-3 text-[#60a5fa]" />,
  practicando: <Brain className="w-3 h-3 text-[#fbbf24]" />,
  repasando: <RefreshCw className="w-3 h-3 text-[#a78bfa]" />,
  dominado: <Trophy className="w-3 h-3 text-[#4ade80]" />,
};

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  Pendiente: <Clock className="w-3 h-3" />,
  Cursando: <BookOpen className="w-3 h-3" />,
  Aprobada: <Award className="w-3 h-3" />,
  Suspensa: <AlertTriangle className="w-3 h-3" />,
  Convalidada: <CheckCircle2 className="w-3 h-3" />,
};

const FASE_ACTION_LABELS: Partial<Record<TemaFase, string>> = {
  aprendiendo: "Estudiar",
  practicando: "Practicar",
  repasando: "Repasar",
};

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "text-[#4a5a4a]",
  Cursando: "text-[#60a5fa]",
  Aprobada: "text-[#4ade80]",
  Suspensa: "text-[#ef4444]",
  Convalidada: "text-[#a78bfa]",
};

const selectClass =
  "w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-3 py-2 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer";

const inputClass =
  "w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-3 py-2 font-mono text-[12px] text-[#c8d6c0] placeholder-[#4a5a4a] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]";

const textareaClass =
  "w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-3 py-2 font-mono text-[12px] text-[#c8d6c0] placeholder-[#4a5a4a] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] resize-none min-h-[60px]";

const labelClass =
  "font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider flex items-center gap-1.5 mb-1";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
  legendario: "Legendario",
};

const DIFFICULTY_COINS: Record<Difficulty, number> = {
  facil: 10,
  medio: 25,
  dificil: 50,
  legendario: 100,
};

const DIFFICULTY_XP_MULTI: Record<Difficulty, number> = {
  facil: 1,
  medio: 1.5,
  dificil: 2,
  legendario: 3,
};

const CATEGORY_MULTI_LABELS: Record<keyof Stats, { xp: number; coins: number }> = {
  trabajo: { xp: 1, coins: 1 },
  oposicion: { xp: 1, coins: 1 },
  salud: { xp: 0.5, coins: 0.5 },
  asociacion: { xp: 0.5, coins: 0.5 },
  ocio: { xp: 0, coins: 0 },
};

// ---- Empty form defaults ----

const EMPTY_OPOSICION = {
  nombre: "",
  organismo: "",
  fechaExamen: "",
  tipoExamen: ["Test memorístico"] as string[],
  tieneExamenesAnteriores: "No" as Oposicion["tieneExamenesAnteriores"],
  plazas: "",
  aspirantes: "",
  notaCorte: "",
  pesoBloques: "",
  bloques: [] as Bloque[],
};

const EMPTY_IDIOMA = {
  nombre: "",
  idioma: "",
  nivel: "",
  fechaExamen: "",
};

const EMPTY_CURSO = {
  nombre: "",
  institucion: "",
  tipo: "Grado" as Curso["tipo"],
};

const EMPTY_ASIGNATURA = {
  nombre: "",
  creditos: 6,
  estado: "Pendiente" as Asignatura["estado"],
  fechaExamen: "",
};

// ---- Calculation helpers ----

function calcOposicionProgress(op: Oposicion): number {
  if (op.temas.length === 0) return 0;
  return Math.round((op.temas.filter((t) => t.aciertoMedio !== null).length / op.temas.length) * 100);
}

function calcIdiomaProgress(idi: Idioma): number {
  if (idi.temas.length === 0) return 0;
  return Math.round((idi.temas.filter((t) => t.completado).length / idi.temas.length) * 100);
}

function calcCursoProgress(curso: Curso): number {
  const allTemas = curso.asignaturas.flatMap((a) => a.temas);
  if (allTemas.length === 0) return 0;
  const done = allTemas.filter((t) => t.completado || t.fase === "dominado").length;
  return Math.round((done / allTemas.length) * 100);
}

function calcAsignaturaProgress(asig: Asignatura): number {
  if (asig.temas.length === 0) return 0;
  const done = asig.temas.filter((t) => t.completado || t.fase === "dominado").length;
  return Math.round((done / asig.temas.length) * 100);
}

function calcNotaFinal(evals: Evaluacion[]): string {
  const withNota = evals.filter((e) => e.nota !== null);
  if (withNota.length === 0) return "---";
  const sumWeighted = withNota.reduce((s, e) => s + e.nota! * e.peso, 0);
  const sumPesos = withNota.reduce((s, e) => s + e.peso, 0);
  if (sumPesos === 0) return "---";
  return (sumWeighted / sumPesos).toFixed(2);
}

function calcSumPesos(evals: Evaluacion[]): number {
  return evals.reduce((s, e) => s + e.peso, 0);
}

function calcNeededForPass(evals: Evaluacion[]): number | null {
  const withNota = evals.filter((e) => e.nota !== null);
  const withoutNota = evals.filter((e) => e.nota === null);
  if (withNota.length === 0 || withoutNota.length === 0) return null;
  const sumPesosConNota = withNota.reduce((s, e) => s + e.peso, 0);
  const sumPesosSinNota = withoutNota.reduce((s, e) => s + e.peso, 0);
  const currentWeighted = withNota.reduce((s, e) => s + e.nota! * e.peso, 0);
  const needed = (5 * (sumPesosConNota + sumPesosSinNota) - currentWeighted) / sumPesosSinNota;
  return needed;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "---";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function downloadCSV(csvStr: string, filename: string) {
  const blob = new Blob(["" + csvStr], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Oposición helpers ----

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return "Hace " + diff + " días";
  const weeks = Math.floor(diff / 7);
  if (weeks < 5) return "Hace " + weeks + " semana" + (weeks > 1 ? "s" : "");
  return "Hace " + Math.floor(diff / 30) + " mese" + (Math.floor(diff / 30) > 1 ? "s" : "");
}

function getDiasProximoRepaso(aciertoMedio: number | null): number {
  if (aciertoMedio === null) return 7; // default if no tests
  if (aciertoMedio >= 90) return 14;
  if (aciertoMedio >= 70) return 7;
  if (aciertoMedio >= 50) return 3;
  return 1;
}

function getDiasParaRepaso(tema: TemaOposicion): number {
  if (!tema.fechaUltimoRepaso && !tema.fechaUltimoEstudio) return 99; // never studied
  const lastActivity = tema.fechaUltimoRepaso || tema.fechaUltimoEstudio;
  const dias = getDiasProximoRepaso(tema.aciertoMedio);
  const last = new Date(lastActivity! + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diasTranscurridos = Math.floor((now.getTime() - last.getTime()) / 86400000);
  return dias - diasTranscurridos;
}

type AutoPriority = "alta" | "media" | "baja";

function getAutoPriority(tema: TemaOposicion): AutoPriority {
  const diasRepaso = getDiasParaRepaso(tema);
  const diasSinEstudio = tema.fechaUltimoEstudio
    ? Math.floor((Date.now() - new Date(tema.fechaUltimoEstudio + "T00:00:00").getTime()) / 86400000)
    : 9999;

  if (diasRepaso < -2 || (tema.aciertoMedio !== null && tema.aciertoMedio < 60) || diasSinEstudio > 14) {
    return "alta";
  }
  if ((diasRepaso >= -2 && diasRepaso <= 7) || (tema.aciertoMedio !== null && tema.aciertoMedio >= 60 && tema.aciertoMedio < 70)) {
    return "media";
  }
  return "baja";
}

function calcProbabilidadAprobar(op: Oposicion): number {
  if (op.temas.length === 0) return 0;
  const temasConDatos = op.temas.filter((t) => t.aciertoMedio !== null);
  if (temasConDatos.length === 0) return 0;

  if (op.bloques.length === 0) {
    return Math.round(temasConDatos.reduce((s, t) => s + t.aciertoMedio!, 0) / temasConDatos.length);
  }

  const totalPeso = op.bloques.reduce((s, b) => s + b.peso, 0);
  if (totalPeso === 0) return Math.round(temasConDatos.reduce((s, t) => s + t.aciertoMedio!, 0) / temasConDatos.length);

  let aciertoPonderado = 0;
  let pesoCubierto = 0;

  for (const bloque of op.bloques) {
    const temasBloque = op.temas.filter((t) => t.bloque === bloque.id);
    if (temasBloque.length === 0) continue;
    const avgAcierto = temasBloque.reduce((s, t) => s + (t.aciertoMedio ?? 0), 0) / temasBloque.length;
    aciertoPonderado += avgAcierto * bloque.peso;
    pesoCubierto += bloque.peso;
  }

  const temasSinBloque = op.temas.filter((t) => !t.bloque || !op.bloques.find((b) => b.id === t.bloque));
  if (temasSinBloque.length > 0 && pesoCubierto < totalPeso) {
    const pesoRestante = totalPeso - pesoCubierto;
    const avgSinBloque = temasSinBloque.reduce((s, t) => s + (t.aciertoMedio ?? 0), 0) / temasSinBloque.length;
    aciertoPonderado += avgSinBloque * pesoRestante;
  }

  return Math.round(aciertoPonderado / totalPeso);
}

function getAciertoGlobal(op: Oposicion): number | null {
  const conDatos = op.temas.filter((t) => t.aciertoMedio !== null);
  if (conDatos.length === 0) return null;
  return Math.round(conDatos.reduce((s, t) => s + t.aciertoMedio!, 0) / conDatos.length);
}

interface BloqueStat {
  nombre: string;
  acierto: number;
  peso: number;
}

function getBloqueStats(op: Oposicion): BloqueStat[] {
  return op.bloques.map((b) => {
    const temas = op.temas.filter((t) => t.bloque === b.id);
    const avg = temas.length > 0 ? temas.reduce((s, t) => s + (t.aciertoMedio ?? 0), 0) / temas.length : 0;
    return { nombre: b.nombre, acierto: Math.round(avg), peso: b.peso };
  });
}

function getBloqueDebil(op: Oposicion): BloqueStat | null {
  const stats = getBloqueStats(op).filter((s) => op.temas.some((t) => t.bloque === op.bloques.find((b) => b.nombre === s.nombre)?.id));
  if (stats.length === 0) return null;
  return stats.reduce((min, s) => s.acierto < min.acierto ? s : min, stats[0]);
}

function getBloqueFuerte(op: Oposicion): BloqueStat | null {
  const stats = getBloqueStats(op).filter((s) => op.temas.some((t) => t.bloque === op.bloques.find((b) => b.nombre === s.nombre)?.id));
  if (stats.length === 0) return null;
  return stats.reduce((max, s) => s.acierto > max.acierto ? s : max, stats[0]);
}

function probColor(pct: number): string {
  if (pct >= 70) return "text-[#4ade80]";
  if (pct >= 50) return "text-[#fbbf24]";
  return "text-[#ef4444]";
}

function autoPriorityColor(p: AutoPriority): string {
  if (p === "alta") return "text-[#ef4444]";
  if (p === "media") return "text-[#fbbf24]";
  return "text-[#4ade80]";
}

function autoPriorityLabel(p: AutoPriority): string {
  if (p === "alta") return "Alta";
  if (p === "media") return "Media";
  return "Baja";
}

// ---- Small UI components ----

function ProgressLine({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full xfiles-progress overflow-hidden">
      <div
        className="h-full rounded-full xfiles-progress-bar transition-all duration-300"
        style={{ width: pct + "%" }}
      />
    </div>
  );
}

function PrioridadIcon({ prioridad }: { prioridad: TemaPrioridad }) {
  if (prioridad === "alta") return <Zap className="w-3 h-3 text-[#ef4444]" />;
  if (prioridad === "media") return <BarChart3 className="w-3 h-3 text-[#fbbf24]" />;
  return <ArrowDown className="w-3 h-3 text-[#4ade80]" />;
}

function PrioridadIconAuto({ priority }: { priority: AutoPriority }) {
  if (priority === "alta") return <Zap className="w-2.5 h-2.5 text-[#ef4444]" />;
  if (priority === "media") return <BarChart3 className="w-2.5 h-2.5 text-[#fbbf24]" />;
  return <ArrowDown className="w-2.5 h-2.5 text-[#4ade80]" />;
}

// ---- Main Component ----

export default function StudyPanel() {
  const mc = useModeColors();
  const currentMode = useGameStore((s) => s.currentMode);
  const studyBg = MODE_BG[currentMode] ?? MODE_BG.neutral;

  const {
    oposiciones, idiomas, cursos,
    addOposicion, updateOposicion, deleteOposicion,
    addOposicionTema, updateOposicionTema, deleteOposicionTema,
    addBloque, updateBloque, deleteBloque,
    estudiarTema, repasarTema, recordTest,
    addIdioma, updateIdioma, deleteIdioma,
    addIdiomaTema, updateIdiomaTema, deleteIdiomaTema,
    addCurso, updateCurso, deleteCurso,
    addAsignatura, updateAsignatura, deleteAsignatura,
    addAsignaturaTema, updateAsignaturaTema, deleteAsignaturaTema,
    addEvaluacion, updateEvaluacion, deleteEvaluacion,
    exportOposicionesCSV, exportIdiomasCSV, exportCursosCSV,
  } = useStudyStore();

  // Dialog
  const [open, setOpen] = useState(false);

  // Tab
  const [tab, setTab] = useState<"oposiciones" | "idiomas" | "cursos">("oposiciones");

  // Selections
  const [selectedOposicion, setSelectedOposicion] = useState<string | null>(null);
  const [selectedIdioma, setSelectedIdioma] = useState<string | null>(null);
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null);
  const [selectedAsignatura, setSelectedAsignatura] = useState<string | null>(null);

  // New forms
  const [showNewOposicion, setShowNewOposicion] = useState(false);
  const [showNewIdioma, setShowNewIdioma] = useState(false);
  const [showNewCurso, setShowNewCurso] = useState(false);
  const [showNewAsignatura, setShowNewAsignatura] = useState(false);

  // New form data
  const [newOpForm, setNewOpForm] = useState({ ...EMPTY_OPOSICION });
  const [newIdiForm, setNewIdiForm] = useState({ ...EMPTY_IDIOMA });
  const [newCurForm, setNewCurForm] = useState({ ...EMPTY_CURSO });
  const [newAsigForm, setNewAsigForm] = useState({ ...EMPTY_ASIGNATURA });

  // Edit form data (for detail views)
  const [editOpForm, setEditOpForm] = useState<typeof EMPTY_OPOSICION | null>(null);
  const [editIdiForm, setEditIdiForm] = useState<typeof EMPTY_IDIOMA | null>(null);
  const [editCurForm, setEditCurForm] = useState<typeof EMPTY_CURSO | null>(null);
  const [editAsigForm, setEditAsigForm] = useState<typeof EMPTY_ASIGNATURA | null>(null);

  // Tema inputs
  const [newTemaOp, setNewTemaOp] = useState("");
  const [newTemaIdi, setNewTemaIdi] = useState("");
  const [newTemaAsig, setNewTemaAsig] = useState("");
  const [newTemaAsigTipo, setNewTemaAsigTipo] = useState<TemaAsignaturaTipo>("Memorizar");

  // Test modal
  const [testModal, setTestModal] = useState<{ open: boolean; temaId: string; temaTexto: string } | null>(null);
  const [testAciertos, setTestAciertos] = useState("");
  const [testTotal, setTestTotal] = useState("");

  // Bloque form for new opposition
  const [newBloqueNombre, setNewBloqueNombre] = useState("");
  const [newBloquePeso, setNewBloquePeso] = useState("");

  // Edit dialog state for opposition
  const [editOpDialogOpen, setEditOpDialogOpen] = useState(false);
  const [editOpBloques, setEditOpBloques] = useState<Bloque[]>([]);
  const [editBloqueNombre, setEditBloqueNombre] = useState("");
  const [editBloquePeso, setEditBloquePeso] = useState("");

  // Bloque for new tema
  const [newTemaBloque, setNewTemaBloque] = useState("");

  // Evaluaciones editing
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [editEvalData, setEditEvalData] = useState({ concepto: "", nota: "", peso: "", fecha: "" });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; extraId?: string } | null>(null);

  // Mission modal
  const [missionModal, setMissionModal] = useState<{ open: boolean; defaultTitle: string; category: keyof Stats } | null>(null);
  const [missionForm, setMissionForm] = useState({ title: "", category: "oposicion" as keyof Stats, xp: 50, difficulty: "facil" as Difficulty, deadline: "", description: "" });
  const [missionSubtasks, setMissionSubtasks] = useState<Array<{ id: string; title: string }>>([]);
  const [newMissionSubtask, setNewMissionSubtask] = useState("");

  // Import
  const [importConfirm, setImportConfirm] = useState<{ type: string; data: unknown[] } | null>(null);
  const pendingImportType = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2000);
  }, []);

  // ---- Reset helpers ----

  function resetAllSelections() {
    setSelectedOposicion(null);
    setSelectedIdioma(null);
    setSelectedCurso(null);
    setSelectedAsignatura(null);
    setShowNewOposicion(false);
    setShowNewIdioma(false);
    setShowNewCurso(false);
    setShowNewAsignatura(false);
    setEditingEvalId(null);
    setEditOpForm(null);
    setEditIdiForm(null);
    setEditCurForm(null);
    setEditAsigForm(null);
  }

  // ---- Tab switching ----

  function handleTabChange(t: "oposiciones" | "idiomas" | "cursos") {
    setTab(t);
    resetAllSelections();
  }

  // ---- Oposicion handlers ----

  function openOposicionDetail(id: string) {
    const op = oposiciones.find((o) => o.id === id);
    if (!op) return;
    setEditOpForm({
      nombre: op.nombre,
      organismo: op.organismo,
      fechaExamen: op.fechaExamen,
      tipoExamen: op.tipoExamen,
      tieneExamenesAnteriores: op.tieneExamenesAnteriores,
      plazas: op.plazas,
      aspirantes: op.aspirantes,
      notaCorte: op.notaCorte,
      pesoBloques: op.pesoBloques,
    });
    setEditOpBloques(op.bloques.map((b) => ({ ...b })));
    setSelectedOposicion(id);
    setNewTemaOp("");
    setNewTemaBloque("");
  }

  function openEditOpDialog() {
    if (!selectedOposicion || !editOpForm) return;
    const op = oposiciones.find((o) => o.id === selectedOposicion);
    if (op) setEditOpBloques(op.bloques.map((b) => ({ ...b })));
    setEditBloqueNombre("");
    setEditBloquePeso("");
    setEditOpDialogOpen(true);
  }

  function handleEditAddBloque() {
    if (!editBloqueNombre.trim()) return;
    setEditOpBloques((prev) => [...prev, { id: `blk-${Date.now()}`, nombre: editBloqueNombre.trim(), peso: parseInt(editBloquePeso) || 0 }]);
    setEditBloqueNombre("");
    setEditBloquePeso("");
  }

  function handleEditRemoveBloque(bloqueId: string) {
    setEditOpBloques((prev) => prev.filter((b) => b.id !== bloqueId));
  }

  function handleEditBloquePeso(bloqueId: string, peso: number) {
    setEditOpBloques((prev) => prev.map((b) => b.id === bloqueId ? { ...b, peso } : b));
  }

  function saveOposicionFromDialog() {
    if (!selectedOposicion || !editOpForm) return;
    updateOposicion(selectedOposicion, { ...editOpForm, bloques: editOpBloques });
    setEditOpForm((prev) => prev ? { ...prev, bloques: editOpBloques } : prev);
    setEditOpDialogOpen(false);
    showToast("Oposición guardada");
  }

  function handleAddOposicion() {
    if (!newOpForm.nombre.trim()) return;
    addOposicion({ ...newOpForm, bloques: [], temas: [] });
    setNewOpForm({ ...EMPTY_OPOSICION });
    setShowNewOposicion(false);
    showToast("Oposición creada");
  }

  // ---- Test modal ----

  function openTestModal(temaId: string, temaTexto: string) {
    setTestAciertos("");
    setTestTotal("");
    setTestModal({ open: true, temaId, temaTexto });
  }

  function handleRecordTest() {
    if (!testModal || !selectedOposicion) return;
    const aciertos = parseInt(testAciertos);
    const total = parseInt(testTotal);
    if (!aciertos || !total || aciertos > total || total <= 0) return;
    recordTest(selectedOposicion, testModal.temaId, aciertos, total);
    showToast("Test registrado: " + aciertos + "/" + total);
    setTestModal(null);
  }

  function handleEstudiar(temaId: string) {
    if (!selectedOposicion) return;
    estudiarTema(selectedOposicion, temaId);
    showToast("Concentración registrada");
  }

  function handleRepasar(temaId: string) {
    if (!selectedOposicion) return;
    repasarTema(selectedOposicion, temaId);
    showToast("Repaso registrado");
  }

  // ---- Bloque management ----

  function handleAddBloque() {
    if (!selectedOposicion || !newBloqueNombre.trim()) return;
    addBloque(selectedOposicion, { nombre: newBloqueNombre.trim(), peso: parseInt(newBloquePeso) || 0 });
    setNewBloqueNombre("");
    setNewBloquePeso("");
  }

  function handleAddTemaOp() {
    if (!selectedOposicion || !newTemaOp.trim()) return;
    addOposicionTema(selectedOposicion, newTemaOp.trim(), newTemaBloque);
    setNewTemaOp("");
  }

  // ---- Idioma handlers ----

  function openIdiomaDetail(id: string) {
    const idi = idiomas.find((i) => i.id === id);
    if (!idi) return;
    setEditIdiForm({
      nombre: idi.nombre,
      idioma: idi.idioma,
      nivel: idi.nivel,
      fechaExamen: idi.fechaExamen,
    });
    setSelectedIdioma(id);
    setNewTemaIdi("");
  }

  function saveIdioma() {
    if (!selectedIdioma || !editIdiForm) return;
    updateIdioma(selectedIdioma, editIdiForm);
    showToast("Idioma guardado");
  }

  function handleAddIdioma() {
    if (!newIdiForm.nombre.trim()) return;
    addIdioma({ ...newIdiForm, temas: [] });
    setNewIdiForm({ ...EMPTY_IDIOMA });
    setShowNewIdioma(false);
    showToast("Idioma creado");
  }

  // ---- Curso handlers ----

  function openCursoDetail(id: string) {
    const c = cursos.find((cu) => cu.id === id);
    if (!c) return;
    setEditCurForm({
      nombre: c.nombre,
      institucion: c.institucion,
      tipo: c.tipo,
    });
    setSelectedCurso(id);
    setSelectedAsignatura(null);
    setShowNewAsignatura(false);
  }

  function saveCurso() {
    if (!selectedCurso || !editCurForm) return;
    updateCurso(selectedCurso, editCurForm);
    showToast("Curso guardado");
  }

  function handleAddCurso() {
    if (!newCurForm.nombre.trim()) return;
    addCurso({ ...newCurForm, asignaturas: [] });
    setNewCurForm({ ...EMPTY_CURSO });
    setShowNewCurso(false);
    showToast("Curso creado");
  }

  // ---- Asignatura handlers ----

  function openAsignaturaDetail(asigId: string) {
    const c = cursos.find((cu) => cu.id === selectedCurso);
    const asig = c?.asignaturas.find((a) => a.id === asigId);
    if (!asig) return;
    setEditAsigForm({
      nombre: asig.nombre,
      creditos: asig.creditos,
      estado: asig.estado,
      fechaExamen: asig.fechaExamen,
    });
    setSelectedAsignatura(asigId);
    setEditingEvalId(null);
    setNewTemaAsig("");
  }

  function saveAsignatura() {
    if (!selectedCurso || !selectedAsignatura || !editAsigForm) return;
    updateAsignatura(selectedCurso, selectedAsignatura, editAsigForm);
    showToast("Asignatura guardada");
  }

  function handleAddAsignatura() {
    if (!selectedCurso || !newAsigForm.nombre.trim()) return;
    addAsignatura(selectedCurso, { ...newAsigForm, evaluaciones: [], temas: [] });
    setNewAsigForm({ ...EMPTY_ASIGNATURA });
    setShowNewAsignatura(false);
    showToast("Asignatura creada");
  }

  // ---- Evaluacion handlers ----

  function startEditEval(ev: Evaluacion) {
    setEditingEvalId(ev.id);
    setEditEvalData({
      concepto: ev.concepto,
      nota: ev.nota !== null ? String(ev.nota) : "",
      peso: String(ev.peso),
      fecha: ev.fecha,
    });
  }

  function saveEditEval() {
    if (!selectedCurso || !selectedAsignatura || !editingEvalId) return;
    updateEvaluacion(selectedCurso, selectedAsignatura, editingEvalId, {
      concepto: editEvalData.concepto,
      nota: editEvalData.nota ? parseFloat(editEvalData.nota) : null,
      peso: parseInt(editEvalData.peso) || 0,
      fecha: editEvalData.fecha,
    });
    setEditingEvalId(null);
    showToast("Evaluación guardada");
  }

  function addNewEvaluacion() {
    if (!selectedCurso || !selectedAsignatura) return;
    addEvaluacion(selectedCurso, selectedAsignatura, {
      concepto: "",
      nota: null,
      peso: 0,
      fecha: "",
    });
    const store = useStudyStore.getState();
    const c = store.cursos.find((cu) => cu.id === selectedCurso);
    const asig = c?.asignaturas.find((a) => a.id === selectedAsignatura);
    const lastEv = asig?.evaluaciones[asig.evaluaciones.length - 1];
    if (lastEv) {
      setEditingEvalId(lastEv.id);
      setEditEvalData({ concepto: "", nota: "", peso: "0", fecha: "" });
    }
  }

  // ---- Mission modal ----

  function openMissionModal(defaultTitle: string, category: keyof Stats) {
    setMissionForm({ title: defaultTitle, category, xp: 50, difficulty: "facil" as Difficulty, deadline: "", description: "" });
    setMissionSubtasks([]);
    setNewMissionSubtask("");
    setMissionModal({ open: true, defaultTitle, category });
  }

  function handleCreateMission() {
    if (!missionForm.title.trim() || !missionForm.deadline) return;
    const finalSubtasks = missionSubtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: false,
    }));
    try {
      useGameStore.getState().createMission({
        title: missionForm.title,
        description: missionForm.description,
        category: missionForm.category,
        difficulty: missionForm.difficulty,
        xpReward: missionForm.xp,
        coinReward: DIFFICULTY_COINS[missionForm.difficulty],
        missionType: "deadline",
        deadline: missionForm.deadline,
        ...(finalSubtasks.length > 0 ? { subtasks: finalSubtasks } : {}),
      });
      showToast("Misión creada: " + missionForm.title);
    } catch {
      showToast("Misión creada (simulada): " + missionForm.title);
    }
    setMissionModal(null);
  }

  // ---- CSV handlers ----

  function handleExport(type: string) {
    if (type === "oposiciones") downloadCSV(exportOposicionesCSV(), "oposiciones.csv");
    else if (type === "idiomas") downloadCSV(exportIdiomasCSV(), "idiomas.csv");
    else if (type === "cursos") downloadCSV(exportCursosCSV(), "cursos.csv");
  }

  function triggerImport(type: string) {
    pendingImportType.current = type;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const type = pendingImportType.current;
        let data: unknown[];
        if (type === "oposiciones") {
          data = useStudyStore.getState().importOposicionesCSV(text);
        } else if (type === "idiomas") {
          data = useStudyStore.getState().importIdiomasCSV(text);
        } else {
          data = useStudyStore.getState().importCursosCSV(text);
        }
        setImportConfirm({ type, data });
      } catch (err) {
        showToast("Error: " + (err instanceof Error ? err.message : "Formato no válido"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function confirmImport() {
    if (!importConfirm) return;
    const store = useStudyStore.getState();
    if (importConfirm.type === "oposiciones") {
      (importConfirm.data as Oposicion[]).forEach(({ id, ...rest }) => store.addOposicion(rest as Omit<Oposicion, "id">));
      showToast(`${(importConfirm.data as Oposicion[]).length} oposiciones importadas`);
    } else if (importConfirm.type === "idiomas") {
      (importConfirm.data as Idioma[]).forEach(({ id, ...rest }) => store.addIdioma(rest as Omit<Idioma, "id">));
      showToast(`${(importConfirm.data as Idioma[]).length} idiomas importados`);
    } else if (importConfirm.type === "cursos") {
      (importConfirm.data as Curso[]).forEach(({ id, ...rest }) => store.addCurso(rest as Omit<Curso, "id">));
      showToast(`${(importConfirm.data as Curso[]).length} cursos importados`);
    }
    setImportConfirm(null);
  }

  // ---- Delete handler ----

  function confirmDelete() {
    if (!deleteConfirm) return;
    const { type, id, extraId } = deleteConfirm;
    if (type === "oposicion") {
      deleteOposicion(id);
      if (selectedOposicion === id) resetAllSelections();
      showToast("Oposición eliminada");
    } else if (type === "idioma") {
      deleteIdioma(id);
      if (selectedIdioma === id) resetAllSelections();
      showToast("Idioma eliminado");
    } else if (type === "curso") {
      deleteCurso(id);
      if (selectedCurso === id) resetAllSelections();
      showToast("Curso eliminado");
    } else if (type === "asignatura") {
      deleteAsignatura(id, extraId!);
      if (selectedAsignatura === extraId) { setSelectedAsignatura(null); setEditAsigForm(null); }
      showToast("Asignatura eliminada");
    } else if (type === "oposicion_tema") {
      deleteOposicionTema(id, extraId!);
      showToast("Tema eliminado");
    } else if (type === "idioma_tema") {
      deleteIdiomaTema(id, extraId!);
      showToast("Tema eliminado");
    } else if (type === "asignatura_tema") {
      deleteAsignaturaTema(id, extraId!, extraId!);
      showToast("Tema eliminado");
    } else if (type === "evaluacion") {
      deleteEvaluacion(id, extraId!, editingEvalId!);
      setEditingEvalId(null);
      showToast("Evaluación eliminada");
    }
    setDeleteConfirm(null);
  }

  // ---- Derived data ----

  const selectedOp = selectedOposicion ? oposiciones.find((o) => o.id === selectedOposicion) : null;
  const selectedIdi = selectedIdioma ? idiomas.find((i) => i.id === selectedIdioma) : null;
  const selectedCur = selectedCurso ? cursos.find((c) => c.id === selectedCurso) : null;
  const selectedAsig = selectedCur && selectedAsignatura
    ? selectedCur.asignaturas.find((a) => a.id === selectedAsignatura)
    : null;

  const deleteLabel = deleteConfirm ? (() => {
    switch (deleteConfirm.type) {
      case "oposicion": return "esta oposición";
      case "idioma": return "este idioma";
      case "curso": return "este curso";
      case "asignatura": return "esta asignatura";
      case "oposicion_tema": case "idioma_tema": case "asignatura_tema": return "este tema";
      case "evaluacion": return "esta evaluación";
      default: return "este elemento";
    }
  })() : "";

  // ---- Header title ----

  function getHeaderTitle(): React.ReactNode {
    if (showNewOposicion) return "Nueva oposición";
    if (showNewIdioma) return "Nuevo idioma";
    if (showNewCurso) return "Nuevo curso";
    if (selectedAsignatura && selectedCur) {
      return (
        <>
          <button onClick={() => { setSelectedAsignatura(null); setEditAsigForm(null); setEditingEvalId(null); }} className="text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors mr-1"><ArrowLeft className="w-3.5 h-3.5" /></button>
          <span className="text-[#4a5a4a]">{selectedCur.nombre}</span>
          <span className="text-[#4a5a4a] mx-1.5">/</span>
          <span>{editAsigForm?.nombre || selectedAsig?.nombre || "Asignatura"}</span>
        </>
      );
    }
    if (selectedOposicion && editOpForm) {
      return (
        <>
          <button onClick={() => { setSelectedOposicion(null); setEditOpForm(null); }} className="text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors mr-1"><ArrowLeft className="w-3.5 h-3.5" /></button>
          {editOpForm.nombre || "Oposición"}
        </>
      );
    }
    if (selectedIdioma && editIdiForm) {
      return (
        <>
          <button onClick={() => { setSelectedIdioma(null); setEditIdiForm(null); }} className="text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors mr-1"><ArrowLeft className="w-3.5 h-3.5" /></button>
          {editIdiForm.nombre || "Idioma"}
        </>
      );
    }
    if (selectedCurso && editCurForm) {
      return (
        <>
          <button onClick={() => { setSelectedCurso(null); setSelectedAsignatura(null); setEditCurForm(null); }} className="text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors mr-1"><ArrowLeft className="w-3.5 h-3.5" /></button>
          {editCurForm.nombre || "Curso"}
        </>
      );
    }
    return "Estudios";
  }

  // ---- Tab buttons ----

  const TABS: { key: "oposiciones" | "idiomas" | "cursos"; icon: React.ReactNode; label: string }[] = [
    { key: "oposiciones", icon: <GraduationCap className="w-3.5 h-3.5" />, label: "OPOSICIONES" },
    { key: "idiomas", icon: <Languages className="w-3.5 h-3.5" />, label: "IDIOMAS" },
    { key: "cursos", icon: <School className="w-3.5 h-3.5" />, label: "CURSOS" },
  ];

  // ========================
  // RENDER
  // ========================

  return (
    <>
      {/* ---- Trigger Button ---- */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded border text-[#6b8a6b] transition-all font-mono text-[10px] cursor-pointer"
        style={{ borderColor: `rgba(${mc.accentRgb},0.15)` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = mc.accent;
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "";
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.15)`;
        }}
        data-tooltip="Estudios"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ESTUDIOS</span>
      </button>

      {/* ---- Hidden file input ---- */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileChange}
      />

      {/* ---- Main Dialog ---- */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetAllSelections();
          setOpen(v);
        }}
      >
        <DialogContent
          className="xfiles-card h-[85vh] flex flex-col overflow-hidden shadow-none border-0"
          overlayClassName="bg-black/95"
          style={{ background: studyBg, maxWidth: "80rem", width: "96vw", borderColor: `rgba(${mc.accentRgb},0.12)`, borderWidth: "1px" }}
        >
          <DialogHeader className="shrink-0 pb-2 border-b border-[rgba(var(--mode-accent-rgb),0.12)]">
            <DialogTitle className="font-mono text-lg flex items-center gap-2" style={{ color: mc.accent }}>
              <BookOpen className="w-4 h-4" />
              {getHeaderTitle()}
            </DialogTitle>
            <DialogDescription className="sr-only">Panel de concentración</DialogDescription>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex gap-2 shrink-0 py-2 border-b border-[rgba(var(--mode-accent-rgb),0.1)]">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-colors duration-200 flex items-center gap-1.5 ${
                  tab === t.key
                    ? "bg-[rgba(var(--mode-accent-rgb),0.1)] border-[rgba(var(--mode-accent-rgb),0.35)]"
                    : "text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:border-[rgba(var(--mode-accent-rgb),0.25)]"
                }`}
                style={tab === t.key ? { color: mc.accent } : {}}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ---- Content ---- */}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-green pr-1 relative">
            <div className="flex flex-col gap-3 py-2">

              {/* Breadcrumb */}
              {(selectedOposicion || selectedIdioma || selectedCurso || showNewOposicion || showNewIdioma || showNewCurso || selectedAsignatura) && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#4a5a4a]">
                  <button
                    onClick={resetAllSelections}
                    className="hover:text-[#6b8a6b] transition-colors"
                  >
                    {tab === "oposiciones" ? "Oposiciones" : tab === "idiomas" ? "Idiomas" : "Cursos"}
                  </button>
                  {selectedOposicion && editOpForm && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b] truncate max-w-[200px]">{editOpForm.nombre}</span>
                    </>
                  )}
                  {showNewOposicion && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b]">Nueva oposición</span>
                    </>
                  )}
                  {selectedIdioma && editIdiForm && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b] truncate max-w-[200px]">{editIdiForm.nombre}</span>
                    </>
                  )}
                  {showNewIdioma && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b]">Nuevo idioma</span>
                    </>
                  )}
                  {selectedCurso && editCurForm && !selectedAsignatura && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b] truncate max-w-[200px]">{editCurForm.nombre}</span>
                    </>
                  )}
                  {selectedCurso && selectedAsignatura && editAsigForm && editCurForm && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b] truncate max-w-[150px]">{editCurForm.nombre}</span>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b] truncate max-w-[150px]">{editAsigForm.nombre}</span>
                    </>
                  )}
                  {showNewCurso && (
                    <>
                      <span className="text-[#3a4a3a]">/</span>
                      <span className="text-[#6b8a6b]">Nuevo curso</span>
                    </>
                  )}
                </div>
              )}

              {/* ==================== OPOSICIONES ==================== */}
              {tab === "oposiciones" && (
                <>
                  {/* List view */}
                  {!selectedOposicion && !showNewOposicion && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[#6b8a6b]">
                          {oposiciones.length} oposición{oposiciones.length !== 1 ? "es" : ""}
                        </span>
                        <button
                          onClick={() => { setNewOpForm({ ...EMPTY_OPOSICION }); setShowNewOposicion(true); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[12px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          NUEVO
                        </button>
                      </div>

                      {oposiciones.length === 0 ? (
                        <div className="font-mono text-[12px] text-[#4a5a4a] text-center py-8 tracking-wider">{`{ }`}</div>
                      ) : (
                        <div className="space-y-2">
                          {oposiciones.map((op) => {
                            const prob = calcProbabilidadAprobar(op);
                            const urgentes = op.temas.filter((t) => getAutoPriority(t) === "alta").length;
                            const aciertoGlobal = getAciertoGlobal(op);
                            return (
                              <div
                                key={op.id}
                                onClick={() => openOposicionDetail(op.id)}
                                className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--mode-accent-rgb),0.08)] hover:border-[rgba(var(--mode-accent-rgb),0.15)]"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[12px] text-[#c8d6c0]">{op.nombre}</span>
                                  <div className="flex items-center gap-2">
                                    {urgentes > 0 && (
                                      <span className="font-mono text-[10px] text-[#ef4444] flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {urgentes}
                                      </span>
                                    )}
                                    <span className={`font-mono text-[12px] font-bold ${probColor(prob)}`}>
                                      {prob}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 font-mono text-[12px] text-[#4a5a4a]">
                                  {op.organismo && <span>{op.organismo}</span>}
                                  {op.fechaExamen && <span>{formatDate(op.fechaExamen)}</span>}
                                  {aciertoGlobal !== null && <span className="ml-auto">{aciertoGlobal}% acierto</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* CSV buttons */}
                      {oposiciones.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                          <button
                            onClick={() => handleExport("oposiciones")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors"
                          >
                            <FileDown className="w-3 h-3" />
                            Exportar CSV
                          </button>
                          <button
                            onClick={() => triggerImport("oposiciones")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors"
                          >
                            <FileUp className="w-3 h-3" />
                            Importar CSV
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* New Oposicion form */}
                  {showNewOposicion && (
                    <div className="space-y-5">
                      <div className="font-mono text-[13px] text-[var(--mode-accent)] uppercase tracking-wider mb-1 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Nueva oposición
                      </div>

                      {/* Fieldset: Datos generales */}
                      <fieldset className="border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-4 py-3 space-y-3">
                        <legend className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider px-2">Datos generales</legend>
                        <div>
                          <label className={labelClass}><GraduationCap className="w-3 h-3" /> Nombre</label>
                          <input value={newOpForm.nombre} onChange={(e) => setNewOpForm((f) => ({ ...f, nombre: e.target.value }))} className={inputClass} placeholder="Nombre de la oposición" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}><Building2 className="w-3 h-3" /> Organismo</label>
                            <input value={newOpForm.organismo} onChange={(e) => setNewOpForm((f) => ({ ...f, organismo: e.target.value }))} className={inputClass} placeholder="Organismo" />
                          </div>
                          <div>
                            <label className={labelClass}><Calendar className="w-3 h-3" /> Fecha examen</label>
                            <input value={newOpForm.fechaExamen} onChange={(e) => setNewOpForm((f) => ({ ...f, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                          </div>
                        </div>
                      </fieldset>

                      {/* Fieldset: Detalles del examen */}
                      <fieldset className="border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-4 py-3 space-y-3">
                        <legend className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider px-2">Detalles del examen</legend>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Tipo examen</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(["Test memorístico", "Desarrollo", "Caso práctico"] as const).map((tipo) => (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={() => setNewOpForm((f) => ({
                                    ...f,
                                    tipoExamen: f.tipoExamen.includes(tipo)
                                      ? f.tipoExamen.filter((t) => t !== tipo)
                                      : [...f.tipoExamen, tipo],
                                  }))}
                                  className={`font-mono text-[11px] px-2.5 py-1.5 rounded border transition-colors ${
                                    newOpForm.tipoExamen.includes(tipo)
                                      ? "border-[rgba(var(--mode-accent-rgb),0.4)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.1)]"
                                      : "border-[rgba(var(--mode-accent-rgb),0.12)] text-[#4a5a4a] hover:text-[#6b8a6b] hover:border-[rgba(var(--mode-accent-rgb),0.25)]"
                                  }`}
                                >
                                  {newOpForm.tipoExamen.includes(tipo) ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}{tipo}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Exámenes pasados</label>
                            <select value={newOpForm.tieneExamenesAnteriores} onChange={(e) => setNewOpForm((f) => ({ ...f, tieneExamenesAnteriores: e.target.value as Oposicion["tieneExamenesAnteriores"] }))} className={selectClass}>
                              <option>Si</option>
                              <option>No</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}><Building2 className="w-3 h-3" /> Plazas</label>
                            <input value={newOpForm.plazas} onChange={(e) => setNewOpForm((f) => ({ ...f, plazas: e.target.value }))} className={inputClass} placeholder="0" />
                          </div>
                          <div>
                            <label className={labelClass}><Users className="w-3 h-3" /> Aspirantes</label>
                            <input value={newOpForm.aspirantes} onChange={(e) => setNewOpForm((f) => ({ ...f, aspirantes: e.target.value }))} className={inputClass} placeholder="0" />
                          </div>
                          <div>
                            <label className={labelClass}><BarChart3 className="w-3 h-3" /> Nota corte</label>
                            <input value={newOpForm.notaCorte} onChange={(e) => setNewOpForm((f) => ({ ...f, notaCorte: e.target.value }))} className={inputClass} placeholder="0" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}><Zap className="w-3 h-3" /> Peso de bloques</label>
                          <input value={newOpForm.pesoBloques} onChange={(e) => setNewOpForm((f) => ({ ...f, pesoBloques: e.target.value }))} className={inputClass} placeholder="Opcional" />
                        </div>
                      </fieldset>
                      <div className="flex gap-2 shrink-0 pt-2">
                        <button onClick={() => setShowNewOposicion(false)} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={handleAddOposicion} disabled={!newOpForm.nombre.trim()} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] transition-colors disabled:opacity-30 hover:bg-[rgba(var(--mode-accent-rgb),0.15)]">
                          <Plus className="w-3 h-3 inline mr-1" />Crear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Oposicion detail */}
                  {selectedOposicion && editOpForm && selectedOp && (() => {
                    const prob = calcProbabilidadAprobar(selectedOp);
                    const aciertoGlobal = getAciertoGlobal(selectedOp);
                    const urgentes = selectedOp.temas.filter((t) => getAutoPriority(t) === "alta");
                    const totalTests = selectedOp.temas.reduce((s, t) => s + t.historialTests.length, 0);
                    const bloqueDebil = getBloqueDebil(selectedOp);
                    const bloqueFuerte = getBloqueFuerte(selectedOp);
                    const bloqueStats = getBloqueStats(selectedOp);
                    const temasTesteados = selectedOp.temas.filter((t) => t.aciertoMedio !== null).length;
                    // Sort temas: alta priority first, then by diasParaRepaso ascending
                    const sortedTemas = [...selectedOp.temas].sort((a, b) => {
                      const pa = getAutoPriority(a);
                      const pb = getAutoPriority(b);
                      const pOrder = { alta: 0, media: 1, baja: 2 };
                      if (pOrder[pa] !== pOrder[pb]) return pOrder[pa] - pOrder[pb];
                      return getDiasParaRepaso(a) - getDiasParaRepaso(b);
                    });
                    const sumPesos = selectedOp.bloques.reduce((s, b) => s + b.peso, 0);

                    // Suggested next step
                    let suggestedAction: React.ReactNode = null;
                    if (selectedOp.temas.length > 0) {
                      const sortedByUrgency = [...selectedOp.temas].sort((a, b) => {
                        const pa = getAutoPriority(a);
                        const pb = getAutoPriority(b);
                        const pOrder = { alta: 0, media: 1, baja: 2 };
                        if (pOrder[pa] !== pOrder[pb]) return pOrder[pa] - pOrder[pb];
                        return getDiasParaRepaso(a) - getDiasParaRepaso(b);
                      });
                      const next = sortedByUrgency[0];
                      if (next) {
                        const dias = getDiasParaRepaso(next);
                        if (dias < -2 && next.fechaUltimoEstudio && next.aciertoMedio !== null) {
                          suggestedAction = <><span className="text-[#ef4444]">Repasa</span> <span className="text-[#c8d6c0]">{next.texto}</span> <span className="text-[#ef4444]">({Math.abs(dias)}d vencido)</span></>;
                        } else if (next.aciertoMedio === null && next.fechaUltimoEstudio) {
                          suggestedAction = <><span className="text-[#fbbf24]">Testea</span> <span className="text-[#c8d6c0]">{next.texto}</span></>;
                        } else if (!next.fechaUltimoEstudio) {
                          suggestedAction = <><span className="text-[#60a5fa]">Estudia</span> <span className="text-[#c8d6c0]">{next.texto}</span></>;
                        } else if (dias <= 1) {
                          suggestedAction = <><span className="text-[#a78bfa]">Repasa</span> <span className="text-[#c8d6c0]">{next.texto}</span> <span className="text-[#fbbf24]">({dias === 0 ? "hoy" : `${dias}d`})</span></>;
                        }
                      }
                    }

                    return (
                      <div className="space-y-5">

                        {/* ---- HEADER: Info + Stats en 2 columnas ---- */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* LEFT: Read-only info */}
                          <div className="space-y-3">
                            <div className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                Datos
                              </span>
                              <button
                                onClick={openEditOpDialog}
                                className="flex items-center gap-1 px-2 py-0.5 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#4a5a4a] hover:text-[var(--mode-accent)] hover:border-[rgba(var(--mode-accent-rgb),0.4)] transition-colors text-[10px]"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </button>
                            </div>
                            {/* Organismo + Fecha */}
                            <div className="space-y-1">
                              {editOpForm.organismo && (
                                <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center gap-1.5">
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  <span className="text-[#c8d6c0]">{editOpForm.organismo}</span>
                                </div>
                              )}
                              {editOpForm.fechaExamen && (
                                <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span className="text-[#c8d6c0]">{formatDate(editOpForm.fechaExamen)}</span>
                                </div>
                              )}
                            </div>
                            {/* Tipo de examen */}
                            {editOpForm.tipoExamen.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {editOpForm.tipoExamen.map((tipo) => (
                                  <span key={tipo} className="font-mono text-[10px] px-2 py-0.5 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)]">
                                    {tipo}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Exámenes pasados */}
                            <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center gap-1.5">
                              <Award className="w-3 h-3 shrink-0" />
                              <span>Exámenes pasados:</span>
                              <span className={editOpForm.tieneExamenesAnteriores === "Si" ? "text-[#4ade80]" : "text-[#4a5a4a]"}>
                                {editOpForm.tieneExamenesAnteriores}
                              </span>
                            </div>
                            {/* Plazas */}
                            {(editOpForm.plazas || editOpForm.aspirantes) && (
                              <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center gap-1.5">
                                <Users className="w-3 h-3 shrink-0" />
                                <span>Plazas:</span>
                                {editOpForm.plazas && <span className="text-[#c8d6c0]">{editOpForm.plazas}</span>}
                                {editOpForm.plazas && editOpForm.aspirantes && <span className="text-[#3a4a3a]">/</span>}
                                {editOpForm.aspirantes && <span className="text-[#c8d6c0]">{editOpForm.aspirantes} aspirantes</span>}
                              </div>
                            )}
                            {/* Nota de corte */}
                            {editOpForm.notaCorte && (
                              <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center gap-1.5">
                                <Target className="w-3 h-3 shrink-0" />
                                <span>Nota de corte:</span>
                                <span className="text-[#c8d6c0]">{editOpForm.notaCorte}</span>
                              </div>
                            )}
                          </div>

                          {/* RIGHT: Stats panel (compacto) */}
                          <div className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-2.5 space-y-2">
                            <div className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider flex items-center gap-1.5">
                              <BarChart3 className="w-3 h-3" />
                              Resumen
                            </div>
                            {totalTests > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <div className="font-mono text-[9px] text-[#4a5a4a] uppercase mb-0.5" data-tooltip="Calculada con el acierto medio de cada tema, ponderado por el peso de sus bloques">Aprobado</div>
                                  <div className={`font-mono text-[18px] font-bold leading-none ${probColor(prob)}`}>{prob}%</div>
                                  <ProgressLine pct={prob} />
                                </div>
                                <div>
                                  <div className="font-mono text-[9px] text-[#4a5a4a] uppercase mb-0.5">Urgentes</div>
                                  {urgentes.length > 0 ? (
                                    <div className="flex items-center gap-0.5">
                                      <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
                                      <span className="font-mono text-[18px] font-bold text-[#ef4444] leading-none">{urgentes.length}</span>
                                    </div>
                                  ) : (
                                    <span className="font-mono text-[18px] font-bold text-[#4ade80] leading-none">0</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-mono text-[9px] text-[#4a5a4a] uppercase mb-0.5">Acierto</div>
                                  {aciertoGlobal !== null ? (
                                    <>
                                      <span className={`font-mono text-[18px] font-bold leading-none ${probColor(aciertoGlobal)}`}>{aciertoGlobal}%</span>
                                      <div className="font-mono text-[9px] text-[#4a5a4a]">{temasTesteados}/{selectedOp.temas.length}</div>
                                    </>
                                  ) : (
                                    <span className="font-mono text-[18px] font-bold text-[#4a5a4a] leading-none">---</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 font-mono text-[11px]">
                                <span className="text-[#4a5a4a]" data-tooltip="Nota media ponderada por bloques">Aprobado <span className={`font-bold ${probColor(prob)}`}>{prob}%</span></span>
                                {urgentes.length > 0 ? (
                                  <span className="text-[#ef4444] flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {urgentes.length}</span>
                                ) : (
                                  <span className="text-[#4a5a4a] flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-[#4ade80]" /> OK</span>
                                )}
                                <span className="ml-auto text-[#4a5a4a]">{selectedOp.temas.length} temas</span>
                              </div>
                            )}

                            {/* Urgent warning compacto */}
                            {urgentes.length > 0 && (
                              <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded px-2 py-1.5 flex items-start gap-1.5">
                                <AlertTriangle className="w-3 h-3 text-[#ef4444] shrink-0 mt-0.5" />
                                <span className="font-mono text-[10px] text-[#ef4444]">
                                  {urgentes.slice(0, 3).map((t) => t.texto).join(", ")}{urgentes.length > 3 && ` +${urgentes.length - 3}`}
                                </span>
                              </div>
                            )}

                            {/* Global stats row */}
                            <div className="flex items-center gap-3 font-mono text-[9px] text-[#3a4a3a]">
                              <span>{totalTests} tests</span>
                              <span>{selectedOp.temas.filter((t) => t.fechaUltimoEstudio).length} estudiados</span>
                              <span>{selectedOp.temas.filter((t) => t.fechaUltimoRepaso).length} repasados</span>
                            </div>
                            {/* Suggested next step */}
                            {suggestedAction && (
                              <div className="font-mono text-[10px] flex items-center gap-1 pt-1.5 border-t border-[rgba(var(--mode-accent-rgb),0.06)]">
                                <span className="text-[#3a4a3a]">Siguiente:</span>
                                {suggestedAction}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ---- BLOQUES (read-only chips) ---- */}
                        {selectedOp.bloques.length > 0 && (
                          <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-4">
                            <div className="font-mono text-[11px] text-[#4a5a4a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <ListChecks className="w-3 h-3" />
                              Bloques ({selectedOp.bloques.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedOp.bloques.map((bloque) => {
                                const bstat = bloqueStats.find((bs) => bs.nombre === bloque.nombre);
                                return (
                                  <div key={bloque.id} className="flex items-center gap-1.5 bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.15)] rounded-full px-3 py-1">
                                    <span className="font-mono text-[11px] text-[#c8d6c0]">{bloque.nombre}</span>
                                    <span className="font-mono text-[10px] text-[#4a5a4a]">{bloque.peso}%</span>
                                    {bstat && (
                                      <span className={`font-mono text-[10px] font-bold ${probColor(bstat.acierto)}`}>{bstat.acierto}%</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ---- TEMARIO ---- */}
                        <div className="pt-1">
                          <div className="bg-[rgba(var(--mode-accent-rgb),0.06)] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-4 py-3 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[var(--mode-accent)]" />
                            <span className="font-mono text-[13px] text-[var(--mode-accent)] uppercase tracking-wider font-bold">
                              TEMARIO ({selectedOp.temas.length})
                            </span>
                            <span className="ml-auto text-[10px] text-[#4a5a4a] normal-case tracking-normal flex items-center gap-1">
                              ordenado por prioridad automática
                              <span className="cursor-help" data-tooltip="Alta: repaso vencido más de 2 días o acierto bajo. Media: repaso próximo. Baja: todo al día.">?</span>
                            </span>
                          </div>

                          {/* Add tema */}
                          <div className="flex gap-2 mb-2">
                            <input
                              value={newTemaOp}
                              onChange={(e) => setNewTemaOp(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && newTemaOp.trim()) { handleAddTemaOp(); } }}
                              placeholder="Nuevo tema..."
                              className={`${inputClass} flex-1`}
                            />
                            {selectedOp.bloques.length > 0 && (
                              <select
                                value={newTemaBloque}
                                onChange={(e) => setNewTemaBloque(e.target.value)}
                                className="bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-2 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer"
                                style={{ color: newTemaBloque ? "#c8d6c0" : "#4a5a4a" }}
                              >
                                <option value="" disabled>Bloque</option>
                                {selectedOp.bloques.map((b) => (
                                  <option key={b.id} value={b.id}>{b.nombre}</option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={() => { if (newTemaOp.trim()) { handleAddTemaOp(); } }}
                              disabled={!newTemaOp.trim()}
                              className="shrink-0 text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Temas list */}
                          {sortedTemas.length > 0 && (
                            <div className="space-y-1.5">
                              {sortedTemas.map((tema) => {
                                const priority = getAutoPriority(tema);
                                const diasRepaso = getDiasParaRepaso(tema);
                                const diasProx = getDiasProximoRepaso(tema.aciertoMedio);
                                const isUrgent = priority === "alta" && diasRepaso < 0;
                                const bloqueNombre = selectedOp.bloques.find((b) => b.id === tema.bloque)?.nombre;

                                return (
                                  <div
                                    key={tema.id}
                                    className={`bg-[rgba(20,20,20,0.4)] border rounded px-3 py-2.5 transition-colors ${
                                      isUrgent
                                        ? "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.03)]"
                                        : "border-[rgba(var(--mode-accent-rgb),0.1)]"
                                    }`}
                                  >
                                    {/* Row 1: Name + priority + delete */}
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`font-mono text-[14px] truncate ${isUrgent ? "text-[#ef4444]" : "text-[#c8d6c0]"}`}>{tema.texto}</span>
                                        {bloqueNombre && (
                                          <span className="shrink-0 font-mono text-[10px] text-[#4a5a4a] bg-[rgba(20,20,20,0.5)] rounded px-1.5 py-0.5">{bloqueNombre}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {/* Auto priority badge */}
                                        <span className={`font-mono text-[10px] font-bold flex items-center gap-0.5 ${autoPriorityColor(priority)}`}>
                                          <PrioridadIconAuto priority={priority} />
                                          {autoPriorityLabel(priority)}
                                        </span>
                                        <button
                                          onClick={() => setDeleteConfirm({ type: "oposicion_tema", id: selectedOposicion!, extraId: tema.id })}
                                          className="text-[#4a5a4a] hover:text-[#ef4444] transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Row 2: Stats (collapsed by default) */}
                                    <details className="group/stats">
                                      <summary className="font-mono text-[11px] text-[#4a5a4a] cursor-pointer hover:text-[#6b8a6b] transition-colors flex items-center gap-2 select-none mb-1.5">
                                        <span className="flex items-center gap-1">
                                          {tema.aciertoMedio !== null ? (
                                            <span className={`flex items-center gap-0.5 ${probColor(tema.aciertoMedio)}`}>
                                              <Target className="w-2.5 h-2.5" />
                                              {tema.aciertoMedio}%
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-0.5">
                                              <Target className="w-2.5 h-2.5" />
                                              Sin test
                                            </span>
                                          )}
                                          {tema.fechaUltimoEstudio && (
                                            <span className={`ml-2 ${isUrgent ? "text-[#ef4444]" : diasRepaso <= 1 ? "text-[#fbbf24]" : ""}`}>
                                              {diasRepaso === 99 ? "Sin repaso" : diasRepaso < 0 ? `${Math.abs(diasRepaso)}d vencido` : diasRepaso === 0 ? "Hoy" : `${diasRepaso}d`}
                                            </span>
                                          )}
                                          {tema.historialTests.length > 0 && (
                                            <span className="ml-2">{tema.historialTests.length} test{tema.historialTests.length > 1 ? "s" : ""}</span>
                                          )}
                                        </span>
                                        <span className="text-[#3a4a3a] group-open/stats:rotate-180 transition-transform inline-block">▸</span>
                                      </summary>

                                      {/* Expanded stats */}
                                      <div className="flex items-center gap-3 mb-2 font-mono text-[11px] text-[#4a5a4a] flex-wrap pl-4 border-l border-[rgba(var(--mode-accent-rgb),0.1)] ml-1 py-1">
                                        {/* Acierto medio */}
                                        {tema.aciertoMedio !== null ? (
                                          <span className={`flex items-center gap-1 ${probColor(tema.aciertoMedio)}`}>
                                            <Target className="w-2.5 h-2.5" />
                                            {tema.aciertoMedio}% acierto medio
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <Target className="w-2.5 h-2.5" />
                                            Sin test
                                          </span>
                                        )}

                                        {/* Dias para repaso */}
                                        {tema.fechaUltimoEstudio && (
                                          <span className={`flex items-center gap-1 ${isUrgent ? "text-[#ef4444]" : diasRepaso <= 1 ? "text-[#fbbf24]" : ""}`}>
                                            <Clock className="w-2.5 h-2.5" />
                                            {diasRepaso === 99 ? "Sin repaso" : diasRepaso < 0 ? `${Math.abs(diasRepaso)}d vencido` : diasRepaso === 0 ? "Hoy" : `${diasRepaso}d`}
                                            <span className="text-[#4a5a4a]">({diasProx}d ciclo)</span>
                                          </span>
                                        )}

                                        {/* Tests count */}
                                        {tema.historialTests.length > 0 && (
                                          <span className="flex items-center gap-1">
                                            <ClipboardList className="w-2.5 h-2.5" />
                                            {tema.historialTests.length} test{tema.historialTests.length > 1 ? "s" : ""}
                                          </span>
                                        )}

                                        {/* Last activity */}
                                        {tema.fechaUltimoEstudio && (
                                          <span className="flex items-center gap-1">
                                            {timeAgo(tema.fechaUltimoEstudio)}
                                          </span>
                                        )}
                                      </div>
                                    </details>

                                    {/* Row 3: 3 action buttons */}
                                    <div className="flex items-center gap-2">
                                      {/* ESTUDIAR */}
                                      <button
                                        onClick={() => {
                                          handleEstudiar(tema.id);
                                          openMissionModal(`Estudiar: ${tema.texto}`, "oposicion");
                                        }}
                                        data-tooltip="Marca como estudiado hoy. Se usa para calcular cuando toca repasarlo."
                                        className="font-mono text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors text-[#60a5fa] border-[rgba(96,165,250,0.25)] hover:bg-[rgba(96,165,250,0.1)]"
                                      >
                                        <BookMarked className="w-2.5 h-2.5" />
                                        ESTUDIAR
                                      </button>

                                      {/* TEST */}
                                      <button
                                        onClick={() => openTestModal(tema.id, tema.texto)}
                                        data-tooltip="Escribe aciertos y total de preguntas. Se actualiza tu acierto medio."
                                        className="font-mono text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors text-[#fbbf24] border-[rgba(251,191,36,0.25)] hover:bg-[rgba(251,191,36,0.1)]"
                                      >
                                        <Brain className="w-2.5 h-2.5" />
                                        TEST
                                      </button>

                                      {/* REPASAR */}
                                      <button
                                        onClick={() => {
                                          handleRepasar(tema.id);
                                          openMissionModal(`Repasar: ${tema.texto}`, "oposicion");
                                        }}
                                        data-tooltip="Marca como repasado hoy. Reinicia el contador hasta el próximo repaso."
                                        className="font-mono text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors text-[#a78bfa] border-[rgba(167,139,250,0.25)] hover:bg-[rgba(167,139,250,0.1)]"
                                      >
                                        <RefreshCw className="w-2.5 h-2.5" />
                                        REPASAR
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Empty state guide */}
                          {sortedTemas.length === 0 && (
                            <div className="text-center py-5 space-y-2">
                              {selectedOp.bloques.length === 0 ? (
                                <div className="font-mono text-[11px] text-[#4a5a4a] space-y-1.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[rgba(var(--mode-accent-rgb),0.08)] border border-[rgba(var(--mode-accent-rgb),0.15)] text-[9px] text-[var(--mode-accent)] flex items-center justify-center shrink-0">1</span>
                                    <span>Crea bloques para organizar tu temario por peso</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[rgba(var(--mode-accent-rgb),0.08)] border border-[rgba(var(--mode-accent-rgb),0.15)] text-[9px] text-[var(--mode-accent)] flex items-center justify-center shrink-0">2</span>
                                    <span>Asigna pesos para calcular tu nota ponderada</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[rgba(var(--mode-accent-rgb),0.08)] border border-[rgba(var(--mode-accent-rgb),0.15)] text-[9px] text-[var(--mode-accent)] flex items-center justify-center shrink-0">3</span>
                                    <span>Añade temas y registra tus estudios y tests</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="font-mono text-[11px] text-[#4a5a4a] flex items-center justify-center gap-1.5">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  Añade temas para empezar a estudiar
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress summary */}
                          {selectedOp.temas.length > 0 && (
                            <div className="font-mono text-[12px] text-[#4a5a4a] mt-2 flex items-center gap-4">
                              <span>{temasTesteados}/{selectedOp.temas.length} testeados ({calcOposicionProgress(selectedOp)}%)</span>
                              <ProgressLine pct={calcOposicionProgress(selectedOp)} />
                            </div>
                          )}
                        </div>

                        {/* ---- Delete button ---- */}
                        <div className="flex justify-end pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                          <button onClick={() => setDeleteConfirm({ type: "oposicion", id: selectedOposicion! })} className="font-mono text-[10px] py-1.5 px-3 rounded border border-[rgba(239,68,68,0.2)] text-[#6b4a4a] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] transition-colors flex items-center gap-1" data-tooltip="Eliminar oposición">
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ==================== IDIOMAS ==================== */}
              {tab === "idiomas" && (
                <>
                  {/* List view */}
                  {!selectedIdioma && !showNewIdioma && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[#6b8a6b]">
                          {idiomas.length} idioma{idiomas.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => { setNewIdiForm({ ...EMPTY_IDIOMA }); setShowNewIdioma(true); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[12px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          NUEVO
                        </button>
                      </div>

                      {idiomas.length === 0 ? (
                        <div className="font-mono text-[12px] text-[#4a5a4a] text-center py-8 tracking-wider">{`{ }`}</div>
                      ) : (
                        <div className="space-y-2">
                          {idiomas.map((idi) => {
                            const pct = calcIdiomaProgress(idi);
                            return (
                              <div
                                key={idi.id}
                                onClick={() => openIdiomaDetail(idi.id)}
                                className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--mode-accent-rgb),0.08)] hover:border-[rgba(var(--mode-accent-rgb),0.15)]"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[12px] text-[#c8d6c0]">{idi.nombre}</span>
                                  <span className="font-mono text-[11px] text-[#4a5a4a]">{pct}%</span>
                                </div>
                                <div className="flex items-center gap-4 font-mono text-[12px] text-[#4a5a4a] mb-2">
                                  {idi.idioma && <span>{idi.idioma}</span>}
                                  {idi.nivel && <span>Nivel {idi.nivel}</span>}
                                  {idi.fechaExamen && <span>{formatDate(idi.fechaExamen)}</span>}
                                </div>
                                <ProgressLine pct={pct} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* CSV buttons */}
                      {idiomas.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                          <button onClick={() => handleExport("idiomas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors">
                            <FileDown className="w-3 h-3" />Exportar CSV
                          </button>
                          <button onClick={() => triggerImport("idiomas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors">
                            <FileUp className="w-3 h-3" />Importar CSV
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* New Idioma form */}
                  {showNewIdioma && (
                    <div className="space-y-3">
                      <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider mb-1">Nuevo idioma</div>
                      <div>
                        <label className={labelClass}><Languages className="w-3 h-3" /> Nombre</label>
                        <input value={newIdiForm.nombre} onChange={(e) => setNewIdiForm((f) => ({ ...f, nombre: e.target.value }))} className={inputClass} placeholder="Ej: Inglés B2" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Idioma</label>
                          <input value={newIdiForm.idioma} onChange={(e) => setNewIdiForm((f) => ({ ...f, idioma: e.target.value }))} className={inputClass} placeholder="Ej: Inglés" />
                        </div>
                        <div>
                          <label className={labelClass}><BarChart3 className="w-3 h-3" /> Nivel</label>
                          <input value={newIdiForm.nivel} onChange={(e) => setNewIdiForm((f) => ({ ...f, nivel: e.target.value }))} className={inputClass} placeholder="Ej: B2" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Fecha examen</label>
                        <input value={newIdiForm.fechaExamen} onChange={(e) => setNewIdiForm((f) => ({ ...f, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                      </div>
                      <div className="flex gap-2 shrink-0 pt-2">
                        <button onClick={() => setShowNewIdioma(false)} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={handleAddIdioma} disabled={!newIdiForm.nombre.trim()} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] transition-colors disabled:opacity-30 hover:bg-[rgba(var(--mode-accent-rgb),0.15)]">
                          <Plus className="w-3 h-3 inline mr-1" />Crear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Idioma detail */}
                  {selectedIdioma && editIdiForm && selectedIdi && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}><Languages className="w-3 h-3" /> Nombre</label>
                        <input value={editIdiForm.nombre} onChange={(e) => setEditIdiForm((f) => ({ ...f!, nombre: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Idioma</label>
                          <input value={editIdiForm.idioma} onChange={(e) => setEditIdiForm((f) => ({ ...f!, idioma: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}><BarChart3 className="w-3 h-3" /> Nivel</label>
                          <input value={editIdiForm.nivel} onChange={(e) => setEditIdiForm((f) => ({ ...f!, nivel: e.target.value }))} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Fecha examen</label>
                        <input value={editIdiForm.fechaExamen} onChange={(e) => setEditIdiForm((f) => ({ ...f!, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                      </div>

                      {/* Temario */}
                      <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-3">
                        <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          TEMARIO ({selectedIdi.temas.length})
                        </div>

                        <div className="flex gap-2 mb-2">
                          <input
                            value={newTemaIdi}
                            onChange={(e) => setNewTemaIdi(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && newTemaIdi.trim()) { addIdiomaTema(selectedIdioma!, newTemaIdi.trim()); setNewTemaIdi(""); } }}
                            placeholder="Nuevo tema..."
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            onClick={() => { if (newTemaIdi.trim()) { addIdiomaTema(selectedIdioma!, newTemaIdi.trim()); setNewTemaIdi(""); } }}
                            disabled={!newTemaIdi.trim()}
                            className="shrink-0 text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {selectedIdi.temas.length > 0 && (
                          <div className="space-y-1">
                            {selectedIdi.temas.map((tema) => (
                              <div key={tema.id} className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-2">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {tema.completado && <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />}
                                    <span className={`font-mono text-[14px] truncate ${tema.completado ? "text-[#4a5a4a] line-through" : "text-[#c8d6c0]"}`}>{tema.texto}</span>
                                  </div>
                                  <button
                                    onClick={() => setDeleteConfirm({ type: "idioma_tema", id: selectedIdioma!, extraId: tema.id })}
                                    className="text-[#4a5a4a] hover:text-[#ef4444] transition-colors shrink-0 ml-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <button
                                    onClick={() => openMissionModal(`${editIdiForm.idioma || editIdiForm.nombre} Vocabulario: ${tema.texto}`, "oposicion")}
                                    className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors flex items-center gap-1"
                                  >
                                    <BookOpen className="w-2.5 h-2.5" />Vocabulario
                                  </button>
                                  <button
                                    onClick={() => openMissionModal(`${editIdiForm.idioma || editIdiForm.nombre} Gramática: ${tema.texto}`, "oposicion")}
                                    className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors flex items-center gap-1"
                                  >
                                    <BookOpenCheck className="w-2.5 h-2.5" />Gramática
                                  </button>
                                  <button
                                    onClick={() => openMissionModal(`${editIdiForm.idioma || editIdiForm.nombre} Escucha: ${tema.texto}`, "oposicion")}
                                    className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors flex items-center gap-1"
                                  >
                                    <Languages className="w-2.5 h-2.5" />Escucha
                                  </button>
                                  <button
                                    onClick={() => openMissionModal(`${editIdiForm.idioma || editIdiForm.nombre} Conversación: ${tema.texto}`, "oposicion")}
                                    className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors flex items-center gap-1"
                                  >
                                    <Target className="w-2.5 h-2.5" />Conversación
                                  </button>
                                  <button
                                    onClick={() => updateIdiomaTema(selectedIdioma!, tema.id, { completado: !tema.completado })}
                                    className={`font-mono text-[10px] border rounded px-1.5 py-0.5 transition-colors flex items-center gap-1 ${tema.completado ? "text-[#4ade80] border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)]" : "text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#4ade80]"}`}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5" />Dominado
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedIdi.temas.length > 0 && (
                          <div className="font-mono text-[12px] text-[#4a5a4a] mt-2">
                            {selectedIdi.temas.filter((t) => t.completado).length}/{selectedIdi.temas.length} completados ({calcIdiomaProgress(selectedIdi)}%)
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                        <button onClick={() => { setSelectedIdioma(null); setEditIdiForm(null); }} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={saveIdioma} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] hover:bg-[rgba(var(--mode-accent-rgb),0.15)] transition-colors">Guardar cambios</button>
                        <button onClick={() => setDeleteConfirm({ type: "idioma", id: selectedIdioma! })} className="shrink-0 font-mono text-[10px] py-1.5 px-3 rounded border border-[rgba(239,68,68,0.2)] text-[#6b4a4a] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] transition-colors" data-tooltip="Eliminar idioma">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ==================== CURSOS ==================== */}
              {tab === "cursos" && (
                <>
                  {/* List view */}
                  {!selectedCurso && !showNewCurso && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] text-[#6b8a6b]">
                          {cursos.length} curso{cursos.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => { setNewCurForm({ ...EMPTY_CURSO }); setShowNewCurso(true); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[12px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          NUEVO
                        </button>
                      </div>

                      {cursos.length === 0 ? (
                        <div className="font-mono text-[12px] text-[#4a5a4a] text-center py-8 tracking-wider">{`{ }`}</div>
                      ) : (
                        <div className="space-y-2">
                          {cursos.map((c) => {
                            const pct = calcCursoProgress(c);
                            return (
                              <div
                                key={c.id}
                                onClick={() => openCursoDetail(c.id)}
                                className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--mode-accent-rgb),0.08)] hover:border-[rgba(var(--mode-accent-rgb),0.15)]"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[12px] text-[#c8d6c0]">{c.nombre}</span>
                                  <span className="font-mono text-[11px] text-[#4a5a4a]">{pct}%</span>
                                </div>
                                <div className="flex items-center gap-4 font-mono text-[12px] text-[#4a5a4a] mb-2">
                                  {c.institucion && <span>{c.institucion}</span>}
                                  {c.tipo && <span>{c.tipo}</span>}
                                </div>
                                <ProgressLine pct={pct} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* CSV buttons */}
                      {cursos.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                          <button onClick={() => handleExport("cursos")} className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors">
                            <FileDown className="w-3 h-3" />Exportar CSV
                          </button>
                          <button onClick={() => triggerImport("cursos")} className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[11px] text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#6b8a6b] hover:bg-[rgba(var(--mode-accent-rgb),0.05)] transition-colors">
                            <FileUp className="w-3 h-3" />Importar CSV
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* New Curso form */}
                  {showNewCurso && (
                    <div className="space-y-3">
                      <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider mb-1">Nuevo curso</div>
                      <div>
                        <label className={labelClass}><School className="w-3 h-3" /> Nombre</label>
                        <input value={newCurForm.nombre} onChange={(e) => setNewCurForm((f) => ({ ...f, nombre: e.target.value }))} className={inputClass} placeholder="Nombre del curso" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Institución</label>
                          <input value={newCurForm.institucion} onChange={(e) => setNewCurForm((f) => ({ ...f, institucion: e.target.value }))} className={inputClass} placeholder="Universidad, plataforma..." />
                        </div>
                        <div>
                          <label className={labelClass}>Tipo</label>
                          <select value={newCurForm.tipo} onChange={(e) => setNewCurForm((f) => ({ ...f, tipo: e.target.value as Curso["tipo"] }))} className={selectClass}>
                            <option>Grado</option>
                            <option>Master</option>
                            <option>Curso online</option>
                            <option>Certificación</option>
                            <option>Otro</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 pt-2">
                        <button onClick={() => setShowNewCurso(false)} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={handleAddCurso} disabled={!newCurForm.nombre.trim()} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] transition-colors disabled:opacity-30 hover:bg-[rgba(var(--mode-accent-rgb),0.15)]">
                          <Plus className="w-3 h-3 inline mr-1" />Crear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Curso detail (no asignatura selected) */}
                  {selectedCurso && !selectedAsignatura && !showNewAsignatura && editCurForm && selectedCur && (
                    <div className="space-y-3">
                      {/* Main fields */}
                      <div>
                        <label className={labelClass}><School className="w-3 h-3" /> Nombre</label>
                        <input value={editCurForm.nombre} onChange={(e) => setEditCurForm((f) => ({ ...f!, nombre: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Institución</label>
                          <input value={editCurForm.institucion} onChange={(e) => setEditCurForm((f) => ({ ...f!, institucion: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Tipo</label>
                          <select value={editCurForm.tipo} onChange={(e) => setEditCurForm((f) => ({ ...f!, tipo: e.target.value as Curso["tipo"] }))} className={selectClass}>
                            <option>Grado</option>
                            <option>Master</option>
                            <option>Curso online</option>
                            <option>Certificación</option>
                            <option>Otro</option>
                          </select>
                        </div>
                      </div>

                      {/* Asignaturas section */}
                      <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            ASIGNATURAS ({selectedCur.asignaturas.length})
                          </div>
                          <button
                            onClick={() => { setNewAsigForm({ ...EMPTY_ASIGNATURA }); setShowNewAsignatura(true); }}
                            className="flex items-center gap-1 px-2 py-1 rounded border font-mono text-[11px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                          >
                            <Plus className="w-3 h-3" />NUEVA
                          </button>
                        </div>

                        {selectedCur.asignaturas.length === 0 ? (
                          <div className="font-mono text-[12px] text-[#4a5a4a] text-center py-4">Sin asignaturas</div>
                        ) : (
                          <div className="space-y-1.5">
                            {selectedCur.asignaturas.map((asig) => {
                              const notaFinal = calcNotaFinal(asig.evaluaciones);
                              const pct = calcAsignaturaProgress(asig);
                              return (
                                <div
                                  key={asig.id}
                                  onClick={() => openAsignaturaDetail(asig.id)}
                                  className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--mode-accent-rgb),0.08)] hover:border-[rgba(var(--mode-accent-rgb),0.15)]"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-[14px] text-[#c8d6c0]">{asig.nombre}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-mono text-[11px] ${ESTADO_COLORS[asig.estado] ?? "text-[#6b8a6b]"}`}>{asig.estado}</span>
                                      <span className="font-mono text-[11px] text-[#4a5a4a]">{pct}%</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 font-mono text-[11px] text-[#4a5a4a] mb-1.5">
                                    <span>{asig.creditos} ECTS</span>
                                    {notaFinal !== "---" && (
                                      <span className={parseFloat(notaFinal) >= 5 ? "text-[#4ade80]" : "text-[#ef4444]"}>
                                        Nota: {notaFinal}
                                      </span>
                                    )}
                                    <span className="text-[#4a5a4a]">{asig.temas.filter((t) => t.tipo === "Memorizar").length} temas / {asig.temas.filter((t) => t.tipo === "Trabajo").length} trabajos</span>
                                  </div>
                                  <ProgressLine pct={pct} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                        <button onClick={() => { setSelectedCurso(null); setEditCurForm(null); }} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={saveCurso} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] hover:bg-[rgba(var(--mode-accent-rgb),0.15)] transition-colors">Guardar cambios</button>
                        <button onClick={() => setDeleteConfirm({ type: "curso", id: selectedCurso! })} className="shrink-0 font-mono text-[10px] py-1.5 px-3 rounded border border-[rgba(239,68,68,0.2)] text-[#6b4a4a] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] transition-colors" data-tooltip="Eliminar curso">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Asignatura form (within curso) */}
                  {selectedCurso && !selectedAsignatura && showNewAsignatura && (
                    <div className="space-y-3">
                      <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider mb-1">Nueva asignatura</div>
                      <div>
                        <label className={labelClass}><BookOpen className="w-3 h-3" /> Nombre</label>
                        <input value={newAsigForm.nombre} onChange={(e) => setNewAsigForm((f) => ({ ...f, nombre: e.target.value }))} className={inputClass} placeholder="Nombre de la asignatura" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Créditos</label>
                          <input value={newAsigForm.creditos} onChange={(e) => setNewAsigForm((f) => ({ ...f, creditos: parseInt(e.target.value) || 0 }))} className={inputClass} type="number" min={0} />
                        </div>
                        <div>
                          <label className={labelClass}>Estado</label>
                          <select value={newAsigForm.estado} onChange={(e) => setNewAsigForm((f) => ({ ...f, estado: e.target.value as Asignatura["estado"] }))} className={selectClass}>
                            <option>Pendiente</option>
                            <option>Cursando</option>
                            <option>Aprobada</option>
                            <option>Suspensa</option>
                            <option>Convalidada</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}><Calendar className="w-3 h-3" /> Fecha examen</label>
                        <input value={newAsigForm.fechaExamen} onChange={(e) => setNewAsigForm((f) => ({ ...f, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                      </div>
                      <div className="flex gap-2 shrink-0 pt-2">
                        <button onClick={() => setShowNewAsignatura(false)} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={handleAddAsignatura} disabled={!newAsigForm.nombre.trim()} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] transition-colors disabled:opacity-30 hover:bg-[rgba(var(--mode-accent-rgb),0.15)]">
                          <Plus className="w-3 h-3 inline mr-1" />Crear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Asignatura detail */}
                  {selectedCurso && selectedAsignatura && editAsigForm && selectedAsig && (
                    <div className="space-y-3">
                      {/* Main fields */}
                      <div>
                        <label className={labelClass}><BookOpen className="w-3 h-3" /> Nombre</label>
                        <input value={editAsigForm.nombre} onChange={(e) => setEditAsigForm((f) => ({ ...f!, nombre: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Créditos</label>
                          <input value={editAsigForm.creditos} onChange={(e) => setEditAsigForm((f) => ({ ...f!, creditos: parseInt(e.target.value) || 0 }))} className={inputClass} type="number" min={0} />
                        </div>
                        <div>
                          <label className={labelClass}>Estado</label>
                          <select value={editAsigForm.estado} onChange={(e) => setEditAsigForm((f) => ({ ...f!, estado: e.target.value as Asignatura["estado"] }))} className={selectClass}>
                            <option>Pendiente</option>
                            <option>Cursando</option>
                            <option>Aprobada</option>
                            <option>Suspensa</option>
                            <option>Convalidada</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}><Calendar className="w-3 h-3" /> Fecha examen</label>
                        <input value={editAsigForm.fechaExamen} onChange={(e) => setEditAsigForm((f) => ({ ...f!, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                      </div>

                      {/* Evaluaciones */}
                      <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 className="w-3 h-3" />
                            EVALUACIONES ({selectedAsig.evaluaciones.length})
                          </div>
                          <button
                            onClick={addNewEvaluacion}
                            className="flex items-center gap-1 px-2 py-1 rounded border font-mono text-[11px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                          >
                            <Plus className="w-3 h-3" />Añadir
                          </button>
                        </div>

                        {/* Nota final */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[12px] text-[#6b8a6b]">Nota final:</span>
                          <span className={`font-mono text-[16px] font-bold ${(() => { const nf = calcNotaFinal(selectedAsig.evaluaciones); return nf === "---" ? "text-[#4a5a4a]" : parseFloat(nf) >= 5 ? "text-[#4ade80]" : "text-[#ef4444]"; })()}`}>
                            {calcNotaFinal(selectedAsig.evaluaciones)}
                          </span>
                        </div>

                        {/* Needed for pass */}
                        {(() => { const n = calcNeededForPass(selectedAsig.evaluaciones); return n !== null ? (
                          <div className={`font-mono text-[11px] mb-2 ${n <= 10 ? "text-[#fbbf24]" : "text-[#ef4444]"}`}>
                            Para aprobar necesitas sacar un {n.toFixed(2)} de media en las restantes
                          </div>
                        ) : null; })()}

                        {/* Evals table */}
                        {selectedAsig.evaluaciones.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-[rgba(var(--mode-accent-rgb),0.15)]">
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal">Concepto</th>
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal w-20">Nota</th>
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal w-20">Peso %</th>
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal w-20">Aporte</th>
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal w-24">Fecha</th>
                                  <th className="font-mono text-[11px] text-[#6b8a6b] uppercase tracking-wider py-2 px-2 font-normal w-16"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedAsig.evaluaciones.map((ev) => {
                                  const isEditing = editingEvalId === ev.id;
                                  const aporte = ev.nota !== null ? (ev.nota * ev.peso / 100).toFixed(2) : "---";
                                  return (
                                    <tr key={ev.id} className="border-b border-[rgba(var(--mode-accent-rgb),0.1)]">
                                      {isEditing ? (
                                        <>
                                          <td className="py-1.5 px-1">
                                            <input value={editEvalData.concepto} onChange={(e) => setEditEvalData((d) => ({ ...d, concepto: e.target.value }))} className="w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-1 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]" />
                                          </td>
                                          <td className="py-1.5 px-1">
                                            <input value={editEvalData.nota} onChange={(e) => setEditEvalData((d) => ({ ...d, nota: e.target.value }))} className="w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-1 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]" type="number" step="0.01" placeholder="---" />
                                          </td>
                                          <td className="py-1.5 px-1">
                                            <input value={editEvalData.peso} onChange={(e) => setEditEvalData((d) => ({ ...d, peso: e.target.value }))} className="w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-1 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]" type="number" min={0} />
                                          </td>
                                          <td className="py-1.5 px-2 font-mono text-[12px] text-[#4a5a4a]">---</td>
                                          <td className="py-1.5 px-1">
                                            <input value={editEvalData.fecha} onChange={(e) => setEditEvalData((d) => ({ ...d, fecha: e.target.value }))} className="w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-1 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]" type="date" />
                                          </td>
                                          <td className="py-1.5 px-1">
                                            <div className="flex gap-1">
                                              <button onClick={saveEditEval} className="text-[#4ade80] hover:text-[#22c55e] transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => setEditingEvalId(null)} className="text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="py-2 px-2 font-mono text-[12px] text-[#c8d6c0]">{ev.concepto || "---"}</td>
                                          <td className="py-2 px-2 font-mono text-[12px] text-[#6b8a6b]">{ev.nota !== null ? String(ev.nota) : "---"}</td>
                                          <td className="py-2 px-2 font-mono text-[12px] text-[#6b8a6b]">{ev.peso}%</td>
                                          <td className="py-2 px-2 font-mono text-[12px] text-[#4a5a4a]">{aporte}</td>
                                          <td className="py-2 px-2 font-mono text-[12px] text-[#4a5a4a]">{ev.fecha ? formatDate(ev.fecha) : "---"}</td>
                                          <td className="py-2 px-1">
                                            <div className="flex gap-1">
                                              <button onClick={() => startEditEval(ev)} className="text-[#4a5a4a] hover:text-[#6b8a6b] transition-colors"><Pencil className="w-3 h-3" /></button>
                                              <button onClick={() => { setEditingEvalId(ev.id); setDeleteConfirm({ type: "evaluacion", id: selectedCurso!, extraId: selectedAsignatura! }); }} className="text-[#4a5a4a] hover:text-[#ef4444] transition-colors"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Sum pesos */}
                        {selectedAsig.evaluaciones.length > 0 && (
                          <div className="font-mono text-[11px] text-[#4a5a4a] mt-2 flex items-center gap-2">
                            Suma pesos: {calcSumPesos(selectedAsig.evaluaciones)}%
                            {calcSumPesos(selectedAsig.evaluaciones) !== 100 && (
                              <span className="text-[#ef4444]">(!= 100%)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Temario */}
                      <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-3">
                        <div className="font-mono text-[12px] text-[#6b8a6b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          TEMARIO ({selectedAsig.temas.length})
                        </div>

                        <div className="flex gap-2 mb-2">
                          <select
                            value={newTemaAsigTipo}
                            onChange={(e) => setNewTemaAsigTipo(e.target.value as TemaAsignaturaTipo)}
                            className="shrink-0 bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-2 py-2.5 font-mono text-[12px] text-[#c8d6c0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer"
                          >
                            <option value="Memorizar">Memorizar</option>
                            <option value="Trabajo">Trabajo</option>
                          </select>
                          <input
                            value={newTemaAsig}
                            onChange={(e) => setNewTemaAsig(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && newTemaAsig.trim()) { addAsignaturaTema(selectedCurso!, selectedAsignatura!, newTemaAsig.trim(), newTemaAsigTipo); setNewTemaAsig(""); } }}
                            placeholder={newTemaAsigTipo === "Memorizar" ? "Nuevo tema..." : "Nuevo trabajo..."}
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            onClick={() => { if (newTemaAsig.trim()) { addAsignaturaTema(selectedCurso!, selectedAsignatura!, newTemaAsig.trim(), newTemaAsigTipo); setNewTemaAsig(""); } }}
                            disabled={!newTemaAsig.trim()}
                            className="shrink-0 text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Suggestion for alta prioridad (Memorizar + Trabajos) */}
                        {(selectedAsig.temas.some((t) => t.tipo === "Memorizar" && t.prioridad === "alta" && t.fase !== "dominado") || selectedAsig.temas.some((t) => t.tipo === "Trabajo" && t.prioridad === "alta" && !t.completado)) && (
                          <div className="bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded px-3 py-2 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                            <span className="font-mono text-[11px] text-[#fbbf24]">SUGERENCIA: Empieza por los elementos de ALTA prioridad.</span>
                          </div>
                        )}

                        {selectedAsig.temas.length > 0 && (
                          <div className="space-y-1">
                            {selectedAsig.temas.map((tema) => {
                              const isCompleted = tema.completado || tema.fase === "dominado";
                              const temaTipo = tema.tipo || "Memorizar";

                              if (temaTipo === "Memorizar") {
                                // Memorizar temas: prioridad + fase + action buttons
                                return (
                                  <div key={tema.id} className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <BookMarked className="w-3 h-3 text-[#4a5a4a] shrink-0" />
                                        <span className="font-mono text-[14px] text-[#c8d6c0] truncate">{tema.texto}</span>
                                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />}
                                      </div>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: "asignatura_tema", id: selectedCurso!, extraId: tema.id })}
                                        className="text-[#4a5a4a] hover:text-[#ef4444] transition-colors shrink-0 ml-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <select
                                        value={tema.prioridad ?? "media"}
                                        onChange={(e) => updateAsignaturaTema(selectedCurso!, selectedAsignatura!, tema.id, { prioridad: e.target.value as TemaPrioridad })}
                                        className="bg-transparent border border-[rgba(var(--mode-accent-rgb),0.15)] rounded px-2 py-1 font-mono text-[11px] text-[#6b8a6b] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer"
                                      >
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                      </select>
                                      <PrioridadIcon prioridad={tema.prioridad ?? "media"} />
                                      <select
                                        value={tema.fase ?? "no_visto"}
                                        onChange={(e) => updateAsignaturaTema(selectedCurso!, selectedAsignatura!, tema.id, { fase: e.target.value as TemaFase })}
                                        className="bg-transparent border border-[rgba(var(--mode-accent-rgb),0.15)] rounded px-2 py-1 font-mono text-[11px] text-[#6b8a6b] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer ml-1"
                                      >
                                        {Object.entries(FASE_LABELS).map(([k, v]) => (
                                          <option key={k} value={k}>{v}</option>
                                        ))}
                                      </select>
                                      <span className="ml-0.5">{FASE_ICONS[tema.fase ?? "no_visto"]}</span>
                                      {(tema.fase !== "no_visto" && tema.fase !== "dominado" && FASE_ACTION_LABELS[tema.fase]) && (
                                        <button
                                          onClick={() => openMissionModal(`${FASE_ACTION_LABELS[tema.fase]}: ${tema.texto}`, "oposicion")}
                                          className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors ml-1"
                                        >
                                          {FASE_ACTION_LABELS[tema.fase]}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              } else {
                                // Trabajo temas: prioridad + completado + workflow buttons
                                return (
                                  <div key={tema.id} className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <ClipboardList className="w-3 h-3 text-[#4a5a4a] shrink-0" />
                                        {tema.completado && <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />}
                                        <span className={`font-mono text-[14px] truncate ${tema.completado ? "text-[#4a5a4a] line-through" : "text-[#c8d6c0]"}`}>{tema.texto}</span>
                                      </div>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: "asignatura_tema", id: selectedCurso!, extraId: tema.id })}
                                        className="text-[#4a5a4a] hover:text-[#ef4444] transition-colors shrink-0 ml-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Prioridad */}
                                      <select
                                        value={tema.prioridad ?? "media"}
                                        onChange={(e) => updateAsignaturaTema(selectedCurso!, selectedAsignatura!, tema.id, { prioridad: e.target.value as TemaPrioridad })}
                                        className="bg-transparent border border-[rgba(var(--mode-accent-rgb),0.15)] rounded px-2 py-1 font-mono text-[11px] text-[#6b8a6b] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer"
                                      >
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                      </select>
                                      <PrioridadIcon prioridad={tema.prioridad ?? "media"} />
                                      <button
                                        onClick={() => openMissionModal(`Entender enunciado: ${tema.texto}`, "oposicion")}
                                        className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        Entender enunciado
                                      </button>
                                      <button
                                        onClick={() => openMissionModal(`Buscar información: ${tema.texto}`, "oposicion")}
                                        className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        Buscar información
                                      </button>
                                      <button
                                        onClick={() => openMissionModal(`Redactar borrador: ${tema.texto}`, "oposicion")}
                                        className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        Redactar borrador
                                      </button>
                                      <button
                                        onClick={() => openMissionModal(`Revisar final: ${tema.texto}`, "oposicion")}
                                        className="font-mono text-[10px] text-[#4a5a4a] hover:text-[#c8d6c0] border border-[rgba(var(--mode-accent-rgb),0.12)] rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        Revisar final
                                      </button>
                                      <button
                                        onClick={() => updateAsignaturaTema(selectedCurso!, selectedAsignatura!, tema.id, { completado: !tema.completado })}
                                        className={`font-mono text-[10px] border rounded px-1.5 py-0.5 transition-colors flex items-center gap-1 ${tema.completado ? "text-[#4ade80] border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)]" : "text-[#4a5a4a] border-[rgba(var(--mode-accent-rgb),0.12)] hover:text-[#4ade80]"}`}
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5" />Entregado
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        )}

                        {/* Progress */}
                        {selectedAsig.temas.length > 0 && (
                          <div className="font-mono text-[12px] text-[#4a5a4a] mt-2">
                            {selectedAsig.temas.filter((t) => t.completado || t.fase === "dominado").length}/{selectedAsig.temas.length} completados ({calcAsignaturaProgress(selectedAsig)}%)
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                        <button onClick={() => { setSelectedAsignatura(null); setEditAsigForm(null); setEditingEvalId(null); }} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors">Cancelar</button>
                        <button onClick={saveAsignatura} className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] hover:bg-[rgba(var(--mode-accent-rgb),0.15)] transition-colors">Guardar cambios</button>
                        <button onClick={() => setDeleteConfirm({ type: "asignatura", id: selectedCurso!, extraId: selectedAsignatura! })} className="shrink-0 font-mono text-[10px] py-1.5 px-3 rounded border border-[rgba(239,68,68,0.2)] text-[#6b4a4a] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] transition-colors" data-tooltip="Eliminar asignatura">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Toast */}
            {toast.visible && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)] text-[#4ade80] font-mono text-xs px-4 py-2 rounded z-50 whitespace-nowrap">
                {toast.message}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Mission Modal ---- */}
      <Dialog open={!!missionModal} onOpenChange={(v) => !v && setMissionModal(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ background: studyBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm flex items-center gap-2" style={{ color: mc.accent }}>
              <Target className="w-4 h-4" />
              NUEVA MISIÓN CON FECHA
            </DialogTitle>
            <DialogDescription className="sr-only">Crear misión con fecha límite desde el Centro de Concentración</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Fecha límite */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                FECHA LÍMITE
              </label>
              <input
                type="date"
                value={missionForm.deadline}
                onChange={(e) => setMissionForm((f) => ({ ...f, deadline: e.target.value }))}
                className="xfiles-input w-full"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            {/* Título */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                TÍTULO
              </label>
              <input
                value={missionForm.title}
                onChange={(e) => setMissionForm((f) => ({ ...f, title: e.target.value }))}
                className="xfiles-input w-full"
                maxLength={60}
                placeholder="Estudiar tema 1..."
              />
            </div>
            {/* Descripción */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                DESCRIPCIÓN (OPCIONAL)
              </label>
              <textarea
                value={missionForm.description}
                onChange={(e) => setMissionForm((f) => ({ ...f, description: e.target.value }))}
                className="xfiles-input w-full min-h-[60px] resize-none"
                maxLength={200}
                placeholder="Detalles de la misión..."
              />
            </div>
            {/* Categoría + Dificultad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  CATEGORÍA
                </label>
                <select
                  value={missionForm.category}
                  onChange={(e) => setMissionForm((f) => ({ ...f, category: e.target.value as keyof Stats }))}
                  className="xfiles-input w-full font-mono text-xs"
                >
                  <option value="trabajo">Trabajo</option>
                  <option value="oposicion">Estudio</option>
                  <option value="salud">Salud</option>
                  <option value="asociacion">Voluntariado</option>
                  <option value="ocio">Ocio</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                  DIFICULTAD
                </label>
                <select
                  value={missionForm.difficulty}
                  onChange={(e) => setMissionForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                  className="xfiles-input w-full font-mono text-xs"
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* XP */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] block mb-1">
                RECOMPENSA XP BASE
              </label>
              <input
                value={missionForm.xp}
                onChange={(e) => setMissionForm((f) => ({ ...f, xp: parseInt(e.target.value) || 0 }))}
                className="xfiles-input w-full"
                type="number"
                min={10}
                max={500}
              />
              <div className="font-mono text-[10px] text-[#6b8a6b] mt-1">
                {(() => {
                  const cm = CATEGORY_MULTI_LABELS[missionForm.category];
                  const fxp = Math.round(missionForm.xp * DIFFICULTY_XP_MULTI[missionForm.difficulty] * cm.xp);
                  return (
                    <>XP final: {fxp}{cm.xp < 1 ? ` (x${cm.xp} cat.)` : ` (x${DIFFICULTY_XP_MULTI[missionForm.difficulty]})`}</>
                  );
                })()}
              </div>
            </div>
            {/* Subtareas */}
            <div>
              <label className="font-mono text-xs text-[#6b8a6b] flex items-center gap-1.5 mb-2">
                <ListChecks className="w-3 h-3" />
                SUBTAREAS (OPCIONAL)
              </label>
              {missionSubtasks.length > 0 && (
                <div className="space-y-1 mb-2">
                  {missionSubtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2">
                      <Circle className="w-3 h-3 text-[#4a5a4a] shrink-0" />
                      <span className="font-mono text-[10px] text-[#c8d6c0] flex-1">
                        {st.title}
                      </span>
                      <button
                        onClick={() => setMissionSubtasks((prev) => prev.filter((s) => s.id !== st.id))}
                        className="text-[#6b8a6b] hover:text-[#ef4444] transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newMissionSubtask}
                  onChange={(e) => setNewMissionSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = newMissionSubtask.trim();
                      if (t) {
                        setMissionSubtasks((prev) => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: t }]);
                        setNewMissionSubtask("");
                      }
                    }
                  }}
                  placeholder="Añadir paso..."
                  className="xfiles-input flex-1 text-xs"
                  maxLength={60}
                />
                <button
                  onClick={() => {
                    const t = newMissionSubtask.trim();
                    if (t) {
                      setMissionSubtasks((prev) => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: t }]);
                      setNewMissionSubtask("");
                    }
                  }}
                  disabled={!newMissionSubtask.trim()}
                  className="shrink-0 text-[#6b8a6b] hover:text-[#c8d6c0] transition-colors cursor-pointer disabled:opacity-30"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {missionSubtasks.length > 0 && (
                <p className="font-mono text-[9px] text-[#4a5a4a] mt-1">
                  El progreso se calculará automáticamente al completar subtareas
                </p>
              )}
            </div>
            {/* Submit */}
            <button
              onClick={handleCreateMission}
              disabled={!missionForm.title.trim() || !missionForm.deadline}
              className="w-full font-mono text-xs py-2 rounded xfiles-btn mt-2 disabled:opacity-30"
              style={{ borderColor: `rgba(${mc.accentRgb},0.3)`, color: mc.accent, background: `rgba(${mc.accentRgb},0.12)` }}
            >
              Crear misión con fecha
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation ---- */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              Eliminar {deleteLabel}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#4a5a4a]">
              {deleteConfirm?.type === "evaluacion"
                ? "Esta evaluación se eliminará permanentemente."
                : deleteConfirm?.type === "oposicion_tema" || deleteConfirm?.type === "idioma_tema" || deleteConfirm?.type === "asignatura_tema"
                  ? "Este tema se eliminará permanentemente."
                  : "Este elemento y todos sus datos asociados se eliminarán permanentemente."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#4a5a4a]" style={{ borderColor: "rgba(var(--mode-accent-rgb),0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={confirmDelete}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Eliminar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Import Confirmation ---- */}
      <AlertDialog open={!!importConfirm} onOpenChange={(v) => !v && setImportConfirm(null)}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#fbbf24] text-sm">
              Importar CSV
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#4a5a4a]">
              Se importarán {importConfirm?.data.length ?? 0} elementos. Los datos se añadirán a los existentes. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#4a5a4a]" style={{ borderColor: "rgba(var(--mode-accent-rgb),0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={confirmImport}
              className="font-mono text-xs bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border border-[rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Importar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ---- Test Modal ---- */}
      <AlertDialog open={!!testModal?.open} onOpenChange={(v) => !v && setTestModal(null)}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#fbbf24] text-sm">
              Registrar Test: {testModal?.temaTexto}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#4a5a4a]">
              Introduce los aciertos y el total de preguntas del test.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 py-3">
            <div>
              <label className={labelClass}>Aciertos</label>
              <input
                value={testAciertos}
                onChange={(e) => setTestAciertos(e.target.value)}
                className={inputClass}
                type="number"
                min="0"
                placeholder="0"
                onKeyDown={(e) => { if (e.key === "Enter" && testTotal) handleRecordTest(); }}
              />
            </div>
            <div className="flex items-end pb-1 font-mono text-[18px] text-[#4a5a4a]">/</div>
            <div>
              <label className={labelClass}>Total</label>
              <input
                value={testTotal}
                onChange={(e) => setTestTotal(e.target.value)}
                className={inputClass}
                type="number"
                min="1"
                placeholder="0"
                onKeyDown={(e) => { if (e.key === "Enter" && testAciertos) handleRecordTest(); }}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#4a5a4a]" style={{ borderColor: "rgba(var(--mode-accent-rgb),0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={handleRecordTest}
              disabled={!testAciertos || !testTotal || parseInt(testAciertos) > parseInt(testTotal)}
              className="font-mono text-xs bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border border-[rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.25)] rounded px-4 py-2 transition-colors duration-200 disabled:opacity-30"
            >
              Registrar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Edit Oposición Dialog ---- */}
      <Dialog open={editOpDialogOpen} onOpenChange={setEditOpDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto rounded-lg backdrop-blur-md p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{ background: studyBg, borderColor: `rgba(${mc.accentRgb},0.2)` }}
        >
          <DialogHeader>
            <DialogTitle className="font-mono text-sm flex items-center gap-2" style={{ color: mc.accent }}>
              <Pencil className="w-4 h-4" />
              Editar oposición
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] text-[#4a5a4a]">
              Modifica los datos generales y bloques de ponderación.
            </DialogDescription>
          </DialogHeader>
          {editOpForm && (
            <div className="space-y-4 mt-2">
              {/* Nombre */}
              <div>
                <label className={labelClass}><FileText className="w-3 h-3" /> Nombre</label>
                <input value={editOpForm.nombre} onChange={(e) => setEditOpForm((f) => ({ ...f!, nombre: e.target.value }))} className={inputClass} placeholder="Nombre de la oposición" />
              </div>
              {/* Organismo + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><Building2 className="w-3 h-3" /> Organismo</label>
                  <input value={editOpForm.organismo} onChange={(e) => setEditOpForm((f) => ({ ...f!, organismo: e.target.value }))} className={inputClass} placeholder="Organismo" />
                </div>
                <div>
                  <label className={labelClass}><Calendar className="w-3 h-3" /> Fecha examen</label>
                  <input value={editOpForm.fechaExamen} onChange={(e) => setEditOpForm((f) => ({ ...f!, fechaExamen: e.target.value }))} className={inputClass} type="date" />
                </div>
              </div>
              {/* Tipo de examen */}
              <div>
                <label className={labelClass}><ClipboardList className="w-3 h-3" /> Tipo de examen</label>
                <div className="flex flex-wrap gap-1.5">
                  {(["Test memoristico", "Desarrollo", "Caso practico"] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setEditOpForm((f) => ({
                        ...f!,
                        tipoExamen: f!.tipoExamen.includes(tipo)
                          ? f!.tipoExamen.filter((t) => t !== tipo)
                          : [...f!.tipoExamen, tipo],
                      }))}
                      className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-colors ${
                        editOpForm.tipoExamen.includes(tipo)
                          ? "border-[rgba(var(--mode-accent-rgb),0.4)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.1)]"
                          : "border-[rgba(var(--mode-accent-rgb),0.12)] text-[#4a5a4a] hover:text-[#6b8a6b] hover:border-[rgba(var(--mode-accent-rgb),0.25)]"
                      }`}
                    >
                      {editOpForm.tipoExamen.includes(tipo) ? <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" /> : null}{tipo}
                    </button>
                  ))}
                </div>
              </div>
              {/* Exámenes pasados */}
              <div>
                <label className={labelClass}><Award className="w-3 h-3" /> Exámenes pasados</label>
                <select value={editOpForm.tieneExamenesAnteriores} onChange={(e) => setEditOpForm((f) => ({ ...f!, tieneExamenesAnteriores: e.target.value as Oposicion["tieneExamenesAnteriores"] }))} className={selectClass}>
                  <option>Si</option>
                  <option>No</option>
                </select>
              </div>
              {/* Plazas + Aspirantes + Nota corte */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}><Users className="w-3 h-3" /> Plazas</label>
                  <input value={editOpForm.plazas} onChange={(e) => setEditOpForm((f) => ({ ...f!, plazas: e.target.value }))} className={inputClass} placeholder="150" />
                </div>
                <div>
                  <label className={labelClass}><Users className="w-3 h-3" /> Aspirantes</label>
                  <input value={editOpForm.aspirantes} onChange={(e) => setEditOpForm((f) => ({ ...f!, aspirantes: e.target.value }))} className={inputClass} placeholder="3500" />
                </div>
                <div>
                  <label className={labelClass}><Target className="w-3 h-3" /> Nota corte</label>
                  <input value={editOpForm.notaCorte} onChange={(e) => setEditOpForm((f) => ({ ...f!, notaCorte: e.target.value }))} className={inputClass} placeholder="6.8" />
                </div>
              </div>

              {/* ---- Bloques ---- */}
              <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-4">
                <label className={labelClass}><ListChecks className="w-3 h-3" /> Bloques ({editOpBloques.length})</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={editBloqueNombre}
                    onChange={(e) => setEditBloqueNombre(e.target.value)}
                    placeholder="Nombre del bloque..."
                    className={`${inputClass} flex-1`}
                    onKeyDown={(e) => { if (e.key === "Enter" && editBloqueNombre.trim()) handleEditAddBloque(); }}
                  />
                  <input
                    value={editBloquePeso}
                    onChange={(e) => setEditBloquePeso(e.target.value)}
                    placeholder="Peso %"
                    className={`${inputClass} w-20`}
                    type="number"
                    min="0"
                    max="100"
                    onKeyDown={(e) => { if (e.key === "Enter" && editBloqueNombre.trim()) handleEditAddBloque(); }}
                  />
                  <button
                    onClick={handleEditAddBloque}
                    disabled={!editBloqueNombre.trim()}
                    className="shrink-0 text-[#4a5a4a] hover:text-[#c8d6c0] transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {editOpBloques.length > 0 && (
                  <div className="space-y-1.5">
                    {editOpBloques.map((bloque) => (
                      <div key={bloque.id} className="flex items-center gap-2 bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.1)] rounded px-3 py-1.5">
                        <span className="font-mono text-[11px] text-[#c8d6c0] flex-1 truncate">{bloque.nombre}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            value={bloque.peso}
                            onChange={(e) => handleEditBloquePeso(bloque.id, parseInt(e.target.value) || 0)}
                            className="w-14 bg-transparent border border-[rgba(var(--mode-accent-rgb),0.2)] rounded px-1.5 py-0.5 font-mono text-[10px] text-[#c8d6c0] text-right focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]"
                            type="number"
                            min="0"
                            max="100"
                          />
                          <span className="font-mono text-[9px] text-[#4a5a4a]">%</span>
                        </div>
                        <button
                          onClick={() => handleEditRemoveBloque(bloque.id)}
                          className="shrink-0 text-[#4a5a4a] hover:text-[#ef4444] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="font-mono text-[9px] text-[#3a4a3a]">
                      Peso total: {editOpBloques.reduce((s, b) => s + b.peso, 0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Footer */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
            <button
              onClick={() => setEditOpDialogOpen(false)}
              className="flex-1 font-mono text-[11px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.15)] text-[#4a5a4a] hover:text-[#6b8a6b] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveOposicionFromDialog}
              className="flex-1 font-mono text-[11px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.4)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.1)] hover:bg-[rgba(var(--mode-accent-rgb),0.2)] transition-colors"
            >
              Guardar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
