import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Types ----

export type TemaFase = "no_visto" | "aprendiendo" | "practicando" | "repasando" | "dominado";
export type TemaPrioridad = "alta" | "media" | "baja";

export interface Bloque {
  id: string;
  nombre: string;
  peso: number; // percentage, should ideally sum to 100
}

export interface TestResult {
  date: string; // ISO date string YYYY-MM-DD
  aciertos: number;
  total: number;
}

export interface TemaOposicion {
  id: string;
  texto: string;
  bloque: string; // bloque ID reference
  fechaUltimoEstudio: string | null;
  fechaUltimoRepaso: string | null;
  historialTests: TestResult[];
  aciertoMedio: number | null;
}

export type TemaIdiomaHabilidad = "vocabulario" | "gramatica" | "escucha" | "conversacion" | "lectura" | "escritura";

export const HABILIDAD_LABELS: Record<TemaIdiomaHabilidad, string> = {
  vocabulario: "Vocabulario",
  gramatica: "Gramática",
  escucha: "Escucha",
  conversacion: "Conversación",
  lectura: "Lectura",
  escritura: "Escritura",
};

export const HABILIDAD_ICONS: Record<TemaIdiomaHabilidad, string> = {
  vocabulario: "BookOpen",
  gramatica: "BookOpenCheck",
  escucha: "Languages",
  conversacion: "Target",
  lectura: "FileText",
  escritura: "Pencil",
};

export interface TemaIdioma {
  id: string;
  texto: string;
  completado: boolean;
  habilidad?: TemaIdiomaHabilidad;
  fase?: TemaFase;
  prioridad?: TemaPrioridad;
  fechaUltimoEstudio?: string | null;
}

export type TemaAsignaturaTipo = "Memorizar" | "Trabajo";

export interface TemaAsignatura {
  id: string;
  texto: string;
  tipo: TemaAsignaturaTipo;
  completado: boolean;
  fase?: TemaFase;
  prioridad?: TemaPrioridad;
  fechaUltimoEstudio?: string | null;
}

export interface Evaluacion {
  id: string;
  concepto: string;
  nota: number | null;
  peso: number;
  fecha: string;
}

export interface Asignatura {
  id: string;
  nombre: string;
  creditos: number;
  estado: "Pendiente" | "Cursando" | "Aprobada" | "Suspensa" | "Convalidada";
  evaluaciones: Evaluacion[];
  fechaExamen: string;
  temas: TemaAsignatura[];
}

export interface Oposicion {
  id: string;
  nombre: string;
  organismo: string;
  fechaExamen: string;
  tipoExamen: string[];
  tieneExamenesAnteriores: "Si" | "No";
  plazas: string;
  aspirantes: string;
  notaCorte: string;
  pesoBloques: string; // keep for backward compat
  bloques: Bloque[];
  temas: TemaOposicion[];
}

export interface Idioma {
  id: string;
  nombre: string;
  idioma: string;
  nivel: string;
  fechaExamen: string;
  temas: TemaIdioma[];
}

export interface Curso {
  id: string;
  nombre: string;
  institucion: string;
  tipo: "Grado" | "Master" | "Curso online" | "Certificacion" | "Otro";
  asignaturas: Asignatura[];
}

// ---- Store State ----

export interface StudyState {
  oposiciones: Oposicion[];
  idiomas: Idioma[];
  cursos: Curso[];

  // Oposiciones
  addOposicion: (op: Omit<Oposicion, "id">) => void;
  updateOposicion: (id: string, data: Partial<Omit<Oposicion, "id">>) => void;
  deleteOposicion: (id: string) => void;
  addOposicionTema: (opId: string, texto: string, bloque: string) => void;
  updateOposicionTema: (opId: string, temaId: string, data: Partial<Omit<TemaOposicion, "id">>) => void;
  deleteOposicionTema: (opId: string, temaId: string) => void;

  // Bloques
  addBloque: (opId: string, bloque: Omit<Bloque, "id">) => void;
  updateBloque: (opId: string, bloqueId: string, data: Partial<Omit<Bloque, "id">>) => void;
  deleteBloque: (opId: string, bloqueId: string) => void;

  // Oposicion tema actions
  estudiarTema: (opId: string, temaId: string) => void;
  repasarTema: (opId: string, temaId: string) => void;
  recordTest: (opId: string, temaId: string, aciertos: number, total: number) => void;

