import type { AestheticTheme } from "./theme-config";

export interface ThemeTexts {
  // ─── LAYOUT ───
  headerTitle: string;
  headerSubtitle: string;
  footerLeft: string;
  footerRight: string;
  loadingText: string;

  // ─── RANKS (rank-system.ts) ───
  ranks: { level: number; name: string }[];

  // ─── ORACLE RANKS (deprecated — not used) ───
  oracleRanks: { min: number; name: string }[];

  // ─── REWARDS (game-store.ts) ───
  rewards: { name: string; description: string; cost: number; icon: string }[];

  // ─── AGENT CLASSES (game-store.ts) ───
  classes: { id: string; name: string; role: string; icon: string; description: string; stats: { trabajo: number; oposicion: number; salud: number; asociacion: number; ocio: number } }[];

  // ─── ORACLE D20 MESSAGES ───
  oracle: {
    trabajo: Record<number, string>;
    oposicion: Record<number, string>;
    salud: Record<number, string>;
    asociacion: Record<number, string>;
    ocio: Record<number, string>;
    generic: Record<number, string>;
    critico: string;
    pifia: string;
  };

  // ─── CARDS & DIALOGS ───
  profileTitle: string;
  agentSheet: string;
  agentClass: string;
  agentBase: string;
  agentHistory: string;
  defaultName: string;
  missionsTitle: string;
  missionsSubtitle: string;
  newMission: string;
  missionType: string;
  editMission: string;
  emptyMissions: string;
  shopTitle: string;
  shopSubtitle: string;
  newReward: string;
  quickTemplate: string;
  weeklyOffer: string;
  diaryTitle: string;
  diarySubtitle: string;
  diaryArchive: string;
  diaryEmpty: string;
  crmTitle: string;
  crmFallback: string;
  oracleTitle: string;
  settingsTitle: string;
  dangerZone: string;
  levelUpTitle: string;
  newRankTitle: string;
  levelUpFlavor: string;
}

