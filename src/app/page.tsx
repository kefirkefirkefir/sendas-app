"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { useMounted } from "@/hooks/use-mounted";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Radar,
  Target,
  ShoppingBag,
  Eye,
  BookOpen,
} from "lucide-react";

import ParticleBackground from "@/components/xfiles/ParticleBackground";
import RadarStats from "@/components/xfiles/RadarStats";
import DiaryPanel from "@/components/xfiles/DiaryPanel";
import CharacterProfile from "@/components/xfiles/CharacterProfile";
import DailyOracle from "@/components/xfiles/DailyOracle";
import MissionPanel from "@/components/xfiles/MissionPanel";
import RewardShop from "@/components/xfiles/RewardShop";
import ModeSelector from "@/components/xfiles/ModeSelector";
import XpNotification from "@/components/xfiles/XpNotification";
import AudioControls from "@/components/xfiles/AudioControls";
import LevelUpModal from "@/components/xfiles/LevelUpModal";
import XFilesTheme from "@/components/xfiles/XFilesTheme";
import CrmPanel from "@/components/xfiles/CrmPanel";
import StudyPanel from "@/components/xfiles/StudyPanel";

export default function HomePage() {
  const { currentMode, totalXpEarned, availableCoins, missions } = useGameStore();
  const mounted = useMounted();
  const mc = useModeColors();
  const t = useThemeText();
  const [mobileTab, setMobileTab] = useState("misiones");

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        {/* CRT scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 2px)",
            backgroundSize: "100% 3px",
          }}
        />
        <div className="text-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-xs tracking-[0.3em]"
            style={{
              color: "#5a8a5a",
              textShadow: "0 0 6px rgba(90,138,90,0.5), 0 0 15px rgba(90,138,90,0.15)",
            }}
          >
            {t.loadingText}<span className="inline-block w-[6px] ml-0.5 align-middle bg-current animate-pulse" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <XFilesTheme>
      <div className="h-screen flex flex-col relative overflow-hidden">
        {/* Particle Background */}
        <ParticleBackground />

        {/* XP Notifications */}
        <XpNotification />

        {/* Level Up Modal */}
        <LevelUpModal />

        {/* Main content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header
            className="border-b backdrop-blur-md sticky top-0 z-40 transition-colors duration-700"
            style={{
              borderColor: `rgba(${mc.accentRgb},0.12)`,
              backgroundColor: mc.bg,
            }}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
              <div className="grid grid-cols-3 items-center">
                {/* Left: TRUST NO ONE */}
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `rgba(${mc.accentRgb},0.1)`, borderColor: `rgba(${mc.accentRgb},0.3)` }}>
                    <Eye className="w-6 h-6 drop-shadow-[0_0_4px_rgba(var(--mode-accent-rgb),0.3)]" style={{ color: mc.accent, filter: 'brightness(1.10)' }} />
                  </div>
                  <div>
                    <h1 className="font-mono text-[16px] font-bold tracking-wider text-flicker leading-none" style={{ color: mc.accent }}>
                      {t.headerTitle}
                    </h1>
                    <p className="font-mono text-[10px] text-[#4a5a4a] tracking-[0.2em]">
                      {t.headerSubtitle}
                    </p>
                  </div>
                </div>

                {/* Center: Operation modes */}
                <div className="flex justify-center">
                  <ModeSelector />
                </div>

                {/* Right: Study + Empresas + Sound */}
                <div className="flex items-center gap-2 justify-end">
                  <StudyPanel />
                  <CrmPanel />
                  <AudioControls />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 overflow-hidden">
            {/* Desktop: 3-column layout */}
            <div className="hidden lg:grid lg:grid-cols-[260px_1fr_340px] gap-4 sm:gap-5 h-full">
              {/* LEFT: Character + D20 (compact sidebar) */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CharacterProfile />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <DailyOracle />
                </motion.div>
              </div>

              {/* CENTER: Missions (main focus) */}
              <div className="flex flex-col gap-4 sm:gap-5 min-h-0 overflow-y-auto scroll-green pr-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="xfiles-card rounded-lg p-4 sm:p-5 min-h-0 flex flex-col flex-[7]"
                  style={{ borderColor: `rgba(${mc.accentRgb},0.2)` }}
                >
                  <MissionPanel />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="xfiles-card rounded-lg p-4 sm:p-5 min-h-0 flex flex-col flex-[3]"
                >
                  <RewardShop />
                </motion.div>
              </div>

              {/* RIGHT: Agent Profile + Radar Chart + Diary */}
              <div className="space-y-3 flex flex-col min-h-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="xfiles-card rounded-lg p-3 shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Radar className="w-4 h-4" style={{ color: mc.accent }} />
                    <h2 className="font-mono text-xs uppercase tracking-wider" style={{ color: mc.accent }}>
                      {t.profileTitle}
                    </h2>
                  </div>
                  <RadarStats />
                </motion.div>

                {/* Diary */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="xfiles-card rounded-lg p-4 sm:p-5 flex-1 min-h-0 flex flex-col"
                >
                  <DiaryPanel />
                </motion.div>
              </div>
            </div>

            {/* Mobile + Tablet: Tabbed layout */}
            <div className="lg:hidden h-full flex flex-col">
              <Tabs
                value={mobileTab}
                onValueChange={setMobileTab}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-4 mb-4 bg-[rgba(0,0,0,0.3)] border rounded-lg h-10" style={{ borderColor: `rgba(${mc.accentRgb},0.1)` }}>
                  <TabsTrigger
                    value="misiones"
                    className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-[rgba(var(--mode-accent-rgb),0.08)] data-[state=active]:text-[var(--mode-accent)]"
                  >
                    <Target className="w-3.5 h-3.5 mr-1" />
                    Misiones
                  </TabsTrigger>
                  <TabsTrigger
                    value="diario"
                    className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-[rgba(125,211,252,0.08)] data-[state=active]:text-[#7dd3fc]"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    Diario
                  </TabsTrigger>
                  <TabsTrigger
                    value="perfil"
                    className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-[rgba(var(--mode-accent-rgb),0.08)] data-[state=active]:text-[var(--mode-accent)]"
                  >
                    <Radar className="w-3.5 h-3.5 mr-1" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger
                    value="tienda"
                    className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-[rgba(251,191,36,0.08)] data-[state=active]:text-[#fbbf24]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    Tienda
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="diario" className="mt-0 flex-1 overflow-y-auto scroll-cyan">
                  <motion.div
                    key="diario"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="xfiles-card rounded-lg p-4 sm:p-5 border-[rgba(125,211,252,0.12)]"
                  >
                    <DiaryPanel />
                  </motion.div>
                </TabsContent>

                <TabsContent value="misiones" className="mt-0 flex-1 overflow-y-auto scroll-green">
                  <motion.div
                    key="misiones"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="xfiles-card rounded-lg p-4"
                  >
                    <MissionPanel />
                  </motion.div>
                </TabsContent>

                <TabsContent value="perfil" className="mt-0 flex-1 overflow-y-auto scroll-cyan">
                  <motion.div
                    key="perfil"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="xfiles-card rounded-lg p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Radar className="w-4 h-4" style={{ color: mc.accent }} />
                        <h2 className="font-mono text-xs uppercase tracking-wider" style={{ color: mc.accent }}>
                          {t.profileTitle}
                        </h2>
                      </div>
                      <RadarStats />
                    </div>
                    <CharacterProfile />
                    <DailyOracle />
                  </motion.div>
                </TabsContent>

                <TabsContent value="tienda" className="mt-0 flex-1 overflow-y-auto scroll-gold">
                  <motion.div
                    key="tienda"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="xfiles-card rounded-lg p-4"
                  >
                    <RewardShop />
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </main>

          {/* Footer */}
          <footer
            className="border-t backdrop-blur-sm mt-auto transition-colors duration-700"
            style={{
              borderColor: `rgba(${mc.accentRgb},0.08)`,
              backgroundColor: `rgba(${mc.accentRgb},0.03)`,
            }}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[9px] text-[#4a5a4a] tracking-wider">
                  {t.footerLeft}
                </div>
                <div className="font-mono text-[9px] text-[#4a5a4a] tracking-wider">
                  {t.footerRight}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </XFilesTheme>
  );
}