  // Idiomas
  addIdioma: (idioma: Omit<Idioma, "id">) => void;
  updateIdioma: (id: string, data: Partial<Omit<Idioma, "id">>) => void;
  deleteIdioma: (id: string) => void;
  addIdiomaTema: (idiomaId: string, texto: string, habilidad?: TemaIdiomaHabilidad) => void;
  updateIdiomaTema: (idiomaId: string, temaId: string, data: Partial<Omit<TemaIdioma, "id">>) => void;
  deleteIdiomaTema: (idiomaId: string, temaId: string) => void;
  estudiarIdiomaTema: (idiomaId: string, temaId: string) => void;

  // Cursos
  addCurso: (curso: Omit<Curso, "id">) => void;
  updateCurso: (id: string, data: Partial<Omit<Curso, "id">>) => void;
  deleteCurso: (id: string) => void;

  // Asignaturas
  addAsignatura: (cursoId: string, asig: Omit<Asignatura, "id">) => void;
  updateAsignatura: (cursoId: string, asigId: string, data: Partial<Omit<Asignatura, "id">>) => void;
  deleteAsignatura: (cursoId: string, asigId: string) => void;
  addAsignaturaTema: (cursoId: string, asigId: string, texto: string, tipo: TemaAsignaturaTipo) => void;
  updateAsignaturaTema: (cursoId: string, asigId: string, temaId: string, data: Partial<Omit<TemaAsignatura, "id">>) => void;
  deleteAsignaturaTema: (cursoId: string, asigId: string, temaId: string) => void;
  estudiarAsignaturaTema: (cursoId: string, asigId: string, temaId: string) => void;

  // Evaluaciones
  addEvaluacion: (cursoId: string, asigId: string, ev: Omit<Evaluacion, "id">) => void;
  updateEvaluacion: (cursoId: string, asigId: string, evId: string, data: Partial<Omit<Evaluacion, "id">>) => void;
  deleteEvaluacion: (cursoId: string, asigId: string, evId: string) => void;

  // CSV Export
  exportOposicionesCSV: () => string;
  exportIdiomasCSV: () => string;
  exportCursosCSV: () => string;

  // CSV Import
  importOposicionesCSV: (csv: string) => Oposicion[];
  importIdiomasCSV: (csv: string) => Idioma[];
  importCursosCSV: (csv: string) => Curso[];
}

// ---- Helpers ----

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ---- Default Data ----

const DEFAULT_OPOSICIONES: Oposicion[] = [
  {
    id: "op-default-1",
    nombre: "Administrativo del Estado",
    organismo: "AGE",
    fechaExamen: "2026-06-20",
    tipoExamen: ["Test memorístico"],
    tieneExamenesAnteriores: "No",
    plazas: "150",
    aspirantes: "3500",
    notaCorte: "6.8",
    pesoBloques: "",
    bloques: [
      { id: "bloque-1", nombre: "Constitución", peso: 40 },
      { id: "bloque-2", nombre: "Administración", peso: 30 },
      { id: "bloque-3", nombre: "Recursos Humanos", peso: 30 },
    ],
    temas: [
      { id: "op-t-1", texto: "Tema 1. La Constitución", bloque: "bloque-1", fechaUltimoEstudio: "2026-05-04", fechaUltimoRepaso: "2026-04-27", historialTests: [{ date: "2026-05-04", aciertos: 8, total: 10 }, { date: "2026-04-27", aciertos: 7, total: 10 }], aciertoMedio: 75 },
      { id: "op-t-2", texto: "Tema 2. El Gobierno", bloque: "bloque-1", fechaUltimoEstudio: null, fechaUltimoRepaso: null, historialTests: [], aciertoMedio: null },
      { id: "op-t-3", texto: "Tema 3. La Administración", bloque: "bloque-2", fechaUltimoEstudio: "2026-04-20", fechaUltimoRepaso: "2026-05-01", historialTests: [{ date: "2026-04-20", aciertos: 9, total: 10 }], aciertoMedio: 90 },
    ],
  },
];

