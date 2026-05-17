# Sendas

**Gamification system for job hunting and competitive exam preparation.**

Sendas transforms job searching and civil service exam preparation into an engaging RPG experience. Track missions, organize study sessions, manage company contacts, and keep a field diary — all within two immersive visual themes you can switch between at any time.

---

## Visual Themes

Sendas offers two complete aesthetic identities that transform the entire interface:

### X-Files
Dark interface inspired by classified government dossiers and paranormal investigations. Neon accents, CRT scanline overlay, monospace typography, and a cyberpunk atmosphere that makes you feel like you're uncovering hidden truths about the job market.

### Renaissance
Elegant dark interface inspired by Quattrocento Italy. Warm earth pigments, serif typography (EB Garamond, Playfair Display, Crimson Text), subtle marble texture, and muted tones. No neon, no glassmorphism — just quiet, restrained beauty. Both themes adapt dynamically to the 4 game modes, changing accent colors, backgrounds, and text tones.

---

## Game Modes

Each mode changes the color palette and mood of the entire interface:

| Mode | Purpose | X-Files Accent | Renaissance Accent |
|------|---------|---------------|-------------------|
| Neutral | General overview & planning | Gold | Warm amber |
| Study | Deep work sessions | Blue | Deep amber |
| Search | Active job hunting | Green | Golden terracotta |
| Rest | Recovery & leisure | Purple | Olive green |

---

## Panels

### Study Panel (Core)
The heart of Sendas. Designed specifically for civil service exam preparation (oposiciones) and structured study:

- **Study sessions tracker** — Log hours, track streaks, and monitor consistency over time
- **Exam type management** — Organize by opposition type (civil service, technical, language certifications)
- **Study materials** — Link resources, notes, and references per topic
- **Progress indicators** — Visual bars and stats showing study volume over time
- **Subject organization** — Group study topics by category and priority
- **Editable operations** — Create, edit and delete study entries with full form validation

### Mission Board
Drag-and-drop task management system:
- Create missions with difficulty levels (Facil, Medio, Dificil, Legendario)
- Categorize: job applications, interviews, networking, admin tasks
- XP rewards scaled by difficulty
- Deadline tracking and completion history

### CRM Panel
Company and contact management for job hunting:
- Company profiles with notes
- Application status tracking
- Contact history per company
- Quick stats on active applications

### Field Diary
Personal journal that adapts its visual style to the active theme and game mode. Write reflections, track mood, and maintain a chronological record of your journey.

### Character Profile
Radar chart displaying 5 core stats: Trabajo (Work), Estudio (Study), Salud (Health), Voluntariado (Volunteering), Ocio (Leisure). Level up by completing missions and study sessions.

### Daily Oracle
Random daily quest generator that assigns productive activities across your stats, with health penalties for consecutive inactive days.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL via Prisma ORM |
| State | Zustand + localStorage |
| Charts | Recharts |
| DnD | @dnd-kit |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
git clone https://github.com/kefirkefirkefir/sendas-app.git
cd sendas-app
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma db push
npm run dev
```

Available at `http://localhost:3000`.

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Go to **Storage → Create Database → Postgres**
4. Vercel auto-configures `DATABASE_URL`
5. Deploy

---

## Project Structure

```
sendas-app/
├── src/
│   ├── app/
│   │   ├── globals.css          # Theme definitions, X-Files & Renaissance styles
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── xfiles/
│   │   │   ├── StudyPanel.tsx   # Study sessions & exam tracking (core panel)
│   │   │   ├── MissionPanel.tsx # Task management with DnD
│   │   │   ├── CrmPanel.tsx     # Company CRM
│   │   │   ├── DiaryPanel.tsx   # Field journal
│   │   │   ├── RadarStats.tsx   # Radar skill chart
│   │   │   ├── DailyOracle.tsx  # Daily quest generator
│   │   │   └── CharacterProfile.tsx
│   │   └── ui/                  # shadcn/ui components
│   ├── config/
│   │   ├── theme-config.tsx     # Theme registry & mode colors
│   │   └── theme-texts.ts       # Character classes per theme
│   ├── hooks/
│   │   └── use-mode-colors.ts   # Dynamic color system per mode/theme
│   ├── lib/
│   │   ├── db.ts                # Prisma client
│   │   └── game-store.ts        # Zustand state types
│   └── stores/
│       └── game-store.ts        # Game state, XP, levels, missions
├── prisma/schema.prisma
├── public/
├── .env.example
└── package.json
```

---

## License

GNU Affero General Public License v3.0 (AGPL-3.0) 