export const THEME_TEXTS: Record<AestheticTheme, ThemeTexts> = {
  // ═══════════════════════════════════════════
  // X-FILES THEME
  // ═══════════════════════════════════════════
  xfiles: {
    headerTitle: "Sendas",
    headerSubtitle: "TRUST NO ONE",
    footerLeft: "CLASIFICADO // ACCESO RESTRINGIDO",
    footerRight: "LA VERDAD ESTÁ AHÍ FUERA",
    loadingText: "INICIALIZANDO SISTEMA",

    ranks: [
      { level: 0, name: "Recluta Spooky" },
      { level: 1, name: "El Gran Mutato" },
      { level: 4, name: "Clyde Bruckman" },
      { level: 8, name: "Eugene Victor Tooms" },
      { level: 13, name: "Flukeman" },
      { level: 18, name: "Marita Covarrubias" },
      { level: 24, name: "Mónica Reyes" },
      { level: 30, name: "Pistolero Solitario" },
      { level: 37, name: "John Doggett" },
      { level: 44, name: "Alex Krycek" },
      { level: 52, name: "Walter Skinner" },
      { level: 60, name: "Garganta Profunda" },
      { level: 70, name: "El Fumador" },
    ],

    oracleRanks: [
      { min: 0, name: "Novato" },
      { min: 10, name: "Agente Cadete" },
      { min: 20, name: "Agente de Campo" },
      { min: 30, name: "Agente Especial" },
      { min: 40, name: "Agente Senior" },
      { min: 46, name: "Leyenda Viva" },
    ],

    rewards: [
      { name: "Expediente cerrado", description: "Ignorar una pequeña obligación", cost: 5, icon: "FolderCheck" },
      { name: "Un café con el fumador", description: "Charla relajada sin prisas", cost: 10, icon: "Coffee" },
      { name: "Video VHS de los expedientes", description: "Maratón de un episodio", cost: 15, icon: "Film" },
      { name: "Paseo por Twin Peaks", description: "Desconexión total en la naturaleza", cost: 25, icon: "Trees" },
      { name: "Madriguera del Pistolero", description: "Noche de pizza, cerveza y teorías locas", cost: 25, icon: "Beer" },
      { name: "Avistamiento confirmado", description: "Salida a un sitio especial (cine, concierto)", cost: 35, icon: "Compass" },
      { name: "Log Lady", description: "Día de introspección y autocuidado", cost: 40, icon: "Eye" },
      { name: "Transmisión del Pistolero Solitario", description: "Tarde de hobbies creativos", cost: 45, icon: "Radio" },
      { name: "Abducción", description: "Escapada de fin de semana (pequeña)", cost: 60, icon: "Rocket" },
    ],

    classes: [
      { id: "spooky", name: "Agente Spooky", role: "DPS", icon: "🔦", description: "Fuerza y acción directa. No se detiene ante nada.", stats: { trabajo: 7, oposicion: 3, salud: 5, asociacion: 2, ocio: 3 } },
      { id: "doctora", name: "Doctora en Medicina", role: "Mente", icon: "🔬", description: "Inteligencia y análisis. La ciencia como arma.", stats: { trabajo: 2, oposicion: 7, salud: 3, asociacion: 4, ocio: 4 } },
      { id: "informante", name: "Informante Conspiranoico", role: "Control", icon: "📡", description: "Contactos y astucia social. Sabe más de lo que dice.", stats: { trabajo: 3, oposicion: 4, salud: 2, asociacion: 7, ocio: 4 } },
      { id: "subdirector", name: "Subdirector del FBI", role: "Tanque", icon: "🏛️", description: "Resistencia y supervivencia. Imparable.", stats: { trabajo: 4, oposicion: 3, salud: 9, asociacion: 2, ocio: 2 } },
      { id: "agente_doble", name: "Agente Doble", role: "Equilibrado", icon: "🎭", description: "Adaptable en todas las áreas. No hay debilidad.", stats: { trabajo: 4, oposicion: 4, salud: 4, asociacion: 4, ocio: 4 } },
    ],

    oracle: {
      trabajo: {
        2: "Tu último informe ha desaparecido, no dejes que ganen.",
        6: "Expediente cerrado en seco. Medita y vuelve al trabajo.",
        12: "Skinner te pide que pares. No le hagas caso.",
        18: "Skinner te respalda. Al menos algo sale bien.",
        24: "Informe terminado. Puedes echarte un poco en el sofá.",
        28: "Caso cerrado. ¿Tomamos algo después del trabajo?",
      },
      oposicion: {
        2: "Krycek te robó las notas. Desastre.",
        6: "Lo siento, pero tienes que realizar otra autopsia.",
        12: "Día de fotocopias. Repasa y punto.",
        18: "Tómate un helado light y confía.",
        24: "Puedes tomártelo con calma, la información era buena.",
        28: "Sabes todo lo que hay que saber.",
      },
      salud: {
        2: "Te pareces a Flukeman. Haz algo.",
        6: "Cuerpo de fumador. Empieza por una ducha.",
        12: "Día de archivo. Te mueves por la oficina.",
        18: "Juegas al baloncesto y no eres el peor.",
        24: "Comer sano y moverte te hace feliz.",
        28: "Skinner te enseña su rutina de entrenamientos.",
      },
      asociacion: {
        2: "El Sindicato te ha enterrado papeleo. Tienes que currar.",
        6: "Reunión con Kersh. Da la cara.",
        12: "Toca hacer algunas llamadas.",
        18: "Visitas la cafetería y te sientes rodeado de tus semejantes.",
        24: "Mulder se encarga. Disfruta de la oficina vacía.",
        28: "Garganta Profunda te cubre y puedes dedicarte tiempo por fin.",
      },
      ocio: {
        2: "Caso sin resolver. No es momento de descansar.",
        6: "Buscas un café y que te de el aire.",
        12: "Una siesta en la silla sin que se de cuenta nadie.",
        18: "Cerveza con el Pistolero.",
        24: "Expediente cerrado. El sofá es muy cómodo.",
        28: "Abducido.",
      },
      generic: {
        28: "Suerte máxima.",
        24: "Día excelente.",
        18: "Buen día.",
        12: "Normal.",
        6: "Día flojo.",
        2: "Toca machacar.",
      },
      critico: "CRÍTICO!",
      pifia: "PIFIA!",
    },

    profileTitle: "Perfil del Agente",
    agentSheet: "FICHA DEL AGENTE",
    agentClass: "CLASE DEL AGENTE",
    agentBase: "BASE DE OPERACIONES",
    agentHistory: "HISTORIA DEL PERSONAJE",
    defaultName: "Agente X",
    missionsTitle: "Misiones Activas",
    missionsSubtitle: "OPERACIONES PENDIENTES — PRIORIDAD MÁXIMA",
    newMission: "NUEVA MISIÓN",
    missionType: "TIPO DE MISIÓN",
    editMission: "EDITAR MISIÓN",
    emptyMissions: "Sin misiones. Crea una nueva misión para comenzar.",
    shopTitle: "Mercado Negro",
    shopSubtitle: "RECOMPENSAS DISPONIBLES — INTERCAMBIO CLANDESTINO",
    newReward: "NUEVA RECOMPENSA",
    quickTemplate: "PLANTILLA RÁPIDA",
    weeklyOffer: "Oferta Semanal",
    diaryTitle: "Diario de Campo",
    diarySubtitle: "NOTAS PERSONALES — CLASIFICADO",
    diaryArchive: "Archivo de Campo",
    diaryEmpty: "SIN REGISTROS",
    crmTitle: "Base de Datos — Búsqueda de Empleo",
    crmFallback: "Expediente",
    oracleTitle: "Oráculo D20",
    settingsTitle: "CONFIGURACIÓN DEL AGENTE",
    dangerZone: "Zona de Peligro",
    levelUpTitle: "Nivel Alcanzado",
    newRankTitle: "Nuevo Rango Desbloqueado",
    levelUpFlavor: "Sigue así, agente. La verdad está ahí fuera.",
  },

  // ═══════════════════════════════════════════
  // RENACIMIENTO THEME
  // ═══════════════════════════════════════════
  renaissance: {
    headerTitle: "Sendas",
    headerSubtitle: "NEL MEZZO DEL CAMMIN",
    footerLeft: "RESERVADO // SOLO PARA EL PEREGRINO",
    footerRight: "INCIPIT VITA NOVA",
    loadingText: "INICIANDO EL VIAJE",

    ranks: [
      { level: 0, name: "Caronte" },
      { level: 1, name: "Ugolino" },
      { level: 4, name: "Ulisse" },
      { level: 8, name: "Francesca da Rimini" },
      { level: 13, name: "Farinata" },
      { level: 18, name: "Brunetto Latini" },
      { level: 24, name: "Virgilio" },
      { level: 30, name: "Catone" },
      { level: 37, name: "Matelda" },
      { level: 44, name: "Piccarda Donati" },
      { level: 52, name: "San Francesco" },
      { level: 60, name: "San Bernardo" },
      { level: 70, name: "Beatrice" },
    ],

    oracleRanks: [
      { min: 0, name: "Novato" },
      { min: 10, name: "Agente Cadete" },
      { min: 20, name: "Agente de Campo" },
      { min: 30, name: "Agente Especial" },
      { min: 40, name: "Agente Senior" },
      { min: 46, name: "Leyenda Viva" },
    ],

    rewards: [
      { name: "Gracia menor", description: "Ignorar una pequeña obligación", cost: 5, icon: "FolderCheck" },
      { name: "Charla sin prisas", description: "Conversación relajada sin agenda", cost: 10, icon: "Coffee" },
      { name: "Lectura del Limbo", description: "Maratón de un episodio", cost: 15, icon: "Film" },
      { name: "Pellegrinaggio al Purgatorio", description: "Desconexión total en la naturaleza", cost: 25, icon: "Trees" },
      { name: "Noche en la Taberna", description: "Noche de pizza, cerveza y planes descabellados", cost: 25, icon: "Beer" },
      { name: "Visión del Paraíso", description: "Salida a un sitio especial (cine, concierto)", cost: 35, icon: "Compass" },
      { name: "Día de Contemplación", description: "Día de introspección y autocuidado", cost: 40, icon: "Eye" },
      { name: "Tarde Creativa", description: "Tarde de hobbies y creación", cost: 45, icon: "Radio" },
      { name: "Grazia Stagionale", description: "Escapada de fin de semana", cost: 60, icon: "Rocket" },
    ],

    classes: [
      { id: "spooky", name: "El Poeta en Armas", role: "DPS", icon: "🔥", description: "Fuerza y acción directa. No se detiene ante nada.", stats: { trabajo: 7, oposicion: 3, salud: 5, asociacion: 2, ocio: 3 } },
      { id: "doctora", name: "El Escolástico", role: "Mente", icon: "📜", description: "Inteligencia y análisis. La razón como arma.", stats: { trabajo: 2, oposicion: 7, salud: 3, asociacion: 4, ocio: 4 } },
      { id: "informante", name: "El Cortesano", role: "Control", icon: "📜", description: "Contactos y astucia social. Sabe más de lo que dice.", stats: { trabajo: 3, oposicion: 4, salud: 2, asociacion: 7, ocio: 4 } },
      { id: "subdirector", name: "El Guardián", role: "Tanque", icon: "🏰", description: "Resistencia y supervivencia. Imparable.", stats: { trabajo: 4, oposicion: 3, salud: 9, asociacion: 2, ocio: 2 } },
      { id: "agente_doble", name: "El Peregrino", role: "Equilibrado", icon: "🎭", description: "Adaptable en todas las áreas. Sin punto débil.", stats: { trabajo: 4, oposicion: 4, salud: 4, asociacion: 4, ocio: 4 } },
    ],

    oracle: {
      trabajo: {
        2: "Sigue en movimiento, las fieras acechan.",
        6: "El camino se ha cortado. Respira y retoma la marcha.",
        12: "Alguien te dice que ya es suficiente. No lo es todavía.",
        18: "Tienes apoyo hoy. Aprovéchalo bien.",
        24: "Tarea terminada. El descanso está ganado.",
        28: "Jornada cerrada. El festín de esta noche es tuyo.",
      },
      oposicion: {
        2: "Tus notas se han extraviado. Empieza desde el principio.",
        6: "Hay que volver a repasar el material. Paciencia.",
        12: "No te fies, repasa con humildad.",
        18: "Confía en el proceso y date un capricho pequeño.",
        24: "El material era sólido. Puedes ir despacio.",
        28: "Dominas la materia. El ascenso es tuyo.",
      },
      salud: {
        2: "Llevas demasiado tiempo inmóvil. Es ahora o nunca.",
        6: "El cuerpo pide atención. Empieza por lo básico.",
        12: "Día tranquilo. Al menos has salido de la silla.",
        18: "Te has movido con gusto hoy. Buen signo.",
        24: "Cuerpo y alma alineados. Sigue así.",
        28: "Hoy eres ejemplo para ti mismo.",
      },
      asociacion: {
        2: "Florencia arde. Toca dar la cara.",
        6: "Reunión inevitable. Preséntate y aguanta.",
        12: "Toca mandar algunas cartas.",
        18: "Un rato entre personas conocidas. Más reconfortante de lo esperado.",
        24: "Otro lleva el peso hoy. Disfruta del silencio.",
        28: "Todo en orden. Por fin tiempo para ti.",
      },
      ocio: {
        2: "Demasiado pendiente. El descanso puede esperar.",
        6: "Un poco de aire fresco. Algo es algo.",
        12: "Una pausa breve que nadie ha visto. Cuenta.",
        18: "Buena compañía esta tarde.",
        24: "El día ha terminado bien. El sofá lo confirma.",
        28: "Desaparecido del mundo. Perfecto.",
      },
      generic: {
        28: "Suerte máxima.",
        24: "Día excelente.",
        18: "Buen día.",
        12: "Normal.",
        6: "Día flojo.",
        2: "Toca resistir.",
      },
      critico: "GRAZIA DIVINA!",
      pifia: "CAÍDA AL FOSO!",
    },

    profileTitle: "Perfil del Peregrino",
    agentSheet: "FICHA DEL PEREGRINO",
    agentClass: "NATURALEZA DEL ALMA",
    agentBase: "LUGAR DEL CAMINO",
    agentHistory: "HISTORIA DEL PEREGRINO",
    defaultName: "Peregrino",
    missionsTitle: "Misiones del Camino",
    missionsSubtitle: "PRUEBAS EN CURSO — DIRECCIÓN CLARA",
    newMission: "NUEVA PRUEBA",
    missionType: "TIPO DE PRUEBA",
    editMission: "EDITAR PRUEBA",
    emptyMissions: "El camino está despejado. Añade una prueba para empezar a andar.",
    shopTitle: "Loggia dei Penitenti",
    shopSubtitle: "GRACIAS DISPONIBLES — INTERCAMBIO PENITENCIAL",
    newReward: "NUEVA GRACIA",
    quickTemplate: "PLANTILLA RÁPIDA",
    weeklyOffer: "Grazia Stagionale",
    diaryTitle: "Libro della Memoria",
    diarySubtitle: "NOTAS PERSONALES — RESERVADO",
    diaryArchive: "Archivo del Peregrino",
    diaryEmpty: "SIN ENTRADAS AÚN",
    crmTitle: "Base de Datos — Búsqueda de Empleo",
    crmFallback: "Expediente",
    oracleTitle: "Virgilio",
    settingsTitle: "CONFIGURACIÓN DEL PEREGRINO",
    dangerZone: "Zona de Peligro",
    levelUpTitle: "Nuevo Canto Superado",
    newRankTitle: "Nuevo Rango Desbloqueado",
    levelUpFlavor: "La vía estaba perdida pero reconoces la dirección.",
  },
};
