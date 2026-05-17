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

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const currentModeRef = useRef<GameMode>("neutral");

  const currentMode = useGameStore((s) => s.currentMode);

  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const config = MODE_PARTICLES[currentModeRef.current];
    const count = config.density;
    particlesRef.current = [];

    for (let i = 0; i < count; i++) {
      const baseOpacity = Math.random() * 0.5 + 0.2;
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * config.speed + 0.05),
        radius: Math.random() * 1.5 + 0.5,
        opacity: baseOpacity,
        baseOpacity,
        color: config.color,
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
      const config = MODE_PARTICLES[currentModeRef.current];
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Update particle count if mode changed
      const targetCount = config.density;
      const current = particlesRef.current;

      if (current.length < targetCount) {
        const diff = targetCount - current.length;
        for (let i = 0; i < diff; i++) {
          const baseOpacity = Math.random() * 0.5 + 0.2;
          current.push({
            x: Math.random() * w,
            y: h + Math.random() * 20,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -(Math.random() * config.speed + 0.1),
            radius: Math.random() * 1.5 + 0.5,
            opacity: 0,
            baseOpacity,
            color: config.color,
          });
        }
      } else if (current.length > targetCount) {
        current.splice(targetCount);
      }

      for (const p of current) {
        // Update color for mode changes
        p.color = config.color;

        // Mouse interaction — gentle push away
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100 * 0.3;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy += -0.0005; // slight upward drift
        p.vy = Math.min(p.vy, -(Math.random() * 0.005 + 0.02));

        p.x += p.vx;
        p.y += p.vy;

        // Fade in
        if (p.opacity < p.baseOpacity) {
          p.opacity = Math.min(p.opacity + 0.005, p.baseOpacity);
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

        // Subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity * 0.15})`;
        ctx.fill();
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
      style={{ opacity: 0.85 }}
    />
  );
}
