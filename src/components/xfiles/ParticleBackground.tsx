"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/lib/game-store";
import { getAudioEngine, type GameMode } from "@/lib/audio-engine";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
  color: string;
}

const MODE_PARTICLES: Record<GameMode, { speed: number; density: number; color: string }> = {
  neutral: { speed: 0.15, density: 60, color: "rgba(251, 191, 36," },
  estudio: { speed: 0.08, density: 30, color: "rgba(60, 120, 255," },
  busqueda: { speed: 0.25, density: 80, color: "rgba(0, 255, 65," },
  descanso: { speed: 0.05, density: 40, color: "rgba(167, 139, 250," },
};

// Renaissance: sparse, warm, green+gold, low opacity
const RENAISSANCE_PARTICLES: Record<GameMode, { speed: number; density: number; colors: string[] }> = {
  neutral: { speed: 0.04, density: 25, colors: ["rgba(184,120,55,", "rgba(142,173,92,", "rgba(201,168,76,"] },
  // Concentración: partículas minerales frías, gris piedra, casi accidentales
  estudio: { speed: 0.02, density: 12, colors: ["rgba(109,135,157,", "rgba(115,125,138,", "rgba(130,140,155,"] },
  // Trabajo: más partículas verdes y doradas, mayor presencia atmosférica
  busqueda: { speed: 0.04, density: 42, colors: ["rgba(142,173,92,", "rgba(184,120,55,", "rgba(201,168,76,", "rgba(120,160,80,"] },
  // Descanso: púrpura y verdes, baja opacidad, sensación ambiental leve
  descanso: { speed: 0.02, density: 18, colors: ["rgba(154,166,107,", "rgba(124,148,96,", "rgba(96,122,70,", "rgba(100,90,120,"] },
};

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const currentModeRef = useRef<GameMode>("neutral");

  const currentMode = useGameStore((s) => s.currentMode);
  const aestheticTheme = useGameStore((s) => s.aestheticTheme);
  const isRenaissanceRef = useRef(false);

  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    isRenaissanceRef.current = aestheticTheme === "renaissance";
    // Re-init particles on theme change
    const canvas = canvasRef.current;
    if (canvas) initParticles(canvas);
  }, [aestheticTheme]);

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const isRenaissance = isRenaissanceRef.current;
    const config = isRenaissance
      ? RENAISSANCE_PARTICLES[currentModeRef.current]
      : MODE_PARTICLES[currentModeRef.current];
    const count = config.density;
    particlesRef.current = [];

    for (let i = 0; i < count; i++) {
      const baseOpacity = isRenaissance
        ? Math.random() * 0.2 + 0.05  // very low for renaissance
        : Math.random() * 0.5 + 0.2;
      const color = isRenaissance && 'colors' in config
        ? (config as { colors: string[] }).colors[Math.floor(Math.random() * (config as { colors: string[] }).colors.length)]
        : (config as { color: string }).color;
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -(Math.random() * config.speed + 0.02),
        radius: isRenaissance ? Math.random() * 1.2 + 0.3 : Math.random() * 1.5 + 0.5,
        opacity: baseOpacity,
        baseOpacity,
        color,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    initParticles(canvas);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    const animate = () => {
      const isRenaissance = isRenaissanceRef.current;
      const config = isRenaissance
        ? RENAISSANCE_PARTICLES[currentModeRef.current]
        : MODE_PARTICLES[currentModeRef.current];
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Update particle count if mode changed
      const targetCount = config.density;
      const current = particlesRef.current;

      if (current.length < targetCount) {
        const diff = targetCount - current.length;
        for (let i = 0; i < diff; i++) {
          const baseOpacity = isRenaissance
            ? Math.random() * 0.2 + 0.05
            : Math.random() * 0.5 + 0.2;
          const color = isRenaissance && 'colors' in config
            ? (config as { colors: string[] }).colors[Math.floor(Math.random() * (config as { colors: string[] }).colors.length)]
            : (config as { color: string }).color;
          current.push({
            x: Math.random() * w,
            y: h + Math.random() * 20,
            vx: (Math.random() - 0.5) * 0.1,
            vy: -(Math.random() * config.speed + 0.02),
            radius: isRenaissance ? Math.random() * 1.2 + 0.3 : Math.random() * 1.5 + 0.5,
            opacity: 0,
            baseOpacity,
            color,
          });
        }
      } else if (current.length > targetCount) {
        current.splice(targetCount);
      }

      for (const p of current) {
        // Update color for mode/theme changes
        if (isRenaissance && 'colors' in config) {
          // Keep existing particle color (set at creation)
        } else if (!isRenaissance) {
          p.color = (config as { color: string }).color;
        }

        // Mouse interaction — gentle push away
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100 * 0.2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy += -0.0003; // very slight upward drift
        p.vy = Math.min(p.vy, -(Math.random() * 0.003 + 0.01));

        p.x += p.vx;
        p.y += p.vy;

        // Fade in
        if (p.opacity < p.baseOpacity) {
          p.opacity = Math.min(p.opacity + 0.003, p.baseOpacity);
        }

        // Wrap around
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity})`;
        ctx.fill();

        // Subtle glow — very reduced for Renaissance
        if (!isRenaissance) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color} ${p.opacity * 0.15})`;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: aestheticTheme === "renaissance" ? 0.5 : 0.85 }}
    />
  );
}