const DEFAULT_IDIOMAS: Idioma[] = [
  {
    id: "id-default-1",
    nombre: "Inglés B2",
    idioma: "Inglés",
    nivel: "B2",
    fechaExamen: "2026-07-15",
    temas: [
      { id: "id-t-1", texto: "Past tenses", completado: false, habilidad: "gramatica" as const, fase: "aprendiendo" as const, prioridad: "media" as const, fechaUltimoEstudio: "2026-05-10" },
      { id: "id-t-2", texto: "Future forms", completado: false, habilidad: "gramatica" as const, fase: "no_visto" as const, prioridad: "media" as const, fechaUltimoEstudio: null },
      { id: "id-t-3", texto: "Conditionals", completado: false, habilidad: "gramatica" as const, fase: "no_visto" as const, prioridad: "alta" as const, fechaUltimoEstudio: null },
      { id: "id-t-4", texto: "Travel vocabulary", completado: false, habilidad: "vocabulario" as const, fase: "practicando" as const, prioridad: "media" as const, fechaUltimoEstudio: "2026-05-12" },
      { id: "id-t-5", texto: "Listening: News", completado: false, habilidad: "escucha" as const, fase: "no_visto" as const, prioridad: "baja" as const, fechaUltimoEstudio: null },
    ],
  },
];

const DEFAULT_CURSOS: Curso[] = [
  {
    id: "cur-default-1",
    nombre: "2º Grado Historia",
    institucion: "UNED",
    tipo: "Grado",
    asignaturas: [
      {
        id: "asig-default-1",
        nombre: "Arte del Renacimiento",
        creditos: 6,
        estado: "Aprobada",
        evaluaciones: [
          { id: "ev-1", concepto: "Examen final", nota: 7.0, peso: 60, fecha: "2025-06-15" },
          { id: "ev-2", concepto: "Prácticas", nota: 8.5, peso: 30, fecha: "2025-05-10" },
          { id: "ev-3", concepto: "Asistencia", nota: 9.0, peso: 10, fecha: "" },
        ],
        fechaExamen: "",
        temas: [
          { id: "at-1", texto: "Tema 1. Quattrocento", tipo: "Memorizar", completado: true, fase: "dominado", prioridad: "baja", fechaUltimoEstudio: "2025-05-20" },
          { id: "at-2", texto: "Tema 2. Pintura flamenca", tipo: "Memorizar", completado: false, fase: "aprendiendo", prioridad: "media", fechaUltimoEstudio: "2025-05-28" },
        ],
      },
      {
        id: "asig-default-2",
        nombre: "Historia Contemporánea",
        creditos: 6,
        estado: "Cursando",
        evaluaciones: [],
        fechaExamen: "",
        temas: [
          { id: "at-3", texto: "Tema 1. Revolución Francesa", tipo: "Memorizar", completado: false, fase: "no_visto", prioridad: "media", fechaUltimoEstudio: null },
          { id: "at-4", texto: "Tema 2. Restauración", tipo: "Memorizar", completado: false, fase: "no_visto", prioridad: "media", fechaUltimoEstudio: null },
          { id: "at-5", texto: "Trabajo: La Ilustración", tipo: "Trabajo", completado: false, prioridad: "alta", fechaUltimoEstudio: null },
        ],
      },
    ],
  },
];

// ---- CSV Parsing Helpers ----

function parseFaseLabel(label: string): TemaFase {
  const map: Record<string, TemaFase> = {
    "no_visto": "no_visto", "aprendiendo": "aprendiendo",
    "practicando": "practicando", "repasando": "repasando", "dominado": "dominado",
  };
  return map[label.toLowerCase()] || "no_visto";
}

function parseTemasIdioma(temasStr: string): TemaIdioma[] {
  if (!temasStr.trim()) return [];
  return temasStr.split(";").map((t) => {
    const parts = t.trim();
    const match = parts.match(/^(.*?)\s*\((true|false)\)$/);
    if (match) {
      return { id: genId(), texto: match[1].trim(), completado: match[2] === "true" };
    }
    return { id: genId(), texto: parts, completado: false };
  });
}

