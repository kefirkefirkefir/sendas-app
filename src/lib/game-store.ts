import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Types ----

export interface Stats {
  trabajo: number;
  oposicion: number;
  salud: number;
  asociacion: number;
  ocio: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type MissionType = "deadline" | "habit";

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: keyof Stats;
  xpReward: number;
  coinReward: number;
  difficulty: "facil" | "medio" | "dificil" | "legendario";
  progress: number;
  subtasks: Subtask[];
  createdAt: string;
  completed: boolean;
  missionType: MissionType;
  deadline?: string; // YYYY-MM-DD for deadline missions
  habitStreak: number; // consecutive days checked for habits
  completedDates: string[]; // "YYYY-MM-DD" for habit daily tracking
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface CharacterProfile {
  avatar: string;
  age: string;
  backstory: string;
  specialty: string;
  base: string;
  motivation: string;
  trait: string;
  emblem: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  category: keyof Stats;
  xpEarned: number;
  missionsCompleted: number;
  weightedPoints: number; // difficulty-weighted: 1 for facil/medio, 2 for dificil/legendario
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO timestamp
  text: string;
}

// ---- CRM / Job Search ----

export const COMPANY_STATES = [
  "Por contactar",
  "Candidatura enviada",
  "Respuesta recibida",
  "Entrevista programada",
  "En proceso",
  "Oferta recibida",
  "Descartada",
  "Para seguimiento",
] as const;

export type CompanyState = (typeof COMPANY_STATES)[number];

export const COMPANY_CHANNELS = [
  "LinkedIn",
  "InfoJobs",
  "Web propia",
  "Correo directo",
  "ETT/Agencia",
  "Conocidos",
  "Otro",
] as const;

export type CompanyChannel = (typeof COMPANY_CHANNELS)[number];

export interface CompanyAction {
  id: string;
  date: string; // ISO timestamp
  text: string;
}

export interface Company {
  id: string;
  empresa: string;
  estado: CompanyState;
  canal: CompanyChannel;
  contacto: string;
  emailContacto: string;
  urlOferta: string;
  fechaPrimerContacto: string; // YYYY-MM-DD
  ultimoMovimiento: string; // YYYY-MM-DD
  notas: string;
  acciones: CompanyAction[];
}

export type GameMode = "neutral" | "estudio" | "busqueda" | "descanso";
export type Difficulty = Mission["difficulty"];

// ---- Agent Classes (RPG) ----

export type AgentClassId = "spooky" | "doctora" | "informante" | "subdirector" | "agente_doble";

export interface AgentClass {
  id: AgentClassId;
  name: string;
  role: string;
  icon: string;
  description: string;
  stats: Stats;
}

export const AGENT_CLASSES: AgentClass[] = [
  {
    id: "spooky",
    name: "Agente Spooky",
    role: "DPS",
    icon: "🔦",
    description: "Fuerza y acción directa. No se detiene ante nada.",
    stats: { trabajo: 7, oposicion: 3, salud: 5, asociacion: 2, ocio: 3 },
  },
  {
    id: "doctora",
    name: "Doctora en Medicina",
    role: "Mente",
    icon: "🔬",
    description: "Inteligencia y análisis. La ciencia como arma.",
    stats: { trabajo: 2, oposicion: 7, salud: 3, asociacion: 4, ocio: 4 },
  },
  {
    id: "informante",
    name: "Informante Conspiranoico",
    role: "Control",
    icon: "📡",
    description: "Contactos y astucia social. Sabe más de lo que dice.",
    stats: { trabajo: 3, oposicion: 4, salud: 2, asociacion: 7, ocio: 4 },
  },
  {
    id: "subdirector",
    name: "Subdirector del FBI",
    role: "Tanque",
    icon: "🏛️",
    description: "Resistencia y supervivencia. Imparable.",
    stats: { trabajo: 4, oposicion: 3, salud: 9, asociacion: 2, ocio: 2 },
  },
  {
    id: "agente_doble",
    name: "Agente Doble",
    role: "Equilibrado",
    icon: "🎭",
    description: "Adaptable en todas las áreas. No hay debilidad.",
    stats: { trabajo: 4, oposicion: 4, salud: 4, asociacion: 4, ocio: 4 },
  },
];

export function getClassData(classId: AgentClassId | null): AgentClass | null {
  if (!classId) return null;
  return AGENT_CLASSES.find((c) => c.id === classId) ?? null;
}

// ---- Habit Helpers ----

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i] + "T12:00:00");
    const prev = new Date(sorted[i + 1] + "T12:00:00");
    const diffDays = (current.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---- Helpers ----

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function xpForLevel(level: number): number {
  return (level + 1) * 100;
}

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
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

// Category XP/coin multipliers: ocio = no reward, salud/asociacion = half
const CATEGORY_XP_MULTI: Partial<Record<keyof Stats, number>> = {
  trabajo: 1,
  oposicion: 1,
  salud: 0.5,
  asociacion: 0.5,
  ocio: 0,
};

const CATEGORY_COIN_MULTI: Partial<Record<keyof Stats, number>> = {
  trabajo: 1,
  oposicion: 1,
  salud: 0.5,
  asociacion: 0.5,
  ocio: 0,
};

// ---- Default Rewards (X-Files themed) ----

export const REWARD_TEMPLATES: Omit<Reward, "id">[] = [
  {
    name: "Expediente cerrado",
    description: "Ignorar una pequeña obligación",
    cost: 5,
    icon: "FolderCheck",
  },
  {
    name: "Un café con el fumador",
    description: "Charla relajada sin prisas",
    cost: 10,
    icon: "Coffee",
  },
  {
    name: "Video VHS de los expedientes",
    description: "Maratón de un episodio",
    cost: 15,
    icon: "Film",
  },
  {
    name: "Paseo por Twin Peaks",
    description: "Desconexión total en la naturaleza",
    cost: 25,
    icon: "Trees",
  },
  {
    name: "Madriguera del Pistolero",
    description: "Noche de pizza, cerveza y teorías locas",
    cost: 25,
    icon: "Beer",
  },
  {
    name: "Avistamiento confirmado",
    description: "Salida a un sitio especial (cine, concierto)",
    cost: 35,
    icon: "Compass",
  },
  {
    name: "Log Lady",
    description: "Día de introspección y autocuidado",
    cost: 40,
    icon: "Eye",
  },
  {
    name: "Transmisión del Pistolero Solitario",
    description: "Tarde de hobbies creativos",
    cost: 45,
    icon: "Radio",
  },
  {
    name: "Abducción",
    description: "Escapada de fin de semana (pequeña)",
    cost: 60,
    icon: "Rocket",
  },
];

// ---- Store State ----

export interface GameState {
  // Player
  playerName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;

  // Stats (0-100 each)
  stats: Stats;

  // Missions
  missions: Mission[];
  activeMissionId: string | null;

  // Rewards
  rewards: Reward[];
  redeemedRewards: { id: string; redeemedAt: string }[];
  availableCoins: number;

  // Settings
  audioEnabled: boolean;
  currentMode: GameMode;
  aestheticTheme: "xfiles";

  // Character roleplay
  character: CharacterProfile;
  selectedClass: AgentClassId | null;

  // Daily activity log for oracle
  dailyActivity: DailyActivity[];

  // Diary / Field journal
  diaryEntries: DiaryEntry[];

  // CRM / Job search
  companies: Company[];

  // Weekly deal randomization
  weeklyDealSeed: number;

  // Reset counter
  resetVersion: number;

  // Notification queue
  pendingNotifications: Array<{
    id: string;
    type: "xp" | "coin" | "levelup";
    value: number;
    timestamp: number;
  }>;

  // Actions
  addXp: (amount: number, category: keyof Stats) => void;
  createMission: (
    mission: Omit<Mission, "id" | "createdAt" | "completed" | "progress" | "subtasks" | "habitStreak" | "completedDates">
  ) => void;
  toggleHabitDay: (missionId: string) => void;
  completeMission: (id: string) => void;
  deleteMission: (id: string) => void;
  updateMissionProgress: (id: string, progress: number) => void;
  updateMission: (id: string, data: Partial<Pick<Mission, 'title' | 'description' | 'category' | 'difficulty' | 'xpReward' | 'coinReward' | 'deadline' | 'subtasks'>>) => void;
  toggleSubtask: (missionId: string, subtaskId: string) => void;
  createReward: (reward: Omit<Reward, "id">) => void;
  redeemReward: (id: string) => void;
  removeRedeemedReward: (index: number) => void;
  deleteReward: (id: string) => void;
  setMode: (mode: GameMode) => void;
  setPlayerName: (name: string) => void;
  toggleAudio: () => void;
  consumeNotification: (id: string) => void;
  reorderMission: (activeId: string, overId: string) => void;
  subtractXp: (amount: number) => void;
  setLevel: (level: number) => void;
  resetAll: () => void;
  updateCharacter: (data: Partial<CharacterProfile>) => void;
  setSelectedClass: (id: AgentClassId | null) => void;
  getDailyScores: () => Record<keyof Stats, { score: number; xp: number; missions: number }>;
  addDiaryEntry: (text: string) => void;
  deleteDiaryEntry: (id: string) => void;
  clearAllDiaryEntries: () => void;
  // CRM
  addCompany: (company: Omit<Company, "id" | "acciones">) => void;
  updateCompany: (id: string, data: Partial<Omit<Company, "id">>) => void;
  deleteCompany: (id: string) => void;
  addCompanyAction: (companyId: string, text: string) => void;
  clearAllCompanies: () => void;
}

// ---- Default State ----

const defaultStats: Stats = {
  trabajo: 10,
  oposicion: 10,
  salud: 10,
  asociacion: 10,
  ocio: 10,
};

// ---- Store ----

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Player defaults
      playerName: "",
      level: 0,
      xp: 0,
      xpToNextLevel: 100,
      totalXpEarned: 0,

      // Stats defaults
      stats: { ...defaultStats },

      // Missions defaults
      missions: [],
      activeMissionId: null,

      // Rewards defaults
      rewards: [],
      redeemedRewards: [],
      availableCoins: 0,

      // Settings defaults
      audioEnabled: false,
      currentMode: "neutral",
      aestheticTheme: "xfiles" as const,

      // Character defaults
      character: { avatar: "", age: "", backstory: "", specialty: "", base: "", motivation: "", trait: "", emblem: "" },
      selectedClass: null,

      // Daily activity log
      dailyActivity: [],

      // Diary
      diaryEntries: [],

      // CRM — sample data
      companies: [
        {
          id: "crm-sample-1",
          empresa: "TechCorp Solutions",
          estado: "Candidatura enviada",
          canal: "LinkedIn",
          contacto: "María García",
          emailContacto: "maria.garcia@techcorp.com",
          urlOferta: "https://linkedin.com/jobs/view/1234",
          fechaPrimerContacto: "2026-04-28",
          ultimoMovimiento: "2026-05-02",
          notas: "Puesto de desarrollador full-stack. Stack: React, Node.js, PostgreSQL. Remoto híbrido.",
          acciones: [
            { id: "act-1", date: "2026-04-28T10:00:00.000Z", text: "Enviada candidatura vía LinkedIn" },
            { id: "act-2", date: "2026-05-02T09:15:00.000Z", text: "Email de confirmación de recepción" },
          ],
        },
        {
          id: "crm-sample-2",
          empresa: "Innova Consulting Group",
          estado: "Entrevista programada",
          canal: "InfoJobs",
          contacto: "Carlos Ruiz",
          emailContacto: "rrhh@innovaconsulting.es",
          urlOferta: "https://www.infojobs.net/oferta/5678",
          fechaPrimerContacto: "2026-04-20",
          ultimoMovimiento: "2026-05-05",
          notas: "Consultora tecnológica. Buscan perfil senior con experiencia en cloud. Entrevista técnica el 8 de mayo.",
          acciones: [
            { id: "act-3", date: "2026-04-20T14:30:00.000Z", text: "Aplicación enviada por InfoJobs" },
            { id: "act-4", date: "2026-04-25T11:00:00.000Z", text: "Llamada telefónica de screening con RRHH" },
            { id: "act-5", date: "2026-05-05T16:45:00.000Z", text: "Confirmada entrevista técnica para el 8/05" },
          ],
        },
        {
          id: "crm-sample-3",
          empresa: "DataFlow Startup",
          estado: "Por contactar",
          canal: "Web propia",
          contacto: "",
          emailContacto: "careers@dataflow.io",
          urlOferta: "https://dataflow.io/careers",
          fechaPrimerContacto: "",
          ultimoMovimiento: "",
          notas: "Startup de数据分析. Oferta interesante de data engineer. Revisar portfolio antes de enviar.",
          acciones: [],
        },
        {
          id: "crm-sample-4",
          empresa: "Randstad Tech",
          estado: "Respuesta recibida",
          canal: "ETT/Agencia",
          contacto: "Laura Martín",
          emailContacto: "laura.martin@randstad.es",
          urlOferta: "",
          fechaPrimerContacto: "2026-04-15",
          ultimoMovimiento: "2026-05-01",
          notas: "ETT que gestiona procesos para varios clientes. Tienen varias vacantes aligned. Pendiente de enviar documentación.",
          acciones: [
            { id: "act-6", date: "2026-04-15T09:00:00.000Z", text: "Contacto inicial vía web Randstad" },
            { id: "act-7", date: "2026-04-22T10:30:00.000Z", text: "Entrevista presencial con consultora" },
            { id: "act-8", date: "2026-05-01T13:00:00.000Z", text: "Recibido email con vacantes disponibles" },
          ],
        },
        {
          id: "crm-sample-5",
          empresa: "NeoBank Digital",
          estado: "En proceso",
          canal: "LinkedIn",
          contacto: "Ana Beltrán",
          emailContacto: "ana.beltran@neobank.es",
          urlOferta: "https://linkedin.com/jobs/view/9876",
          fechaPrimerContacto: "2026-04-10",
          ultimoMovimiento: "2026-05-04",
          notas: "Fintech en expansión. Buscan frontend developer con experiencia en React Native y TypeScript. Proceso con 3 fases.",
          acciones: [
            { id: "act-9", date: "2026-04-10T08:45:00.000Z", text: "Candidatura enviada por LinkedIn" },
            { id: "act-10", date: "2026-04-18T10:00:00.000Z", text: "Test técnico online (React + API)" },
            { id: "act-11", date: "2026-04-28T15:30:00.000Z", text: "Primera entrevista con tech lead" },
            { id: "act-12", date: "2026-05-04T11:00:00.000Z", text: "Segunda entrevista con VP of Engineering" },
          ],
        },
        {
          id: "crm-sample-6",
          empresa: "Global Logistics S.A.",
          estado: "Descartada",
          canal: "InfoJobs",
          contacto: "RRHH",
          emailContacto: "Seleccion@globallogistics.com",
          urlOferta: "https://www.infojobs.net/oferta/3456",
          fechaPrimerContacto: "2026-04-05",
          ultimoMovimiento: "2026-04-20",
          notas: "Empresa logística. Oferta para mantenedor de sistemas internos. Descartada: salarial por debajo de expectativas y sin opción remoto.",
          acciones: [
            { id: "act-13", date: "2026-04-05T09:30:00.000Z", text: "Aplicación enviada" },
            { id: "act-14", date: "2026-04-12T11:00:00.000Z", text: "Entrevista telefónica inicial" },
            { id: "act-15", date: "2026-04-20T14:00:00.000Z", text: "Descartada tras recibir detalles de condiciones" },
          ],
        },
        {
          id: "crm-sample-7",
          empresa: "CloudBridge Systems",
          estado: "Oferta recibida",
          canal: "Referencia",
          contacto: "Pedro Jiménez",
          emailContacto: "pedro.jimenez@cloudbridge.io",
          urlOferta: "",
          fechaPrimerContacto: "2026-03-28",
          ultimoMovimiento: "2026-05-06",
          notas: "Empresa de infraestructura cloud. Contacto por referencia de ex-compañero. Oferta recibida: 42k + beneficios. Pendiente de respuesta.",
          acciones: [
            { id: "act-16", date: "2026-03-28T12:00:00.000Z", text: "Contacto vía referencia de David (ex-colega)" },
            { id: "act-17", date: "2026-04-05T10:00:00.000Z", text: "Café informal con Pedro (CTO)" },
            { id: "act-18", date: "2026-04-15T09:30:00.000Z", text: "Entrevista técnica: diseño de microservicios" },
            { id: "act-19", date: "2026-04-25T16:00:00.000Z", text: "Entrevista final con CEO" },
            { id: "act-20", date: "2026-05-06T10:00:00.000Z", text: "Oferta formal recibida por email" },
          ],
        },
        {
          id: "crm-sample-8",
          empresa: "MediaPixel Agency",
          estado: "Para seguimiento",
          canal: "Web propia",
          contacto: "Sofía Navarro",
          emailContacto: "sofia@media Pixel.es",
          urlOferta: "https://mediapixel.es/trabaja-con-nosotros",
          fechaPrimerContacto: "2026-04-22",
          ultimoMovimiento: "2026-04-30",
          notas: "Agencia digital creativa. Buscan desarrollador web full-stack. Proyecto interesante pero esperan respuesta de cliente final para confirmar posición.",
          acciones: [
            { id: "act-21", date: "2026-04-22T09:00:00.000Z", text: "CV enviado a careers@mediapixel.es" },
            { id: "act-22", date: "2026-04-30T17:30:00.000Z", text: "RRHH avisa que el proceso está pausado hasta confirmar proyecto" },
          ],
        },
      ],

      // Weekly deal seed (randomized on reset)
      weeklyDealSeed: Math.floor(Math.random() * 100000),

      // Reset version counter
      resetVersion: 0,

      // Notifications
      pendingNotifications: [],

      // ---- Actions ----

      addXp: (amount, category) => {
        const state = get();
        const multiplier = DIFFICULTY_MULTIPLIER.facil; // base multiplier for direct XP
        const finalXp = Math.round(amount * multiplier);

        let newLevel = state.level;
        let newXp = state.xp + finalXp;
        let newXpToNext = state.xpToNextLevel;
        let notifications = [...state.pendingNotifications];

        // Add XP notification
        notifications.push({
          id: generateId(),
          type: "xp",
          value: finalXp,
          timestamp: Date.now(),
        });

        // Check for level ups
        while (newXp >= newXpToNext) {
          newXp -= newXpToNext;
          newLevel++;
          newXpToNext = xpForLevel(newLevel);

          // Add level-up notification
          notifications.push({
            id: generateId(),
            type: "levelup",
            value: newLevel,
            timestamp: Date.now(),
          });
        }

        // Update stat (capped at 100)
        const currentStat = state.stats[category];
        const statIncrease = Math.min(finalXp, 100 - currentStat);
        const newStats = statIncrease > 0
          ? { ...state.stats, [category]: Math.min(currentStat + statIncrease, 100) }
          : state.stats;

        // Log daily activity
        const today = new Date().toISOString().slice(0, 10);
        const existingIdx = state.dailyActivity.findIndex(
          (d) => d.date === today && d.category === category
        );
        let newDailyActivity: DailyActivity[];
        if (existingIdx >= 0) {
          newDailyActivity = [...state.dailyActivity];
          newDailyActivity[existingIdx] = {
            ...newDailyActivity[existingIdx],
            xpEarned: newDailyActivity[existingIdx].xpEarned + finalXp,
          };
        } else {
          newDailyActivity = [
            ...state.dailyActivity,
            { date: today, category, xpEarned: finalXp, missionsCompleted: 0, weightedPoints: 0 },
          ];
        }

        set({
          xp: newXp,
          level: newLevel,
          xpToNextLevel: newXpToNext,
          totalXpEarned: state.totalXpEarned + finalXp,
          pendingNotifications: notifications,
          stats: newStats,
          dailyActivity: newDailyActivity,
        });
      },

      createMission: (missionData) => {
        const mission: Mission = {
          ...missionData,
          id: generateId(),
          progress: 0,
          subtasks: missionData.subtasks ?? [],
          completed: false,
          createdAt: new Date().toISOString(),
          habitStreak: 0,
          completedDates: [],
        };
        set((s) => ({ missions: [mission, ...s.missions] }));
      },

      updateMission: (id, data) => {
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        }));
      },

      toggleHabitDay: (missionId) => {
        const state = get();
        const mission = state.missions.find((m) => m.id === missionId);
        if (!mission || mission.missionType !== "habit" || mission.completed) return;

        const today = new Date().toISOString().slice(0, 10);
        const alreadyDone = mission.completedDates.includes(today);

        let newCompletedDates: string[];
        let newStreak: number;

        // Bonus: x2 from day 16 onwards
          const checkDates = alreadyDone ? mission.completedDates : [...mission.completedDates, today];
          const isBonus = checkDates.length >= 15;
          const bonusMulti = isBonus ? 2 : 1;

        if (alreadyDone) {
          // Uncheck today — subtract XP and coins, decrement streak by 1
          newCompletedDates = mission.completedDates.filter((d) => d !== today);
          newStreak = Math.max(0, mission.habitStreak - 1);

          const catXpMulti = CATEGORY_XP_MULTI[mission.category] ?? 1;
          const habitXp = Math.max(0, Math.round((mission.xpReward / 21) * catXpMulti * bonusMulti));
          if (habitXp > 0) {
            get().subtractXp(habitXp);
          }

          const catCoinMulti = CATEGORY_COIN_MULTI[mission.category] ?? 1;
          const habitCoins = Math.max(0, Math.round((mission.coinReward / 21) * catCoinMulti * bonusMulti));
          if (habitCoins > 0) {
            set({ availableCoins: Math.max(0, get().availableCoins - habitCoins) });
          }
        } else {
          // Check today
          newCompletedDates = [...mission.completedDates, today];
          newStreak = calculateStreak(newCompletedDates);

          // Award XP for habit completion (with category and bonus multiplier)
          const catXpMulti = CATEGORY_XP_MULTI[mission.category] ?? 1;
          const habitXp = Math.max(0, Math.round((mission.xpReward / 21) * catXpMulti * bonusMulti));
          if (habitXp > 0) {
            get().addXp(habitXp, mission.category);
          }

          // Coin reward (with category and bonus multiplier)
          const catCoinMulti = CATEGORY_COIN_MULTI[mission.category] ?? 1;
          const habitCoins = Math.max(0, Math.round((mission.coinReward / 21) * catCoinMulti * bonusMulti));
          if (habitCoins > 0) {
            set({ availableCoins: state.availableCoins + habitCoins });
          }
        }

        // Update mission
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === missionId
              ? { ...m, completedDates: newCompletedDates, habitStreak: newStreak }
              : m
          ),
        }));
      },

      completeMission: (id) => {
        const state = get();
        const mission = state.missions.find((m) => m.id === id);
        if (!mission) return;
        if (mission.missionType === "habit") return; // habits use toggleHabitDay instead

        // Toggle: if already completed, uncomplete it
        if (mission.completed) {
          const difficulty = mission.difficulty;
          const diffMulti = DIFFICULTY_MULTIPLIER[difficulty];
          const catXpMulti = CATEGORY_XP_MULTI[mission.category] ?? 1;
          const catCoinMulti = CATEGORY_COIN_MULTI[mission.category] ?? 1;
          const coins = Math.round(DIFFICULTY_COINS[difficulty] * catCoinMulti);
          const finalXp = Math.round(mission.xpReward * diffMulti * catXpMulti);
          const difficultyPoints = (difficulty === "dificil" || difficulty === "legendario") ? 2 : 1;

          // Uncomplete mission
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === id ? { ...m, completed: false, completedAt: undefined, progress: 0 } : m
            ),
          }));

          // Subtract XP
          if (finalXp > 0) {
            get().subtractXp(finalXp);
          }

          // Subtract coins (floor at 0)
          const newCoins = Math.max(0, get().availableCoins - coins);

          // Remove daily activity entry
          const today = new Date().toISOString().slice(0, 10);
          const latestDaily = get().dailyActivity;
          const existingDayIdx = latestDaily.findIndex(
            (d) => d.date === today && d.category === mission.category
          );
          let newDailyActivity2 = [...latestDaily];
          if (existingDayIdx >= 0) {
            const updated = {
              ...newDailyActivity2[existingDayIdx],
              missionsCompleted: Math.max(0, newDailyActivity2[existingDayIdx].missionsCompleted - 1),
              weightedPoints: Math.max(0, newDailyActivity2[existingDayIdx].weightedPoints - difficultyPoints),
            };
            // Remove entry if no missions completed left
            if (updated.missionsCompleted === 0 && updated.weightedPoints === 0) {
              newDailyActivity2.splice(existingDayIdx, 1);
            } else {
              newDailyActivity2[existingDayIdx] = updated;
            }
          }

          set({
            availableCoins: newCoins,
            dailyActivity: newDailyActivity2,
          });
          return;
        }

        // Complete mission
        const difficulty = mission.difficulty;
        const diffMulti = DIFFICULTY_MULTIPLIER[difficulty];
        const catXpMulti = CATEGORY_XP_MULTI[mission.category] ?? 1;
        const catCoinMulti = CATEGORY_COIN_MULTI[mission.category] ?? 1;
        const coins = Math.round(DIFFICULTY_COINS[difficulty] * catCoinMulti);
        const finalXp = Math.round(mission.xpReward * diffMulti * catXpMulti);
        const difficultyPoints = (difficulty === "dificil" || difficulty === "legendario") ? 2 : 1;

        // Update mission
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === id ? { ...m, completed: true, completedAt: new Date().toISOString(), progress: 100 } : m
          ),
        }));

        // Add XP (category multiplier applied, radar chart still updates via addXp)
        if (finalXp > 0) {
          get().addXp(finalXp, mission.category);
        }

        // Add coins
        const notifications = [...get().pendingNotifications];
        if (coins > 0) {
          notifications.push({
            id: generateId(),
            type: "coin",
            value: coins,
            timestamp: Date.now(),
          });
        }

        // Log daily activity for mission completion
        const today = new Date().toISOString().slice(0, 10);
        const latestDaily = get().dailyActivity; // use latest (includes addXp update)
        const existingDayIdx = latestDaily.findIndex(
          (d) => d.date === today && d.category === mission.category
        );
        let newDailyActivity2: DailyActivity[];
        if (existingDayIdx >= 0) {
          newDailyActivity2 = [...latestDaily];
          newDailyActivity2[existingDayIdx] = {
            ...newDailyActivity2[existingDayIdx],
            missionsCompleted: newDailyActivity2[existingDayIdx].missionsCompleted + 1,
            weightedPoints: newDailyActivity2[existingDayIdx].weightedPoints + difficultyPoints,
          };
        } else {
          newDailyActivity2 = [
            ...latestDaily,
            { date: today, category: mission.category, xpEarned: 0, missionsCompleted: 1, weightedPoints: difficultyPoints },
          ];
        }

        set({
          availableCoins: state.availableCoins + coins,
          pendingNotifications: notifications,
          dailyActivity: newDailyActivity2,
        });
      },

      deleteMission: (id) => {
        set((s) => ({
          missions: s.missions.filter((m) => m.id !== id),
          activeMissionId: s.activeMissionId === id ? null : s.activeMissionId,
        }));
      },

      reorderMission: (activeId, overId) => {
        if (activeId === overId) return;
        set((s) => {
          const oldIndex = s.missions.findIndex((m) => m.id === activeId);
          const newIndex = s.missions.findIndex((m) => m.id === overId);
          if (oldIndex === -1 || newIndex === -1) return s;
          const updated = [...s.missions];
          const [moved] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, moved);
          return { missions: updated };
        });
      },

      updateMissionProgress: (id, progress) => {
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === id ? { ...m, progress: Math.min(100, Math.max(0, progress)) } : m
          ),
        }));
      },

      toggleSubtask: (missionId, subtaskId) => {
        set((s) => ({
          missions: s.missions.map((m) => {
            if (m.id !== missionId || m.completed) return m;
            const subtasks = m.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            const completedCount = subtasks.filter((st) => st.completed).length;
            const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : m.progress;
            return { ...m, subtasks, progress };
          }),
        }));
      },

      createReward: (rewardData) => {
        const reward: Reward = {
          ...rewardData,
          id: generateId(),
        };
        set((s) => ({ rewards: [reward, ...s.rewards] }));
      },

      redeemReward: (id) => {
        const state = get();
        const reward = state.rewards.find((r) => r.id === id);
        if (!reward) return;
        if (state.availableCoins < reward.cost) return;

        set({
          availableCoins: state.availableCoins - reward.cost,
          redeemedRewards: [...state.redeemedRewards, { id, redeemedAt: new Date().toISOString() }],
        });
      },

      removeRedeemedReward: (index) => {
        set((s) => ({
          redeemedRewards: s.redeemedRewards.filter((_, i) => i !== index),
        }));
      },

      deleteReward: (id) => {
        set((s) => ({
          rewards: s.rewards.filter((r) => r.id !== id),
        }));
      },

      setMode: (mode) => set({ currentMode: mode }),

      setAestheticTheme: (theme) => set({ aestheticTheme: theme }),

      setPlayerName: (name) => set({ playerName: name }),

      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

      consumeNotification: (id) => {
        set((s) => ({
          pendingNotifications: s.pendingNotifications.filter((n) => n.id !== id),
        }));
      },

      subtractXp: (amount) => {
        const state = get();
        let newXp = Math.max(0, state.xp - amount);
        let newLevel = state.level;
        let newXpToNext = state.xpToNextLevel;
        let newTotalXp = Math.max(0, state.totalXpEarned - amount);

        // If XP goes negative, drop a level
        while (newXp < 0 && newLevel > 0) {
          newLevel--;
          newXpToNext = xpForLevel(newLevel);
          newXp += newXpToNext;
        }
        if (newLevel < 0) newLevel = 0;
        newXp = Math.max(0, newXp);
        newXpToNext = xpForLevel(newLevel);

        set({
          xp: newXp,
          level: newLevel,
          xpToNextLevel: newXpToNext,
          totalXpEarned: newTotalXp,
        });
      },

      setLevel: (targetLevel) => {
        const newLevel = Math.max(0, targetLevel);
        set({
          level: newLevel,
          xp: 0,
          xpToNextLevel: xpForLevel(newLevel),
        });
      },

      resetAll: () => {
        set({
          level: 0,
          xp: 0,
          xpToNextLevel: 100,
          totalXpEarned: 0,
          stats: { ...defaultStats },
          missions: [],
          activeMissionId: null,
          rewards: [],
          redeemedRewards: [],
          availableCoins: 0,
          pendingNotifications: [],
          dailyActivity: [],
          // diaryEntries NOT reset — preserved across resets
          character: { avatar: "", age: "", backstory: "", specialty: "", base: "", motivation: "", trait: "", emblem: "" },
          selectedClass: null,
          playerName: "",
          weeklyDealSeed: Math.floor(Math.random() * 100000),
          resetVersion: get().resetVersion + 1,
        });
      },

      setSelectedClass: (id) => {
        set({ selectedClass: id });
      },

      addDiaryEntry: (text) => {
        const entry: DiaryEntry = {
          id: generateId(),
          date: new Date().toISOString(),
          text,
        };
        set((s) => ({ diaryEntries: [entry, ...s.diaryEntries] }));
      },

      deleteDiaryEntry: (id) => {
        set((s) => ({
          diaryEntries: s.diaryEntries.filter((e) => e.id !== id),
        }));
      },

      clearAllDiaryEntries: () => {
        set({ diaryEntries: [] });
      },

      addCompany: (company) => {
        const newCompany: Company = {
          ...company,
          id: generateId(),
          acciones: [],
        };
        set((s) => ({ companies: [newCompany, ...s.companies] }));
      },

      updateCompany: (id, data) => {
        set((s) => ({
          companies: s.companies.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteCompany: (id) => {
        set((s) => ({
          companies: s.companies.filter((c) => c.id !== id),
        }));
      },

      addCompanyAction: (companyId, text) => {
        const action: CompanyAction = {
          id: generateId(),
          date: new Date().toISOString(),
          text,
        };
        const today = new Date().toISOString().slice(0, 10);
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  ultimoMovimiento: today,
                  acciones: [action, ...c.acciones],
                  // Auto-set primer contacto if empty
                  fechaPrimerContacto: c.fechaPrimerContacto || today,
                }
              : c
          ),
        }));
      },

      clearAllCompanies: () => {
        set({ companies: [] });
      },

      updateCharacter: (data) => {
        set((s) => ({
          character: { ...s.character, ...data },
        }));
      },

      getDailyScores: () => {
        const state = get();
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        // Fall back chain for "previous day" (for carryover calculation)
        let prevDate = yesterdayStr;
        if (!state.dailyActivity.some((d) => d.date === yesterdayStr)) {
          const dates = [...new Set(state.dailyActivity.map((d) => d.date))].sort();
          prevDate = dates.length > 0 ? dates[dates.length - 1] : yesterdayStr;
        }

        const prevData = state.dailyActivity.filter((d) => d.date === prevDate);
        const todayData = state.dailyActivity.filter((d) => d.date === today);

        // 1 mission = 1 point, max 10 per category
        // Carryover from previous day: floor(prevScore / 5), max 2
        // e.g. 5-9 yesterday → +1 today, 10 yesterday → +2 today
        // Class bonus: if class stat >= 5, +1 to carryover (very light)

        const classData = getClassData(state.selectedClass);

        const result = {} as Record<keyof Stats, { score: number; xp: number; missions: number }>;
        const allKeys: (keyof Stats)[] = ["trabajo", "oposicion", "salud", "asociacion", "ocio"];
        for (const key of allKeys) {
          const prevEntry = prevData.find((d) => d.category === key);
          const prevMissions = prevEntry?.missionsCompleted ?? 0;
          let carryover = Math.min(2, Math.floor(prevMissions / 5));

          // Class base bonus: class stat value (0-9) scaled to 0-2 base points
          const classBase = classData ? Math.round(classData.stats[key] / 5) : 0;

          const todayEntry = todayData.find((d) => d.category === key);
          const todayMissions = todayEntry?.missionsCompleted ?? 0;

          const score = Math.min(10, carryover + classBase + todayMissions);
          const xp = (prevEntry?.xpEarned ?? 0) + (todayEntry?.xpEarned ?? 0);
          result[key] = { score, xp, missions: todayMissions, carryover, classBase };
        }
        return result;
      },
    }),
    {
      name: "xfiles-game-storage",
      version: 6,
      migrate: (persisted: any, version: number) => {
        // v6: Validate aestheticTheme (default to xfiles if invalid)
        if (persisted.aestheticTheme !== "xfiles" && persisted.aestheticTheme !== "renaissance") {
          persisted.aestheticTheme = "xfiles";
        }
        // Migrate redeemedRewards from string[] to {id, redeemedAt}[]
        if (Array.isArray(persisted.redeemedRewards)) {
          persisted.redeemedRewards = persisted.redeemedRewards.map((r: any) =>
            typeof r === "string" ? { id: r, redeemedAt: new Date().toISOString() } : r
          );
        }
        // Clean orphan/invalid missions
        if (Array.isArray(persisted.missions)) {
          persisted.missions = persisted.missions.filter(
            (m: any) => {
              // Completed missions are fine
              if (m.completed) return true;
              // Must have valid missionType
              if (m.missionType !== "deadline" && m.missionType !== "habit") return false;
              // Deadline missions must have a deadline date
              if (m.missionType === "deadline" && !m.deadline) return false;
              return true;
            }
          );
        }
        if (version === 1 && Array.isArray(persisted.companies)) {
          // Add new sample companies only if they don't already exist
          const existingIds = new Set(persisted.companies.map((c: any) => c.id));
          const newSamples = [
            {
              id: "crm-sample-5",
              empresa: "NeoBank Digital",
              estado: "En proceso",
              canal: "LinkedIn",
              contacto: "Ana Beltrán",
              emailContacto: "ana.beltran@neobank.es",
              urlOferta: "https://linkedin.com/jobs/view/9876",
              fechaPrimerContacto: "2026-04-10",
              ultimoMovimiento: "2026-05-04",
              notas: "Fintech en expansión. Buscan frontend developer con experiencia en React Native y TypeScript. Proceso con 3 fases.",
              acciones: [
                { id: "act-9", date: "2026-04-10T08:45:00.000Z", text: "Candidatura enviada por LinkedIn" },
                { id: "act-10", date: "2026-04-18T10:00:00.000Z", text: "Test técnico online (React + API)" },
                { id: "act-11", date: "2026-04-28T15:30:00.000Z", text: "Primera entrevista con tech lead" },
                { id: "act-12", date: "2026-05-04T11:00:00.000Z", text: "Segunda entrevista con VP of Engineering" },
              ],
            },
            {
              id: "crm-sample-6",
              empresa: "Global Logistics S.A.",
              estado: "Descartada",
              canal: "InfoJobs",
              contacto: "RRHH",
              emailContacto: "Seleccion@globallogistics.com",
              urlOferta: "https://www.infojobs.net/oferta/3456",
              fechaPrimerContacto: "2026-04-05",
              ultimoMovimiento: "2026-04-20",
              notas: "Empresa logística. Oferta para mantenedor de sistemas internos. Descartada: salarial por debajo de expectativas y sin opción remoto.",
              acciones: [
                { id: "act-13", date: "2026-04-05T09:30:00.000Z", text: "Aplicación enviada" },
                { id: "act-14", date: "2026-04-12T11:00:00.000Z", text: "Entrevista telefónica inicial" },
                { id: "act-15", date: "2026-04-20T14:00:00.000Z", text: "Descartada tras recibir detalles de condiciones" },
              ],
            },
            {
              id: "crm-sample-7",
              empresa: "CloudBridge Systems",
              estado: "Oferta recibida",
              canal: "Referencia",
              contacto: "Pedro Jiménez",
              emailContacto: "pedro.jimenez@cloudbridge.io",
              urlOferta: "",
              fechaPrimerContacto: "2026-03-28",
              ultimoMovimiento: "2026-05-06",
              notas: "Empresa de infraestructura cloud. Contacto por referencia de ex-compañero. Oferta recibida: 42k + beneficios. Pendiente de respuesta.",
              acciones: [
                { id: "act-16", date: "2026-03-28T12:00:00.000Z", text: "Contacto vía referencia de David (ex-colega)" },
                { id: "act-17", date: "2026-04-05T10:00:00.000Z", text: "Café informal con Pedro (CTO)" },
                { id: "act-18", date: "2026-04-15T09:30:00.000Z", text: "Entrevista técnica: diseño de microservicios" },
                { id: "act-19", date: "2026-04-25T16:00:00.000Z", text: "Entrevista final con CEO" },
                { id: "act-20", date: "2026-05-06T10:00:00.000Z", text: "Oferta formal recibida por email" },
              ],
            },
            {
              id: "crm-sample-8",
              empresa: "MediaPixel Agency",
              estado: "Para seguimiento",
              canal: "Web propia",
              contacto: "Sofía Navarro",
              emailContacto: "sofia@mediaPixel.es",
              urlOferta: "https://mediapixel.es/trabaja-con-nosotros",
              fechaPrimerContacto: "2026-04-22",
              ultimoMovimiento: "2026-04-30",
              notas: "Agencia digital creativa. Buscan desarrollador web full-stack. Proyecto interesante pero esperan respuesta de cliente final para confirmar posición.",
              acciones: [
                { id: "act-21", date: "2026-04-22T09:00:00.000Z", text: "CV enviado a careers@mediapixel.es" },
                { id: "act-22", date: "2026-04-30T17:30:00.000Z", text: "RRHH avisa que el proceso está pausado hasta confirmar proyecto" },
              ],
            },
          ];
          for (const sample of newSamples) {
            if (!existingIds.has(sample.id)) {
              persisted.companies.push(sample);
            }
          }
        }
        return persisted;
      },
    }
  )
);
