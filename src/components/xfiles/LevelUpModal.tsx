"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGameStore } from "@/lib/game-store";
import { getRank } from "@/lib/rank-system";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";

export default function LevelUpModal() {
  const { level, pendingNotifications, consumeNotification } = useGameStore();
  const mc = useModeColors();
  const t = useThemeText();
  const [visible, setVisible] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);
  const handledRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const levelUps = pendingNotifications.filter(
      (n) => n.type === "levelup" && !handledRef.current.has(n.id)
    );

    if (levelUps.length > 0) {
      const latest = levelUps[levelUps.length - 1];
      handledRef.current.add(latest.id);

      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setDisplayLevel(latest.value);
        setVisible(true);
      });

      // Auto dismiss after 4 seconds
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // Consume all level-up notifications
        levelUps.forEach((n) => consumeNotification(n.id));
      }, 4000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pendingNotifications, consumeNotification]);

  const rank = getRank(displayLevel, t.ranks);
  const prevRank = getRank(displayLevel - 1, t.ranks);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto"
          onClick={dismiss}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.8)]"
          />

          {/* Banner */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.8, opacity: 0, filter: "blur(5px)" }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
            className="relative z-10 xfiles-card rounded-lg p-8 max-w-sm w-full mx-4 text-center"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-[#6b8a6b] transition-colors cursor-pointer"
              style={{ color: undefined }}
              onMouseEnter={(e) => (e.currentTarget.style.color = mc.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Shield icon */}
            <motion.div
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            >
              <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: mc.accent }} />
            </motion.div>

            {/* Level up text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="font-mono text-[10px] text-[#6b8a6b] uppercase tracking-[0.3em] mb-1">
                {t.levelUpTitle}
              </div>
              <div className="font-mono text-4xl font-bold xfiles-text-glow mb-3" style={{ color: mc.accent }}>
                {displayLevel}
              </div>
            </motion.div>

            {/* Rank */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {prevRank.name !== rank.name ? (
                <>
                  <div className="font-mono text-[10px] text-[#6b8a6b] mb-1">
                    {t.newRankTitle}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-lg font-bold" style={{ color: mc.accent }}>
                      {rank.name}
                    </span>
                  </div>
                </>
              ) : (
                <div className="font-mono text-xs text-[#4ade80]">
                  {t.levelUpFlavor}
                </div>
              )}
            </motion.div>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-4 h-px bg-gradient-to-r from-transparent to-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, ${mc.accent}, transparent)` }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