function parseTemasAsignatura(temasStr: string): TemaAsignatura[] {
  if (!temasStr.trim()) return [];
  return temasStr.split(";").filter(Boolean).map((t) => {
    const parts = t.trim();
    const tipoMatch = parts.match(/^\[(Memorizar|Trabajo)\]\s*(.*)$/);
    const tipo = (tipoMatch ? tipoMatch[1] : "Memorizar") as TemaAsignaturaTipo;
    const texto = tipoMatch ? tipoMatch[2].trim() : parts;
    if (tipo === "Memorizar") {
      const match = texto.match(/^(.*?)\s*\((\w+)\s*\|\s*(\w+)\)$/);
      if (match) {
        return {
          id: genId(), texto: match[1].trim(), tipo,
          completado: false,
          fase: parseFaseLabel(match[3]),
          prioridad: (match[2] as TemaPrioridad) || "media",
        };
      }
      return { id: genId(), texto, tipo, completado: false, fase: "no_visto" as TemaFase, prioridad: "media" as TemaPrioridad };
    }
    const match = texto.match(/^(.*?)\s*\((true|false)\)$/);
    if (match) {
      return { id: genId(), texto: match[1].trim(), tipo, completado: match[2] === "true" };
    }
    return { id: genId(), texto, tipo, completado: false };
  });
}

function parseEvaluaciones(evalsStr: string): Evaluacion[] {
  if (!evalsStr.trim()) return [];
  return evalsStr.split(";").filter(Boolean).map((e) => {
    const ep = e.split(":");
    return {
      id: genId(),
      concepto: ep[0] || "",
      nota: ep[1] && ep[1].trim() !== "" ? parseFloat(ep[1]) : null,
      peso: ep[2] ? parseInt(ep[2]) : 0,
      fecha: ep[3] || "",
    };
  });
}

// CSV row parser (handles quoted fields)
function parseCSVRow(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === "," && !inQuotes) { parts.push(current); current = ""; continue; }
    current += char;
  }
  parts.push(current);
  return parts;
}

