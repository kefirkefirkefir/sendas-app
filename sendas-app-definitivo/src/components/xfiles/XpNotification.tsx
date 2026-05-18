"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useModeColors } from "@/hooks/use-mode-colors";

interface FloatingNotification {
  id: string;
  type: "xp" | "coin" | "levelup";
  value: number;
  x: number;
  y: number;
}

export default function XpNotification() {
  const { pendingNotifications, consumeNotification } = useGameStore();
  const mc = useModeColors();
  const [floaters, setFloaters] = useState<FloatingNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNotifications = useCallback(() => {
    pendingNotifications.forEach((notif) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = rect.width / 2 - 40 + (Math.random() - 0.5) * 100;
      const y = 60 + Math.random() * 40;

      setFloaters((prev) => [
        ...prev,
        {
          id: notif.id,
          type: notif.type,
          value: notif.value,
          x,
          y,
        },
      ]);

      consumeNotification(notif.id);
    });
  }, [pendingNotifications, consumeNotification]);

  useEffect(() => {
    if (pendingNotifications.length > 0) {
      handleNotifications();
    }
  }, [pendingNotifications, handleNotifications]);

  const removeFloater = (id: string) => {
    setFloaters((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50">
      {/* Green flash overlay */}
      <AnimatePresence>
        {floaters.some((f) => f.type === "levelup") && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{ backgroundColor: mc.accent }}
          />
        )}
      </AnimatePresence>

      {/* Floating notifications */}
      <AnimatePresence>
        {floaters.map((floater) => (
          <motion.div
            key={floater.id}
            initial={{ opacity: 1, y: floater.y, scale: 1 }}
            animate={{ opacity: 0, y: floater.y - 80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            onAnimationComplete={() => removeFloater(floater.id)}
            className="absolute font-mono text-sm font-bold"
            style={{
              left: floater.x,
              top: floater.y,
              color:
                floater.type === "xp"
                  ? mc.accent
                  : floater.type === "coin"
                  ? "#fbbf24"
                  : mc.accent,
              textShadow:
                floater.type === "levelup"
                  ? `0 0 20px rgba(${mc.accentRgb},0.8), 0 0 40px rgba(${mc.accentRgb},0.4)`
                  : `0 0 8px rgba(${mc.accentRgb},0.5)`,
              fontSize: floater.type === "levelup" ? "18px" : "14px",
            }}
          >
            {floater.type === "xp" && `+${floater.value} XP`}
            {floater.type === "coin" && <span className="inline-flex items-center gap-0.5">+{floater.value} <Coins className="w-3 h-3" /></span>}
            {floater.type === "levelup" && `⬆ NIVEL ${floater.value}`}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