// ---- Store ----

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      oposiciones: DEFAULT_OPOSICIONES,
      idiomas: DEFAULT_IDIOMAS,
      cursos: DEFAULT_CURSOS,

      // ---- Oposiciones ----
      addOposicion: (op) => set((s) => ({ oposiciones: [{ ...op, id: genId() }, ...s.oposiciones] })),
      updateOposicion: (id, data) => set((s) => ({ oposiciones: s.oposiciones.map((o) => o.id === id ? { ...o, ...data } : o) })),
      deleteOposicion: (id) => set((s) => ({ oposiciones: s.oposiciones.filter((o) => o.id !== id) })),
      addOposicionTema: (opId, texto, bloque) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, temas: [...o.temas, { id: genId(), texto, bloque, fechaUltimoEstudio: null, fechaUltimoRepaso: null, historialTests: [], aciertoMedio: null }] } : o
        ),
      })),
      updateOposicionTema: (opId, temaId, data) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, temas: o.temas.map((t) => t.id === temaId ? { ...t, ...data } : t) } : o
        ),
      })),
      deleteOposicionTema: (opId, temaId) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, temas: o.temas.filter((t) => t.id !== temaId) } : o
        ),
      })),

      // ---- Bloques ----
      addBloque: (opId, bloque) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, bloques: [...o.bloques, { ...bloque, id: genId() }] } : o
        ),
      })),
      updateBloque: (opId, bloqueId, data) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, bloques: o.bloques.map((b) => b.id === bloqueId ? { ...b, ...data } : b) } : o
        ),
      })),
      deleteBloque: (opId, bloqueId) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, bloques: o.bloques.filter((b) => b.id !== bloqueId) } : o
        ),
      })),

      // ---- Tema actions ----
      estudiarTema: (opId, temaId) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, temas: o.temas.map((t) => t.id === temaId ? { ...t, fechaUltimoEstudio: new Date().toISOString().slice(0, 10) } : t) } : o
        ),
      })),
      repasarTema: (opId, temaId) => set((s) => ({
        oposiciones: s.oposiciones.map((o) =>
          o.id === opId ? { ...o, temas: o.temas.map((t) => t.id === temaId ? { ...t, fechaUltimoRepaso: new Date().toISOString().slice(0, 10) } : t) } : o
        ),
      })),
      recordTest: (opId, temaId, aciertos, total) => set((s) => ({
        oposiciones: s.oposiciones.map((o) => {
          if (o.id !== opId) return o;
          const tema = o.temas.find((t) => t.id === temaId);
          if (!tema) return o;
          const newTest: TestResult = { date: new Date().toISOString().slice(0, 10), aciertos, total };
          const newHistorial = [...tema.historialTests, newTest];
          const totalAciertos = newHistorial.reduce((sum, tr) => sum + tr.aciertos, 0);
          const totalPreguntas = newHistorial.reduce((sum, tr) => sum + tr.total, 0);
          const newAciertoMedio = totalPreguntas > 0 ? Math.round((totalAciertos / totalPreguntas) * 100) : null;
          return {
            ...o,
            temas: o.temas.map((t) =>
              t.id === temaId
                ? { ...t, historialTests: newHistorial, aciertoMedio: newAciertoMedio, fechaUltimoEstudio: new Date().toISOString().slice(0, 10) }
                : t
            ),
          };
        }),
      })),

      // ---- Idiomas ----
      addIdioma: (idioma) => set((s) => ({ idiomas: [{ ...idioma, id: genId() }, ...s.idiomas] })),
      updateIdioma: (id, data) => set((s) => ({ idiomas: s.idiomas.map((i) => i.id === id ? { ...i, ...data } : i) })),
      deleteIdioma: (id) => set((s) => ({ idiomas: s.idiomas.filter((i) => i.id !== id) })),
      addIdiomaTema: (idiomaId, texto, habilidad) => set((s) => ({
        idiomas: s.idiomas.map((i) =>
          i.id === idiomaId ? { ...i, temas: [...i.temas, { id: genId(), texto, completado: false, habilidad: habilidad ?? "vocabulario", fase: "no_visto" as TemaFase, prioridad: "media" as TemaPrioridad, fechaUltimoEstudio: null }] } : i
        ),
      })),
      updateIdiomaTema: (idiomaId, temaId, data) => set((s) => ({
        idiomas: s.idiomas.map((i) =>
          i.id === idiomaId ? { ...i, temas: i.temas.map((t) => t.id === temaId ? { ...t, ...data } : t) } : i
        ),
      })),
      deleteIdiomaTema: (idiomaId, temaId) => set((s) => ({
        idiomas: s.idiomas.map((i) =>
          i.id === idiomaId ? { ...i, temas: i.temas.filter((t) => t.id !== temaId) } : i
        ),
      })),
      estudiarIdiomaTema: (idiomaId, temaId) => set((s) => ({
        idiomas: s.idiomas.map((i) =>
          i.id === idiomaId ? { ...i, temas: i.temas.map((t) => t.id === temaId ? { ...t, fechaUltimoEstudio: new Date().toISOString().slice(0, 10), fase: t.fase === "no_visto" ? "aprendiendo" as TemaFase : t.fase } : t) } : i
        ),
      })),

      // ---- Cursos ----
      addCurso: (curso) => set((s) => ({ cursos: [{ ...curso, id: genId() }, ...s.cursos] })),
      updateCurso: (id, data) => set((s) => ({ cursos: s.cursos.map((c) => c.id === id ? { ...c, ...data } : c) })),
      deleteCurso: (id) => set((s) => ({ cursos: s.cursos.filter((c) => c.id !== id) })),

      // ---- Asignaturas ----
      addAsignatura: (cursoId, asig) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? { ...c, asignaturas: [{ ...asig, id: genId() }, ...c.asignaturas] } : c
        ),
      })),
      updateAsignatura: (cursoId, asigId, data) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? { ...c, asignaturas: c.asignaturas.map((a) => a.id === asigId ? { ...a, ...data } : a) } : c
        ),
      })),
      deleteAsignatura: (cursoId, asigId) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? { ...c, asignaturas: c.asignaturas.filter((a) => a.id !== asigId) } : c
        ),
      })),
      addAsignaturaTema: (cursoId, asigId, texto, tipo) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) => {
              if (a.id !== asigId) return a;
              const newTema: TemaAsignatura = tipo === "Memorizar"
                ? { id: genId(), texto, tipo, completado: false, fase: "no_visto" as TemaFase, prioridad: "media" as TemaPrioridad }
                : { id: genId(), texto, tipo, completado: false, prioridad: "media" as TemaPrioridad };
              return { ...a, temas: [...a.temas, newTema] };
            }),
          } : c
        ),
      })),
      updateAsignaturaTema: (cursoId, asigId, temaId, data) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, temas: a.temas.map((t) => t.id === temaId ? { ...t, ...data } : t) } : a
            ),
          } : c
        ),
      })),
      deleteAsignaturaTema: (cursoId, asigId, temaId) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, temas: a.temas.filter((t) => t.id !== temaId) } : a
            ),
          } : c
        ),
      })),
      estudiarAsignaturaTema: (cursoId, asigId, temaId) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, temas: a.temas.map((t) => t.id === temaId ? { ...t, fechaUltimoEstudio: new Date().toISOString().slice(0, 10), fase: t.fase === "no_visto" ? "aprendiendo" as TemaFase : t.fase } : t) } : a
            ),
          } : c
        ),
      })),

      // ---- Evaluaciones ----
      addEvaluacion: (cursoId, asigId, ev) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, evaluaciones: [...a.evaluaciones, { ...ev, id: genId() }] } : a
            ),
          } : c
        ),
      })),
      updateEvaluacion: (cursoId, asigId, evId, data) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, evaluaciones: a.evaluaciones.map((e) => e.id === evId ? { ...e, ...data } : e) } : a
            ),
          } : c
        ),
      })),
      deleteEvaluacion: (cursoId, asigId, evId) => set((s) => ({
        cursos: s.cursos.map((c) =>
          c.id === cursoId ? {
            ...c,
            asignaturas: c.asignaturas.map((a) =>
              a.id === asigId ? { ...a, evaluaciones: a.evaluaciones.filter((e) => e.id !== evId) } : a
            ),
          } : c
        ),
      })),

      // ---- CSV Export ----
      exportOposicionesCSV: () => {
        const ops = get().oposiciones;
        const header = "Nombre,Organismo,FechaExamen,TipoExamen,Plazas,Aspirantes,NotaCorte,Bloques,Temas";
        const rows = ops.map((o) => {
          const bloquesStr = o.bloques.map((b) => b.nombre + ":" + b.peso + "%").join(";");
          const temasStr = o.temas.map((t) => {
            const bloqueNombre = o.bloques.find((b) => b.id === t.bloque)?.nombre ?? "";
            const testsStr = t.historialTests.map((tr) => tr.aciertos + "/" + tr.total).join("|");
            const partes = [t.texto];
            if (bloqueNombre) partes.push("[" + bloqueNombre + "]");
            if (t.aciertoMedio !== null) partes.push("acierto:" + t.aciertoMedio + "%");
            if (t.fechaUltimoEstudio) partes.push("estudio:" + t.fechaUltimoEstudio);
            if (t.fechaUltimoRepaso) partes.push("repaso:" + t.fechaUltimoRepaso);
            if (testsStr) partes.push("tests:" + testsStr);
            return partes.join(" ");
          }).join(";");
          return '"' + o.nombre + '","' + o.organismo + '","' + o.fechaExamen + '","' + o.tipoExamen.join(" + ") + '","' + o.plazas + '","' + o.aspirantes + '","' + o.notaCorte + '","' + bloquesStr + '","' + temasStr + '"';
        });
        return [header, ...rows].join("\n");
      },

      exportIdiomasCSV: () => {
        const ids = get().idiomas;
        const header = "Nombre,Idioma,Nivel,FechaExamen,Temas";
        const rows = ids.map((i) => {
          const temasStr = i.temas.map((t) => t.texto + " (" + t.completado + ")").join(";");
          return '"' + i.nombre + '","' + i.idioma + '","' + i.nivel + '","' + i.fechaExamen + '","' + temasStr + '"';
        });
        return [header, ...rows].join("\n");
      },

      exportCursosCSV: () => {
        const cursos = get().cursos;
        const header = "Curso,Institucion,Tipo,Asignatura,Creditos,Estado,Evaluaciones,Temas";
        const rows = cursos.flatMap((c) =>
          c.asignaturas.map((a) => {
            const evalsStr = a.evaluaciones.map((e) =>
              e.concepto + ":" + (e.nota ?? "") + ":" + e.peso + "%:" + e.fecha
            ).join(";");
            const temasStr = a.temas.map((t) => {
              const prefix = "[" + t.tipo + "] ";
              if (t.tipo === "Memorizar" && t.prioridad && t.fase) {
                return prefix + t.texto + " (" + t.prioridad + "|" + t.fase + ")";
              }
              if (t.tipo === "Trabajo") {
                return prefix + t.texto + " (" + t.completado + ")";
              }
              return prefix + t.texto;
            }).join(";");
            return '"' + c.nombre + '","' + c.institucion + '","' + c.tipo + '","' + a.nombre + '",' + a.creditos + ',"' + a.estado + '","' + evalsStr + '","' + temasStr + '"';
          })
        );
        return [header, ...rows].join("\n");
      },

      // ---- CSV Import ----
      importOposicionesCSV: (csv) => {
        const lines = csv.trim().split("\n");
        const expectedHeader = "Nombre,Organismo,FechaExamen,TipoExamen,Plazas,Aspirantes,NotaCorte,Bloques,Temas";
        if (lines[0] !== expectedHeader) {
          throw new Error("Formato de CSV no válido. Encabezado esperado: " + expectedHeader);
        }
        return lines.slice(1).filter((l) => l.trim()).map((line) => {
          const parts = parseCSVRow(line);
          // Parse bloques
          const bloques = parts[7] ? parts[7].split(";").filter(Boolean).map((b) => {
            const bp = b.split(":");
            return { id: genId(), nombre: bp[0] || "", peso: parseInt(bp[1]) || 0 };
          }) : [];
          // Parse temas - simplified
          const temas: TemaOposicion[] = parts[8] ? parts[8].split(";").filter(Boolean).map((t) => {
            return {
              id: genId(),
              texto: t.trim(),
              bloque: bloques.length > 0 ? bloques[0].id : "",
              fechaUltimoEstudio: null,
              fechaUltimoRepaso: null,
              historialTests: [],
              aciertoMedio: null,
            };
          }) : [];
          return {
            id: genId(),
            nombre: parts[0] || "",
            organismo: parts[1] || "",
            fechaExamen: parts[2] || "",
            tipoExamen: parts[3] ? parts[3].split("+").map((t) => t.trim()).filter(Boolean) : ["Test memorístico"],
            tieneExamenesAnteriores: "No" as const,
            plazas: parts[4] || "",
            aspirantes: parts[5] || "",
            notaCorte: parts[6] || "",
            pesoBloques: "",
            bloques,
            temas,
          };
        });
      },

      importIdiomasCSV: (csv) => {
        const lines = csv.trim().split("\n");
        const expectedHeader = "Nombre,Idioma,Nivel,FechaExamen,Temas";
        if (lines[0] !== expectedHeader) {
          throw new Error("Formato de CSV no válido. Encabezado esperado: " + expectedHeader);
        }
        return lines.slice(1).filter((l) => l.trim()).map((line) => {
          const parts = parseCSVRow(line);
          return {
            id: genId(),
            nombre: parts[0] || "",
            idioma: parts[1] || "",
            nivel: parts[2] || "",
            fechaExamen: parts[3] || "",
            temas: parseTemasIdioma(parts[4] || ""),
          };
        });
      },

      importCursosCSV: (csv) => {
        const lines = csv.trim().split("\n");
        const expectedHeader = "Curso,Institucion,Tipo,Asignatura,Creditos,Estado,Evaluaciones,Temas";
        if (lines[0] !== expectedHeader) {
          throw new Error("Formato de CSV no válido. Encabezado esperado: " + expectedHeader);
        }
        const cursoMap = new Map<string, Curso>();
        for (const line of lines.slice(1)) {
          if (!line.trim()) continue;
          const parts = parseCSVRow(line);
          const cursoName = parts[0];
          if (!cursoMap.has(cursoName)) {
            cursoMap.set(cursoName, {
              id: genId(), nombre: cursoName, institucion: parts[1] || "",
              tipo: (parts[2] || "Otro") as Curso["tipo"], asignaturas: [],
            });
          }
          const curso = cursoMap.get(cursoName)!;
          curso.asignaturas.push({
            id: genId(), nombre: parts[3] || "", creditos: parseInt(parts[4]) || 0,
            estado: (parts[5] || "Pendiente") as Asignatura["estado"],
            evaluaciones: parseEvaluaciones(parts[6] || ""),
            fechaExamen: "",
            temas: parseTemasAsignatura(parts[7] || ""),
          });
        }
        return Array.from(cursoMap.values());
      },
    }),
    {
      name: "estudio-storage",
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        if (version <= 3 && persisted) {
          const state = persisted as Record<string, unknown>;
          const oposiciones = (state.oposiciones as Oposicion[] | undefined) ?? [];
          const migratedOps = oposiciones.map((op) => ({
            ...op,
            bloques: (op as Oposicion).bloques ?? [],
            temas: ((op as Oposicion).temas ?? []).map((t) => {
              const tema = t as Record<string, unknown>;
              // Already migrated (has new fields)
              if ("historialTests" in tema) return t as TemaOposicion;
              // Old format - migrate
              return {
                id: tema.id as string,
                texto: tema.texto as string,
                bloque: "",
                fechaUltimoEstudio: null,
                fechaUltimoRepaso: null,
                historialTests: [],
                aciertoMedio: null,
              };
            }),
          }));
          // Also keep existing v2 migration for cursos
          let migratedCursos = (state.cursos as Curso[] | undefined) ?? [];
          if (version <= 1 && migratedCursos.length > 0) {
            migratedCursos = migratedCursos.map((c) => ({
              ...c,
              asignaturas: c.asignaturas.map((a) => {
                const { subcategoria, ...rest } = a as Asignatura & { subcategoria?: string };
                return {
                  ...rest,
                  temas: (a.temas as TemaAsignatura[]).map((t) => {
                    if (t.tipo) return t;
                    const isMemorizar = subcategoria === "Memorizar" || (t.fase !== undefined && t.prioridad !== undefined);
                    return { ...t, tipo: (isMemorizar ? "Memorizar" : "Trabajo") as TemaAsignaturaTipo };
                  }),
                };
              }),
            }));
          }
          if (version <= 2 && migratedCursos.length > 0) {
            migratedCursos = migratedCursos.map((c) => ({
              ...c,
              asignaturas: c.asignaturas.map((a) => ({
                ...a,
                temas: a.temas.map((t) => {
                  if (t.tipo === "Trabajo" && !t.prioridad) {
                    return { ...t, prioridad: "media" as TemaPrioridad };
                  }
                  return t;
                }),
              })),
            }));
          }
          // v5: migrate idioma temas + asignatura temas fechaUltimoEstudio
          const idiomas = (state.idiomas as Idioma[] | undefined) ?? [];
          const migratedIdiomas = idiomas.map((i) => ({
            ...i,
            temas: i.temas.map((t) => {
              const tema = t as unknown as Record<string, unknown>;
              if ("habilidad" in tema) return t;
              return { ...t, habilidad: "vocabulario" as TemaIdiomaHabilidad, fase: "no_visto" as TemaFase, prioridad: "media" as TemaPrioridad, fechaUltimoEstudio: null };
            }),
          }));
          const migratedCursosV5 = migratedCursos.map((c) => ({
            ...c,
            asignaturas: c.asignaturas.map((a) => ({
              ...a,
              temas: a.temas.map((t) => {
                if ("fechaUltimoEstudio" in t) return t;
                return { ...t, fechaUltimoEstudio: null };
              }),
            })),
          }));
          return { ...state, oposiciones: migratedOps, cursos: migratedCursosV5, idiomas: migratedIdiomas };
        }
        // v4 → v5: migrate idioma temas + asignatura temas
        if (version === 4 && persisted) {
          const state = persisted as Record<string, unknown>;
          const idiomas = (state.idiomas as Idioma[] | undefined) ?? [];
          const migratedIdiomas = idiomas.map((i) => ({
            ...i,
            temas: i.temas.map((t) => {
              const tema = t as unknown as Record<string, unknown>;
              if ("habilidad" in tema) return t;
              return { ...t, habilidad: "vocabulario" as TemaIdiomaHabilidad, fase: "no_visto" as TemaFase, prioridad: "media" as TemaPrioridad, fechaUltimoEstudio: null };
            }),
          }));
          const cursos = (state.cursos as Curso[] | undefined) ?? [];
          const migratedCursos = cursos.map((c) => ({
            ...c,
            asignaturas: c.asignaturas.map((a) => ({
              ...a,
              temas: a.temas.map((t) => {
                if ("fechaUltimoEstudio" in t) return t;
                return { ...t, fechaUltimoEstudio: null };
              }),
            })),
          }));
          return { ...state, idiomas: migratedIdiomas, cursos: migratedCursos };
        }
        return persisted as StudyState;
      },
    }
  )
);
